import EventEmitter from "events";

import * as admin from "firebase-admin";

import {DocumentData, FirestoreCollection, FirestoreDocument} from "../internal";
import {FDUnionArray} from "./FDUnionArray";

/**
 * FDArrayTracker class for Flashstore Library
 * https://github.com/phamngocduy98/node_flashstore_library
 */
export class FDArrayTracker<D extends DocumentData> extends EventEmitter.EventEmitter {
    private _currentIdList?: string[];
    private _documents: FDUnionArray<FirestoreDocument<D>>;

    constructor(
        private collection: FirestoreCollection<D>,
        private parent: FirestoreDocument<any>,
        private arrayName: string
    ) {
        super();
        this._documents = new FDUnionArray();
        this._documents._attachTracker(this);
    }

    add(...docs: FirestoreDocument<D>[]) {
        const refs = docs.map((doc) => doc.ref);
        return this.parent.ref.update({[this.arrayName]: admin.firestore.FieldValue.arrayUnion(...refs)});
    }

    delete(...docs: FirestoreDocument<D>[]) {
        const refs = docs.map((doc) => doc.ref);
        return this.parent.ref.update({[this.arrayName]: admin.firestore.FieldValue.arrayRemove(...refs)});
    }

    async deleteAt(index: number) {
        if (index < 0 || index > this._documents.length) throw Error("Index out of bound");
        if (this._currentIdList === undefined) await this.parent.get();
        return this.delete(this._documents[index]);
    }

    getAt(index: number): FirestoreDocument<D> {
        if (index < 0 || index > this._documents.length) throw Error("Index out of bound");
        if (this._currentIdList === undefined)
            throw Error("Please get() the parent document before use linked docRef array");
        return this._documents[index];
    }

    getDataAt(index: number, forceRefresh: boolean = true): Promise<D | null> {
        return this.getAt(index).get(forceRefresh);
    }

    getArray(): FirestoreDocument<D>[] {
        return this._documents;
    }

    getArrayData(forceRefresh: boolean = true): Promise<Array<D | null>> {
        return Promise.all(this._documents.map((doc) => doc.get(forceRefresh)));
    }

    _updateIdList(docIds: string[]): any {
        for (let i = 0; i < docIds.length; i++) {
            this._documents[i] = this.collection.document(docIds[i]);
        }
        this._documents.length = docIds.length;
        let lastIdList = this._currentIdList;
        this._currentIdList = docIds;
        if (lastIdList === undefined) {
            // this.emit(Events.DATASET_CHANGED, this._documents);
            // this.emit(Events.ITEM_INSERTED, this._documents);
            return;
        }
        let added = [],
            removed = [];
        for (let id of docIds) if (lastIdList.indexOf(id) === -1) added.push(this.collection.document(id));
        for (let id of lastIdList) if (docIds.indexOf(id) === -1) removed.push(this.collection.document(id));
        if (added.length > 0) this.emit(Events.ITEM_INSERTED, added);
        if (removed.length > 0) this.emit(Events.ITEM_REMOVED, removed);
    }

    _updateRefList(docRefs: admin.firestore.DocumentReference[]): any {
        return this._updateIdList(docRefs.map((ref) => ref.id));
    }

    addOnArrayChangedListener(onArrayChangedListener: OnArrayChangedListener<D>) {
        this.on(Events.ITEM_INSERTED, onArrayChangedListener.onItemsInserted);
        this.on(Events.ITEM_REMOVED, onArrayChangedListener.onItemsRemoved);
    }

    removeOnArrayChangedListener(onArrayChangedListener: OnArrayChangedListener<D>) {
        this.off(Events.ITEM_INSERTED, onArrayChangedListener.onItemsInserted);
        this.off(Events.ITEM_REMOVED, onArrayChangedListener.onItemsRemoved);
    }
}

export enum Events {
    ITEM_INSERTED = "onItemInserted",
    // ITEM_CHANGED = "onItemChanged",
    ITEM_REMOVED = "onItemRemoved"
    // DATASET_CHANGED = "onDataSetChanged",
    // LIST_SIZE_CHANGED = "onListSizeChanged",
}

export class OnArrayChangedListener<D extends DocumentData> {
    onItemsInserted(docs: FirestoreDocument<D>[]) {}

    onItemsRemoved(docs: FirestoreDocument<D>[]) {}
}

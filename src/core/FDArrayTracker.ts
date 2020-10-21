import EventEmitter from "events";

import {firebase} from "../FirebaseImport";

import {DocumentData, FirestoreCollection, FirestoreDocument} from "../internal";
import {FDUnionArray} from "./FDUnionArray";

/**
 * FDArrayTracker class for Flashstore Library
 * https://github.com/phamngocduy98/npm-flashstore-core
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

    async refresh() {
        await this.parent.get();
        return this._documents;
    }

    getArray(): FirestoreDocument<D>[] {
        return this._documents;
    }

    async getArrayData(fromCache: boolean = false): Promise<Array<D | null>> {
        if (this._documents.length === 0) return [];
        const arrayCollection = this._documents[0].parentCollection;
        const tasks: FirestoreDocument<D>[][] = [];
        for (let i = 0; i <= this._documents.length / 10; i++) {
            tasks.push(this._documents.slice(i * 10, Math.min(this._documents.length, i * 10 + 10)));
        }
        this._documents.forEach((doc) => doc.clearCache());
        await Promise.all(
            tasks.map(async (docs, taskIndex) => {
                const ids = docs.map((doc) => doc.ref.id);
                const snaps = await arrayCollection.ref.where("_id", "in", [...ids]).get();
                snaps.docs.forEach((snap, docIndex) => {
                    const pos = taskIndex * 10 + docIndex;
                    if (snap.id === this._documents[pos].id) {
                        this._documents[pos]._onSnap(snap);
                    } else {
                        const foundPos = this._documents.indexOf(arrayCollection.document(snap.id));
                        console.warn(
                            "Unexpected position: expect: " +
                                pos +
                                ", found at " +
                                foundPos +
                                ". Your array may contain items that not exists"
                        );
                        if (foundPos !== -1) {
                            this._documents[foundPos]._onSnap(snap);
                        }
                    }
                });
            })
        );
        return this._documents.map((doc) => doc.getFromCache());
    }

    /**
     * Add documents to the array in database only (not local, call .get() to sync the changes after you've done all modifications)
     * @param docs documents to add to the array
     */
    add(...docs: FirestoreDocument<D>[]) {
        const refs = docs.map((doc) => doc.ref);
        return this.parent.ref.update({[this.arrayName]: firebase.firestore.FieldValue.arrayUnion(...refs)});
    }

    /**
     * Remove documents from the array in database only (not local, call .get() to sync the changes after you've done all modifications)
     * @param docs documents to remove from the array
     */
    delete(...docs: FirestoreDocument<D>[]) {
        const refs = docs.map((doc) => doc.ref);
        return this.parent.ref.update({[this.arrayName]: firebase.firestore.FieldValue.arrayRemove(...refs)});
    }

    _updateIdList(docIds: string[]): any {
        for (let i = 0; i < docIds.length; i++) {
            this._documents[i] = this.collection.document(docIds[i]);
        }
        this._documents.length = docIds.length;
        let lastIdList = this._currentIdList;
        this._currentIdList = docIds;
        if (lastIdList === undefined) {
            return;
        }
        let added = [],
            removed = [];
        for (let id of docIds) if (lastIdList.indexOf(id) === -1) added.push(this.collection.document(id));
        for (let id of lastIdList) if (docIds.indexOf(id) === -1) removed.push(this.collection.document(id));
        if (added.length > 0) this.emit(Events.ITEM_INSERTED, added);
        if (removed.length > 0) this.emit(Events.ITEM_REMOVED, removed);
    }

    _updateRefList(docRefs: firebase.firestore.DocumentReference[]): any {
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
    ITEM_REMOVED = "onItemRemoved"
}

export class OnArrayChangedListener<D extends DocumentData> {
    onItemsInserted(docs: FirestoreDocument<D>[]) {}

    onItemsRemoved(docs: FirestoreDocument<D>[]) {}
}

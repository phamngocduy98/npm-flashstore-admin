import * as admin from "firebase-admin";

import {
    Database,
    DocumentData,
    DocumentDataConstructor,
    FirestoreCollection,
    FirestoreDocumentArrayTracker,
    FirestoreDocumentTracker,
    getRegisteredLinkingItems,
    ICollectionParent,
    RealtimeFirestoreCollection
} from "../internal";

export type FirestoreDocumentConstructor<T extends FirestoreDocument<any>> = {new (...args: any): T};

/**
 * FirestoreDocument class for Flashstore Library
 * https://github.com/phamngocduy98/node_flashstore_library
 */
export class FirestoreDocument<D extends DocumentData> extends ICollectionParent {
    protected linkingDocArray: Map<string, FirestoreDocumentArrayTracker<any>>;
    protected linkingDoc: Map<string, FirestoreDocumentTracker<any>>;
    public _dataValue: D;
    protected isExists?: boolean;

    constructor(
        public root: Database,
        public parentCollection: FirestoreCollection<D> | RealtimeFirestoreCollection<D>,
        public ref: admin.firestore.DocumentReference,
        public dataConstructor: DocumentDataConstructor<D>,
        dataValue?: D
    ) {
        super(ref);
        this.linkingDocArray = new Map();
        this.linkingDoc = new Map();
        this._dataValue = dataValue ?? new dataConstructor();
        this._dataValue._id = ref.id;
        this.constructCollectionFrom(this._dataValue);
        let registeredLinkingItems = getRegisteredLinkingItems(this._dataValue);
        for (let linkingItem of registeredLinkingItems) {
            const sourceCollection = this.root.getSubCollection(linkingItem.collectionPathFromRoot)!;
            if (linkingItem.mode === "docRef[]") {
                // array Tracker is stored in parent FirebaseDocument
                let arrayTracker = new FirestoreDocumentArrayTracker(sourceCollection, this, linkingItem.propertyKey);
                this.linkingDocArray.set(linkingItem.propertyKey, arrayTracker);
                (this as any)[linkingItem.propertyKey] = arrayTracker;
                // value is stored as an array of FirebaseDocument at ref;
                (this._dataValue as any)[linkingItem.propertyKey] = arrayTracker.getArray();
            } else if (linkingItem.mode === "docRef") {
                // tracker is stored in parent FirebaseDocument
                let docTracker = new FirestoreDocumentTracker(sourceCollection, this, linkingItem.propertyKey);
                this.linkingDoc.set(linkingItem.propertyKey, docTracker);
                (this as any)[linkingItem.propertyKey] = docTracker;
                // value is stored as an array of FirebaseDocument at ref;
                (this._dataValue as any)[linkingItem.propertyKey] = docTracker.document();
            }
        }
    }

    get id() {
        return this.ref.id;
    }

    _onSnap(snap: admin.firestore.DocumentSnapshot) {
        this.isExists = snap.exists;
        let data = snap.data();
        if (!this.isExists || data === undefined) return null;
        if (!this._dataValue) this._dataValue = new this.dataConstructor();
        for (let key in data) {
            if (!this._dataValue.hasOwnProperty(key)) {
                console.error(`Property '${key} is missing in DocumentData of '` + this.dataConstructor.name);
            }
            if (
                this.linkingDocArray.has(key) &&
                Array.isArray(data[key]) &&
                (data[key].length === 0 || data[key][0] instanceof admin.firestore.DocumentReference)
            ) {
                this.linkingDocArray.get(key)!._updateRefList(data[key]);
            } else if (this.linkingDoc.has(key) && data[key] instanceof admin.firestore.DocumentReference) {
                this.linkingDoc.get(key)!._updateRef(data[key]);
            } else {
                this._dataValue[key as keyof D] = data[key];
            }
        }
    }

    linkedDocument(key: keyof D) {
        return this.linkingDoc.get(key as string);
    }

    linkedArray(key: keyof D) {
        return this.linkingDocArray.get(key as string);
    }

    /**
     * get a document
     * @param forceRefresh (default = true), if false, return cached document data from previous get()
     * @return null if document not exists
     */
    async get(forceRefresh: boolean = true): Promise<D | null> {
        if (!forceRefresh && this.isExists !== undefined) return this._dataValue;
        this._onSnap(await this.ref.get());
        return this._dataValue!;
    }

    set(documentData: D) {
        this._dataValue = documentData;
        return this.ref.set(documentData.toPureObject());
    }

    update(updateParams: {[K in keyof D]?: D[K] | admin.firestore.FieldValue}) {
        this.isExists = undefined; // cached data is outed-date after updated, recall get() for new value
        return this.ref.update(updateParams);
    }

    updateInBatch(
        batch: admin.firestore.WriteBatch,
        updateParams: {[K in keyof D]?: D[K] | admin.firestore.FieldValue}
    ) {
        this.isExists = undefined; // cached data is outed-date after updated, recall get() for new value
        return batch.update(this.ref, updateParams);
    }

    delete() {
        this.isExists = false;
        return this.ref.delete();
    }

    getRoot(): Database {
        return this.root;
    }
}

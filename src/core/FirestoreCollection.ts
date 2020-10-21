import {firebase} from "../FirebaseImport";
import EventEmitter from "events";

import {
    Database,
    DocumentData,
    DocumentDataConstructor,
    FirestoreDocument,
    ICollectionParent,
    RealtimeFirestoreDocument
} from "../internal";

/**
 * FirestoreCollection class for Flashstore Library
 * https://github.com/phamngocduy98/npm-flashstore-core
 */
export class FirestoreCollection<D extends DocumentData> extends EventEmitter.EventEmitter {
    ref: firebase.firestore.CollectionReference;
    protected _documents: Map<string, FirestoreDocument<D>>;

    constructor(
        public root: Database,
        public parent: ICollectionParent,
        public collectionName: string,
        public dataConstructor: DocumentDataConstructor<D>,
        public isRealtime: boolean = false
    ) {
        super();
        this.ref = parent.abstractRef.collection(collectionName);
        this._documents = new Map();
    }

    document(docId: string): FirestoreDocument<D> {
        let doc = this._documents.get(docId);
        if (doc !== undefined) {
            return doc;
        } else {
            let newDoc = this.isRealtime
                ? new RealtimeFirestoreDocument(this.root, this, this.ref.doc(docId), this.dataConstructor)
                : new FirestoreDocument(this.root, this, this.ref.doc(docId), this.dataConstructor);
            this._documents.set(docId, newDoc);
            return newDoc;
        }
    }

    async get() {
        return this.query((ref) => ref);
    }

    async query(queryMaker: (ref: firebase.firestore.CollectionReference) => firebase.firestore.Query): Promise<D[]> {
        let query = queryMaker(this.ref);
        let querySnap = await query.get();
        let docsData = [];
        for (let snap of querySnap.docs) {
            docsData.push(snap.data() as D);
            const doc = this._documents.get(snap.id);
            if (doc) doc._onSnap(snap);
        }
        return docsData;
    }

    async create(docId: string | undefined, doc: D) {
        let newDocRef = docId ? this.ref.doc(docId) : this.ref.doc();
        doc._id = newDocRef.id;
        await newDocRef.set(DocumentData.toFirestoreUpdatableObject(doc));
        return this.document(newDocRef.id);
    }

    createInBatch(batch: firebase.firestore.WriteBatch, docId: string | undefined, doc: D) {
        let newDocRef = docId ? this.ref.doc(docId) : this.ref.doc();
        batch.set(newDocRef, DocumentData.toFirestoreUpdatableObject(doc));
        return newDocRef;
    }

    async delete(docId: string) {
        const doc = this._documents.get(docId);
        return doc ? doc.delete() : this.ref.doc(docId).delete();
    }

    async batchDelete(docRefs: firebase.firestore.DocumentReference[]) {
        const batch = this.ref.firestore.batch();
        docRefs.forEach((docRef) => {
            batch.delete(docRef);
        });
        await batch.commit();
    }

    /**
     * @deprecated
     * clearCollection delete all document in this collection
     * ALLOWED FIRESTORE DELETE OPERATION PER MINUTE IS SO LIMITED (really small to over quota easily)
     * @param resolve when the action is completed
     */
    async clearCollection(resolve: () => any) {
        const snapshot = await this.ref.get();
        const batchSize = snapshot.size;
        if (batchSize === 0) {
            resolve();
        }
        await this.batchDelete(snapshot.docs.map((doc) => doc.ref));

        // Recurse on the next process tick, to avoid exploding the stack.
        process.nextTick(() => {
            return this.clearCollection(resolve);
        });
    }
}

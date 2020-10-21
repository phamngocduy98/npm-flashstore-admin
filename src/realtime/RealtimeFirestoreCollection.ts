import {firebase} from "../FirebaseImport";

import {
    Database,
    DocumentChangedEvents,
    DocumentData,
    DocumentDataConstructor,
    FirestoreCollection,
    ICollectionParent,
    RealtimeFirestoreDocument
} from "../internal";

/**
 * RealtimeFirestoreCollection class for Flashstore Library
 * https://github.com/phamngocduy98/npm-flashstore-core
 */
export class RealtimeFirestoreCollection<D extends DocumentData> extends FirestoreCollection<D> {
    cancelCollectionListener?: () => void;

    constructor(
        root: Database,
        parent: ICollectionParent,
        collectionName: string,
        dataConstructor: DocumentDataConstructor<D>
    ) {
        super(root, parent, collectionName, dataConstructor, true);
    }

    document(docId: string): RealtimeFirestoreDocument<D> {
        return super.document(docId) as RealtimeFirestoreDocument<D>;
    }

    get isListening() {
        return this.cancelCollectionListener !== undefined;
    }

    startListening(queryCreator: (ref: firebase.firestore.CollectionReference) => firebase.firestore.Query) {
        let query = queryCreator(this.ref);
        if (this.cancelCollectionListener !== undefined) this.cancelCollectionListener();
        this.cancelCollectionListener = query.onSnapshot(
            (querySnap) => {
                for (let docChange of querySnap.docChanges()) {
                    let queryDocSnap = docChange.doc;
                    let cachedDocument = this._documents.get(queryDocSnap.id);
                    if (docChange.type === "removed" && cachedDocument !== undefined) {
                        this.emit(CollectionChangedEvents.DOCUMENT_REMOVED, cachedDocument);
                        cachedDocument.emit(DocumentChangedEvents.DOCUMENT_REMOVED, cachedDocument);
                        this._documents.delete(queryDocSnap.id);
                    } else {
                        let doc = this.document(queryDocSnap.id);
                        doc._onSnap(queryDocSnap);
                        if (cachedDocument === undefined) {
                            this.emit(CollectionChangedEvents.DOCUMENT_ADDED, doc);
                        } else {
                            this.emit(CollectionChangedEvents.DOCUMENT_CHANGED, doc);
                            doc.emit(DocumentChangedEvents.VALUE_CHANGED, doc);
                        }
                    }
                }
            },
            async (error) => {
                this.stopListening();
            }
        );
    }

    stopListening() {
        if (this.cancelCollectionListener === undefined) throw Error("Collection is not listening");
        this.cancelCollectionListener();
        this.cancelCollectionListener = undefined;
    }

    addOnCollectionChangedListener(onCollectionChangedListener: OnCollectionChangedListener<D>) {
        this.on(CollectionChangedEvents.DOCUMENT_ADDED, onCollectionChangedListener.onDocumentAdded);
        this.on(CollectionChangedEvents.DOCUMENT_CHANGED, onCollectionChangedListener.onDocumentModified);
        this.on(CollectionChangedEvents.DOCUMENT_REMOVED, onCollectionChangedListener.onDocumentRemoved);
    }

    removeOnCollectionChangedListener(onCollectionChangedListener: OnCollectionChangedListener<D>) {
        this.off(CollectionChangedEvents.DOCUMENT_ADDED, onCollectionChangedListener.onDocumentAdded);
        this.off(CollectionChangedEvents.DOCUMENT_CHANGED, onCollectionChangedListener.onDocumentModified);
        this.off(CollectionChangedEvents.DOCUMENT_REMOVED, onCollectionChangedListener.onDocumentRemoved);
    }
}

export enum CollectionChangedEvents {
    DOCUMENT_ADDED = "onDocumentAdded",
    DOCUMENT_CHANGED = "onDocumentModified",
    DOCUMENT_REMOVED = "onDocumentRemoved"
}

export class OnCollectionChangedListener<D extends DocumentData> {
    onDocumentAdded(doc: RealtimeFirestoreDocument<D>) {}

    onDocumentModified(doc: RealtimeFirestoreDocument<D>) {}

    onDocumentRemoved(doc: RealtimeFirestoreDocument<D>) {}
}

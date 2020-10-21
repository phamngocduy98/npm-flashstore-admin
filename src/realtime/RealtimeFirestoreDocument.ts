import {
    Database,
    DocumentData,
    DocumentDataConstructor,
    FirestoreCollection,
    FirestoreDocument,
    RealtimeFirestoreCollection
} from "../internal";

import {firebase} from "../FirebaseImport";

export type RealtimeDocumentConstructor<T extends RealtimeFirestoreDocument<any>> = {new (...args: any): T};

/**
 * RealtimeFirestoreDocument class for Flashstore Library
 * help make FirestoreDocument to listen realtime update from firestore
 * https://github.com/phamngocduy98/npm-flashstore-core
 */
export class RealtimeFirestoreDocument<D extends DocumentData> extends FirestoreDocument<D> {
    cancelListenerRegistration?: () => any;

    constructor(
        root: Database,
        parentCollection: FirestoreCollection<D> | RealtimeFirestoreCollection<D>,
        ref: firebase.firestore.DocumentReference,
        dataConstructor: DocumentDataConstructor<D>,
        dataValue?: D
    ) {
        super(root, parentCollection, ref, dataConstructor, dataValue);
    }

    async get(): Promise<D | null> {
        if (!this.isListening || this._exists === undefined) return super.get();
        return this._dataValue;
    }

    value() {
        return this._dataValue;
    }

    get isListening() {
        if (this.parentCollection instanceof RealtimeFirestoreCollection) {
            return this.parentCollection.isListening;
        }
        return this.cancelListenerRegistration !== undefined;
    }

    startListening() {
        if (this.isListening)
            throw Error(
                "FirestoreDocument is listening, please stopListening() previous listening task before create a new once"
            );
        this.cancelListenerRegistration = this.ref.onSnapshot(
            (snap) => {
                this._onSnap(snap);
                this.emit(DocumentChangedEvents.VALUE_CHANGED, this);
            },
            async (error) => {
                console.error(`Listening failed: ${error.message || String(error)}`);
                this.stopListening();
            }
        );
    }

    stopListening() {
        if (this.cancelListenerRegistration === undefined) {
            if (this.isListening)
                throw Error(
                    "FirestoreDocument can't stop listening itself because parentCollection is listening for it"
                );
            console.error("FirestoreDocument is not listening");
            return;
        }
        this.cancelListenerRegistration();
        this.cancelListenerRegistration = undefined;
    }

    addOnValueChangedListener(listener: OnValueChangedListener<any>) {
        this.on(DocumentChangedEvents.VALUE_CHANGED, listener.onValueChanged);
        this.on(DocumentChangedEvents.DOCUMENT_REMOVED, listener.onDocumentRemoved);
        listener.onValueChanged(this);
    }

    removeOnValueChangedListener(listener: OnValueChangedListener<any>) {
        this.off(DocumentChangedEvents.VALUE_CHANGED, listener.onValueChanged);
        this.off(DocumentChangedEvents.DOCUMENT_REMOVED, listener.onDocumentRemoved);
    }
}

export class OnValueChangedListener<D extends DocumentData> {
    onValueChanged(doc: RealtimeFirestoreDocument<D>): void {}

    onDocumentRemoved(doc: RealtimeFirestoreDocument<D>): void {}
}

export enum DocumentChangedEvents {
    VALUE_CHANGED = "onValueChanged",
    DOCUMENT_REMOVED = "onDocumentRemoved"
}

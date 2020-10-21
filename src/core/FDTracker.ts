import {firebase} from "../FirebaseImport";

import {DocumentData, FirestoreCollection, FirestoreDocument} from "../internal";

/**
 * DocumentReferenceTracker class for Flashstore Library
 * https://github.com/phamngocduy98/npm-flashstore-core
 */
export class FDTracker<D extends DocumentData> {
    private _document: FirestoreDocument<D> | null;

    constructor(
        private collection: FirestoreCollection<D>,
        private parent: FirestoreDocument<any>,
        private propertyName: string
    ) {
        this._document = null;
    }

    // TODO: any type
    _updateRef(ref: firebase.firestore.DocumentReference | null): any {
        if (ref === null) {
            return ((this.parent as any)[this.propertyName] = null);
        }
        this._document = this.collection.document(ref.id);
        (this.parent._dataValue as any)[this.propertyName] = this._document;
    }

    async set(doc: FirestoreDocument<D> | null) {
        await this.parent.update({[this.propertyName]: doc?.ref ?? null});
        this._updateRef(doc?.ref ?? null);
    }

    link(doc: FirestoreDocument<D>) {
        return this.set(doc);
    }

    unlink() {
        return this.set(null);
    }

    document() {
        return this._document;
    }

    async get(fromCache: boolean = false): Promise<D | null> {
        if (this._document === null) return null;
        return this._document.get(fromCache);
    }
}

import {firebase} from "../FirebaseImport";
import {
    Database,
    DocumentData,
    FirestoreCollection,
    getRegisteredCollections,
    RealtimeFirestoreCollection
} from "../internal";

import EventEmitter from "events";

interface IAbstractReference {
    collection(id: string): firebase.firestore.CollectionReference;
}

/**
 * ICollectionParent interface for Flashstore Library
 * https://github.com/phamngocduy98/npm-flashstore-core
 */
export abstract class ICollectionParent extends EventEmitter.EventEmitter {
    private collections: Map<string, FirestoreCollection<any>>;

    protected constructor(public abstractRef: IAbstractReference) {
        super();
        this.collections = new Map<string, FirestoreCollection<any>>();
        this.constructCollectionFrom(this);
    }

    constructCollectionFrom(source: any) {
        let collections = getRegisteredCollections(source);
        for (let collection of collections) {
            let collectionInstance = collection.isRealtime
                ? new RealtimeFirestoreCollection(
                      this.getRoot(),
                      this,
                      collection.collectionName,
                      collection.dataConstructor
                  )
                : new FirestoreCollection(this.getRoot(), this, collection.collectionName, collection.dataConstructor);
            (this as any)[collection.collectionInstancePropertyKey] = collectionInstance;
            this.registerCollection(collectionInstance);
        }
    }

    collection<D extends DocumentData>(collectionName: string): FirestoreCollection<D> {
        let collection = this.collections.get(collectionName);
        if (collection === undefined) throw Error("No collection registered with name = " + collectionName);
        return collection;
    }

    registerCollection(collection: FirestoreCollection<any>): void {
        this.collections.set(collection.collectionName, collection);
    }

    getSubCollection(path: string): FirestoreCollection<any> | undefined {
        const paths = path.split("/");
        if (paths.length % 2 === 0) return;
        const collection = this.collections.get(paths[0]);
        if (collection !== undefined) {
            return paths.length === 1
                ? collection
                : collection.document(paths[1]).getSubCollection(paths.slice(2).join("/"));
        }
        return undefined;
    }

    abstract getRoot(): Database;
}

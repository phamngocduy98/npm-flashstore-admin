/**
 * DocumentData class for Flashstore Library
 * https://github.com/phamngocduy98/npm-flashstore-core
 */
import {firebase, FirestoreDocument, UpdateParams} from "../internal";

export class DocumentData {
    public _id: string = "";
    static toFirestoreUpdatableObject<D extends DocumentData>(docData: UpdateParams<D>) {
        let pureObject = Object.assign({}, docData);
        // delete pureObject._id;
        for (let key in pureObject) {
            const objectAtKey = pureObject[key];
            if (objectAtKey instanceof FirestoreDocument) {
                (pureObject as any)[key] = ((objectAtKey as any) as FirestoreDocument<any>).ref;
            }
            if (
                Array.isArray(objectAtKey) &&
                (objectAtKey.length === 0 || objectAtKey[0] instanceof FirestoreDocument)
            ) {
                (pureObject as any)[key] = ((objectAtKey as any) as FirestoreDocument<any>[]).map((doc) => doc.ref);
            }
        }
        return pureObject;
    }
}

export type DocumentDataConstructor<T extends DocumentData> = {new (...args: any[]): T};

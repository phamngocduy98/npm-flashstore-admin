import admin from "firebase-admin";

export class DocumentReferenceArrays extends Array<admin.firestore.DocumentReference> {
    static includes(array: admin.firestore.DocumentReference[], searchElement: admin.firestore.DocumentReference): boolean {
        return array.find(element => element.isEqual(searchElement)) !== undefined;
    }
}
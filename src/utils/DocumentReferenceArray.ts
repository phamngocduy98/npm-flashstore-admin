import {firebase} from "../FirebaseImport";

export class DocumentReferenceArrays extends Array<firebase.firestore.DocumentReference> {
    static includes(
        array: firebase.firestore.DocumentReference[],
        searchElement: firebase.firestore.DocumentReference
    ): boolean {
        return array.find((element) => element.isEqual(searchElement)) !== undefined;
    }
}

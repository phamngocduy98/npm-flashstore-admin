import {DocumentData, FirestoreDocument, LinkFirestoreDocumentArray} from "../src/internal";
import {Collections} from "./CollectionNames";
import {Village} from "./Village";
import {FirestoreDocumentArray} from "../src/core/FirestoreDocumentArray";

export class User extends DocumentData {
    @LinkFirestoreDocumentArray(Collections.VILLAGES)
    villages!: FirestoreDocumentArray<FirestoreDocument<Village>>;

    constructor(public name: string, public avatarUrl: string) {
        super();
    }
}

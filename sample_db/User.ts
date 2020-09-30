import {DocumentData, FirestoreDocument, LinkFirestoreDocumentArray} from "../internal";
import {Collections} from "./CollectionNames";
import {Village} from "./Village";

export class User extends DocumentData {
    @LinkFirestoreDocumentArray(Collections.VILLAGES)
    villages: FirestoreDocument<Village>[];

    constructor(public name: string, public avatarUrl: string) {
        super();
        this.villages = [];
    }
}

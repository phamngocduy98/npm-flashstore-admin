import {DocumentData, FirestoreDocument, LinkFirestoreDocument} from "../internal";
import {Collections} from "./CollectionNames";
import {Village} from "./Village";

export class User extends DocumentData {
    @LinkFirestoreDocument(Collections.VILLAGES)
    village!: FirestoreDocument<Village> | null;

    constructor(public name: string, public avatarUrl: string, village?: FirestoreDocument<Village>) {
        super();
        this.village = village || null;
    }
}

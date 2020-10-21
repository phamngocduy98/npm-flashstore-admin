import {DocumentData, FirestoreDocument, RefFDocument, RefFDUnionArray, FDUnionArray} from "../src/internal";
import {Collections} from "./CollectionNames";
import {Village} from "./Village";

export class User extends DocumentData {
    @RefFDUnionArray(Collections.VILLAGES)
    villages: FDUnionArray<FirestoreDocument<Village>>;

    @RefFDocument(Collections.USERS)
    activeFriend: FirestoreDocument<User> | null;

    @RefFDUnionArray(Collections.USERS)
    friends: FDUnionArray<FirestoreDocument<User>>;

    constructor(public name: string, public avatarUrl: string, activeFriend?: FirestoreDocument<User>) {
        super();
        this.villages = new FDUnionArray<FirestoreDocument<Village>>();
        this.activeFriend = activeFriend ?? null;
        this.friends = new FDUnionArray<FirestoreDocument<User>>();
    }
}

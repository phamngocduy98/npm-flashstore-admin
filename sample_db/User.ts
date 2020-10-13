import {DocumentData, FirestoreDocument, RefFDUnionArray} from "../src/internal";
import {Collections} from "./CollectionNames";
import {Village} from "./Village";
import {FDUnionArray} from "../src/core/FDUnionArray";

export class User extends DocumentData {
    @RefFDUnionArray(Collections.VILLAGES)
    villages!: FDUnionArray<FirestoreDocument<Village>>;

    constructor(public name: string, public avatarUrl: string) {
        super();
    }
}

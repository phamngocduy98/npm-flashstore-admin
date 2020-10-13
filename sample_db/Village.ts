import {
    Collection,
    DocumentData,
    FirestoreCollection,
    FirestoreDocument,
    RefFDocument,
    RefFDUnionArray
} from "../src/internal";
import {Collections} from "./CollectionNames";
import {User} from "./User";
import {Well} from "./Well";
import {FDUnionArray} from "../src/core/FDUnionArray";

export class Village extends DocumentData {
    @RefFDocument(Collections.USERS)
    owner: FirestoreDocument<User>;

    @RefFDUnionArray(Collections.USERS)
    members: FDUnionArray<FirestoreDocument<User>>;

    @Collection(Well, Collections.WELLS)
    wells!: FirestoreCollection<Well>;

    constructor(public name: string, public description: string, owner: FirestoreDocument<User>) {
        super();
        this.owner = owner;
        this.members = new FDUnionArray(owner);
    }
}

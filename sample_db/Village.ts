import {
    Collection,
    DocumentData,
    FirestoreCollection,
    FirestoreDocument,
    LinkFirestoreDocument,
    LinkFirestoreDocumentArray
} from "../src/internal";
import {Collections} from "./CollectionNames";
import {User} from "./User";
import {Well} from "./Well";
import {FirestoreDocumentArray} from "../src/core/FirestoreDocumentArray";

export class Village extends DocumentData {
    @LinkFirestoreDocument(Collections.USERS)
    owner: FirestoreDocument<User>;

    @LinkFirestoreDocumentArray(Collections.USERS)
    members: FirestoreDocumentArray<FirestoreDocument<User>>;

    @Collection(Well, Collections.WELLS)
    wells!: FirestoreCollection<Well>;

    constructor(public name: string, public description: string, owner: FirestoreDocument<User>) {
        super();
        this.owner = owner;
        this.members = new FirestoreDocumentArray(owner);
    }
}

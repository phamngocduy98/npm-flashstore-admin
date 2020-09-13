import {
    Collection,
    DocumentData,
    FirestoreCollection,
    FirestoreDocument,
    LinkFirestoreDocument,
    LinkFirestoreDocumentArray
} from "../internal";
import {Collections} from "./CollectionNames";
import {User} from "./User";
import {Well} from "./Well";

export class Village extends DocumentData {
    @LinkFirestoreDocument(Collections.USERS)
    owner: FirestoreDocument<User>;

    @LinkFirestoreDocumentArray(Collections.USERS)
    members: FirestoreDocument<User>[];

    @Collection(Well, Collections.WELLS)
    wells!: FirestoreCollection<Well>;

    constructor(public name: string, public description: string, owner: FirestoreDocument<User>) {
        super();
        this.owner = owner;
        this.members = [owner];
    }
}

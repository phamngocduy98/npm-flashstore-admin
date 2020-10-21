import {Collection, Database, FirestoreCollection} from "../src/core/internal";
import {Collections} from "./CollectionNames";
import {User} from "./User";
import {Village} from "./Village";

export class TestDatabase extends Database {
    @Collection(User, Collections.USERS)
    public users!: FirestoreCollection<User>;

    @Collection(Village, Collections.VILLAGES)
    public villages!: FirestoreCollection<Village>;
}

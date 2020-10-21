import {firebase} from "./FirebaseImport";
import {ICollectionParent} from "./internal";

/**
 * Database class for Flashstore Library
 * https://github.com/phamngocduy98/npm-flashstore-core
 */
export class Database extends ICollectionParent {
    constructor(private db: firebase.firestore.Firestore) {
        super(db);
    }

    batch() {
        return this.db.batch();
    }

    getRoot(): Database {
        return this;
    }
}

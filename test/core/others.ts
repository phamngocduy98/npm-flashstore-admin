import "mocha";

import {FirestoreCollection} from "../../src/core/internal";
import {Village} from "../../sample_db/Village";
import {Collections} from "../../sample_db/CollectionNames";
import {Well} from "../../sample_db/Well";
import {db} from "../index";

describe("Others test", function () {
    this.timeout(10000);

    it("Subcollection", async () => {
        let userDoc = db.users.document("user_test");
        let villageDoc = await db.villages.create("test_village", new Village("test village", "alo", userDoc));
        let wellSubCollection: FirestoreCollection<Well> = villageDoc.collection(Collections.WELLS);
        await wellSubCollection.create(undefined, new Well("well 1"));
    });
});

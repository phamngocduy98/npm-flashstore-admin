import {expect} from "chai";
import {User} from "../../sample_db/User";
import {Village} from "../../sample_db/Village";
import {db} from "../index";


describe("FDArray tests", function () {
    this.timeout(10000);
    it("pushDB, popDB", async () => {
        let newUserData = new User("Test User", "test avatar");
        let userDoc = await db.users.create("user_test", newUserData);
        let userData = await userDoc.get();
        expect(userData).not.null;
        expect(userData!.villages, "villages").have.lengthOf(0);

        const villageDoc0 = db.villages.document("test_village0");
        const villageDoc1 = db.villages.document("test_village1");
        const village2 = new Village("test_village2", "desc2", userDoc);
        const villageDoc2 = await db.villages.create("test_village2", village2);
        const villageDoc3 = db.villages.document("test_village3");
        const villageDoc4 = db.villages.document("test_village4");

        // PUSH
        await userData!.villages.pushDB(villageDoc0, villageDoc1, villageDoc2, villageDoc3);
        // array now: 0,1,2,3
        expect(userData!.villages).equal(userDoc.linkedArray("villages")!.getArray());
        expect(userData!.villages).have.lengthOf(4);
        // to verify changes is updated on db
        await userDoc.get();
        expect(userData!.villages).have.lengthOf(4);
        expect(userData!.villages).includes(villageDoc0);
        expect(userData!.villages).includes(villageDoc1);
        expect(userData!.villages).includes(villageDoc2);
        expect(userData!.villages).includes(villageDoc3);

        // SPLICE
        await userData!.villages.spliceDB(1, 1);
        // array now: 0,2,3
        expect(userData!.villages).have.lengthOf(3);
        expect(userData!.villages[1]).equal(villageDoc2);
        // to verify changes is updated on db
        await userDoc.get();
        expect(userData!.villages).have.lengthOf(3);
        expect(userData!.villages).includes(villageDoc0);
        expect(userData!.villages).includes(villageDoc2);
        expect(userData!.villages).includes(villageDoc3);

        // POP
        const lastDoc = await userData!.villages.popDB();
        // array now: 0,2
        expect(userData!.villages).have.lengthOf(2);
        expect(lastDoc).equal(villageDoc3);
        // to verify changes is updated on db
        await userDoc.get();
        expect(userData!.villages).have.lengthOf(2);
        expect(userData!.villages).includes(villageDoc0);
        expect(userData!.villages).includes(villageDoc2);

        // SHIFT
        const firstDoc = await userData!.villages.shiftDB();
        // array now: 2
        expect(userData!.villages).have.lengthOf(1);
        expect(firstDoc).equal(villageDoc0);
        // to verify changes is updated on db
        await userDoc.get();
        expect(userData!.villages).have.lengthOf(1);
        expect(userData!.villages).includes(villageDoc2);

        // getAll
        const villages = await userData!.villages.getAll();
        expect(villages).have.lengthOf(1);
        expect(villages[0].name).equal(village2.name);
        expect(villages[0].owner).equal(village2.owner);
    });
});

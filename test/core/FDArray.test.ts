import {expect} from "chai";
import {User} from "../../sample_db/User";
import {Village} from "../../sample_db/Village";
import {db} from "../index";
import {FirestoreDocument} from "../../src";

describe("FDArray tests", function () {
    this.timeout(10000);
    const newUserData = new User("Test User", "test avatar");
    const villageDocs: FirestoreDocument<Village>[] = [];
    const villages: Village[] = [];
    let userDoc: FirestoreDocument<User>;
    let userData: User | null;
    beforeEach(async () => {
        userDoc = await db.users.create("user_test", newUserData);
        userData = await userDoc.get();
        for (let i = 0; i < 11; i++) {
            if (i % 4 === 0) {
                villageDocs[i] = db.villages.document("test_village" + i);
                continue;
            }
            villages[i] = new Village("test_village" + i, "desc" + i, userDoc);
            villageDocs[i] = await db.villages.create("test_village" + i, villages[i]);
        }
        expect(userData).not.null;
        expect(userData!.villages, "villages").have.lengthOf(0);
    });
    it("pushDB, popDB, spliceDB, shiftDB", async () => {
        // PUSH
        await userData!.villages.pushDB(...villageDocs);
        // array now: 0,1,2,3,4,5,6,7,8,9,10
        expect(userData!.villages).equal(userDoc.linkedArray("villages")!.getArray());
        expect(userData!.villages).have.lengthOf(11);
        // to verify changes is updated on db
        await userDoc.get();
        expect(userData!.villages).have.lengthOf(11);
        for (let i = 0; i < 11; i++) {
            expect(userData!.villages).includes(villageDocs[i]);
        }

        // getAll
        const villages = await userData!.villages.getAll();
        expect(villages).have.lengthOf(11);
        expect(villages[0]).null;
        expect(villages[4]).null;

        expect(villages[5]).not.null;
        expect(villages[5]!.name).equal(villages[5]!.name);
        expect(villages[5]!.owner).equal(villages[5]!.owner);

        expect(villages[8]).null;

        expect(villages[10]).not.null;
        expect(villages[10]!.name).equal(villages[10]!.name);
        expect(villages[10]!.owner).equal(villages[10]!.owner);

        // SPLICE
        await userData!.villages.spliceDB(1, 8);
        // array now: 0,9,10
        expect(userData!.villages).have.lengthOf(3);
        // to verify changes is updated on db
        await userDoc.get();
        expect(userData!.villages).have.lengthOf(3);
        expect(userData!.villages).includes(villageDocs[0]);
        expect(userData!.villages).includes(villageDocs[9]);
        expect(userData!.villages).includes(villageDocs[10]);

        // POP
        const lastDoc = await userData!.villages.popDB();
        // array now: 0,9
        expect(userData!.villages).have.lengthOf(2);
        expect(lastDoc).equal(villageDocs[10]);
        // to verify changes is updated on db
        await userDoc.get();
        expect(userData!.villages).have.lengthOf(2);
        expect(userData!.villages).includes(villageDocs[0]);
        expect(userData!.villages).includes(villageDocs[9]);

        // SHIFT
        const firstDoc = await userData!.villages.shiftDB();
        // array now: 9
        expect(userData!.villages).have.lengthOf(1);
        expect(firstDoc).equal(villageDocs[0]);
        // to verify changes is updated on db
        await userDoc.get();
        expect(userData!.villages).have.lengthOf(1);
        expect(userData!.villages).includes(villageDocs[9]);

        // delete
        await userData!.villages._tracker!.delete(villageDocs[9]);
        await userData!.villages._tracker!.refresh();
        expect(userData!.villages).have.lengthOf(0);
    });

    it("normal array operation", async () => {
        let newUserData = new User("Test User", "test avatar");
        let userDoc = await db.users.create("user_test", newUserData);
        let userData = await userDoc.get();
        expect(userData).not.null;
        const villages = userData!.villages;
        // WARNING: use push, pop, shift, splice will cause unexpected value in database while those method won't wait the operation to finish
        villages.push(...villageDocs);
        expect(villages).have.lengthOf(11);
        expect(villages.includes(villageDocs[0])).true;
        expect(villages.indexOf(villageDocs[0])).equal(0);
        expect(villages.pop()).equal(villageDocs[10]);
        expect(villages.indexOf(villageDocs[10])).equal(-1);
        expect(villages.includes(villageDocs[10])).false;
        expect(villages.length).equal(10);
        expect(villages.shift()).equal(villageDocs[0]);
        expect(villages.length).equal(9);
        expect(villages.splice(0, 9)).lengthOf(9);
        expect(villages.length).equal(0);
    });
});

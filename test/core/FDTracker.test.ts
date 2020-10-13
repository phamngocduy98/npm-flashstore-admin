import "mocha";
import {expect} from "chai";
import {User} from "../../sample_db/User";
import {Village} from "../../sample_db/Village";
import {db} from "../index";

describe("FDTracker tests", function () {
    this.timeout(10000);

    it("Linked document", async () => {
        let userDoc = db.users.document("user_test");
        let testVillageDoc = await db.villages.create("test_village", new Village("test village", "alo", userDoc));
        let ownerTracker = testVillageDoc.linkedDocument("owner");
        let village = await testVillageDoc.get();
        expect(village!.owner).to.equal(ownerTracker.document());
        let owner = await village!.owner.get();
        expect(owner).not.to.be.null;
        console.info(owner);
        expect(owner, "get linked user document: check property name").to.have.haveOwnProperty("name");
        expect(owner, "get linked user document: check property avatarUrl").to.have.haveOwnProperty("avatarUrl");
        // link owner to other user
        let user2Doc = await db.users.create("user_test2", new User("test user 2", "avatar 2"));
        await ownerTracker.link(user2Doc);
        village = await testVillageDoc.get(); // refresh data
        owner = await village!.owner.get();
        expect(owner?.name).to.equal("test user 2");
        expect(owner?.avatarUrl).to.equal("avatar 2");
        // unlink:
        await ownerTracker.unlink();
        village = await testVillageDoc.get(); // refresh data
        expect(village!.owner, "get linked user document: null").to.be.null;
    });
});

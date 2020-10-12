import {expect} from "chai";
import {OnArrayChangedListener} from "../../src";
import {Village} from "../../sample_db/Village";
import {db} from "../index";


describe("FDArrayTracker tests", function () {
    it("getAt", async () => {
        let userDoc = db.users.document("user_test");
        let villageDoc = await db.villages.create("test_village", new Village("test village", "alo", userDoc));
        // this test must be on top of any test that use village document
        expect(() => villageDoc.linkedArray("members").getAt(0)).throw(
            "Please get() the parent document before use linked docRef array"
        );
        let villageData = await villageDoc.get();
        expect(() => villageDoc.linkedArray("members").getAt(-1)).throw("Index out of bound");
        // access village.members[0]:
        let userAt0 = villageData!.members[0];
        let firstUser = villageDoc.linkedArray("members").getAt(0);
        expect(userAt0).equal(firstUser);
        let firstUserData = await firstUser.get();
        console.info(firstUserData);
        expect(firstUserData, "get first user document of room.users: check property name").have.haveOwnProperty(
            "name"
        );
        expect(firstUserData, "get first user document of room.users: check property avatarUrl").have.haveOwnProperty(
            "avatarUrl"
        );
    });

    it("Linked Document Array: onUserArrayChangedListener.onItemInserted", (done) => {
        let newlyAddedUserId = "newlyAdded";
        let testVillage = db.villages.document("test_village");
        let onUserArrayChangedListener = new OnArrayChangedListener();
        onUserArrayChangedListener.onItemsInserted = (inserted) => {
            expect(inserted, "inserted length").have.lengthOf(1);
            expect(inserted[0].ref.id, "inserted[0]").equal(newlyAddedUserId);
            done();
        };
        testVillage
            .linkedArray("members")
            .delete(db.users.document(newlyAddedUserId))
            .then(() => {
                return testVillage.get();
            })
            .then(() => {
                testVillage.linkedArray("members").addOnArrayChangedListener(onUserArrayChangedListener);
            })
            .then(() => {
                return testVillage.linkedArray("members").add(db.users.document(newlyAddedUserId));
            })
            .then(() => {
                return testVillage.get();
            })
            .catch((e) => {
                console.error(e);
                throw e;
            });
    });

    it("Linked Document Array: onUserArrayChangedListener.onItemRemoved", (done) => {
        let newlyAddedUserId = "newlyAdded";
        let testVillage = db.villages.document("test_village");
        let onUserArrayChangedListener = new OnArrayChangedListener();
        onUserArrayChangedListener.onItemsRemoved = (removed) => {
            expect(removed, "removed length").have.lengthOf(1);
            expect(removed[0].ref.id, "removed[0]").equal(newlyAddedUserId);
            done();
        };
        testVillage
            .linkedArray("members")
            .add(db.users.document(newlyAddedUserId))
            .then(() => {
                return testVillage.get();
            })
            .then(() => {
                testVillage.linkedArray("members").addOnArrayChangedListener(onUserArrayChangedListener);
            })
            .then(() => {
                return testVillage.linkedArray("members").delete(db.users.document(newlyAddedUserId));
            })
            .then(() => {
                return testVillage.get();
            })
            .catch((e) => {
                console.error(e);
                throw e;
            });
    });
});

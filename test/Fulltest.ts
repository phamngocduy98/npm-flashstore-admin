import "mocha";
import {expect} from "chai";
import * as admin from "firebase-admin";
import {config} from "dotenv";
import {resolve} from "path";

config({path: resolve(__dirname, "../.env")});

import {
    DocumentReferenceArrays,
    FirestoreCollection,
    FirestoreDocumentTracker,
    OnArrayChangedListener
} from "../internal";

import {TestDatabase} from "../sample_db/TestDatabase";
import {User} from "../sample_db/User";
import {Village} from "../sample_db/Village";
import {Collections} from "../sample_db/CollectionNames";
import {Well} from "../sample_db/Well";

admin.initializeApp({
    credential: admin.credential.cert({
        privateKey: process.env.FIREBASE_PRIVATE_KEY ?? "",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
        projectId: process.env.FIREBASE_PROJECT_ID ?? ""
    })
});
const db = new TestDatabase(admin.firestore());

describe("Flash store library test", function () {
    this.timeout(10000);

    it("DocumentReferenceArrays", () => {
        let ref1 = db.users.ref.doc("aaaa");
        let ref2 = db.users.ref.doc("bbbb");
        let ref3 = db.users.ref.doc("aaaa");
        expect(DocumentReferenceArrays.includes([ref1, ref2], ref3), "includes test").to.be.true;
        expect(DocumentReferenceArrays.includes([ref1, ref3], ref2), "includes test").to.be.false;
    });

    it("get not exists document", async () => {
        let userDoc = await db.users.document("~~~~");
        let userData = await userDoc.get();
        expect(userData).to.be.null;
    });

    it("create/get document", async () => {
        let newUserData = new User("test user", "");
        let userDoc = await db.users.create("user_test", newUserData);
        let userData = await userDoc.get();
        expect(userData).not.to.be.null;
        expect(userData!.name, "check document data : name").to.equal(newUserData.name);
        expect(userData!.avatarUrl, "check document data : avatarUrl").to.equal(newUserData.avatarUrl);
    });

    it("get collection documents", async () => {
        let usersData = await db.users.get();
        console.info(usersData);
        expect(usersData, "check result length").to.have.length.greaterThan(0);
        expect(usersData[0], "check result document data: check property name").to.have.haveOwnProperty("name");
    });

    it("check FirestoreDocument root and parent", async () => {
        let user = db.users.document("user_test");
        expect(user.parentCollection, "check FirestoreDocument#parentCollection property").to.equal(db.users);
        expect(user.root, "check FirestoreDocument#root property").to.equal(db);
    });

    it("Linked Document Array", async () => {
        let userDoc = db.users.document("user_test");
        let villageDoc = await db.villages.create("test_village", new Village("test village", "alo", userDoc));
        // this test must be on top of any test that use village document
        expect(() => villageDoc.linkedArray("members")!.getAt(0)).to.throw(
            "Please get() the parent document before use linked docRef array"
        );
        let villageData = await villageDoc.get();
        expect(() => villageDoc.linkedArray("members")!.getAt(-1)).to.throw("Index out of bound");
        // access village.members[0]:
        let userAt0 = villageData!.members[0];
        let firstUser = villageDoc.linkedArray("members")!.getAt(0);
        expect(userAt0).to.equal(firstUser);
        let firstUserData = await firstUser.get();
        console.info(firstUserData);
        expect(firstUserData, "get first user document of room.users: check property name").to.have.haveOwnProperty(
            "name"
        );
        expect(
            firstUserData,
            "get first user document of room.users: check property avatarUrl"
        ).to.have.haveOwnProperty("avatarUrl");
    });

    it("Linked Document Array: onUserArrayChangedListener.onItemInserted", (done) => {
        let newlyAddedUserId = "newlyAdded";
        let testVillage = db.villages.document("test_village");
        let onUserArrayChangedListener = new OnArrayChangedListener();
        onUserArrayChangedListener.onItemsInserted = (inserted) => {
            expect(inserted, "inserted length").to.have.lengthOf(1);
            expect(inserted[0].ref.id, "inserted[0]").to.equal(newlyAddedUserId);
            done();
        };
        testVillage
            .linkedArray("members")!
            .remove(db.users.document(newlyAddedUserId))
            .then(() => {
                return testVillage.get();
            })
            .then(() => {
                testVillage.linkedArray("members")!.addOnArrayChangedListener(onUserArrayChangedListener);
            })
            .then(() => {
                return testVillage.linkedArray("members")!.add(db.users.document(newlyAddedUserId));
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
            expect(removed, "removed length").to.have.lengthOf(1);
            expect(removed[0].ref.id, "removed[0]").to.equal(newlyAddedUserId);
            done();
        };
        testVillage
            .linkedArray("members")!
            .add(db.users.document(newlyAddedUserId))
            .then(() => {
                return testVillage.get();
            })
            .then(() => {
                testVillage.linkedArray("members")!.addOnArrayChangedListener(onUserArrayChangedListener);
            })
            .then(() => {
                return testVillage.linkedArray("members")!.remove(db.users.document(newlyAddedUserId));
            })
            .then(() => {
                return testVillage.get();
            })
            .catch((e) => {
                console.error(e);
                throw e;
            });
    });

    it("Linked document", async () => {
        let userDoc = db.users.document("user_test");
        let testVillageDoc = await db.villages.create("test_village", new Village("test village", "alo", userDoc));
        let ownerTracker: FirestoreDocumentTracker<User> = testVillageDoc.linkedDocument("owner")!;
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

    it("Subcollection", async () => {
        let userDoc = db.users.document("user_test");
        let villageDoc = await db.villages.create("test_village", new Village("test village", "alo", userDoc));
        let wellSubCollection: FirestoreCollection<Well> = villageDoc.collection(Collections.WELLS);
        await wellSubCollection.create(undefined, new Well("well 1"));
    });

    // after((done) => {
    //     db.users.clearCollection(() => {
    //         db.villages.clearCollection(done);
    //     });
    // });
});

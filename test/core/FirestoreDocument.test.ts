import {expect} from "chai";
import {User} from "../../sample_db/User";
import {db} from "../index";

describe("Firebase Document tests", function () {
    this.timeout(10000);
    it("check FirestoreDocument root and parent", async () => {
        let user = db.users.document("user_test");
        expect(user.parentCollection, "check FirestoreDocument#parentCollection property").to.equal(db.users);
        expect(user.root, "check FirestoreDocument#root property").to.equal(db);
    });
    it("get non-exist document", async () => {
        const userDoc = await db.users.document("~~~~");
        const userData = await userDoc.get();
        expect(userData).null;
    });

    it("create/get document", async () => {
        const originUserData = new User("CREATE", "create");
        const userDoc = await db.users.create("user_test", originUserData);
        const userData = await userDoc.get();
        expect(userData).not.null;
        expect(userData!.name).equal(originUserData.name);
        expect(userData!.avatarUrl).equal(originUserData.avatarUrl);
    });

    it("update document", async () => {
        const originUserData = new User("CREATE", "create");
        const userDoc = await db.users.create("user_test", originUserData);
        const updateUserData = new User("UPDATE", "update");
        await userDoc.update(updateUserData);
        let userData = await userDoc.get();

        expect(userData).not.null;
        expect(userData!.name).equal(updateUserData.name);
        expect(userData!.avatarUrl).equal(updateUserData.avatarUrl);

        await userDoc.update({name: "UPDATE_PARTIAL"});
        userData = await userDoc.get();
        expect(userData!.name).equal("UPDATE_PARTIAL");
    });

    it("set document", async () => {
        const newUserData = new User("SET", "set");
        const userDoc = await db.users.document("user_test");
        await userDoc.set(newUserData);
        const userData = await userDoc.get();
        expect(userData).not.null;
        expect(userData!.name).equal(newUserData.name);
        expect(userData!.avatarUrl).equal(newUserData.avatarUrl);
    });

    it("delete document", async () => {
        const originUserData = new User("CREATE", "create");
        const userDoc = await db.users.create("user_test", originUserData);
        await userDoc.delete();
        let userData = await userDoc.get();
        expect(userData).null;

        const newUserData = new User("SET", "set");
        await userDoc.set(newUserData);
        userData = await userDoc.get();
        expect(userData).not.null;
        expect(userData!.name).equal(newUserData.name);
        expect(userData!.avatarUrl).equal(newUserData.avatarUrl);
    });
});

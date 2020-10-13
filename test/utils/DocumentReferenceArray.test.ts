import {expect} from "chai";
import {db} from "../index";
import {DocumentReferenceArrays} from "../../src";

describe("Utils tests", function () {
    it("DocumentReferenceArrays", () => {
        let ref1 = db.users.ref.doc("aaaa");
        let ref2 = db.users.ref.doc("bbbb");
        let ref3 = db.users.ref.doc("aaaa");
        expect(DocumentReferenceArrays.includes([ref1, ref2], ref3), "includes test").to.be.true;
        expect(DocumentReferenceArrays.includes([ref1, ref3], ref2), "includes test").to.be.false;
    });
});

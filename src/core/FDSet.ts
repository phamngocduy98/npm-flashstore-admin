import {FirestoreDocument} from "./FirestoreDocument";
import {FDArrayTracker} from "./FDArrayTracker";

type DocumentDataTypeOf<T extends FirestoreDocument<any>> = T extends FirestoreDocument<infer D> ? D : never;

export class FDSet<T extends FirestoreDocument<any>> extends Set<T> {
    _tracker?: FDArrayTracker<DocumentDataTypeOf<T>>;
    constructor(values?: readonly T[] | null) {
        super(values);
    }
    _attachTracker(tracker: FDArrayTracker<DocumentDataTypeOf<T>>) {
        this._tracker = tracker;
    }
    add(value: T): this {
        const tracker = this._tracker;
        if (tracker == null) {
            console.error("FDSet: tracker not attached! Adding item to this Set won't update to the database");
            return super.add(value);
        }
        if (!Set.prototype.has.call(this, value)) {
            tracker.add(value).catch((e) => console.error(e));
        }
        return super.add(value);
    }

    async addDB(value: T): Promise<this> {
        const tracker = this._tracker;
        if (tracker == null) {
            throw Error("FDSet: tracker not attached! Adding item to this Set won't update to the database");
        }
        if (!Set.prototype.has.call(this, value)) {
            await tracker.add(value);
        }
        return super.add(value);
    }

    delete(value: T): boolean {
        const tracker = this._tracker;
        const success = super.delete(value);
        if (tracker == null) {
            console.error("FDSet: tracker not attached! Deleting item of this Set won't update to the database");
            return success;
        }
        if (success) {
            tracker.delete(value).catch((e) => console.error(e));
        }
        return success;
    }

    async deleteDB(value: T): Promise<boolean> {
        const tracker = this._tracker;
        if (tracker == null) {
            throw Error("FDSet: tracker not attached! Deleting item of this Set won't update to the database");
        }
        const success = super.delete(value);
        if (success) {
            await tracker.delete(value);
        }
        return success;
    }
}

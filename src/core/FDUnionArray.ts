import {FirestoreDocument} from "./FirestoreDocument";
import {FDArrayTracker} from "./FDArrayTracker";
import {arrayNullUndefinedFilter} from "../utils/miscellaneous";

type DocumentDataTypeOf<T extends FirestoreDocument<any>> = T extends FirestoreDocument<infer D> ? D : never;

export class FDUnionArray<T extends FirestoreDocument<any>> extends Array<T> {
    _tracker?: FDArrayTracker<DocumentDataTypeOf<T>>;
    constructor(...item: T[]) {
        super(...item);
    }
    _attachTracker(tracker: FDArrayTracker<DocumentDataTypeOf<T>>) {
        this._tracker = tracker;
    }
    push(...items: T[]): number {
        items = items.filter((item) => !Array.prototype.includes.call(this, item));
        const tracker = this._tracker;
        if (tracker) {
            tracker.add(...items).catch((e) => console.error(e));
        } else {
            console.error(
                "FirestoreDocumentUnionArray: tracker not attached! any operation won't cause any database updates"
            );
        }
        return super.push(...items);
    }

    /**
     * Appends new elements to an array, and returns the new length of the array.
     * @param items New elements of the Array.
     */
    async pushDB(...items: T[]): Promise<number> {
        const tracker = this._tracker;
        if (tracker == null)
            throw Error(
                "FirestoreDocumentUnionArray: tracker not attached! any operation won't cause any database updates"
            );
        items = items.filter((item) => !Array.prototype.includes.call(this, item));
        const newLength = super.push(...items);
        await tracker.add(...items);
        return newLength;
    }
    pop(): T | undefined {
        const popItem = super.pop();
        if (this._tracker == null)
            console.error(
                "FirestoreDocumentUnionArray: tracker not attached! any operation won't cause any database updates"
            );
        if (popItem != null && this._tracker) this._tracker.delete(popItem).catch((e) => console.error(e));
        return popItem;
    }

    /**
     * Removes the last element from an array and returns it.
     */
    async popDB(): Promise<T | undefined> {
        const popItem = super.pop();
        if (this._tracker == null)
            throw Error(
                "FirestoreDocumentUnionArray: tracker not attached! any operation won't cause any database updates"
            );
        if (popItem != null) await this._tracker.delete(popItem);
        return popItem;
    }

    splice(start: number, deleteCount?: number): T[] {
        const tracker = this._tracker;
        if (tracker != null) {
            const toDelete = Array.prototype.slice.call(this, start, deleteCount ? start + deleteCount : this.length);
            tracker.delete(...toDelete).catch((e) => console.error(e));
        } else {
            console.error(
                "FirestoreDocumentUnionArray: tracker not attached! any operation won't cause any database updates"
            );
        }
        return super.splice(start, deleteCount);
    }

    /**
     * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
     * @param start The zero-based location in the array from which to start removing elements.
     * @param deleteCount The number of elements to remove.
     */
    async spliceDB(start: number, deleteCount?: number): Promise<T[]> {
        const tracker = this._tracker;
        if (tracker == null)
            throw Error(
                "FirestoreDocumentUnionArray: tracker not attached! any operation won't cause any database updates"
            );
        const toDelete = Array.prototype.slice.call(this, start, deleteCount ? start + deleteCount : this.length);
        await tracker.delete(...toDelete);
        return super.splice(start, deleteCount);
    }

    shift(): T | undefined {
        const shiftItem = super.shift();
        if (this._tracker == null)
            console.error(
                "FirestoreDocumentUnionArray: tracker not attached! any operation won't cause any database updates"
            );
        if (shiftItem != null && this._tracker) this._tracker.delete(shiftItem).catch((e) => console.error(e));
        return shiftItem;
    }

    /**
     * Removes the first element from an array and returns it.
     */
    async shiftDB(): Promise<T | undefined> {
        const shiftItem = super.shift();
        if (this._tracker == null)
            throw Error(
                "FirestoreDocumentUnionArray: tracker not attached! any operation won't cause any database updates"
            );
        if (shiftItem != null) await this._tracker.delete(shiftItem);
        return shiftItem;
    }

    /** @deprecated **/
    sort(compareFn?: (a: T, b: T) => number): this {
        // do nothing, this can't be sorted
        return this;
    }

    /** @deprecated **/
    unshift(...items: T[]): number {
        throw Error("Firestore array can't unshift");
    }

    /**
     * Delete items of an array
     * @param items The elements to remove from the Array.
     */
    async delete(...items: T[]) {
        return this._tracker?.delete(...items);
    }

    /**
     * Get the data values of the array
     */
    async getAll(): Promise<DocumentDataTypeOf<T>[]> {
        if (this._tracker) {
            return (await this._tracker.getArrayData()).filter(arrayNullUndefinedFilter);
        }
        return [];
    }
}

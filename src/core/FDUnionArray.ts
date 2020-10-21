import {FirestoreDocument} from "./FirestoreDocument";
import {FDArrayTracker} from "./FDArrayTracker";

type DocumentDataTypeOf<T extends FirestoreDocument<any>> = T extends FirestoreDocument<infer D> ? D : never;

export class FDUnionArray<T extends FirestoreDocument<any>> extends Array<T> {
    _tracker?: FDArrayTracker<DocumentDataTypeOf<T>>;
    constructor(...item: T[]) {
        super(...item);
    }
    _attachTracker(tracker: FDArrayTracker<DocumentDataTypeOf<T>>) {
        this._tracker = tracker;
    }

    /**
     * @deprecated Please use pushDB instead.
     * @WARNING: use push, pop, shift, splice will cause unexpected value in database while those method won't wait the operation to finish. Use pushDB, popDB, shiftDB, spliceDB as alternative
     *
     * Appends new elements to an array, and returns the new length of the array.
     * @param items New elements of the Array.
     */
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

    /**
     * @deprecated Please use popDB instead
     * @WARNING: use push, pop, shift, splice will cause unexpected value in database while those method won't wait the operation to finish. Use pushDB, popDB, shiftDB, spliceDB as alternative
     *
     * Removes the last element from an array and returns it.
     */
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

    /**
     * @deprecated Please use spliceDB instead
     * @WARNING: use push, pop, shift, splice will cause unexpected value in database while those method won't wait the operation to finish. Use pushDB, popDB, shiftDB, spliceDB as alternative
     *
     * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
     * @param start The zero-based location in the array from which to start removing elements.
     * @param deleteCount The number of elements to remove.
     */
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

    /**
     * @deprecated Please use shiftDB instead
     * @WARNING: use push, pop, shift, splice will cause unexpected value in database while those method won't wait the operation to finish. Use pushDB, popDB, shiftDB, spliceDB as alternative
     *
     * Removes the first element from an array and returns it.
     */
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

    /**
     * @deprecated Array can't be sorted in database
     */
    sort(compareFn?: (a: T, b: T) => number): this {
        // do nothing, this can't be sorted
        return this;
    }

    /**
     * @deprecated Unable to insert at the start of the array in database
     */
    unshift(...items: T[]): number {
        throw Error("Firestore array can't unshift");
    }

    /**
     * Get the data values of the array
     */
    async getAll(): Promise<(DocumentDataTypeOf<T> | null)[]> {
        if (this._tracker) {
            return await this._tracker.getArrayData();
        }
        return [];
    }
}

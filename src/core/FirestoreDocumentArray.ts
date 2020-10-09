import {FirestoreDocument} from "./FirestoreDocument";
import {FirestoreDocumentArrayTracker} from "./FirestoreDocumentArrayTracker";
import {arrayNullUndefinedFilter} from "../utils/miscellaneous";

type DocumentDataTypeOf<T extends FirestoreDocument<any>> = T extends FirestoreDocument<infer D> ? D : never;

export class FirestoreDocumentArray<T extends FirestoreDocument<any>> extends Array<T> {
    tracker?: FirestoreDocumentArrayTracker<DocumentDataTypeOf<T>>;
    constructor(...item: T[]) {
        super(...item);
    }
    attachTracker(tracker: FirestoreDocumentArrayTracker<DocumentDataTypeOf<T>>) {
        this.tracker = tracker;
    }
    push(...items: T[]): number {
        items = items.filter((item) => !Array.prototype.includes.call(this, item));
        const tracker = this.tracker;
        if (tracker) {
            const promise = items.map((item) => tracker.add(item));
            Promise.all(promise).catch((e) => console.error(e));
        }
        return super.push(...items);
    }
    async pushDB(...items: T[]): Promise<number> {
        const tracker = this.tracker;
        if (tracker) {
            items = items.filter((item) => !Array.prototype.includes.call(this, item));
            const newLength = super.push(...items);
            const promise = items.map((item) => tracker.add(item));
            await Promise.all(promise);
            return newLength;
        }
        return this.push(...items);
    }
    pop(): T | undefined {
        const popItem = super.pop();
        if (popItem != null && this.tracker) this.tracker.remove(popItem).catch((e) => console.error(e));
        return popItem;
    }
    async popDB(): Promise<T | undefined> {
        const popItem = super.pop();
        if (popItem != null && this.tracker) await this.tracker.remove(popItem);
        return popItem;
    }

    splice(start: number, deleteCount?: number): T[] {
        const tracker = this.tracker;
        if (tracker) {
            const toDelete = Array.prototype.slice.call(this, start, deleteCount ? start + deleteCount : this.length);
            const promise = toDelete.map((item) => tracker.remove(item));
            Promise.all(promise).catch((e) => console.error(e));
        }
        return super.splice(start, deleteCount);
    }

    async spliceDB(start: number, deleteCount?: number): Promise<T[]> {
        const tracker = this.tracker;
        if (tracker) {
            const toDelete = Array.prototype.slice.call(this, start, deleteCount ? start + deleteCount : this.length);
            await Promise.all(toDelete.map((item) => tracker.remove(item)));
        }
        return super.splice(start, deleteCount);
    }

    shift(): T | undefined {
        const shiftItem = super.shift();
        if (shiftItem != null && this.tracker) this.tracker.remove(shiftItem).catch((e) => console.error(e));
        return shiftItem;
    }

    async shiftDB(): Promise<T | undefined> {
        const shiftItem = super.shift();
        if (shiftItem != null && this.tracker) await this.tracker.remove(shiftItem);
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

    async delete(item: T) {
        return this.tracker?.remove(item);
    }

    async getAll(): Promise<DocumentDataTypeOf<T>[]> {
        if (this.tracker) {
            return (await this.tracker.getArrayData()).filter(arrayNullUndefinedFilter);
        }
        return [];
    }
}

# FlashStore
![npm](https://img.shields.io/npm/v/@phamngocduy98/flashstore)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/phamngocduy98/node_flashstore_library/Coverage%20check)
[![codecov](https://codecov.io/gh/phamngocduy98/node_flashstore_library/branch/master/graph/badge.svg)](https://codecov.io/gh/phamngocduy98/node_flashstore_library)
![npm](https://img.shields.io/npm/dt/@phamngocduy98/flashstore)
![node-lts (scoped)](https://img.shields.io/node/v-lts/@phamngocduy98/flashstore)
![npm peer dependency version (scoped)](https://img.shields.io/npm/dependency-version/@phamngocduy98/flashstore/dev/typescript)
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/phamngocduy98/node_flashstore_library/firebase-admin)

A firebase firestore library that making it easier to CRUD data with typescript

```
npm i @phamngocduy98/flashstore
```

## How to use

### 1. Define document type class

Define properties of your document by extending `DocumentData` class

```typescript
import {DocumentData} from "@phamngocduy98/flashstore";

export class User extends DocumentData {
    constructor(public name: string, public avatarUrl: string) {
        super();
    }
}
```

### 2. Define collections:

For example, you have a root collection whose name is `users`

```typescript
import {Database, Collection, FirestoreCollection} from "@phamngocduy98/flashstore";
import {User} from ".";

export class MyDatabase extends Database {
    @Collection(User, "users")
    public users!: FirestoreCollection<User>;
}
```

`@Collection` decorator tells the library what is the type of collection's documents and its name.
If you don't define collection's name parameter like `@Collection(User)`, the library will use property's name by default.

Subcollection is supported too. If you have a subcollection `wells` inside a `Village` document, then your Village class should look like this:

```typescript
import {DocumentData, Collection, FirestoreCollection} from "@phamngocduy98/flashstore";
import {Well} from "./sample_db/Well";

export class Village extends DocumentData {
    @Collection(Well, "wells")
    public wells!: FirestoreCollection<Well>;
}
```

### 3. CRUD:

```typescript
import * as admin from "firebase-admin";
import {FirestoreDocument, FirestoreCollection} from "@phamngocduy98/flashstore";
import {User, MyDatabase} from ".";

admin.initializeApp();
const db = new MyDatabase(admin.firestore());
const userCollection: FirestoreCollection<User> = db.users;
const userDoc: FirestoreDocument<User> = userCollection.document("my_user_id");
// READ: (return null if document not exists)
const userData: User = await userDoc.get();
console.log(userData.name, userData.avatarUrl);
// UPDATE:
await userDoc.update({avatarUrl: "new avatar"});
// DELETE:
await userDoc.delete();
// SET: (overwrite current value or create)
userDoc.set({name: "new name", avatarUrl: "new avatar"});
// CREATE:
const newDocWithAutoCreatedId: FirestoreDocument<User> = await userCollection.create(undefined, new User());
const newDocWithSpecificId: FirestoreDocument<User> = await userCollection.create("new_user_id", new User());
// SUB COLLECTION:
const villageDoc = await db.villages.document("test_village");
const wellSubCollection: FirestoreCollection<Well> = villageDoc.collection("wells");
await wellSubCollection.create(undefined, new Well("well 1"));
```

---

### 4. Define a more complex database structure:

#### 4.1 Define a link to other Document

For example, you have a village entity which is created by a user.
To store the owner of the village, you may want an `owner` property to have type `User` instead of either `userId` string.

To solve this problem, you create an `owner` property to have type `FirestoreDocument<User>`.
Then add `@LinkFirestoreDocument` decorator which give collection path as the only parameter.

If the collection is on top (the root) of the database, just place its name as collection path.  
For now, it's not recommended to define a link to a sub-collection due to its complexification. If you really want to link to a subcollection, use the following syntax: `rootcollection/documentId/subcollection1`, for example: `posts/81snEQEFxByrZ7TjJJPJ/comments`. But remember that `documentId` in the path is static which make it useless.

The `owner` is stored as `DocumentReference` in firestore, while you can access it as a true document in Village instance.

```typescript
import {FirestoreDocument, LinkFirestoreDocument, DocumentData}  from "@phamngocduy98/flashstore";
import {User} from ".";

export class Village extends DocumentData {
    @LinkFirestoreDocument("users")
    owner: FirestoreDocument<User>;

    constructor(public name: string, public description: string, owner: FirestoreDocument<User>) {
        super();
        this.owner = owner;
    }
}
```

---

#### 4.2 CRUD linked document:

If you only want to read the document:

```typescript
import {FirestoreDocument from "@phamngocduy98/flashstore";
import {User, Village} from ".";

const villageDoc: FirestoreDocument<Village> = db.villages.document("village_id");
const villageData: Village = await villageDoc.get();

const ownerData: FirestoreDocument<User> = await village!.owner.get();
console.log(ownerData.name, ownerData.avatarUrl);
```

##### FDTracker

`FDTracker` help you get the linked document or change the link to another document.
`FDTracker` instance is created automatically in `FirestoreDocument`.
It can be get via `linkedDocument(propertyName)` method.

```typescript
import {FirestoreDocument, FDTracker} from "@phamngocduy98/flashstore";
import {User, Village} from ".";

const villageDoc: FirestoreDocument<Village> = db.villages.document("village_id");
const village: Village = await villageDoc.get(); // remember to get before interacting with any tracker
const villageOwnerTracker: FDTracker<User> = villageDoc.linkedDocument("owner")!;

// GET linked document:
const ownerDoc = villageOwnerTracker.document(); // equivalent to village!.owner
const owner = await villageOwnerTracker.get(); // or ownerDoc.get() or village!.owner.get()

// link to another Document (set owner to new document DocumentReference)
const userDoc: FirestoreDocument<User> = db.users.document("user_id");
villageOwnerTracker.link(userDoc); // or villageOwnerTracker.set(userDoc)

// unlink: (will set owner to null value)
villageOwnerTracker.unlink(); // or villageOwnerTracker.set(null)
```

---

#### 4.3 Define a link to an array of other Document

A village cannot only have owner :) It needs members which is an array of `User`.
The library supports array of document too. You can use `@LinkFirestoreDocumentArray` decorator the same as `@LinkFirestoreDocument`. The only difference is `members` is an array of `FirestoreDocument<User>` and is stored as an array of `DocumentReference` in firestore.

So, the completed Village class is shown bellow:

```typescript
import {DocumentData, FirestoreDocument, LinkFirestoreDocument, LinkFirestoreDocumentArray} from "@phamngocduy98/flashstore";
import {FDUnionArray} from "./FDUnionArray";
import {User} from ".";

export class Village extends DocumentData {
    @LinkFirestoreDocument("users")
    owner: FirestoreDocument<User>;
    @LinkFirestoreDocumentArray("users")
    members: FDUnionArray<FirestoreDocument<User>>;

    constructor(public name: string, public description: string, owner: FirestoreDocument<User>) {
        super();
        this.owner = owner;
        this.members = new FDUnionArray(owner);
    }
}
```

---

#### 4.4 CRUD linked document array:

If you only want to read the array:

```typescript
import {FirestoreDocument, FDArrayTracker} from "@phamngocduy98/flashstore";
import {User, Village} from ".";

const villageDoc: FirestoreDocument<Village> = db.villages.document("village_id");
const village: Village = await villageDoc.get();

// read linked document array:
const member0: FirestoreDocument<User> = await village!.members[0];
const member0Data: Village = await member0.get();
console.log(member0Data.name, member0Data.avatarUrl);
// get all array:
const villages: Village[] = await village!.members.getAll();
// push
const userDoc: FirestoreDocument<User> = db.users.document("user_id");
await village!.members.pushDB(userDoc);
// pop
const popDoc = await village!.members.popDB();
// splice
await village!.members.spliceDB(0, 1);
```

##### FDArrayTracker

`FDArrayTracker` help you interact with the array easily.
`FDArrayTracker` instance is created automatically in `FirestoreDocument`.
It can be get via `linkedArray(propertyName)` method.

```typescript
import {FirestoreDocument, FDArrayTracker} from "@phamngocduy98/flashstore";
import {User, Village} from ".";

const villageDoc: FirestoreDocument<Village> = db.villages.document("village_id");
await villageDoc.get(); // remember to get before interacting with any tracker
const villageMemberArrayTracker: FDArrayTracker<User> = villageDoc.linkedArray("member")!;

// CRUD DATA: add/getAt/delete/getArray/getArrayData/...
await villageMemberArrayTracker.add(userDoc);

// add listener
const listener = OnArrayChangedListener<User>();
listener.onItemsInserted = (docs: FirestoreDocument<User>[]) => {
    console.log(docs);
};
listener.onItemsRemoved = (docs: FirestoreDocument<User>[]) => {
    console.log(docs);
};
villageMemberArrayTracker.addOnArrayChangedListener(listener);
```

### 5. Realtime support

While realtime features of firestore costs your firestore read/write quota a lot, it's recommend to avoid using it. Realtime Database is a good choice too.

#### 5.1 Realtime Collection

Use `@RealtimeCollection` decorator instead of `@Collection` decorator to define a realtime collection. Realtime Collection document's data is kept in sync with firestore in realtime.  
You can add listeners to listen these changes too.

```typescript
import {OnCollectionChangedListener, RealtimeFirestoreDocument} from "@phamngocduy98/flashstore";

const listener = new OnCollectionChangedListener();
listener.onDocumentAdded = (doc: RealtimeFirestoreDocument<D>) => {
    console.log(doc.value());
};
listener.onDocumentModified = (doc: RealtimeFirestoreDocument<D>) => {
    console.log(doc.value());
};
listener.onDocumentRemoved = (doc: RealtimeFirestoreDocument<D>) => {
    console.log(doc.value());
};
db.anyRealtimeCollection.addOnCollectionChangedListener(listener);
```

#### 5.2 Realtime Document

`RealtimeFirestoreDocument` is created be `RealtimeFirestoreCollection. Its data is always up to date with the server in realtime. It support listener too.`

```typescript
import {OnValueChangedListener, RealtimeFirestoreDocument} from "@phamngocduy98/flashstore";

const anyRealtimeDocument: RealtimeFirestoreDocument<D> = db.anyRealtimeCollection.document("document_id");

const listener = new OnValueChangedListener<D>();
listener.onValueChanged = (doc: RealtimeFirestoreDocument<D>) => {
    console.log(doc.value());
};
listener.onDocumentRemoved = (doc: RealtimeFirestoreDocument<D>) => {
    console.log(doc.value());
};
anyRealtimeDocument.addOnValueChangedListener(listener);
```

### 6. Batch support

You may find some special methods like `createInBatch`, `updateInBatch`, ... beside common `create` and `update` methods.

```typescript
let batch = db.batch();
batch = userDoc.root.batch();
userDoc.updateInBatch(batch, {name: "new name"});
userDoc.updateInBatch(batch, {avatarUrl: "new avatar"});
await batch.commit();
```

### 7. Access parent and root:

In each document or collection, you can get its parent or root but I do not recommend you do so.

```typescript
let root: MyDatabase = userDoc.root;
let userCollection: FirestoreCollection<User> = userDoc.parentCollection;
```

### 8. A subcollection pattern:

You have a subcollection `actions` inside your `Game` document. You allow client app to freely create and update document in this `actions`.
When the time is up, you get all `Action` from `actions` subcollection as user input.
Then you have to delete all the documents in the `actions` subcollection to make sure next time you get, all `Action` is newly created.
Frequently create and delele documents is too expensive.

So there is a solution, you define a link to an array of `Action` document (eg: `activeActions`).
Then you can make a Firebase Cloud Function to listen create/update operations in `actions` collection and add DocumentReference of these to `activeActions` array.  
Note: `actions` collection should be root collection instead of subcollection to make sure `@LinkFirestoreDocumentArray` works :D (or there is an update soon to fix this)

Now what you need to reset is only `activeActions` field while you can sure that all `Action` in `activeAction` array are newly created documents.

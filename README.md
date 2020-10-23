# Flashstore admin
**WARNING: Flashstore is currently in early beta version which is under development, may cause unexpected behaviors and should only be used in personal project.**  
  
![npm](https://img.shields.io/npm/v/@phamngocduy98/flashstore-admin)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/phamngocduy98/npm-flashstore-admin/Coverage%20check)
[![codecov](https://codecov.io/gh/phamngocduy98/npm-flashstore-admin/branch/master/graph/badge.svg?token=IJ7YKI7PVJ)](https://codecov.io/gh/phamngocduy98/npm-flashstore-admin)
![npm](https://img.shields.io/npm/dt/@phamngocduy98/flashstore)
![npm](https://img.shields.io/npm/dt/@phamngocduy98/flashstore-admin)  
![npm peer dependency version](https://img.shields.io/npm/dependency-version/@phamngocduy98/flashstore-admin/peer/firebase-admin)
![npm peer dependency version (scoped)](https://img.shields.io/npm/dependency-version/@phamngocduy98/flashstore-admin/dev/typescript)
![node-lts (scoped)](https://img.shields.io/node/v-lts/@phamngocduy98/flashstore-admin)

A firebase firestore library that making it easier to CRUD data with typescript

```
npm i @phamngocduy98/flashstore-admin
```

## How to use

### 1. Define document data type

Define properties of your document by extending `DocumentData` class

```typescript
import {DocumentData} from "@phamngocduy98/flashstore-admin";

export class User extends DocumentData {
    constructor(public name: string, public avatarUrl: string) {
        super();
    }
}
```

### 2. Define collections:

Define your database by extending `Database` class. There you can define your collections using `@Collection` decorator:  
`@Collection(DocDataType: D extends DocumentData, collectionName?: string)`  
For example, you have a root collection whose name is `users`

```typescript
import {Database, Collection, FirestoreCollection} from "@phamngocduy98/flashstore-admin";
import {User} from ".";

export class MyDatabase extends Database {
    @Collection(User, "users")
    public users!: FirestoreCollection<User>;
}
```
If you don't define collection's name parameter like `@Collection(User)`, the library will use property's name by default.  
You can define sub-collection of a document too. If you have a subcollection `wells` inside a `Village` document, then your Village class should look like this:

```typescript
import {DocumentData, Collection, FirestoreCollection} from "@phamngocduy98/flashstore-admin";
import {Well} from "./sample_db/Well";

export class Village extends DocumentData {
    @Collection(Well, "wells")
    public wells!: FirestoreCollection<Well>;
}
```

### 3. CRUD:

Your need initialize your firebase app before using firestore:
```typescript
import * as admin from "firebase-admin";
import {FirestoreDocument, FirestoreCollection} from "@phamngocduy98/flashstore-admin";
import {User, MyDatabase} from ".";

admin.initializeApp();
const db = new MyDatabase(admin.firestore());
```

#### 3.1 CRUD a collection:
##### QUERY:
```typescript
const userCollection: FirestoreCollection<User> = db.users;
const users: User[] = await db.users.query((ref) => ref.where("name", "==", "Duy"));
````
##### CREATE:
```typescript
// return FirebaseDocument instance of newly create document
const newDocWithAutoCreatedId: FirestoreDocument<User> = await db.users.create(undefined, new User());
const newDocWithSpecificId: FirestoreDocument<User> = await db.users.create("new_user_id", new User());

// create in batch:
const batch = db.batch();
db.users.createInBatch(batch, "new_user_id", new User());
```
##### DELETE:
```typescript
await db.users.delete("new_user_id");
// delete in batch:
const batch = db.batch();
db.users.deleteInBatch(batch, "new_user_id");
```

#### 3.2 CRUD a document:
You need FirestoreDocument instance to read data or make changes to the document.
Get a document instance by ID: `Collection.document(docId)`
```typescript
const userCollection: FirestoreCollection<User> = db.users;
const userDoc: FirestoreDocument<User> = db.users.document("my_user_id");
```

Then you can read or modify to document as you want:
##### READ: 
```typescript
// (return null if document not exists)
const userData: User = await userDoc.get();
console.log(userData?.name, userData?.avatarUrl);
```
##### UPDATE:
```typescript
await userDoc.update({avatarUrl: "new avatar"});
```
##### DETELE:
```typescript
await userDoc.delete();
```
##### SET:
```typescript
// (set will overwrite current value or create a new document if the document not exist)
userDoc.set({name: "new name", avatarUrl: "new avatar"});
```
##### Access sub-collection:
```typescript
const villageDoc = await db.villages.document("test_village");
const wellSubCollection: FirestoreCollection<Well> = villageDoc.collection("wells");
// Then you can use all methods that is available for collection
await wellSubCollection.create(undefined, new Well("well 1"));
```
---

### 4. Using references.

#### 4.1 Define a document property reference to other Document
For example, you have a Village entity then your village have an owner which is a user. You need create an `owner` property with `@RefFDocument(collectionName: string)` decorator.  
```
@RefFDocument("users")
owner: FirestoreDocument<User>;
```
Then the `owner` property will be stored as `DocumentReference` in firestore, while you can access it as a true FirestoreDocument in Village instance.  
Make sure your collection name (eg. "users") should be root collection (not a sub-collection).



```typescript
export class Village extends DocumentData {
    @RefFDocument("users")
    owner: FirestoreDocument<User>;

    constructor(public name: string, public description: string, owner: FirestoreDocument<User>) {
        super();
        this.owner = owner;
    }
}
```

##### Read data of referenced document:
Read Village.owner document data:
```typescript
const villageDoc: FirestoreDocument<Village> = db.villages.document("village_id");
const villageData: Village = await villageDoc.get();

const ownerDoc: FirestoreDocument<User> = village!.owner;
const ownerData: User = await village!.owner.get();
console.log(ownerData?.name, ownerData?.avatarUrl);
```
##### Modify the referenced property
###### Change it to another document.
```typescript
const userDoc: FirestoreDocument<User> = db.users.document("user_id");
villageDoc.update({owner: userDoc});
```
###### Set it to null
Make sure you define it nullable in Village DocumentData like this `owner: FirestoreDocument<User> | null;`before set it to null:
```typescript
export class Village extends DocumentData {
    @RefFDocument("users")
    owner: FirestoreDocument<User> | null;
}
```
```typescript
villageDoc.update({owner: null});
```
---
#### 4.2 Define a document property reference to array of other Documents

Continue our story: a village entity cannot only have owner :) It needs members which is an array of `User`.
You can use `@RefFDUnionArray` decorator the same as `@RefFDocument`. The only difference is `members` is an array of `FirestoreDocument<User>` and is stored as an array of `DocumentReference` in firestore.
```
@RefFDUnionArray("users")
members: FDUnionArray<FirestoreDocument<User>>;
```
So, the completed Village class is:

```typescript
export class Village extends DocumentData {
    @RefFDocument("users")
    owner: FirestoreDocument<User>;
    @RefFDUnionArray("users")
    members: FDUnionArray<FirestoreDocument<User>>;

    constructor(public name: string, public description: string, owner: FirestoreDocument<User>) {
        super();
        this.owner = owner;
        this.members = new FDUnionArray(owner);
    }
}
```

##### CRUD referenced document array:

```typescript
const villageDoc: FirestoreDocument<Village> = db.villages.document("village_id");
const village: Village = await villageDoc.get(); // you must get() parent document before reading referenced document array
const members: FDUnionArray<FirestoreDocument<User>> = village!.members;
```
###### Get a document from array:
```typescript
const village: Village = await villageDoc.get(); // you must get() parent document before reading referenced document array
const member0: FirestoreDocument<User> = await village!.members[0];
const member0Data: Village = await member0.get();
console.log(member0Data.name, member0Data.avatarUrl);
```
###### Get all array
```typescript
const village: Village = await villageDoc.get(); // you must get() parent document before reading referenced document array
const villages: Village[] = await village.members.getAll();
```
###### push a element
```typescript
const userDoc: FirestoreDocument<User> = db.users.document("user_id");
await village.members.pushDB(userDoc);
```
###### pop the array
```typescript
const popDoc = await village.members.popDB();
```
###### Splice the array
```typescript
await village.members.spliceDB(0, 1);
```
###### Update the whole array
```typescript
const village1Doc: FirestoreDocument<Village> = db.villages.document("village_1_id");
const village2Doc: FirestoreDocument<Village> = db.villages.document("village_2_id");
await village.update({members: [village1Doc, village2Doc]});
```

You may want to explore (or not) `FDArrayTracker` that can be get via `FirestoreDocument.linkedArray(propertyName)`.

### 5. Realtime support

**WARNING: This is experiment feature.**  
While realtime features of firestore costs your firestore read/write quota a lot, it's recommend to avoid using it. Realtime Database is a good choice too.

#### 5.1 Realtime Collection

Use `@RealtimeCollection` decorator instead of `@Collection` decorator to define a realtime collection. Realtime Collection document's data is kept in sync with firestore in realtime.  
You can add listeners to listen these changes too.

```typescript
import {OnCollectionChangedListener, RealtimeFirestoreDocument} from "@phamngocduy98/flashstore-admin";

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

`RealtimeFirestoreDocument` is created be `RealtimeFirestoreCollection`. Its data is always up to date with the server in realtime. It support listener too.`

```typescript
import {OnValueChangedListener, RealtimeFirestoreDocument} from "@phamngocduy98/flashstore-admin";

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

##### Realtime Document with Referenced Document Array:
###### Listen for changes
You can attach listener to listen when a item is being added to or removed from array
```typescript
const listener = OnArrayChangedListener<User>();
listener.onItemsInserted = (docs: FirestoreDocument<User>[]) => {
    console.log(docs);
};
listener.onItemsRemoved = (docs: FirestoreDocument<User>[]) => {
    console.log(docs);
};
villageDoc.linkedArray("member").addOnArrayChangedListener(listener);
```

### 6. Batch support

```typescript
let batch = db.batch(); // or batch = anyDocument.root.batch();
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

**Reference to a sub-collection is NOT SUPPORTED in the current version of flashstore.  
Please wait for updates!**  

Pattern introduction:
- You want to allow clients to directly connect to firestore database.  
- For example, you allow clients to create their own document to a sub-collection. Then you want reset the sub-collection for new writes, so you need to delete each document in the sub-collection.  
- These delete operations cost a lot while after deletions, your sub-collection will be soon full of new documents.  
  
=> So there is a solution, you can create a referenced document array to take care of which document is new. Now you can access all new documents without reset the sub-collection.

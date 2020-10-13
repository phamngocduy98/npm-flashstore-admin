import {config} from "dotenv";
import {resolve} from "path";
import * as admin from "firebase-admin";
import {TestDatabase} from "../sample_db/TestDatabase";

config({path: resolve(__dirname, "../.env")});
admin.initializeApp({
    credential: admin.credential.cert({
        privateKey: process.env.FIREBASE_PRIVATE_KEY ?? "",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
        projectId: process.env.FIREBASE_PROJECT_ID ?? ""
    })
});
export const db = new TestDatabase(admin.firestore());

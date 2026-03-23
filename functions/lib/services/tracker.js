"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = exports.adminFirestore = void 0;
exports.getTrackerFirestore = getTrackerFirestore;
exports.getTrackerAuth = getTrackerAuth;
exports.getTrackerDatabase = getTrackerDatabase;
const admin = require("firebase-admin");
// Initialize the admin's own Firebase app (default)
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.adminFirestore = admin.firestore();
exports.adminAuth = admin.auth();
// Lazy-initialize Tracker connection (only when actually called)
let _trackerApp = null;
function getTrackerApp() {
    if (_trackerApp)
        return _trackerApp;
    const serviceAccountJson = process.env.TRACKER_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
        throw new Error("TRACKER_SERVICE_ACCOUNT environment variable is not set");
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    _trackerApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://tracking-app-f6ad7-default-rtdb.europe-west1.firebasedatabase.app",
    }, "tracker");
    return _trackerApp;
}
function getTrackerFirestore() {
    return getTrackerApp().firestore();
}
function getTrackerAuth() {
    return getTrackerApp().auth();
}
function getTrackerDatabase() {
    return getTrackerApp().database();
}
//# sourceMappingURL=tracker.js.map
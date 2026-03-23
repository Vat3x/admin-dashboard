import * as admin from "firebase-admin";

// Initialize the admin's own Firebase app (default)
if (!admin.apps.length) {
  admin.initializeApp();
}

export const adminFirestore = admin.firestore();
export const adminAuth = admin.auth();

// Lazy-initialize Tracker connection (only when actually called)
let _trackerApp: admin.app.App | null = null;

function getTrackerApp(): admin.app.App {
  if (_trackerApp) return _trackerApp;

  const serviceAccountJson = process.env.TRACKER_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error("TRACKER_SERVICE_ACCOUNT environment variable is not set");
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  _trackerApp = admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://tracking-app-f6ad7-default-rtdb.europe-west1.firebasedatabase.app",
    },
    "tracker"
  );
  return _trackerApp;
}

export function getTrackerFirestore(): admin.firestore.Firestore {
  return getTrackerApp().firestore();
}

export function getTrackerAuth(): admin.auth.Auth {
  return getTrackerApp().auth();
}

export function getTrackerDatabase(): admin.database.Database {
  return getTrackerApp().database();
}

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let app;
let db: any = null;
let auth: any = null;
let isRealFirebase = false;

// Check if config has been customized from its placeholder state
if (
  firebaseConfig &&
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== '' &&
  firebaseConfig.apiKey !== 'PLACEHOLDER_KEY'
) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    isRealFirebase = true;
  } catch (error) {
    console.warn('Firebase initialization failed. Falling back to sandbox mode:', error);
  }
} else {
  console.log('Firebase config is in placeholder state. Running in offline/sandbox mode with local persistence.');
}

export { db, auth, isRealFirebase };

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error Detailed: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Perform connection validation in background if Real Firebase is configured
if (isRealFirebase && db) {
  const testConnection = async () => {
    try {
      await getDocFromServer(doc(db, '_test_connection_', 'ping'));
    } catch (error: any) {
      if (error && error.message && error.message.includes('the client is offline')) {
        console.error('Please check your Firebase configuration or network status.');
      }
    }
  };
  testConnection();
}
export { isRealFirebase as isFirebaseAvailable };

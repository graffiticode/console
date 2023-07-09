import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import React from 'react'
import { FirebaseAppProvider, AuthProvider, FirestoreProvider, useFirebaseApp, useInitAuth } from 'reactfire';
import { apiFirebaseConfig } from '../lib/firebase';

function FirebaseComponents({ children }) {
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (process.env.NODE_ENV !== "production") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
  }

  return (
    <AuthProvider sdk={auth}>
      <FirestoreProvider sdk={firestore}>
        {children}
      </FirestoreProvider>
    </AuthProvider>
  );
}

export default function GraffiticodeFirebaseProvider({ children }) {
  return (
    <FirebaseAppProvider firebaseConfig={apiFirebaseConfig}>
      <FirebaseComponents>
        {children}
      </FirebaseComponents>
    </FirebaseAppProvider>
  );
}

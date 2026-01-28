import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from './types';
import RoomList from './components/RoomList';
import Login from './components/Login'; // Changed to default import
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          // Ensure the role is correctly typed. If 'role' in types.ts is a union of strings, this is fine.
          // If it's an enum, you might need a mapping.
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email!, ...userDoc.data() } as User);
        } else {
          // Handle case where user document doesn't exist in Firestore but Firebase auth has the user
          // This might mean creating a default user entry or prompting the user to complete profile.
          console.warn('User document not found in Firestore for:', firebaseUser.uid);
          setUser(null); // Or handle as appropriate
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Placeholder for a loading spinner or component
  if (loading) {
    return <div className="app-loading-container">Loading...</div>;
  }

  return (
    <div className="App">
      {user ? <RoomList user={user} /> : <Login onLogin={setUser} />}
    </div>
  );
}

export default App;
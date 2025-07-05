
import { collection, getDocs, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Room } from './types';

const initialRooms: Omit<Room, 'id'>[] = [
  { status: 'Sucia', reportedProblems: [] },
  { status: 'Sucia', reportedProblems: [] },
  { status: 'Sucia', reportedProblems: [] },
  { status: 'Limpia', reportedProblems: [] },
  { status: 'Limpia', reportedProblems: [] },
  { status: 'Ocupada', reportedProblems: [] },
  { status: 'Ocupada', reportedProblems: [] },
  { status: 'Sucia', reportedProblems: [{ id: 'problem_1', description: 'Grifo gotea', reportedBy: 'supervisor_id', reportedAt: Timestamp.now(), isResolved: false }] },
];

export const initializeRooms = async () => {
  const roomsCollection = collection(db, 'rooms');
  const roomsSnapshot = await getDocs(roomsCollection);

  if (roomsSnapshot.empty) {
    const batch = writeBatch(db);
    initialRooms.forEach((roomData, index) => {
      const roomNumber = (101 + index).toString();
      const roomRef = doc(roomsCollection, roomNumber);
      batch.set(roomRef, roomData);
    });
    await batch.commit();
    console.log('Initial rooms created.');
  }
};

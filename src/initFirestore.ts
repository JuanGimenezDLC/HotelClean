
import { collection, getDocs, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Room } from './types';

const initialRooms: Omit<Room, 'id'>[] = [
  // Habitaciones existentes
  { status: 'Sucia', reportedProblems: [] },
  { status: 'Sucia', reportedProblems: [] },
  { status: 'Sucia', reportedProblems: [] },
  { status: 'Limpia', reportedProblems: [] },
  { status: 'Limpia', reportedProblems: [] },
  { status: 'Ocupada', reportedProblems: [] },
  { status: 'Ocupada', reportedProblems: [] },
  { status: 'Sucia', reportedProblems: [{ id: 'problem_1', description: 'Grifo gotea', reportedBy: 'supervisor_id', reportedAt: Timestamp.now(), isResolved: false }] },
  // Zonas comunes
  { name: 'Recepción', type: 'common_area', status: 'Limpia', reportedProblems: [] },
  { name: 'Escaleras', type: 'common_area', status: 'Sucia', reportedProblems: [] },
  { name: 'Pasillos Planta 1', type: 'common_area', status: 'Limpia', reportedProblems: [] },
  { name: 'Pasillos Planta 2', type: 'common_area', status: 'Limpia', reportedProblems: [] },
  { name: 'Pasillos Planta 3', type: 'common_area', status: 'Sucia', reportedProblems: [] },
  { name: 'Zona Desayunos', type: 'common_area', status: 'Limpia', reportedProblems: [] },
  { name: 'Ventanas', type: 'common_area', status: 'Sucia', reportedProblems: [] },
  { name: 'Cocina', type: 'common_area', status: 'Limpia', reportedProblems: [] },
  { name: 'Cuartos de Baño', type: 'common_area', status: 'Sucia', reportedProblems: [] },
];

export const initializeRooms = async () => {
  console.log('Initializing rooms...');
  const roomsCollection = collection(db, 'rooms');
  const roomsSnapshot = await getDocs(roomsCollection);

  const existingDocIds = new Set<string>();
  roomsSnapshot.forEach(doc => {
    existingDocIds.add(doc.id);
  });

  const batch = writeBatch(db);
  let itemsAdded = 0;
  let currentRoomNumber = 101; // Start room numbering from 101

  // Process common areas first, to ensure their IDs are registered
  initialRooms.filter(item => item.type === 'common_area').forEach((commonAreaData) => {
    const docId = commonAreaData.name!;
    if (!existingDocIds.has(docId)) {
      const docRef = doc(roomsCollection, docId);
      batch.set(docRef, commonAreaData);
      existingDocIds.add(docId); // Mark as added
      itemsAdded++;
    }
  });

  // Process rooms, ensuring they get sequential IDs if they don't exist
  initialRooms.filter(item => !item.type || item.type !== 'common_area').forEach((roomData) => {
    let docId = currentRoomNumber.toString();
    // Find the next available room number if the current one is already taken
    while (existingDocIds.has(docId)) {
      currentRoomNumber++;
      docId = currentRoomNumber.toString();
    }
    
    // Add room data to batch if it's not already added
    if (!existingDocIds.has(docId)) {
      const docRef = doc(roomsCollection, docId);
      batch.set(docRef, roomData);
      existingDocIds.add(docId); // Mark as added
      itemsAdded++;
    }
    currentRoomNumber++; // Increment for the next potential room
  });


  if (itemsAdded > 0) {
    await batch.commit();
    console.log(`${itemsAdded} new initial items created.`);
  } else {
    console.log('All initial items already exist.');
  }
};

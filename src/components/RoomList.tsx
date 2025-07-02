import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../firebase';
import { Room, User } from '../types';
import ReportProblemModal from './ReportProblemModal';
import RecleanModal from './RecleanModal';
import LanguageSelector from './LanguageSelector';
import { ModernRoomCard } from './ModernRoomCard'; // Importamos la nueva tarjeta
import './ModernRoomCard.css'; // Y sus estilos

interface RoomListProps {
  user: User;
}

// Adaptamos el tipo de estado para que coincida con el de la nueva tarjeta
type ModernRoomStatus = 'clean' | 'dirty' | 'problem' | 'occupied' | 'reclean';

const RoomList: React.FC<RoomListProps> = ({ user }) => {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isRecleanModalOpen, setRecleanModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribeRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const roomsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomsData);
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as User));
      setUsers(usersData);
    });

    return () => {
      unsubscribeRooms();
      unsubscribeUsers();
    };
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  const getUserEmail = (uid: string) => {
    const foundUser = users.find((u) => u.uid === uid);
    return foundUser ? foundUser.email : 'Usuario desconocido';
  };

  const handleSetStatus = async (roomId: string, status: 'Limpia' | 'Sucia' | 'Ocupada') => {
    const roomRef = doc(db, 'rooms', roomId);
    const updateData: any = { status };

    if (status === 'Limpia') {
      updateData.lastCleanedBy = user.uid;
      updateData.lastCleanedAt = Timestamp.now();
      updateData.recleaningReason = ''; // Borra el motivo al limpiar
    }

    await updateDoc(roomRef, updateData);
  };

  const openReportModal = (room: Room) => {
    setSelectedRoom(room);
    setReportModalOpen(true);
  };

  const openRecleanModal = (room: Room) => {
    setSelectedRoom(room);
    setRecleanModalOpen(true);
  };

  // Esta función convierte el estado de Firestore al que espera ModernRoomCard
  const getModernStatus = (room: Room): ModernRoomStatus => {
    if (room.reportedProblems && room.reportedProblems.some(p => !p.isResolved)) {
      return 'problem';
    }
    if (room.recleaningReason) {
      return 'reclean';
    }
    switch (room.status) {
      case 'Limpia':
        return 'clean';
      case 'Sucia':
        return 'dirty';
      case 'Ocupada':
        return 'occupied';
      default:
        return 'dirty'; // Un estado por defecto
    }
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center my-4">
        <h1>{t('roomStatus.title')}</h1>
        <div className="d-flex align-items-center">
          <LanguageSelector />
          <div className="ml-3">
            <span className="mr-3" style={{ color: 'var(--text-color-primary)' }}>
              {t('roomStatus.connectedAs')} <strong>{user.email}</strong>
            </span>
            <button className="btn btn-outline-danger" onClick={handleLogout}>
              {t('roomStatus.logoutButton')}
            </button>
          </div>
        </div>
      </div>
      <div className="row">
        {rooms.map((room) => {
          const modernStatus = getModernStatus(room);
          const lastProblem = room.reportedProblems?.filter(p => !p.isResolved).slice(-1)[0];

          return (
            <div key={room.id} className="col-md-4 mb-4">
              <ModernRoomCard
                room={{
                  number: room.id,
                  status: modernStatus,
                  lastCleanedBy: room.lastCleanedBy ? getUserEmail(room.lastCleanedBy) : undefined,
                  lastCleanedAt: room.lastCleanedAt ? room.lastCleanedAt.toDate().toLocaleString() : undefined,
                  problemDescription: lastProblem?.description || room.recleaningReason,
                }}
                userRole={user.role}
                onStatusChange={(newStatus) => {
                  let firestoreStatus: 'Limpia' | 'Sucia' | 'Ocupada' = 'Sucia';
                  if (newStatus === 'clean') firestoreStatus = 'Limpia';
                  if (newStatus === 'dirty') firestoreStatus = 'Sucia';
                  if (newStatus === 'occupied') firestoreStatus = 'Ocupada';
                  handleSetStatus(room.id, firestoreStatus);
                }}
                onReportProblem={() => openReportModal(room)}
                onReclean={() => openRecleanModal(room)}
              />
            </div>
          );
        })}
      </div>
      {selectedRoom && (
        <>
          <ReportProblemModal
            isOpen={isReportModalOpen}
            onClose={() => setReportModalOpen(false)}
            room={selectedRoom}
            user={user}
          />
          <RecleanModal
            isOpen={isRecleanModalOpen}
            onClose={() => setRecleanModalOpen(false)}
            room={selectedRoom}
          />
        </>
      )}
    </div>
  );
};

export default RoomList;

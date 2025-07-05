import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../firebase';
import { Room, User } from '../types';
import ReportProblemModal from './ReportProblemModal';
import RecleanModal from './RecleanModal';
import LanguageSelector from './LanguageSelector';
import { ModernRoomCard } from './ModernRoomCard';
import './ModernRoomCard.css';
import './Header.css'; // Importar los nuevos estilos del encabezado

interface RoomListProps {
  user: User;
}

type ModernRoomStatus = 'clean' | 'dirty' | 'problem' | 'occupied' | 'reclean' | 'blocked';

const RoomList: React.FC<RoomListProps> = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isRecleanModalOpen, setRecleanModalOpen] = useState(false);

  const getInitialFilter = () => {
    switch (user.role) {
      case 'maintenance':
        return 'problem';
      case 'cleaner':
        return 'Sucia';
      case 'supervisor':
        return 'number';
      default:
        return 'status';
    }
  };

  const [filter, setFilter] = useState(getInitialFilter());

  useEffect(() => {
    const unsubscribeRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const roomsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Room));
      
      const filteredRooms = roomsData.filter(room => {
        const modernStatus = getModernStatus(room);
        switch (filter) {
          case 'Sucia':
            return modernStatus === 'dirty';
          case 'Limpia':
            return modernStatus === 'clean';
          case 'Ocupada':
            return modernStatus === 'occupied';
          case 'Bloqueada':
            return modernStatus === 'blocked';
          case 'problem':
            return modernStatus === 'problem';
          default:
            return true;
        }
      });

      const sortedRooms = filteredRooms.sort((a, b) => {
        if (filter === 'status') {
          const isADirty = a.status === 'Sucia';
          const isBDirty = b.status === 'Sucia';
          if (isADirty && !isBDirty) return -1;
          if (!isADirty && isBDirty) return 1;
        }
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      });

      setRooms(sortedRooms);
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as User));
      setUsers(usersData);
    });

    return () => {
      unsubscribeRooms();
      unsubscribeUsers();
    };
  }, [filter]);

  const handleLogout = () => {
    signOut(auth);
  };

  const getUserEmail = (uid: string) => {
    const foundUser = users.find((u) => u.uid === uid);
    return foundUser ? foundUser.email : 'Usuario desconocido';
  };

  const handleSetStatus = async (roomId: string, newBaseStatus: 'Limpia' | 'Sucia' | 'Ocupada') => {
    const roomRef = doc(db, 'rooms', roomId);
    const room = rooms.find((r) => r.id === roomId);

    if (room) {
      const isBlocked = room.status === 'Bloqueada';
      const updateData: any = {
        status: isBlocked ? 'Bloqueada' : newBaseStatus,
        baseStatus: newBaseStatus,
      };

      if (newBaseStatus === 'Limpia') {
        updateData.lastCleanedBy = user.uid;
        updateData.lastCleanedAt = Timestamp.now();
        updateData.recleaningReason = '';
      }

      await updateDoc(roomRef, updateData);
    }
  };

  const openReportModal = (room: Room) => {
    setSelectedRoom(room);
    setReportModalOpen(true);
  };

  const openRecleanModal = (room: Room) => {
    setSelectedRoom(room);
    setRecleanModalOpen(true);
  };
  
  const handleResolveProblem = async (roomId: string, problemId: string) => {
    const roomRef = doc(db, 'rooms', roomId);
    const room = rooms.find((r) => r.id === roomId);

    if (room && room.reportedProblems) {
      const updatedProblems = room.reportedProblems.map((p) =>
        p.id === problemId ? { ...p, isResolved: true } : p
      );
      await updateDoc(roomRef, { reportedProblems: updatedProblems });
    }
  };

  const handleToggleBlock = async (room: Room) => {
    const roomRef = doc(db, 'rooms', room.id);
    let newStatus: 'Limpia' | 'Sucia' | 'Ocupada' | 'Bloqueada';

    if (room.status === 'Bloqueada') {
      newStatus = room.baseStatus || 'Sucia';
    } else {
      newStatus = 'Bloqueada';
    }
    
    await updateDoc(roomRef, { status: newStatus });
  };

  const getBaseStatus = (room: Room): 'clean' | 'dirty' | 'occupied' => {
    if (room.baseStatus) {
      if (room.baseStatus === 'Limpia') return 'clean';
      if (room.baseStatus === 'Ocupada') return 'occupied';
      return 'dirty';
    }
    if (room.status === 'Limpia') return 'clean';
    if (room.status === 'Ocupada') return 'occupied';
    return 'dirty';
  };

  const getModernStatus = (room: Room): ModernRoomStatus => {
    if (room.status === 'Bloqueada') return 'blocked';
    if (room.reportedProblems && room.reportedProblems.some(p => !p.isResolved)) return 'problem';
    if (room.recleaningReason) return 'reclean';
    if (room.status === 'Limpia') return 'clean';
    if (room.status === 'Ocupada') return 'occupied';
    return 'dirty';
  };

  return (
    <>
      <header className="header-container">
        <h1 className="main-title">{t('roomStatus.title')}</h1>
        <div className="user-controls">
          <div className="user-info">
            {t('roomStatus.connectedAs')} <strong>{user.email}</strong>
          </div>
          <LanguageSelector currentLanguage={i18n.language} />
          <button className="logout-button" onClick={handleLogout}>
            {t('roomStatus.logoutButton')}
          </button>
        </div>
      </header>
      <div className="container">
        <div className="filter-container">
          <select 
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="status">{t('filters.all_status')}</option>
            <option value="number">{t('filters.all_number')}</option>
            <option value="Sucia">{t('filters.dirty_only')}</option>
            <option value="Limpia">{t('filters.clean_only')}</option>
            <option value="Ocupada">{t('filters.occupied_only')}</option>
            <option value="Bloqueada">{t('filters.blocked_only')}</option>
            <option value="problem">{t('filters.problem_only')}</option>
          </select>
        </div>

        <div className="row">
          {rooms.map((room) => {
            const modernStatus = getModernStatus(room);
            const baseStatus = getBaseStatus(room);
            const unresolvedProblems = room.reportedProblems?.filter(p => !p.isResolved) || [];
            const userRole = user.role;

            return (
              <div key={room.id} className="col-md-4 mb-4">
                <ModernRoomCard
                  t={t}
                  room={{
                    number: room.id,
                    status: modernStatus,
                    baseStatus: baseStatus,
                    lastCleanedBy: room.lastCleanedBy ? getUserEmail(room.lastCleanedBy) : undefined,
                    lastCleanedAt: room.lastCleanedAt ? room.lastCleanedAt.toDate().toLocaleString() : undefined,
                    problems: unresolvedProblems,
                    recleaningReason: room.recleaningReason,
                  }}
                  userRole={userRole}
                  onStatusChange={(newStatus) => {
                    let firestoreStatus: 'Limpia' | 'Sucia' | 'Ocupada' = 'Sucia';
                    if (newStatus === 'clean') firestoreStatus = 'Limpia';
                    if (newStatus === 'dirty') firestoreStatus = 'Sucia';
                    if (newStatus === 'occupied') firestoreStatus = 'Ocupada';
                    handleSetStatus(room.id, firestoreStatus);
                  }}
                  onReportProblem={() => openReportModal(room)}
                  onReclean={() => openRecleanModal(room)}
                  onResolveProblem={(problemId) => handleResolveProblem(room.id, problemId)}
                  onToggleBlock={() => handleToggleBlock(room)}
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
    </>
  );
};

export default RoomList;

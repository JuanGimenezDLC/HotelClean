import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../firebase';
import { Room, User } from '../types';
import ReportProblemModal from './ReportProblemModal';
import RecleanModal from './RecleanModal';
import LanguageSelector from './LanguageSelector';

interface RoomListProps {
  user: User;
}

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

  const handleSetStatus = async (roomId: string, status: Room['status']) => {
    const roomRef = doc(db, 'rooms', roomId);
    const updateData: any = { status };

    if (status === 'Limpia') {
      updateData.lastCleanedBy = user.uid;
      updateData.lastCleanedAt = Timestamp.now();
      updateData.recleaningReason = ''; // Borra el motivo al limpiar
    }

    await updateDoc(roomRef, updateData);
  };

  const handleResolveProblem = async (roomId: string, problemIndex: number) => {
    const roomRef = doc(db, 'rooms', roomId);
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      const updatedProblems = [...room.reportedProblems];
      updatedProblems[problemIndex].isResolved = true;
      await updateDoc(roomRef, { reportedProblems: updatedProblems });
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

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'Sucia':
        return 'danger';
      case 'Limpia':
        return 'success';
      case 'Ocupada':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const getBorderClass = (room: Room) => {
    if (room.reportedProblems.some(p => !p.isResolved)) {
      return 'border-purple';
    }
    if (room.recleaningReason) {
      return 'border-warning';
    }
    switch (room.status) {
      case 'Sucia':
        return 'border-danger';
      case 'Limpia':
        return 'border-success';
      case 'Ocupada':
        return 'border-primary';
      default:
        return 'border-secondary';
    }
  };

  const customStyles = {
    borderPurple: {
      borderColor: '#800080', // Lila/Morado
      borderWidth: '2px'
    }
  };

  const renderSupervisorActions = (room: Room) => {
    if (user.role !== 'supervisor') return null;

    return (
      <div className="mt-2">
        {room.status !== 'Limpia' && (
          <button className="btn btn-sm btn-success mr-2" onClick={() => handleSetStatus(room.id, 'Limpia')}>
            {t('roomCard.markCleanButton')}
          </button>
        )}
        {room.status !== 'Sucia' && (
          <button className="btn btn-sm btn-danger mr-2" onClick={() => handleSetStatus(room.id, 'Sucia')}>
            {t('roomCard.markDirtyButton')}
          </button>
        )}
        {room.status !== 'Ocupada' && (
          <button className="btn btn-sm btn-primary mr-2" onClick={() => handleSetStatus(room.id, 'Ocupada')}>
            {t('roomCard.markOccupiedButton')}
          </button>
        )}
        <button className="btn btn-sm btn-warning" onClick={() => openRecleanModal(room)}>
          {t('roomCard.recleanButton')}
        </button>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center my-4">
        <h1>{t('roomStatus.title')}</h1>
        <div className="d-flex align-items-center">
          <LanguageSelector />
          <div className="ml-3">
            <span className="mr-3">{t('roomStatus.connectedAs')} <strong>{user.email}</strong></span>
            <button className="btn btn-outline-danger" onClick={handleLogout}>
              {t('roomStatus.logoutButton')}
            </button>
          </div>
        </div>
      </div>
      <div className="row">
        {rooms.map((room) => {
          const borderClass = getBorderClass(room);
          const style = borderClass === 'border-purple' ? customStyles.borderPurple : {};

          return (
            <div key={room.id} className="col-md-4 mb-4">
              <div className={`card h-100 ${borderClass}`} style={style}>
                <div className="card-header">
                  {t('roomCard.room')} {room.id} - <span className={`text-${getStatusColor(room.status)}`}>{t(`states.${room.status}`)}</span>
                </div>
                <div className="card-body">
                  {room.status === 'Limpia' && room.lastCleanedAt && (
                    <div className="mb-2">
                      <p className="mb-0">
                        <strong>{t('roomCard.cleanedBy')}</strong> {getUserEmail(room.lastCleanedBy || '')}
                      </p>
                      <p className="mb-0">
                        <strong>{t('roomCard.cleanedAt')}</strong> {room.lastCleanedAt.toDate().toLocaleString()}
                      </p>
                    </div>
                  )}
                  {room.recleaningReason && <p className="text-warning"><strong>{t('roomCard.recleaningReason')}</strong> {room.recleaningReason}</p>}
                  {room.reportedProblems.length > 0 && (
                    <div>
                      <h5>{t('roomCard.reportedProblems')}</h5>
                      <ul>
                        {room.reportedProblems.map((problem, index) => (
                          <li key={index} className={problem.isResolved ? 'text-muted' : ''}>
                            {problem.description} {problem.isResolved && `(${t('roomCard.resolved')})`}
                            {(user.role === 'maintenance' || user.role === 'supervisor') && !problem.isResolved && (
                              <button
                                className="btn btn-sm btn-success ml-2"
                                onClick={() => handleResolveProblem(room.id, index)}
                              >
                                {t('roomCard.resolveButton')}
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="card-footer">
                  {(user.role === 'cleaner' || user.role === 'supervisor') && (
                    <button className="btn btn-warning mr-2" onClick={() => openReportModal(room)}>
                      {t('roomCard.reportProblemButton')}
                    </button>
                  )}
                  {user.role === 'cleaner' && room.status === 'Sucia' && (
                    <button className="btn btn-success" onClick={() => handleSetStatus(room.id, 'Limpia')}>
                      {t('roomCard.markCleanButton')}
                    </button>
                  )}
                  {renderSupervisorActions(room)}
                </div>
              </div>
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
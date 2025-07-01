
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Room, User } from '../types';
import ReportProblemModal from './ReportProblemModal';
import RecleanModal from './RecleanModal';

interface RoomListProps {
  user: User;
}

const RoomList: React.FC<RoomListProps> = ({ user }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isRecleanModalOpen, setRecleanModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const roomsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomsData);
    });

    return () => unsubscribe();
  }, []);

  const handleClean = async (roomId: string) => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      status: 'clean',
      lastCleanedBy: user.uid,
      lastCleanedAt: Timestamp.now(),
      recleaningReason: '',
    });
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
      case 'dirty':
        return 'danger';
      case 'clean':
        return 'success';
      case 'recleaning':
        return 'warning';
      case 'maintenance':
        return 'info';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container">
      <h1 className="my-4">Room Status</h1>
      <div className="row">
        {rooms.map((room) => (
          <div key={room.id} className="col-md-4 mb-4">
            <div className={`card h-100 border-${getStatusColor(room.status)}`}>
              <div className="card-header">
                Room {room.id} - <span className={`text-${getStatusColor(room.status)}`}>{room.status}</span>
              </div>
              <div className="card-body">
                {room.recleaningReason && <p className="text-warning">Motivo relimpieza: {room.recleaningReason}</p>}
                {room.reportedProblems.length > 0 && (
                  <div>
                    <h5>Problemas reportados:</h5>
                    <ul>
                      {room.reportedProblems.map((problem, index) => (
                        <li key={index} className={problem.isResolved ? 'text-muted' : ''}>
                          {problem.description} {problem.isResolved && '(Resuelto)'}
                          {user.role === 'maintenance' && !problem.isResolved && (
                            <button
                              className="btn btn-sm btn-success ml-2"
                              onClick={() => handleResolveProblem(room.id, index)}
                            >
                              Resolver
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="card-footer">
                {(user.role === 'cleaner' || user.role === 'supervisor') && room.status !== 'clean' && (
                  <button className="btn btn-success mr-2" onClick={() => handleClean(room.id)}>
                    Marcar como Limpia
                  </button>
                )}
                {(user.role === 'cleaner' || user.role === 'supervisor') && (
                  <button className="btn btn-warning mr-2" onClick={() => openReportModal(room)}>
                    Reportar Problema
                  </button>
                )}
                {user.role === 'supervisor' && (
                  <button className="btn btn-info" onClick={() => openRecleanModal(room)}>
                    Marcar para Relimpieza
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
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

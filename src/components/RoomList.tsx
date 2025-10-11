import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, updateDoc, Timestamp, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { db, auth, storage } from '../firebase';
import { Room, User } from '../types';
import ReportProblemModal from './ReportProblemModal';
import RecleanModal from './RecleanModal';
import CleanModal from './CleanModal';
import CheckModal from './CheckModal';
import WarningModal from './WarningModal';
import CleanConfirmationModal from './CleanConfirmationModal'; // Importar el nuevo modal
import LanguageSelector from './LanguageSelector';
import { ModernRoomCard, ModernRoom } from './ModernRoomCard';
import './ModernRoomCard.css';
import './Header.css'; // Importar los nuevos estilos del encabezado

interface RoomListProps {
  user: User;
}

type ModernRoomStatus = 'clean' | 'dirty' | 'problem' | 'occupied' | 'reclean' | 'blocked' | 'dirty_occupied' | 'limpiar';

const RoomList: React.FC<RoomListProps> = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isRecleanModalOpen, setRecleanModalOpen] = useState(false);
  const [isCleanModalOpen, setCleanModalOpen] = useState(false);
  const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isCheckModalOpen, setCheckModalOpen] = useState(false);
  const [isCheckInWarningModalOpen, setCheckInWarningModalOpen] = useState(false);
  const [animatingOutRoomId, setAnimatingOutRoomId] = useState<string | null>(null);

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

  // Usamos useRef para mantener referencias actualizadas de las dependencias
  // que cambian con frecuencia (user, filter), para evitar re-suscribirnos a 
  // Firebase innecesariamente y solucionar bugs de "closure".
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const filterRef = useRef(filter);
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  useEffect(() => {
    // Primero, nos suscribimos a los usuarios.
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as User));
      setUsers(usersData);

      // UNA VEZ que tenemos los usuarios, nos suscribimos a las habitaciones.
      // Esto evita condiciones de carrera donde las habitaciones se procesan antes de tener los datos de usuario.
      const unsubscribeRooms = onSnapshot(collection(db, 'rooms'), (roomSnapshot) => {
        const roomsData = roomSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Room));
        
        const filteredRooms = roomsData.filter(room => {
          const currentFilter = filterRef.current;
          const currentUser = userRef.current;
          const modernStatus = getModernStatus(room);
          const baseStatus = room.baseStatus || (room.status !== 'Bloqueada' ? room.status : 'Sucia');

          switch (currentFilter) {
            case 'Sucia':
              if (currentUser.role === 'cleaner') {
                return baseStatus === 'Sucia' || modernStatus === 'limpiar' || (modernStatus === 'reclean' && room.lastCleanedBy === currentUser.uid);
              } else {
                return baseStatus === 'Sucia' || modernStatus === 'reclean' || modernStatus === 'limpiar';
              }
            case 'Limpia':
              return baseStatus === 'Limpia';
            case 'Ocupada':
              return baseStatus === 'Ocupada';
            case 'Bloqueada':
              return modernStatus === 'blocked';
            case 'problem':
              return modernStatus === 'problem';
            default:
              return true;
          }
        });

        const sortedRooms = filteredRooms.sort((a, b) => {
          if (filterRef.current === 'status') {
            const isADirty = a.status === 'Sucia';
            const isBDirty = b.status === 'Sucia';
            if (isADirty && !isBDirty) return -1;
            if (!isADirty && isBDirty) return 1;
          }
          return a.id.localeCompare(b.id, undefined, { numeric: true });
        });

        setRooms(sortedRooms);
      });

      // Devolvemos la función para desuscribirnos de las habitaciones cuando el componente se desmonte.
      return () => unsubscribeRooms();
    });

    return () => {
      unsubscribeUsers();
    };
  }, []); // Las dependencias ahora están vacías, la suscripción se crea una sola vez.

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

    if (!room) return;

    const isBlocked = room.status === 'Bloqueada';
    const updateData: any = {
      status: isBlocked ? 'Bloqueada' : newBaseStatus,
      baseStatus: newBaseStatus,
    };

    if (newBaseStatus === 'Limpia') {
      updateData.lastCleanedBy = user.uid;
      updateData.lastCleanedAt = Timestamp.now();
      updateData.recleaningReason = deleteField();
      updateData.cleaningReason = deleteField();
    }

    // --- Lógica de Animación para Limpiadores ---
    if (user.role === 'cleaner' && newBaseStatus === 'Limpia') {
      // Animación desactivada temporalmente para depuración
      // setAnimatingOutRoomId(roomId);
      // setTimeout(() => {
      //   updateDoc(roomRef, updateData).then(() => {
      //     setRooms(prevRooms => prevRooms.filter(r => r.id !== roomId));
      //   });
      // }, 800);
      // return; // Termina la ejecución aquí para el limpiador
      
      // Comportamiento inmediato sin animación para depuración
      await updateDoc(roomRef, updateData);
      setRooms(prevRooms => prevRooms.filter(r => r.id !== roomId));
      return;
    }

    // --- Lógica de Actualización Inmediata para todos los demás casos ---
    await updateDoc(roomRef, updateData);
    // Actualización optimista para una UI reactiva
    setRooms(prevRooms => prevRooms.map(r => {
      if (r.id !== roomId) return r;
      const localUpdate = { ...updateData };
      // Reemplazamos los objetos de Firebase con valores válidos para el estado local
      if (localUpdate.recleaningReason && typeof localUpdate.recleaningReason === 'object') localUpdate.recleaningReason = undefined;
      if (localUpdate.cleaningReason && typeof localUpdate.cleaningReason === 'object') localUpdate.cleaningReason = undefined;
      if (localUpdate.baseStatus && typeof localUpdate.baseStatus === 'object') localUpdate.baseStatus = undefined;
      return { ...r, ...localUpdate };
    }));
  };

  const handleReclean = async (roomId: string, reason: string, file: File | null) => {
    const roomRef = doc(db, 'rooms', roomId);
    let imageUrl = '';

    if (file) {
      const storageRef = ref(storage, `reclean-images/${roomId}-${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    }

    await updateDoc(roomRef, {
      status: 'Sucia',
      baseStatus: 'Sucia',
      recleaningReason: reason,
      recleaningImageUrl: imageUrl || null,
    });

    // Actualización optimista
    setRooms(prevRooms =>
      prevRooms.map(r =>
        r.id === roomId
          ? { ...r, status: 'Sucia', baseStatus: 'Sucia', recleaningReason: reason, recleaningImageUrl: imageUrl || undefined }
          : r
      )
    );
  };

  const handleMarkForCheck = async (roomId: string, bedType: 'single' | 'double') => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      status: 'Sucia',
      baseStatus: 'Sucia',
      bedType: bedType,
      cleaningReason: 'Check-out', // Esto activará el estado visual 'limpiar'
      recleaningReason: deleteField(),
      lastCleanedBy: deleteField(),
      lastCleanedAt: deleteField(),
    });

    // Actualización optimista para una UI más rápida
    setRooms(prevRooms =>
      prevRooms.map(r =>
        r.id === roomId
          ? { 
              ...r, 
              status: 'Sucia', 
              baseStatus: 'Sucia',
              bedType: bedType,
              cleaningReason: 'Check-out',
              recleaningReason: undefined,
              lastCleanedBy: undefined,
              lastCleanedAt: undefined,
            }
          : r
      ));
  };
  
  const openReportModal = (room: Room) => {
    setSelectedRoom(room);
    setReportModalOpen(true);
  };

  const openRecleanModal = (room: Room) => {
    setSelectedRoom(room);
    setRecleanModalOpen(true);
  };

  const openCleanModal = (room: Room) => {
    setSelectedRoom(room);
    setCleanModalOpen(true);
  };

  const openCheckoutModal = (room: Room) => {
    setSelectedRoom(room);
    setCheckoutModalOpen(true);
  };

  const openCheckModal = (room: Room) => {
    setSelectedRoom(room);
    setCheckModalOpen(true);
  };
  
  const openCheckInWarningModal = () => {
    setCheckInWarningModalOpen(true);
  };


  const handleResolveProblem = async (roomId: string, problemId: string) => {
    const roomRef = doc(db, 'rooms', roomId);
    const room = rooms.find((r) => r.id === roomId);

    if (room && room.reportedProblems) {
      const updatedProblems = room.reportedProblems.map((p) =>
        p.id === problemId ? { ...p, isResolved: true } : p
      );

      const allProblemsResolved = updatedProblems.every((p) => p.isResolved);

      const updateData: any = { reportedProblems: updatedProblems };

      if (allProblemsResolved) {
        // Si no hay baseStatus, es probable que la habitación estuviera 'Sucia' o 'Limpia'
        // antes del problema. Por seguridad, la marcamos como 'Sucia' para revisión.
        const newStatus = room.baseStatus || 'Sucia';
        updateData.status = newStatus;
        updateData.baseStatus = null; // Limpiamos el baseStatus
      }

      await updateDoc(roomRef, updateData);
      // Actualización optimista
      setRooms(prevRooms =>
        prevRooms.map(r =>
          r.id === roomId ? { ...r, ...updateData } : r
        )
      );
    }
  };

  const handleToggleBlock = async (room: Room) => {
    const roomRef = doc(db, 'rooms', room.id);

    if (room.status === 'Bloqueada') {
      const updateData = { status: room.baseStatus || 'Sucia', baseStatus: deleteField() };
      // Desbloquear: Volver al estado base y eliminar baseStatus
      await updateDoc(roomRef, updateData);
      // Actualización optimista
      setRooms(prevRooms =>
        prevRooms.map(r => r.id === room.id ? { ...r, status: room.baseStatus || 'Sucia', baseStatus: undefined } : r)
      );
    } else {
      const updateData = { status: 'Bloqueada', baseStatus: room.status };
      // Bloquear: Guardar estado actual en baseStatus y poner status en 'Bloqueada'
      await updateDoc(roomRef, updateData);
      // Actualización optimista
      setRooms(prevRooms =>
        prevRooms.map(r => r.id === room.id ? { ...r, status: 'Bloqueada', baseStatus: room.status as 'Sucia' | 'Limpia' | 'Ocupada' } : r)
      );
    }
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
    if (room.cleaningReason) return 'limpiar';
    if (room.status === 'Limpia') return 'clean';
    if (room.status === 'Ocupada') return 'occupied';
    if (room.status === 'Sucia' && room.baseStatus === 'Ocupada') return 'dirty_occupied';
    return 'dirty';
  };

  const handleToggleRequestCleaning = async (room: Room): Promise<void> => {
    const roomRef = doc(db, 'rooms', room.id);
    const isCleaningRequested = room.cleaningReason;
    let updateData: any;
  
    if (isCleaningRequested) {
      // Un-request cleaning: revert to occupied and clear the cleaning reason
      updateData = {
        status: 'Ocupada',
        baseStatus: 'Ocupada',
        cleaningReason: deleteField(),
      };
      await updateDoc(roomRef, updateData);
      setRooms(prevRooms => prevRooms.map(r => r.id === room.id ? { ...r, status: 'Ocupada', baseStatus: 'Ocupada', cleaningReason: undefined } : r));
    } else {
      // Request cleaning
      updateData = {
        status: 'Sucia',
        baseStatus: 'Ocupada',
        cleaningReason: 'Cliente ha solicitado limpieza',
      };
      await updateDoc(roomRef, updateData);
      setRooms(prevRooms => prevRooms.map(r => r.id === room.id ? { ...r, ...updateData } : r));
    }
  }

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
                  t={t as TFunction}
                  room={{
                    id: room.id,
                    number: room.id,
                    status: modernStatus,
                    baseStatus: baseStatus,
                    lastCleanedBy: room.lastCleanedBy ? getUserEmail(room.lastCleanedBy) : undefined,
                    lastCleanedAt: room.lastCleanedAt ? room.lastCleanedAt.toDate().toLocaleString() : undefined,
                    problems: unresolvedProblems,
                    recleaningReason: room.recleaningReason,
                    cleaningReason: room.cleaningReason,
                    bedType: room.bedType,
                  } as ModernRoom}
                  userRole={userRole}
                  isAnimatingOut={animatingOutRoomId === room.id}
                  onStatusChange={(newStatus) => {
                    if (newStatus === 'clean') {
                      openCleanModal(room);
                    } else if (newStatus === 'dirty') {
                      handleSetStatus(room.id, 'Sucia');
                    } else if (newStatus === 'occupied') {
                      handleSetStatus(room.id, 'Ocupada');
                    }
                  }}
                  onReportProblem={() => openReportModal(room)}
                  onReclean={() => openRecleanModal(room)}
                  onMarkForCheck={() => openCheckModal(room)}
                  onResolveProblem={(problemId) => handleResolveProblem(room.id, problemId)}
                  onCheckInAttemptOnDirty={openCheckInWarningModal}
                  onToggleBlock={() => handleToggleBlock(room)}
                  onRequestCleaning={() => handleToggleRequestCleaning(room)}
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
              onMark={async (reason, file) => {
                if (selectedRoom) {
                  await handleReclean(selectedRoom.id, reason, file);
                }
              }}
            />
            <CheckModal
              isOpen={isCheckModalOpen}
              onClose={() => setCheckModalOpen(false)}
              onSelect={(bedType: 'single' | 'double') => {
                if (selectedRoom) {
                  handleMarkForCheck(selectedRoom.id, bedType);
                }
                setCheckModalOpen(false);
              }}
            />
            <CleanConfirmationModal
              isOpen={isCleanModalOpen}
              onClose={() => setCleanModalOpen(false)}
              onConfirm={() => {
                if (selectedRoom) {
                  handleSetStatus(selectedRoom.id, 'Limpia');
                  setCleanModalOpen(false); // <-- ¡Añadido! Cierra el modal después de confirmar.
                }
              }}
              room={selectedRoom}
            />
            <WarningModal
              isOpen={isCheckInWarningModalOpen}
              onClose={() => setCheckInWarningModalOpen(false)}
              title={t('warningModal.checkInTitle')}
              message={t('warningModal.checkInMessage')}
            />
          </>
        )}
      </div>
    </>
  );
};

export default RoomList;

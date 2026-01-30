import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc, Timestamp, deleteField, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { db, auth, storage } from '../firebase';
import { Room, User } from '../types';
import ReportProblemModal from './ReportProblemModal';
import RecleanModal from './RecleanModal';
import CleanModal from './CleanModal';
import AssignmentModal from './AssignmentModal';
import CheckModal from './CheckModal';
import WarningModal from './WarningModal';
import CleanConfirmationModal from './CleanConfirmationModal'; // Importar el nuevo modal
import LanguageSelector from './LanguageSelector';
import { ModernRoomCard, ModernRoom } from './ModernRoomCard';
import RoomFilter from './RoomFilter'; // Importar el nuevo componente de filtro
import './ModernRoomCard.css';
import './Header.css'; // Importar los nuevos estilos del encabezado
import '../App.css'; // Make sure global styles are applied
import './RoomFilter.css'; // Importar los estilos para el filtro
import { User as UserIcon, LogOut } from 'lucide-react'; // Added lucide-react icons

interface RoomListProps {
  user: User;
}

const roleLabels: Record<string, string> = {
  super: "Recepción",
  limp: "Limpieza",
  mant: "Mantenimiento",
  cleaner: "Limpieza", // Assuming 'cleaner' maps to 'Limpieza'
  maintenance: "Mantenimiento", // Assuming 'maintenance' maps to 'Mantenimiento'
  supervisor: "Supervisor", // Assuming 'supervisor' maps to 'Supervisor'
};

type ModernRoomStatus = 'clean' | 'dirty' | 'problem' | 'occupied' | 'reclean' | 'blocked' | 'dirty_occupied' | 'limpiar';

const RoomList: React.FC<RoomListProps> = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isRecleanModalOpen, setRecleanModalOpen] = useState(false);
  const [isCleanModalOpen, setCleanModalOpen] = useState(false);
  const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isCheckModalOpen, setCheckModalOpen] = useState(false);
  const [isCheckInWarningModalOpen, setCheckInWarningModalOpen] = useState(false);
  const [isAssignmentModalOpen, setAssignmentModalOpen] = useState(false);
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

  useEffect(() => {
    const unsubscribeRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const roomsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Room));
      setAllRooms(roomsData);
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as User));
      setUsers(usersData);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRooms();
    };
  }, []);

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

  const rooms = useMemo(() => {
    const userAssignments = (user.role === 'cleaner' || user.role === 'maintenance') ? user.assignments : null;

    const filtered = allRooms.filter(room => {
      // 1. Filter by assignment for staff roles
      if (userAssignments && !userAssignments.includes(room.id)) {
        return false;
      }

      const isCommonArea = room.type === 'common_area';
      const modernStatus = getModernStatus(room);
      const baseStatus = room.baseStatus || (room.status !== 'Bloqueada' ? room.status : 'Sucia');

      if (filter === 'common_area') {
        return isCommonArea;
      }

      if (isCommonArea) {
        return false; // Exclude common areas from other filters for now
      }

      switch (filter) {
        case 'Sucia':
          if (user.role === 'cleaner') {
            return baseStatus === 'Sucia' || modernStatus === 'limpiar' || (modernStatus === 'reclean' && room.lastCleanedBy === user.uid);
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
          return true; // for 'status' and 'number'
      }
    });

    return filtered.sort((a, b) => {
      const isACommonArea = a.type === 'common_area';
      const isBCommonArea = b.type === 'common_area';

      // Group common areas together, sorting them by name
      if (isACommonArea && isBCommonArea) {
        return a.name!.localeCompare(b.name!); // Sort common areas by name
      }
      if (isACommonArea) return 1; // Common areas come after rooms
      if (isBCommonArea) return -1; // Rooms come before common areas

      // Existing sorting logic for rooms
      if (filter === 'status') {
        const statusOrder = ['Sucia', 'Ocupada', 'Limpia', 'Bloqueada'];
        const aIndex = statusOrder.indexOf(a.status);
        const bIndex = statusOrder.indexOf(b.status);
        if (aIndex !== bIndex) return aIndex - bIndex;
      }
      // Default sort by number for rooms
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });
  }, [allRooms, filter, user]);

  const handleLogout = () => {
    signOut(auth);
  };

  const getUserEmail = (uid: string) => {
    const foundUser = users.find((u) => u.uid === uid);
    return foundUser ? foundUser.email : 'Usuario desconocido';
  };

  const handleSetStatus = async (roomId: string, newBaseStatus: 'Limpia' | 'Sucia' | 'Ocupada') => {
    const room = allRooms.find((r) => r.id === roomId);
    if (!room) return;

    const roomRef = doc(db, 'rooms', roomId);

    // Special reasons for occupied room recleans that should revert to occupied
    const specialOccupiedRecleanReasons = ["Fresh-up", "Bleibe"];

    const isSpecialOccupiedReclean =
      room.baseStatus === 'Ocupada' &&
      room.recleaningReason &&
      specialOccupiedRecleanReasons.includes(room.recleaningReason);

    let finalStatus: 'Limpia' | 'Sucia' | 'Ocupada' = newBaseStatus;
    let finalBaseStatus: 'Limpia' | 'Sucia' | 'Ocupada' = newBaseStatus;

    if (newBaseStatus === 'Limpia' && isSpecialOccupiedReclean) {
      finalStatus = 'Ocupada';
      finalBaseStatus = 'Ocupada';
    }

    const isBlocked = room.status === 'Bloqueada';
    const updateData: any = {
      status: isBlocked ? 'Bloqueada' : finalStatus,
      baseStatus: finalBaseStatus,
    };

    if (newBaseStatus === 'Limpia') {
      updateData.lastCleanedBy = user.uid;
      updateData.lastCleanedAt = Timestamp.now();
      updateData.recleaningReason = deleteField();
      updateData.cleaningReason = deleteField();
    }

    // --- Lógica de Animación para Limpiadores ---
    // if (user.role === 'cleaner' && newBaseStatus === 'Limpia') {
    //   setAnimatingOutRoomId(roomId);
    //   setTimeout(async () => {
    //     await updateDoc(roomRef, updateData);
    //     setAnimatingOutRoomId(null);
    //   }, 800);
    //   return;
    // }

    // --- Lógica de Actualización Inmediata para todos los demás casos ---
    await updateDoc(roomRef, updateData);
  };

  const handleReclean = async (roomId: string, reason: string, file: File | null) => {
    const room = allRooms.find(r => r.id === roomId);
    if (!room) return;

    const roomRef = doc(db, 'rooms', roomId);
    let imageUrl = '';

    if (file) {
      const storageRef = ref(storage, `reclean-images/${roomId}-${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    }
    
    const wasOccupied = room.baseStatus === 'Ocupada' || room.status === 'Ocupada';

    await updateDoc(roomRef, {
      status: 'Sucia',
      baseStatus: wasOccupied ? 'Ocupada' : 'Sucia',
      recleaningReason: reason,
      recleaningImageUrl: imageUrl || null,
    });
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
    const room = allRooms.find((r) => r.id === roomId);

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
    }
  };

  const handleToggleBlock = async (room: Room) => {
    const roomRef = doc(db, 'rooms', room.id);

    if (room.status === 'Bloqueada') {
      const updateData = { status: room.baseStatus || 'Sucia', baseStatus: deleteField() };
      // Desbloquear: Volver al estado base y eliminar baseStatus
      await updateDoc(roomRef, updateData);
    } else {
      const updateData = { status: 'Bloqueada', baseStatus: room.status };
      // Bloquear: Guardar estado actual en baseStatus y poner status en 'Bloqueada'
      await updateDoc(roomRef, updateData);
    }
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
    } else {
      // Request cleaning
      updateData = { status: 'Sucia', baseStatus: 'Ocupada', cleaningReason: 'Cliente ha solicitado limpieza' };
      await updateDoc(roomRef, updateData);
    }
  }

  return (
    <>
      <header className="lovable-header">
        <div className="lovable-header-content">
          <div className="lovable-logo-group">
            <div className="lovable-logo-icon-wrapper">
              <span className="lovable-logo-text-icon">H</span>
            </div>
            <div className="lovable-app-title-group">
              <h1 className="lovable-app-title">{t('header.hotelManagerTitle', 'Hotel Manager')}</h1>
              <p className="lovable-app-subtitle">{t('header.roomManagementSubtitle', 'Gestión de habitaciones')}</p>
            </div>
          </div>

          <div className="lovable-user-actions">
            {user.role === 'supervisor' && (
              <button onClick={() => setAssignmentModalOpen(true)} className="assignment-button">
                {t('header.assignments', 'Asignaciones')}
              </button>
            )}
            <div className="lovable-online-status">
              <div className="lovable-online-dot" />
              <span className="lovable-online-text">{t('header.onlineStatus', 'En línea')}</span>
            </div>

            <div className="lovable-user-dropdown-trigger">
              <div className="lovable-user-avatar-wrapper">
                <UserIcon className="lovable-user-avatar-icon" />
              </div>
              <div className="lovable-user-info-text-group">
                <p className="lovable-user-role">{roleLabels[user.role] || user.role}</p>
                <p className="lovable-user-email">{user.email}</p>
              </div>
            </div>
            <LanguageSelector currentLanguage={i18n.language} />
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', color: 'inherit' }} title={t('roomStatus.logoutButton')}>
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>
      <main className="main-content">
        <RoomFilter
          activeFilter={filter}
          onFilterChange={setFilter}
        />

        <div className="lovable-grid">
          {rooms.map((room) => {
            const modernStatus = getModernStatus(room);
            const baseStatus = getBaseStatus(room);
            const unresolvedProblems = room.reportedProblems?.filter(p => !p.isResolved) || [];
            const userRole = user.role;

                       return (
                <ModernRoomCard
                  key={room.id}
                  t={t as TFunction}
                  room={{
                    id: room.id,
                    number: room.id,
                    name: room.name,
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
        {/* El modal de asignaciones no depende de una habitación seleccionada, por lo que va fuera del bloque anterior */}
        <AssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => setAssignmentModalOpen(false)}
          staff={users.filter(u => u.role === 'cleaner' || u.role === 'maintenance')}
          rooms={allRooms}
        />
      </main>
    </>
  );
};

export default RoomList;

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Room } from '../types';
import './AssignmentModal.css';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: User[];
  rooms: Room[];
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({ isOpen, onClose, staff, rooms }) => {
  const { t } = useTranslation();
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedStaff) {
      setSelectedAssignments(new Set(selectedStaff.assignments || []));
    } else {
      setSelectedAssignments(new Set());
    }
  }, [selectedStaff]);

  const handleAssignmentChange = (itemId: string) => {
    setSelectedAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectGroup = (groupRooms: Room[]) => {
    const groupIds = groupRooms.map(r => r.id);
    const allSelectedInGroup = groupIds.every(id => selectedAssignments.has(id));

    setSelectedAssignments(prev => {
      const newSet = new Set(prev);
      if (allSelectedInGroup) {
        // If all are selected, deselect them
        groupIds.forEach(id => newSet.delete(id));
      } else {
        // If some or none are selected, select them all
        groupIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedStaff) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', selectedStaff.uid);
      await updateDoc(userRef, {
        assignments: Array.from(selectedAssignments)
      });
      onClose();
    } catch (error) {
      console.error("Failed to save assignments:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const groupedRooms = useMemo(() => {
    const groups: { [key: string]: Room[] } = {
      'Planta 1': [],
      'Planta 2': [],
      'Planta 3': [],
      'Zonas Comunes': [],
      'Otros': []
    };

    rooms.forEach(room => {
      if (room.type === 'common_area') {
        groups['Zonas Comunes'].push(room);
      } else if (room.id.startsWith('1')) {
        groups['Planta 1'].push(room);
      } else if (room.id.startsWith('2')) {
        groups['Planta 2'].push(room);
      } else if (room.id.startsWith('3')) {
        groups['Planta 3'].push(room);
      } else {
        groups['Otros'].push(room);
      }
    });

    for (const key in groups) {
      groups[key].sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
    }
    return groups;
  }, [rooms]);

  if (!isOpen) return null;

  return (
    <div className="assignment-modal-overlay" onClick={onClose}>
      <div className="assignment-modal-content" onClick={e => e.stopPropagation()}>
        <div className="assignment-modal-header">
          <h2>Gestionar Asignaciones</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <div className="assignment-modal-body">
          <div className="staff-list-column">
            <h3>Personal</h3>
            <ul>
              {staff.map(s => (
                <li key={s.uid} onClick={() => setSelectedStaff(s)} className={selectedStaff?.uid === s.uid ? 'active' : ''}>
                  {s.email}
                  <span>{s.role === 'cleaner' ? 'Limpieza' : 'Mantenimiento'}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="assignments-column">
            {selectedStaff ? (
              <>
                <h3>Asignar a {selectedStaff.email}</h3>
                <div className="assignments-scroll-area">
                  {Object.entries(groupedRooms).map(([groupName, groupRooms]) => (
                    groupRooms.length > 0 && (
                      <div key={groupName} className="assignment-group">
                        <div className="assignment-group-header">
                          <h4>{groupName}</h4>
                          <button className="select-all-button" onClick={() => handleSelectGroup(groupRooms)}>
                            {groupRooms.every(r => selectedAssignments.has(r.id))
                              ? t('assignments.deselectAll', 'Deseleccionar')
                              : t('assignments.selectAll', 'Seleccionar todos')}
                          </button>
                        </div>
                        <div className="assignment-items-grid">
                          {groupRooms.map(room => (
                            <div key={room.id} className="assignment-checkbox">
                              <input
                                type="checkbox"
                                id={`assign-${room.id}`}
                                checked={selectedAssignments.has(room.id)}
                                onChange={() => handleAssignmentChange(room.id)}
                              />
                              <label htmlFor={`assign-${room.id}`}>{room.name || room.id}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
                <div className="assignment-modal-footer">
                  <button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </>
            ) : (
              <div className="assignments-placeholder">
                <p>Selecciona un miembro del personal para ver o editar sus asignaciones.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentModal;
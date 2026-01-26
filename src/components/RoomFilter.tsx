import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Circle, Wrench, User, Lock, List, SortAsc } from 'lucide-react';
import './RoomFilter.css';

// Define the structure for a filter option
interface FilterOption {
  id: string;
  labelKey: string;
  icon: React.ElementType | null;
}

// Define the filter options based on the existing select options
const filterOptions: FilterOption[] = [
  { id: 'status', labelKey: 'filters.all_status', icon: List },
  { id: 'number', labelKey: 'filters.all_number', icon: SortAsc },
  { id: 'Limpia', labelKey: 'filters.clean_only', icon: Check },
  { id: 'Sucia', labelKey: 'filters.dirty_only', icon: Circle },
  { id: 'Ocupada', labelKey: 'filters.occupied_only', icon: User },
  { id: 'problem', labelKey: 'filters.problem_only', icon: Wrench },
  { id: 'Bloqueada', labelKey: 'filters.blocked_only', icon: Lock },
];

interface RoomFilterProps {
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
}

const RoomFilter: React.FC<RoomFilterProps> = ({ activeFilter, onFilterChange }) => {
  const { t } = useTranslation();

  return (
    <div className="room-filter-wrapper">
      <div className="room-filter-container">
        {filterOptions.map((filter) => (
          <button
            key={filter.id}
            className={`room-filter-button ${activeFilter === filter.id ? 'active' : ''}`}
            onClick={() => onFilterChange(filter.id)}
          >
            {filter.icon && React.createElement(filter.icon, { className: "room-filter-icon" })}
            <span>{t(filter.labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoomFilter;
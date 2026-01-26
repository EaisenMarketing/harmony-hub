import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface CourseFiltersState {
  instrument: string;
  level: string;
}

interface CourseFiltersProps {
  filters: CourseFiltersState;
  onFiltersChange: (filters: CourseFiltersState) => void;
  showClearButton?: boolean;
}

const instruments = [
  { value: 'all', label: 'Todos los instrumentos', emoji: '🎵' },
  { value: 'guitar', label: 'Guitarra', emoji: '🎸' },
  { value: 'piano', label: 'Piano', emoji: '🎹' },
  { value: 'drums', label: 'Batería', emoji: '🥁' },
  { value: 'banjo', label: 'Banjo', emoji: '🪕' },
];

const levels = [
  { value: 'all', label: 'Todos los niveles' },
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
];

export const CourseFilters = ({ filters, onFiltersChange, showClearButton = true }: CourseFiltersProps) => {
  const hasActiveFilters = filters.instrument !== 'all' || filters.level !== 'all';

  const handleClearFilters = () => {
    onFiltersChange({ instrument: 'all', level: 'all' });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtrar:</span>
      </div>

      <Select
        value={filters.instrument}
        onValueChange={(value) => onFiltersChange({ ...filters, instrument: value })}
      >
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Instrumento" />
        </SelectTrigger>
        <SelectContent>
          {instruments.map((inst) => (
            <SelectItem key={inst.value} value={inst.value}>
              <span className="flex items-center gap-2">
                <span>{inst.emoji}</span>
                <span>{inst.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.level}
        onValueChange={(value) => onFiltersChange({ ...filters, level: value })}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Nivel" />
        </SelectTrigger>
        <SelectContent>
          {levels.map((lvl) => (
            <SelectItem key={lvl.value} value={lvl.value}>
              {lvl.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showClearButton && hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-9 text-muted-foreground hover:text-foreground"
        >
          Limpiar filtros
        </Button>
      )}
    </div>
  );
};

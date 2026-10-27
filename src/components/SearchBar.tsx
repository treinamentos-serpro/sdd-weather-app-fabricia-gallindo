import CitySearch from './CitySearch';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  return <CitySearch disabled={disabled} onSearch={onSearch} />;
}

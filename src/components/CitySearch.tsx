import { type FormEvent, useState } from 'react';

interface CitySearchProps {
  isLoading?: boolean;
  onSearch: (query: string) => void;
}

export default function CitySearch({ isLoading = false, onSearch }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setValidationMessage('Informe o nome de uma cidade.');
      return;
    }

    setValidationMessage('');
    onSearch(trimmedQuery);
  }

  return (
    <form aria-busy={isLoading} className="w-full max-w-2xl" onSubmit={handleSubmit} role="search">
      <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="city-search">
        Cidade
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          autoComplete="off"
          className="min-h-12 min-w-0 flex-1 border border-white/15 bg-night-800 px-4 text-base text-white placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          id="city-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex.: São Paulo"
          type="search"
          value={query}
        />
        <button
          className="min-h-12 border border-accent-400 bg-accent-500 px-5 font-semibold text-white hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-70"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
      {validationMessage && (
        <p className="mt-2 text-sm text-sun" role="alert">
          {validationMessage}
        </p>
      )}
      <p className="sr-only" role="status">
        {isLoading ? 'Buscando cidades.' : ''}
      </p>
    </form>
  );
}

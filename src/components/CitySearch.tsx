import { type FormEvent, useId, useRef, useState } from 'react';

interface CitySearchProps {
  disabled?: boolean;
  isLoading?: boolean;
  onSearch: (query: string) => void;
}

export default function CitySearch({
  disabled = false,
  isLoading = false,
  onSearch,
}: CitySearchProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || isLoading) {
      return;
    }

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setValidationMessage('Informe o nome de uma cidade.');
      inputRef.current?.focus();
      return;
    }

    setValidationMessage('');
    onSearch(trimmedQuery);
  }

  return (
    <form
      aria-busy={isLoading}
      aria-label="Buscar cidade"
      className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:p-6"
      onSubmit={handleSubmit}
      role="search"
    >
      <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor={inputId}>
        Cidade
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          autoComplete="off"
          aria-describedby={validationMessage ? `${inputId}-error` : undefined}
          aria-invalid={validationMessage ? true : undefined}
          className="min-h-12 min-w-0 flex-1 rounded-lg border border-slate-400 bg-night-800 px-4 text-base text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={disabled}
          id={inputId}
          onChange={(event) => {
            setQuery(event.target.value);
            setValidationMessage('');
          }}
          placeholder="Ex.: São Paulo"
          type="search"
          ref={inputRef}
          value={query}
        />
        <button
          className="min-h-12 rounded-lg border border-accent-400 bg-accent-500 px-5 font-semibold text-night-900 hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
          disabled={disabled || isLoading}
          type="submit"
        >
          {isLoading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
      {validationMessage && (
        <p className="mt-2 text-sm text-sun" id={`${inputId}-error`} role="alert">
          {validationMessage}
        </p>
      )}
      <p className="sr-only" role={isLoading ? 'status' : undefined}>
        {isLoading ? 'Buscando cidades.' : ''}
      </p>
    </form>
  );
}

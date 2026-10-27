import { useEffect, useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import useWeather from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, data, error, search, retry } = useWeather();
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (status === 'success') {
      resultRef.current?.focus();
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-night-900 text-slate-100">
      <a
        className="sr-only z-50 rounded-lg bg-accent-400 p-3 font-semibold text-night-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-white"
        href="#main-content"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-white/10 bg-night-800/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-white">WEATHER</p>
              <p className="mt-1 text-xs text-slate-300">Previsão local</p>
            </div>
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
          <SearchBar disabled={status === 'loading'} onSearch={search} />
        </div>
      </header>

      <main
        className="mx-auto max-w-6xl space-y-8 px-5 py-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400 sm:px-8 sm:py-12"
        id="main-content"
        tabIndex={-1}
      >
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-accent-400">CLIMA POR CIDADE</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Consulte o tempo e planeje os próximos dias.
          </h1>
        </div>

        {status === 'idle' && (
          <EmptyState
            title="Sua previsão começa por uma cidade."
            hint="Busque pelo nome de uma cidade para visualizar o clima e a previsão."
          />
        )}
        {status === 'loading' && <LoadingState />}
        {status === 'empty' && (
          <EmptyState
            title="Nenhuma cidade encontrada"
            hint="Confira a grafia ou tente buscar outra cidade."
          />
        )}
        {status === 'error' && error && <ErrorState message={error} onRetry={retry} />}
        {status === 'success' && data && (
          <section
            aria-label="Resultado da consulta"
            className="space-y-8 rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
            ref={resultRef}
            tabIndex={-1}
          >
            <CurrentWeather city={data.city} current={data.current} unit={unit} />
            <ForecastList forecast={data.forecast} unit={unit} />
          </section>
        )}
      </main>
    </div>
  );
}

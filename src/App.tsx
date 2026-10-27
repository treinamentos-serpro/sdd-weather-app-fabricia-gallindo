import { useEffect, useId, useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { weatherDataMock } from './mocks/weather';
import type { Unit } from './types/weather';

const scenarios = ['idle', 'loading', 'empty', 'error', 'success'] as const;
type Scenario = (typeof scenarios)[number];

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const [scenario, setScenario] = useState<Scenario>('idle');
  const scenarioId = useId();
  const resultRef = useRef<HTMLElement>(null);
  const shouldFocusResult = useRef(false);

  useEffect(() => {
    if (scenario === 'success' && shouldFocusResult.current) {
      resultRef.current?.focus();
      shouldFocusResult.current = false;
    }
  }, [scenario]);

  function showResults() {
    if (scenario === 'success') {
      resultRef.current?.focus();
    } else {
      shouldFocusResult.current = true;
      setScenario('success');
    }
  }

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
          <SearchBar disabled={scenario === 'loading'} onSearch={showResults} />
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

        <aside
          aria-label="Controles da demonstração"
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
        >
          <p className="font-semibold text-sun">Modo de demonstração — sem API</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Dados fictícios e fixos de São Paulo (27 a 31/10/2026). Qualquer busca válida exibe esse
            exemplo, não uma consulta à cidade digitada. Tentar novamente também exibe o exemplo. No
            cenário loading, use o seletor abaixo para continuar.
          </p>
          <label className="mb-2 mt-4 block text-sm font-medium" htmlFor={scenarioId}>
            Cenário de demonstração
          </label>
          <select
            className="min-h-12 w-full rounded-lg border border-slate-400 bg-night-800 px-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 sm:w-auto"
            id={scenarioId}
            onChange={(event) => {
              const selected = scenarios.find((value) => value === event.target.value);
              if (selected === undefined) {
                throw new Error('Cenário de demonstração inválido.');
              }
              setScenario(selected);
            }}
            value={scenario}
          >
            <option value="idle">idle — Aguardando busca</option>
            <option value="loading">loading — Carregando</option>
            <option value="empty">empty — Nenhum resultado</option>
            <option value="error">error — Falha na consulta</option>
            <option value="success">success — Clima e previsão</option>
          </select>
        </aside>

        {scenario === 'idle' && (
          <EmptyState
            title="Sua previsão começa por uma cidade."
            hint="Busque pelo nome de uma cidade para visualizar o exemplo de clima e previsão."
          />
        )}
        {scenario === 'loading' && <LoadingState />}
        {scenario === 'empty' && (
          <EmptyState
            title="Nenhuma cidade encontrada"
            hint="Confira a grafia ou tente buscar outra cidade."
          />
        )}
        {scenario === 'error' && (
          <ErrorState
            message="Não foi possível consultar o tempo. Este é um erro de demonstração."
            onRetry={showResults}
          />
        )}
        {scenario === 'success' && (
          <section
            aria-label="Resultado da consulta"
            className="space-y-8 rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
            ref={resultRef}
            tabIndex={-1}
          >
            <CurrentWeather
              city={weatherDataMock.city}
              current={weatherDataMock.current}
              unit={unit}
            />
            <ForecastList forecast={weatherDataMock.forecast} unit={unit} />
          </section>
        )}
      </main>
    </div>
  );
}

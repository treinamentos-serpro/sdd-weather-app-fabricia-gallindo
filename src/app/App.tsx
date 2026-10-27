import EmptyWeatherState from '../components/EmptyWeatherState';

export default function App() {
  return (
    <div className="min-h-screen bg-night-900 text-slate-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center px-5 sm:px-8">
          <p className="text-sm font-semibold tracking-[0.16em] text-slate-100">WEATHER</p>
          <span className="ml-3 border-l border-white/20 pl-3 text-xs text-slate-400">
            Previsão local
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-accent-400">CLIMA POR CIDADE</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Consulte o tempo e planeje os próximos dias.
          </h1>
        </div>
        <EmptyWeatherState />
      </main>
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = 'Carregando dados do tempo...',
}: LoadingStateProps) {
  return (
    <div
      aria-atomic="true"
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-200 backdrop-blur-md"
      role="status"
    >
      <span
        aria-hidden="true"
        className="h-6 w-6 shrink-0 rounded-full border-2 border-white/20 border-t-accent-400 motion-safe:animate-spin"
      />
      <p className="min-w-0 break-words">{message}</p>
    </div>
  );
}

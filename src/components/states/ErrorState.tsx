interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="break-words rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <p className="text-sun" role="alert">
        {message}
      </p>
      <button
        className="mt-4 min-h-12 rounded-lg border border-accent-400 bg-accent-500 px-5 py-2 font-semibold text-night-900 hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        onClick={onRetry}
        type="button"
      >
        Tentar novamente
      </button>
    </div>
  );
}

import { useId } from 'react';

interface EmptyStateProps {
  title?: string;
  hint?: string;
}

export default function EmptyState({
  title = 'Nenhuma cidade selecionada.',
  hint = 'Busque pelo nome de uma cidade e selecione um resultado para consultar o tempo.',
}: EmptyStateProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="break-words rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
    >
      <h2 className="text-xl font-semibold text-white" id={headingId}>
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{hint}</p>
    </section>
  );
}

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from '../../../src/components/states/EmptyState';
import ErrorState from '../../../src/components/states/ErrorState';
import LoadingState from '../../../src/components/states/LoadingState';

describe('LoadingState', () => {
  it('announces loading and removes the status when unmounted', () => {
    const { unmount } = render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados do tempo...');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    unmount();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('accepts a contextual loading message', () => {
    render(<LoadingState message="Buscando cidades..." />);
    expect(screen.getByRole('status')).toHaveTextContent('Buscando cidades...');
  });
});

describe('ErrorState', () => {
  it('announces the message as text and retries only after user interaction', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Não foi possível consultar o tempo." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível consultar o tempo.');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(onRetry).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('supports retry by keyboard without submitting a surrounding form', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ErrorState message="Serviço indisponível." onRetry={onRetry} />
      </form>,
    );

    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledTimes(1);
    await user.keyboard(' ');
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('displays an initial title and hint without announcing an error or loading', () => {
    render(<EmptyState />);
    expect(
      screen.getByRole('heading', { name: 'Nenhuma cidade selecionada.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Busque pelo nome de uma cidade e selecione um resultado para consultar o tempo.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('accepts contextual content and associates each region with its own heading', () => {
    render(
      <>
        <EmptyState />
        <EmptyState
          title="Nenhuma cidade encontrada"
          hint="Confira a grafia ou tente outra cidade."
        />
      </>,
    );
    const initial = screen.getByRole('region', { name: 'Nenhuma cidade selecionada.' });
    const emptySearch = screen.getByRole('region', { name: 'Nenhuma cidade encontrada' });
    expect(
      within(emptySearch).getByText('Confira a grafia ou tente outra cidade.'),
    ).toBeInTheDocument();
    expect(initial.getAttribute('aria-labelledby')).not.toBe(
      emptySearch.getAttribute('aria-labelledby'),
    );
  });
});

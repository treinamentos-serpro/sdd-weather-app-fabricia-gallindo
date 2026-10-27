import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../../../src/components/SearchBar';

describe('SearchBar', () => {
  it('provides a search landmark and a labeled search input', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toContainElement(
      screen.getByRole('searchbox', { name: 'Cidade' }),
    );
  });

  it.each(['', '   '])('rejects an empty or whitespace-only query: %j', async (query) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    if (query) {
      await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), query);
    }
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome de uma cidade.');
    expect(screen.getByRole('searchbox')).toHaveFocus();
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('searchbox')).toHaveAccessibleDescription(
      'Informe o nome de uma cidade.',
    );
  });

  it('submits a trimmed city once by button and clears the validation error', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), "  São José-d'Ávila  ");
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).not.toHaveAttribute('aria-invalid', 'true');
    expect(onSearch).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledExactlyOnceWith("São José-d'Ávila");
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('submits by keyboard', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), ' Recife {Enter}');

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
  });

  it('disables the input and blocks submission even with a previously entered city', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const { rerender } = render(<SearchBar onSearch={onSearch} />);
    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), 'Recife');

    rerender(<SearchBar disabled onSearch={onSearch} />);
    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('search'));
    expect(onSearch).not.toHaveBeenCalled();

    rerender(<SearchBar onSearch={onSearch} />);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
  });

  it('keeps labels associated with their own input across multiple instances', () => {
    render(
      <>
        <SearchBar onSearch={vi.fn()} />
        <SearchBar onSearch={vi.fn()} />
      </>,
    );

    const inputs = screen.getAllByRole('searchbox', { name: 'Cidade' });
    expect(inputs).toHaveLength(2);
    expect(inputs[0].id).not.toBe(inputs[1].id);
  });
});

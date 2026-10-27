import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CitySearch from '../../../src/components/CitySearch';

describe('CitySearch', () => {
  it('does not submit an empty query and asks for a city name', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<CitySearch onSearch={onSearch} />);

    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome de uma cidade.');
  });

  it('trims surrounding whitespace and preserves special characters', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<CitySearch onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), "  São José-d'Ávila  ");
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledWith("São José-d'Ávila");
  });

  it('submits the query with the Enter key', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<CitySearch onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), 'Curitiba{Enter}');

    expect(onSearch).toHaveBeenCalledWith('Curitiba');
  });

  it('announces the loading state and disables duplicate submission', () => {
    render(<CitySearch isLoading onSearch={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('Buscando cidades.');
    expect(screen.getByRole('button', { name: 'Buscando...' })).toBeDisabled();
  });
});

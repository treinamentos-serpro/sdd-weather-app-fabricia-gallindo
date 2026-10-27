import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App';
import { weatherDataMock } from '../../../src/mocks/weather';
import {
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../../src/services/weatherService';

vi.mock('../../../src/services/weatherService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/services/weatherService')>()),
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

const recife = {
  ...weatherDataMock.city,
  id: 2,
  name: 'Recife',
  latitude: -8.05,
  longitude: -34.88,
};
const weather = { ...weatherDataMock, city: recife };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(searchCities).mockResolvedValue([recife]);
  vi.mocked(getWeather).mockResolvedValue(weather);
});

async function submit(name = 'Recife') {
  const user = userEvent.setup();
  await user.clear(screen.getByRole('searchbox'));
  await user.type(screen.getByRole('searchbox'), `${name}{Enter}`);
  return user;
}

describe('App with useWeather', () => {
  it('starts idle with header controls and without requests or demonstration controls', () => {
    render(<App />);
    const header = screen.getByRole('banner');
    expect(within(header).getByText('WEATHER')).toBeInTheDocument();
    expect(within(header).getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°C Celsius' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('heading', { name: 'Sua previsão começa por uma cidade.' }),
    ).toBeVisible();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByText(/Modo de demonstração/)).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('validates whitespace locally and renders the actual service result after search', async () => {
    render(<App />);
    await submit('   ');
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome de uma cidade.');
    expect(searchCities).not.toHaveBeenCalled();

    await submit();
    expect(await screen.findByRole('heading', { name: 'Recife' })).toBeVisible();
    expect(searchCities).toHaveBeenCalledExactlyOnceWith('Recife');
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(recife);
    expect(screen.getByRole('region', { name: 'Resultado da consulta' })).toHaveFocus();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders loading with disabled search, then empty without requesting weather', async () => {
    let resolve!: (cities: []) => void;
    vi.mocked(searchCities).mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(<App />);
    await submit();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados do tempo...');
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    await act(async () => {
      resolve([]);
    });
    expect(await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
    expect(screen.getByRole('searchbox')).toBeEnabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('shows the service error and retries weather without repeating geocoding', async () => {
    vi.mocked(getWeather).mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    render(<App />);
    const user = await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('heading', { name: 'Recife' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Resultado da consulta' })).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(getWeather).toHaveBeenLastCalledWith(recife);
  });

  it('keeps the UI unit across searches and errors without refetching or mutating service data', async () => {
    const original = structuredClone(weather);
    render(<App />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '°F Fahrenheit' }));
    await submit();
    expect(await screen.findByText('77,7 °F')).toBeVisible();
    expect(within(screen.getByRole('main')).getAllByText(/°F/)).toHaveLength(12);
    await user.click(screen.getByRole('button', { name: '°C Celsius' }));
    expect(screen.getByText('25,4 °C')).toBeVisible();
    expect(within(screen.getByRole('main')).getAllByText(/°C/)).toHaveLength(12);
    expect(getWeather).toHaveBeenCalledTimes(1);
    expect(searchCities).toHaveBeenCalledTimes(1);

    vi.mocked(getWeather).mockRejectedValueOnce(new Error('Serviço indisponível'));
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Serviço indisponível');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('25,4 °C')).toBeVisible();
    expect(weather).toEqual(original);
  });
});

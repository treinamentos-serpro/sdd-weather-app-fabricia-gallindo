import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../../src/hooks/useWeather';
import { weatherDataMock } from '../../../src/mocks/weather';
import {
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../../src/services/weatherService';
import type { City, WeatherData } from '../../../src/types/weather';

vi.mock('../../../src/services/weatherService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/services/weatherService')>()),
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

const city = weatherDataMock.city;
const otherCity: City = { ...city, id: 2, name: 'Recife', latitude: -8.05, longitude: -34.88 };
const otherWeather: WeatherData = { ...weatherDataMock, city: otherCity };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(searchCities).mockResolvedValue([city, otherCity]);
  vi.mocked(getWeather).mockResolvedValue(weatherDataMock);
});

describe('useWeather', () => {
  it('starts idle and retry does nothing before any operation', async () => {
    const { result } = renderHook(() => useWeather());

    expect(result.current).toMatchObject({
      status: 'idle',
      data: null,
      cities: [],
      error: null,
      query: '',
    });
    await act(() => result.current.retry());
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('trims the query, exposes all cities and loads the first city', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.search('  São Paulo  ');
    });
    expect(result.current.status).toBe('loading');
    expect(result.current.query).toBe('São Paulo');

    await act(async () => {
      pending.resolve([city, otherCity]);
      await request;
    });

    expect(searchCities).toHaveBeenCalledExactlyOnceWith('São Paulo');
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(city);
    expect(result.current).toMatchObject({
      status: 'success',
      cities: [city, otherCity],
      data: weatherDataMock,
      error: null,
    });
  });

  it('returns empty without requesting weather and preserves previous data', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    vi.mocked(searchCities).mockResolvedValueOnce([]);

    await act(() => result.current.search('Inexistente'));

    expect(result.current).toMatchObject({
      status: 'empty',
      cities: [],
      error: null,
      query: 'Inexistente',
      data: weatherDataMock,
    });
    expect(getWeather).toHaveBeenCalledTimes(1);
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenLastCalledWith('Inexistente');
  });

  it.each(['', '   '])('validates %j locally and preserves previous data', async (name) => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));

    await act(() => result.current.search(name));

    expect(result.current).toMatchObject({
      status: 'error',
      error: 'Informe o nome de uma cidade.',
      data: weatherDataMock,
      query: '',
    });
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(1);
  });

  it('retries failed geocoding with the last query and clears the error', async () => {
    vi.mocked(searchCities).mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search('São Paulo'));
    expect(result.current).toMatchObject({ status: 'error', error: 'Falha de rede.' });
    expect(getWeather).not.toHaveBeenCalled();
    await act(() => result.current.retry());

    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(searchCities).toHaveBeenLastCalledWith('São Paulo');
    expect(result.current).toMatchObject({ status: 'success', error: null });
  });

  it('retries failed weather for the first result without repeating geocoding', async () => {
    vi.mocked(getWeather).mockRejectedValueOnce(
      new WeatherServiceError('A requisição demorou demais.'),
    );
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search('São Paulo'));
    expect(result.current).toMatchObject({
      status: 'error',
      cities: [city, otherCity],
      error: 'A requisição demorou demais.',
    });
    await act(() => result.current.retry());

    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(getWeather).toHaveBeenLastCalledWith(city);
    expect(result.current.status).toBe('success');
  });

  it('selects a city directly and retries the same city after failure', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    vi.mocked(getWeather).mockRejectedValueOnce(new Error('Serviço indisponível'));

    await act(() => result.current.selectCity(otherCity));
    expect(result.current).toMatchObject({
      status: 'error',
      data: weatherDataMock,
      error: 'Não foi possível consultar os dados do tempo. Tente novamente.',
    });
    vi.mocked(getWeather).mockResolvedValueOnce(otherWeather);
    await act(() => result.current.retry());

    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenLastCalledWith(otherCity);
    expect(result.current).toMatchObject({
      status: 'success',
      data: otherWeather,
      error: null,
      query: 'São Paulo',
    });
  });

  it('ignores stale geocoding and does not request weather for it', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise).mockResolvedValueOnce([otherCity]);
    vi.mocked(getWeather).mockResolvedValue(otherWeather);
    const { result } = renderHook(() => useWeather());
    let first: Promise<void>;
    act(() => {
      first = result.current.search('São Paulo');
    });
    await act(() => result.current.search('Recife'));
    await act(async () => {
      pending.resolve([city]);
      await first;
    });

    expect(getWeather).toHaveBeenCalledExactlyOnceWith(otherCity);
    expect(result.current).toMatchObject({
      status: 'success',
      data: otherWeather,
      cities: [otherCity],
      query: 'Recife',
    });
  });

  it.each([
    'resolve',
    'reject',
  ] as const)('ignores a stale weather %s and keeps retry on the latest city', async (outcome) => {
    const pending = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(pending.promise).mockResolvedValue(otherWeather);
    const { result } = renderHook(() => useWeather());
    let first: Promise<void>;
    act(() => {
      first = result.current.selectCity(city);
    });
    await act(() => result.current.selectCity(otherCity));
    await act(async () => {
      if (outcome === 'resolve') pending.resolve(weatherDataMock);
      else pending.reject(new Error('Falha antiga'));
      await first;
    });

    expect(result.current).toMatchObject({ status: 'success', data: otherWeather, error: null });
    await act(() => result.current.retry());
    expect(getWeather).toHaveBeenLastCalledWith(otherCity);
  });

  it('discards pending geocoding on unmount', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    const { result, unmount } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.search('São Paulo');
    });
    unmount();
    await act(async () => {
      pending.resolve([city]);
      await request;
    });
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('reports an explicit message for non-Error rejections', async () => {
    vi.mocked(searchCities).mockRejectedValueOnce(null);
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search('São Paulo'));

    expect(result.current).toMatchObject({
      status: 'error',
      error: 'Não foi possível consultar os dados do tempo. Tente novamente.',
    });
  });
});

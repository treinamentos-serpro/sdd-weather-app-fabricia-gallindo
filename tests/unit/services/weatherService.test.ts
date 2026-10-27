import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWithTimeout,
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../../src/services/weatherService';
import type { City } from '../../../src/types/weather';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('fetchWithTimeout', () => {
  it('returns the response and clears the timer after success', async () => {
    vi.useFakeTimers();
    const response = new Response('{}');
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    await expect(fetchWithTimeout('https://example.test')).resolves.toBe(response);

    const signal = fetchMock.mock.calls[0][1].signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(signal.aborted).toBe(false);
  });

  it('aborts at exactly ten seconds and clears the timer', async () => {
    vi.useFakeTimers();
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, { signal }: RequestInit) => {
        requestSignal = signal ?? undefined;
        return new Promise<Response>((_resolve, reject) => {
          signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        });
      }),
    );
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const request = fetchWithTimeout('https://example.test');
    const rejection = expect(request).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'A requisição demorou demais.',
      status: undefined,
    });

    await vi.advanceTimersByTimeAsync(9_999);
    expect(requestSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await rejection;
    expect(requestSignal?.aborted).toBe(true);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    [new DOMException('Aborted', 'AbortError'), 'A requisição demorou demais.'],
    [new TypeError('Failed to fetch'), 'Falha de rede.'],
  ])('converts %s to WeatherServiceError and clears the timer', async (error, message) => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const request = fetchWithTimeout('https://example.test');

    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toThrow(message);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves unexpected errors and still clears the timer', async () => {
    vi.useFakeTimers();
    const error = new Error('Unexpected error');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    await expect(fetchWithTimeout('https://example.test')).rejects.toBe(error);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('getWeather', () => {
  const city: City = {
    id: 3448439,
    name: 'São Paulo',
    latitude: -23.55,
    longitude: -46.63,
    country: 'Brasil',
    countryCode: 'BR',
    admin1: 'São Paulo',
    timeZone: null,
    contextLabel: 'São Paulo, Brasil',
  };
  const dates = ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'];
  const current = {
    time: '2026-10-27T15:00',
    temperature_2m: 25,
    apparent_temperature: 27,
    relative_humidity_2m: 65,
    is_day: 1,
    weather_code: 3,
    precipitation: 0,
    wind_speed_10m: 12,
  };
  const daily = {
    time: dates,
    weather_code: [0, 1, 2, 3, 61],
    temperature_2m_min: [10, 11, 12, 13, 14],
    temperature_2m_max: [20, 21, 22, 23, 24],
    precipitation_probability_max: [0, 10, 20, 30, 40],
    precipitation_sum: [0, 1, 2, 3, 4],
    wind_speed_10m_max: [15, 16, 17, 18, 19],
  };

  it('requests forecast variables and maps current and parallel daily arrays', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T18:00:00Z'));
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ timezone: 'America/Sao_Paulo', current, daily })),
      );
    vi.stubGlobal('fetch', fetchMock);

    const weather = await getWeather(city);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      latitude: '-23.55',
      longitude: '-46.63',
      current:
        'temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,precipitation,wind_speed_10m',
      daily:
        'weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max',
      timezone: 'auto',
      forecast_days: '5',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm',
    });
    expect(weather).toEqual({
      city: { ...city, timeZone: 'America/Sao_Paulo' },
      current: {
        time: current.time,
        temperatureC: 25,
        apparentTemperatureC: 27,
        relativeHumidityPercent: 65,
        isDay: true,
        weatherCode: 3,
        precipitationMm: 0,
        windSpeedKmh: 12,
      },
      forecast: dates.map((date, index) => ({
        date,
        weatherCode: daily.weather_code[index],
        temperatureMinC: 10 + index,
        temperatureMaxC: 20 + index,
        precipitationProbabilityPercent: index * 10,
        precipitationMm: index,
        windSpeedMaxKmh: 15 + index,
      })),
      fetchedAt: '2026-10-27T18:00:00.000Z',
    });
    expect(city.timeZone).toBeNull();
  });

  it.each([
    [0, false],
    [1, true],
    [null, null],
  ])('maps is_day %s and normalizes missing measurements to null', async (isDay, expected) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            current: { time: current.time, is_day: isDay },
            daily: { time: dates },
          }),
        ),
      ),
    );

    const weather = await getWeather(city);

    expect(weather.current).toEqual({
      time: current.time,
      temperatureC: null,
      apparentTemperatureC: null,
      relativeHumidityPercent: null,
      isDay: expected,
      weatherCode: null,
      precipitationMm: null,
      windSpeedKmh: null,
    });
    expect(weather.forecast).toEqual(
      dates.map((date) => ({
        date,
        weatherCode: null,
        temperatureMinC: null,
        temperatureMaxC: null,
        precipitationProbabilityPercent: null,
        precipitationMm: null,
        windSpeedMaxKmh: null,
      })),
    );
    expect(weather.city).toEqual(city);
  });

  it('returns exactly five days even when the response contains more', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            current,
            daily: { ...daily, time: [...dates, '2026-11-01'] },
          }),
        ),
      ),
    );

    expect((await getWeather(city)).forecast.map((day) => day.date)).toEqual(dates);
  });

  it.each([
    null,
    {},
    { current },
    { daily },
    { current: null, daily },
    { current, daily: null },
    { current: {}, daily },
    { current, daily: {} },
    { current, daily: { time: dates.slice(0, 4) } },
    { current, daily: { time: [...dates.slice(0, 4), null] } },
  ])('rejects an incomplete forecast: %j', async (payload) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))));

    const request = getWeather(city);

    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toThrow('Resposta meteorológica incompleta.');
  });

  it.each([400, 429, 500])('rejects HTTP %s before parsing the response', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json', { status })));

    const request = getWeather(city);

    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toMatchObject({ status });
  });

  it.each([
    [new TypeError('Failed to fetch'), 'Falha de rede.'],
    [new DOMException('Aborted', 'AbortError'), 'A requisição demorou demais.'],
  ])('normalizes transport errors: %s', async (error, message) => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

    const request = getWeather(city);
    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toThrow(message);
  });

  it('rejects invalid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json')));

    await expect(getWeather(city)).rejects.toBeInstanceOf(SyntaxError);
  });
});

describe('searchCities', () => {
  it.each(['', '   ', '\t\n'])('returns no cities without fetching for %j', async (name) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities(name)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('encodes the trimmed name and maps every result to City', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 3448439,
              name: 'São Paulo',
              latitude: -23.55,
              longitude: -46.63,
              country: 'Brasil',
              country_code: 'BR',
              admin1: 'São Paulo',
              timezone: 'America/Sao_Paulo',
              population: 12300000,
            },
            { id: 2, name: 'Outra cidade', latitude: 0, longitude: 0 },
          ],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const cities = await searchCities("  São Paulo & Água-d'Oeste?  ");

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent("São Paulo & Água-d'Oeste?")}&language=pt&format=json`,
      { signal: expect.any(AbortSignal) },
    );
    expect(cities).toEqual([
      {
        id: 3448439,
        name: 'São Paulo',
        latitude: -23.55,
        longitude: -46.63,
        country: 'Brasil',
        countryCode: 'BR',
        admin1: 'São Paulo',
        timeZone: 'America/Sao_Paulo',
        contextLabel: 'São Paulo, Brasil',
      },
      {
        id: 2,
        name: 'Outra cidade',
        latitude: 0,
        longitude: 0,
        country: null,
        countryCode: null,
        admin1: null,
        timeZone: null,
        contextLabel: '',
      },
    ]);
  });

  it.each([{}, { results: [] }])('returns no cities for %j', async (payload) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))));

    await expect(searchCities('Inexistente')).resolves.toEqual([]);
  });

  it.each([400, 429, 500])('throws WeatherServiceError for HTTP %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json', { status })));

    const request = searchCities('São Paulo');

    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toMatchObject({
      name: 'WeatherServiceError',
      status,
      message: `Não foi possível buscar cidades (HTTP ${status}).`,
    });
  });

  it.each([
    [new TypeError('Failed to fetch'), 'Falha de rede.'],
    [new DOMException('Aborted', 'AbortError'), 'A requisição demorou demais.'],
  ])('normalizes transport errors instead of returning an empty result: %s', async (error, message) => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

    const request = searchCities('São Paulo');
    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toThrow(message);
  });
});

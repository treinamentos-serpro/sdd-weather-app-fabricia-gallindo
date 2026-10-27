import type { City, ForecastDay, WeatherData } from '../types/weather';

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string | null;
  country_code?: string | null;
  admin1?: string | null;
  timezone?: string | null;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

interface ForecastResponse {
  timezone?: string | null;
  current?: {
    time: string;
    temperature_2m?: number | null;
    apparent_temperature?: number | null;
    relative_humidity_2m?: number | null;
    is_day?: 0 | 1 | null;
    weather_code?: number | null;
    precipitation?: number | null;
    wind_speed_10m?: number | null;
  } | null;
  daily?: {
    time: string[];
    weather_code?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    temperature_2m_max?: (number | null)[];
    precipitation_probability_max?: (number | null)[];
    precipitation_sum?: (number | null)[];
    wind_speed_10m_max?: (number | null)[];
  } | null;
}

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

export async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'AbortError'
    ) {
      throw new WeatherServiceError('A requisição demorou demais.');
    }
    if (error instanceof TypeError) {
      throw new WeatherServiceError('Falha de rede.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) {
    return [];
  }

  const response = await fetchWithTimeout(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&language=pt&format=json`,
  );

  if (!response.ok) {
    throw new WeatherServiceError(
      `Não foi possível buscar cidades (HTTP ${response.status}).`,
      response.status,
    );
  }

  const data: GeocodingResponse = await response.json();

  return (data.results ?? []).map((result) => ({
    id: result.id,
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    country: result.country ?? null,
    countryCode: result.country_code ?? null,
    admin1: result.admin1 ?? null,
    timeZone: result.timezone ?? null,
    contextLabel: [result.admin1, result.country].filter(Boolean).join(', '),
  }));
}

export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
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
  const response = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?${params}`);

  if (!response.ok) {
    throw new WeatherServiceError(
      `Não foi possível consultar o clima (HTTP ${response.status}).`,
      response.status,
    );
  }

  const data: ForecastResponse | null = await response.json();
  const current = data?.current;
  const daily = data?.daily;

  if (
    !current ||
    !daily ||
    typeof current.time !== 'string' ||
    !current.time ||
    !Array.isArray(daily.time) ||
    daily.time.length < 5 ||
    daily.time.slice(0, 5).some((date) => typeof date !== 'string' || !date)
  ) {
    throw new WeatherServiceError('Resposta meteorológica incompleta.', response.status);
  }

  const forecast: ForecastDay[] = daily.time.slice(0, 5).map((date, index) => ({
    date,
    weatherCode: daily.weather_code?.[index] ?? null,
    temperatureMinC: daily.temperature_2m_min?.[index] ?? null,
    temperatureMaxC: daily.temperature_2m_max?.[index] ?? null,
    precipitationProbabilityPercent: daily.precipitation_probability_max?.[index] ?? null,
    precipitationMm:
      daily.precipitation_sum?.[index] === null ? 0 : (daily.precipitation_sum?.[index] ?? null),
    windSpeedMaxKmh: daily.wind_speed_10m_max?.[index] ?? null,
  }));

  return {
    city: { ...city, timeZone: data?.timezone ?? city.timeZone },
    current: {
      time: current.time,
      temperatureC: current.temperature_2m ?? null,
      apparentTemperatureC: current.apparent_temperature ?? null,
      relativeHumidityPercent: current.relative_humidity_2m ?? null,
      isDay: current.is_day == null ? null : current.is_day === 1,
      weatherCode: current.weather_code ?? null,
      precipitationMm: current.precipitation === null ? 0 : (current.precipitation ?? null),
      windSpeedKmh: current.wind_speed_10m ?? null,
    },
    forecast,
    fetchedAt: new Date().toISOString(),
  };
}

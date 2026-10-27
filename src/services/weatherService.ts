import type { City, ForecastDay, WeatherData } from '../types/weather';

interface GeocodingResult {
  id?: number | null;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  country?: string | null;
  country_code?: string | null;
  admin1?: string | null;
  timezone?: string | null;
}

interface GeocodingResponse {
  results?: GeocodingResult[] | null;
}

interface ForecastResponse {
  timezone?: string | null;
  current?: {
    time?: string | null;
    temperature_2m?: number | null;
    apparent_temperature?: number | null;
    relative_humidity_2m?: number | null;
    is_day?: 0 | 1 | null;
    weather_code?: number | null;
    precipitation?: number | null;
    wind_speed_10m?: number | null;
  } | null;
  daily?: {
    time?: (string | null)[] | null;
    weather_code?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    temperature_2m_max?: (number | null)[];
    precipitation_probability_max?: (number | null)[];
    precipitation_sum?: (number | null)[];
    wind_speed_10m_max?: (number | null)[];
  } | null;
}

const REQUEST_TIMEOUT_MS = 10_000;
const INVALID_RESPONSE_MESSAGE = 'O serviço retornou dados inválidos. Tente novamente.';

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

function getHttpErrorMessage(action: string, status: number): string {
  if (status === 429) {
    return 'O serviço está recebendo muitas solicitações. Aguarde um pouco e tente novamente.';
  }
  if (status >= 500) {
    return 'O serviço está temporariamente indisponível. Tente novamente.';
  }
  return `Não foi possível ${action}. Tente novamente.`;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
}

async function requestWithTimeout<T>(
  url: string,
  readResponse: (response: Response) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return await readResponse(response);
  } catch (error) {
    if (error instanceof WeatherServiceError) {
      throw error;
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'AbortError'
    ) {
      throw new WeatherServiceError(
        'A solicitação excedeu o limite de 10 segundos. Verifique sua conexão e tente novamente.',
      );
    }
    if (error instanceof TypeError) {
      throw new WeatherServiceError(
        'Não foi possível conectar ao serviço. Verifique sua conexão com a internet e tente novamente.',
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function fetchWithTimeout(url: string): Promise<Response> {
  return requestWithTimeout(url, async (response) => response);
}

async function fetchJsonWithTimeout<T>(url: string, action: string): Promise<T> {
  return requestWithTimeout(url, async (response) => {
    if (!response.ok) {
      throw new WeatherServiceError(getHttpErrorMessage(action, response.status), response.status);
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new WeatherServiceError('O serviço retornou uma resposta inválida. Tente novamente.');
      }
      throw error;
    }
  });
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) {
    return [];
  }

  const data = await fetchJsonWithTimeout<GeocodingResponse>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&language=pt&format=json`,
    'buscar cidades',
  );

  const results = data?.results ?? [];
  if (!Array.isArray(results)) {
    throw new WeatherServiceError(INVALID_RESPONSE_MESSAGE);
  }

  return results.map((result) => {
    const id = finiteNumber(result?.id);
    const name = optionalString(result?.name);
    const latitude = finiteNumber(result?.latitude);
    const longitude = finiteNumber(result?.longitude);

    if (id === null || name === null || latitude === null || longitude === null) {
      throw new WeatherServiceError(INVALID_RESPONSE_MESSAGE);
    }

    const country = optionalString(result.country);
    const countryCode = optionalString(result.country_code);
    const admin1 = optionalString(result.admin1);

    return {
      id,
      name,
      latitude,
      longitude,
      country,
      countryCode,
      admin1,
      timeZone: optionalString(result.timezone),
      contextLabel: [admin1, country].filter(Boolean).join(', '),
    };
  });
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
  const data = await fetchJsonWithTimeout<ForecastResponse | null>(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    'consultar o clima',
  );
  const current = data?.current;
  const daily = data?.daily;

  if (
    !current ||
    !daily ||
    typeof current.time !== 'string' ||
    !current.time ||
    !Array.isArray(daily.time) ||
    daily.time.length < 5
  ) {
    throw new WeatherServiceError(
      'O serviço não retornou todos os dados necessários. Tente novamente.',
    );
  }

  const forecastDates = daily.time.slice(0, 5).filter(isValidDate);
  if (forecastDates.length < 5) {
    throw new WeatherServiceError(
      'O serviço não retornou todos os dados necessários. Tente novamente.',
    );
  }

  const forecast: ForecastDay[] = forecastDates.map((date, index) => ({
    date,
    weatherCode: finiteNumber(daily.weather_code?.[index]),
    temperatureMinC: finiteNumber(daily.temperature_2m_min?.[index]),
    temperatureMaxC: finiteNumber(daily.temperature_2m_max?.[index]),
    precipitationProbabilityPercent: finiteNumber(daily.precipitation_probability_max?.[index]),
    precipitationMm: finiteNumber(daily.precipitation_sum?.[index]),
    windSpeedMaxKmh: finiteNumber(daily.wind_speed_10m_max?.[index]),
  }));

  return {
    city: { ...city, timeZone: optionalString(data?.timezone) ?? city.timeZone },
    current: {
      time: current.time,
      temperatureC: finiteNumber(current.temperature_2m),
      apparentTemperatureC: finiteNumber(current.apparent_temperature),
      relativeHumidityPercent: finiteNumber(current.relative_humidity_2m),
      isDay: current.is_day === 0 ? false : current.is_day === 1 ? true : null,
      weatherCode: finiteNumber(current.weather_code),
      precipitationMm: finiteNumber(current.precipitation),
      windSpeedKmh: finiteNumber(current.wind_speed_10m),
    },
    forecast,
    fetchedAt: new Date().toISOString(),
  };
}

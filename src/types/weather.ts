export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
  countryCode: string | null;
  admin1: string | null;
  timeZone: string | null;
  contextLabel: string;
}

export interface CurrentWeather {
  time: string;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  relativeHumidityPercent: number | null;
  isDay: boolean | null;
  weatherCode: number | null;
  precipitationMm: number | null;
  windSpeedKmh: number | null;
}

export interface ForecastDay {
  date: string;
  weatherCode: number | null;
  temperatureMinC: number | null;
  temperatureMaxC: number | null;
  precipitationProbabilityPercent: number | null;
  precipitationMm: number | null;
  windSpeedMaxKmh: number | null;
}

export interface WeatherData {
  city: City;
  current: CurrentWeather;
  forecast: ForecastDay[];
  fetchedAt: string;
}

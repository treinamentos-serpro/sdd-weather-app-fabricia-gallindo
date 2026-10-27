import type { Page } from '@playwright/test';
import { weatherDataMock } from '../../../src/mocks/weather';
import type { WeatherData } from '../../../src/types/weather';

export async function mockWeatherApi(page: Page, data: WeatherData = weatherDataMock) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'geocoding-api.open-meteo.com') {
      const query = url.searchParams.get('name');
      if (query === 'loading') return;
      if (query === 'error') {
        await route.fulfill({ status: 503, json: {} });
        return;
      }
      await route.fulfill({
        json: {
          results:
            query === 'empty'
              ? []
              : [
                  {
                    id: data.city.id,
                    name: data.city.name,
                    latitude: data.city.latitude,
                    longitude: data.city.longitude,
                    country: data.city.country,
                    country_code: data.city.countryCode,
                    admin1: data.city.admin1,
                    timezone: data.city.timeZone,
                  },
                ],
        },
      });
      return;
    }
    if (url.hostname === 'api.open-meteo.com') {
      await route.fulfill({
        json: {
          timezone: data.city.timeZone,
          current: {
            time: data.current.time,
            temperature_2m: data.current.temperatureC,
            apparent_temperature: data.current.apparentTemperatureC,
            relative_humidity_2m: data.current.relativeHumidityPercent,
            is_day: data.current.isDay == null ? null : Number(data.current.isDay),
            weather_code: data.current.weatherCode,
            precipitation: data.current.precipitationMm,
            wind_speed_10m: data.current.windSpeedKmh,
          },
          daily: {
            time: data.forecast.map((day) => day.date),
            weather_code: data.forecast.map((day) => day.weatherCode),
            temperature_2m_min: data.forecast.map((day) => day.temperatureMinC),
            temperature_2m_max: data.forecast.map((day) => day.temperatureMaxC),
            precipitation_probability_max: data.forecast.map(
              (day) => day.precipitationProbabilityPercent,
            ),
            precipitation_sum: data.forecast.map((day) => day.precipitationMm),
            wind_speed_10m_max: data.forecast.map((day) => day.windSpeedMaxKmh),
          },
        },
      });
      return;
    }
    if (url.origin !== 'http://localhost:5173') {
      await route.abort();
      return;
    }
    await route.continue();
  });
}

export async function searchCity(page: Page, name: string) {
  await page.getByRole('searchbox').fill(name);
  await page.getByRole('searchbox').press('Enter');
}

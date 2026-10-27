import { expect, test } from '@playwright/test';
import { weatherDataMock } from '../../src/mocks/weather';
import { mockWeatherApi } from './fixtures/weather';

for (const failure of ['network', 'rate-limit', 'incomplete'] as const) {
  test(`recovers from a forecast ${failure} failure without repeating geocoding`, async ({
    page,
  }) => {
    await mockWeatherApi(page);
    let geocodingRequests = 0;
    page.on('request', (request) => {
      if (new URL(request.url()).hostname === 'geocoding-api.open-meteo.com') {
        geocodingRequests += 1;
      }
    });
    await page.route(
      'https://api.open-meteo.com/**',
      async (route) => {
        if (failure === 'network') {
          await route.abort('failed');
        } else if (failure === 'rate-limit') {
          await route.fulfill({ status: 429, json: {} });
        } else {
          await route.fulfill({ json: { current: { time: '2026-10-27T14:45' } } });
        }
      },
      { times: 1 },
    );
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();

    const message = {
      network:
        'Não foi possível conectar ao serviço. Verifique sua conexão com a internet e tente novamente.',
      'rate-limit':
        'O serviço está recebendo muitas solicitações. Aguarde um pouco e tente novamente.',
      incomplete: 'O serviço não retornou todos os dados necessários. Tente novamente.',
    }[failure];
    await expect(page.getByRole('alert')).toContainText(message);
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.getByRole('searchbox', { name: 'Cidade' })).toBeEnabled();

    await page.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(
      page.getByRole('region', { name: 'São Paulo', exact: true }).getByText('25,4 °C'),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(geocodingRequests).toBe(1);
  });
}

test('preserves forecast dates and unavailable temperatures when switching units', async ({
  page,
}) => {
  await mockWeatherApi(page, {
    ...weatherDataMock,
    current: { ...weatherDataMock.current, temperatureC: null },
    forecast: weatherDataMock.forecast.map((day, index) =>
      index === 0 ? { ...day, temperatureMinC: null, temperatureMaxC: 0 } : day,
    ),
  });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  const currentWeather = page.getByRole('region', { name: 'São Paulo', exact: true });
  await expect(
    currentWeather.getByRole('paragraph').filter({ hasText: /^Indisponível$/ }),
  ).toBeVisible();
  const days = page.getByRole('region', { name: 'Previsão diária' }).getByRole('listitem');
  await expect(days).toHaveCount(5);
  const dates = await days.getByRole('heading', { level: 3 }).allTextContents();
  await expect(days.first().getByText('0,0 °C', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '°F Fahrenheit' }).click();

  await expect(
    currentWeather.getByRole('paragraph').filter({ hasText: /^Indisponível$/ }),
  ).toBeVisible();
  await expect(days.first().getByText('Indisponível', { exact: true })).toBeVisible();
  await expect(days.first().getByText('32,0 °F', { exact: true })).toBeVisible();
  await expect(days).toHaveCount(5);
  expect(await days.getByRole('heading', { level: 3 }).allTextContents()).toEqual(dates);
  await expect(page.getByRole('main').getByText(/°C/)).toHaveCount(0);
});

test('shows an empty state when geocoding returns no results property', async ({ page }) => {
  await mockWeatherApi(page);
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: {} }),
  );
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Cidade' }).fill('empty');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(
    page.getByRole('heading', { name: 'Nenhuma cidade encontrada', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Previsão diária' })).toHaveCount(0);
});

test('preserves the previous city when geocoding returns an empty results array', async ({
  page,
}) => {
  await mockWeatherApi(page);
  let forecastRequests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).hostname === 'api.open-meteo.com') forecastRequests += 1;
  });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
  expect(forecastRequests).toBe(1);

  await page.getByRole('searchbox', { name: 'Cidade' }).fill('empty');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(
    page.getByRole('heading', { name: 'Nenhuma cidade encontrada', exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/A última consulta continua sendo para São Paulo/)).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Cidade' })).toHaveValue('empty');
  await expect(page.getByRole('searchbox', { name: 'Cidade' })).toBeEnabled();
  expect(forecastRequests).toBe(1);
});

for (const query of ['', '   ']) {
  test(`preserves the current city and skips requests for ${query ? 'whitespace' : 'empty'} input`, async ({
    page,
  }) => {
    await mockWeatherApi(page);
    let geocodingRequests = 0;
    let forecastRequests = 0;
    page.on('request', (request) => {
      const hostname = new URL(request.url()).hostname;
      if (hostname === 'geocoding-api.open-meteo.com') geocodingRequests += 1;
      if (hostname === 'api.open-meteo.com') forecastRequests += 1;
    });
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
    expect(geocodingRequests).toBe(1);
    expect(forecastRequests).toBe(1);

    await page.getByRole('searchbox', { name: 'Cidade' }).fill(query);
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();

    await expect(page.getByRole('alert')).toHaveText('Informe o nome de uma cidade.');
    await expect(page.getByRole('searchbox', { name: 'Cidade' })).toBeFocused();
    await expect(page.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
    expect(geocodingRequests).toBe(1);
    expect(forecastRequests).toBe(1);
  });
}

test('preserves and displays special characters literally in city names', async ({ page }) => {
  await mockWeatherApi(page);
  const searchQuery = "  São José-d'Ávila & Água?  ";
  const returnedCityName = "São José-d'Ávila & Água <b>Centro</b>";
  let geocodingUrl: URL | undefined;
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname === 'geocoding-api.open-meteo.com') geocodingUrl = url;
  });
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        results: [
          {
            id: 123,
            name: returnedCityName,
            latitude: -23.55,
            longitude: -46.63,
            country: 'Brasil',
            admin1: 'São Paulo',
          },
        ],
      },
    }),
  );
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Cidade' }).fill(searchQuery);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  expect(geocodingUrl?.searchParams.get('name')).toBe(searchQuery.trim());
  await expect(page.getByRole('heading', { name: returnedCityName, exact: true })).toBeVisible();
  await expect(page.locator('b')).toHaveCount(0);
});

test('renders unavailable values from a partial forecast without losing its five dates', async ({
  page,
}) => {
  await mockWeatherApi(page);
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        current: {
          time: '2026-10-27T14:45',
          temperature_2m: null,
          weather_code: null,
        },
        daily: {
          time: weatherDataMock.forecast.map((day) => day.date),
        },
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  const currentWeather = page.getByRole('region', { name: 'São Paulo', exact: true });
  await expect(
    currentWeather.getByRole('paragraph').filter({ hasText: /^Indisponível$/ }),
  ).toBeVisible();
  await expect(currentWeather.getByText('Condição indisponível')).toBeVisible();
  const days = page.getByRole('region', { name: 'Previsão diária' }).getByRole('listitem');
  await expect(days).toHaveCount(5);
  for (const day of await days.all()) {
    await expect(day.getByText('Condição indisponível')).toBeVisible();
    await expect(day.getByText('Indisponível').first()).toBeVisible();
  }
  await expect(page.getByText(/NaN|undefined|null/)).toHaveCount(0);
});

test('displays weather after searching at a 375x812 mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockWeatherApi(page);
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
  const currentWeather = page.getByRole('region', { name: 'São Paulo', exact: true });
  await expect(currentWeather.getByText('25,4 °C', { exact: true })).toBeVisible();
  await expect(currentWeather.getByText('Parcialmente nublado', { exact: true })).toBeVisible();

  const forecast = page.getByRole('region', { name: 'Previsão diária', exact: true });
  await expect(forecast).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('searches for a city, displays five forecast days and converts to Fahrenheit', async ({
  page,
}) => {
  await mockWeatherApi(page);
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
  const currentWeather = page.getByRole('region', { name: 'São Paulo', exact: true });
  await expect(currentWeather.getByText('25,4 °C', { exact: true })).toBeVisible();

  const forecast = page.getByRole('region', { name: 'Previsão diária', exact: true });
  await expect(forecast).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);

  await page.getByRole('button', { name: '°F Fahrenheit', exact: true }).click();

  await expect(currentWeather.getByText('77,7 °F', { exact: true })).toBeVisible();
  await expect(currentWeather.getByText('25,4 °C', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '°F Fahrenheit' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

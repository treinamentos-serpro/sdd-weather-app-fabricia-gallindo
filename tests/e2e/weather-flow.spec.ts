import { expect, test } from '@playwright/test';
import { mockWeatherApi, searchCity } from './fixtures/weather';

test('search, forecast, unit conversion and retry work at 320px with intercepted APIs', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await mockWeatherApi(page);
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).hostname.endsWith('open-meteo.com')) apiRequests.push(request.url());
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Sua previsão começa por uma cidade.' }),
  ).toBeVisible();
  expect(apiRequests).toHaveLength(0);
  await searchCity(page, 'São Paulo');
  await expect(page.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(5);
  expect(apiRequests).toHaveLength(2);
  await page.getByRole('button', { name: '°F Fahrenheit' }).click();
  await expect(page.getByText('77,7 °F')).toBeVisible();
  await expect(page.getByRole('main').getByText(/°F/)).toHaveCount(12);
  expect(apiRequests).toHaveLength(2);

  await searchCity(page, 'empty');
  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  await page.route(
    'https://api.open-meteo.com/**',
    (route) => route.fulfill({ status: 503, json: {} }),
    { times: 1 },
  );
  await searchCity(page, 'São Paulo');
  await expect(page.getByRole('alert')).toContainText(
    'O serviço está temporariamente indisponível. Tente novamente.',
  );
  const beforeRetry = apiRequests.length;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByText('77,7 °F')).toBeVisible();
  expect(apiRequests).toHaveLength(beforeRetry + 1);
  expect(new URL(apiRequests.at(-1) ?? '').hostname).toBe('api.open-meteo.com');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

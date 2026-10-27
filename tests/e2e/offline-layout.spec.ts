import { expect, test } from '@playwright/test';

test('offline layout supports all scenarios and unit changes at 320px without API requests', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const apiRequests: string[] = [];
  await page.route('**/*', async (route) => {
    if (['fetch', 'xhr'].includes(route.request().resourceType())) {
      apiRequests.push(route.request().url());
    }
    const url = new URL(route.request().url());
    if (url.origin !== 'http://localhost:5173') {
      await route.abort();
      return;
    }
    await route.continue();
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Sua previsão começa por uma cidade.' }),
  ).toBeVisible();
  await page.getByRole('searchbox').fill('Recife');
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(5);
  await page.getByRole('button', { name: '°F Fahrenheit' }).click();
  await expect(page.getByText('77,7 °F')).toBeVisible();
  await expect(page.getByRole('main').getByText(/°F/)).toHaveCount(12);
  await expect(page.getByRole('main').getByText(/°C/)).toHaveCount(0);

  const scenarios = page.getByRole('combobox', { name: 'Cenário de demonstração' });
  for (const scenario of ['loading', 'empty', 'error', 'success', 'idle']) {
    await scenarios.selectOption(scenario);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    if (scenario === 'loading') {
      await expect(page.getByRole('status')).toBeVisible();
      await expect(page.getByRole('searchbox')).toBeDisabled();
    }
    if (scenario === 'empty') {
      await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
    }
    if (scenario === 'error') {
      await expect(page.getByRole('alert')).toBeVisible();
      await page.getByRole('button', { name: 'Tentar novamente' }).click();
      await expect(page.getByText('77,7 °F')).toBeVisible();
    }
  }
  expect(apiRequests).toEqual([]);
});

import { expect, test } from '@playwright/test';
import { weatherDataMock } from '../../src/mocks/weather';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).origin !== 'http://localhost:5173') {
      await route.abort();
      return;
    }
    await route.continue();
  });
});

for (const width of [320, 375, 640, 768, 1024, 1440]) {
  test(`all scenarios reflow at ${width}px with the expected forecast columns`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const selector = page.getByRole('combobox');
    for (const scenario of ['idle', 'loading', 'empty', 'error', 'success']) {
      await selector.selectOption(scenario);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
    const columns = await page
      .getByRole('list')
      .evaluate((list) => getComputedStyle(list).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width >= 1024 ? 5 : width >= 640 ? 3 : 2);
    for (const unit of ['°F Fahrenheit', '°C Celsius']) {
      await page.getByRole('button', { name: unit }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
  });
}

test('missing data and long labels fit at 320px without clipping', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.route('**/src/mocks/weather.ts', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `export const weatherDataMock = ${JSON.stringify({
        ...weatherDataMock,
        city: {
          ...weatherDataMock.city,
          name: 'UmaCidadeComNomeMuitoLongoSemEspacosParaTestar',
          contextLabel: 'UmaRegiaoAdministrativaMuitoLongaSemEspacos',
        },
        current: {
          ...weatherDataMock.current,
          temperatureC: null,
          apparentTemperatureC: null,
        },
        forecast: weatherDataMock.forecast.map((day) => ({
          ...day,
          temperatureMaxC: null,
          temperatureMinC: null,
          precipitationProbabilityPercent: null,
          weatherCode: 96,
        })),
      })};`,
    });
  });
  await page.goto('/');
  await page.getByRole('combobox').selectOption('success');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const overflowingText = await page
    .locator('main p, main dd, main h2, main h3')
    .evaluateAll((elements) =>
      elements
        .filter(
          (element) =>
            element.getBoundingClientRect().width > 1 &&
            element.scrollWidth > element.clientWidth + 1,
        )
        .map((element) => element.textContent),
    );
  expect(overflowingText).toEqual([]);
});

test('keyboard users can skip the header, correct validation and reach results after search and retry', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();

  await page.getByRole('searchbox').focus();
  await page.keyboard.press('Tab');
  const searchButton = page.getByRole('button', { name: 'Buscar' });
  await expect(searchButton).toBeFocused();
  expect(await searchButton.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe(
    'solid',
  );
  await page.keyboard.press('Enter');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await expect(page.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'true');
  await page.keyboard.type('Recife');
  await expect(page.getByRole('searchbox')).not.toHaveAttribute('aria-invalid', 'true');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Resultado da consulta' })).toBeFocused();

  await page.getByRole('combobox').selectOption('error');
  await page.getByRole('button', { name: 'Tentar novamente' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Resultado da consulta' })).toBeFocused();
  await page.getByRole('button', { name: '°C Celsius' }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '°F Fahrenheit' })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '°F Fahrenheit' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('button labels, placeholder and control boundaries meet contrast thresholds', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('combobox').selectOption('error');
  for (const hovered of [false, true]) {
    for (const control of await page.locator('button, input, select').all()) {
      if (hovered) {
        await control.hover();
      }
      const ratios = await control.evaluate((element) => {
        const style = getComputedStyle(element);
        function parseColor(color: string) {
          const channels = color.match(/[\d.]+/g)?.map(Number);
          if (!channels || channels.length < 3) {
            throw new Error(`Formato de cor não suportado: ${color}`);
          }
          return channels;
        }
        function composite(color: number[], background: number[]) {
          const alpha = color[3] ?? 1;
          return color
            .slice(0, 3)
            .map((value, index) => value * alpha + background[index] * (1 - alpha));
        }
        function backgroundOf(node: Element | null): number[] {
          if (node === null) {
            return [255, 255, 255];
          }
          return composite(
            parseColor(getComputedStyle(node).backgroundColor),
            backgroundOf(node.parentElement),
          );
        }
        function luminance(color: number[]) {
          const channels = color
            .map((value) => value / 255)
            .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        }
        function contrast(first: number[], second: number[]) {
          const a = luminance(first);
          const b = luminance(second);
          return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        }
        const background = backgroundOf(element);
        const outside = backgroundOf(element.parentElement);
        const boundary = composite(parseColor(style.borderTopColor), background);
        const placeholder =
          element instanceof HTMLInputElement
            ? contrast(
                composite(parseColor(getComputedStyle(element, '::placeholder').color), background),
                background,
              )
            : null;
        return {
          text: contrast(composite(parseColor(style.color), background), background),
          boundary: Math.max(contrast(boundary, outside), contrast(background, outside)),
          placeholder,
        };
      });
      expect(ratios.text).toBeGreaterThanOrEqual(4.5);
      expect(ratios.boundary).toBeGreaterThanOrEqual(3);
      if (ratios.placeholder !== null) {
        expect(ratios.placeholder).toBeGreaterThanOrEqual(4.5);
      }
    }
  }
});

test('controls have comfortable touch targets and loading respects reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('combobox').selectOption('error');
  for (const control of await page.locator('button, input, select').all()) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole('combobox').selectOption('loading');
  await expect(page.getByRole('status')).toHaveText('Carregando dados do tempo...');
  expect(
    await page
      .getByRole('status')
      .locator('[aria-hidden="true"]')
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
});

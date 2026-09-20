import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const locale of ['en', 'cn'] as const) {
  const home = locale === 'en' ? '/' : '/cn/';
  test(`${locale}: theme choice survives navigation and both themes are accessible`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(home);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    for (const theme of ['dark', 'light']) {
      await page.locator('[data-theme-toggle]').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(audit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
    }
    await page.locator('[data-theme-toggle]').click();
    await page.locator('.hero-actions a').last().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('.language-link').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test(`${locale}: design flows support keyboard navigation and source inspection`, async ({ page }) => {
    await page.goto(home);
    await page.locator('[data-mapping-id="product_photo"]').click();
    await expect(page.locator('[data-inspector-type]')).toHaveText('Image');
    await expect(page.locator('[data-inspector-id]')).toHaveText('product_photo');
    await page.locator('[data-mapping-id="choose_time"]').click();
    await expect(page.locator('[data-inspector-event]')).toHaveText('installation.open_slots');
    await page.locator('#flow-tab-image').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#flow-tab-sketch')).toBeFocused();
    await expect(page.locator('#flow-panel-sketch')).toBeVisible();
    await expect(page.locator('#flow-panel-sketch')).toContainText('CamoTrackRow');
    await page.keyboard.press('Home');
    await expect(page.locator('#flow-panel-image')).toBeVisible();
    await expect(page.locator('[data-inspector-type]')).toHaveText('KitButton');
    for (const width of [320, 390, 820, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${width}px`).toBeLessThanOrEqual(1);
    }
  });

  test(`${locale}: new guides have working links and readable code in both themes`, async ({ page }) => {
    for (const slug of ['why-octoscript', 'splash-a2app', 'design-to-app']) {
      await page.goto(`${home}docs/${slug}/`);
      await expect(page.locator('article h1')).toHaveCount(1);
      const localLinks = await page.locator('article a').evaluateAll(links => links.map(link => (link as HTMLAnchorElement).href).filter(href => new URL(href).origin === location.origin));
      for (const href of localLinks) expect((await page.request.get(href)).ok(), href).toBe(true);
      for (const theme of ['light', 'dark']) {
        if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('[data-theme-toggle]').click();
        const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), `${slug} / ${theme}`).toEqual([]);
      }
      await page.setViewportSize({ width: 320, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), slug).toBeLessThanOrEqual(1);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.locator('.language-link').click();
      await expect(page).toHaveURL(new RegExp(`/docs/${slug}/$`));
      await expect(page.locator('html')).toHaveAttribute('lang', locale === 'en' ? 'zh-CN' : 'en');
    }
  });
}

test('system theme changes apply until the user explicitly chooses a theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('[data-theme-toggle]').click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('theme switching still works when storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }));
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.locator('[data-theme-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

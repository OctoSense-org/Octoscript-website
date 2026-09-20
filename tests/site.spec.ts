import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const locale of ['en', 'cn'] as const) {
  const home = locale === 'en' ? '/' : '/cn/';
  const other = locale === 'en' ? '/cn/' : '/';
  test(`${locale}: language, accessibility, and working navigation`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(home);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('html')).toHaveAttribute('lang', locale === 'en' ? 'en' : 'zh-CN');
    await expect(page.locator('h1')).toHaveCount(1);
    const brokenAnchors = await page.locator('a[href*="#"]').evaluateAll(links => links.filter(link => {
      const url = new URL((link as HTMLAnchorElement).href);
      return url.pathname === location.pathname && url.hash && !document.getElementById(decodeURIComponent(url.hash.slice(1)));
    }).map(link => link.getAttribute('href')));
    expect(brokenAnchors).toEqual([]);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
    await page.locator('.language-link').click();
    await expect(page).toHaveURL(new RegExp(`${other}$`));
    expect(errors).toEqual([]);
  });

  test(`${locale}: card decisions retain context and can be reset`, async ({ page }) => {
    await page.goto(home);
    const panel = page.locator('#panel-school');
    await panel.locator('summary').click();
    await expect(panel.locator('blockquote')).toContainText(locale === 'en' ? 'Ms. Lin' : '林老师');
    await panel.locator('[data-approve]').click();
    await expect(panel.locator('[data-result]')).toHaveText(locale === 'en' ? 'Confirmed in this demo' : '已在演示中确认');
    await expect(panel.locator('[data-approve]')).toBeDisabled();
    await page.locator('#tab-delivery').click();
    await page.locator('#panel-delivery [data-dismiss]').click();
    await expect(page.locator('#panel-delivery [data-result]')).toContainText(locale === 'en' ? 'no action taken' : '未执行操作');
    await page.locator('#tab-school').click();
    await expect(panel.locator('blockquote')).toBeVisible();
    await expect(panel.locator('[data-approve]')).toBeDisabled();
    await panel.locator('[data-reset]').click();
    await expect(panel.locator('[data-approve]')).toBeEnabled();
    await page.locator('#tab-school').focus();
    await page.keyboard.press('End');
    await expect(page.locator('#tab-travel')).toBeFocused();
    await expect(page.locator('#panel-travel')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-school')).toBeFocused();
  });

  test(`${locale}: responsive home and mobile menu`, async ({ page }) => {
    await page.goto(home);
    for (const width of [320, 390, 600, 820, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${width}px`).toBeLessThanOrEqual(1);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.menu-toggle').click();
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav')).toBeHidden();
    await expect(page.locator('.menu-toggle')).toBeFocused();
    await page.locator('.menu-toggle').click();
    await page.locator('#mobile-nav a').last().click();
    await expect(page).toHaveURL(new RegExp(`${home}docs/$`));
  });

  test(`${locale}: guides render source Markdown and keep language context`, async ({ page }) => {
    for (const slug of ['architecture', 'makepad', 'shared-vm']) {
      await page.goto(`${home}docs/${slug}/`);
      await expect(page.locator('article h1')).toHaveCount(1);
      await expect(page.locator('article')).toContainText('makepad-script');
      const localLinks = await page.locator('article a').evaluateAll(links => links.map(link => (link as HTMLAnchorElement).href).filter(href => new URL(href).origin === location.origin));
      for (const href of localLinks) {
        expect(new URL(href).pathname).not.toMatch(/\.md$/);
        const response = await page.request.get(href);
        expect(response.ok(), href).toBe(true);
      }
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), slug).toEqual([]);
      await page.locator('.language-link').click();
      await expect(page).toHaveURL(new RegExp(`${other}docs/${slug}/$`));
      await page.setViewportSize({ width: 320, height: 800 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), slug).toBeLessThanOrEqual(1);
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
  });
}

test('copy buttons use the active example', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.locator('[data-copy]').click();
  await expect(page.locator('[data-copy-status]')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('use mod.tool');
  await page.locator('#run-tab').click();
  await expect(page.locator('#source-panel')).toBeHidden();
  await page.locator('[data-copy]').click();
  await expect(page.locator('[data-copy-status]')).toHaveText('Copied');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('git clone https://github.com/OctoSense-org/Octoscript.git');
  expect(copied).toContain('run --allow-echo examples/tool_workflow.octoscript');
});

test('static content and language links work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await page.locator('.language-link').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.locator('.hero-actions a').last().click();
  await expect(page).toHaveURL(/\/cn\/docs\/$/);
  await context.close();
});

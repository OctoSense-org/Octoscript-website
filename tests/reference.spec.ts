import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const locale of ['en', 'cn']) {
  const home = locale === 'cn' ? '/cn/' : '/';
  test(`${locale}: self-contained references, searchable catalog and deferred WASM`, async ({page}) => {
    const wasm: string[] = [];
    page.on('request', r => {if(r.url().includes('.wasm'))wasm.push(r.url());});
    for (const slug of ['language-profiles','component-library']) {
      await page.goto(`${home}docs/${slug}/`);
      await expect(page.locator('article h1')).toHaveCount(1);
      for(const theme of ['light','dark']) {
        await page.evaluate(t => document.documentElement.dataset.theme=t,theme);
        const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
        expect(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
      }
      for(const width of [320,390,820,1440]) {
        await page.setViewportSize({width,height:1000});
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
      }
      const links=await page.locator('article a').evaluateAll(a=>a.map(n=>(n as HTMLAnchorElement).href).filter(h=>new URL(h).origin===location.origin));
      for(const href of links)expect((await page.request.get(href)).ok()).toBeTruthy();
    }
    expect(wasm).toEqual([]);
    await page.locator('[data-catalog-search]').fill('CamoTrackRow');
    await expect(page.locator('[data-catalog-group]:visible')).toHaveCount(1);
    await page.locator('[data-catalog-search]').fill('unknown-widget');
    await expect(page.locator('[data-catalog-group]:visible')).toHaveCount(0);
    await page.locator('[data-catalog-search]').fill('');
    await expect(page.locator('[data-catalog-group]:visible')).toHaveCount(12);
  });
}

test('Makepad WASM renders and native controls write state', async ({page}) => {
  test.setTimeout(90000);
  await page.goto('/docs/component-library/');
  await page.locator('[data-lab-launch]').click();
  await expect(page.locator('[data-lab-status]')).toContainText('Running',{timeout:45000});
  const frame=page.frames().find(f=>f.url().includes('/wasm/component-lab/'))!;
  await expect.poll(()=>frame.evaluate(()=>(window as any).__componentLab.snapshot?.nodes)).toBeGreaterThan(0);
  // Input is injected into the native canvas; no JS state setter is used.
  const canvas=frame.locator('canvas');
  await canvas.click({position:{x:220,y:170}});
  await expect.poll(()=>frame.evaluate(()=>(window as any).__componentLab.snapshot?.state?.speed)).toBe(1);
  await canvas.click({position:{x:45,y:306}});
  await expect.poll(()=>frame.evaluate(()=>(window as any).__componentLab.snapshot?.state?.gift)).toBe(1);
  await canvas.click({position:{x:25,y:365}});
  await expect.poll(()=>frame.evaluate(()=>(window as any).__componentLab.snapshot?.state?.updates)).toBe(1);
  await canvas.click({position:{x:160,y:499}});
  await expect.poll(()=>frame.evaluate(()=>(window as any).__componentLab.snapshot?.state?.confirmed)).toBe(1);
  await expect(page.locator('[data-lab-action]')).toHaveText('set:lab_confirm=1');
  await page.locator('[data-lab-preset]').selectOption('1');
  // A fresh browser origin compiles the Flutter shaders on this first mount.
  await expect.poll(()=>frame.evaluate(()=>(window as any).__componentLab.snapshot?.route), {timeout:20000}).toBe('material_3_demo');
  await canvas.click({position:{x:180,y:695}});
  await expect.poll(()=>frame.evaluate(()=>(window as any).__componentLab.snapshot?.route), {timeout:20000}).toBe('material_3_demo/color');
  await page.locator('[data-theme-toggle]').click();
  await expect.poll(()=>frame.evaluate(()=>(window as any).__componentLab.snapshot?.dark), {timeout:20000}).toBe(true);
  await expect.poll(()=>frame.evaluate(()=>(window as any).__componentLab.snapshot?.route)).toBe('material_3_demo/color');
  await page.setViewportSize({width:390,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});

test('WASM failure has an actionable retry', async ({page}) => {
  await page.route('**/component-lab.wasm*', r=>r.abort());
  await page.goto('/docs/component-library/');
  await page.locator('[data-lab-launch]').click();
  await expect(page.locator('[data-lab-status]')).toContainText('Could not load',{timeout:20000});
  await expect(page.locator('[data-lab-launch]')).toHaveText('Restart demo');
});

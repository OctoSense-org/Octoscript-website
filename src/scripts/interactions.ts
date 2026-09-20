// Small, progressively enhanced interactions. No model or service calls here.
document.querySelectorAll<HTMLElement>('[data-tabs]').forEach(group => {
  const tabs = Array.from(group.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const activate = (tab: HTMLButtonElement) => {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls')!);
      if (panel) panel.hidden = !selected;
    });
    const copyStatus = group.querySelector('[data-copy-status]');
    if (copyStatus) copyStatus.textContent = '';
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
      if (next < 0) return;
      event.preventDefault();
      activate(tabs[next]);
      tabs[next].focus();
    });
  });
});

document.querySelectorAll<HTMLElement>('[data-demo-panel]').forEach(panel => {
  const approve = panel.querySelector<HTMLButtonElement>('[data-approve]')!;
  const dismiss = panel.querySelector<HTMLButtonElement>('[data-dismiss]')!;
  const result = panel.querySelector<HTMLElement>('[data-result]')!;
  const reset = panel.querySelector<HTMLButtonElement>('[data-reset]')!;
  const update = (state: 'ready' | 'approved' | 'dismissed') => {
    panel.dataset.state = state;
    result.textContent = panel.dataset[state]!;
    approve.disabled = state !== 'ready';
    dismiss.disabled = state !== 'ready';
  };
  approve.addEventListener('click', () => { update('approved'); reset.focus({ preventScroll: true }); });
  dismiss.addEventListener('click', () => { update('dismissed'); reset.focus({ preventScroll: true }); });
  reset.addEventListener('click', () => { update('ready'); approve.focus({ preventScroll: true }); });
});

document.querySelectorAll<HTMLElement>('[data-copy-area]').forEach(area => {
  const button = area.querySelector<HTMLButtonElement>('[data-copy]')!;
  const status = area.querySelector<HTMLElement>('[data-copy-status]')!;
  button.addEventListener('click', async () => {
    const code = area.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden]) code')!;
    try {
      await navigator.clipboard.writeText(code.textContent || '');
      status.textContent = area.dataset.copied!;
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      status.textContent = area.dataset.copyFailed!;
    }
  });
});

const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const mobileNav = document.querySelector<HTMLElement>('#mobile-nav');
const closeMenu = () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  if (mobileNav) mobileNav.hidden = true;
};
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  if (mobileNav) mobileNav.hidden = !open;
});
mobileNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu(); menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (event.target instanceof Node && !mobileNav?.contains(event.target) && !menuButton?.contains(event.target)) closeMenu();
});
window.matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const themeToggle = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const applyTheme = (theme: 'light' | 'dark') => {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b1017' : '#f5f8fc');
  themeToggle?.setAttribute('aria-label', (theme === 'dark' ? themeToggle.dataset.lightLabel : themeToggle.dataset.darkLabel) || 'Toggle color theme');
};
applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
themeToggle?.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  try { localStorage.setItem('octoscript-theme', theme); } catch {}
});
systemTheme.addEventListener('change', event => {
  let saved;
  try { saved = localStorage.getItem('octoscript-theme'); } catch {}
  if (saved !== 'light' && saved !== 'dark') applyTheme(event.matches ? 'dark' : 'light');
});

document.querySelectorAll<HTMLElement>('[data-mapping-explorer]').forEach(explorer => {
  const buttons = Array.from(explorer.querySelectorAll<HTMLButtonElement>('[data-mapping-id]'));
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    for (const [key, value] of [['id', button.dataset.mappingId], ['type', button.dataset.type], ['event', button.dataset.event], ['detail', button.dataset.detail]]) {
      const field = explorer.querySelector(`[data-inspector-${key}]`);
      if (field) field.textContent = value || '';
    }
    const outline = explorer.querySelector<HTMLElement>('[data-mapping-outline]');
    const [left, top, width, height] = (button.dataset.rect || '').split(',').map(Number);
    if (outline && [left, top, width, height].every(Number.isFinite)) Object.assign(outline.style, { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` });
  }));
});

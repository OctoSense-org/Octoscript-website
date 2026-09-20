import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import docLinks from './doc-links.mjs';

function rewrite(source, url, options, type = 'link') {
  const node = { type, url };
  docLinks(options)({ children: [node] }, { path: fileURLToPath(new URL(`../${source}`, import.meta.url)) });
  return node.url;
}

test('copied documentation keeps local bilingual routes and fragments', () => {
  const source = 'src/content/upstream/octoscript/docs/positioning.zh-CN.md';
  assert.equal(rewrite(source, '../UPSTREAM.zh-CN.md#vm', { base: '/Octoscript-website/' }), '/Octoscript-website/cn/docs/shared-vm/#vm');
  assert.equal(rewrite(source, 'positioning.md'), '/docs/architecture/');
  assert.equal(rewrite(source, 'README.zh-CN.md'), '/cn/docs/');
});

test('optional upstream sources point to the language repository', () => {
  const source = 'src/content/upstream/octoscript/docs/positioning.md';
  assert.equal(rewrite(source, 'grammar.md#syntax'), 'https://github.com/OctoSense-org/Octoscript/blob/main/docs/grammar.md#syntax');
  assert.equal(rewrite(source, '../examples/'), 'https://github.com/OctoSense-org/Octoscript/tree/main/examples');
});

test('website articles resolve other guides, snapshots and reference links', () => {
  const source = 'src/content/guides/why-octoscript.cn.md';
  assert.equal(rewrite(source, 'language-profiles.cn.md'), '/cn/docs/language-profiles/');
  assert.equal(rewrite(source, '../upstream/octoscript/UPSTREAM.zh-CN.md'), '/cn/docs/shared-vm/');
  assert.equal(rewrite(source, 'component-library.cn.md#demo', undefined, 'definition'), '/cn/docs/component-library/#demo');
  assert.equal(rewrite(source, '../../components/Home.astro'), 'https://github.com/OctoSense-org/Octoscript-website/blob/main/src/components/Home.astro');
});

test('external URLs stay unchanged and parent-repository links are rejected', () => {
  const source = 'src/content/guides/why-octoscript.en.md';
  for (const url of ['https://example.org/', 'mailto:team@example.org', '#syntax', '/docs/']) assert.equal(rewrite(source, url), url);
  assert.throws(() => rewrite(source, '../../../../UPSTREAM.md'), /escapes the website repository/);
});

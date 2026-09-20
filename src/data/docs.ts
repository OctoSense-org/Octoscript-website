import * as architectureEn from '../content/upstream/octoscript/docs/positioning.md';
import * as architectureCn from '../content/upstream/octoscript/docs/positioning.zh-CN.md';
import * as makepadEn from '../content/upstream/octoscript/docs/makepad-ui-compatibility.md';
import * as makepadCn from '../content/upstream/octoscript/docs/makepad-ui-compatibility.zh-CN.md';
import * as vmEn from '../content/upstream/octoscript/UPSTREAM.md';
import * as vmCn from '../content/upstream/octoscript/UPSTREAM.zh-CN.md';
import { content, type Locale } from './content';

import * as whyEn from '../content/guides/why-octoscript.en.md';
import * as whyCn from '../content/guides/why-octoscript.cn.md';
import * as splashEn from '../content/guides/splash-a2app.en.md';
import * as splashCn from '../content/guides/splash-a2app.cn.md';
import * as flowsEn from '../content/guides/design-to-app.en.md';
import * as flowsCn from '../content/guides/design-to-app.cn.md';
import * as syntaxEn from '../content/guides/language-profiles.en.md';
import * as syntaxCn from '../content/guides/language-profiles.cn.md';
import * as componentsEn from '../content/guides/component-library.en.md';
import * as componentsCn from '../content/guides/component-library.cn.md';
const modules = {
  en: {'why-octoscript': whyEn, 'splash-a2app': splashEn, 'design-to-app': flowsEn, 'language-profiles': syntaxEn, 'component-library': componentsEn, architecture: architectureEn, makepad: makepadEn, 'shared-vm': vmEn},
  cn: {'why-octoscript': whyCn, 'splash-a2app': splashCn, 'design-to-app': flowsCn, 'language-profiles': syntaxCn, 'component-library': componentsCn, architecture: architectureCn, makepad: makepadCn, 'shared-vm': vmCn},
};
export const guidesFor = (locale: Locale) => content[locale].guides.map(guide => {
  const module = modules[locale][guide.slug as keyof typeof modules.en];
  return {...guide, locale, Content: module.Content, headings: module.getHeadings()};
});

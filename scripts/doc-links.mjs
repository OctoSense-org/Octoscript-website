import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const upstream = 'src/content/upstream/octoscript/';
const routes = {
  ...Object.fromEntries(['why-octoscript', 'splash-a2app', 'design-to-app', 'language-profiles', 'component-library'].flatMap(slug => ['en', 'cn'].map(locale => [`src/content/guides/${slug}.${locale}.md`, `${locale === 'cn' ? '/cn' : ''}/docs/${slug}/`]))),
  ...Object.fromEntries(Object.entries({
  'README.md': '/', 'README.zh-CN.md': '/cn/',
  'docs/README.md': '/docs/', 'docs/README.zh-CN.md': '/cn/docs/',
  'docs/positioning.md': '/docs/architecture/',
  'docs/positioning.zh-CN.md': '/cn/docs/architecture/',
  'docs/makepad-ui-compatibility.md': '/docs/makepad/',
  'docs/makepad-ui-compatibility.zh-CN.md': '/cn/docs/makepad/',
  'UPSTREAM.md': '/docs/shared-vm/', 'UPSTREAM.zh-CN.md': '/cn/docs/shared-vm/',
  }).map(([source, route]) => [upstream + source, route])),
};

// Resolve all content inside this repository. Upstream snapshots retain their
// original relative links, with optional source references pointing to Octoscript.
export default function docLinks({ base = process.env.BASE_PATH || '/' } = {}) {
  const prefix = base.replace(/\/$/, '');
  return (tree, file) => {
    const visit = node => {
      if (['link', 'definition'].includes(node.type) && node.url && !/^(?:[a-z]+:|#|\/)/i.test(node.url)) {
        const [, target, suffix] = node.url.match(/^([^?#]*)(.*)$/);
        const relative = path.relative(root, path.resolve(path.dirname(file.path), target)).split(path.sep).join('/');
        if (relative.startsWith('../') || path.isAbsolute(relative)) {
          throw new Error(`Documentation link escapes the website repository: ${node.url}`);
        }
        const isUpstream = relative.startsWith(upstream);
        const repository = isUpstream ? 'Octoscript' : 'Octoscript-website';
        const source = isUpstream ? relative.slice(upstream.length) : relative;
        node.url = routes[relative]
          ? `${prefix}${routes[relative]}${suffix}`
          : `https://github.com/OctoSense-org/${repository}/${target.endsWith('/') ? 'tree' : 'blob'}/main/${source}${suffix}`;
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

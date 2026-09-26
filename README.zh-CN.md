# Octoscript website

[English](README.md) | 简体中文

[Octoscript](https://github.com/OctoSense-org/Octoscript) 的独立双语网站，维护于 [OctoSense-org/Octoscript-website](https://github.com/OctoSense-org/Octoscript-website)。英文版位于 `/`，简体中文版位于 `/cn/`。

网站介绍这门 DSL 的设计动机、语法、宿主权限、L0–L3 渲染分层、UI 能力等级、Splash、原生组合以及 Agent 工具链。每种语言各有八篇指南，逐一讲解页面上的各项约定。设计到组件的示例配有可搜索的组件目录和一个真实的 Makepad/WebAssembly 实验室。支持浅色和深色主题。

## 本地运行

构建网站只需要 Node.js >= 22.12 和 npm。不需要任何同级仓库、Rust 工具链，也不会拉取远程内容。

```sh
git clone https://github.com/OctoSense-org/Octoscript-website.git
cd Octoscript-website
npm ci
npm run dev
```

打开 **http://localhost:4325** 或 **http://localhost:4325/cn/**。

```sh
npm run test:unit
npm run build
npx playwright install chromium
npm run test:e2e
```

构建会执行 Astro/TypeScript 检查，并把静态站点写入 `dist/`。Playwright 会在 4335 端口自行启动预览，与开发服务器互不影响。若要测试已在运行的预览，请设置 `PLAYWRIGHT_BASE_URL`。浏览器测试覆盖双语导航、无障碍、移动端布局、主题、源码复制、WASM 懒加载、真实原生 canvas 的输入/状态更新以及失败恢复。GitHub Actions 会在 push 和 pull request 时运行这些检查。在 `main` 上，通过检查的构建随后会发布到 GitHub Pages。

## 内容与来源归属

- `src/data/content.ts`：双语界面与首页文案。
- `src/content/guides/`：由网站维护的介绍与参考指南。
- `src/content/upstream/octoscript/`：纳入版本库的快照，包括语言仓库的六份文档、工作流 fixture 及其许可证。`sources.json` 记录原始路径、来源基准提交和精确的文件哈希。快照包含提取时做的本地文档更新；并不声称与该提交逐字节一致。
- `src/data/docs.ts`：把指南和快照组合成文档路由。
- `scripts/doc-links.mjs`：把 Markdown 相对链接映射到本地指南；可选的上游源码引用仍指向语言仓库。
- `src/components/`：首页各板块、组件目录、WASM 面板以及录制的设计流程查看器。
- `src/styles/`：字体排印、响应式布局以及浅色/深色主题 token。
- `public/examples/provenance.json`：图片来源哈希以及已归档设计评审的状态。

所有导入都在本仓库内解析。网站内容请在这里编辑。若要刷新某个上游快照，请先审阅语言仓库中对应的文档，把它复制到相同的快照路径，并更新清单中的哈希和来源记录。语言仓库的变更不会在不知不觉中改变网站。

设计查看器展示的是录制好的映射和原生截图；它不运行视觉模型。已归档的评审仍记录着尚存的视觉差异。购买的 Sketch 素材不会再分发。学校、快递和出行卡片使用仅在浏览器中存在的示例数据；其中的审批不会运行工作流，也不会触发外部操作。

## Makepad / WASM 实验室

`public/wasm/component-lab/` 包含预先构建好的 Rust/Makepad 宿主、浏览器加载器、所需字体、许可证和构建回执。它有意纳入版本库，这样全新检出的网站无需重新构建 Rust 即可运行演示。Material 控件会更新本地 Rust 状态；Flutter 示例是由 Makepad 渲染的 Octoscript 重建版本，而不是 Flutter Engine。部分预设只提供视觉和导航示例，不支持的设备操作以桩实现代替。

Rust 宿主、DSL 源码、精确的依赖版本、运行时补丁和离线构建脚本位于 [`demos/component-lab/`](demos/component-lab/README.zh-CN.md)。重新构建这一可选运行时需要另外准备固定版本的依赖，并安装 Rust 工具链。网站开发和 CI 使用仓库中已包含的包。

## 静态托管

在构建时设置实际的发布源（origin）和可选的路径前缀：

```sh
SITE_URL=https://your-domain.example BASE_PATH=/ npm run build
npm run preview
```

把 `dist/` 上传到静态托管服务。若部署在项目子路径下，请使用 `BASE_PATH=/Octoscript-website/`。路由、资源、Markdown 链接、sitemap 和语言备用链接都会使用这个前缀。在配置发布 URL 之前，默认 URL 仍是本地地址。

生产环境为 <https://octoscript.org/>，由 GitHub Pages 提供服务。`.github/workflows/ci.yml` 使用该源进行构建，对构建产物运行完整测试套件，并在 push 到 `main` 时部署同一份 `dist/`。也可以从 Actions 标签页手动启动。自定义域名在仓库的 Pages 设置中配置，因此不需要 `CNAME` 文件。

## 许可证

继承的 MIT 许可证保留在 `LICENSE` 中，并随上游快照一同保留。Fontsource 许可证位于 `public/font-licenses/`。WASM 分发包在 `public/wasm/component-lab/licenses/` 和 `THIRD_PARTY_NOTICES.md` 中包含 Makepad 的 MIT 许可证、Octoscript-Makepad 的 Apache-2.0 许可证以及所捆绑字体的署名。

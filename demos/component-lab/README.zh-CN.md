# Component lab

[English](README.md) | 简体中文

为网站提供的真实 Rust / Makepad WebAssembly 宿主。Material 使用
语义渲染器和本地数值状态槽。Flutter 设计使用在 `src/flutter.octoscript`
中组装的固定版本上游 kit；它们并不运行 Flutter Engine。`sources.json`
记录输入的版本和文件哈希。

请使用已安装的 Rust nightly（含 rust-src）以及现有的 `cargo-makepad`。
构建脚本离线运行，从不安装工具。准备一份 `sources.json` 中所列 Makepad
版本的隔离检出，应用 `wasm-instance-layout.patch`，然后运行：

```sh
python3 build.py --makepad /path/to/isolated/makepad \
  --kits /path/to/pinned/octoscript-makepad \
  --cargo-makepad /path/to/existing/cargo-makepad
```

`Cargo.toml` 和 `.cargo/config.toml` 是生成的本地路径配置。
`Cargo.lock` 予以保留。`build.py --package-only` 会打包一次已有的构建。
生成的 `public/wasm/component-lab` 以静态方式提供服务；它需要
WebAssembly 和 WebGL，但不需要 COOP/COEP 或 SharedArrayBuffer。

本地运行时补丁把 wasm32 下 DrawVars 末尾的四字节填充移到其最后的
instance 数组之前，使该数组与外层着色器的 live 字段保持连续。
宿主会在启动时检查这一内存布局。此构建之外的原生检出不会被修改。
宿主还省略了固定版本转换器不支持的 RadioButton.active 属性，同时保留其选择动画。
严格的控件求值仍然开启。

只有四个有界的预设 ID 和一个主题标志会从浏览器传入。不会对任何用户
源码求值。命令和状态消息会同时检查来源（origin）和 iframe 身份。
包加载器会阻止 iframe 抢回父页面的焦点。
Material 演示只改变本地状态；浏览器桩实现会报告不支持的
设备能力。部分 Flutter 示例仍只是视觉/导航示例。

验证：网站的 Playwright 测试覆盖原生 canvas 输入、真实的 Rust
状态回执、主题切换、懒加载以及加载失败恢复。两种主题下的视觉
截图保留在被忽略的网站产物中。依赖的编译器警告保留在构建日志中，
而不是被屏蔽。

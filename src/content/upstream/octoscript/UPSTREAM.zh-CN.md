# 上游依赖策略

[English](UPSTREAM.md) | **简体中文**

Octoscript 和 Makepad 的 Splash UI 宿主共享 `makepad-script` VM 实现。本仓库不保存独立的 VM 副本。VM、解析器、derive crate 及其底层依赖来自 OctoSense 的 Makepad fork 的 `octoscript` 分支，通过固定提交的 Git 依赖引入：

```toml
makepad-script = { git = "https://github.com/OctoSense-org/makepad.git", rev = "9069cfaf87960f535f2440d736d223238b88c5b1" }
```

该版本固定在两个清单文件中：`crates/octoscript-core/Cargo.toml` 和 `crates/octoscript-capabilities/Cargo.toml`，两处必须使用相同的 `rev`。`fuzz/Cargo.toml` 仅通过对这两个 crate 的路径依赖间接使用 VM，没有单独固定版本；如果以后直接依赖 `makepad-script`，也必须使用相同的 `rev`。`Cargo.lock` 记录最终解析的提交。

`octoscript` 分支源自 `makepad/makepad dev`，最初导入的提交为 `4f9ce7a8bb3fd19e5c61dcf13edd2e6d4a04cefc`。本仓库之前以本地 vendor 补丁维护的 VM 加固，在 2026-09-13 通过 fork 的 PR #1 移植到了该分支。[VM 加固历史（英文）](docs/vm-hardening-history.md)保留了这些改动的历史说明。本仓库不再维护 VM 本地补丁：VM 改动通过 fork 的 `octoscript` 分支 PR 提交，再通过更新 `rev` 引入 Octoscript。

本仓库仅使用 VM、解析器、derive crate 及其直接底层依赖，不依赖 Makepad 组件、平台脚本、文件系统、进程、定时器或网络模块。新的宿主能力应放在 `crates/octoscript-capabilities`，不应放进 VM。修改 VM 行为必须用于实现已发布的 Octoscript 语言约定，附带针对性的兼容性与流式处理回归测试，并且不能给 VM 增加无需宿主显式授予的权限。

VM 不是工作区成员，因此上游尚未处理的 lint 问题不会影响 Octoscript 自有 crate 的 lint 检查标准。它的测试仍需从固定版本的源码中显式运行：

```sh
cargo test -p makepad-script
cargo test -p makepad-regex
```

## 更新固定版本

1. 先将改动合入 fork 的 `octoscript` 分支。
2. 将两个清单中的 `rev` 更新为新提交，执行 `cargo update -p makepad-script`，同步更新 `Cargo.lock`。
3. 运行 Octoscript 回归测试，以及上面的 `makepad-script` 和 `makepad-regex` 测试，尤其检查流式处理中的优先级和 `try/catch` 恢复行为。
4. 在同一轮变更中，将 OctoSense 和 Octoscript-Makepad 更新到相同的 `rev`。三个使用方应跟踪 `octoscript` 分支上的同一个提交；只更新本仓库会造成版本分歧，不能视为一次完整发布。

与 `makepad/makepad` 上游同步的工作在 fork 中完成；Octoscript 通过常规的 `rev` 更新获取同步结果。

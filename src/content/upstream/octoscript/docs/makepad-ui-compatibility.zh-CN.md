# Makepad UI 集成

[English](makepad-ui-compatibility.md) | **简体中文**

Octoscript 可以描述工作流的界面，并将 UI 节点交给 Makepad 进行原生渲染。两者共享 **`makepad-script` VM 实现**：Octoscript 用它执行工作流，Makepad 的 **Splash** 宿主用它执行组件 DSL。共享依赖详见[上游依赖策略](../UPSTREAM.zh-CN.md)。

## 从 UiNode 到原生组件

```text
LLM 生成的 L0/L1 卡片
  → octoscript-ui-l0：校验与实例化
  → 语义 UiNode + 数据绑定
  → 通过主题／组件 kit 转换
  → 渲染器 UiNode
  → octoscript-makepad：翻译
  → Makepad Splash DSL
  → Splash 组件 / makepad-script
  → Makepad 原生组件
```

[Octoscript-Makepad](https://github.com/OctoSense-org/Octoscript-Makepad) 提供渲染器节点模型、后端翻译和原生组件 kit。嵌入它的 UI 宿主提供数据、组件模块、事件处理和状态保存；宿主适配器把卡片声明的操作连接到应用服务。

L0 的实例化不依赖 VM。Kit 求值和最终的 Splash 组件宿主可以使用共享 VM；这不意味着工作流与 UI 必须运行在同一个 VM 实例中，或拥有相同的可用模块。

[UI 规范（英文）](ui-profile-l0.md)是生成 L0/L1 源码的正式约定。实际卡片组合、主题和交互流程见 [Octoscript-AppCard](https://github.com/OctoSense-org/Octoscript-AppCard)。[定位与架构](positioning.zh-CN.md)进一步说明工作流宿主与 UI 宿主的职责。

## Makepad 宿主与兼容性样例

当前固定版本的 Makepad 源码包含 [`Splash` 组件](https://github.com/OctoSense-org/makepad/blob/9069cfaf87960f535f2440d736d223238b88c5b1/widgets/src/splash.rs)和 [Splash 示例应用](https://github.com/OctoSense-org/makepad/tree/9069cfaf87960f535f2440d736d223238b88c5b1/examples/splash)。该组件提供原生 UI 绑定并挂载组件树。

本仓库保留 [`examples/makepad_ui_counter.octoscript`](../examples/makepad_ui_counter.octoscript) 作为小型解析器兼容性样例。它使用 Makepad UI 的惯例，包括 `View`、`width: Fill`、命名子节点，以及使用宿主提供的 `ui` 句柄的回调。

`makepad_ui_compatibility.rs` 测试通过 `octoscript_core::check_vm_compatibility_named` 校验该样例：在源码大小、词法单元数量和嵌套深度限制内调用固定版本的 Makepad 解析器，不执行代码。测试还确认普通工作流的 `check_syntax` 入口会拒绝该 UI 样例。独立兼容性校验器没有宿主值表，因此不接受 Makepad 的 `@(index)` 宿主值标记。

## 选择入口

| 输入 | 入口与宿主 |
| --- | --- |
| 生成的工作流源码 | 工作流规范校验，再交给配置好的 Octoscript 运行时 |
| 生成的 L0/L1 UI 源码 | UI 规范校验器与实例化器，再交给已注册的 kit 和 UI 渲染器 |
| 可信的 Makepad 组件 DSL | 按需显式检查兼容性，再交给具备所需绑定的 Makepad UI 宿主 |

独立的 `octoscript-cli` 运行工作流规范，不安装组件、事件循环或 `ui`，因此上述 UI 样例不能直接作为 CLI 示例运行。兼容性检查只确认解析器能接受源码，不能证明原生渲染可用，也不授予执行外部操作的权限。UI 集成需要自己的挂载与交互测试。

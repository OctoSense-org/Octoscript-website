# Octoscript–Makepad 组件库

组件库连接生成源码与实际控件。卡片声明“标题、输入框、选择、操作”；kit 提供主题与可复用组合，Makepad 在原生平台或浏览器 WebAssembly 中绘制并处理输入。下方可直接启动真实 Makepad / WASM 演示。

## 三组组件契约

| 组件族 | 输入形态 | 适合什么 |
| --- | --- | --- |
| L0 语义角色 | `TextTitle(text: copy.title)`、`Field(…)`、`Chip(…)` | 生成有明确数据来源、有限状态与有界展开的卡片。 |
| Material 语义对象 | `{t: "button", variant: "filled", label: "Confirm", …}` | 按 Material 3 的角色、状态、变体组合页面；renderer 负责样式。 |
| 来源设计 kit | `TaskplanButton`、`AtroFormField`、`CamoTrackRow` 等 | 复用 Sketch 中提取的 token、命名子部件与完整组件组合，保留来源 ID。 |

Flutter 示例是用 Octoscript–Makepad **重建的设计与交互**，没有把 Flutter Engine 嵌进来，也不等于 Flutter SDK 的逐控件移植。所有 kit 都必须说明自己的输入契约与支持范围。

## 一个能改变状态的 Material 按钮

```text
{t: "button", variant: "filled", label: "Confirm selection",
 key: "lab_confirm", tap: 1}
{t: "text", variant: "titleMedium",
 text: "Confirmed: " + N("lab_confirm", 0)}
```

这是同一屏 children 数组中的两个节点。点击按钮向 `lab_confirm` 写入 1，宿主重新求值，下一节点从同一 slot 读出状态。`key` 只是写入目标，还需要 `tap: 1` 或显式 `action`；只有外观没有状态绑定的按钮不能算交互完成。更换 kit 时保持语义、值和事件，样式交给新的 renderer。

## 组件目录与支持范围

下方目录按实际 constructor、Material 词汇表和注册 kit 分类。**声明存在、绘制正确、交互可用，是三个不同的验证结果。** WASM 演示只对本页实际验证的操作作承诺；设备传感器、权限、系统对话框和外部服务仍由相应宿主提供。

Material 当前已记录可写状态的控件包括 button、chip、checkbox、segmented 和 tabs。radio、toggle、尾部 switch、fab、dropdown、slider 在不同宿主的状态接线存在差异；input、searchbar、日期和时间选择等还需要对应平台的输入与对话框验证。不能因为目录中有名称就假定所有后端都具备同样行为。

Flutter kit 覆盖 Material 3、Cupertino Gallery、Form App、Date Planner、Compass、Platform Design、Photo Search、Testing、导航、动画等示例。部分视觉节点只有导航或展示；设备能力示例在浏览器中返回不可用说明，不伪造手机数据。此处的 Material 交互页特意使用已有可写状态的控件。

## 来源设计组件怎么复用？

一个注册 kit 包含四项：`tokens.json` 保存测量后的颜色、字体、间距与效果；`components.l0` 保存重复结构；`roles.l0` 提供易生成的公共名称；`kit.json` 声明语义角色、类型、子槽与来源凭据。

例如 `CamoTrackRow` 复用封面、曲名、艺人和播放操作，`TaskplanProjectCard` 复用标题、日期、状态与卡片点击。原始 Sketch part ID 绑定到完整组件内部的 `part` 名称，而不是把每个像素重新猜成一块矩形。未知 part、根 ID 不匹配或重复 realized ID 都应拒绝。宿主必须注册 `octoscript-widgets::design` 与 `octoscript-widgets::kit`。

## 在浏览器里体验

启动后，演示中的内容和控件由 Rust → WebAssembly → Makepad WebGL 绘制。页面外侧的选择器只负责选示例、切主题与显示实际运行状态。Material 页可选择配送方式、勾选偏好并确认；Flutter 页可进入子页面、切换颜色和排版示例。交互状态仅保留在当前演示实例，重载即清除。

演示按需加载，以免阅读文档时下载整个渲染器。需要浏览器支持 WebAssembly 与 WebGL；启动失败会显示重试入口。canvas 的辅助技术支持不同于网页表单，目录、语法和说明始终保留为可访问的 HTML 文本。

## 维护与来源

[语言与四层链路](language-profiles.cn.md)定义生成边界；[像素到组件的流程](design-to-app.cn.md)展示实际来源映射。组件依据 [Material 词汇表](https://github.com/OctoSense-org/Octoscript-Makepad/blob/main/components/material/screens/WIDGETS.md)、[Flutter 示例说明](https://github.com/OctoSense-org/Octoscript-Makepad/blob/main/components/flutter/README.md) 和 [原生 kit 契约](https://github.com/OctoSense-org/Octoscript-Makepad/blob/main/docs/native-l0-kits.md)整理；演示的固定源码版本与构建摘要可在演示面板下载。

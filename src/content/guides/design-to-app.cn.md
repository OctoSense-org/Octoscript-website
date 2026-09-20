# 从设计到应用的两条流程

Agent 要做的是把视觉意图连接到真实组件，再验证结果。图片提供外观线索，业务规则、权限和可靠的图表数值则来自其他约定。两条流程都保留「来源元素 → 生成 UI → 运行时组件」的关联，让 Agent 能定位并修正具体组件。

## Flow 1：一张图集，生成一组服务界面

[image-to-appcard-flow](https://github.com/OctoSense-org/Octoscript-AppCard/tree/main/lab/image-to-appcard-flow)以包含一组相关页面的图集为起点。生成前统一描述字体、视觉身份、数据和动作，并明确哪些是应用页面，哪些是桌面服务卡片。

1. **保留与测量。** 保存实际提交的 prompt、原始像素和真实尺寸，检查每个页面的裁切，保留图像坐标与原生画板坐标之间的变换。
2. **建立语义映射。** 结合设计意图、文字和几何测量与审查结果：标题成为 Label，动作成为控件，照片保持为图片。无法确定的区域需要先明确用途。
3. **编译可复用 UI。** 输出 L0、kit、数据和 source-to-widget mapping；提取有明确服务归属的子树，作为可独立挂载的卡片。
4. **接上服务状态。** 由编写好的 reducer 决定状态变化。应用和服务卡片共享稳定 ID，授权、时间冲突、重复事件和撤销语义属于应用逻辑。
5. **检查与修复。** 分别检查组件结构、几何、交互和实际画面。当前原生仪器可直接查询和驱动应用，历史采集也使用过 Studio。
6. **沿同一路径发布界面。** 流程可导出 Makepad WebAssembly、字体与声明的图片素材供 Astro 网站使用，再用真实组件边界测试浏览器交互。

Runner 负责编排阶段，并不自行调用图像模型，也不会从像素自动推导完整应用。Agent 与明确的设计约定负责语义决策。详见[映射规则](https://github.com/OctoSense-org/Octoscript-AppCard/blob/main/lab/image-to-appcard/MAPPING-RULES.md)与[当前原生仪器流程](https://github.com/OctoSense-org/Octoscript-AppCard/blob/main/lab/core/NATIVE-INSTRUMENT.md)。

## 例证：空调送达后预约安装

[空调流程清单](https://github.com/OctoSense-org/Octoscript-AppCard/blob/main/lab/image-to-appcard-flow/examples/aircon.flow.json)描述一个 12 场景服务示例，从购买、物流延伸到安装、日历协调与支付。页面转换由服务状态驱动，而非按动画时间自动前进。

`aircon-05` 是送达后的安装邀约，它的映射体现了关键决策：

| 来源元素 | 运行时组合 | Agent 可以验证什么 |
| --- | --- | --- |
| “空调已送达” | 来源 ID 为 `text_14` 的 `Label` | 真实文字、字体、换行与矩形。 |
| “选择时间” | `KitButton`，包含 `choose_time_control` 和独立文字 | enabled 状态、控件边界及 `installation.open_slots` 事件。 |
| 产品照片 | `Image`，ID 为 `product_photo` | 仅含图片内容的裁切、hash、缩放与裁剪。 |
| 安装卡片 | 带原生子组件的可复用表面 | 所属服务、子节点和独立卡片布局。 |
| “暂不预约” | 独立操作控件 | `installation.defer` 事件；它不等于取消购买订单。 |

首页展示了归档的设计参考和实际原生渲染。该轮评审仍要求继续修正字体、图标和表面效果。它展示组件映射与检查—修复闭环，不代表像素完全一致，也不冒充本次重新执行的原生验收。

用自己的项目路径查看计划：

```sh
bash tools/image-to-appcard-flow.sh plan \
  --project /path/to/service-project \
  --manifest /path/to/service-project/image-to-appcard-flow.json
```

`plan` 只打印阶段和参数，不执行它们。仓库指南说明准备、编译、采证和打包步骤；源图、服务实现及原生构建环境都是明确输入。

## Flow 2：从 Sketch 文档到可复用组件 kit

[sketch-to-appcard](https://github.com/OctoSense-org/Octoscript-AppCard/tree/main/lab/sketch-to-appcard)从结构化设计资料开始：画板、分组、symbol、文字、字体、mask 与稳定 source ID。这条路线能够保留平面截图已经丢失的信息。

```text
Sketch 文档与 source ID
  → 测量后的层级、素材与字体
  → Splash design tree
  → Makepad 原生组件组合
  → 检查／操作／对比／修复
  → 把共享定义提升为 L0 kit
  → 使用 kit 组合新页面
```

文字映射为可检查的 Label，输入框成为可编辑控件，按钮、滑块和选择器有实际交互。受支持的路径保留为矢量，照片或个别尚不支持的图形效果可以成为有记录的图片素材。定量图表必须使用数值组件和明确数据，即使源设计里已经有好看的矢量曲线。

第一步的固定布局导入保留画板，但不会自动产生响应式布局或业务行为。后续 promotion 把共享定义、设计 token 与命名绑定提取为可复用 L0 kit，并检查来源归属和原生树等价性。

## 例证：Taskplan、Atro 与 Camo

仓库记录了 Taskplan、Atro、Camo 等设计系列的导入。复用步骤会识别完整组合，例如 `KitButton`、`KitFormField`、`KitTabBar`、`TaskplanProjectCard` 和 `CamoTrackRow`。

以音乐列表行为例：封面保留为图片，标题与艺人保留为文字，播放目标保留为控件。共享的行定义接收内容与状态参数，每个实例仍保留原 source ID。新页面可以组合这些行，不必逐层复制，也不必为每个页面写专门的 Rust 组件。

对于图表，只有视觉曲线还不够：适配器需要样本、单位与数值域。从参考图测量的数值必须标明近似值，不能当作恢复出来的真实业务数据。只有仪器报告了实际绑定的数值，才能进一步验证数据驱动的行为。

设计包和字体仍遵循原有授权。本站链接到流程，并展示自己的服务示例，不重新分发购买的 Sketch 设计包。

## 为什么这种映射适合 Agent？

**稳定的对应关系：** source ID → 语义角色 → kit 实例 → 实际 widget ID。Agent 能定位到哪个按钮有问题，并修改对应定义。

**可观察的状态：** 文字、选中值、enabled 状态、布局与裁剪可以独立于画面查询。交互测试确认控件实际上做了什么。

**独立的验证证据：** 编译通过不证明视觉一致，画面相似不证明控件有效，按钮被点击不证明服务执行正确。每项检查回答不同的问题。

**可以复用的修复：** 修正一个共享输入框或列表行，可以让所有实例受益。最终获得的是可以编辑的组件系统，以及背后的 Rust 逻辑与服务约定。

这就是实际的 A2App 路径：把测量后的像素或设计对象映射为有来源关系的组件，让 Agent 检查、操控、修正，逐步构成应用。

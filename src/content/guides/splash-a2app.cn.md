# Splash：从 UI 语言到 A2App

Splash 是 Makepad 的可实时编辑脚本与 UI 语言，来自 Rik Arends 主导的 Makepad 项目。它连接对象组合、组件属性、交互行为、Rust 组件和 GPU 绘制。Octoscript 在这套基础上构建面向 Agent 的工作流与生成式应用界面。

这篇指南把语言能力和宿主职责放在一起介绍。Splash 的全部语法并不自动属于 Octoscript 有界工作流 profile。

## 用对象树描述界面

`Type { ... }` 实例化定义，`属性: 值` 设置属性，`名字 := Type { ... }` 为子组件或模板命名。`let` 创建局部绑定，模块通过 `mod.*` 导出共享定义。

```text
View {
    width: Fill
    height: Fit
    flow: Down
    spacing: 12
    title := Label { text: "Ready to build" }
    launch := Button { text: "Run workflow" }
}
```

这是供已注册组件的 UI 宿主使用的界面片段，不是可以直接交给工作流 CLI 的程序。`Fill`、`Fit`、排列方向、间距和内边距表达布局；稳定的名字让应用逻辑和检查工具都能定位到具体组件。

## 复用定义，定制实例

组件定义包含默认属性、继承的绘制属性和行为。实例可以覆盖需要变化的部分。对于有类型的子对象，用 `+:` 合并覆盖，保留未修改的字段与方法。

```text
draw_bg +: { color: #2686a0 }
padding: Inset { left: 16 top: 12 right: 16 bottom: 12 }
```

`PortalList` 中的模板用于实例化可见条目，同一组件定义可以服务一整列数据。模块导出与组件 kit 进一步把复用变成明确的接口。数据如何进入这些实例，仍由宿主决定。

## Rust 提供组件实现与业务逻辑

`script_mod!` 把 Splash 声明嵌入 Rust；`#(Button::register_widget(vm))` 等注册表达式把脚本中的定义连接到 Rust 实现。`#[derive(Script, ScriptHook)]` 及相应字段属性暴露有类型的属性，行为由注册的 Rust 代码实现。

当前 Makepad 的事件处理可以把逻辑继续放在 Rust：

```rust
if self.ui.button(cx, ids!(launch)).clicked(actions) {
    self.ui.label(cx, ids!(status)).set_text(cx, "Running");
}
```

外围应用负责注册模块、持有事件循环并挂载根节点。运行时属性更新与 Splash reload 支持调整表现层，而不必重写业务逻辑。实际可用 API 以宿主及固定依赖版本为准。

## 绘制和动画也是语言的一部分

Splash 可以用 `pixel: fn() { ... }` 等 shader 定义描述 GPU 绘制。实例属性、uniform 与纹理让同一种组件拥有不同外观，Animator 状态表达 hover、按下等过渡。因此，同一套组合系统既能写表单，也能表达图表和高度定制的界面。

这些能力来自 Makepad UI 宿主。工作流使用同一 VM 实现，不代表它自动获得 GPU、文件、进程或网络能力。参考 [Splash 语法与示例](https://github.com/OctoSense-org/makepad/blob/octoscript/docs/agents/splash.md)、[组件实现](https://github.com/OctoSense-org/makepad/tree/octoscript/widgets/src)和[计数器应用](https://github.com/OctoSense-org/makepad/tree/octoscript/examples/counter)。

## 两种 UI 入口，复用同一套基础

**直接写 Splash：** 可信 UI 宿主安装组件并执行其 DSL，保留 Makepad 完整的组合与样式能力。

**生成 L0／L1：** 先检查较窄的 UI 约定，实例化语义 `UiNode`，套用主题／组件 kit，再转换为 Splash。L0 实例化无需 VM；L1 增加有界纯算术。kit 求值与最终 Splash 挂载可以使用共享的 `makepad-script` 实现。

```text
Agent → L0/L1 → 检查后的 UiNode → 可复用 kit → Splash → Makepad 组件
                                              ↑
                                      直接编写 Splash UI
```

这样既复用了 Splash 语言及组件生态，也给生成式卡片建立明确的准入边界。组件声明不会被误送进独立的工作流检查器。详见 [Makepad 集成](../upstream/octoscript/docs/makepad-ui-compatibility.zh-CN.md)。

## 跨平台绘制与平台原生控件

语言描述树，宿主决定树如何呈现。“Makepad 原生组件”指 Makepad 自己实现并在原生或 Web 后端绘制的组件，并不意味着每个 `Button` 都是 Android View、ArkUI 节点或 UIKit 控件。

| 宿主路线 | 谁负责绘制 | 具体实现 |
| --- | --- | --- |
| Makepad | Rust 组件与 GPU 绘制，通过桌面、移动和 WebAssembly 后端运行。 | Splash 宿主与 Octoscript-Makepad kit。 |
| Android 系统控件 | Rust 求值后的树经过 JNI 到 Java builder，由 Java 持有 Android／Material View。 | [Octoscript-Android](https://github.com/OctoSense-org/Octoscript-Android)，含按钮、输入框、弹窗和滑块。 |
| OpenHarmony 系统控件 | Rust 通过原生 C API 创建、布局并连接 ArkUI 节点。 | [Octoscript-OH](https://github.com/OctoSense-org/Octoscript-OH)，ArkTS 保留外壳与平台专属职责。 |
| iOS | Makepad 已有 iOS 后端与原生视图接入点，例如相机预览；完整 UIKit 树需要单独适配器。 | Makepad 跨平台渲染与完整的 Octoscript → UIKit 控件目录是不同能力，后者尚不能由这些仓库证明。 |

切换渲染后端时，数据、动作和 Rust 逻辑仍可共享。组件名与样式需要明确映射到各宿主；任意 Makepad shader 不会自动变成平台控件属性。

## 在同一个页面里组合两类组件

宿主可以把平台表面或控件放进 Makepad 页面：原生相机预览上方叠放 Makepad 控制条，自定义面板旁嵌入系统 WebView，或在 GPU 表面上组合 Android 输入控件。宿主统一协调矩形、裁剪、层级、焦点、键盘、生命周期与可访问性，让用户操作的是一个完整页面。

已有接入点包括：[Video 组件](https://github.com/OctoSense-org/makepad/blob/octoscript/widgets/src/video.rs)挂载原生相机预览；[iOS 后端](https://github.com/OctoSense-org/makepad/blob/octoscript/platform/src/os/apple/ios/ios.rs)管理预览生命周期；[Android bridge](https://github.com/OctoSense-org/makepad/blob/octoscript/platform/src/os/linux/android/android_jni.rs)连接 GL 表面上的原生 composer。它们展示了具体的混合组合能力；任意控件之间的层级、裁剪和事件兼容仍需对应适配。

## Rust 复用的例证：一个相机，两种宿主

[相机项目](https://github.com/OctoSense-org/Octoscript-AppCard/tree/feat/camera-app/apps/camera)拆成 `logic/`、`native/` 和 `oh/`。两个宿主的 Cargo 清单都依赖 `octosense-camera-logic`。

```text
                 octosense-camera-logic
                    状态机 · 场景 · 动作
                    /               \
         native/ Makepad 宿主      oh/ ArkUI 宿主
            L0 + kit 组件         平台 ArkUI 节点
```

共同 crate 持有相机 UI 状态并生成场景。Makepad 宿主把场景转换为 kit 组件，ArkUI 宿主把它映射为平台节点。拍摄、权限与相册交接仍属于各自宿主。这是业务逻辑复用，不是宣称平台 API 完全相同。

## 从 Studio 到应用内的 Agent 仪器

Studio 为人类开发者提供可视化工作流；Makepad 同时把检查与控制原语放进应用自身，使 Agent 无需操作 Studio GUI。开发实例通过 `--remote` 启动后，会在 socket 上提供 loopback HTTP 接口。Studio WebSocket 通道仍是旧工具使用的内部路径。

| 原语 | Agent 可以做什么 |
| --- | --- |
| `/d`、`/snap?q=...` | 查询组件树、ID、类型、文字、状态与当前布局矩形。 |
| `/click`、`/m`、`/k`、`/t` | 通过应用事件循环点击、拖动、滚动、按键与输入文字。 |
| `/g`、`/gseq` | 读取应用自己的渲染帧或连续帧。 |
| `/log` | 把交互行为与应用日志对应起来。 |
| `/tweak/state`、`/tweak/apply`、`/tweak/diff` | 查看反射属性、应用表现层编辑、获取变更记录。 |

Agent 查询最新矩形，操作目标组件，等待一帧，再检查状态和像素，将发现的问题定位回源码。Tweaker 的编辑不会自动写入源文件；Agent 需要把确认后的变更写回，再构建验证。

这里的 headless 指不依赖 Studio GUI，且在支持的平台上可以隐藏原生窗口。视觉验证仍使用真实 GPU 后端，模拟渲染不构成原生画面证明。仪器覆盖范围取决于后端，控制端口属于显式启用仪器的开发构建。见 [app remote control](https://github.com/OctoSense-org/makepad/blob/octoscript/docs/agents/app-remote.md)与 [AppCard 当前仪器流程](https://github.com/OctoSense-org/Octoscript-AppCard/blob/main/lab/core/NATIVE-INSTRUMENT.md)。

这就形成了 A2App 闭环：源码可检查、组件可定位、动作可测试、视觉修改可追溯。[设计到应用的两条流程](design-to-app.cn.md)将它应用到生成图片和 Sketch 文档。

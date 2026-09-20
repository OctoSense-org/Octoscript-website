# 语法、能力等级与 L0–L3 链路

先选择要生成的产物：**工作流源码**描述带授权的操作；**UI 卡片**描述数据、状态与组件；**Splash 组件源码**定义宿主可复用的外观和行为。三者共享技术基础，但使用不同的检查入口和语言约定。

## L0–L3：从卡片到可操作的组件

设计流程中的 L0–L3 是四个**实现层**。每一层有自己的输入、产物和验证方式，编号不代表越来越大的执行权限。

| 实现层 | 清晰定义 | 输入 → 输出 | 应该检查什么？ |
| --- | --- | --- | --- |
| L0 · Profile / realization | 检查 UI 声明，并用宿主提供的数据展开组件、条件和有界集合。 | 卡片 + 数据 → 已检查的 UI 树 | 数据来源、实例 key、组件契约、节点 / 深度 / 工作量预算。 |
| L1 · Kit lowering | 把语义角色翻译为已注册组件库的调用。 | UI 树 + kit → 组件调用源码 | 角色、参数、主题 token、命名子部件及 source ID 保持对应。 |
| L2 · VM / node translation | 用共享 VM 求值 kit，生成通用节点，再翻译为渲染后端的组件描述。 | kit 调用 → UiNode → Splash widget 描述 | 树结构、属性、事件映射；不能把未知组件默默当成成功。 |
| L3 · Native mounting / interaction | 挂载真实控件、计算布局、绘制并分发交互。 | widget 描述 → 屏幕 + 实际事件 | 实际边界、截图、命中测试、状态变化、键盘输入和恢复。 |

例如，像素中的“预约时间”按钮先获得 `source_id`；L0 绑定标题与事件；L1 选择 `KitButton` 及主题；L2 构造实际子节点；L3 点击原生 Button，宿主收到 `installation.open_slots`。四层都通过才说明这个按钮能用；只检查源码或比对一张截图都不足以证明交互完成。

## UI 能力等级：另一个独立维度

卡片头部的 `# level:` 说的是允许使用的**语言能力**，与上面的实现层分开理解。

| 能力等级 | 允许什么 | 当前状态 |
| --- | --- | --- |
| L0 | 数据源、带 shape 的状态、有限转换、带 key 的遍历、条件显示、组件与槽位。无任意算术、函数或命令式 widget 操作。 | 已实现；无头部时按 L0 检查。 |
| L1 | 在 L0 上增加参数位置的纯算术：`+ - * / %`、括号及取负；表达式必须读取声明的数据源或状态。 | 只实现了这项受限扩展，必须显式声明 `# level: L1`。 |
| L2 | 用于描述超出上述约定的命令式行为，例如逐帧 `tick`、直接操作 widget。 | 尚未实现为可接受的 UI profile；检查器在解析前拒绝。 |
| L3 | 没有对应的 UI 语言能力 profile。 | `# level: L3` 被拒绝；L3 只出现在实现链路的命名中。 |

能力判定要检查组件的整个依赖闭包，并取所需的最高等级。不能因为最外层卡片是 L0，就忽略内部组件的新行为。组件版本需要固定；宿主的 artifact approval 另外绑定完整源码、等级、策略版本、kit 与运行时。改动后不能继承不匹配的批准。

## 工作流语法：可生成的最小词汇

规范工作流 profile 是 v0.2。使用 `octoscript check file.octoscript` 检查；UI 卡片则走 Rust `check_ui_l0` 入口。

| 目的 | 写法 | 约定 |
| --- | --- | --- |
| 导入 | `use mod.tool` | 只引用宿主允许的模块；导入不是授权。 |
| 变量 | `let count = 2`，随后 `count += 1` | 声明使用 `let`；标识符区分大小写。 |
| 数据 | `true`、`false`、`nil`、`[1, 2]`、`{name: "Ada"}` | 字符串用双引号；规范 record 不写末尾逗号。 |
| 路径 | `request.name`、`request[key]` | 数据字段与动态文本键访问。 |
| 分支 | `if ok { … } elif pending { … } else { … }` | 分支可产生值；空分支返回 nil。 |
| 函数 | `fn twice(x) { return x * 2 }` | 函数体显式 `return`。 |
| 循环 | `for item in items { … }`、`while ready { … }` | 运行受指令、时间和内存预算限制。 |
| 错误替代 | `try expression catch fallback` | 不带 JavaScript 风格的 `catch(error)` 参数。 |
| 延迟调用 | `tool.start("tool.name", payload).await()` | 宿主提供外部调度与恢复；不是脚本自己的线程。 |

每条语句以换行分隔；紧凑程序可用分号。逻辑运算是 `&&`、`||`、`!`。`and`、`or`、`var`、`match` 等继承词汇不属于规范工作流语法。UI / shader 语法也不能混入这里。

```octoscript
use mod.tool
fn prepare(title) {
    return {title: title, ready: true}
}
let draft = prepare("Release notes")
let summary = if draft.ready {
    draft.title
} else {
    "Not ready"
}
let result = try tool.call("text.echo", summary) catch "Unavailable"
result
```

这段例子展示函数、record、条件值与异常替代。运行仍需要宿主注册并授权 `text.echo`；`catch` 不能补发权限或撤销副作用。

## UI L0 语法：声明关系，不编造事实

以下是完整的本地状态卡片。标题文案声明来源和翻译；`sys.locale()` 由宿主解析。点击 Chip 只切换声明的布尔状态。

```text
# ledger preferences@1.0.0
# level: L0
source env.locale sys.locale()
state updates { shape: bool, initial: false }
event flip { updates: toggle }
copy title { class: vocabulary, en: "Preferences", zh: "偏好设置" }
copy option { class: vocabulary, en: "Updates", zh: "接收更新" }
view root Surface {
    Col {
        TextTitle(text: copy.title)
        Chip(text: copy.option, active: updates, on_tap: flip)
    }
}
```

| 语法 | 意义 |
| --- | --- |
| `source name sys.…(…)` | 声明数据依赖。宿主先解析并注入数据；L0 展开器不会执行任意能力调用。 |
| `state name { shape: …, initial: … }` | 声明有类型的状态单元；状态用于选择和交互。 |
| `event name { field: toggle }` | 只使用规定的总转换：`set(…)`、`toggle`、`cycle(…)`、`clear`。 |
| `when source.$state == .ready { … }` | 根据数据生命周期显示内容；宿主报告 pending / ready / stale / error。 |
| `for item in source.items key item.id { … }` | 用稳定 key 保持实例身份；集合遍历有上限。 |
| `component Name(…) { … }` | 复用带参数、局部状态和事件的组件；`slot` / `into` 组合子内容。 |
| `.primary` 等点前缀 token | 与数据路径明确区分；可用值由角色的参数契约定义。 |

业务数值应来自数据源，文案要声明 provenance，外观交给主题与组件 kit。`TextHero(value: 1547)` 不能用模型编写的字面量伪装成实时读数。默认展开上限是 8,192 个节点、64 层深度、每集合 512 项和 65,536 个工作单元；报告截断时必须作为不完整结果处理。

## UI L1：只扩大表达式范围

```text
# level: L1
// 下列是 view 内的表达式片段，需先声明 shares 与 quote。
TextHero(value: shares * quote.last)
```

乘除与取余先于加减，同级左结合；支持 `(a + b) * c` 与 `n * -1`。公式必须读取声明的数据源或状态，纯字面量计算 `1547 * 3.2` 会被拒绝。检查器也会拒绝能识别的“伪依赖”，如 `quote.last * 0 + 1547`；这不是对任意公式正确性的证明。L1 不增加文件、网络、工具调用或命令式 UI 权限。

## Splash 与组件 kit 的语法边界

Splash 用 `View { … }` 组合对象，`name: value` 设置属性，`name := Type { … }` 声明可定位实例，`draw_bg +: { … }` 合并继承属性。Rust 通过 `script_mod!` 注册组件，`#(expr)` 插入 Rust 绑定。主题、shader、动画与事件由这个受信任的宿主层定义。

Material 语义 kit 则接受 `{t: "button", variant: "filled", label: "Confirm", …}` 这样的对象树。其表达式方言由 kit 宿主接受，**不能据此把任意 `fn` 或对象表达式当作 UI L0**；也不能假设它与规范工作流的控制流语义完全相同。先选择 profile，再按对应语法生成。

[组件目录与浏览器演示](component-library.cn.md)列出每组角色、状态和实际运行入口。[执行模型](why-octoscript.cn.md)解释工具授权与草案审查。

## 规范依据

本页直接整理了语法、UI profile 和实际渲染链路。需要审计实现或版本差异时，可查阅 [工作流规范](https://github.com/OctoSense-org/Octoscript/blob/main/docs/grammar.md)、[UI profile](https://github.com/OctoSense-org/Octoscript/blob/main/docs/ui-profile-l0.md) 和 [原生组件契约](https://github.com/OctoSense-org/Octoscript-Makepad/blob/main/docs/native-l0-kits.md)。

# 定位与架构

[English](positioning.md) | **简体中文**

Octoscript 是一门让 LLM 生成工作流的通用 DSL。模型可以用简洁的代码表达工具编排、数据转换和多步骤行为，供应用审查与执行。

宿主提供可用服务及其接口约定。工作流可以运行在服务端、设备上，也可以成为交互应用的一部分。App Card 是其中一种应用：模型围绕数据和操作组合界面，由宿主持续管理这些数据和操作。

## 共享 VM 与宿主分工

Octoscript 和 Makepad 的 Splash UI 宿主使用同一套 `makepad-script` VM 实现。本仓库通过固定提交的依赖，使用 [OctoSense-org/makepad](https://github.com/OctoSense-org/makepad) 的 `octoscript` 分支。VM 修改在该仓库进行；依赖版本与更新流程见[上游依赖策略](../UPSTREAM.zh-CN.md)。

| 部分 | 职责 |
| --- | --- |
| Makepad `makepad-script` | 共享 VM、解析器与脚本执行机制 |
| Octoscript | 工作流语言约定、审查、执行限制、能力 API、工作流数据流，以及 UI 规范校验与实例化 |
| 嵌入宿主，例如 Octos | 注册服务、绑定账户和数据、授权操作、调度任务、保存应用状态 |
| Octoscript-Makepad | 将 UI 节点转换为 Makepad 组件 DSL，并提供原生组件 kit |
| Makepad Splash 宿主 | 提供组件绑定、挂载生成的组件 DSL，并处理原生渲染与交互 |
| Octoscript-AppCard | App Card 组合、主题使用、交互流程、Agent／客户端集成与端到端示例 |

共享 VM 实现不要求共用同一个 VM 实例、堆或宿主绑定。工作流宿主暴露注册的工具；UI 宿主安装视图所需的组件模块，并接入事件循环。

## 工作流执行路径

```text
LLM 输出
  → Octoscript 源码，或包含源码步骤的有序草案
  → 语法与工具调用审查
  → 宿主选择工具、数据约定与执行策略
  → 在 makepad-script 上执行
  → 宿主管理结果、工作流状态与外部操作
```

工作流语言支持函数、控制流、结构化数据和显式工具调用。宿主可以通过 `mod.tool` 暴露已注册的普通工具，也可以提供经过审查的直接模块接口。延迟调用会把控制权交还给宿主，结果就绪后再恢复执行。

对于多步骤任务，模型提出仅包含数据的草案。宿主创建可执行计划、提供输入、连接已完成步骤的输出，并分配权限。草案本身不会授权工具调用。详见[工作流草案（英文）](workflow-drafts.md)、[工具目录（英文）](tool-catalog.md)和[工作流检查点（英文）](workflow-checkpoints.md)。

## 可选的 UI 路径

```text
生成的 L0/L1 声明
  → 校验后的语义 UiNode 树与数据绑定
  → 主题／组件 kit 与渲染器节点
  → Makepad Splash DSL
  → 使用 makepad-script 的 Splash 宿主
  → Makepad 原生组件
```

这条路径让宿主把 UI 交给渲染层。独立工作流 CLI 无需加载 Makepad 组件，工作流也可以完全不生成界面。宿主把卡片操作连接到应用服务，并向视图提供更新后的数据。

L0 是声明式 UI 规范，包含组件、插槽、数据源、带键集合、状态和事件转换；实例化本身不需要 VM。L1 在此基础上增加有界的纯算术表达式。它们是与工作流语言并列的 UI 规范，并非产品或渲染层的分级。[正式 UI 规范（英文）](ui-profile-l0.md)定义可接受的源码；[Makepad 集成指南](makepad-ui-compatibility.zh-CN.md)说明渲染交接过程。

App Card 的详细设计与使用文档放在 [Octoscript-AppCard](https://github.com/OctoSense-org/Octoscript-AppCard)，包括[组件组合](https://github.com/OctoSense-org/Octoscript-AppCard/blob/main/docs/APP-CARD-COMPONENTIZATION.md)和 [Agent／客户端架构](https://github.com/OctoSense-org/Octoscript-AppCard/blob/main/docs/ARCHITECTURE.md)。原生渲染器与 kit API 位于 [Octoscript-Makepad](https://github.com/OctoSense-org/Octoscript-Makepad)。

## 从哪里开始

编写生成源码时，阅读 [LLM 编写指南（英文）](authoring-for-llms.md)和[正式语法（英文）](grammar.md)。接入应用服务时，阅读[工具目录（英文）](tool-catalog.md)和 [JSON 数据约定（英文）](schema-contracts.md)。运行时、存储和 worker 主题可从[文档索引](README.zh-CN.md)查找。

宿主负责应用权限、需要持久记录的服务操作，以及所需的操作系统隔离。具体实现边界见[安全模型（英文）](../SECURITY.md)和[生产集成指南（英文）](runtime-reference.md#security-model)。

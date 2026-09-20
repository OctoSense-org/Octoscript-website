# Purpose and architecture

**English** | [简体中文](positioning.zh-CN.md)

Octoscript is a generic DSL for LLM-generated workflows. It gives models a
compact way to express tool orchestration, data transformation and multi-step
behavior that an application can inspect and execute.

The host supplies the available services and their contracts. A workflow can
run in a service, on a device or as part of an interactive application. App
Cards are one application: a model composes an interface over data and actions
that the host continues to manage.

## Shared VM, defined host responsibilities

Octoscript and Makepad's Splash UI host use the same `makepad-script` VM
implementation. This repository consumes it as a pinned dependency from the
`octoscript` branch of
[OctoSense-org/makepad](https://github.com/OctoSense-org/makepad).
VM changes belong there; the pin and update policy are in [UPSTREAM.md](../UPSTREAM.md).

| Part | Responsibility |
| --- | --- |
| Makepad `makepad-script` | Shared VM, parser and script execution machinery |
| Octoscript | Workflow language contract, review, execution limits, capability APIs, workflow dataflow and UI profile checking/realization |
| Embedding host, such as Octos | Register services, bind accounts and data, authorize actions, schedule work and retain application state |
| Octoscript-Makepad | Translate UI nodes into Makepad's widget DSL and supply native component kits |
| Makepad Splash host | Provide widget bindings, mount the generated widget DSL and handle native rendering and interaction |
| Octoscript-AppCard | App Card composition, theme usage, interaction flows, agent/client integration and end-to-end examples |

Sharing a VM implementation does not require sharing one VM instance, heap or
set of host bindings. Workflow hosts expose their registered tools; UI hosts
install the widget modules and event-loop integration needed by their views.

## Workflow path

```text
LLM output
  → Octoscript source, or an ordered draft containing source steps
  → syntax and tool-call review
  → host-selected tools, data contracts and execution policy
  → execution on makepad-script
  → results, workflow state and external operations managed by the host
```

The workflow language supports functions, control flow, structured data and
explicit tool calls. A host can expose ordinary registered tools through
`mod.tool`, or reviewed direct module facades. Deferred calls yield to the host
and resume when their results are available.

For multi-step work, a model proposes a data-only draft. The host creates the
executable plan, supplies input, connects completed step outputs and selects
the grants. The draft itself does not authorize a call. See
[workflow drafts](workflow-drafts.md), [tool catalogs](tool-catalog.md) and
[workflow checkpoints](workflow-checkpoints.md).

## Optional UI path

```text
generated L0/L1 declarations
  → checked semantic UiNode tree and data bindings
  → theme/component kit and renderer nodes
  → Makepad Splash DSL
  → Splash host using makepad-script
  → native Makepad widgets
```

The UI path gives a host a rendering handoff. It does not require the
standalone workflow CLI to load Makepad widgets, nor does it make every workflow
produce a screen. The host connects card actions to its services and supplies
updated data to the view.

L0 is declarative: components, slots, sources, keyed collections, state and
event transitions. Its realization does not need a VM. L1 adds bounded pure
arithmetic to that UI profile. These are sibling profiles of the workflow
language, not a sequence of product or rendering layers. The
[formal UI profile](ui-profile-l0.md) defines admission; the
[Makepad integration guide](makepad-ui-compatibility.md) explains the handoff.

Detailed App Card design and usage belong in
[Octoscript-AppCard](https://github.com/OctoSense-org/Octoscript-AppCard), including
[component composition](https://github.com/OctoSense-org/Octoscript-AppCard/blob/main/docs/APP-CARD-COMPONENTIZATION.md)
and the [agent/client architecture](https://github.com/OctoSense-org/Octoscript-AppCard/blob/main/docs/ARCHITECTURE.md).
Native renderer and kit APIs live in
[Octoscript-Makepad](https://github.com/OctoSense-org/Octoscript-Makepad).

## Where to start

Generate source with the [LLM authoring guide](authoring-for-llms.md) and the
[canonical grammar](grammar.md). Embed application services with the
[tool catalog](tool-catalog.md) and [JSON contracts](schema-contracts.md).
The [documentation index](README.md) leads to runtime, storage and worker topics.

The host remains responsible for application permissions, durable service
effects and any required OS containment. See the [security model](../SECURITY.md)
and [production integration guidance](runtime-reference.md#security-model)
for those implementation boundaries.

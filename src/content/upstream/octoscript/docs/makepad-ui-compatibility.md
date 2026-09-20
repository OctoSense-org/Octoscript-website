# Makepad UI integration

**English** | [简体中文](makepad-ui-compatibility.zh-CN.md)

Octoscript can describe a workflow's interface and hand its UI nodes to
Makepad for native rendering. Both use the **`makepad-script` VM
implementation**: Octoscript for workflow execution, and Makepad's **Splash**
host for widget DSL execution. The shared dependency is documented in
[UPSTREAM.md](../UPSTREAM.md).

## UiNode to native widgets

```text
LLM-generated L0/L1 card
  → octoscript-ui-l0: check and realize
  → semantic UiNode + bindings
  → theme/component kit lowering
  → renderer UiNode
  → octoscript-makepad: translate
  → Makepad Splash DSL
  → Splash widget / makepad-script
  → native Makepad widgets
```

[Octoscript-Makepad](https://github.com/OctoSense-org/Octoscript-Makepad)
provides the renderer/node model, backend translation and native component
kits. The embedding UI host supplies data, widget modules, event handling and
state retention. Its adapter connects declared card actions to application
services.

L0 realization is VM-independent. Kit evaluation and the final Splash widget
host can use the shared VM; this does not imply that the workflow and UI run
inside the same VM instance or have the same available modules.

The [UI profile](ui-profile-l0.md) is the formal contract for generated L0/L1
source. Practical composition, themes and interaction flows are documented in
[Octoscript-AppCard](https://github.com/OctoSense-org/Octoscript-AppCard).
The [purpose and architecture](positioning.md) guide distinguishes the
workflow and UI host responsibilities.

## Makepad host and compatibility fixture

The pinned Makepad source includes the
[`Splash` widget](https://github.com/OctoSense-org/makepad/blob/9069cfaf87960f535f2440d736d223238b88c5b1/widgets/src/splash.rs)
and a [Splash example application](https://github.com/OctoSense-org/makepad/tree/9069cfaf87960f535f2440d736d223238b88c5b1/examples/splash).
The widget supplies native UI bindings and mounts the widget tree.

This repository retains
[`examples/makepad_ui_counter.octoscript`](../examples/makepad_ui_counter.octoscript)
as a small parser compatibility fixture. It uses Makepad UI conventions such as
`View`, `width: Fill`, named children and callbacks using a host-provided
`ui` handle.

The `makepad_ui_compatibility.rs` tests check that fixture with
`octoscript_core::check_vm_compatibility_named`, which applies the pinned
Makepad parser under source, token and nesting bounds without evaluating it.
They also check that the ordinary workflow `check_syntax` entry point rejects
the UI fixture. The standalone compatibility checker does not accept
Makepad `@(index)` host-value tokens because it has no host value table.

## Choosing the entry point

| Input | Entry point and host |
| --- | --- |
| Generated workflow source | Canonical workflow check, then the configured Octoscript runtime |
| Generated L0/L1 UI source | UI profile checker/realizer, then a registered kit and UI renderer |
| Trusted Makepad widget DSL | Explicit compatibility checking where needed, then a Makepad UI host with the required bindings |

The standalone `octoscript-cli` runs the workflow profile. It does not install
widgets, an event loop or `ui`, so the UI fixture is not a runnable CLI
example. Compatibility checking establishes parser acceptance, not native
rendering or permission to execute effects. UI integrations need their own
mounting and interaction tests.

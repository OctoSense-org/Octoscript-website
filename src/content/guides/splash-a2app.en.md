# Splash: from UI language to A2App

Splash is Makepad's live-editable scripting and UI language, developed within the Makepad project led by Rik Arends. It connects object composition, widget properties, behavior, Rust components and GPU drawing. Octoscript takes that foundation into agent-authored workflows and generated application interfaces.

This guide brings together the language features and host responsibilities. It is not a claim that every Splash construct belongs to Octoscript's bounded workflow profile.

## Objects are the building blocks

A Splash UI is an object tree. `Type { ... }` instantiates a definition; `property: value` sets a property; `name := Type { ... }` gives a child or template a stable name. `let` creates local bindings, and modules export shared definitions through `mod.*`.

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

This is a UI-body excerpt for a host with registered widgets, not a standalone workflow CLI program. `Fill`, `Fit`, layout direction, spacing and padding describe how native widgets are arranged. Names let application logic and inspection tools address meaningful parts of the tree.

## Reuse the definition and override the instance

Widget definitions carry defaults, inherited draw properties and behavior. An instance can customize those properties. Typed subobjects use `+:` to merge an override while preserving the rest of the inherited object.

```text
draw_bg +: { color: #2686a0 }
padding: Inset { left: 16 top: 12 right: 16 bottom: 12 }
```

Templates inside `PortalList` are instantiated for visible items, so a list can reuse a component definition rather than generate an unrelated tree for each row. Shared module exports and component kits make reuse explicit. The host still chooses how application data reaches those instances.

## Rust supplies the components and logic

`script_mod!` embeds Splash declarations into Rust. Registration expressions such as `#(Button::register_widget(vm))` connect script-visible definitions to Rust implementations. `#[derive(Script, ScriptHook)]` and supported field attributes expose typed properties; registered Rust code implements the behavior.

A current Makepad action handler can keep the logic in Rust:

```rust
if self.ui.button(cx, ids!(launch)).clicked(actions) {
    self.ui.label(cx, ids!(status)).set_text(cx, "Running");
}
```

The surrounding application registers modules, owns the event loop and mounts the root. Runtime property application and Splash reload let a host update presentation without rebuilding all its business logic. The checked-out host and dependency revision determine the exact available API.

## Drawing and animation belong to the language too

Splash can describe GPU draw behavior through shader definitions such as `pixel: fn() { ... }`. Instance values, uniforms and textures let reusable widgets vary their appearance. Animator states describe transitions such as hover and press. This is why the same composition system can describe a simple form, a custom chart or a highly styled interface.

These facilities are provided by the Makepad UI host. A shader-capable UI language does not imply that a generated workflow receives GPU, filesystem, process or network access. See the [Splash reference and examples](https://github.com/OctoSense-org/makepad/blob/octoscript/docs/agents/splash.md), [widget implementations](https://github.com/OctoSense-org/makepad/tree/octoscript/widgets/src) and [counter application](https://github.com/OctoSense-org/makepad/tree/octoscript/examples/counter).

## Two UI entry points

**Direct Splash:** a trusted UI host installs widgets and evaluates their DSL, retaining Makepad's full composition and styling model.

**Generated L0/L1:** the host first checks a narrower UI contract, realizes semantic `UiNode`s, applies a theme/component kit, and lowers the result to Splash. L0 realization does not need a VM; L1 adds bounded pure arithmetic. Kit evaluation and final Splash mounting can use the shared `makepad-script` implementation.

```text
agent → L0/L1 → checked UiNode → reusable kit → Splash → Makepad widgets
                                              ↑
                              direct Splash UI authoring
```

This reuses the existing UI language and component system while giving generated cards an explicit admission boundary. It does not route widget declarations through the standalone workflow checker. See [Makepad integration](../upstream/octoscript/docs/makepad-ui-compatibility.md).

## Cross-platform drawing and platform widgets

The language describes a tree; the host determines how that tree is rendered. “Native Makepad widgets” means widgets implemented and drawn by Makepad on a native or web backend. It does not mean that every `Button` is an Android `View`, ArkUI node or UIKit control.

| Host route | What renders the UI | Concrete implementation |
| --- | --- | --- |
| Makepad | Rust widgets and GPU drawing through platform backends, including native desktop/mobile and WebAssembly. | Splash host and Octoscript-Makepad kits. |
| Android system widgets | A Rust-evaluated tree crosses JNI to a Java builder; Java owns Android/Material views. | [Octoscript-Android](https://github.com/OctoSense-org/Octoscript-Android), including buttons, fields, dialogs and sliders. |
| OpenHarmony system widgets | Rust constructs and connects ArkUI nodes through the native C API. | [Octoscript-OH](https://github.com/OctoSense-org/Octoscript-OH), with ArkTS retained for shell or platform-only duties. |
| iOS | Makepad has an iOS backend and native-view integration points, including camera preview. A full UIKit-tree renderer would need its own adapter. | Cross-platform Makepad rendering is distinct from a complete Octoscript-to-UIKit widget catalog, which these repositories do not establish. |

Changing the backend preserves the opportunity to share data, actions and Rust logic. Widget names and styling still need an explicit mapping to each host; arbitrary Makepad shaders do not automatically become platform control properties.

## Compose both in the same page

A host can place a platform surface or control alongside Makepad-drawn content: a native camera preview under a Makepad control strip, a platform WebView beside a custom panel, or Android text input over a GPU surface. The host coordinates rectangles, clipping, layering, focus, keyboard, lifecycle and accessibility so the page behaves as one interface.

There are concrete integration points: [Makepad Video](https://github.com/OctoSense-org/makepad/blob/octoscript/widgets/src/video.rs) attaches native camera previews; [the iOS backend](https://github.com/OctoSense-org/makepad/blob/octoscript/platform/src/os/apple/ios/ios.rs) owns native preview lifecycles; [the Android bridge](https://github.com/OctoSense-org/makepad/blob/octoscript/platform/src/os/linux/android/android_jni.rs) connects a native composer over the GL surface. These prove useful mixed surfaces, not automatic compatibility for every arbitrary control combination.

## Reuse Rust logic: one camera, two hosts

The [camera example](https://github.com/OctoSense-org/Octoscript-AppCard/tree/feat/camera-app/apps/camera) separates `logic/`, `native/` and `oh/`. Both host manifests depend on `octosense-camera-logic`.

```text
                 octosense-camera-logic
             state machine · scenes · actions
                   /                \
       native/ Makepad host       oh/ ArkUI host
       L0 + kit widgets          native ArkUI nodes
```

The common crate owns camera UI state and scene generation. The Makepad host lowers scenes to kit widgets; the ArkUI host maps them to platform nodes. Camera capture, permissions and gallery handoff remain host integrations. This is reuse of application logic, not the assertion that platform APIs are identical.

## From Studio to an instrumented application

Studio exposes a visual workflow to a human developer. Makepad also puts inspection and control primitives inside the application, so an agent can work without driving the Studio GUI. A development instance launched with `--remote` publishes a loopback HTTP endpoint over a socket. The Studio WebSocket channel remains an internal route used by older tooling.

| Primitive | Agent operation |
| --- | --- |
| `/d`, `/snap?q=...` | Inspect the tree, widget IDs, types, text, states and current layout rectangles. |
| `/click`, `/m`, `/k`, `/t` | Click, drag, scroll, press keys and enter text through the app's event loop. |
| `/g`, `/gseq` | Read the app's own rendered frame or frame sequence. |
| `/log` | Correlate behavior with application logs. |
| `/tweak/state`, `/tweak/apply`, `/tweak/diff` | Inspect reflected properties, apply a presentation edit and retrieve its changes. |

An agent asks for current bounds, exercises a control, waits for a frame, checks the state and pixels, and repairs the relevant source. Tweaker edits do not automatically persist to source; the agent applies the reviewed changes and rebuilds to verify them.

“Headless” in this development loop means that the Studio GUI is unnecessary and a supported native window can be hidden. Visual verification still uses the real GPU backend; a simulated renderer does not prove native appearance. Instrument coverage differs by backend, and the port belongs to an explicitly instrumented development build. See [app remote control](https://github.com/OctoSense-org/makepad/blob/octoscript/docs/agents/app-remote.md) and [the current AppCard instrument workflow](https://github.com/OctoSense-org/Octoscript-AppCard/blob/main/lab/core/NATIVE-INSTRUMENT.md).

That closes the A2App loop: source is inspectable, widgets are addressable, actions are testable and visual changes can be traced back to a component. [The design-to-app flows](design-to-app.en.md) apply it to generated images and Sketch documents.

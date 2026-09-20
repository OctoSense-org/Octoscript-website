# Two flows from design to a working app

The agent's job is to connect visual intent to real components, then verify the result. A source image tells us about appearance; it does not supply business rules, permissions or reliable chart values. Both flows preserve the link between source elements, generated UI and runtime widgets so that an agent can repair a specific component.

## Flow 1: an image atlas becomes a service experience

[image-to-appcard-flow](https://github.com/OctoSense-org/Octoscript-AppCard/tree/main/lab/image-to-appcard-flow) starts with one atlas containing related screens. Shared typography, identity, data and actions are described together before generation. An application surface and a desktop service card are explicitly different owners.

1. **Preserve and measure.** Save the submitted prompt, original pixels and actual dimensions. Validate scene crops and retain the transforms between image pixels and the native artboard.
2. **Map semantic roles.** Combine authored intent, measured text/geometry and review. A headline becomes a Label, an action becomes a control, and a photo remains artwork. Unknown regions need a decision before compilation.
3. **Compile reusable UI.** Produce L0, kit definitions, data and source-to-widget mappings. Extract service-owned subtrees as independently mountable cards.
4. **Connect the service.** An authored reducer determines state transitions. Stable IDs connect the app and its service cards. Approvals, scheduling conflicts, duplicate events and undo semantics remain application logic.
5. **Inspect and repair.** Compare widget structure, geometry, interaction and rendered appearance separately. The current native instrument can inspect and drive an app directly; historical captures also used Studio.
6. **Package the same rendering path.** The flow can export a Makepad WebAssembly package, fonts and declared artwork for the Astro site, then test real native widget bounds in the browser.

The runner orchestrates these stages. It does not call an image model or automatically infer a complete application from pixels. The agent and authored contracts provide the semantic decisions. See the [mapping rules](https://github.com/OctoSense-org/Octoscript-AppCard/blob/main/lab/image-to-appcard/MAPPING-RULES.md) and [current native instrument](https://github.com/OctoSense-org/Octoscript-AppCard/blob/main/lab/core/NATIVE-INSTRUMENT.md).

## Worked example: booking an air-conditioner installation

The [aircon flow manifest](https://github.com/OctoSense-org/Octoscript-AppCard/blob/main/lab/image-to-appcard-flow/examples/aircon.flow.json) describes a 12-scene service example. It moves from shopping and delivery to installation, calendar coordination and payment. Those transitions come from service state, not an animation timeline.

Scene `aircon-05` offers installation after delivery. Its source-to-component mapping illustrates the key decisions:

| Source element | Runtime composition | What the agent can verify |
| --- | --- | --- |
| “空调已送达” | `Label` under source ID `text_14` | Actual text, font, wrapping and bounds. |
| “选择时间” | `KitButton` with `choose_time_control` and a separate label | Enabled state, control bounds and event `installation.open_slots`. |
| Product photograph | `Image`, `product_photo` | Declared artwork-only crop, hash, fit and clipping. |
| Installation card | A reusable surface with native children | Ownership, children and independent card layout. |
| “暂不预约” | A separate control | Event `installation.defer`; it does not mean canceling the original order. |

The homepage shows an archived reference and its actual native render. The recorded review still required typography, icon and surface refinements. It demonstrates component mapping and an inspect–repair loop, not a claim of exact pixel parity or a newly executed native acceptance test.

To propose a run with your own project paths:

```sh
bash tools/image-to-appcard-flow.sh plan \
  --project /path/to/service-project \
  --manifest /path/to/service-project/image-to-appcard-flow.json
```

`plan` prints the stages and arguments without executing them. The repository guide describes preparation, compilation, evidence and packaging. The source image, service implementation and native build environment remain explicit inputs.

## Flow 2: a Sketch document becomes a reusable kit

[sketch-to-appcard](https://github.com/OctoSense-org/Octoscript-AppCard/tree/main/lab/sketch-to-appcard) starts from structured design data: artboards, groups, symbols, text, fonts, masks and stable source IDs. It can preserve information that a flat screenshot has lost.

```text
Sketch document and source IDs
  → measured hierarchy, assets and typography
  → Splash design tree
  → native Makepad composition
  → inspect / interact / compare / repair
  → promote shared definitions into an L0 kit
  → compose new screens with the kit
```

Text maps to inspectable labels; fields to editable inputs; buttons, sliders and selectors to controls. Supported paths become vectors; photos and unsupported isolated graphic effects can remain declared image assets. Quantitative charts require numerical widgets and explicit data, even when the source design contains attractive vector curves.

The initial fixed-layout import preserves the artboard; it does not by itself create responsive layouts or application behavior. The subsequent promotion step extracts shared definitions, tokens and named bindings into a reusable L0 kit. Source ownership and native-tree equivalence are checked during promotion.

## Worked example: Taskplan, Atro and Camo

The repository describes imported design families including Taskplan, Atro and Camo. The reuse step recognizes complete compositions such as `KitButton`, `KitFormField`, `KitTabBar`, `TaskplanProjectCard` and `CamoTrackRow`.

For a music row, the cover remains an artwork asset, the title and artist remain text, and the play target remains a control. A shared row definition takes content and state parameters; each instance preserves its original source IDs. A new page can compose those rows without copying every layer or writing a screen-specific Rust widget.

For a chart, a visual line is not enough. Its adapter needs samples, units and domains. Values measured from a reference are explicitly approximate, not recovered business truth. The instrument must report the actual bound values before a data-driven behavior claim is made.

Design kit archives and fonts retain their original licensing requirements. The website links to the pipeline and shows our service example; it does not redistribute purchased Sketch kits.

## What makes the mapping useful to an agent?

**Stable correspondence:** source ID → semantic role → kit instance → actual widget ID. The agent can ask which button is wrong and modify that button's definition.

**Observable state:** labels, selected values, enabled controls, layout and clipping can be inspected independently of the image. Interaction tests establish what the control actually does.

**Separate evidence:** a successful compilation does not prove visual fidelity; a matching image does not prove a working control; a clicked button does not prove the service performed the right operation. Each check answers a distinct question.

**Reusable repair:** correcting a shared field or row can improve every instance. The result is an editable component system with Rust logic and service contracts behind it.

That is the practical A2App path: measured pixels or design objects become source-linked components, which an agent can inspect, operate and refine into an application.

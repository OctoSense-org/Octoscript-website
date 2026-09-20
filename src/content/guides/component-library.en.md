# The Octoscript–Makepad component library

Component kits connect generated source to real controls. Cards name titles, fields, choices and actions; kits supply themes and reusable compositions; Makepad draws and handles input on native platforms and in browser WebAssembly. Start the real Makepad / WASM lab below.

## Three component contracts

| Family | Input | Purpose |
| --- | --- | --- |
| L0 semantic roles | `TextTitle(text: copy.title)`, `Field(…)`, `Chip(…)` | Cards with explicit data origins, finite transitions and bounded realization. |
| Material semantic objects | `{t: "button", variant: "filled", label: "Confirm", …}` | Compose Material 3 roles, states and variants; the renderer owns styling. |
| Source-derived design kits | `TaskplanButton`, `AtroFormField`, `CamoTrackRow` | Reuse extracted Sketch tokens, named parts and whole compositions while preserving source IDs. |

Flutter examples are designs and interactions **recreated with Octoscript–Makepad**. They do not embed Flutter Engine or promise a widget-for-widget Flutter SDK port. Every kit needs an explicit input contract and support scope.

## A Material button that changes state

```text
{t: "button", variant: "filled", label: "Confirm selection",
 key: "lab_confirm", tap: 1}
{t: "text", variant: "titleMedium",
 text: "Confirmed: " + N("lab_confirm", 0)}
```

These are two nodes in the same children array. The button writes 1 to `lab_confirm`; the host reevaluates and the label reads that slot. A `key` names the destination but still needs `tap: 1` or an explicit `action`. A painted button without state wiring does not establish interaction. A different kit can retain meaning, values and events while changing presentation.

## Catalog and support scope

The catalog below groups actual constructors, the Material vocabulary and registered kits. **A declared name, correct rendering and working interaction are separate findings.** The browser lab demonstrates the operations verified here. Sensors, permissions, system dialogs and external services still require their platform hosts.

Material’s documented state writers include button, chip, checkbox, segmented and tabs. Wiring for radio, toggle, trailing switches, fab, dropdown and slider differs between hosts. Input, search and date/time pickers also need platform-specific keyboard and dialog checks. A catalog entry does not imply equal behavior across backends.

The Flutter kit includes Material 3, Cupertino Gallery, Form App, Date Planner, Compass, Platform Design, Photo Search, Testing, navigation, animation and more. Some visual elements offer only navigation or illustration. Device-capability examples report unavailable in the browser instead of inventing phone data. The Material lab deliberately uses existing state-wired controls.

## Reusing a source-derived component

A registered kit has four pieces: `tokens.json` contains measured colors, fonts, spacing and effects; `components.l0` holds repeated structures; `roles.l0` provides public names; `kit.json` defines semantic roles, types, child slots and source receipts.

`CamoTrackRow` reuses artwork, title, artist and play actions. `TaskplanProjectCard` reuses title, date, status and card activation. Original Sketch IDs bind to named `part` children inside a complete composition. Unknown parts, mismatched root identities and duplicate realized IDs fail. A host registers both `octoscript-widgets::design` and `octoscript-widgets::kit`.

## Try it in the browser

The demo draws its content and controls through Rust → WebAssembly → Makepad WebGL. The surrounding page only selects examples, sets a theme and reports actual runtime state. Choose delivery speed, toggle preferences and confirm in Material; navigate subpages and color/type examples in Flutter. State lives only in the current demo instance and resets on reload.

The renderer loads on demand. WebAssembly and WebGL are required; a failed start exposes a retry action. Canvas assistive-technology support differs from HTML forms, so the catalog, syntax and instructions remain accessible HTML.

## Maintenance and sources

[Syntax and the four layers](language-profiles.en.md) define generation boundaries. [Pixels to components](design-to-app.en.md) shows concrete source mapping. The catalog is derived from the [Material vocabulary](https://github.com/OctoSense-org/Octoscript-Makepad/blob/main/components/material/screens/WIDGETS.md), [Flutter notes](https://github.com/OctoSense-org/Octoscript-Makepad/blob/main/components/flutter/README.md) and [native kit contract](https://github.com/OctoSense-org/Octoscript-Makepad/blob/main/docs/native-l0-kits.md). Download pinned source revisions and a build digest from the demo panel.

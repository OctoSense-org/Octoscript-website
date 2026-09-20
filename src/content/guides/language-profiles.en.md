# Syntax, capability levels and the L0–L3 pipeline

Choose the artifact first: **workflow source** describes authorized operations; **UI cards** describe data, state and components; **Splash components** define reusable presentation and behavior. They share implementation foundations but have different checking entry points and contracts.

## L0–L3 are four implementation layers

In design-flow reviews, these labels name the rendering pipeline. They do not represent increasing execution permission.

| Layer | Definition | Input → output | Evidence to check |
| --- | --- | --- | --- |
| L0 · Profile / realization | Validate declarations and expand components, guards and bounded collections using host data. | Card + data → checked UI tree | Origins, stable keys, component contracts and traversal budgets. |
| L1 · Kit lowering | Translate semantic roles into registered component-kit calls. | UI tree + kit → component source | Roles, parameters, tokens, named parts and source IDs survive. |
| L2 · VM / node translation | Evaluate the kit with the shared VM, produce nodes and translate for a renderer. | Kit calls → UiNode → Splash widget description | Tree, properties and action mapping; unknown components cannot count as success. |
| L3 · Native mounting / interaction | Mount real widgets, lay out, draw and dispatch input. | Widget description → pixels + actual events | Bounds, captures, hit testing, state changes, keyboard input and recovery. |

For an appointment button, L0 binds copy and its event to a source ID; L1 selects `KitButton` and a theme; L2 builds its children; L3 activates the native Button and the host receives `installation.open_slots`. Source validation and a matching picture alone do not establish working interaction.

## UI capability levels are a separate axis

The `# level:` header describes the language admitted by the UI checker.

| Capability | Admitted surface | Current status |
| --- | --- | --- |
| L0 | Sources, shaped state, total transitions, keyed iteration, guards, components and slots. No arbitrary arithmetic, functions or imperative widget commands. | Implemented; the default when no level is declared. |
| L1 | Adds pure arithmetic in argument positions: `+ - * / %`, grouping and negation; an expression must read declared source or state. | Only this bounded extension is implemented; requires `# level: L1`. |
| L2 | Describes behavior outside those contracts, such as a per-frame `tick` and direct widget mutation. | Not an implemented UI profile; rejected before parsing. |
| L3 | No such UI language capability profile exists. | `# level: L3` is rejected. L3 names the native implementation layer above. |

Level checking must inspect the whole component dependency closure and retain its highest requirement. Pin component versions: an outer L0 card must not silently inherit new behavior. Host artifact approval separately binds source, admitted level, policy version, kit and runtime. A changed artifact cannot inherit mismatching approval.

## Workflow syntax at a glance

The canonical workflow profile is v0.2. Check it with `octoscript check file.octoscript`; UI cards use the Rust `check_ui_l0` entry point.

| Purpose | Syntax | Contract |
| --- | --- | --- |
| Import | `use mod.tool` | Refer to a host-allowed module; an import is not a grant. |
| Binding | `let count = 2`, then `count += 1` | `let` declarations; case-sensitive identifiers. |
| Data | `true`, `false`, `nil`, `[1, 2]`, `{name: "Ada"}` | Double-quoted strings; no trailing record comma in canonical source. |
| Access | `request.name`, `request[key]` | Fields and dynamic text keys. |
| Branch | `if ok { … } elif pending { … } else { … }` | Branches can produce values; empty branches produce nil. |
| Function | `fn twice(x) { return x * 2 }` | Functions use explicit `return`. |
| Loop | `for item in items { … }`, `while ready { … }` | Instruction, time and memory limits still apply. |
| Fallback | `try expression catch fallback` | No JavaScript-style `catch(error)` binding. |
| Deferred call | `tool.start("tool.name", payload).await()` | The host supplies external scheduling and resumption. |

Separate statements with newlines or compact them with semicolons. Logical operators are `&&`, `||` and `!`. Inherited words such as `and`, `or`, `var` and `match` are outside canonical workflow syntax, as are UI and shader constructs.

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

This example combines a function, record, conditional value and fallback. Execution still requires a registered and authorized `text.echo`. A catch cannot issue permission or undo a side effect.

## UI L0 syntax: relationships and origins

This complete card declares local Boolean state and translated vocabulary. The host resolves `sys.locale()`. Tapping the Chip toggles only the declared cell.

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

| Construct | Meaning |
| --- | --- |
| `source name sys.…(…)` | Declare a dependency. The host resolves and injects data; the L0 realizer cannot invoke arbitrary capabilities. |
| `state name { shape: …, initial: … }` | Typed cells for selection and interaction. |
| `event name { field: toggle }` | Only declared total transitions: `set(…)`, `toggle`, `cycle(…)`, `clear`. |
| `when source.$state == .ready { … }` | React to host-reported pending / ready / stale / error lifecycle. |
| `for item in source.items key item.id { … }` | Stable instance identity with bounded traversal. |
| `component Name(…) { … }` | Reuse parameters, local state and events; compose children with `slot` and `into`. |
| Dot-prefixed tokens such as `.primary` | Distinguish tokens from data paths; constructor contracts define admitted values. |

Business values come from sources, copy declares provenance, and kits own presentation. `TextHero(value: 1547)` cannot present a model-authored literal as a live reading. Default realization limits are 8,192 nodes, depth 64, 512 items per collection and 65,536 work units. A truncated report is an incomplete result.

## UI L1 expands expressions only

```text
# level: L1
// A view fragment; shares and quote must first be declared.
TextHero(value: shares * quote.last)
```

Multiplication, division and remainder bind before addition and subtraction; each group associates left. `(a + b) * c` and `n * -1` are supported. Expressions must read declared sources or state: pure literals such as `1547 * 3.2` fail. Recognizable disguised constants such as `quote.last * 0 + 1547` fail too. This limited analysis does not prove arbitrary formulas correct. L1 adds no filesystem, network, tool or imperative UI authority.

## Splash and kit syntax boundaries

Splash composes objects with `View { … }`, assigns properties with `name: value`, names instances with `name := Type { … }`, and merges inherited properties with `draw_bg +: { … }`. Rust registers components through `script_mod!`; `#(expr)` inserts Rust bindings. Themes, shaders, animation and event implementation live in this trusted host layer.

Material semantic kits accept object trees such as `{t: "button", variant: "filled", label: "Confirm", …}`. The kit host admits that expression dialect. It does not make arbitrary functions or object expressions UI L0, and its control-flow behavior should not be assumed identical to canonical workflows. Choose the profile before generating source.

The [component catalog and browser lab](component-library.en.md) show roles, status and working controls. The [execution model](why-octoscript.en.md) explains grants and draft review.

## Specification references

The essentials are presented above. For implementation audits and version comparison, see the [workflow grammar](https://github.com/OctoSense-org/Octoscript/blob/main/docs/grammar.md), [UI profile](https://github.com/OctoSense-org/Octoscript/blob/main/docs/ui-profile-l0.md) and [native kit contract](https://github.com/OctoSense-org/Octoscript-Makepad/blob/main/docs/native-l0-kits.md).

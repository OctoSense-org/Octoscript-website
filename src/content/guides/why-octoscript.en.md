# Why a language for agents?

Octoscript is designed around a different author: a model that proposes programs, reads diagnostics, repairs its output, and asks a host to run them. The objective is a compact, inspectable contract from intent to action. Safety comes from the runtime and host boundary as well as the language.

## Why not simply generate Python or JavaScript?

Python and JavaScript are excellent choices when an application needs their ecosystems or lets a developer run general-purpose code in a suitably isolated environment. Octoscript targets another deployment: an application wants to accept generated workflows **inside its own runtime**, exposing a small set of services without inheriting a general-purpose application's entire environment.

| Design question | Using a general-purpose runtime | Octoscript's chosen contract |
| --- | --- | --- |
| What can the model produce? | A large language and ecosystem; the application must define its accepted subset. | A published canonical grammar, bounded preflight and structured diagnostics. |
| Where does authority come from? | Determined by the embedding, sandbox, imports and available APIs. | The host registers tools and issues grants; generated source cannot grant itself access. |
| How does it fit a UI event loop? | The application supplies integration and scheduling. | Rust embedding and host-pumped deferred calls support yielding and resuming work. |
| How is work bounded? | Runtime and containment policy must impose the relevant limits. | Explicit source, token, nesting, instruction, deadline, string, stack, frame and tracked-heap limits. |
| How do agents repair mistakes? | Diagnostics vary across language, packages and application APIs. | Versioned profile metadata, effect-free checking, formatting, workflow review and bounded editor tooling. |

This is a choice of constraints, not a claim that Python or JavaScript cannot be secured. It trades package compatibility and unrestricted expressiveness for a smaller surface that a host can describe, inspect and enforce. Existing Python or JavaScript services can still sit behind registered tools.

## Design the generation loop, not just the syntax

An agent first receives the language profile and the host's current tool catalog. It produces source or a data-only workflow draft. The checker returns structured diagnostics without resolving imports or running effects. The agent repairs the proposal, and the host decides whether to create a plan and issue capabilities.

```text
profile + tool catalog + user intent
  → generated source / workflow draft
  → effect-free check and review
  → repair diagnostics
  → host approval + bounded capabilities
  → execute / yield / resume
  → results and auditable state
```

A parseable program is not an authorized program. A catalog entry describes a tool; it does not grant permission to call it. A workflow proposal describes work; it does not become an executable plan until the host accepts it. These separations let a model generate useful programs without making it the authority over the application.

## What happens around one call?

Consider an application that registers `text.echo`. The model produces source; the application supplies the implementation. This is the repository’s demonstration tool.

```octoscript
use mod.tool
let task = "prepare release notes"
let result = tool.call("text.echo", task)
result
```

| Stage | Input and result | What it establishes |
| --- | --- | --- |
| Describe the language | `octoscript profile` returns versions, canonical entry points, budgets, effect-free tools and the authority model. | Language metadata; no runtime or grant is created. |
| Describe tools | The host reads `CapabilityRuntime::tool_catalog()` and supplies its current registered tools. | Available interfaces, not permission to call them. |
| Check source | `octoscript check` validates canonical v0.2 syntax and compatibility with the underlying parser. | Syntax, without loading modules or invoking adapters. It does not prove business correctness. |
| Grant authority | The application evaluates the user request, policy and arguments, then issues a capability lease. | Only host-issued authority can admit an effectful call. |
| Reserve and execute | Every actual call checks its registered name, active lease, remaining calls and input bounds. | The Rust adapter runs only after admission; output is bounded too. |
| Return or resume | Local calls return; deferred calls yield until the host completes external work. | The application controls scheduling and continuation. Source cannot manufacture an operation handle. |

If the catalog lists `text.echo` but the active lease permits only `calendar.read`, this program is rejected. A one-call grant does not admit a second call. A changed name, oversized payload or continuation from another session cannot inherit permission.

## Reading a tool catalog

The catalog describes the **current host registry**, in stable name order. An agent should use that catalog instead of guessing ambient commands.

| Field or concept | Meaning | How the host uses it |
| --- | --- | --- |
| name, description | A bounded lowercase ASCII identifier and its purpose. | Resolve the exact registered capability. |
| envelope, dispatch | Text or JSON exchange; local or external dispatch. | Select `call` / `call_json` or the deferred interface. |
| Call, attempt and byte limits | Bound invocation count, external attempts and input/output size. | `max_attempts` is host-only; it creates no script retry API. |
| Input/output schemas | JSON structure and type contracts. | `contract_enforced: true` means the Rust boundary validates both sides. Otherwise schemas are descriptive only. Text tools always report false. |
| Deferred and stream bounds | Deadline, chunk count, chunk size and redacted aggregate output. | Constrain host scheduling and workers; they do not expose arbitrary timers or streams to source. |

Defaults allow 128 tools and a 512 KiB serialized catalog; hosts can choose tighter limits. Registering a tool, describing it and granting it to a particular workflow are separate operations.

## From a draft to an approved plan

The model may submit this data-only JSON envelope:

```json
{
  "format_version": 1,
  "steps": [
    {
      "id": "prepare",
      "source": "use mod.tool\nlet note = tool.call(\"text.echo\", \"draft\")"
    }
  ]
}
```

Only `format_version`, `steps`, and each step’s `id` and `source` are accepted. Unknown fields fail. A draft cannot smuggle `approved: true`, a lease, checkpoint, tool result or external operation ID into a credential. Ingress is capped at 2 MiB of JSON, 1,024 steps and 1 MiB of aggregate decoded source.

```text
WorkflowDraft::from_json  → decode bounded data; reject extra fields
review                   → effect-free syntax + direct call hints
engine.plan_draft        → engine-owned plan; record Planned only
host selects policies    → allowed tools, argument policy and budgets
engine.approve…          → bind host approval to the plan
engine.execute           → check every actual call at reservation
```

Call hints help a reviewer but do not resolve aliases, control flow or computed names, and may be truncated. Extracting names from hints is not an authorization mechanism. Approval and reservation-time enforcement must constrain actual calls together.

For dataflow, the host separately injects JSON-only `workflow.input` and `workflow.outputs.<step_id>`. The aggregate context is capped at 64 KiB and 64 levels. Functions, native handles, cycles and non-finite numbers are rejected. Invalid output stops the workflow before the next step. Data carries no authority.

## Errors, waiting and retries

| Situation | Behavior |
| --- | --- |
| Syntax error | Return a location and diagnostic so the agent can repair and resubmit. |
| Ordinary script failure | v0.2 `try … catch …` can select a fallback value without exposing an operable error object. |
| Resource exhaustion | Abort execution. Hard resource failures cannot be caught to keep spending the budget. |
| External work pending | A deferred handle yields; the host controls completion, deadline and resumption. |
| An effect already happened | Catching an error does not undo a payment or message. Idempotency, reconciliation, retries and durable recovery belong to adapters and the engine. |

These boundaries make failure explicit. They do not promise transactionality or exactly-once behavior from arbitrary external services.



## Small, safe, reliable and efficient mean specific things

**Small:** teach and check one canonical workflow profile. Widget declarations and shader facilities do not become accidental workflow features just because the inherited parser recognizes them. UI uses a separate, explicit entry point.

**Safe:** start with no tool authority. Rust adapters expose reviewed operations, bounded input/output contracts and host-selected grants. The standalone runtime masks inherited UI/debug and unbounded native entry points. Resource exhaustion stops execution; hard resource stops are not ordinary catchable application errors.

**Reliable:** keep source validation separate from effects, data separate from executable authority, and retries separate from permission to repeat an operation. The host owns durable state, idempotency and recovery policy. A caught exception does not undo a payment or other external effect.

**Efficient:** reuse an embeddable Rust VM and host services, bound retained data, and yield deferred calls back to the application's event loop. The aim is a small integration footprint and predictable work. This site does not claim a measured speed, binary-size or token-cost advantage over Python or JavaScript.

VM limits cover the storage and operations they track. They are not a whole-process memory quota, cannot bound arbitrary trusted Rust adapter allocations, and do not replace OS isolation when executing hostile native code. Preflight bounds source bytes, tokens and nesting; execution bounds instructions, deadlines, stack, call frames, strings and tracked heap. Hosts must separately budget and isolate their native adapters.

## Why start from Splash?

Makepad's Splash already brings an embeddable Rust scripting engine, object composition, UI integration, and a live iteration loop. Starting there preserves a useful connection between generated application behavior and an expressive UI system.

Octoscript specializes that foundation for generated workflows: a documented producer grammar, bounded validation and execution, controlled host bindings, reviewable dataflow, capability leases and agent-facing tooling. The UI path keeps access to Splash's widget composition through its own host.

The fork is maintained in **OctoSense-org/makepad**, on its `octoscript` branch. Octoscript consumes a pinned `makepad-script` dependency; it does not maintain a second copied VM in this repository. VM hardening belongs in that shared fork. The workflow and UI consumers can use the same implementation while retaining separate instances and different bindings. The [upstream policy](../upstream/octoscript/UPSTREAM.md) records the lineage and update rules.

## A2App: a proposal becomes a working application

Here, A2App means an agent can describe behavior, compose UI, inspect the resulting widgets, exercise their actions and repair the source from evidence. The model works against both a language contract and a running application's instrumentation.

Read [Splash, UI hosts and agent tools](splash-a2app.en.md) for the rendering and Rust integration, then [the two design-to-app flows](design-to-app.en.md) for concrete source-to-widget examples.

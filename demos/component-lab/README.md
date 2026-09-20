# Component lab

A real Rust / Makepad WebAssembly host for the website. Material uses the
semantic renderer and local numeric state slots. Flutter designs use the
pinned upstream kit assembled in `src/flutter.octoscript`; they do not run
Flutter Engine. `sources.json` records the input revisions and file hashes.

Use installed Rust/nightly with rust-src and an existing `cargo-makepad`.
The build script runs offline and never installs tools. Prepare an isolated
checkout of the Makepad revision in `sources.json`, apply
`wasm-instance-layout.patch`, then run:

```sh
python3 build.py --makepad /path/to/isolated/makepad \
  --kits /path/to/pinned/octoscript-makepad \
  --cargo-makepad /path/to/existing/cargo-makepad
```

`Cargo.toml` and `.cargo/config.toml` are generated local path wiring.
`Cargo.lock` is retained. `build.py --package-only` packages an existing build.
The resulting `public/wasm/component-lab` is served statically; it requires
WebAssembly and WebGL, but no COOP/COEP or SharedArrayBuffer.

The local runtime patch moves four bytes of wasm32 DrawVars tail padding before
its final instance array. That keeps the array contiguous with the enclosing
shader's live fields. The host checks this layout at startup. Native checkouts
outside this build are not modified. The host also omits the pinned translator's
unsupported RadioButton.active property while retaining its selection animator.
Strict widget evaluation remains enabled.

Only four bounded preset IDs and a theme flag enter from the browser. No user
source is evaluated. Commands and status messages check both origin and iframe
identity. The package loader prevents the iframe from reclaiming parent focus.
The Material demo changes local state only; browser stubs report unsupported
device capabilities. Some Flutter samples remain visual/navigation examples.

Validation: website Playwright tests exercise native canvas input, actual Rust
state receipts, theme changes, lazy loading and load failure recovery. Visual
captures of both themes are retained in ignored website artifacts. Dependency
compiler warnings are kept in the build log rather than suppressed.

pub use makepad_widgets;
use makepad_widgets::script::res::CxScriptResourceData;
use makepad_widgets::*;
use serde_json::json;
use std::cell::RefCell;
use std::rc::Rc;

app_main!(App, font_assets: ["octoscript_component_lab/resources/Roboto-Regular.ttf"]);

thread_local! {
    static COMMAND: RefCell<Option<(u32, bool)>> = const { RefCell::new(None) };
    static TAPS: RefCell<Vec<String>> = const { RefCell::new(Vec::new()) };
    static SNAPSHOT: RefCell<Vec<u8>> = RefCell::new(b"{}".to_vec());
}
#[no_mangle]
pub extern "C" fn lab_select(preset: u32, dark: u32) {
    if preset <= 3 {
        COMMAND.with(|c| *c.borrow_mut() = Some((preset, dark != 0)));
    }
}
#[no_mangle]
pub extern "C" fn lab_snapshot() -> *const u8 {
    SNAPSHOT.with(|s| s.borrow().as_ptr())
}
#[no_mangle]
pub extern "C" fn lab_snapshot_len() -> usize {
    SNAPSHOT.with(|s| s.borrow().len())
}

script_mod! {
    use mod.prelude.widgets.*
    mod.lab_font = crate_resource("self:resources/Roboto-Regular.ttf")
    startup() do #(App::script_component(vm)) {
        ui: Root {
            main_window := Window {
                show_caption_bar: false
                window.inner_size: vec2(440, 740)
                body +: {
                    flow: Down
                    scroller := ScrollYView {
                        width: Fill height: Fill flow: Down
                        host := Splash { width: Fill height: Fit }
                    }
                }
            }
        }
    }
}
#[derive(Script, ScriptHook)]
pub struct App {
    #[live]
    ui: WidgetRef,
    #[rust]
    next: NextFrame,
    #[rust]
    started: bool,
    #[rust]
    preset: u32,
    #[rust]
    route: String,
    #[rust]
    dark: bool,
    #[rust]
    width: f64,
    #[rust]
    height: f64,
    #[rust]
    revision: u32,
    #[rust]
    last_action: String,
}

fn register(vm: &mut ScriptVm) {
    octoscript_makepad::kit::register_stub_capabilities(vm);
    let n = octoscript_render::add_global_fn(
        vm,
        &[
            (live_id!(k), ScriptValue::NIL),
            (live_id!(d), ScriptValue::NIL),
        ],
        |vm, a| {
            let k = octoscript_render::string_prop(vm, a, live_id!(k)).unwrap_or_default();
            let d = octoscript_render::num_prop(vm, a, live_id!(d)).unwrap_or(0.0);
            ScriptValue::from_f64(octoscript_render::state::get_or_seed(&k, d))
        },
    );
    vm.set_injected_global(live_id!(N), n);
    let nav = octoscript_render::add_global_fn(vm, &[(live_id!(t), ScriptValue::NIL)], |vm, a| {
        let t = octoscript_render::string_prop(vm, a, live_id!(t)).unwrap_or_default();
        TAPS.with(|q| {
            let mut q = q.borrow_mut();
            if q.len() < 32 {
                q.push(t);
            }
        });
        ScriptValue::NIL
    });
    vm.set_injected_global(live_id!(NAV), nav);
}

// The pinned translator emits an `active` property on RadioButton even though
// that widget exposes selection through its animator. Keep the animator it
// already emits and omit only the unsupported property, before strict checking.
fn browser_widget_source(source: &str) -> String {
    let mut radio_indent = None;
    let mut result = String::new();
    for line in source.lines() {
        let trimmed = line.trim_start();
        let indent = line.len() - trimmed.len();
        if trimmed == "RadioButton {" {
            radio_indent = Some(indent);
        }
        if radio_indent.is_some_and(|i| indent == i + 4) && trimmed.starts_with("active:") {
            continue;
        }
        if trimmed == "}" && radio_indent == Some(indent) {
            radio_indent = None;
        }
        result.push_str(line);
        result.push('\n');
    }
    result
}

impl App {
    fn mount(&mut self, cx: &mut Cx) {
        octoscript_makepad::set_dark(self.dark);
        octoscript_makepad::material::set_flow_width((self.width as f32 - 32.0).max(240.0));
        let source = if self.preset == 0 {
            format!(
                "{}\n{}",
                include_str!("material-kit.octoscript"),
                include_str!("material.octoscript")
            )
        } else {
            include_str!("flutter.octoscript").to_string()
        };
        let full = octoscript_makepad::kit::with_state_sized(
            &self.route,
            self.dark,
            0.0,
            self.width,
            self.height,
            &source,
        );
        let mut nodes = 0;
        let mut mounted = false;
        if let Some(node) = octoscript_render::build(&full, register) {
            nodes = node.count();
            let ink = if self.dark { "#e6e0e9" } else { "#1d1b20" };
            let ui = browser_widget_source(&octoscript_makepad::to_makepad_ui(&node))
                .replace("CheckBox {", &format!("CheckBox {{ draw_text.color:{ink}"));
            let background = if self.dark { "#141218" } else { "#fef7ff" };
            let code=format!("use mod.prelude.widgets.*\nreturn SolidView{{width:Fill height:Fit{{min:{}}} flow:Down draw_bg.color:{background} {ui}}}",self.height);
            let module = ScriptMod {
                cargo_manifest_path: env!("CARGO_MANIFEST_DIR").to_string(),
                module_path: module_path!().to_string(),
                file: file!().to_string(),
                line: 1,
                column: 0,
                code,
                values: Vec::new(),
            };
            let view = cx.with_vm(|vm| {
                vm.eval_checked(module, 2_000_000)
                    .map(|value| View::script_from_value(vm, value))
            });
            if let Some(view) = view {
                if let Some(mut host) = self.ui.widget(cx, ids!(host)).borrow_mut::<Splash>() {
                    host.view = view;
                    mounted = true;
                }
            }
        }
        self.revision += 1;
        let snapshot = json!({"renderer":"Makepad/WASM","mounted":mounted,"nodes":nodes,
        "preset":self.preset,"route":self.route,"dark":self.dark,"revision":self.revision,
        "action":self.last_action,"state":{
            "gift":octoscript_render::state::get("lab_gift",0.0),
            "updates":octoscript_render::state::get("lab_updates",0.0),
            "speed":octoscript_render::state::get("lab_speed",0.0),
            "confirmed":octoscript_render::state::get("lab_confirm",0.0)
        }});
        SNAPSHOT.with(|s| *s.borrow_mut() = serde_json::to_vec(&snapshot).unwrap());
        log!("LAB {}", snapshot);
        self.ui.redraw(cx);
    }
}
impl MatchEvent for App {}
impl AppMain for App {
    fn script_mod(vm: &mut ScriptVm) -> ScriptValue {
        makepad_widgets::theme_mod(vm);
        script_eval!(vm,{mod.theme=mod.themes.light});
        octoscript_widgets::widgets_mod(vm);
        octoscript_widgets::design::script_mod(vm);
        octoscript_widgets::kit::script_mod(vm);
        octoscript_widgets::progress::script_mod(vm);
        register(vm);
        self::script_mod(vm)
    }
    fn handle_event(&mut self, cx: &mut Cx, event: &Event) {
        self.match_event(cx, event);
        self.ui.handle_event(cx, event, &mut Scope::empty());
        if matches!(event, Event::Startup) && !self.started {
            assert_eq!(
                std::mem::size_of::<DrawVars>(),
                std::mem::offset_of!(DrawVars, dyn_instances) + 128,
                "GPU instance payload must be contiguous"
            );
            for resource in cx.script_data.resources.resources.borrow_mut().iter_mut() {
                if resource.abs_path.ends_with("resources/Roboto-Regular.ttf") {
                    resource.data = CxScriptResourceData::Loaded(Rc::new(
                        include_bytes!("../resources/Roboto-Regular.ttf").to_vec(),
                    ));
                }
            }
            self.started = true;
            self.width = 440.0;
            self.height = 740.0;
            self.next = cx.new_next_frame();
            self.mount(cx);
        }
        if let Event::WindowGeomChange(e) = event {
            self.width = e.new_geom.inner_size.x;
            self.height = e.new_geom.inner_size.y;
            if self.started {
                self.mount(cx);
            }
        }
        if self.next.is_event(event).is_some() {
            if let Some((preset, dark)) = COMMAND.with(|c| c.borrow_mut().take()) {
                let changed = preset != self.preset;
                if changed {
                    octoscript_render::state::reset();
                }
                self.preset = preset;
                self.dark = dark;
                if changed || self.route.is_empty() {
                    self.route = match preset {
                        1 => "material_3_demo",
                        2 => "cupertino_gallery",
                        3 => "form_app",
                        _ => "index",
                    }
                    .to_string();
                    self.last_action.clear();
                }
                self.mount(cx);
            }
            let taps = TAPS.with(|q| std::mem::take(&mut *q.borrow_mut()));
            for tap in taps {
                self.last_action = tap.clone();
                if tap == "theme:toggle" {
                    self.dark = !self.dark;
                } else if !octoscript_render::state::apply(&tap) {
                    self.route = tap;
                }
                self.mount(cx);
            }
            self.next = cx.new_next_frame();
        }
    }
}

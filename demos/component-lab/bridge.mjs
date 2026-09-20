import { WasmWebGL } from './makepad_platform/web_gl.js';
const status = document.querySelector('#status');
const cn = new URLSearchParams(location.search).get('lang') === 'cn';
if (cn) { document.documentElement.lang = 'zh-CN'; status.textContent = '正在加载 Makepad / WebAssembly…'; }
const decoder = new TextDecoder();
let instance, desired = {preset: 0, dark: false};
let revision = -1;
let booted = false;
function publish(detail) {
  window.__componentLab.snapshot = detail;
  window.parent.postMessage({type: 'octoscript:lab', ...detail}, location.origin);
}
function select(preset, dark) {
  if (!Number.isInteger(preset) || preset < 0 || preset > 3 || typeof dark !== 'boolean') return;
  desired = {preset, dark};
  if (instance && booted) instance.exports.lab_select(preset, Number(dark));
}
window.__componentLab = {snapshot: null, select};
window.addEventListener('message', e => {
  if (e.source !== parent || e.origin !== location.origin || e.data?.type !== 'octoscript:select') return;
  select(e.data.preset, e.data.dark);
});
try {
  instance = await WasmWebGL.fetch_and_instantiate_wasm('./component-lab.wasm');
  window.__componentLab.webgl = new WasmWebGL(instance, {}, document.querySelector('canvas'));
  const timer = setInterval(() => {
    try {
      const p = instance.exports.lab_snapshot();
      const n = instance.exports.lab_snapshot_len();
      const data = JSON.parse(decoder.decode(new Uint8Array(instance._memory.buffer, p, n)));
      if (data.revision === undefined || data.revision === revision) return;
      revision = data.revision;
      if (!data.mounted) throw new Error('The component tree could not mount.');
      if (!booted) { booted = true; instance.exports.lab_select(desired.preset, Number(desired.dark)); }
      status.hidden = true;
      publish(data);
    } catch (error) { clearInterval(timer); fail(error); }
  }, 80);
  addEventListener('pagehide', () => clearInterval(timer), {once: true});
} catch (error) { fail(error); }
function fail(error) {
  status.hidden = false;
  status.textContent = cn ? '演示加载失败，请返回页面重试。' : 'The demo could not load. Return to the page and retry.';
  publish({error: String(error)});
}

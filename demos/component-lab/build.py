#!/usr/bin/env python3
"""Build/package the component lab using existing, pinned local dependencies.

No installer or network bootstrap is run. Supply the Makepad checkout with
wasm-instance-layout.patch applied and the sibling Octoscript-Makepad checkout.
"""
import argparse, hashlib, json, os, shutil, struct, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent
OUT = ROOT.parents[1] / 'public/wasm/component-lab'

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def font_notice(p):
    data=p.read_bytes(); count=struct.unpack_from('>H',data,4)[0]
    for pos in range(12,12+count*16,16):
        tag,_,start,length=struct.unpack_from('>4sIII',data,pos)
        if tag != b'name': continue
        _,rows,offset=struct.unpack_from('>HHH',data,start); entries=set()
        for i in range(rows):
            platform,_,_,name,size,at=struct.unpack_from('>HHHHHH',data,start+6+i*12)
            if name in (0,13,14):
                raw=data[start+offset+at:start+offset+at+size]
                entries.add(raw.decode('utf-16-be' if platform in (0,3) else 'latin1',errors='replace'))
        return p.name+'\n'+'\n'.join(sorted(entries))
    raise ValueError('Missing font license metadata: '+str(p))

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--makepad',type=Path,required=True)
    parser.add_argument('--kits',type=Path,required=True)
    parser.add_argument('--cargo-makepad',type=Path)
    parser.add_argument('--package-only',action='store_true')
    args=parser.parse_args(); mp=args.makepad.resolve(); kit=args.kits.resolve()
    if not args.package_only:
        if not args.cargo_makepad or not args.cargo_makepad.is_file(): parser.error('Supply an existing cargo-makepad binary')
        if 'instance_tail_padding' not in (mp/'platform/src/draw_vars.rs').read_text(): parser.error('Apply wasm-instance-layout.patch to an isolated Makepad checkout first')
        deps={'makepad-widgets':mp/'widgets',**{n:kit/'crates'/n for n in ['octoscript-widgets','octoscript-render','octoscript-makepad']}}
        (ROOT/'Cargo.toml').write_text('[package]\nname="octoscript-component-lab"\nversion="0.1.0"\nedition="2021"\n[workspace]\n[dependencies]\nserde_json="1"\n'+''.join(f'{n}={{path={json.dumps(str(p))}}}\n' for n,p in deps.items())+'\n[profile.release]\nopt-level=3\nlto=false\ncodegen-units=1\n')
        (ROOT/'.cargo').mkdir(exist_ok=True)
        (ROOT/'.cargo/config.toml').write_text('[patch."https://github.com/OctoSense-org/makepad.git"]\n'+f'makepad-widgets={{path={json.dumps(str(mp/"widgets"))}}}\nmakepad-script={{path={json.dumps(str(mp/"platform/script"))}}}\n')
        with (ROOT/'.cargo/config.toml').open('a') as f:
            f.write('\n[patch."https://github.com/OctoSense-org/Octoscript.git"]\noctoscript-ui-l0={path='+json.dumps(str(kit.parent/'octoscript/crates/octoscript-ui-l0'))+'}\n')
            f.write('\n[patch."https://github.com/OctoSense-org/Octoscript-Makepad.git"]\noctoscript-node={path='+json.dumps(str(kit/'crates/octoscript-node'))+'}\n')
        env={**os.environ,'CARGO_NET_OFFLINE':'true'}
        subprocess.run([str(args.cargo_makepad.resolve()),'wasm','--no-threads','build','-p','octoscript-component-lab','--release','--locked'],cwd=ROOT,env=env,check=True)
    built=ROOT/'target/makepad-wasm-app/release/octoscript-component-lab'
    # Only replace this generated package, never a dependency checkout.
    if OUT.exists(): shutil.rmtree(OUT)
    shutil.copytree(built,OUT)
    wasm=list(OUT.glob('*.wasm'))
    if len(wasm)!=1: raise ValueError('Expected exactly one packaged WASM module')
    wasm[0].rename(OUT/'component-lab.wasm')
    retained={'IBMPlexSans-Text.ttf','IBMPlexSans-SemiBold.ttf','IBMPlexSans-Italic.ttf','IBMPlexSans-BoldItalic.ttf','NotoSans-Regular.ttf','jetbrains_mono_variable.ttf','NotoColorEmoji.ttf','fa-solid-900.ttf','Roboto-Regular.ttf'}
    for p in OUT.rglob('*'):
        if p.is_file() and p.suffix in ('.ttf','.otf') and p.name not in retained: p.unlink()
    for name in ['index.html','bridge.mjs','sources.json']: shutil.copy(ROOT/name,OUT/name)
    for name in ['material.octoscript','flutter.octoscript']: shutil.copy(ROOT/'src'/name,OUT/name)
    # Keep the iframe from stealing focus back from the surrounding documentation.
    web=OUT/'makepad_platform/web.js'; text=web.read_text()
    for old,new in [('ta.focus();','ta.focus({preventScroll:true});'),('this.text_area.focus();','this.text_area.focus({preventScroll:true});'),("ta.addEventListener('blur',e=>{\nthis.focus_keyboard_input();\n})","ta.addEventListener('blur',e=>{\nif(window.self===window.top)this.focus_keyboard_input();\n})")]:
        if old not in text: raise ValueError('Loader focus patch needs review')
        text=text.replace(old,new)
    web.write_text(text)
    licenses=OUT/'licenses';licenses.mkdir(exist_ok=True)
    shutil.copy(mp/'LICENSE',licenses/'Makepad-MIT.txt')
    shutil.copy(kit/'LICENSE-APACHE',licenses/'Octoscript-Makepad-Apache-2.0.txt')
    fonts=[p for p in OUT.rglob('*.ttf')]
    (licenses/'Fonts.txt').write_text('\n\n'.join(font_notice(p) for p in fonts)+'\n')
    (OUT/'THIRD_PARTY_NOTICES.md').write_text('# Third-party notices\n\nMakepad uses MIT. Octoscript-Makepad uses Apache-2.0 for this distribution. License texts and bundled font attribution are in licenses/. Flutter examples are independent Octoscript recreations; Flutter Engine is not included.\n')
    wasm_sha=sha(OUT/'component-lab.wasm')
    bridge=OUT/'bridge.mjs';bridge.write_text(bridge.read_text().replace("'./component-lab.wasm'",f"'./component-lab.wasm?v={wasm_sha[:16]}'"))
    index=OUT/'index.html';index.write_text(index.read_text().replace('./bridge.mjs',f'./bridge.mjs?v={wasm_sha[:16]}'))
    sources={str(p.relative_to(ROOT)):sha(p) for p in [ROOT/'src/main.rs',ROOT/'src/material.octoscript',ROOT/'src/material-kit.octoscript',ROOT/'src/flutter.octoscript',ROOT/'resources/Roboto-Regular.ttf',ROOT/'wasm-instance-layout.patch',ROOT/'Cargo.lock',ROOT/'build.py',ROOT/'bridge.mjs',ROOT/'index.html']}
    receipt={'renderer':'Makepad/WASM','threads':False,'wasm_sha256':wasm_sha,'bytes':(OUT/'component-lab.wasm').stat().st_size,'makepad':subprocess.check_output(['git','-C',str(mp),'rev-parse','HEAD'],text=True).strip(),'runtime_patch_sha256':sha(ROOT/'wasm-instance-layout.patch'),'sources':sources,'files':{str(p.relative_to(OUT)):sha(p) for p in sorted(OUT.rglob('*')) if p.is_file()}}
    (OUT/'build.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({'output':str(OUT),'wasm_bytes':receipt['bytes'],'wasm_sha256':wasm_sha}))
if __name__=='__main__': main()

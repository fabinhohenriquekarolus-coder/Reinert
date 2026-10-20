(function (root) {
  'use strict';

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  const SHOT = { wp: [-1.75, 1.25, 0.8], wl: [-0.05, 1.27, -0.4], co: [-0.7, 0.12, 0.26], cl: [0.03, 0.15, -0.14] };

  function createWeldScene(host, opts) {
    opts = opts || {};
    const THREE = root.THREE;
    THREE.ColorManagement.legacyMode = false;

    const LOOP = 14;
    const T_HELM_DOWN = 0.95, T_STRIKE = 1.65, T_START = 2.0, T_END = 9.4, T_ARC_OFF = 9.45, T_HELM_UP = 10.9;
    const T_LIFT = 10.2, T_DROP = 11.45;
    const coarse = !!(root.matchMedia && root.matchMedia('(pointer: coarse)').matches);

    const canvas = document.createElement('canvas');
    canvas.className = 'w3d-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve });
    renderer.outputEncoding = THREE.sRGBEncoding;
    let dpr = Math.min(root.devicePixelRatio || 1, coarse ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1a1713');
    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 30);

    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const UP = V(0, 1, 0);

    function canvasTex(w, h, draw, repeat) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = 4;
      if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
      return t;
    }
    function radialTex(stops) {
      return canvasTex(128, 128, (g, s) => {
        const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        stops.forEach((st) => gr.addColorStop(st[0], st[1]));
        g.fillStyle = gr;
        g.fillRect(0, 0, s, s);
      });
    }

    const GRAD = (() => {
      const c = document.createElement('canvas');
      c.width = 4; c.height = 1;
      const g = c.getContext('2d');
      ['#555555', '#929292', '#d4d4d4', '#ffffff'].forEach((s, i) => { g.fillStyle = s; g.fillRect(i, 0, 1, 1); });
      const t = new THREE.CanvasTexture(c);
      t.minFilter = t.magFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      return t;
    })();

    const wallTex = canvasTex(256, 256, (g, w, h) => {
      const r = mulberry32(11);
      g.fillStyle = '#25231f';
      g.fillRect(0, 0, w, h);
      for (let row = 0; row < 4; row++) {
        for (let c = -1; c < 3; c++) {
          const l = 66 + Math.floor(r() * 22);
          g.fillStyle = 'rgb(' + (l + 14) + ',' + (l + 8) + ',' + l + ')';
          g.fillRect(c * w / 2 + (row % 2 ? w / 4 : 0) + 3, row * h / 4 + 3, w / 2 - 6, h / 4 - 6);
        }
      }
      for (let i = 0; i < 900; i++) {
        g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.09)';
        g.fillRect(r() * w, r() * h, 2 + r() * 3, 2);
      }
      g.fillStyle = 'rgba(0,0,0,0.16)';
      g.fillRect(0, h - 40, w, 40);
    }, [7, 6]);
    const floorTex = canvasTex(256, 256, (g, w, h) => {
      const r = mulberry32(5);
      g.fillStyle = '#4a4742';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1800; i++) {
        const l = 40 + Math.floor(r() * 40);
        g.fillStyle = 'rgba(' + l + ',' + l + ',' + (l - 4) + ',0.5)';
        g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
      }
      g.fillStyle = 'rgba(20,18,16,0.28)';
      g.beginPath(); g.ellipse(70, 160, 42, 24, 0.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2a2825';
      g.fillRect(0, 0, w, 3);
      g.fillRect(0, 0, 3, h);
    }, [5, 5]);
    const hazardTex = canvasTex(256, 32, (g, w, h) => {
      g.fillStyle = '#e8e308';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#17150f';
      for (let x = -32; x < w + 32; x += 32) {
        g.beginPath();
        g.moveTo(x, h); g.lineTo(x + 16, h); g.lineTo(x + 32, 0); g.lineTo(x + 16, 0);
        g.closePath();
        g.fill();
      }
    }, [12, 1]);
    const pegTex = canvasTex(64, 64, (g, w, h) => {
      g.fillStyle = '#8a6a42';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#3b2a18';
      g.beginPath(); g.arc(w / 2, h / 2, 5, 0, Math.PI * 2); g.fill();
    }, [14, 8]);
    const signTex = canvasTex(256, 160, (g, w, h) => {
      g.fillStyle = '#e8e308';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#17150f';
      g.lineWidth = 10;
      g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = '#17150f';
      g.textAlign = 'center';
      g.font = 'bold 66px Arial, sans-serif';
      g.fillText('USE EPI', w / 2, 90);
      g.font = 'bold 20px Arial, sans-serif';
      g.fillText('MÁSCARA · LUVAS', w / 2, 130);
    });
    const labelTex = canvasTex(256, 64, (g, w, h) => {
      g.fillStyle = '#d9772b';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#1c1c1c';
      g.fillRect(0, h - 14, w, 14);
      g.fillStyle = '#ffffff';
      g.font = 'bold 44px Arial, sans-serif';
      g.fillText('E6013', 12, 44);
      g.font = 'bold 18px Arial, sans-serif';
      g.fillText('Ø 3,25 mm', 150, 40);
    });
    const ESAB_OR = '#f0680f', ESAB_DK = '#1d1f23';
    const machineSideTex = canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = '#2c2f34';
      g.fillRect(0, 0, w, h);
      g.fillStyle = ESAB_OR;
      g.fillRect(0, h - 34, w, 34);
      g.fillStyle = '#17181b';
      for (let i = 0; i < 9; i++) g.fillRect(300 + i * 20, 40, 9, 120);
      g.fillStyle = '#ffffff';
      g.font = 'bold 74px Arial, sans-serif';
      g.fillText('ESAB', 24, 118);
      g.fillStyle = '#c8cbd0';
      g.font = 'bold 24px Arial, sans-serif';
      g.fillText('ROGUE ES 180i', 28, 164);
    });
    const machinePanelTex = canvasTex(256, 400, (g, w, h) => {
      g.fillStyle = '#1b1d21';
      g.fillRect(0, 0, w, h);
      g.fillStyle = ESAB_OR;
      g.fillRect(0, 0, w, 62);
      g.fillStyle = '#ffffff';
      g.font = 'bold 50px Arial, sans-serif';
      g.fillText('ESAB', 18, 48);
      g.fillStyle = '#050505';
      g.fillRect(34, 84, 188, 84);
      g.fillStyle = '#ff6a1f';
      g.font = 'bold 72px "Courier New", monospace';
      g.textAlign = 'center';
      g.fillText('125', 118, 152);
      g.fillStyle = '#d5d8dd';
      g.font = 'bold 17px Arial, sans-serif';
      g.fillText('A', 206, 112);
      g.font = 'bold 15px Arial, sans-serif';
      g.fillText('STICK', 72, 198);
      g.fillText('LIFT TIG', 176, 198);
      g.fillText('AMPS', 70, 312);
      g.fillText('ARC FORCE', 190, 312);
    });
    const helmetTex = canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = '#17181b';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#e8e308';
      const stripe = (u) => {
        const x = u * w;
        [-w, 0, w].forEach((o) => {
          g.beginPath();
          g.moveTo(x - 30 + o, 0);
          g.lineTo(x + 30 + o, 0);
          g.lineTo(x + 18 + o, h * 0.86);
          g.lineTo(x - 18 + o, h * 0.98);
          g.closePath();
          g.fill();
        });
      };
      stripe(0.13); stripe(0.37); stripe(0.75);
    });
    const glowTex = radialTex([[0, 'rgba(255,255,255,1)'], [0.2, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,240,120,0.95)'], [0.45, 'rgba(255,214,30,0.5)'], [0.58, 'rgba(255,214,30,0)'], [1, 'rgba(255,214,30,0)']]);
    const haloTex = radialTex([[0, 'rgba(210,230,255,0.45)'], [0.25, 'rgba(165,195,255,0.18)'], [0.5, 'rgba(120,150,240,0.06)'], [0.8, 'rgba(80,100,220,0.01)'], [1, 'rgba(60,80,200,0)']]);
    const smokeTex = radialTex([[0, 'rgba(255,255,255,0.8)'], [0.7, 'rgba(255,255,255,0.7)'], [0.9, 'rgba(255,255,255,0.2)'], [1, 'rgba(255,255,255,0)']]);
    const hazTex = radialTex([[0, 'rgba(230,200,130,0)'], [0.16, 'rgba(232,200,128,0.85)'], [0.34, 'rgba(198,128,62,0.8)'], [0.52, 'rgba(128,76,140,0.7)'], [0.7, 'rgba(66,104,176,0.55)'], [0.88, 'rgba(130,146,166,0.15)'], [1, 'rgba(0,0,0,0)']]);

    const RIM = { c: new THREE.Color('#7d93b3'), k: 0.55 };
    function toon(opt, rim) {
      const m = new THREE.MeshToonMaterial(Object.assign({ gradientMap: GRAD }, opt));
      if (rim) {
        m.onBeforeCompile = (sh) => {
          sh.uniforms.uRimC = { value: RIM.c };
          sh.uniforms.uRimK = { value: rim };
          sh.fragmentShader = 'uniform vec3 uRimC;\nuniform float uRimK;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nfloat rf = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.5);\ntotalEmissiveRadiance += uRimC * uRimK * smoothstep(0.35, 0.8, rf);');
        };
      }
      return m;
    }

    const outlineMats = [];
    function outlineMat(scale) {
      const m = new THREE.ShaderMaterial({
        uniforms: { uCol: { value: new THREE.Color('#0b0a09') }, uT: { value: 0.004 } },
        vertexShader: 'attribute vec3 onormal;\nuniform float uT;\nvoid main(){\nvec4 mv = modelViewMatrix * vec4(position, 1.0);\nvec3 n = normalize(normalMatrix * onormal);\nmv.xyz += n * (uT * -mv.z);\ngl_Position = projectionMatrix * mv;\n}',
        fragmentShader: 'uniform vec3 uCol;\nvoid main(){\ngl_FragColor = vec4(uCol, 1.0);\n#include <encodings_fragment>\n}',
        side: THREE.BackSide
      });
      m.userData.scale = scale || 1;
      outlineMats.push(m);
      return m;
    }
    const OUT = outlineMat(1), OUT_THIN = outlineMat(0.6);

    function smoothN(geo) {
      const p = geo.attributes.position, n = geo.attributes.normal, map = new Map();
      const key = (i) => Math.round(p.getX(i) * 1e4) + ',' + Math.round(p.getY(i) * 1e4) + ',' + Math.round(p.getZ(i) * 1e4);
      for (let i = 0; i < p.count; i++) {
        const k = key(i);
        let a = map.get(k);
        if (!a) { a = [0, 0, 0]; map.set(k, a); }
        a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i);
      }
      const out = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const a = map.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1;
        out[i * 3] = a[0] / l; out[i * 3 + 1] = a[1] / l; out[i * 3 + 2] = a[2] / l;
      }
      geo.setAttribute('onormal', new THREE.BufferAttribute(out, 3));
      return geo;
    }
    function outlined(mesh, mat) {
      if (!mesh.geometry.attributes.onormal) smoothN(mesh.geometry);
      const o = new THREE.Mesh(mesh.geometry, mat || OUT);
      o.castShadow = false;
      o.receiveShadow = false;
      mesh.add(o);
      return mesh;
    }

    function Builder(outline) {
      const pos = [], nor = [], on = [], col = [], idx = [];
      let base = 0;
      const stack = [new THREE.Matrix4()];
      const tmp = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3();
      return {
        push(x, y, z, ry) {
          const m = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry || 0, 0)), V(1, 1, 1));
          stack.push(stack[stack.length - 1].clone().multiply(m));
        },
        pop() { stack.pop(); },
        add(geo, hex, o) {
          o = o || {};
          const g = geo.clone();
          if (outline) smoothN(g);
          const q = o.q || new THREE.Quaternion().setFromEuler(new THREE.Euler(o.r ? o.r[0] : 0, o.r ? o.r[1] : 0, o.r ? o.r[2] : 0));
          tmp.compose(V(o.p ? o.p[0] : 0, o.p ? o.p[1] : 0, o.p ? o.p[2] : 0), q, V(o.s ? o.s[0] : 1, o.s ? o.s[1] : 1, o.s ? o.s[2] : 1));
          const M = stack[stack.length - 1].clone().multiply(tmp);
          nm.getNormalMatrix(M);
          const c = new THREE.Color(hex), P = g.attributes.position, N = g.attributes.normal, O = g.attributes.onormal;
          for (let i = 0; i < P.count; i++) {
            v.fromBufferAttribute(P, i).applyMatrix4(M);
            pos.push(v.x, v.y, v.z);
            v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
            nor.push(v.x, v.y, v.z);
            if (O) { v.fromBufferAttribute(O, i).applyMatrix3(nm).normalize(); on.push(v.x, v.y, v.z); }
            col.push(c.r, c.g, c.b);
          }
          if (g.index) { for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + base); }
          else { for (let i = 0; i < P.count; i++) idx.push(i + base); }
          base += P.count;
        },
        geometry() {
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
          g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
          g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
          if (outline) g.setAttribute('onormal', new THREE.Float32BufferAttribute(on, 3));
          g.setIndex(idx);
          return g;
        }
      };
    }

    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const cyl = (r1, r2, h, s) => new THREE.CylinderGeometry(r1, r2, h, s || 14);
    const sph = (r, ws, hs) => new THREE.SphereGeometry(r, ws || 14, hs || 10);
    const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 4, 10);
    const tubeG = (pts, r, seg) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), seg || 40, r, 6, false);
    const vcol = (rim) => toon({ vertexColors: true }, rim);

    const UPQ = new THREE.Quaternion();
    function between(a, b) {
      const d = new THREE.Vector3().subVectors(b, a), l = d.length();
      return { p: [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2], q: UPQ.clone().setFromUnitVectors(UP, d.divideScalar(l || 1)), l };
    }

    const F = Builder(false), N = Builder(true), BD = Builder(true), BEADS = Builder(false);
    const TOP = 0.86;

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), toon({ map: floorTex }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -1);
    floor.receiveShadow = true;
    scene.add(floor);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), toon({ map: wallTex }));
    wall.position.set(0, 3, -2.3);
    wall.receiveShadow = true;
    scene.add(wall);
    const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), toon({ map: wallTex }));
    sideWall.position.set(3.4, 3, 1);
    sideWall.rotation.y = -Math.PI / 2;
    sideWall.receiveShadow = true;
    scene.add(sideWall);
    const hz = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.09), new THREE.MeshBasicMaterial({ map: hazardTex }));
    hz.rotation.x = -Math.PI / 2;
    hz.position.set(-0.2, 0.003, 0.95);
    scene.add(hz);
    const hz2 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.09), new THREE.MeshBasicMaterial({ map: hazardTex }));
    hz2.rotation.x = -Math.PI / 2;
    hz2.rotation.z = Math.PI / 2;
    hz2.position.set(2.0, 0.003, -0.65);
    scene.add(hz2);
    const peg = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.05), toon({ map: pegTex }));
    peg.position.set(0.25, 1.62, -2.288);
    peg.receiveShadow = true;
    scene.add(peg);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(-0.95, 1.75, -2.285);
    scene.add(sign);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.85), new THREE.MeshBasicMaterial({ color: '#c3dcf5' }));
    win.position.set(1.95, 1.95, -2.296);
    scene.add(win);
    const bulb = new THREE.Mesh(sph(0.045, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff0c4' }));
    bulb.position.set(0.05, 1.99, -0.12);
    scene.add(bulb);
    const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: '#ffd896', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 }));
    lampGlow.position.copy(bulb.position);
    lampGlow.scale.set(0.9, 0.9, 1);
    scene.add(lampGlow);

    [[1.95, 1.95, 0.04, 0.87], [1.95, 1.95, 1.12, 0.04], [1.58, 1.95, 0.04, 0.87], [2.32, 1.95, 0.04, 0.87], [1.95, 2.38, 1.14, 0.05], [1.95, 1.52, 1.14, 0.05]].forEach((p) => F.add(box(p[2], p[3], 0.04), '#262a30', { p: [p[0], p[1], -2.27] }));
    F.add(box(1.94, 0.03, 0.03), '#6a4d2e', { p: [0.25, 2.15, -2.28] });
    F.add(box(1.94, 0.03, 0.03), '#6a4d2e', { p: [0.25, 1.09, -2.28] });
    [[-0.48, '#aab4bf', 0.2], [-0.4, '#aab4bf', 0.17], [-0.32, '#aab4bf', 0.14]].forEach((t) => {
      F.add(box(0.026, t[2], 0.012), t[1], { p: [t[0], 1.66, -2.272] });
      F.add(cyl(0.026, 0.026, 0.012, 12), t[1], { p: [t[0], 1.66 + t[2] / 2, -2.272], r: [Math.PI / 2, 0, 0] });
    });
    F.add(box(0.02, 0.22, 0.012), '#8a5a30', { p: [-0.1, 1.62, -2.272] });
    F.add(box(0.12, 0.05, 0.012), '#aab4bf', { p: [-0.1, 1.75, -2.272] });
    F.add(box(0.03, 0.15, 0.012), '#c9331f', { p: [0.08, 1.6, -2.272] });
    F.add(box(0.012, 0.09, 0.012), '#aab4bf', { p: [0.08, 1.7, -2.272] });
    F.add(box(0.42, 0.014, 0.012), '#aab4bf', { p: [0.5, 1.7, -2.272] });
    F.add(box(0.014, 0.2, 0.012), '#aab4bf', { p: [0.3, 1.6, -2.272] });
    F.add(box(0.08, 0.04, 0.012), '#c9331f', { p: [0.7, 1.55, -2.272] });
    F.add(box(0.04, 0.2, 0.012), '#2a2f36', { p: [0.9, 1.6, -2.272] });
    F.add(cyl(0.075, 0.075, 0.5, 18), '#c0281f', { p: [-0.95, 0.75, -2.18] });
    F.add(sph(0.075, 14, 8), '#c0281f', { p: [-0.95, 1.0, -2.18], s: [1, 0.7, 1] });
    F.add(cyl(0.02, 0.022, 0.06, 8), '#16171a', { p: [-0.95, 1.075, -2.18] });
    F.add(box(0.1, 0.018, 0.026), '#16171a', { p: [-0.92, 1.1, -2.18] });
    F.add(box(0.36, 0.36, 0.01), '#d9d4c4', { p: [-0.95, 1.42, -2.28] });
    F.add(box(0.28, 0.28, 0.012), '#c0281f', { p: [-0.95, 1.42, -2.272] });
    [[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.2], [0.5, 0.2]].forEach((p) => F.add(box(0.04, 1.9, 0.04), '#3d4c5e', { p: [-1.75 + p[0], 0.95, -1.95 + p[1]] }));
    [0.2, 0.65, 1.1, 1.55].forEach((y, i) => {
      F.add(box(1.04, 0.025, 0.44), '#3d4c5e', { p: [-1.75, y, -1.95] });
      const cols = ['#55595e', '#b5864f', '#25507f', '#e8e308', '#b5864f'];
      for (let k = 0; k < 3; k++) F.add(box(0.24, 0.14 + ((i + k) % 3) * 0.04, 0.3), cols[(i + k) % 5], { p: [-1.75 - 0.32 + k * 0.32, y + 0.08 + ((i + k) % 3) * 0.02, -1.95] });
    });
    [[1.35, '#2f7d48', '#e9e6dd'], [1.6, '#7c2233', '#e9e6dd']].forEach((c) => {
      F.add(cyl(0.11, 0.11, 1.25, 20), c[1], { p: [c[0], 0.625, -2.05] });
      F.add(sph(0.11, 16, 8), c[1], { p: [c[0], 1.25, -2.05], s: [1, 0.9, 1] });
      F.add(cyl(0.113, 0.113, 0.06, 20), c[2], { p: [c[0], 0.98, -2.05] });
      F.add(cyl(0.03, 0.04, 0.08, 10), '#c9a24a', { p: [c[0], 1.39, -2.05] });
      F.add(cyl(0.012, 0.012, 0.06, 8), '#c9a24a', { p: [c[0] + 0.045, 1.4, -2.05], r: [0, 0, Math.PI / 2] });
      F.add(cyl(0.035, 0.035, 0.014, 12), '#16171a', { p: [c[0], 1.44, -2.05] });
    });
    [0, 1, 2, 3].forEach((i) => {
      const L = 2.5 - (i % 2) * 0.2;
      F.add(i % 2 ? cyl(0.018, 0.018, L, 8) : box(0.05, L, 0.05), i % 2 ? '#5f7186' : '#7a4f3a', { p: [2.55 + i * 0.11, L / 2 * Math.cos(0.18), -2.27 + Math.sin(0.18) * L / 2], r: [-0.18, 0, 0] });
    });
    F.add(cyl(0.006, 0.006, 0.6, 6), '#16171a', { p: [0.05, 2.32, -0.12] });
    F.add(new THREE.LatheGeometry([[0.03, 0.12], [0.05, 0.09], [0.1, 0.03], [0.21, -0.06], [0.215, -0.07]].map((p) => new THREE.Vector2(p[0], p[1])), 18), '#2a3b30', { p: [0.05, 2.02, -0.12] });

    N.add(box(1.4, 0.04, 0.72), '#43505e', { p: [0, TOP - 0.02, 0] });
    N.add(box(1.36, 0.006, 0.68), '#566475', { p: [0, TOP + 0.001, 0] });
    [[-0.66, -0.32], [0.66, -0.32], [-0.66, 0.32], [0.66, 0.32]].forEach((p) => N.add(box(0.05, TOP - 0.04, 0.05), '#2a3039', { p: [p[0], (TOP - 0.04) / 2, p[1]] }));
    N.add(box(1.32, 0.025, 0.64), '#38424e', { p: [0, 0.2, 0] });
    N.add(box(1.32, 0.05, 0.02), '#2a3039', { p: [0, TOP - 0.065, 0.335] });
    N.add(box(1.32, 0.05, 0.02), '#2a3039', { p: [0, TOP - 0.065, -0.335] });

    const PZ = -0.05, BP = TOP + 0.016, TS = 0.012, TH = 0.13, PL = 0.22;
    N.add(box(0.32, 0.016, 0.32), '#7c8896', { p: [0, TOP + 0.008, PZ] });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((p) => N.add(cyl(0.011, 0.011, 0.002, 12), '#0f1012', { p: [p[0] * 0.13, BP + 0.001, PZ + p[1] * 0.13] }));
    N.add(box(TS, TH, PL), '#66727f', { p: [0, BP + TH / 2, PZ] });
    N.add(box(TS + 0.002, 0.0016, PL + 0.002), '#8e99a6', { p: [0, BP + TH + 0.0008, PZ] });
    [PZ - PL / 2 + 0.03, PZ + PL / 2 - 0.03].forEach((zz) => N.add(box(0.075, 0.016, 0.014), '#2a2f36', { p: [0.04, BP + 0.008, zz] }));
    N.add(box(0.008, 0.07, 0.14), '#2a2f36', { p: [TS / 2 + 0.004, BP + 0.04, PZ] });
    N.add(box(0.04, 0.012, 0.14), '#2a2f36', { p: [TS / 2 + 0.02, BP + 0.006, PZ] });
    N.add(cyl(0.007, 0.007, 0.03, 10), '#c9331f', { p: [TS / 2 + 0.017, BP + 0.027, PZ], r: [0, 0, Math.PI / 2] });

    const coldSegs = [];
    const cold = (a, b) => coldSegs.push([a, b]);
    [PZ + PL / 2, PZ - PL / 2].forEach((ez) => {
      const sg = Math.sign(ez - PZ);
      cold(V(-TS / 2 - 0.004, BP + 0.004, ez - sg * 0.002), V(-TS / 2 - 0.004, BP + 0.004, ez - sg * 0.012));
      cold(V(TS / 2 + 0.004, BP + 0.004, ez - sg * 0.002), V(TS / 2 + 0.004, BP + 0.004, ez - sg * 0.012));
    });
    const bs = sph(1, 6, 4);
    coldSegs.forEach((sg) => {
      const n = Math.max(2, Math.floor(sg[0].distanceTo(sg[1]) / 0.0036));
      for (let k = 0; k < n; k++) {
        const p = new THREE.Vector3().lerpVectors(sg[0], sg[1], k / (n - 1));
        BEADS.add(bs, '#8a7556', { p: [p.x, p.y, p.z], s: [0.0046, 0.0046, 0.0046] });
      }
    });

    const BOX = V(-0.36, TOP, -0.25);
    N.push(BOX.x, BOX.y, BOX.z, 0);
    N.add(box(0.3, 0.004, 0.06), '#b98a52', { p: [0, 0.002, 0] });
    N.add(box(0.3, 0.036, 0.004), '#b98a52', { p: [0, 0.02, 0.028] });
    N.add(box(0.3, 0.036, 0.004), '#b98a52', { p: [0, 0.02, -0.028] });
    N.add(box(0.004, 0.036, 0.06), '#b98a52', { p: [0.148, 0.02, 0] });
    N.add(box(0.004, 0.036, 0.06), '#b98a52', { p: [-0.148, 0.02, 0] });
    N.add(box(0.3, 0.004, 0.06), '#a37744', { p: [0, 0.062, -0.056], r: [-1.25, 0, 0] });
    N.pop();
    for (let i = 0; i < 6; i++) BEADS.add(cyl(0.0032, 0.0032, 0.292, 6), '#e1d5ac', { p: [BOX.x, BOX.y + 0.0075 + (i % 2) * 0.006, BOX.z - 0.022 + i * 0.0085], r: [0, 0, Math.PI / 2] });

    N.add(cyl(0.011, 0.011, 0.24, 8), '#8a5a30', { p: [0.3, TOP + 0.012, 0.24], r: [0, 0.3, Math.PI / 2] });
    N.add(box(0.022, 0.022, 0.15), '#aab4bf', { p: [0.4, TOP + 0.012, 0.19], r: [0, 0.3, 0] });
    N.add(box(0.012, 0.012, 0.13), '#2a2f36', { p: [0.2, TOP + 0.006, 0.28], r: [0, 0.5, 0] });
    N.add(box(0.034, 0.014, 0.02), '#c9a24a', { p: [0.178, TOP + 0.012, 0.222], r: [0, 0.5, 0] });

    const MW = 0.153, MH = 0.26, MD = 0.36, MACH = V(0.5, TOP, -0.21), MRY = -0.9;
    const machineM = new THREE.Matrix4().compose(MACH, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, MRY, 0)), V(1, 1, 1));
    N.push(MACH.x, MACH.y, MACH.z, MRY);
    const MB = 0.016;
    N.add(box(MW, MH, MD), '#2c2f34', { p: [0, MB + MH / 2, 0] });
    N.add(box(MW + 0.012, MH + 0.012, 0.03), '#1b1d21', { p: [0, MB + MH / 2, MD / 2 + 0.006] });
    N.add(box(MW + 0.012, MH + 0.012, 0.03), '#1b1d21', { p: [0, MB + MH / 2, -MD / 2 - 0.006] });
    N.add(box(MW + 0.004, 0.012, MD + 0.004), '#3a3e44', { p: [0, MB + MH + 0.006, 0] });
    N.add(box(0.03, 0.036, 0.024), '#1b1d21', { p: [0, MB + MH + 0.018, 0.1] });
    N.add(box(0.03, 0.036, 0.024), '#1b1d21', { p: [0, MB + MH + 0.018, -0.1] });
    N.add(box(0.036, 0.022, 0.224), '#1b1d21', { p: [0, MB + MH + 0.04, 0] });
    N.add(box(0.032, 0.006, 0.226), ESAB_OR, { p: [0, MB + MH + 0.0525, 0] });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((q) => N.add(cyl(0.01, 0.012, MB, 8), '#101012', { p: [q[0] * 0.05, MB / 2, q[1] * 0.14] }));
    const FZ = MD / 2 + 0.006 + 0.015;
    N.add(cyl(0.025, 0.026, 0.02, 16), '#101012', { p: [-0.034, 0.122, FZ + 0.01], r: [Math.PI / 2, 0, 0] });
    N.add(cyl(0.021, 0.021, 0.006, 16), '#aab4bf', { p: [-0.034, 0.122, FZ + 0.023], r: [Math.PI / 2, 0, 0] });
    N.add(box(0.004, 0.016, 0.004), ESAB_OR, { p: [-0.034, 0.131, FZ + 0.027] });
    N.add(cyl(0.016, 0.017, 0.016, 14), '#101012', { p: [0.036, 0.122, FZ + 0.008], r: [Math.PI / 2, 0, 0] });
    N.add(cyl(0.012, 0.012, 0.004, 14), '#aab4bf', { p: [0.036, 0.122, FZ + 0.018], r: [Math.PI / 2, 0, 0] });
    N.add(box(0.003, 0.011, 0.003), ESAB_OR, { p: [0.036, 0.1285, FZ + 0.021] });
    [-0.04, 0.04].forEach((x) => {
      N.add(cyl(0.017, 0.018, 0.016, 14), '#101012', { p: [x, 0.05, FZ + 0.008], r: [Math.PI / 2, 0, 0] });
      N.add(cyl(0.0095, 0.0095, 0.004, 10), '#c9a24a', { p: [x, 0.05, FZ + 0.017], r: [Math.PI / 2, 0, 0] });
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(MW - 0.004, MH - 0.004), new THREE.MeshBasicMaterial({ map: machinePanelTex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    panel.position.set(0, MB + MH / 2, FZ + 0.0012);
    const side1 = new THREE.Mesh(new THREE.PlaneGeometry(MD * 0.92, MH * 0.9), new THREE.MeshBasicMaterial({ map: machineSideTex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    side1.position.set(MW / 2 + 0.0015, MB + MH / 2, 0);
    side1.rotation.y = Math.PI / 2;
    const side2 = side1.clone();
    side2.position.x = -MW / 2 - 0.0015;
    side2.rotation.y = -Math.PI / 2;
    const machineDecals = new THREE.Group();
    machineDecals.add(panel, side1, side2);
    machineDecals.matrixAutoUpdate = false;
    machineDecals.matrix.copy(machineM);
    scene.add(machineDecals);
    N.pop();
    const mw = (x, y, z) => V(x, y, z).applyMatrix4(machineM);
    const sockAW = mw(-0.04, 0.05, FZ + 0.03), sockBW = mw(0.04, 0.05, FZ + 0.03);
    const sockAOut = mw(-0.04, 0.05, FZ + 0.1), sockBOut = mw(0.04, 0.05, FZ + 0.1);

    const GC = V(0.15, BP, PZ - 0.1);
    N.add(box(0.034, 0.02, 0.05), '#c98b3f', { p: [GC.x, GC.y + 0.01, GC.z] });
    N.add(box(0.05, 0.012, 0.024), '#c9331f', { p: [GC.x + 0.04, GC.y + 0.02, GC.z], r: [0, 0, 0.35] });
    N.add(box(0.03, 0.006, 0.04), '#8a8f97', { p: [GC.x - 0.012, GC.y + 0.003, GC.z] });
    BEADS.add(tubeG([V(GC.x + 0.05, GC.y + 0.016, GC.z), V(0.26, TOP + 0.012, PZ - 0.05), sockBOut, sockBW], 0.0105, 70), '#17181b');

    const eBoxLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.292, 0.034), new THREE.MeshBasicMaterial({ map: labelTex }));
    eBoxLabel.position.set(BOX.x, BOX.y + 0.021, BOX.z + 0.0302);
    scene.add(eBoxLabel);

    const farMesh = new THREE.Mesh(F.geometry(), vcol(0));
    farMesh.receiveShadow = true;
    scene.add(farMesh);
    const nearMesh = outlined(new THREE.Mesh(N.geometry(), vcol(0)), OUT);
    nearMesh.castShadow = true;
    nearMesh.receiveShadow = true;
    scene.add(nearMesh);
    const beadsMesh = new THREE.Mesh(BEADS.geometry(), vcol(0));
    beadsMesh.receiveShadow = true;
    scene.add(beadsMesh);

    const P0 = V(0, 0.86, -0.75);
    const LEAN = V(0, 0.94, 0.34).normalize();
    const along = (k) => P0.clone().addScaledVector(LEAN, k);
    const NECK0 = along(0.6);
    const NECK1 = NECK0.clone().add(V(0, 0.068, 0.036));
    const HEAD = NECK1.clone().addScaledVector(V(0, 0.75, 0.66).normalize(), 0.118);
    const SH_R = along(0.545).add(V(-0.15, 0, 0));
    const SH_L = along(0.545).add(V(0.15, 0, 0));
    const HIP_R = V(-0.092, 0.905, -0.745), HIP_L = V(0.092, 0.905, -0.755);
    const KNEE_R = V(-0.108, 0.49, -0.68), KNEE_L = V(0.122, 0.49, -0.715);
    const ANK_R = V(-0.115, 0.078, -0.715), ANK_L = V(0.135, 0.078, -0.765);

    const SKIN = '#26272d';
    BD.add(new THREE.LatheGeometry([[0, 0], [0.1, 0], [0.135, 0.04], [0.14, 0.11], [0.125, 0.22], [0.13, 0.32], [0.155, 0.43], [0.17, 0.5], [0.165, 0.55], [0.13, 0.595], [0.07, 0.62], [0.0001, 0.63]].map((p) => new THREE.Vector2(p[0], p[1])), 22), SKIN, { p: [P0.x, P0.y, P0.z], q: new THREE.Quaternion().setFromUnitVectors(UP, LEAN), s: [1, 1, 0.66] });
    [[NECK0, NECK1, 0.042], [HIP_R, KNEE_R, 0.058], [HIP_L, KNEE_L, 0.058], [KNEE_R, ANK_R, 0.046], [KNEE_L, ANK_L, 0.046]].forEach((l) => {
      const b = between(l[0], l[1]);
      BD.add(cap(l[2], b.l), SKIN, { p: b.p, q: b.q });
    });
    [ANK_R, ANK_L].forEach((a) => {
      const b = between(a.clone().add(V(0, -0.048, -0.03)), a.clone().add(V(0, -0.048, 0.12)));
      BD.add(cap(0.042, b.l), SKIN, { p: b.p, q: b.q, s: [1, 1, 0.7] });
    });
    BD.add(sph(0.056, 12, 8), SKIN, { p: [SH_R.x, SH_R.y, SH_R.z] });
    BD.add(sph(0.056, 12, 8), SKIN, { p: [SH_L.x, SH_L.y, SH_L.z] });
    const bodyMesh = outlined(new THREE.Mesh(BD.geometry(), vcol(RIM.k)), OUT);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    scene.add(bodyMesh);

    const helmetPivot = new THREE.Group();
    helmetPivot.position.copy(HEAD);
    scene.add(helmetPivot);
    const head = outlined(new THREE.Mesh(sph(0.125, 20, 14), toon({ color: SKIN }, RIM.k)), OUT);
    head.castShadow = true;
    helmetPivot.add(head);
    const helmetFlip = new THREE.Group();
    helmetPivot.add(helmetFlip);
    const shellGeo = (() => {
      const r = 0.16;
      const g = new THREE.SphereGeometry(r, 28, 18, 0, Math.PI * 2, 0, 2.0);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        y *= 1.12;
        if (z > 0 && y < 0.02) z += (0.02 - y) * 0.5 * Math.min(1, z / r);
        x *= 0.95;
        p.setXYZ(i, x, y, z * 0.96 + 0.015);
      }
      g.computeVertexNormals();
      return g;
    })();
    const shell = outlined(new THREE.Mesh(shellGeo, toon({ map: helmetTex }, 0.5)), OUT);
    shell.castShadow = true;
    shell.position.y = -0.005;
    helmetFlip.add(shell);
    const shellIn = new THREE.Mesh(shellGeo, toon({ color: '#0c0c0e', side: THREE.BackSide }));
    shellIn.position.y = -0.005;
    helmetFlip.add(shellIn);
    const HA = Builder(true);
    HA.add(box(0.14, 0.092, 0.036), '#0e0e10', { p: [0, 0.022, 0.158] });
    HA.add(cyl(0.032, 0.032, 0.026, 18), '#0e0e10', { p: [0.153, 0, 0.012], r: [0, 0, Math.PI / 2] });
    HA.add(cyl(0.024, 0.024, 0.026, 18), '#0e0e10', { p: [-0.153, 0, 0.012], r: [0, 0, Math.PI / 2] });
    HA.add(box(0.07, 0.014, 0.012), '#e8e308', { p: [0, -0.034, 0.168] });
    const helmAcc = outlined(new THREE.Mesh(HA.geometry(), vcol(0.4)), OUT_THIN);
    helmAcc.castShadow = true;
    helmetFlip.add(helmAcc);
    const visorMat = new THREE.MeshBasicMaterial({ color: '#6d4cb6' });
    const visor = new THREE.Mesh(box(0.108, 0.056, 0.004), visorMat);
    visor.position.set(0, 0.026, 0.178);
    helmetFlip.add(visor);
    const glint = new THREE.Mesh(box(0.012, 0.05, 0.002), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35 }));
    glint.position.set(-0.03, 0.026, 0.181);
    glint.rotation.z = 0.35;
    helmetFlip.add(glint);

    const GLOVE = '#c88240', GLOVE_D = '#a9672d', CUFF = '#8e5a2c';
    const limbMat = toon({ color: SKIN }, RIM.k);
    function limb(r, len) {
      const m = outlined(new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), limbMat), OUT);
      m.castShadow = true;
      scene.add(m);
      return m;
    }
    const A_UP = 0.3, A_FORE = 0.27;
    const upperR = limb(0.044, A_UP), foreR = limb(0.037, A_FORE), upperL = limb(0.044, A_UP), foreL = limb(0.037, A_FORE);
    const gloveMat = toon({ vertexColors: true, side: THREE.DoubleSide }, 0.3);
    function cuffMesh() {
      const G = Builder(true);
      G.add(sph(0.036, 12, 8), GLOVE, {});
      G.add(new THREE.CylinderGeometry(0.047, 0.042, 0.1, 14, 1, true), CUFF, { p: [0, 0.045, 0] });
      const m = outlined(new THREE.Mesh(G.geometry(), gloveMat), OUT_THIN);
      m.castShadow = true;
      scene.add(m);
      return m;
    }
    const cuffR = cuffMesh(), cuffL = cuffMesh();

    const HB_ = Builder(true);
    HB_.add(cyl(0.019, 0.021, 0.15, 16), '#17181b', {});
    HB_.add(cyl(0.021, 0.025, 0.02, 16), '#17181b', { p: [0, -0.085, 0] });
    HB_.add(cyl(0.031, 0.031, 0.008, 18), '#17181b', { p: [0, 0.078, 0] });
    HB_.add(cyl(0.009, 0.016, 0.075, 10), '#17181b', { p: [0, 0.118, -0.006], r: [-0.08, 0, 0] });
    HB_.add(cyl(0.008, 0.011, 0.13, 8), '#17181b', { p: [0, 0.09, 0.024], r: [0.2, 0, 0] });
    HB_.add(box(0.012, 0.008, 0.014), '#c98b3f', { p: [0, 0.153, 0.003] });
    HB_.add(box(0.074, 0.066, 0.026), GLOVE, { p: [0, -0.03, 0.03] });
    [-0.058, -0.036, -0.014, 0.008].forEach((yy, i) => {
      const t = new THREE.TorusGeometry(0.0295, 0.0105, 6, 14, 4.9);
      t.rotateX(Math.PI / 2);
      t.rotateY(-5.4);
      HB_.add(t, i % 2 ? GLOVE_D : GLOVE, { p: [0, yy, 0] });
    });
    HB_.add(cap(0.0125, 0.03), GLOVE, { p: [0.034, 0.012, 0.012], r: [0.2, 0, -0.5] });
    const holder = outlined(new THREE.Mesh(HB_.geometry(), vcol(0.3)), OUT);
    holder.castShadow = true;
    scene.add(holder);

    const HL = Builder(true);
    HL.add(box(0.066, 0.064, 0.02), GLOVE, { p: [0, 0.032, 0] });
    [[-0.024, 0.032], [-0.008, 0.042], [0.008, 0.045], [0.024, 0.038]].forEach((f, i) => HL.add(cap(0.0105, f[1]), i % 2 ? GLOVE : GLOVE_D, { p: [f[0], 0.064 + f[1] / 2 + 0.006, 0.002], r: [0, 0, f[0] * -1.2] }));
    HL.add(cap(0.0118, 0.03), GLOVE, { p: [0.044, 0.03, 0], r: [0, 0, -0.9] });
    const handL = outlined(new THREE.Mesh(HL.geometry(), vcol(0.3)), OUT);
    handL.castShadow = true;
    scene.add(handL);

    const rodGeo = new THREE.CylinderGeometry(0.0034, 0.0034, 1, 8);
    rodGeo.translate(0, 0.5, 0);
    const rod = new THREE.Mesh(rodGeo, new THREE.MeshBasicMaterial({ color: '#e6d9aa' }));
    scene.add(rod);
    const stubGeo = new THREE.CylinderGeometry(0.0028, 0.0028, 1, 8);
    stubGeo.translate(0, 0.5, 0);
    const stub = new THREE.Mesh(stubGeo, new THREE.MeshBasicMaterial({ color: '#9aa7b6' }));
    scene.add(stub);
    const oldStub = new THREE.Mesh(rodGeo, rod.material);
    oldStub.visible = false;
    scene.add(oldStub);

    const emberMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.5, 0.15), transparent: true });
    const ember = new THREE.Mesh(sph(0.0042, 8, 6), emberMat);
    scene.add(ember);
    const poolMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.92, 0.6), transparent: true });
    const pool = new THREE.Mesh(sph(1, 10, 8), poolMat);
    pool.scale.set(0.0068, 0.0068, 0.0078);
    scene.add(pool);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true }));
    glow.renderOrder = 10;
    scene.add(glow);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true }));
    halo.renderOrder = 9;
    scene.add(halo);
    const arcLight = new THREE.PointLight('#d7e6ff', 0, 3.2, 2);
    scene.add(arcLight);

    scene.add(new THREE.HemisphereLight('#a7b4cc', '#4a3d30', 0.85));
    const key = new THREE.DirectionalLight('#fff1d6', 1.25);
    key.position.set(1.6, 3.4, 2.2);
    key.target.position.set(0, 0.9, -0.3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -1.3, right: 1.3, top: 1.5, bottom: -1.0, near: 1, far: 8 });
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.02;
    scene.add(key, key.target);

    const CX = -TS / 2, Z0 = PZ + PL / 2 - 0.016, Z1 = PZ - PL / 2 + 0.016;
    const STEP = 0.0014;
    const N_BEAD = Math.floor((Z0 - Z1) / STEP);
    const beadT = new Float32Array(N_BEAD);
    const beadGeo = new THREE.SphereGeometry(1, 8, 6);
    const heatArr = new Float32Array(N_BEAD);
    const heatAttr = new THREE.InstancedBufferAttribute(heatArr, 1);
    heatAttr.setUsage(THREE.DynamicDrawUsage);
    beadGeo.setAttribute('aHeat', heatAttr);
    const beadMat = toon({ color: '#807a70' });
    beadMat.onBeforeCompile = (sh) => {
      sh.vertexShader = 'attribute float aHeat;\nvarying float vHeat;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvHeat = aHeat;');
      sh.fragmentShader = 'varying float vHeat;\n' + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\nfloat hh = clamp(vHeat, 0.0, 1.0);\nvec3 tmp = mix(vec3(0.1,0.085,0.075), vec3(0.3,0.2,0.12), smoothstep(0.12,0.3,hh));\ndiffuseColor.rgb = mix(diffuseColor.rgb, tmp, smoothstep(0.0,0.05,hh) * (1.0 - smoothstep(0.2,0.34,hh)));')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nvec3 hotC = mix(vec3(0.9,0.14,0.0), vec3(1.0,0.82,0.4), smoothstep(0.55,1.0,hh));\ntotalEmissiveRadiance += hotC * pow(hh, 1.6) * 1.6;');
    };
    const bead = new THREE.InstancedMesh(beadGeo, beadMat, N_BEAD);
    bead.castShadow = true;
    scene.add(bead);
    const hazMat = new THREE.MeshBasicMaterial({ map: hazTex, transparent: true, opacity: 0.38, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
    const hazFlatGeo = new THREE.CircleGeometry(1, 20);
    hazFlatGeo.rotateX(-Math.PI / 2);
    const N_HAZ = Math.ceil(N_BEAD / 2);
    const hazFlat = new THREE.InstancedMesh(hazFlatGeo, hazMat, N_HAZ);
    scene.add(hazFlat);
    {
      const r = mulberry32(3);
      const q = new THREE.Quaternion(), p = V(0, 0, 0), s = V(1, 1, 1), mt = new THREE.Matrix4();
      for (let i = 0; i < N_BEAD; i++) {
        beadT[i] = T_START + ((i * STEP) / (Z0 - Z1)) * (T_END - T_START);
        const wv = 0.0012 * Math.sin(2 * Math.PI * 2.6 * (beadT[i] - T_START));
        p.set(CX - 0.0036 + wv, BP + 0.0036 + wv, Z0 - i * STEP);
        s.set(0.0068 * (1 + 0.1 * r()), 0.0068 * (1 + 0.1 * r()), 0.0072 * (1 + 0.1 * r()));
        q.setFromAxisAngle(V(0, 0, 1), Math.PI / 4 + (r() - 0.5) * 0.3);
        mt.compose(p, q, s);
        bead.setMatrixAt(i, mt);
        if (i % 2 === 0) {
          q.identity();
          p.set(CX - 0.006, BP + 0.0004, Z0 - i * STEP);
          s.set(0.03, 1, 0.03);
          mt.compose(p, q, s);
          hazFlat.setMatrixAt(i / 2, mt);
        }
      }
    }

    const SP = 200;
    const spP = new Float32Array(SP * 3), spV = new Float32Array(SP * 3), spL = new Float32Array(SP), spMax = new Float32Array(SP);
    const rPos = new Float32Array(SP * 12), rCol = new Float32Array(SP * 12), rIdx = new Uint16Array(SP * 6);
    for (let i = 0; i < SP; i++) rIdx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3], i * 6);
    const spGeo = new THREE.BufferGeometry();
    spGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3).setUsage(THREE.DynamicDrawUsage));
    spGeo.setAttribute('color', new THREE.BufferAttribute(rCol, 3).setUsage(THREE.DynamicDrawUsage));
    spGeo.setIndex(new THREE.BufferAttribute(rIdx, 1));
    const sparks = new THREE.Mesh(spGeo, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, side: THREE.DoubleSide }));
    sparks.frustumCulled = false;
    scene.add(sparks);
    let spHead = 0, emitAcc = 0, smokeAcc = 0, rng = mulberry32(7);

    const SM = 10;
    const smoke = [];
    for (let i = 0; i < SM; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0, color: '#c9ced6' }));
      sp.visible = false;
      scene.add(sp);
      smoke.push({ sp, p: V(0, 0, 0), v: V(0, 0, 0), age: 0, life: 0, s0: 0 });
    }
    let smHead = 0;

    const E_DIR = V(-0.7, 0.7, -0.15).normalize();
    const HB = V(-0.1, 0.35, -1.0).normalize();
    const FWD = HB.clone().negate();
    const WRIST_LIFT = V(0, 0.018, 0);

    function weldTip(t, out) {
      const ox = CX - 0.004, oy = BP + 0.004;
      let x, y, z;
      if (t < T_STRIKE) {
        const k = smooth(0.5, T_STRIKE, t);
        x = ox - 0.02 + 0.018 * k;
        y = oy + 0.03 - 0.026 * k;
        z = Z0 + 0.006;
      } else if (t < T_START) {
        const k = (t - T_STRIKE) / (T_START - T_STRIKE);
        x = ox - 0.002 * Math.sin(k * Math.PI);
        y = oy + 0.002 * Math.sin(k * Math.PI);
        z = Z0 + 0.006 * (1 - k);
      } else if (t < T_END) {
        const k = (t - T_START) / (T_END - T_START);
        const wv = 0.0022 * Math.sin(2 * Math.PI * 2.6 * (t - T_START));
        x = ox + wv * 0.7;
        y = oy + wv * 0.7;
        z = Z0 + (Z1 - Z0) * k;
      } else {
        const k = smooth(T_END, T_END + 0.8, t);
        x = ox - 0.05 * k;
        y = oy + 0.07 * k;
        z = Z1 - 0.01 * k;
      }
      return out.set(x, y, z);
    }
    function electrodeLen(t) {
      if (t < T_START) return 0.3;
      if (t < T_END) return 0.3 - 0.145 * ((t - T_START) / (T_END - T_START));
      if (t < T_DROP) return 0.155;
      if (t < 11.95) return 0;
      return 0.3;
    }
    const C_START = weldTip(0, V(0, 0, 0)).addScaledVector(E_DIR, 0.3);
    const C_LIFT = weldTip(T_LIFT, V(0, 0, 0)).addScaledVector(E_DIR, 0.155);
    const BOX_TOP = BOX.clone().add(V(0, 0.05, 0));
    const C_HIGH = BOX_TOP.clone().addScaledVector(E_DIR, 0.25);
    const C_LOW = BOX_TOP.clone().addScaledVector(E_DIR, 0.18);
    const C_UP = C_LOW.clone().add(V(0.02, 0.24, 0.02));
    const KEYS = [[T_LIFT, C_LIFT], [11.3, C_HIGH], [11.55, C_HIGH], [11.85, C_LOW], [12.0, C_LOW], [12.7, C_UP], [13.6, C_START], [LOOP, C_START]];
    function clampAt(t, out) {
      if (t < T_LIFT) return weldTip(t, out).addScaledVector(E_DIR, electrodeLen(t));
      for (let i = 0; i < KEYS.length - 1; i++) {
        const a = KEYS[i], b = KEYS[i + 1];
        if (t <= b[0]) return out.lerpVectors(a[1], b[1], easeInOut(clamp((t - a[0]) / (b[0] - a[0]), 0, 1)));
      }
      return out.copy(C_START);
    }
    function tipAt(t, out) {
      clampAt(t, out);
      return out.addScaledVector(E_DIR, -electrodeLen(t));
    }
    function arcLevel(t) {
      if (t < T_STRIKE || t > T_ARC_OFF) return 0;
      const attack = smooth(T_STRIKE, T_STRIKE + 0.05, t);
      const release = 1 - smooth(T_ARC_OFF - 0.05, T_ARC_OFF, t);
      const scratch = t < T_START ? 0.35 * hash(Math.floor(t * 40)) : 0;
      const n = 0.74 + 0.13 * Math.sin(t * 61.3) + 0.08 * Math.sin(t * 137.9 + 1.3) + 0.06 * Math.sin(t * 23.1 + 0.4);
      const spike = hash(Math.floor(t * 30)) > 0.86 ? 0.3 : 0;
      return attack * release * (n + spike + scratch);
    }
    const helmetUp = (t) => 1 - smooth(T_HELM_DOWN, T_HELM_DOWN + 0.32, t) + smooth(T_HELM_UP, T_HELM_UP + 0.34, t);

    function resetParticles() {
      rng = mulberry32(7);
      spL.fill(0);
      emitAcc = 0;
      smokeAcc = 0;
      smoke.forEach((s) => { s.life = 0; s.sp.visible = false; });
    }
    const _tip = V(0, 0, 0);
    function emitSpark(o, boost) {
      const i = spHead;
      spHead = (spHead + 1) % SP;
      const a = rng() * Math.PI * 2, up = 0.25 + rng() * 0.75, sp = (0.6 + rng() * 1.9) * (boost || 1);
      const hr = Math.sqrt(1 - up * up);
      spP[i * 3] = o.x - 0.003; spP[i * 3 + 1] = o.y + 0.002; spP[i * 3 + 2] = o.z;
      spV[i * 3] = (Math.cos(a) * hr - 0.45) * sp;
      spV[i * 3 + 1] = up * sp;
      spV[i * 3 + 2] = (Math.sin(a) * hr + 0.2) * sp;
      spMax[i] = spL[i] = 0.3 + rng() * 0.6;
    }
    function surfaceY(x, z) {
      if (Math.abs(x) < 0.16 && Math.abs(z - PZ) < 0.16) return BP;
      if (Math.abs(x) < 0.7 && Math.abs(z) < 0.36) return TOP;
      return 0;
    }
    function simulate(dt, t, prev) {
      if (dt <= 0) return;
      const lvl = arcLevel(t);
      tipAt(t, _tip);
      if (prev < T_STRIKE && t >= T_STRIKE) for (let k = 0; k < 40; k++) emitSpark(_tip, 1.25);
      if (lvl > 0) {
        emitAcc += dt * 120 * Math.min(1.3, lvl);
        while (emitAcc >= 1) { emitSpark(_tip); emitAcc -= 1; }
      }
      const g = 9.8 * dt, drag = 1 - 0.6 * dt;
      for (let i = 0; i < SP; i++) {
        if (spL[i] <= 0) continue;
        const j = i * 3;
        spV[j + 1] -= g;
        spV[j] *= drag; spV[j + 1] *= drag; spV[j + 2] *= drag;
        spP[j] += spV[j] * dt; spP[j + 1] += spV[j + 1] * dt; spP[j + 2] += spV[j + 2] * dt;
        if (spP[j] > CX && spP[j] < -CX && Math.abs(spP[j + 2] - PZ) < PL / 2 && spP[j + 1] < BP + TH) {
          spP[j] = CX - 0.001;
          spV[j] = -Math.abs(spV[j]) * 0.4;
        }
        const sy = surfaceY(spP[j], spP[j + 2]);
        if (spP[j + 1] < sy && spV[j + 1] < 0) {
          spP[j + 1] = sy;
          spV[j + 1] *= -0.32; spV[j] *= 0.55; spV[j + 2] *= 0.55;
          spL[i] -= 0.08;
        }
        spL[i] -= dt;
      }
      const smokeOn = lvl > 0 || (t > T_ARC_OFF && t < T_ARC_OFF + 1.2);
      if (smokeOn) {
        smokeAcc += dt;
        while (smokeAcc > 0.3) {
          smokeAcc -= 0.3;
          const s = smoke[smHead];
          smHead = (smHead + 1) % SM;
          s.p.set(_tip.x - 0.01, _tip.y + 0.01, _tip.z);
          s.v.set(-0.05 + rng() * 0.04, 0.12 + rng() * 0.09, rng() * 0.04);
          s.age = 0;
          s.life = 2.6 + rng() * 0.6;
          s.s0 = 0.05 + rng() * 0.03;
          s.sp.visible = true;
        }
      }
      smoke.forEach((s) => {
        if (s.life <= 0) return;
        s.age += dt;
        if (s.age >= s.life) { s.life = 0; s.sp.visible = false; return; }
        s.p.addScaledVector(s.v, dt);
        s.v.x -= 0.02 * dt;
      });
    }
    const _pd = V(0, 0, 0), _pv = V(0, 0, 0), _pp = V(0, 0, 0);
    function writeParticles() {
      for (let i = 0; i < SP; i++) {
        const j = i * 3, k = i * 12;
        if (spL[i] <= 0) {
          for (let m = 0; m < 12; m++) { rPos[k + m] = 0; rCol[k + m] = 0; }
          continue;
        }
        const f = spL[i] / spMax[i];
        _pd.set(spV[j], spV[j + 1], spV[j + 2]).multiplyScalar(0.035);
        const px = spP[j], py = spP[j + 1], pz = spP[j + 2];
        _pv.set(px - camera.position.x, py - camera.position.y, pz - camera.position.z);
        const dist = _pv.length();
        _pp.crossVectors(_pd, _pv).normalize().multiplyScalar(0.0046 * dist);
        rPos[k] = px + _pp.x; rPos[k + 1] = py + _pp.y; rPos[k + 2] = pz + _pp.z;
        rPos[k + 3] = px - _pp.x; rPos[k + 4] = py - _pp.y; rPos[k + 5] = pz - _pp.z;
        rPos[k + 6] = px - _pd.x + _pp.x * 0.35; rPos[k + 7] = py - _pd.y + _pp.y * 0.35; rPos[k + 8] = pz - _pd.z + _pp.z * 0.35;
        rPos[k + 9] = px - _pd.x - _pp.x * 0.35; rPos[k + 10] = py - _pd.y - _pp.y * 0.35; rPos[k + 11] = pz - _pd.z - _pp.z * 0.35;
        const h = 0.55 + 0.9 * f;
        rCol[k] = rCol[k + 3] = 1.0 * h; rCol[k + 1] = rCol[k + 4] = 0.8 * h; rCol[k + 2] = rCol[k + 5] = 0.12 * f;
        rCol[k + 6] = rCol[k + 9] = 0.95 * f; rCol[k + 7] = rCol[k + 10] = 0.5 * f; rCol[k + 8] = rCol[k + 11] = 0.02 * f;
      }
      spGeo.attributes.position.needsUpdate = true;
      spGeo.attributes.color.needsUpdate = true;
      smoke.forEach((s) => {
        if (s.life <= 0) return;
        const a = s.age / s.life;
        s.sp.position.copy(s.p);
        const sc = s.s0 + s.age * 0.1;
        s.sp.scale.set(sc, sc, 1);
        s.sp.material.opacity = 0.2 * Math.sin(Math.PI * a);
      });
    }

    const _x = V(0, 0, 0), _y = V(0, 0, 0), _z = V(0, 0, 0), _m = new THREE.Matrix4();
    function orient(obj, yDir, zHint) {
      _y.copy(yDir).normalize();
      _z.copy(zHint).addScaledVector(_y, -zHint.dot(_y)).normalize();
      _x.crossVectors(_y, _z);
      _m.makeBasis(_x, _y, _z);
      obj.quaternion.setFromRotationMatrix(_m);
    }
    const _d = V(0, 0, 0);
    function placeBetween(obj, a, b) {
      _d.subVectors(b, a);
      const len = _d.length();
      obj.position.copy(a).addScaledVector(_d, 0.5);
      obj.quaternion.setFromUnitVectors(UP, _d.divideScalar(len || 1));
    }
    const _C = V(0, 0, 0), _H = V(0, 0, 0), _W = V(0, 0, 0), _E = V(0, 0, 0), _Wa = V(0, 0, 0), _p = V(0, 0, 0), _q = V(0, 0, 0), _EL = V(0, 0, 0), _WL = V(0, 0, 0), _dl = V(0, 0, 0);
    function ik(S, T, a, b, pole, outE, outW) {
      _q.subVectors(T, S);
      let dist = _q.length();
      _q.divideScalar(dist || 1);
      dist = clamp(dist, Math.abs(a - b) + 1e-3, a + b - 1e-3);
      const x = (a * a - b * b + dist * dist) / (2 * dist);
      const h = Math.sqrt(Math.max(a * a - x * x, 0));
      _p.subVectors(pole, S);
      _p.addScaledVector(_q, -_p.dot(_q)).normalize();
      outE.copy(S).addScaledVector(_q, x).addScaledVector(_p, h);
      outW.copy(S).addScaledVector(_q, dist);
    }
    const POLE_R = SH_R.clone().add(V(-0.5, -0.5, -0.1));
    const POLE_L = SH_L.clone().add(V(0.5, -0.4, -0.1));
    const HAND_DIR_L = V(-0.3, 0, 0.95).normalize();
    const HAND_L = V(0.27, TOP + 0.012, -0.33);
    const WRIST_L = HAND_L.clone().addScaledVector(HAND_DIR_L, -0.072).add(V(0, 0.022, 0));
    const _hc = V(0, 0, 0);

    const CSEG = 48, CRAD = 6, CR = 0.0105;
    const cablePts = [V(0, 0, 0), V(0, 0, 0), V(0, 0, 0), V(0, 0, 0), V(0, 0, 0), sockAOut, sockAW];
    const cableCurve = new THREE.CatmullRomCurve3(cablePts, false, 'centripetal');
    const cPos = new Float32Array((CSEG + 1) * (CRAD + 1) * 3), cNor = new Float32Array((CSEG + 1) * (CRAD + 1) * 3);
    const cIdx = [];
    for (let i = 0; i < CSEG; i++) {
      for (let j = 0; j < CRAD; j++) {
        const a = i * (CRAD + 1) + j, b = (i + 1) * (CRAD + 1) + j, c = (i + 1) * (CRAD + 1) + j + 1, d = i * (CRAD + 1) + j + 1;
        cIdx.push(a, b, d, b, c, d);
      }
    }
    const cableGeo = new THREE.BufferGeometry();
    const cPosA = new THREE.BufferAttribute(cPos, 3).setUsage(THREE.DynamicDrawUsage);
    const cNorA = new THREE.BufferAttribute(cNor, 3).setUsage(THREE.DynamicDrawUsage);
    cableGeo.setAttribute('position', cPosA);
    cableGeo.setAttribute('normal', cNorA);
    cableGeo.setAttribute('onormal', cNorA);
    cableGeo.setIndex(cIdx);
    const cable = new THREE.Mesh(cableGeo, toon({ color: '#1c1d21' }));
    cable.frustumCulled = false;
    cable.castShadow = true;
    const cableOut = new THREE.Mesh(cableGeo, OUT_THIN);
    cableOut.frustumCulled = false;
    cable.add(cableOut);
    scene.add(cable);
    const cP = [], cT = [];
    for (let i = 0; i <= CSEG; i++) { cP.push(V(0, 0, 0)); cT.push(V(0, 0, 0)); }
    const _n = V(0, 0, 0), _b = V(0, 0, 0), _r = V(0, 0, 0), _ax = V(0, 0, 0), _qr = new THREE.Quaternion();
    function updateCable() {
      cablePts[0].copy(_H).addScaledVector(HB, 0.095);
      cablePts[1].copy(cablePts[0]).addScaledVector(HB, 0.1).add(V(0, -0.05, 0));
      const dd = cablePts[1].distanceTo(sockAOut), slack = Math.sqrt(Math.max(0, 1.5 * 1.5 - dd * dd));
      for (let k = 2; k <= 4; k++) {
        const f = (k - 1) / 4, pt = cablePts[k];
        pt.lerpVectors(cablePts[1], sockAOut, f);
        pt.y -= slack * 0.55 * Math.sin(Math.PI * f);
        pt.z = Math.min(pt.z, -0.1 - 0.15 * Math.sin(Math.PI * f)) + 0;
        const onBench = pt.x > -0.7 && pt.x < 0.7 && pt.z > -0.36 && pt.z < 0.36;
        pt.y = Math.max(pt.y, onBench ? TOP + 0.014 : 0.02);
      }
      for (let i = 0; i <= CSEG; i++) cableCurve.getPoint(i / CSEG, cP[i]);
      for (let i = 0; i <= CSEG; i++) cT[i].subVectors(cP[Math.min(CSEG, i + 1)], cP[Math.max(0, i - 1)]).normalize();
      _n.set(0, 1, 0);
      if (Math.abs(_n.dot(cT[0])) > 0.9) _n.set(1, 0, 0);
      _n.addScaledVector(cT[0], -_n.dot(cT[0])).normalize();
      for (let i = 0; i <= CSEG; i++) {
        if (i > 0) {
          _ax.crossVectors(cT[i - 1], cT[i]);
          const s = _ax.length();
          if (s > 1e-6) { _qr.setFromAxisAngle(_ax.divideScalar(s), Math.asin(Math.min(1, s))); _n.applyQuaternion(_qr); }
          _n.addScaledVector(cT[i], -_n.dot(cT[i])).normalize();
        }
        _b.crossVectors(cT[i], _n);
        for (let j = 0; j <= CRAD; j++) {
          const ang = (j / CRAD) * Math.PI * 2, cs = Math.cos(ang), sn = Math.sin(ang);
          _r.copy(_n).multiplyScalar(cs).addScaledVector(_b, sn);
          const k = (i * (CRAD + 1) + j) * 3;
          cNor[k] = _r.x; cNor[k + 1] = _r.y; cNor[k + 2] = _r.z;
          cPos[k] = cP[i].x + _r.x * CR; cPos[k + 1] = cP[i].y + _r.y * CR; cPos[k + 2] = cP[i].z + _r.z * CR;
        }
      }
      cPosA.needsUpdate = true;
      cNorA.needsUpdate = true;
    }

    const VISOR_IDLE = new THREE.Color('#6d4cb6'), VISOR_DARK = new THREE.Color('#0d1a12');
    const WIDE_P = V(SHOT.wp[0], SHOT.wp[1], SHOT.wp[2]), WIDE_L = V(SHOT.wl[0], SHOT.wl[1], SHOT.wl[2]);
    const CLOSE_OFF = V(SHOT.co[0], SHOT.co[1], SHOT.co[2]), CLOSE_LOOK = V(SHOT.cl[0], SHOT.cl[1], SHOT.cl[2]);
    const _cp = V(0, 0, 0), _cl = V(0, 0, 0), _wp = V(0, 0, 0), _look = V(0, 0, 0), _lt = V(0, 0, 0);
    function shotS(t) {
      if (t < 1.9) return 0;
      if (t < 4.6) return easeInOut((t - 1.9) / 2.7);
      if (t < 9.6) return 1;
      if (t < 12.6) return 1 - easeInOut((t - 9.6) / 3.0);
      return 0;
    }

    function pose(t) {
      const lvl = arcLevel(t);
      const L = electrodeLen(t);
      clampAt(t, _C);
      _tip.copy(_C).addScaledVector(E_DIR, -L);
      rod.visible = stub.visible = L > 0.02;
      if (rod.visible) {
        rod.position.copy(_tip);
        rod.quaternion.setFromUnitVectors(UP, E_DIR);
        rod.scale.set(1, L - 0.018, 1);
        stub.position.copy(_tip).addScaledVector(E_DIR, L - 0.018);
        stub.quaternion.copy(rod.quaternion);
        stub.scale.set(1, 0.02, 1);
      }
      const fallT = t - T_DROP;
      oldStub.visible = false;
      if (fallT >= 0 && fallT < 0.5) {
        clampAt(T_DROP, _lt);
        const drop = 0.5 * 9.8 * fallT * fallT;
        if (_lt.y - drop > BOX_TOP.y - 0.004) {
          oldStub.visible = true;
          oldStub.position.copy(_lt).addScaledVector(E_DIR, -0.155);
          oldStub.position.y -= drop;
          oldStub.quaternion.setFromUnitVectors(UP, E_DIR);
          oldStub.scale.set(1, 0.155, 1);
        }
      }
      _H.copy(_C).addScaledVector(HB, 0.15);
      holder.position.copy(_H);
      orient(holder, FWD, UP);

      _W.copy(_H).addScaledVector(HB, 0.09).add(WRIST_LIFT);
      ik(SH_R, _W, A_UP, A_FORE, POLE_R, _E, _Wa);
      placeBetween(upperR, SH_R, _E);
      placeBetween(foreR, _E, _Wa);
      cuffR.position.copy(_Wa);
      _dl.subVectors(_E, _Wa);
      cuffR.quaternion.setFromUnitVectors(UP, _dl.normalize());

      ik(SH_L, WRIST_L, A_UP, A_FORE, POLE_L, _EL, _WL);
      placeBetween(upperL, SH_L, _EL);
      placeBetween(foreL, _EL, _WL);
      cuffL.position.copy(_WL);
      _dl.subVectors(_EL, _WL);
      cuffL.quaternion.setFromUnitVectors(UP, _dl.normalize());
      _hc.copy(_WL);
      handL.position.copy(_hc);
      orient(handL, HAND_DIR_L, UP);

      _d.subVectors(_tip, HEAD);
      const yaw = Math.atan2(_d.x, _d.z), pitch = Math.atan2(-_d.y, Math.hypot(_d.x, _d.z));
      helmetPivot.rotation.set(clamp(pitch * 0.55, -0.2, 0.5), yaw * 0.85, 0, 'YXZ');
      helmetFlip.rotation.x = -2.3 * helmetUp(t);
      const dark = clamp(lvl * 3, 0, 1);
      visorMat.color.lerpColors(VISOR_IDLE, VISOR_DARK, dark);
      glint.visible = dark < 0.5;

      const emb = lvl > 0 ? 1 : t > T_ARC_OFF && t < T_DROP ? Math.exp(-(t - T_ARC_OFF) / 0.9) : 0;
      emberMat.opacity = emb;
      ember.position.copy(_tip);
      ember.visible = emb > 0.02 && L > 0.02;
      pool.position.set(CX - 0.0035, BP + 0.0035, _tip.z);
      pool.visible = lvl > 0;
      poolMat.opacity = Math.min(1, lvl * 1.4);
      glow.position.set(_tip.x + 0.001, _tip.y - 0.001, _tip.z);
      halo.position.copy(glow.position);
      glow.visible = halo.visible = lvl > 0;
      const gs = 0.05 + 0.03 * lvl;
      glow.scale.set(gs, gs, 1);
      halo.scale.set(0.3 * lvl + 0.08, 0.3 * lvl + 0.08, 1);
      halo.material.opacity = Math.min(0.8, lvl);
      arcLight.position.set(_tip.x - 0.04, _tip.y + 0.04, _tip.z + 0.02);
      arcLight.intensity = lvl * 2.4;

      for (let i = 0; i < N_BEAD; i++) {
        const age = (((t - beadT[i]) % LOOP) + LOOP) % LOOP;
        heatArr[i] = Math.exp(-age / 1.7);
      }
      heatAttr.needsUpdate = true;

      const wk = camera.aspect < 1 ? 0.72 : camera.aspect < 1.4 ? 0.84 : 1;
      _wp.copy(WIDE_P).applyAxisAngle(UP, 0.06 * Math.sin((2 * Math.PI * t) / LOOP)).sub(WIDE_L).multiplyScalar(wk).add(WIDE_L);
      weldTip(clamp(t, T_START, T_END), _lt);
      _cp.copy(_lt).add(CLOSE_OFF);
      _cl.copy(_lt).add(CLOSE_LOOK);
      const s = shotS(t);
      camera.position.lerpVectors(_wp, _cp, s);
      camera.position.y += Math.sin(Math.PI * s) * 0.12;
      camera.position.x += 0.0016 * Math.sin((2 * Math.PI * 5 * t) / LOOP) * s;
      camera.position.y += 0.0012 * Math.sin((2 * Math.PI * 7 * t) / LOOP + 1) * s;
      _look.lerpVectors(WIDE_L, _cl, s);
      camera.lookAt(_look);
      return lvl;
    }

    function resize() {
      const w = host.clientWidth || 1, h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const hf = THREE.MathUtils.degToRad((opts.hfov || 52) * (camera.aspect < 1 ? 0.88 : 1));
      camera.fov = Math.min(62, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hf / 2) / camera.aspect)));
      camera.updateProjectionMatrix();
      const px = clamp(h / 150, 1.4, 2.8), k = px * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / h;
      outlineMats.forEach((m) => { m.uniforms.uT.value = k * m.userData.scale; });
      if (!running && hasFrame) { pose(clock); renderer.render(scene, camera); }
    }

    let clock = 0, last = 0, raf = 0, running = false, hasFrame = false, acc = 0, frames = 0;
    const listeners = [];
    function perf(dt) {
      acc += dt; frames++;
      if (frames < 90) return;
      const avg = acc / frames;
      acc = 0; frames = 0;
      if (avg > 0.024 && dpr > 1) {
        dpr = Math.max(1, dpr - 0.25);
        renderer.setPixelRatio(dpr);
        resize();
      } else if (avg > 0.03 && renderer.shadowMap.enabled) {
        renderer.shadowMap.enabled = false;
        scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); });
      }
    }
    function step(t, prev, dt) {
      simulate(dt, t, prev);
      pose(t);
      writeParticles();
      updateCable();
      renderer.render(scene, camera);
      if (!hasFrame) { hasFrame = true; listeners.forEach((f) => f()); }
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 1 / 30) || 0;
      last = now;
      let prev = clock;
      clock += dt;
      if (clock >= LOOP) { clock -= LOOP; prev -= LOOP; }
      step(clock, prev, dt);
      perf(dt);
    }
    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }
    function renderAt(t) {
      stop();
      resetParticles();
      for (let s = t - 1.4; s < t; s += 1 / 60) {
        const a = ((s % LOOP) + LOOP) % LOOP, b = Math.min(t, s + 1 / 60);
        simulate(Math.min(1 / 60, t - s), ((b % LOOP) + LOOP) % LOOP, a);
      }
      clock = t;
      step(t, t, 0);
    }
    function autoplay(stillAt) {
      const rm = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)');
      let visible = false, userPaused = !!(rm && rm.matches);
      if (userPaused) renderAt(stillAt == null ? 6.4 : stillAt);
      const sync = () => { if (visible && !userPaused && !document.hidden) start(); else stop(); };
      if ('IntersectionObserver' in root) {
        new IntersectionObserver((es) => { visible = es[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(host);
      } else {
        visible = true;
        sync();
      }
      document.addEventListener('visibilitychange', sync);
      return {
        toggle() { userPaused = !userPaused; sync(); return !userPaused; },
        isPaused() { return userPaused; }
      };
    }
    function onFirstFrame(f) { if (hasFrame) f(); else listeners.push(f); }

    if ('ResizeObserver' in root) new ResizeObserver(resize).observe(host);
    else root.addEventListener('resize', resize);
    resize();

    return { start, stop, renderAt, autoplay, onFirstFrame, loop: LOOP, info: renderer.info };
  }

  root.createWeldScene = createWeldScene;
})(window);

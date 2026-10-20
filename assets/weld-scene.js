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

  function createWeldScene(host, opts) {
    opts = opts || {};
    const THREE = root.THREE;
    THREE.ColorManagement.legacyMode = false;

    const LOOP = 14;
    const T_HELM_DOWN = 0.95, T_STRIKE = 1.65, T_START = 2.0, T_END = 9.4, T_ARC_OFF = 9.45, T_HELM_UP = 10.9;
    const coarse = !!(root.matchMedia && root.matchMedia('(pointer: coarse)').matches);

    const canvas = document.createElement('canvas');
    canvas.className = 'w3d-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    const fadeEl = document.createElement('div');
    fadeEl.className = 'w3d-fade';
    host.appendChild(fadeEl);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    let dpr = Math.min(root.devicePixelRatio || 1, coarse ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const bg = new THREE.Color('#121009');
    scene.background = bg;
    scene.fog = new THREE.Fog(bg, 7, 16);
    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.03, 40);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color('#090807');
    const envPanel = (w, h, pos, color, k) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(pos[0], pos[1], pos[2]);
      m.lookAt(0, 0, 0);
      envScene.add(m);
    };
    envPanel(3, 1.2, [0, 5, 0], '#ffe4bd', 1.6);
    envPanel(2.5, 2, [5, 2, -2], '#a9c0e6', 1.1);
    envPanel(2.5, 3, [-5, 1.8, -0.5], '#c98b3f', 0.6);
    envPanel(8, 1, [0, -2, 0], '#2a241c', 0.8);
    scene.environment = pmrem.fromScene(envScene, 0.035).texture;
    pmrem.dispose();

    function canvasTex(w, h, draw, srgb) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c);
      if (srgb) t.encoding = THREE.sRGBEncoding;
      t.anisotropy = 4;
      return t;
    }
    function radialTex(stops) {
      return canvasTex(128, 128, (g, s) => {
        const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        stops.forEach((st) => gr.addColorStop(st[0], st[1]));
        g.fillStyle = gr;
        g.fillRect(0, 0, s, s);
      }, true);
    }
    const texRng = mulberry32(21);
    function speckle(g, w, h, n, alpha, light) {
      for (let i = 0; i < n; i++) {
        const v = light ? 255 : 0;
        g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (alpha * texRng()).toFixed(3) + ')';
        const r = 1 + texRng() * 3;
        g.fillRect(texRng() * w, texRng() * h, r, r);
      }
    }

    const diamondTex = canvasTex(128, 128, (g, s) => {
      g.fillStyle = '#000';
      g.fillRect(0, 0, s, s);
      const cell = s / 4;
      for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 4; i++) {
          g.save();
          g.translate(i * cell + cell / 2, j * cell + cell / 2);
          g.rotate((i + j) % 2 ? Math.PI / 4 : -Math.PI / 4);
          const gr = g.createLinearGradient(0, -4, 0, 4);
          gr.addColorStop(0, '#000'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(1, '#000');
          g.fillStyle = gr;
          g.beginPath();
          g.ellipse(0, 0, 11, 3.4, 0, 0, Math.PI * 2);
          g.fill();
          g.restore();
        }
      }
    }, false);
    diamondTex.wrapS = diamondTex.wrapT = THREE.RepeatWrapping;
    diamondTex.repeat.set(2.2, 2.2);

    const blockTex = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#77726a';
      g.fillRect(0, 0, w, h);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
          const x = c * 128 - (r % 2 ? 64 : 0), y = r * 64;
          const tone = 100 + Math.floor(texRng() * 24);
          g.fillStyle = 'rgb(' + tone + ',' + (tone - 4) + ',' + (tone - 11) + ')';
          g.fillRect(x + 3, y + 3, 122, 58);
          if (x < 0) g.fillRect(x + 256 + 3, y + 3, 122, 58);
        }
      }
      speckle(g, w, h, 1400, 0.25, false);
      speckle(g, w, h, 500, 0.15, true);
    }, true);
    blockTex.wrapS = blockTex.wrapT = THREE.RepeatWrapping;
    blockTex.repeat.set(9, 5);

    const concreteTex = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#5c5850';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) {
        const x = texRng() * w, y = texRng() * h, r = 20 + texRng() * 50;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, 'rgba(25,22,18,0.35)');
        gr.addColorStop(1, 'rgba(25,22,18,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, w, h);
      }
      speckle(g, w, h, 2200, 0.22, false);
      speckle(g, w, h, 900, 0.12, true);
    }, true);
    concreteTex.wrapS = concreteTex.wrapT = THREE.RepeatWrapping;
    concreteTex.repeat.set(7, 7);

    const hazardTex = canvasTex(256, 32, (g, w, h) => {
      g.fillStyle = '#e8e308';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#141200';
      for (let x = -32; x < w + 32; x += 32) {
        g.beginPath();
        g.moveTo(x, h); g.lineTo(x + 16, h); g.lineTo(x + 32, 0); g.lineTo(x + 16, 0);
        g.closePath();
        g.fill();
      }
      speckle(g, w, h, 300, 0.3, false);
    }, true);
    hazardTex.wrapS = THREE.RepeatWrapping;
    hazardTex.repeat.set(12, 1);

    const pegTex = canvasTex(512, 288, (g, w, h) => {
      g.fillStyle = '#6e5534';
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(20,14,8,0.85)';
      for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) { g.beginPath(); g.arc(x, y, 2.2, 0, Math.PI * 2); g.fill(); }
      const tool = (fn) => {
        g.save(); g.translate(5, 6); g.fillStyle = 'rgba(0,0,0,0.45)'; fn(); g.restore();
        g.save(); g.fillStyle = '#8e949a'; fn(); g.restore();
      };
      const wrench = (x, y, len, rot) => () => {
        g.translate(x, y); g.rotate(rot);
        g.fillRect(-5, 0, 10, len);
        g.beginPath(); g.arc(0, 0, 12, 0, Math.PI * 2); g.arc(0, len, 10, 0, Math.PI * 2); g.fill();
      };
      [[60, 40, 130], [92, 40, 115], [122, 40, 100], [150, 40, 88]].forEach((p) => tool(wrench(p[0], p[1], p[2], 0)));
      tool(() => { g.translate(230, 36); g.fillStyle = '#7a5532'; g.fillRect(-6, 18, 12, 150); g.fillStyle = '#8e949a'; g.fillRect(-28, 0, 56, 22); });
      tool(() => { g.translate(300, 40); g.fillRect(0, 0, 14, 170); g.fillRect(0, 156, 110, 14); });
      tool(() => { g.translate(450, 50); g.rotate(0.12); g.fillRect(-6, 0, 12, 120); g.rotate(-0.24); g.fillRect(-6, 0, 12, 120); });
      tool(() => { g.translate(375, 40); g.fillStyle = '#c0392b'; g.fillRect(-9, 50, 18, 90); g.fillStyle = '#8e949a'; g.fillRect(-3, 0, 6, 52); });
      speckle(g, w, h, 900, 0.2, false);
    }, true);

    const signTex = canvasTex(256, 160, (g, w, h) => {
      g.fillStyle = '#e8e308';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#141200';
      g.lineWidth = 10;
      g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = '#141200';
      g.textAlign = 'center';
      g.font = 'bold 64px Arial, sans-serif';
      g.fillText('USE EPI', w / 2, 86);
      g.font = 'bold 22px Arial, sans-serif';
      g.fillText('MÁSCARA · LUVAS · AVENTAL', w / 2, 128);
    }, true);

    const boxLabelTex = canvasTex(512, 96, (g, w, h) => {
      g.fillStyle = '#d9772b';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#1c1c1c';
      g.fillRect(0, h - 22, w, 22);
      g.fillStyle = '#ffffff';
      g.font = 'bold 54px Arial, sans-serif';
      g.fillText('E6013', 24, 62);
      g.font = 'bold 26px Arial, sans-serif';
      g.fillText('Ø 3,25 mm · 5 kg', 230, 56);
    }, true);

    const displayTex = canvasTex(128, 64, (g) => {
      g.fillStyle = '#060806';
      g.fillRect(0, 0, 128, 64);
      g.fillStyle = '#ffa23a';
      g.font = 'bold 40px monospace';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('125A', 64, 34);
    }, true);

    const helmetTex = canvasTex(1024, 512, (g, w, h) => {
      g.fillStyle = '#141414';
      g.fillRect(0, 0, w, h);
      const side = (m) => {
        const X = (x) => (m ? w - x : x);
        g.fillStyle = '#e8e308';
        g.beginPath();
        g.moveTo(X(40), 120);
        g.bezierCurveTo(X(170), 150, X(290), 300, X(330), 470);
        g.lineTo(X(268), 482);
        g.bezierCurveTo(X(230), 330, X(140), 205, X(28), 168);
        g.closePath();
        g.fill();
        g.beginPath();
        g.moveTo(X(30), 200);
        g.bezierCurveTo(X(120), 235, X(200), 330, X(232), 470);
        g.lineTo(X(218), 474);
        g.bezierCurveTo(X(184), 340, X(110), 252, X(26), 218);
        g.closePath();
        g.fill();
      };
      side(false);
      side(true);
      g.fillStyle = '#e8e308';
      g.font = 'bold 40px "Arial Narrow", Arial, sans-serif';
      g.textAlign = 'center';
      g.fillText('REINERT', 205, 390);
      g.fillText('REINERT', w - 205, 390);
    }, true);

    const smokeRng = mulberry32(11);
    const smokeTex = canvasTex(128, 128, (g, s) => {
      for (let i = 0; i < 14; i++) {
        const x = s * (0.3 + smokeRng() * 0.4), y = s * (0.3 + smokeRng() * 0.4), r = s * (0.15 + smokeRng() * 0.2);
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, 'rgba(255,255,255,0.22)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, s, s);
      }
    }, true);

    const glowTex = radialTex([[0, 'rgba(255,255,255,1)'], [0.12, 'rgba(235,244,255,0.95)'], [0.32, 'rgba(140,185,255,0.45)'], [0.6, 'rgba(80,120,255,0.12)'], [1, 'rgba(40,70,255,0)']]);
    const haloTex = radialTex([[0, 'rgba(190,215,255,0.55)'], [0.25, 'rgba(120,160,255,0.22)'], [0.6, 'rgba(70,100,220,0.06)'], [1, 'rgba(40,60,200,0)']]);
    const hazTex = radialTex([[0, 'rgba(230,200,130,0)'], [0.16, 'rgba(232,200,128,0.8)'], [0.34, 'rgba(198,128,62,0.75)'], [0.52, 'rgba(128,76,140,0.65)'], [0.7, 'rgba(66,104,176,0.5)'], [0.88, 'rgba(130,146,166,0.14)'], [1, 'rgba(0,0,0,0)']]);
    const dotTex = radialTex([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,220,150,0.8)'], [1, 'rgba(255,140,40,0)']]);

    const std = (o) => new THREE.MeshStandardMaterial(o);
    const M = {
      body: new THREE.MeshPhysicalMaterial({ color: '#121212', roughness: 0.36, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.35, envMapIntensity: 0.7 }),
      glove: std({ color: '#a8743f', roughness: 0.84 }),
      cuff: std({ color: '#8d5d31', roughness: 0.86, side: THREE.DoubleSide }),
      helmet: new THREE.MeshPhysicalMaterial({ map: helmetTex, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.22, envMapIntensity: 0.9 }),
      helmetIn: std({ color: '#0a0a0a', roughness: 0.8, side: THREE.BackSide }),
      housing: std({ color: '#0d0d0d', roughness: 0.3, metalness: 0.1 }),
      visor: std({ color: '#5a3f8f', roughness: 0.05, metalness: 0.55, emissive: new THREE.Color('#2f6b45'), emissiveIntensity: 0, envMapIntensity: 1.4 }),
      rubber: std({ color: '#0e0e0e', roughness: 0.7 }),
      bench: std({ color: '#2a2b2e', roughness: 0.75, metalness: 0.5, envMapIntensity: 0.3 }),
      benchLeg: std({ color: '#202124', roughness: 0.65, metalness: 0.5, envMapIntensity: 0.35 }),
      basePlate: std({ color: '#5b5f64', roughness: 0.5, metalness: 0.7, envMapIntensity: 0.5 }),
      tubeMat: std({ color: '#4d5156', roughness: 0.48, metalness: 0.7, envMapIntensity: 0.55 }),
      hole: std({ color: '#050505', roughness: 1 }),
      coldBead: std({ color: '#8a7f72', roughness: 0.5, metalness: 0.5, envMapIntensity: 0.8 }),
      diamond: std({ color: '#767b81', roughness: 0.42, metalness: 0.75, bumpMap: diamondTex, bumpScale: 0.02, envMapIntensity: 0.5 }),
      electrode: std({ color: '#a39d8e', roughness: 0.85 }),
      steel: std({ color: '#9aa0a6', roughness: 0.3, metalness: 0.9, envMapIntensity: 0.6 }),
      copper: std({ color: '#b87333', roughness: 0.35, metalness: 0.9, envMapIntensity: 0.6 }),
      floor: std({ map: concreteTex, roughness: 0.92, envMapIntensity: 0.25 }),
      wall: std({ map: blockTex, color: '#9a958c', roughness: 0.95, envMapIntensity: 0.2 }),
      hazard: std({ map: hazardTex, roughness: 0.7 }),
      peg: std({ map: pegTex, roughness: 0.85 }),
      sign: std({ map: signTex, roughness: 0.6 }),
      boxLabel: std({ map: boxLabelTex, roughness: 0.8 }),
      cardboard: std({ color: '#b5864f', roughness: 0.9 }),
      machine: std({ color: '#2c2d30', roughness: 0.55, metalness: 0.4, envMapIntensity: 0.4 }),
      panel: std({ color: '#141516', roughness: 0.4, metalness: 0.2 }),
      yellow: std({ color: '#e8e308', roughness: 0.4 }),
      red: std({ color: '#b3231c', roughness: 0.35, metalness: 0.2 }),
      green: std({ color: '#2f6a3e', roughness: 0.4, metalness: 0.2 }),
      bordo: std({ color: '#6e1f2a', roughness: 0.4, metalness: 0.2 }),
      rack: std({ color: '#3b4a5a', roughness: 0.6, metalness: 0.5 }),
      boxGrey: std({ color: '#55585c', roughness: 0.7 }),
      boxBlue: std({ color: '#25507f', roughness: 0.6 }),
      wood: std({ color: '#7a5532', roughness: 0.8 }),
      shade: std({ color: '#26332b', roughness: 0.45, metalness: 0.4, side: THREE.DoubleSide }),
      window: new THREE.MeshBasicMaterial({ color: new THREE.Color('#c9dbf5').multiplyScalar(1.15), toneMapped: true }),
      bulb: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe2b0').multiplyScalar(3), toneMapped: false })
    };

    const UP = new THREE.Vector3(0, 1, 0);
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
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

    const env = new THREE.Group();
    scene.add(env);
    function put(parent, geo, mat, x, y, z, cast, recv) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = !!cast;
      m.receiveShadow = recv !== false;
      parent.add(m);
      return m;
    }
    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const cyl = (r1, r2, h, s) => new THREE.CylinderGeometry(r1, r2, h, s || 20);
    function capsule(r, len, mat) {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 20), mat);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    }
    const tube = (pts, r) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 64, r, 7, false);

    const floor = put(env, new THREE.PlaneGeometry(14, 14), M.floor, 0, 0, -1);
    floor.rotation.x = -Math.PI / 2;
    const wall = put(env, new THREE.PlaneGeometry(14, 6), M.wall, 0, 3, -2.3);
    const sideWall = put(env, new THREE.PlaneGeometry(10, 6), M.wall, 3.4, 3, 1);
    sideWall.rotation.y = -Math.PI / 2;
    const stripe = put(env, new THREE.PlaneGeometry(4.4, 0.09), M.hazard, -0.2, 0.002, 0.95);
    stripe.rotation.x = -Math.PI / 2;
    const stripe2 = put(env, new THREE.PlaneGeometry(3.2, 0.09), M.hazard, 2.0, 0.002, -0.65);
    stripe2.rotation.x = -Math.PI / 2;
    stripe2.rotation.z = Math.PI / 2;

    put(env, new THREE.PlaneGeometry(1.9, 1.05), M.peg, 0.25, 1.62, -2.29);
    put(env, new THREE.PlaneGeometry(0.42, 0.26), M.sign, -0.95, 1.75, -2.29);
    put(env, new THREE.PlaneGeometry(1.1, 0.85), M.window, 1.95, 1.95, -2.295);
    [[1.95, 1.95, 0.04, 0.87], [1.95, 1.95, 1.12, 0.04], [1.58, 1.95, 0.04, 0.87], [2.32, 1.95, 0.04, 0.87], [1.95, 2.38, 1.14, 0.05], [1.95, 1.52, 1.14, 0.05]].forEach((p) => put(env, box(p[2], p[3], 0.04), M.benchLeg, p[0], p[1], -2.27));

    const ext = new THREE.Group();
    ext.position.set(-0.95, 0, -2.18);
    env.add(ext);
    put(ext, cyl(0.075, 0.075, 0.5), M.red, 0, 0.75, 0, true);
    put(ext, new THREE.SphereGeometry(0.075, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.red, 0, 1.0, 0, true);
    put(ext, cyl(0.02, 0.02, 0.06), M.rubber, 0, 1.08, 0, true);
    put(ext, box(0.1, 0.02, 0.02), M.rubber, 0.03, 1.1, 0, true);
    put(ext, box(0.36, 0.36, 0.01), M.red, 0, 1.42, -0.1);

    const rack = new THREE.Group();
    rack.position.set(-1.75, 0, -1.95);
    env.add(rack);
    [[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.2], [0.5, 0.2]].forEach((p) => put(rack, box(0.04, 1.9, 0.04), M.rack, p[0], 0.95, p[1], true));
    const boxMats = [M.boxGrey, M.cardboard, M.boxBlue, M.yellow, M.cardboard];
    [0.2, 0.65, 1.1, 1.55].forEach((y, i) => {
      put(rack, box(1.04, 0.025, 0.44), M.rack, 0, y, 0, true);
      for (let k = 0; k < 3; k++) {
        const bw = 0.2 + texRng() * 0.12, bh = 0.12 + texRng() * 0.16;
        put(rack, box(bw, bh, 0.3), boxMats[(i + k) % boxMats.length], -0.32 + k * 0.32, y + 0.0125 + bh / 2, 0, true);
      }
    });

    [[1.35, M.green], [1.6, M.bordo]].forEach((c) => {
      const g = new THREE.Group();
      g.position.set(c[0], 0, -2.05);
      env.add(g);
      put(g, cyl(0.11, 0.11, 1.25), c[1], 0, 0.625, 0, true);
      put(g, new THREE.SphereGeometry(0.11, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), c[1], 0, 1.25, 0, true);
      put(g, cyl(0.035, 0.045, 0.1), M.steel, 0, 1.38, 0, true);
    });
    put(env, new THREE.TorusGeometry(0.33, 0.006, 6, 40, Math.PI), M.steel, 1.475, 1.05, -2.05).rotation.x = Math.PI / 2;

    for (let i = 0; i < 6; i++) {
      const L = 2.4 + texRng() * 0.4;
      const isTube = i % 2 === 0;
      const m = put(env, isTube ? box(0.05, L, 0.05) : cyl(0.016, 0.016, L, 10), i % 3 === 0 ? M.tubeMat : M.basePlate, 2.55 + i * 0.09, L / 2 * Math.cos(0.18), -2.27 + Math.sin(0.18) * L / 2, true);
      m.rotation.x = -0.18;
    }

    const lamp = new THREE.Group();
    lamp.position.set(0.05, 2.02, -0.12);
    env.add(lamp);
    put(lamp, cyl(0.006, 0.006, 1.6, 6), M.rubber, 0, 0.8, 0);
    const shadeGeo = new THREE.LatheGeometry([[0.03, 0.12], [0.045, 0.1], [0.08, 0.04], [0.2, -0.06], [0.205, -0.07]].map((p) => new THREE.Vector2(p[0], p[1])), 32);
    put(lamp, shadeGeo, M.shade, 0, 0, 0, true);
    put(lamp, new THREE.SphereGeometry(0.045, 16, 12), M.bulb, 0, -0.03, 0, false, false);

    const TOP = 0.86;
    put(env, box(1.4, 0.04, 0.72), M.bench, 0, TOP - 0.02, 0, true);
    [[-0.66, -0.32], [0.66, -0.32], [-0.66, 0.32], [0.66, 0.32]].forEach((p) => put(env, box(0.05, TOP - 0.04, 0.05), M.benchLeg, p[0], (TOP - 0.04) / 2, p[1], true));
    put(env, box(1.32, 0.025, 0.64), M.diamond, 0, 0.2, 0, true);
    put(env, box(1.32, 0.05, 0.02), M.benchLeg, 0, TOP - 0.065, 0.345, true);
    put(env, box(1.32, 0.05, 0.02), M.benchLeg, 0, TOP - 0.065, -0.345, true);

    const PZ = -0.05, BP = TOP + 0.016, TS = 0.1, TH = 0.4;
    put(env, box(0.3, 0.016, 0.3), M.basePlate, 0, TOP + 0.008, PZ, true);
    const holeGeo = new THREE.CircleGeometry(0.011, 18);
    holeGeo.rotateX(-Math.PI / 2);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((p) => put(env, holeGeo, M.hole, p[0] * 0.11, BP + 0.0006, PZ + p[1] * 0.11));
    put(env, box(TS, TH, TS), M.tubeMat, 0, BP + TH / 2, PZ, true);
    const capGeo = new THREE.PlaneGeometry(TS - 0.012, TS - 0.012);
    capGeo.rotateX(-Math.PI / 2);
    put(env, capGeo, M.hole, 0, BP + TH + 0.0006, PZ);
    const gShape = new THREE.Shape();
    gShape.moveTo(0, 0); gShape.lineTo(0.085, 0); gShape.lineTo(0.012, 0.12); gShape.lineTo(0, 0.12); gShape.closePath();
    const gGeo = new THREE.ExtrudeGeometry(gShape, { depth: 0.008, bevelEnabled: false });
    const gus = (x, z, ry) => { const m = put(env, gGeo, M.basePlate, x, BP, z, true); m.rotation.y = ry; return m; };
    gus(0.004, PZ + TS / 2, -Math.PI / 2);
    gus(-0.004, PZ - TS / 2, Math.PI / 2);
    gus(TS / 2, PZ - 0.004, 0);
    const coldSegs = [];
    const cold = (a, b) => coldSegs.push([a, b]);
    [PZ + TS / 2, PZ - TS / 2].forEach((fz) => {
      const s = Math.sign(fz - PZ);
      [-0.0065, 0.0065].forEach((ox) => {
        cold(V(ox, BP + 0.004, fz + s * 0.004), V(ox, BP + 0.105, fz + s * 0.004));
        cold(V(ox, BP + 0.003, fz + s * 0.01), V(ox, BP + 0.003, fz + s * 0.078));
      });
    });
    [PZ - 0.0105, PZ + 0.0025].forEach((oz) => {
      cold(V(TS / 2 + 0.004, BP + 0.004, oz), V(TS / 2 + 0.004, BP + 0.105, oz));
      cold(V(TS / 2 + 0.01, BP + 0.003, oz), V(TS / 2 + 0.078, BP + 0.003, oz));
    });
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach((p, i, arr) => {
      if (i === 0) return;
      const q = arr[i - 1];
      if (p[0] < 0 && q[0] < 0) return;
      cold(V(q[0] * (TS / 2 + 0.004), BP + 0.003, PZ + q[1] * (TS / 2 + 0.004)), V(p[0] * (TS / 2 + 0.004), BP + 0.003, PZ + p[1] * (TS / 2 + 0.004)));
    });
    {
      let total = 0;
      const counts = coldSegs.map((sg) => { const n = Math.max(2, Math.floor(sg[0].distanceTo(sg[1]) / 0.0028)); total += n; return n; });
      const coldMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), M.coldBead, total);
      const r2 = mulberry32(5), p = V(0, 0, 0), s = V(1, 1, 1), qI = new THREE.Quaternion(), mt = new THREE.Matrix4();
      let idx = 0;
      coldSegs.forEach((sg, i) => {
        for (let k = 0; k < counts[i]; k++) {
          p.lerpVectors(sg[0], sg[1], k / (counts[i] - 1));
          const r = 0.0036 * (1 + 0.14 * r2());
          s.set(r, r, r);
          mt.compose(p, qI, s);
          coldMesh.setMatrixAt(idx++, mt);
        }
      });
      coldMesh.receiveShadow = true;
      env.add(coldMesh);
    }

    const eBox = new THREE.Group();
    eBox.position.set(0.42, TOP, 0.17);
    eBox.rotation.y = 0.12;
    env.add(eBox);
    put(eBox, box(0.36, 0.05, 0.085), M.cardboard, 0, 0.025, 0, true);
    put(eBox, new THREE.PlaneGeometry(0.34, 0.046), M.boxLabel, 0, 0.026, 0.0431);
    for (let i = 0; i < 4; i++) {
      const r = put(eBox, cyl(0.0032, 0.0032, 0.35, 8), M.electrode, 0, 0.0035, 0.07 + i * 0.012, true);
      r.rotation.z = Math.PI / 2;
    }
    const hammer = new THREE.Group();
    hammer.position.set(0.22, TOP + 0.012, 0.28);
    hammer.rotation.y = -0.3;
    env.add(hammer);
    put(hammer, cyl(0.011, 0.011, 0.26, 12), M.wood, 0, 0, 0, true).rotation.z = Math.PI / 2;
    put(hammer, box(0.022, 0.022, 0.15), M.steel, 0.13, 0.0, 0, true);
    put(hammer, new THREE.ConeGeometry(0.011, 0.04, 4), M.steel, 0.13, 0, 0.09, true).rotation.x = Math.PI / 2;

    const vise = new THREE.Group();
    vise.position.set(0.58, TOP, -0.2);
    env.add(vise);
    put(vise, box(0.14, 0.03, 0.12), M.rack, 0, 0.015, 0, true);
    put(vise, box(0.12, 0.08, 0.05), M.rack, 0, 0.07, -0.03, true);
    put(vise, box(0.12, 0.08, 0.05), M.rack, 0, 0.07, 0.04, true);
    put(vise, cyl(0.008, 0.008, 0.14, 10), M.steel, 0, 0.05, 0.12, true).rotation.x = Math.PI / 2;
    put(vise, cyl(0.006, 0.006, 0.12, 8), M.steel, 0, 0.05, 0.19, true).rotation.z = Math.PI / 2;

    const machine = new THREE.Group();
    machine.position.set(-1.0, 0, -0.55);
    machine.rotation.y = -0.55;
    scene.add(machine);
    put(machine, box(0.24, 0.3, 0.44), M.machine, 0, 0.17, 0, true);
    put(machine, box(0.26, 0.02, 0.46), M.rubber, 0, 0.01, 0, true);
    put(machine, box(0.2, 0.24, 0.006), M.panel, 0, 0.17, 0.222);
    put(machine, box(0.243, 0.03, 0.443), M.yellow, 0, 0.305, 0, true);
    put(machine, new THREE.PlaneGeometry(0.1, 0.05), new THREE.MeshBasicMaterial({ map: displayTex, toneMapped: false }), 0, 0.235, 0.226, false, false);
    put(machine, cyl(0.022, 0.022, 0.016), M.rubber, 0, 0.165, 0.232).rotation.x = Math.PI / 2;
    put(machine, cyl(0.014, 0.014, 0.02, 14), M.copper, -0.05, 0.08, 0.232).rotation.x = Math.PI / 2;
    put(machine, cyl(0.014, 0.014, 0.02, 14), M.copper, 0.05, 0.08, 0.232).rotation.x = Math.PI / 2;
    put(machine, new THREE.TorusGeometry(0.07, 0.009, 8, 20, Math.PI), M.rubber, 0, 0.32, 0, true).rotation.y = Math.PI / 2;
    machine.updateMatrixWorld(true);
    const sockAW = machine.localToWorld(V(-0.05, 0.08, 0.25));
    const sockBW = machine.localToWorld(V(0.05, 0.08, 0.25));

    const clampG = new THREE.Group();
    clampG.position.set(-0.6, TOP - 0.03, 0.365);
    env.add(clampG);
    put(clampG, box(0.06, 0.012, 0.03), M.copper, 0, 0.018, 0, true);
    put(clampG, box(0.06, 0.012, 0.03), M.copper, 0, -0.018, 0, true);
    put(clampG, cyl(0.008, 0.008, 0.05, 10), M.steel, 0.035, 0, 0, true);
    put(env, tube([V(-0.57, TOP - 0.03, 0.38), V(-0.62, 0.45, 0.46), V(-0.72, 0.012, 0.35), V(-0.86, 0.012, 0.02), V(sockBW.x + 0.05, 0.02, sockBW.z + 0.12), sockBW], 0.011), M.rubber, 0, 0, 0, true);

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

    const torsoGeo = new THREE.LatheGeometry([[0, 0], [0.1, 0], [0.135, 0.04], [0.14, 0.11], [0.125, 0.22], [0.13, 0.32], [0.155, 0.43], [0.17, 0.5], [0.165, 0.55], [0.13, 0.595], [0.07, 0.62], [0.0001, 0.63]].map((p) => new THREE.Vector2(p[0], p[1])), 40);
    const torso = put(scene, torsoGeo, M.body, P0.x, P0.y, P0.z, true);
    torso.quaternion.setFromUnitVectors(UP, LEAN);
    torso.scale.set(1, 1, 0.66);

    placeBetween(capsule(0.042, NECK0.distanceTo(NECK1), M.body), NECK0, NECK1);
    put(scene, new THREE.SphereGeometry(0.125, 40, 28), M.body, HEAD.x, HEAD.y, HEAD.z, true);
    placeBetween(capsule(0.058, HIP_R.distanceTo(KNEE_R), M.body), HIP_R, KNEE_R);
    placeBetween(capsule(0.058, HIP_L.distanceTo(KNEE_L), M.body), HIP_L, KNEE_L);
    placeBetween(capsule(0.046, KNEE_R.distanceTo(ANK_R), M.body), KNEE_R, ANK_R);
    placeBetween(capsule(0.046, KNEE_L.distanceTo(ANK_L), M.body), KNEE_L, ANK_L);
    [ANK_R, ANK_L].forEach((a) => {
      const f = capsule(0.042, 0.13, M.body);
      placeBetween(f, a.clone().add(V(0, -0.048, -0.03)), a.clone().add(V(0, -0.048, 0.12)));
      f.scale.set(1, 1, 0.7);
    });

    function helmetShell() {
      const r = 0.16;
      const g = new THREE.SphereGeometry(r, 56, 36, Math.PI / 2 - 1.45, 2.9, 0.4, 2.3);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        y *= 1.16;
        if (y < 0) z += -y * 0.34;
        x *= 0.93 - (y > 0 ? 0.14 * (y / (r * 1.16)) : 0);
        z = z * 0.86 + 0.02;
        p.setXYZ(i, x, y, z);
      }
      g.computeVertexNormals();
      return g;
    }
    const helmetPivot = new THREE.Group();
    helmetPivot.position.copy(HEAD);
    scene.add(helmetPivot);
    const helmetFlip = new THREE.Group();
    helmetPivot.add(helmetFlip);
    const shellGeo = helmetShell();
    put(helmetFlip, shellGeo, M.helmet, 0, -0.012, 0, true);
    put(helmetFlip, shellGeo, M.helmetIn, 0, -0.012, 0, false);
    put(helmetFlip, box(0.135, 0.088, 0.03), M.housing, 0, 0.022, 0.158, true);
    put(helmetFlip, box(0.104, 0.052, 0.006), M.visor, 0, 0.026, 0.174, false);
    put(helmetFlip, box(0.06, 0.01, 0.006), M.yellow, 0, -0.012, 0.174, false);
    [-1, 1].forEach((s) => {
      const k = put(helmetFlip, cyl(s > 0 ? 0.032 : 0.024, s > 0 ? 0.032 : 0.024, 0.026, 20), M.housing, s * 0.152, 0, 0.012, true);
      k.rotation.z = Math.PI / 2;
    });
    const band = put(helmetPivot, new THREE.TorusGeometry(0.129, 0.008, 8, 48), M.rubber, 0, 0.02, 0, false);
    band.rotation.x = Math.PI / 2;

    const A_UP = 0.3, A_FORE = 0.27;
    const upperR = capsule(0.044, A_UP, M.body), foreR = capsule(0.037, A_FORE, M.body);
    const upperL = capsule(0.044, A_UP, M.body), foreL = capsule(0.037, A_FORE, M.body);
    function makeHand() {
      const g = new THREE.Group();
      const palm = put(g, new THREE.CapsuleGeometry(0.037, 0.055, 8, 18), M.glove, 0, 0.055, 0, true);
      palm.scale.set(1.15, 1, 0.64);
      const thumb = put(g, new THREE.CapsuleGeometry(0.016, 0.034, 6, 12), M.glove, 0.036, 0.04, 0.014, true);
      thumb.rotation.z = -0.6;
      put(g, new THREE.CylinderGeometry(0.044, 0.062, 0.1, 22, 1, true), M.cuff, 0, -0.045, 0, true);
      scene.add(g);
      return g;
    }
    const handR = makeHand(), handL = makeHand();

    const holder = new THREE.Group();
    scene.add(holder);
    put(holder, cyl(0.019, 0.021, 0.15, 22), M.rubber, 0, 0, 0, true);
    put(holder, cyl(0.021, 0.025, 0.02, 22), M.rubber, 0, -0.085, 0, true);
    put(holder, cyl(0.031, 0.031, 0.008, 24), M.rubber, 0, 0.078, 0, true);
    put(holder, cyl(0.009, 0.016, 0.075, 12), M.rubber, 0, 0.118, -0.006, true).rotation.x = -0.08;
    put(holder, cyl(0.008, 0.011, 0.13, 10), M.rubber, 0, 0.09, 0.024, true).rotation.x = 0.2;
    put(holder, box(0.012, 0.008, 0.014), M.copper, 0, 0.153, 0.003, true);

    const rodGeo = new THREE.CylinderGeometry(0.0032, 0.0032, 1, 10);
    rodGeo.translate(0, 0.5, 0);
    const rod = put(scene, rodGeo, M.electrode, 0, 0, 0, true);
    const stubGeo = new THREE.CylinderGeometry(0.0026, 0.0026, 1, 10);
    stubGeo.translate(0, 0.5, 0);
    const stub = put(scene, stubGeo, M.steel, 0, 0, 0, true);

    const emberMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.45, 0.12).multiplyScalar(2.5), toneMapped: false, transparent: true });
    const ember = put(scene, new THREE.SphereGeometry(0.0038, 10, 8), emberMat, 0, 0, 0, false, false);
    const poolMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.8, 0.45).multiplyScalar(3), toneMapped: false, transparent: true });
    const pool = put(scene, new THREE.SphereGeometry(1, 16, 10), poolMat, 0, 0, 0, false, false);
    pool.scale.set(0.0065, 0.0065, 0.0075);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, toneMapped: false }));
    glow.renderOrder = 10;
    scene.add(glow);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, toneMapped: false }));
    halo.renderOrder = 9;
    scene.add(halo);
    const arcLight = new THREE.PointLight('#cfe1ff', 0, 3.5, 2);
    scene.add(arcLight);

    scene.add(new THREE.HemisphereLight('#7d8590', '#1a1612', 0.22));
    const lampLight = new THREE.SpotLight('#ffd6a0', 3.4, 6, 0.95, 0.6, 1.2);
    lampLight.position.set(0.05, 1.98, -0.12);
    lampLight.target.position.set(0, 0.8, -0.2);
    lampLight.castShadow = true;
    lampLight.shadow.mapSize.set(1024, 1024);
    lampLight.shadow.camera.near = 0.3;
    lampLight.shadow.camera.far = 4;
    lampLight.shadow.bias = -0.0006;
    lampLight.shadow.normalBias = 0.02;
    scene.add(lampLight, lampLight.target);
    const win = new THREE.DirectionalLight('#a9c0e6', 0.55);
    win.position.set(2.5, 2.2, -2.2);
    win.target.position.set(0, 0.9, 0);
    scene.add(win, win.target);
    const rim = new THREE.DirectionalLight('#86a8dc', 1.0);
    rim.position.set(-2.4, 1.5, -2.6);
    rim.target.position.set(0, 1.1, -0.5);
    scene.add(rim, rim.target);
    const wallSpot = new THREE.SpotLight('#ffcf8a', 1.8, 6, 0.7, 0.9, 1.3);
    wallSpot.position.set(0.3, 3.0, -0.6);
    wallSpot.target.position.set(0.2, 1.4, -2.3);
    scene.add(wallSpot, wallSpot.target);

    const CX = -TS / 2, Z0 = PZ + TS / 2 - 0.008, Z1 = PZ - TS / 2 + 0.008;
    const STEP = 0.0016;
    const N_BEAD = Math.floor((Z0 - Z1) / STEP);
    const beadT = new Float32Array(N_BEAD);
    const beadGeo = new THREE.SphereGeometry(1, 14, 10);
    const heatArr = new Float32Array(N_BEAD);
    const heatAttr = new THREE.InstancedBufferAttribute(heatArr, 1);
    heatAttr.setUsage(THREE.DynamicDrawUsage);
    beadGeo.setAttribute('aHeat', heatAttr);
    const beadMat = std({ color: '#4b443a', roughness: 0.62, metalness: 0.35 });
    beadMat.onBeforeCompile = (sh) => {
      sh.vertexShader = 'attribute float aHeat;\nvarying float vHeat;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvHeat = aHeat;');
      sh.fragmentShader = 'varying float vHeat;\n' + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\nfloat hh = clamp(vHeat, 0.0, 1.0);\nvec3 tmp = mix(vec3(0.16,0.24,0.46), vec3(0.62,0.42,0.18), smoothstep(0.08,0.22,hh));\ndiffuseColor.rgb = mix(diffuseColor.rgb, tmp, smoothstep(0.0,0.06,hh) * (1.0 - smoothstep(0.25,0.4,hh)));')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nvec3 hotC = mix(vec3(0.9,0.12,0.0), vec3(1.0,0.78,0.38), smoothstep(0.55,1.0,hh));\ntotalEmissiveRadiance += hotC * pow(hh, 1.6) * 7.0;');
    };
    const bead = new THREE.InstancedMesh(beadGeo, beadMat, N_BEAD);
    bead.castShadow = true;
    scene.add(bead);
    const hazMat = std({ map: hazTex, transparent: true, opacity: 0.42, depthWrite: false, roughness: 0.35, metalness: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
    const hazFlatGeo = new THREE.CircleGeometry(1, 28);
    hazFlatGeo.rotateX(-Math.PI / 2);
    const hazWallGeo = new THREE.CircleGeometry(1, 28);
    hazWallGeo.rotateY(-Math.PI / 2);
    const N_HAZ = Math.ceil(N_BEAD / 2);
    const hazFlat = new THREE.InstancedMesh(hazFlatGeo, hazMat, N_HAZ);
    const hazWall = new THREE.InstancedMesh(hazWallGeo, hazMat, N_HAZ);
    scene.add(hazFlat, hazWall);
    {
      const r = mulberry32(3);
      const q = new THREE.Quaternion(), p = V(0, 0, 0), s = V(1, 1, 1), mt = new THREE.Matrix4();
      for (let i = 0; i < N_BEAD; i++) {
        beadT[i] = T_START + ((i * STEP) / (Z0 - Z1)) * (T_END - T_START);
        const wv = 0.0012 * Math.sin(2 * Math.PI * 2.6 * (beadT[i] - T_START));
        p.set(CX - 0.0036 + wv, BP + 0.0036 + wv, Z0 - i * STEP);
        s.set(0.0056 * (1 + 0.12 * r()), 0.0056 * (1 + 0.12 * r()), 0.0064 * (1 + 0.1 * r()));
        q.setFromAxisAngle(V(0, 0, 1), Math.PI / 4 + (r() - 0.5) * 0.3);
        mt.compose(p, q, s);
        bead.setMatrixAt(i, mt);
        if (i % 2 === 0) {
          q.identity();
          p.set(CX - 0.006, BP + 0.0004, Z0 - i * STEP);
          s.set(0.03, 1, 0.03);
          mt.compose(p, q, s);
          hazFlat.setMatrixAt(i / 2, mt);
          p.set(CX - 0.0004, BP + 0.006, Z0 - i * STEP);
          s.set(1, 0.03, 0.03);
          mt.compose(p, q, s);
          hazWall.setMatrixAt(i / 2, mt);
        }
      }
      bead.count = 0;
      hazFlat.count = 0;
      hazWall.count = 0;
    }

    const SP = 280;
    const spP = new Float32Array(SP * 3), spV = new Float32Array(SP * 3), spL = new Float32Array(SP), spMax = new Float32Array(SP);
    const spPos = new Float32Array(SP * 6), spCol = new Float32Array(SP * 6);
    const spGeo = new THREE.BufferGeometry();
    spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3).setUsage(THREE.DynamicDrawUsage));
    spGeo.setAttribute('color', new THREE.BufferAttribute(spCol, 3).setUsage(THREE.DynamicDrawUsage));
    const sparks = new THREE.LineSegments(spGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    sparks.frustumCulled = false;
    scene.add(sparks);
    const sparkDots = new THREE.Points(spGeo, new THREE.PointsMaterial({ size: 0.006, map: dotTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, sizeAttenuation: true }));
    sparkDots.frustumCulled = false;
    scene.add(sparkDots);
    let spHead = 0, emitAcc = 0, smokeAcc = 0, rng = mulberry32(7);

    const SM = 18;
    const smoke = [];
    for (let i = 0; i < SM; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 }));
      sp.visible = false;
      scene.add(sp);
      smoke.push({ sp, p: V(0, 0, 0), v: V(0, 0, 0), age: 0, life: 0, s0: 0 });
    }
    let smHead = 0;

    const E_DIR = V(-0.68, 0.7, -0.3).normalize();
    const HB = V(-0.1, 0.35, -1.0).normalize();
    const FWD = HB.clone().negate();
    const WRIST_LIFT = V(0, 0.018, 0);

    function tipAt(t, out) {
      const ox = CX - 0.004, oy = BP + 0.004;
      let x = ox - 0.02, y = oy + 0.03, z = Z0 + 0.006;
      if (t < T_STRIKE) {
        const k = smooth(0.5, T_STRIKE, t);
        x = ox - 0.02 + 0.018 * k;
        y = oy + 0.03 - 0.026 * k;
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
    const electrodeLen = (t) => (t < T_START ? 0.3 : t < T_END ? 0.3 - 0.145 * ((t - T_START) / (T_END - T_START)) : 0.155);
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
      spMax[i] = spL[i] = 0.35 + rng() * 0.7;
    }
    function surfaceY(x, z) {
      if (Math.abs(x) < 0.15 && Math.abs(z - PZ) < 0.15) return BP;
      if (Math.abs(x) < 0.7 && Math.abs(z) < 0.36) return TOP;
      return 0;
    }
    function simulate(dt, t, prev) {
      if (dt <= 0) return;
      const lvl = arcLevel(t);
      tipAt(t, _tip);
      if (prev < T_STRIKE && t >= T_STRIKE) for (let k = 0; k < 45; k++) emitSpark(_tip, 1.25);
      if (lvl > 0) {
        emitAcc += dt * 165 * Math.min(1.3, lvl);
        while (emitAcc >= 1) { emitSpark(_tip); emitAcc -= 1; }
      }
      const g = 9.8 * dt, drag = 1 - 0.6 * dt;
      for (let i = 0; i < SP; i++) {
        if (spL[i] <= 0) continue;
        const j = i * 3;
        spV[j + 1] -= g;
        spV[j] *= drag; spV[j + 1] *= drag; spV[j + 2] *= drag;
        spP[j] += spV[j] * dt; spP[j + 1] += spV[j + 1] * dt; spP[j + 2] += spV[j + 2] * dt;
        if (spP[j] > CX && spP[j] < -CX && Math.abs(spP[j + 2] - PZ) < TS / 2 && spP[j + 1] < BP + TH) {
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
        while (smokeAcc > 0.17) {
          smokeAcc -= 0.17;
          const s = smoke[smHead];
          smHead = (smHead + 1) % SM;
          s.p.set(_tip.x - 0.01, _tip.y + 0.01, _tip.z);
          s.v.set(-0.05 + rng() * 0.04, 0.12 + rng() * 0.09, 0.0 + rng() * 0.04);
          s.age = 0;
          s.life = 3 + rng() * 1.2;
          s.s0 = 0.05 + rng() * 0.03;
          s.sp.material.rotation = rng() * Math.PI * 2;
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
    function writeParticles(lvl) {
      for (let i = 0; i < SP; i++) {
        const j = i * 3, k = i * 6;
        if (spL[i] <= 0) {
          spCol[k] = spCol[k + 1] = spCol[k + 2] = spCol[k + 3] = spCol[k + 4] = spCol[k + 5] = 0;
          continue;
        }
        const f = spL[i] / spMax[i];
        spPos[k] = spP[j]; spPos[k + 1] = spP[j + 1]; spPos[k + 2] = spP[j + 2];
        spPos[k + 3] = spP[j] - spV[j] * 0.028;
        spPos[k + 4] = spP[j + 1] - spV[j + 1] * 0.028;
        spPos[k + 5] = spP[j + 2] - spV[j + 2] * 0.028;
        const b = 0.5 + 2.2 * f;
        spCol[k] = 1.0 * b; spCol[k + 1] = (0.55 + 0.4 * f) * b; spCol[k + 2] = 0.25 * f * b;
        spCol[k + 3] = 0.9 * f; spCol[k + 4] = 0.28 * f; spCol[k + 5] = 0.03 * f;
      }
      spGeo.attributes.position.needsUpdate = true;
      spGeo.attributes.color.needsUpdate = true;
      smoke.forEach((s) => {
        if (s.life <= 0) return;
        const a = s.age / s.life;
        s.sp.position.copy(s.p);
        const sc = s.s0 + s.age * 0.11;
        s.sp.scale.set(sc, sc, 1);
        s.sp.material.opacity = 0.2 * Math.sin(Math.PI * a);
        s.sp.material.color.setRGB(0.55 + 0.45 * lvl, 0.58 + 0.42 * lvl, 0.62 + 0.38 * lvl);
      });
    }

    const _C = V(0, 0, 0), _H = V(0, 0, 0), _W = V(0, 0, 0), _E = V(0, 0, 0), _Wa = V(0, 0, 0), _dir = V(0, 0, 0), _p = V(0, 0, 0), _q = V(0, 0, 0);
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
    const W_L = V(0.26, TOP + 0.042, -0.3);
    const HAND_L_DIR = V(-0.45, -0.12, 0.75).normalize();
    const POLE_R = SH_R.clone().add(V(-0.5, -0.5, -0.1));
    const POLE_L = SH_L.clone().add(V(0.5, -0.4, -0.1));
    const _EL = V(0, 0, 0), _WL = V(0, 0, 0);
    let cableGeo = null;
    const cable = put(scene, new THREE.BufferGeometry(), M.rubber, 0, 0, 0, true);
    const cablePts = [V(0, 0, 0), V(0, 0, 0), V(-0.42, 0.9, -0.42), V(-0.52, 0.4, -0.55), V(-0.62, 0.012, -0.5), V(-0.8, 0.012, -0.32), V(sockAW.x + 0.06, 0.02, sockAW.z + 0.1), sockAW];

    const VISOR_IDLE = new THREE.Color('#5a3f8f'), VISOR_DARK = new THREE.Color('#0d1a12');
    const WIDE_P = V(-2.05, 1.62, 2.65), WIDE_L = V(-0.05, 1.0, -0.3);
    const CLOSE_OFF = V(-0.2, 0.1, 0.36), CLOSE_LOOK = V(0.02, 0.05, -0.09);
    const _cp = V(0, 0, 0), _cl = V(0, 0, 0), _wp = V(0, 0, 0), _look = V(0, 0, 0);
    function shotS(t) {
      if (t < 1.9) return 0;
      if (t < 4.6) return easeInOut((t - 1.9) / 2.7);
      if (t < 9.6) return 1;
      if (t < 12.6) return 1 - easeInOut((t - 9.6) / 3.0);
      return 0;
    }

    function pose(t) {
      const lvl = arcLevel(t);
      tipAt(t, _tip);
      const L = electrodeLen(t);
      _C.copy(_tip).addScaledVector(E_DIR, L);
      rod.position.copy(_tip);
      rod.quaternion.setFromUnitVectors(UP, E_DIR);
      rod.scale.set(1, L - 0.018, 1);
      stub.position.copy(_tip).addScaledVector(E_DIR, L - 0.018);
      stub.quaternion.copy(rod.quaternion);
      stub.scale.set(1, 0.02, 1);
      _H.copy(_C).addScaledVector(HB, 0.15);
      holder.position.copy(_H);
      orient(holder, FWD, UP);

      _W.copy(_H).addScaledVector(HB, 0.065).add(WRIST_LIFT);
      ik(SH_R, _W, A_UP, A_FORE, POLE_R, _E, _Wa);
      placeBetween(upperR, SH_R, _E);
      placeBetween(foreR, _E, _Wa);
      handR.position.copy(_Wa);
      _dir.subVectors(_H, _Wa);
      orient(handR, _dir, UP);

      ik(SH_L, W_L, A_UP, A_FORE, POLE_L, _EL, _WL);
      placeBetween(upperL, SH_L, _EL);
      placeBetween(foreL, _EL, _WL);
      handL.position.copy(_WL);
      orient(handL, HAND_L_DIR, UP);

      helmetPivot.lookAt(_tip);
      helmetFlip.rotation.x = -2.35 * helmetUp(t);
      const dark = clamp(lvl * 3, 0, 1);
      M.visor.color.lerpColors(VISOR_IDLE, VISOR_DARK, dark);
      M.visor.emissiveIntensity = lvl * 0.5;

      const emb = lvl > 0 ? 1 : t > T_ARC_OFF ? Math.exp(-(t - T_ARC_OFF) / 0.9) : 0;
      emberMat.opacity = emb;
      ember.position.copy(_tip);
      ember.visible = emb > 0.02;
      pool.position.set(CX - 0.0035, BP + 0.0035, _tip.z);
      pool.visible = lvl > 0;
      poolMat.opacity = Math.min(1, lvl * 1.4);
      glow.position.set(_tip.x + 0.001, _tip.y - 0.001, _tip.z);
      halo.position.copy(glow.position);
      glow.visible = halo.visible = lvl > 0;
      const gs = 0.035 + 0.025 * lvl;
      glow.scale.set(gs, gs, 1);
      halo.scale.set(0.24 * lvl + 0.06, 0.24 * lvl + 0.06, 1);
      halo.material.opacity = Math.min(0.85, lvl);
      arcLight.position.set(_tip.x - 0.04, _tip.y + 0.04, _tip.z + 0.02);
      arcLight.intensity = lvl * 2.2;

      let n = 0;
      if (t >= T_START) { while (n < N_BEAD && beadT[n] <= t) n++; }
      bead.count = n;
      for (let i = 0; i < n; i++) heatArr[i] = clamp(Math.exp(-(t - beadT[i]) / 1.7), 0, 1);
      heatAttr.needsUpdate = true;
      let nh = 0;
      while (t >= T_START && nh < N_HAZ && beadT[nh * 2] <= t - 0.5) nh++;
      hazFlat.count = hazWall.count = nh;

      const wk = camera.aspect < 1 ? 0.72 : camera.aspect < 1.4 ? 0.84 : 1;
      _wp.copy(WIDE_P).applyAxisAngle(UP, 0.07 - 0.12 * (t / LOOP)).sub(WIDE_L).multiplyScalar(wk).add(WIDE_L);
      _cp.copy(_tip).add(CLOSE_OFF);
      _cl.copy(_tip).add(CLOSE_LOOK);
      const s = shotS(t);
      camera.position.lerpVectors(_wp, _cp, s);
      camera.position.y += Math.sin(Math.PI * s) * 0.12;
      if (s > 0.98) {
        camera.position.x += 0.0016 * Math.sin(t * 1.7);
        camera.position.y += 0.0012 * Math.sin(t * 2.3 + 1);
      }
      _look.lerpVectors(WIDE_L, _cl, s);
      camera.lookAt(_look);

      fadeEl.style.opacity = String(t < 0.45 ? 1 - t / 0.45 : t > 13.45 ? (t - 13.45) / 0.55 : 0);
      return lvl;
    }

    function updateCable() {
      const back = cablePts[0].copy(_H).addScaledVector(HB, 0.095);
      cablePts[1].copy(back).addScaledVector(HB, 0.1).add(V(0, -0.05, 0));
      const g = tube(cablePts, 0.011);
      if (cableGeo) cableGeo.dispose();
      cableGeo = g;
      cable.geometry = g;
    }

    env.traverse((o) => { o.updateMatrix(); o.matrixAutoUpdate = false; });
    env.updateMatrixWorld(true);

    function resize() {
      const w = host.clientWidth || 1, h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const hf = THREE.MathUtils.degToRad((opts.hfov || 52) * (camera.aspect < 1 ? 0.88 : 1));
      camera.fov = Math.min(62, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hf / 2) / camera.aspect)));
      camera.updateProjectionMatrix();
      if (!running && hasFrame) renderer.render(scene, camera);
    }

    let clock = 0, last = 0, raf = 0, running = false, hasFrame = false, acc = 0, frames = 0, cableTick = 0;
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
        scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
      }
    }
    function step(t, prev, dt) {
      simulate(dt, t, prev);
      const lvl = pose(t);
      writeParticles(lvl);
      if (cableTick++ % 2 === 0 || !running) updateCable();
      renderer.render(scene, camera);
      if (!hasFrame) { hasFrame = true; listeners.forEach((f) => f()); }
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 1 / 30) || 0;
      last = now;
      let prev = clock;
      clock += dt;
      if (clock >= LOOP) { clock -= LOOP; prev = 0; resetParticles(); }
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
      const t0 = Math.max(0, t - 1.4);
      for (let s = t0; s < t; s += 1 / 60) simulate(Math.min(1 / 60, t - s), Math.min(t, s + 1 / 60), s);
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

    return { start, stop, renderAt, autoplay, onFirstFrame, loop: LOOP };
  }

  root.createWeldScene = createWeldScene;
})(window);

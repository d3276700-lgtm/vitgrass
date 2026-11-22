// Упаковка на 3D-движке (three.js): плоская → надувается → медленно переворачивается задней стороной.
// Двумя пальцами на упаковке — увеличить до всего экрана / уменьшить обратно.
// Если 3D не запускается (старый телефон) — Pack3D.init вернёт null и останется простая картинка.
window.Pack3D = {   // складки, блики, тени
  init(img, { front, back, onOpen }) {
    if (!window.THREE) return null;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: true }); } catch (e) { return null; }
    if (!renderer.getContext()) return null;

    const cv = renderer.domElement; cv.className = 'pack3d-cv';
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(cv);

    const scene = new THREE.Scene(), FOV = 30;
    const cam = new THREE.PerspectiveCamera(FOV, 1, 10, 20000);
    // отражения «светлой комнаты», как у мотоцикла — глянец пакета выглядит настоящим
    if (THREE.RoomEnvironment) scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new THREE.RoomEnvironment(), .04).texture;
    scene.add(new THREE.AmbientLight(0xffffff, scene.environment ? .12 : .35));
    const key = new THREE.DirectionalLight(0xffffff, scene.environment ? .55 : .75); key.position.set(-.6, .5, .8); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, .2); rim.position.set(.7, -.1, .5); scene.add(rim);

    const loader = new THREE.TextureLoader();
    const tex = src => { const t = loader.load(src, () => draw = true); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; };
    // плёнка пакета: под краской матовая основа, сверху прозрачный глянцевый лак — дают блики как у настоящего
    const mat = src => new THREE.MeshPhysicalMaterial({ map: tex(src), roughness: .42, metalness: 0, alphaTest: .5, envMapIntensity: .55,
      clearcoat: 1, clearcoatRoughness: .07, vertexColors: true });
    const mFront = mat(front), mBack = mat(back);
    // подробные картинки (мелкий текст читается) — грузим только когда начали увеличивать
    let hdDone = false;
    const loadHD = () => {
      if (hdDone) return; hdDone = true;
      if (renderer.capabilities.maxTextureSize < 3900) return;
      for (const [m, src] of [[mFront, front], [mBack, back]]) {
        const hd = src.replace(/(\.webp)/, '-hd$1');
        loader.load(hd, t => { t.encoding = THREE.sRGBEncoding; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); const old = m.map; m.map = t; m.needsUpdate = true; old && old.dispose(); draw = true; });
      }
    };
    // рисунок дна: голубой глянец, тень к краям, полоски шва у передней и задней стороны, складка посередине
    const bottomTex = (() => {
      const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
      const gv = x.createLinearGradient(0, 0, 0, 256);
      gv.addColorStop(0, '#7f9fb0'); gv.addColorStop(.12, '#9dbccc'); gv.addColorStop(.42, '#b4d0dd');
      gv.addColorStop(.5, '#93b2c2'); gv.addColorStop(.58, '#b4d0dd'); gv.addColorStop(.88, '#9dbccc'); gv.addColorStop(1, '#7f9fb0');
      x.fillStyle = gv; x.fillRect(0, 0, 512, 256);
      const gu = x.createLinearGradient(0, 0, 512, 0);           // к боковым уголкам темнее
      gu.addColorStop(0, 'rgba(40,60,72,.45)'); gu.addColorStop(.25, 'rgba(40,60,72,0)'); gu.addColorStop(.75, 'rgba(40,60,72,0)'); gu.addColorStop(1, 'rgba(40,60,72,.45)');
      x.fillStyle = gu; x.fillRect(0, 0, 512, 256);
      for (const y0 of [0, 256 - 16]) {                           // полоски шва (термосварка) с мелкой насечкой
        x.fillStyle = 'rgba(205,225,235,.55)'; x.fillRect(0, y0, 512, 16);
        x.fillStyle = 'rgba(60,85,100,.35)'; for (let i = 0; i < 512; i += 4) x.fillRect(i, y0 + 2, 1.5, 12);
        x.fillStyle = 'rgba(50,70,85,.6)'; x.fillRect(0, y0 ? y0 - 1 : 16, 512, 1.5);
      }
      x.fillStyle = 'rgba(55,80,95,.55)'; x.fillRect(0, 126, 512, 2);   // складка посередине
      x.fillStyle = 'rgba(235,245,250,.5)'; x.fillRect(0, 129, 512, 1.5);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
    })();
    const mBottom = new THREE.MeshStandardMaterial({ map: bottomTex, roughness: .34, metalness: 0, envMapIntensity: .45, side: THREE.DoubleSide });

    // форма пакета: выпуклый посередине, к бокам и верхнему шву — ноль, у самого дна тоже сходится
    // как настоящий дой-пак: сверху шов (0), ниже пухлый, внизу НЕ сходится — стоит на овальном дне
    const g = t => t < .55 ? Math.sin(t / .55 * Math.PI / 2) : 1 - .12 * Math.pow((t - .55) / .45, 2);
    const NX = 70, NY = 110, NV = 24;
    let W = 0, H = 0, gFront, gBack, gBottom, base;
    const group = new THREE.Group(), pouch = new THREE.Group(); group.add(pouch); scene.add(group);
    const mkGeo = () => {
      [gFront, gBack, gBottom].forEach(x => x && x.dispose());
      gFront = new THREE.PlaneGeometry(W, H, NX, NY); gBack = new THREE.PlaneGeometry(W, H, NX, NY);
      base = gFront.attributes.position.array.slice();
      // тени: темнее к боковым швам, под верхним швом и у самого дна (как в складках настоящего пакета)
      for (const geo of [gFront, gBack]) {
        const n = base.length / 3, col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const u = Math.abs(base[i * 3] / (W / 2)), t = .5 - base[i * 3 + 1] / H;
          const sm = (a, b, x) => { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
          const c = 1 - .30 * sm(.62, 1, u) - .18 * sm(.16, .06, t) * (1 - sm(.9, 1, u)) - .22 * sm(.86, 1, t) + .05 * sm(.5, 0, u) * sm(.15, .45, t);
          col.set([c, c, c], i * 3);
        }
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }
      pouch.clear();
      const f = new THREE.Mesh(gFront, mFront), b = new THREE.Mesh(gBack, mBack); b.rotation.y = Math.PI;
      // дно: полоска между нижними краями передней и задней стороны (сверху вид — овал)
      gBottom = new THREE.BufferGeometry();
      gBottom.setAttribute('position', new THREE.BufferAttribute(new Float32Array((NX + 1) * (NV + 1) * 3), 3));
      const idx = []; for (let i = 0; i < NX; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      gBottom.setIndex(idx);
      const uv = new Float32Array((NX + 1) * (NV + 1) * 2);
      for (let i = 0; i <= NX; i++) for (let j = 0; j <= NV; j++) uv.set([i / NX, j / NV], (i * (NV + 1) + j) * 2);
      gBottom.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      pouch.add(f, b, new THREE.Mesh(gBottom, mBottom)); lastK = -1;
    };
    let lastK = -1;
    const inflate = k => {
      if (Math.abs(k - lastK) < .002) return; lastK = k;
      const d = W * .24;
      for (const geo of [gFront, gBack]) {
        const p = geo.attributes.position.array;
        for (let i = 0; i < p.length; i += 3) {
          const u = base[i] / (W / 2), t = .5 - base[i + 1] / H;
          const tt = Math.min(1, Math.max(0, t)), au = Math.abs(u), ue = Math.min(1, au / .975);   // у края — плоский сварной шов
          let z = d * Math.max(0, 1 - ue * ue) * g(tt);
          // складки: мелкая «гармошка» вдоль боковых швов, косые заломы от углов, залом под верхним швом
          const side = au > .7 && au < .975 ? Math.sin(Math.PI * (au - .7) / .275) : 0;
          z += W * .011 * side * Math.sin(tt * 34 + au * 9) * (.6 + .4 * Math.sin(tt * 11));
          for (const [cx, ct, dx, dt, a] of [[1, .02, -.55, .3, 1], [-1, .02, .55, .3, 1], [1, 1, -.5, -.32, .8], [-1, 1, .5, -.32, .8], [1, .02, -.3, .5, .6], [-1, .02, .3, .5, .6]]) {
            const L = Math.hypot(dx, dt), px = (u - cx), pt = (tt - ct), s = (px * dx + pt * dt) / (L * L);
            if (s < 0 || s > 1) continue;
            const ox = px - s * dx, ot = pt - s * dt, dist = Math.hypot(ox, ot * 1.6);
            z -= W * .02 * a * Math.exp(-dist * dist / .0012) * Math.sin(Math.PI * s) * (1 - ue * ue > 0 ? 1 : 0);
          }
          z += W * .006 * Math.exp(-Math.pow((tt - .085) / .018, 2)) * Math.max(0, 1 - ue * ue) * Math.sin(u * 7);
          p[i + 2] = k * Math.max(0, z);
          p[i] = base[i] * (1 - .06 * k); // надутый пакет чуть уже
        }
        geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
      }
      const q = gBottom.attributes.position.array, zb = k * d * g(1);
      // дно-«подушка»: овал с острыми краями у боковых швов, глянцевый и выпуклый вниз
      for (let i = 0; i <= NX; i++) for (let j = 0; j <= NV; j++) {
        const x = (-.5 + i / NX) * W, u = x / (W / 2), pr = 1 - u * u, v = -1 + 2 * j / NV, X = x * (1 - .06 * k);
        q.set([X, -H / 2 + .5 + k * W * (.05 * (1 - v * v) + .05 * (1 - Math.abs(v))) * pr, v * zb * pr], (i * (NV + 1) + j) * 3);
      }
      gBottom.attributes.position.needsUpdate = true; gBottom.computeVertexNormals();
    };

    // состояние
    let k = 0, rot = 0, lift = 0, tilt = 0, zoom = 1, fade = 1, side = 0, busy = false, anim = null, draw = true;
    // кручение пальцем: ux/uy — повороты от пальца, vx/vy — инерция, kd — надутость от кручения
    let ux = 0, uy = 0, vx = 0, vy = 0, kd = 0, kdT = 0, spinning = false;
    const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2, cl = x => Math.max(0, Math.min(1, x));

    const resize = () => { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight;
      cam.position.set(0, 0, innerHeight / 2 / Math.tan(FOV * Math.PI / 360)); cam.updateProjectionMatrix(); draw = true; };
    addEventListener('resize', resize); resize();

    let rect = null, panX = 0, panY = 0;
    const zFit = () => rect ? Math.max(innerWidth / rect.width, innerHeight / rect.height) * 1.15 : 1;   // во весь экран
    const zMax = () => zFit() * 3;                                                                       // ещё в 3 раза — читается мелкий текст
    const screenRect = () => {
      const s = zoom, f = cl((s - 1) / Math.max(.01, zFit() - 1));
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const X = cx + (innerWidth / 2 - cx) * f, Y = cy + (innerHeight / 2 - cy) * f;
      return { x: X + panX, y: Y + panY, w: rect.width * s, h: rect.height * s, bx: X, by: Y };
    };

    const frame = now => {
      requestAnimationFrame(frame);
      if (anim) anim(now);
      const r = img.getBoundingClientRect();
      if (!r.width) return;
      if (!rect || Math.abs(r.width - W) > .5 || Math.abs(r.height - H) > .5) { W = r.width; H = r.height; mkGeo(); }
      if (!rect || r.top !== rect.top || r.left !== rect.left) draw = true;
      rect = r;
      if (!spinning && (Math.abs(vx) > .0005 || Math.abs(vy) > .0005)) { ux += vx; uy += vy; vx *= .94; vy *= .94; draw = true; }
      if (Math.abs(kd - kdT) > .002) { kd += (kdT - kd) * .08; draw = true; }
      if (!draw && !anim) return;
      draw = false;
      const kz = side === 0 ? cl((zoom - 1) / .6) : 0;   // при увеличении пальцами тоже надувается
      inflate(Math.max(k, kz, kd));
      const sr = screenRect();
      group.position.set(sr.x - innerWidth / 2, -(sr.y - innerHeight / 2), lift);
      group.scale.setScalar(zoom);
      pouch.rotation.set(tilt - .16 * kz + ux, rot - .3 * kz + uy, 0);
      mFront.opacity = mBack.opacity = fade; mFront.transparent = mBack.transparent = fade < 1;
      cv.style.opacity = document.body.classList.contains('mix-on') ? 0 : 1;
      renderer.render(scene, cam);
    };
    img.style.opacity = '0';               // картинка остаётся невидимой — для размеров и нажатий
    requestAnimationFrame(frame);
    new MutationObserver(() => draw = true).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // 1) надувается 1,6 с  2) переворачивается 2,8 с и останавливается пухлым
    const flip = () => {
      const t0 = performance.now(), T1 = 1600, T2 = 2800, ux0 = ux, uy0 = uy; vx = vy = 0;
      anim = now => {
        const t = now - t0, a = ease(cl(t / T1)), p = ease(cl((t - T1) / T2));
        ux = ux0 * (1 - a); uy = uy0 * (1 - a);   // сначала плавно встаёт ровно, потом переворот
        k = a; rot = (-18 * a * (1 - p) + 164 * p) * Math.PI / 180;   // останавливается чуть боком — видно толщину
        lift = 40 * a + 70 * Math.sin(Math.PI * p); tilt = -.14 * a - .3 * Math.sin(Math.PI * p);
        if (t >= T1 + T2) { anim = null; side = 1; busy = false; lift = 40; tilt = -.14; draw = true; }
      };
    };
    const tap = () => {
      if (busy || document.body.classList.contains('mix-on')) return; busy = true;
      if (side === 0) return flip();
      const t0 = performance.now(), z0 = zoom;
      anim = now => {
        const p = cl((now - t0) / 750); fade = 1 - p; zoom = z0 * (1 + .08 * p);
        if (p >= 1) { anim = null; onOpen(); busy = false; draw = true; }
      };
    };
    // закрыли «Состав» или «Купить»: пакет появляется таким, каким его оставили,
    // и медленно (1,8 с) поворачивается лицом и уменьшается до начального вида — без прыжков
    const settle = () => {
      const T = 1800, t0 = performance.now(), PI2 = Math.PI * 2;
      const s0 = { ux: ux - PI2 * Math.round(ux / PI2), uy: uy - PI2 * Math.round(uy / PI2), zoom, kd, k, rot, tilt, lift, fade, px: panX, py: panY };
      vx = vy = 0; kdT = 0; busy = true; side = 0;
      anim = now => {
        const p = ease(cl((now - t0) / T)), q = 1 - p;
        ux = s0.ux * q; uy = s0.uy * q; zoom = 1 + (s0.zoom - 1) * q; kd = s0.kd * q; panX = s0.px * q; panY = s0.py * q;
        k = s0.k * q; rot = s0.rot * q; tilt = s0.tilt * q; lift = s0.lift * q; fade = s0.fade + (1 - s0.fade) * p;
        if (p >= 1) { anim = null; busy = false; ux = uy = kd = k = rot = tilt = lift = panX = panY = 0; zoom = fade = 1; cv.classList.remove('big'); draw = true; }
      };
    };
    let wasOn = false;
    new MutationObserver(() => {
      const on = document.body.classList.contains('mix-on');
      if (wasOn && !on) setTimeout(settle, 250);   // сначала пакет проявляется, потом поворачивается
      wasOn = on;
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const reset = () => {};   // возврат делает settle (выше)

    // нажатие: по невидимой картинке, а когда упаковка увеличена — по ней на холсте
    let moved = false;
    // без onOpen пакет не переворачивается по нажатию — его только крутят пальцем
    img.addEventListener('click', () => { if (!moved && onOpen) tap(); });
    cv.addEventListener('click', e => { if (moved || !onOpen) return; const s = screenRect(); if (Math.abs(e.clientX - s.x) < s.w / 2 && Math.abs(e.clientY - s.y) < s.h / 2) tap(); });

    // одним пальцем (или мышью) — крутить упаковку как угодно, с инерцией
    img.style.touchAction = 'none';
    const pts = new Map(); let drag = null;
    const down = e => {
      if (document.body.classList.contains('mix-on')) return;
      if (!rect || (e.target.closest && e.target.closest('button, a, input, #mixWrap'))) return;   // кнопки «Состав»/«Купить» работают всегда
      const s = screenRect(); if (Math.abs(e.clientX - s.x) > s.w / 2 || Math.abs(e.clientY - s.y) > s.h / 2) return;
      pts.set(e.pointerId, 1); moved = false;
      if (pts.size === 1 && !anim) { drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }; vx = vy = 0; }
      else drag = null;                                  // второй палец — это уже увеличение
    };
    const move = e => {
      if (!drag || e.pointerId !== drag.id || anim) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      if (!moved) { moved = true; spinning = true; kdT = 1; }
      const now = performance.now(), dt = Math.max(8, now - drag.t);
      const ry = dx * .011, rx = dy * .011;
      uy += ry; ux += rx; vy = ry * 16 / dt; vx = rx * 16 / dt;
      drag.x = e.clientX; drag.y = e.clientY; drag.t = now; draw = true;
    };
    const up = e => {
      pts.delete(e.pointerId);
      if (drag && e.pointerId === drag.id) { if (performance.now() - drag.t > 80) vx = vy = 0; drag = null; spinning = false; }
      if (moved) setTimeout(() => moved = false, 50);
    };
    addEventListener('pointerdown', down);   // холст пропускает нажатия насквозь — ловим палец над пакетом сами
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);

    // двумя пальцами — увеличить / уменьшить и двигать (как фото в галерее); место под пальцами остаётся под пальцами
    const zoomAt = (z, a, mx, my) => {
      zoom = Math.max(1, Math.min(zMax(), z));
      const k = zoom / a.z, s = (panX = panY = 0, screenRect());
      let X = mx + (a.cx - a.mx) * k, Y = my + (a.cy - a.my) * k;
      // пакет не уезжает за край целиком
      const lx = Math.max(0, s.w / 2 - innerWidth * .25), ly = Math.max(0, s.h / 2 - innerHeight * .25);
      X = Math.max(innerWidth / 2 - lx, Math.min(innerWidth / 2 + lx, X)); Y = Math.max(innerHeight / 2 - ly, Math.min(innerHeight / 2 + ly, Y));
      const f = cl((zoom - 1) / .3);                     // у начального размера сдвига нет
      panX = (X - s.bx) * f; panY = (Y - s.by) * f;
      cv.classList.toggle('big', zoom > 1.02); draw = true;
    };
    let pinch = null;
    const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    addEventListener('touchstart', e => {
      if (e.touches.length !== 2 || !rect || document.body.classList.contains('mix-on')) return;
      const s = screenRect(), mx = (e.touches[0].clientX + e.touches[1].clientX) / 2, my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const pad = 40;
      if (Math.abs(mx - s.x) < s.w / 2 + pad && Math.abs(my - s.y) < s.h / 2 + pad) { pinch = { d: dist(e.touches), z: zoom, mx, my, cx: s.x, cy: s.y }; loadHD(); }
    }, { passive: true });
    addEventListener('touchmove', e => {
      if (!pinch || e.touches.length !== 2) return; e.preventDefault();
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2, my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      zoomAt(pinch.z * dist(e.touches) / pinch.d, pinch, mx, my);
    }, { passive: false });
    addEventListener('touchend', e => {
      if (!pinch || e.touches.length >= 2) return; pinch = null;
      if (zoom < 1.12) { const t0 = performance.now(), z0 = zoom, p0x = panX, p0y = panY; const prev = anim;   // почти собрали — доводим до места
        if (!prev) anim = now => { const p = cl((now - t0) / 250); zoom = z0 + (1 - z0) * p; panX = p0x * (1 - p); panY = p0y * (1 - p); if (p >= 1) { anim = null; cv.classList.remove('big'); draw = true; } }; }
    });
    // на компьютере — колёсиком мыши над упаковкой
    addEventListener('wheel', e => {
      if (!rect || document.body.classList.contains('mix-on')) return;
      const s = screenRect(); if (Math.abs(e.clientX - s.x) > s.w / 2 || Math.abs(e.clientY - s.y) > s.h / 2) return;
      e.preventDefault(); loadHD(); zoomAt(zoom * (e.deltaY < 0 ? 1.15 : .87), { z: zoom, mx: e.clientX, my: e.clientY, cx: s.x, cy: s.y }, e.clientX, e.clientY);
    }, { passive: false });

    // для фото: preview.html?shot=ux,uy,zoom
    const shot = /[?&]shot=([^&]+)/.exec(location.search);
    if (shot) { const [a, b, z] = shot[1].split(',').map(Number); setTimeout(() => { ux = a; uy = b; kd = kdT = 1; zoom = z || 1; if (zoom > 1.02) cv.classList.add('big'); draw = true; }, 1200); }
    return { reset, st: () => ({ ux: +ux.toFixed(2), uy: +uy.toFixed(2), zoom: +zoom.toFixed(2), anim: !!anim }), view(x, y) { ux = x; uy = y; vx = vy = 0; kd = kdT = 1; draw = true; } };
  }
};

// Сертификаты как тонкие 3D-листы А4 (three.js).
// Большой (открытый) лист — крутить одним пальцем в любую сторону, обратная сторона белая.
// Маленькие в сетке — слегка покачиваются и поворачиваются вслед за пальцем / наклоном телефона.
// Если 3D не запускается — остаются обычные картинки.
window.Sheet3D = {
  init(mix, mixIn) {
    if (!window.THREE) return null;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch (e) { return null; }
    if (!renderer.getContext()) return null;
    const cv = renderer.domElement; cv.className = 'sheet3d-cv';
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    mix.appendChild(cv);

    let items = [], els = [], draw = true, big = false, drag = null;
    const scene = new THREE.Scene(), FOV = 30;
    const cam = new THREE.PerspectiveCamera(FOV, 1, 10, 20000);
    scene.add(new THREE.AmbientLight(0xffffff, .5));
    const key = new THREE.DirectionalLight(0xffffff, .5); key.position.set(0, 0, 1); scene.add(key);
    const side = new THREE.DirectionalLight(0xffffff, .25); side.position.set(-.7, .6, .5); scene.add(side);

    const loader = new THREE.TextureLoader(), texCache = {};
    const tex = (src, el) => {
      if (!texCache[src]) { texCache[src] = loader.load(src, () => { texCache[src].ok = true; draw = true; }); texCache[src].encoding = THREE.sRGBEncoding; texCache[src].anisotropy = 4; }
      return texCache[src];
    };
    const mBack = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85 });
    const mEdge = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: .9 });
    const box = new THREE.BoxGeometry(1, 1, 1);

    const resize = () => { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight;
      cam.position.set(0, 0, innerHeight / 2 / Math.tan(FOV * Math.PI / 360)); cam.updateProjectionMatrix(); draw = true; };
    addEventListener('resize', resize); resize();

    // картинка с object-fit:contain рисуется не на весь свой прямоугольник — считаем, где она на самом деле
    const drawnRect = im => {
      const r = im.getBoundingClientRect();
      if (!im.naturalWidth || getComputedStyle(im).objectFit !== 'contain') return r;
      const k = Math.min(r.width / im.naturalWidth, r.height / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
      return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
    };

    let ux = 0, uy = 0, vx = 0, vy = 0, spinning = false, moved = false;
    let px = innerWidth / 2, py = innerHeight / 2, tiltX = 0, tiltY = 0, base = null;

    const rebuild = list => {
      items.forEach(it => scene.remove(it.mesh));
      els = list; ux = uy = vx = vy = 0;
      items = list.map((el, i) => {
        const t = tex(el.currentSrc || el.src, el);
        const mesh = new THREE.Mesh(box, [mEdge, mEdge, mEdge, mEdge, new THREE.MeshStandardMaterial({ map: t, roughness: .55 }), mBack]);
        mesh.visible = false; scene.add(mesh);
        return { el, mesh, t, ph: i * 1.7 };
      });
    };

    const frame = now => {
      requestAnimationFrame(frame);
      const open = mix.classList.contains('open');
      if (!open) { if (items.length) rebuild([]); cv.style.display = 'none'; return; }
      big = mix.classList.contains('doc-open');
      const list = [...mixIn.querySelectorAll(big ? 'img.pg-cert' : '.doc-th img')];
      if (list.length !== els.length || list.some((e, i) => e !== els[i])) rebuild(list);
      // картинка подменилась (маленькая → чёткая): меняем рисунок на листе, когда чёткий загрузится
      for (const it of items) { const src = it.el.currentSrc || it.el.src; if (it.src !== src) { const t = tex(src);
        if (t.ok || !it.src) { it.src = src; it.t = t; it.mesh.material[4].map = t; it.mesh.material[4].needsUpdate = true; } } }
      if (!items.length) { cv.style.display = 'none'; return; }   // нет листов (страница «Состав») — 3D-окна нет совсем
      cv.style.display = '';
      // увеличили — лист плавно встаёт ровно лицом и больше не крутится (его двигают)
      const zoomed = big && mix.classList.contains('zoomed');
      if (zoomed) { drag = null; spinning = false; vx = vy = 0; const P = Math.PI * 2;
        ux -= P * Math.round(ux / P); uy -= P * Math.round(uy / P); ux *= .82; uy *= .82; }
      else if (!spinning && (Math.abs(vx) > .0005 || Math.abs(vy) > .0005)) { ux += vx; uy += vy; vx *= .94; vy *= .94; }
      const T = now / 1000;
      for (const it of items) {
        if (!it.t.ok) continue;
        if (!it.shown) { it.shown = true; it.el.style.opacity = '0'; }   // настоящая картинка невидима, но нажимается
        const r = drawnRect(it.el); if (!r.width) { it.mesh.visible = false; continue; }
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        it.mesh.visible = true;
        it.mesh.position.set(cx - innerWidth / 2, -(cy - innerHeight / 2), 0);
        it.mesh.scale.set(r.width, r.height, Math.max(1.2, r.width * .006));
        if (big) it.mesh.rotation.set(ux, uy, 0);
        else {
          // покачивание + поворот к пальцу + наклон телефона
          const fy = Math.max(-1, Math.min(1, (px - cx) / innerWidth * 2)), fx = Math.max(-1, Math.min(1, (py - cy) / innerHeight * 2));
          it.mesh.rotation.set(.07 * Math.sin(T * .8 + it.ph) + .25 * fx + tiltX, .1 * Math.sin(T * .6 + it.ph * 1.3) + .35 * fy + tiltY, 0);
        }
      }
      renderer.render(scene, cam);
    };
    requestAnimationFrame(frame);

    // палец/мышь над сеткой — маленькие листы поворачиваются к нему
    mix.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; });
    // наклон телефона (где браузер даёт без запроса разрешения)
    addEventListener('deviceorientation', e => {
      if (e.beta == null) return;
      if (!base) base = { b: e.beta, g: e.gamma };
      const cl = v => Math.max(-.35, Math.min(.35, v));
      tiltX = cl((e.beta - base.b) * Math.PI / 180 * .6); tiltY = cl((e.gamma - base.g) * Math.PI / 180 * .6);
    });

    // большой лист: одним пальцем крутить, с инерцией; два пальца — это увеличение (его делает about.js)
    const pts = new Set();
    mix.addEventListener('pointerdown', e => {
      pts.add(e.pointerId); moved = false;
      if (!big || pts.size !== 1 || mix.classList.contains('zoomed') || !e.target.closest('img.pg-cert')) { drag = null; spinning = false; return; }
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }; vx = vy = 0;
    });
    addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (pts.size > 1) { drag = null; spinning = false; return; }
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      moved = true; spinning = true;
      const now = performance.now(), dt = Math.max(8, now - drag.t), ry = dx * .009, rx = dy * .009;
      uy += ry; ux += rx; vy = ry * 16 / dt; vx = rx * 16 / dt;
      drag.x = e.clientX; drag.y = e.clientY; drag.t = now;
    });
    const up = e => {
      pts.delete(e.pointerId);
      if (drag && e.pointerId === drag.id) { if (performance.now() - drag.t > 80) vx = vy = 0; drag = null; spinning = false; }
    };
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
    // если крутили — это не нажатие: лист не закрывается
    mix.addEventListener('click', e => { if (moved) { e.stopPropagation(); moved = false; } }, true);
    return { dbg: () => ({ n: items.length, ok: items.map(i => !!i.t.ok), vis: items.map(i => i.mesh.visible), big, ux, uy }) };
  }
};

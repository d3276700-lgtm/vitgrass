// «О продукте» → окно с пользой; внизу кнопки «Награды», «Сертификаты», «Вопросы»
(function () {
  const wrap = document.createElement('div'); wrap.id = 'aboutWrap';
  wrap.innerHTML = `
    <div class="sheet" id="abSheet" role="dialog" aria-label="О продукте">
      <div class="sh-head">
        <button class="ib" id="abBack" aria-label="Назад">←</button>
        <h2 id="abTitle">О продукте</h2>
        <button class="ib" id="abClose" aria-label="Закрыть">✕</button>
      </div>
      <div class="sh-body"><div class="scrolly ab-text" id="abBody"></div></div>
      <div class="ab-tabs">
        <button class="ab-tab" data-v="awards">Награды</button>
        <button class="ab-tab" data-v="certs">Сертификаты</button>
        <button class="ab-tab" data-v="faq">Вопросы</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  const VIEWS = {
    benefit: { t: 'О продукте', h: `
      <button class="ab-mixbtn" id="mixBtn" type="button">Состав на 100&nbsp;г</button>
      <h3>Что такое витграсс</h3>
      <p>Это сок молодых ростков пшеницы. Green Vitamin замораживают сразу после отжима при −40&nbsp;°C — так сок сохраняется надолго.</p>
      <h3>Что в нём есть</h3>
      <ul>
        <li>Хлорофилл — зелёный пигмент растений</li>
        <li>Витамины C и E</li>
        <li>Природные антиоксиданты — флавоноиды</li>
        <li>Простой способ добавить зелень в ежедневное питание</li>
      </ul>
      <div class="ab-howto"><b>Как пить:</b> растворите одну порцию в стакане воды и выпейте.</div>
      <p class="ab-legal">Не является лекарственным средством.</p>` },
    awards: { t: 'Награды', h: `
      <div class="ab-award"><span class="cup">🏆</span>
        <b>1 место — FoodExpo Qazaqstan 2026</b>
        <p>Номинация «Лучший натуральный напиток»</p></div>
      <div class="ab-soon">Скоро здесь будут фото дипломов</div>` },
    certs: { t: 'Сертификаты', h: `<div class="ab-soon">Скоро здесь будут документы</div>` },
    faq: { t: 'Вопросы и ответы', h: '<div class="ab-faq">' + [
        ['Где купить?', 'Нажмите «Купить» на главном экране — выберите страну и город, на карте будут ближайшие точки продаж.'],
        ['Как хранить?', 'Ответ скоро появится.'],
        ['Сколько пить в день?', 'Ответ скоро появится.'],
        ['Можно ли детям?', 'Ответ скоро появится.'],
        ['Какой срок годности?', 'Ответ скоро появится.'],
      ].map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('') + '</div>' },
  };

  const sheet = document.getElementById('abSheet'), body = document.getElementById('abBody');
  const title = document.getElementById('abTitle'), back = document.getElementById('abBack');
  const tabs = sheet.querySelectorAll('.ab-tab');

  function show(v) {
    title.textContent = VIEWS[v].t; body.innerHTML = VIEWS[v].h; body.scrollTop = 0;
    back.hidden = v === 'benefit';
    tabs.forEach(b => b.classList.toggle('on', b.dataset.v === v));
  }
  tabs.forEach(b => b.onclick = () => show(b.dataset.v));
  back.onclick = () => show('benefit');
  const close = () => sheet.classList.remove('open');
  document.getElementById('abClose').onclick = close;
  
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (mix.classList.contains('open')) closeMix(); else close(); } });

  // «Состав» — выезжает на тёмном прозрачном фоне, сзади виден эффект; пальцами можно увеличить/уменьшить
  const ROWS = [
    ['Пищевая ценность', [['Белки','1,44 г'],['Жиры','0 г'],['Углеводы','1,26 г'],['Энергия','5,76 ккал / 24,79 кДж']]],
    ['Витамины', [['C','145,07 мг'],['B1 (тиамин)','4,95 мг'],['B2 (рибофлавин)','2,08 мг'],['B3 / PP (ниацин)','4,03 мг'],['B5 (пантотеновая к-та)','0,37 мг'],['B6 (пиридоксин)','1,28 мг'],['E','3,12 мг']]],
    ['Минералы', [['Фосфор','127,8 мг'],['Железо','1,44 мг']]],
    ['Биофлавоноиды', [['Рутин','7,43 мг'],['Кверцетин','2,62 мг']]],
  ];
  const mixHtml = `<h2>${T('Состав на 100&nbsp;г')}</h2>
      ${ROWS.map(([h, r]) => `<h3>${T(h)}</h3><dl>${r.map(([a, b]) => `<dt>${T(a)}</dt><dd>${UNIT(b)}</dd>`).join('')}</dl>`).join('')}`;
  // экраны по очереди: кнопка слева вверху ведёт на следующий
  const PAGES = [
    { n: T('Состав'), h: mixHtml },
    { n: T('Награды'), docs: 'aw', get h() { return `<h2>${T('Награды')}</h2>
      <div class="pg-card"><div class="pg-big">🏆</div><b>${T('1 место — FoodExpo Qazaqstan 2026')}</b><p>${T('Номинация «Лучший натуральный напиток»')}</p></div>` + docGrid(AWARDS); } },
    { n: T('Как принимать'), h: `<h2>${T('Как принимать')}</h2><div class="howto">` +
        [['Достаньте','Извлеките нужное количество шариков из пакета.'],
         ['Приготовьте','Положите 2 шарика в стакан и залейте водой — 200 мл.'],
         ['Наслаждайтесь','Перемешайте и выпейте через 15 минут.']]
        .map(([t, d], i) => `<div class="ht-step"><img src="howto/step${i + 1}.jpg?v=1" alt=""><div><b><span>0${i + 1}</span>${T(t)}</b><p>${T(d)}</p></div></div>`).join('') +
        `</div><div class="ht-note">${['❗ Не растворять в горячей воде.', '🕒 Можно пить в любое время: до или после еды.', '❄️ Упаковка хранится в морозильнике.'].map(x => `<p>${T(x)}</p>`).join('')}</div>` +
        `<h3 class="ht-rec">${T('Рецепты')}</h3><p class="pg-soon">${T('Скоро здесь будут рецепты')}</p>` },
    { n: T('Сертификаты'), docs: 'doc', get h() { return `<h2>${T('Сертификаты')}</h2>` + docGrid(DOCS); } },
    { n: T('Вопросы'), h: `<h2>${T('Вопросы и ответы')}</h2>` + [
        ['Где купить?', 'Нажмите «Купить» на главном экране — выберите страну и город, на карте будут точки продаж.'],
        ['Как хранить?', 'Ответ скоро появится.'],
        ['Сколько пить в день?', 'Ответ скоро появится.'],
        ['Можно ли детям?', 'Ответ скоро появится.'],
        ['Какой срок годности?', 'Ответ скоро появится.'],
      ].map(([q, a]) => `<div class="pg-q"><b>${T(q)}</b><p>${T(a)}</p></div>`).join('') },
  ];
  const AWARDS = [
    ['Диплом победителя «Лучшие продукты питания» — Актобе, 2026', 'docs/diploma-aktobe.webp'],
  ];
  const DOCS = [
    ['Свидетельство на товарный знак № 87803', 'cert-trademark.webp'],
    ['Сертификат соответствия ISO 22000:2018', 'docs/iso-ru.webp'],
    ['Приложение к сертификату ISO 22000', 'docs/iso-app-ru.webp'],
    ['Сәйкестік сертификаты ISO 22000:2018', 'docs/iso-kz.webp'],
    ['Сертификат сәйкестігі қосымшасы', 'docs/iso-app-kz.webp'],
    ['Certificate of conformity ISO 22000:2018', 'docs/iso-en.webp'],
    ['Appendix to the certificate', 'docs/iso-app-en.webp'],
    ['Протокол испытаний № 2554К — стр. 1', 'docs/lab-2554-1.webp'],
    ['Протокол испытаний № 2554К — стр. 2', 'docs/lab-2554-2.webp'],
    ['Протокол испытаний № 2555К', 'docs/lab-2555.webp'],
    ['Протокол испытаний № 2556К', 'docs/lab-2556.webp'],
  ];
  // сертификаты ISO на языке сайта — первыми; названия документов переводим
  { const lg = { ru: '-ru.', kk: '-kz.', en: '-en.' }[window.LANG || 'ru'];
    const iso = DOCS.filter(d => /iso-/.test(d[1])); iso.sort((a, b) => (b[1].includes(lg)) - (a[1].includes(lg)));
    DOCS.splice(1, iso.length, ...iso); [AWARDS, DOCS].forEach(L => L.forEach(d => d[0] = T(d[0]))); }
  let page = 0, doc = 0;
  const mix = document.createElement('div'); mix.id = 'mixWrap';
  mix.innerHTML = `<button class="mix-next" id="mixNext" type="button"></button>
    <button class="mix-x" id="mixClose" aria-label="${T('Закрыть')}">✕</button>
    <button class="mix-x mix-back" id="mixBack" type="button" aria-label="${T('Назад')}">←</button>
    <div class="mix-zoom" id="mixZoom"><div class="mix-in" id="mixIn"></div></div>
    <div class="mix-hint">${T('Разведите пальцы — чтобы увеличить')}</div>`;
  document.body.appendChild(mix);
  const mixIn = document.getElementById('mixIn'), nextBtn = document.getElementById('mixNext'), backBtn = document.getElementById('mixBack');
  // «назад»: открытый сертификат → к списку; иначе — на предыдущую страницу; на первой («Состав») стрелки нет
  const updBack = () => backBtn.classList.toggle('hide', page === 0 && !mix.classList.contains('doc-open'));
  backBtn.onclick = () => {
    if (mix.classList.contains('doc-open')) { mix.classList.remove('doc-open'); mixIn.innerHTML = PAGES[page].h; reset(); updBack(); return; }
    if (page > 0) showPage(page - 1);
  };
  function showPage(i) {
    page = i; mixIn.innerHTML = PAGES[i].h; mixIn.querySelectorAll('img').forEach(im => im.complete || (im.onload = reset));
    nextBtn.textContent = PAGES[(i + 1) % PAGES.length].n + ' →';
    mixIn.classList.remove('pg-in'); void mixIn.offsetWidth; mixIn.classList.add('pg-in');
    mix.classList.toggle('docs', !!PAGES[i].docs); mix.classList.remove('doc-open');
    reset(); updBack();
  }
  nextBtn.onclick = () => showPage((page + 1) % PAGES.length);
  const thumb = f => 'docs/thumbs/' + f.split('/').pop().replace('.webp', '.jpg') + '?v=1';
  const listOf = () => PAGES[page].docs === 'aw' ? AWARDS : DOCS;
  function docGrid(L) {
    return '<div class="doc-grid' + (L.length === 1 ? ' one' : L.length > 4 ? ' many' : '') + '">' + L.map((d, k) =>
      `<button type="button" class="doc-th" data-k="${k}"><img src="${thumb(d[1])}" alt=""><span>${d[0]}</span></button>`).join('') + '</div>';
  }
  // нажали на маленький — раскрылся на весь экран; нажали ещё раз — снова сетка
  mixIn.addEventListener('click', e => {
    if (!PAGES[page].docs) return;
    if (mix.classList.contains('doc-open')) { mix.classList.remove('doc-open'); mixIn.innerHTML = PAGES[page].h; reset(); updBack(); return; }
    const th = e.target.closest('.doc-th'); if (!th) return;
    const d = listOf()[+th.dataset.k];
    mix.classList.add('doc-open');
    // сразу показываем маленькую картинку из списка (она уже загружена), чёткая подменяет её, как только догрузится
    mixIn.innerHTML = `<h2>${d[0]}</h2><img class="pg-cert" src="${thumb(d[1])}" alt="">`;
    const im = mixIn.querySelector('img'); im.onload = reset; reset(); updBack();
    const full = new Image(); full.src = d[1] + '?v=4';
    full.decode().catch(() => {}).then(() => { if (im.isConnected && full.naturalWidth) { im.onload = null; im.src = full.src; } });
  });
  const zoomEl = document.getElementById('mixZoom');
  let sc = 1, tx = 0, ty = 0;
  // сетка сертификатов не сжимается, а листается пальцем вниз
  const isGrid = () => mix.classList.contains('docs') && !mix.classList.contains('doc-open');
  // увеличенную страницу нельзя утащить за край целиком
  const clampPan = () => { const c = zoomEl.firstElementChild; if (!c || isGrid()) return;
    const lx = Math.max(0, (c.offsetWidth * sc - innerWidth) / 2 + 30), ly = Math.max(0, (c.offsetHeight * sc - innerHeight) / 2 + 60);
    tx = Math.max(-lx, Math.min(lx, tx)); ty = Math.max(-ly, Math.min(ly, ty)); };
  const apply = () => { clampPan(); zoomEl.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`; mix.classList.toggle('zoomed', sc > fitSc() + .01); };
  const fitSc = () => { if (isGrid()) return 1; const h = zoomEl.firstElementChild.offsetHeight; return Math.min(1, (innerHeight - (innerWidth > innerHeight ? 40 : 110)) / h); };
  const reset = () => { sc = fitSc(); tx = 0; ty = 0; apply(); if (isGrid()) zoomEl.scrollTop = 0; };
  function openMix() { document.body.classList.add('mix-on'); sheet.classList.remove('open'); mix.classList.add('open'); showPage(0); }
  let resetPack = () => {};
  function closeMix() { document.body.classList.remove('mix-on'); mix.classList.remove('open'); resetPack(); }
  body.addEventListener('click', e => { if (e.target.closest('#mixBtn')) openMix(); });
  document.getElementById('mixClose').onclick = closeMix;
  // «О продукте» сразу открывает состав (старое окно с текстом и кнопками больше не показываем)
  // кнопка вверху теперь «Сертификаты» — сразу открывает страницу с сертификатами
  // кнопка вверху «Состав»: чёрный экран с составом, дальше листаются награды, сертификаты и остальное
  document.getElementById('aboutBtn').onclick = () => openMix();

  // упаковка: нажал — плавно переворачивается задней стороной; нажал ещё раз — растворяется и появляется состав
  const pack = document.querySelector('.pack-bottom');
  if (pack) {
    const FRONT = pack.getAttribute('src'), BACK = 'pack-2026-back.webp?v=1';
    new Image().src = BACK;
    const p3 = window.Pack3D && Pack3D.init(pack, { front: 'pack3d-front.webp?v=1', back: 'pack3d-back.webp?v=1', onOpen: null });   // не переворачивается, только крутится
    if (p3) { resetPack = p3.reset; window.__pack3d = p3; } else {
    let side = 0, busy = false, box = null;
    // «дой-пак» из кусочков картинки; --k — насколько пакет надут (0 — плоский, 1 — пухлый)
    const build = () => {
      const r = pack.getBoundingClientRect(), W = r.width, H = r.height, d = W * .15, NX = 10, NY = 12;
      const el = document.createElement('div'); el.className = 'pk3d';
      Object.assign(el.style, { left: r.left + 'px', top: r.top + 'px', width: W + 'px', height: H + 'px' });
      const g = t => t < .62 ? Math.sin(t / .62 * Math.PI / 2) : 1 - .22 * (t - .62) / .38;
      const Z = (u, t) => d * (1 - u * u) * g(t);
      const face = img => {
        let h = ''; const tw = W / NX, th = H / NY;
        for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
          const u = (i + .5) / NX * 2 - 1, t = (j + .5) / NY, z = Z(u, t), e = .01;
          const dx = (Z(u + e, t) - Z(u - e, t)) / (2 * e) / (W / 2), dy = (Z(u, t + e / 2) - Z(u, t - e / 2)) / e / H;
          const ay = Math.atan(-dx), ax = Math.atan(dy), nz = 1 / Math.hypot(dx, dy, 1);
          const sh = Math.min(.45, (1 - nz) * 1.8 + (dx > 0 ? .04 : 0)).toFixed(3);
          const sx = 1 / Math.cos(ay) - 1, sy = 1 / Math.cos(ax) - 1;
          h += `<i style="left:${i * tw}px;top:${j * th}px;width:${tw + 1.2}px;height:${th + 1.2}px;` +
            `background:linear-gradient(rgba(0,0,0,calc(${sh} * var(--k))),rgba(0,0,0,calc(${sh} * var(--k)))),url('${img}') ${-i * tw}px ${-j * th}px/${W}px ${H}px;` +
            `transform:translateZ(calc(${z.toFixed(2)}px * var(--k))) rotateY(calc(${ay.toFixed(4)}rad * var(--k))) rotateX(calc(${ax.toFixed(4)}rad * var(--k))) ` +
            `scale(calc(1 + ${sx.toFixed(3)} * var(--k)),calc(1 + ${sy.toFixed(3)} * var(--k)))"></i>`;
        }
        return h;
      };
      el.innerHTML = `<div class="pk-c"><div class="pk-face">${face(FRONT)}</div><div class="pk-face pk-back">${face(BACK)}</div></div><div class="pk-sh"></div>`;
      el.onclick = tap;
      return el;
    };
    // плавные кривые
    const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2, cl = x => Math.max(0, Math.min(1, x));
    // 1) медленно надувается (1,6 с), 2) медленно поворачивается задней стороной (2,8 с) и останавливается пухлым
    const flip = done => {
      box = build(); document.body.appendChild(box);
      const c = box.firstChild, shd = box.lastChild, T1 = 1600, T2 = 2800, t0 = performance.now();
      pack.style.visibility = 'hidden';
      const frame = now => {
        if (!box) return;
        const t = now - t0, k = ease(cl(t / T1)), p = ease(cl((t - T1) / T2));
        const ry = -14 * k * (1 - p) + 180 * p, lift = 30 * k + 50 * Math.sin(Math.PI * p);
        c.style.setProperty('--k', k.toFixed(3));
        c.style.transform = `translateZ(${lift.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) rotateX(${(5 * Math.sin(Math.PI * p)).toFixed(2)}deg)`;
        const w = Math.abs(Math.cos(ry * Math.PI / 180));
        shd.style.transform = `scaleX(${(.45 + .55 * w).toFixed(3)})`; shd.style.opacity = (.35 + .35 * w + .1 * k).toFixed(3);
        if (t < T1 + T2) requestAnimationFrame(frame); else done();
      };
      requestAnimationFrame(frame);
    };
    function tap() {
      if (busy) return; busy = true;
      if (side === 0) { const im = new Image(); im.src = BACK; const go = () => flip(() => { side = 1; busy = false; }); return im.decode ? im.decode().then(go, go) : go(); }
      box.style.transition = 'opacity .8s ease, transform .8s ease'; box.style.opacity = '0'; box.style.transform = 'scale(1.06)';
      setTimeout(() => { openMix(); busy = false; }, 700);
    }
    // (переворот по нажатию отключён по просьбе владельца)
    resetPack = () => setTimeout(() => {
      if (box) { box.remove(); box = null; }
      side = 0; pack.style.opacity = '0'; pack.style.visibility = '';
      void pack.offsetWidth; pack.style.transition = 'opacity .5s ease'; pack.style.opacity = '1';
    }, 350);
    addEventListener('resize', () => { if (box && !busy && side === 1 && !mix.classList.contains('open')) { const r = pack.getBoundingClientRect(); /* при повороте экрана — пересобрать */
      const nb = build(); box.replaceWith(nb); box = nb; box.firstChild.style.cssText = '--k:1;transform:rotateY(180deg)'; } });
    }
  }
  // повернули телефон — заново подгоняем состав под экран
  const refit = () => { if (mix.classList.contains('open')) reset(); };
  addEventListener('resize', () => setTimeout(refit, 120)); addEventListener('orientationchange', () => setTimeout(refit, 300));

  // состав стоит на месте: одним пальцем — только эффект сзади; двумя пальцами — увеличить/уменьшить
  let start = null;
  const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const mid = t => [(t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2];
  // увеличиваем то место, где пальцы: эта точка остаётся под пальцами
  const zoomAt = (k, m) => {
    const cx = innerWidth / 2, cy = innerHeight / 2;
    const qx = (m[0] - cx - tx) / sc, qy = (m[1] - cy - ty) / sc;
    sc = k; tx = m[0] - cx - sc * qx; ty = m[1] - cy - sc * qy;
    if (sc <= fitSc() + 0.001) { tx = 0; ty = 0; }
    apply();
  };
  zoomEl.addEventListener('touchstart', e => { if (e.touches.length === 2 && !isGrid()) { start = { d: dist(e.touches), sc, m: mid(e.touches), tx, ty }; pan = null; } }, { passive: true });
  zoomEl.addEventListener('touchmove', e => {
    if (e.touches.length !== 2 || !start) return; e.preventDefault();
    // двумя пальцами — увеличить и одновременно подвинуть: точка под пальцами едет вместе с ними
    const k = Math.min(5, Math.max(fitSc(), start.sc * dist(e.touches) / start.d)), m = mid(e.touches), cx = innerWidth / 2, cy = innerHeight / 2;
    const qx = (start.m[0] - cx - start.tx) / start.sc, qy = (start.m[1] - cy - start.ty) / start.sc;
    sc = k; tx = m[0] - cx - sc * qx; ty = m[1] - cy - sc * qy;
    if (sc <= fitSc() + 0.001) { tx = 0; ty = 0; }
    apply(); panned = true;
  }, { passive: false });
  zoomEl.addEventListener('touchend', e => { if (e.touches.length < 2) start = null; });
  // увеличенная страница — одним пальцем (или мышью) двигается; сертификат при этом не крутится
  let pan = null, panned = false;
  zoomEl.addEventListener('pointerdown', e => {
    panned = false;
    if (isGrid() || !mix.classList.contains('zoomed') || start) { pan = null; return; }   // любая увеличенная страница (сертификат, «Как принимать», состав)
    pan = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  addEventListener('pointermove', e => {
    if (!pan || e.pointerId !== pan.id || start) return;
    const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
    if (!panned && Math.hypot(dx, dy) < 6) return;
    panned = true; tx += dx; ty += dy; pan.x = e.clientX; pan.y = e.clientY; apply();
  });
  const panUp = e => { if (pan && e.pointerId === pan.id) pan = null; };
  addEventListener('pointerup', panUp); addEventListener('pointercancel', panUp);
  // подвинули — это не нажатие, лист не закрывается
  mix.addEventListener('click', e => { if (panned) { e.stopPropagation(); panned = false; } }, true);
  // на компьютере — колёсиком мыши
  // сертификаты — объёмные листы, которые можно крутить пальцем
  try { if (window.Sheet3D) window.__sheet3d = Sheet3D.init(mix, mixIn); } catch (e) {}
  zoomEl.addEventListener('wheel', e => { if (isGrid()) return; e.preventDefault(); zoomAt(Math.min(5, Math.max(fitSc(), sc * (e.deltaY < 0 ? 1.1 : 0.9))), [e.clientX, e.clientY]); }, { passive: false });
})();

// высота страницы = реально видимая часть экрана (в браузере внутри Telegram 100vh бывает больше видимого)
(function () {
  const fit = () => {
    document.body.style.height = innerHeight + 'px';
    document.documentElement.style.setProperty('--vh', innerHeight / 100 + 'px');
    // страховка: если текст и кнопки всё равно не влезают (например, в телефоне увеличен шрифт) — уменьшаем их
    const els = [document.querySelector('.stage'), document.getElementById('buyBtn')];
    els.forEach(e => e && (e.style.zoom = ''));
    const b = document.body, over = b.scrollHeight - b.clientHeight;
    if (over > 1) {
      const k = Math.max(0.5, (b.clientHeight - 8) / b.scrollHeight);
      els.forEach(e => e && (e.style.zoom = k));
    }
  };
  fit(); addEventListener('load', fit); if (document.fonts) document.fonts.ready.then(fit); addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 300));
})();

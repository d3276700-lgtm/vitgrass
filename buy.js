// «Купить» → страна → карта страны с городами → карта города с точками → карточка точки
(function () {
  const BUY_TEXT = T('Здравствуйте! Хочу приобрести Витграсс.');
  const PARTNER_TEXT = T('Здравствуйте! Хочу стать представителем Витграсс в городе ');
  // номер пока не задан — кнопка видна, но никуда не ведёт (номер вписать в stores.js)
  const wa = (num, text) => num ? 'https://wa.me/' + num + '?text=' + encodeURIComponent(text) : '#';
  const route = (gis, c) => 'https://' + gis + '/directions/points/%7C' + c[1] + '%2C' + c[0];
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const plural = (n, a, b, c) => n % 10 === 1 && n % 100 !== 11 ? a : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? b : c);

  const wrap = document.getElementById('sheetWrap');
  wrap.innerHTML = `
    <div class="sheet" id="sheet" role="dialog" aria-label="${T('Где купить')}">
      <div class="sh-head">
        <button class="ib" id="shBack" aria-label="${T('Назад')}">←</button>
        <h2 id="shTitle">${T('Где купить')}</h2>
        <button class="ib" id="shClose" aria-label="${T('Закрыть')}">✕</button>
      </div>
      <div class="sh-body" id="shBody"></div>
    </div>`;
  const sheet = document.getElementById('sheet'), body = document.getElementById('shBody');
  const title = document.getElementById('shTitle'), back = document.getElementById('shBack');

  let state = { step: 'countries', country: null, city: null };
  let map = null, layer = null, mapEl = null;

  function ensureMap() {
    if (!mapEl) {
      mapEl = document.createElement('div'); mapEl.id = 'map';
    }
    if (!map) {
      map = L.map(mapEl, { zoomControl: false, attributionControl: true, worldCopyJump: true });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      map.attributionControl.setPrefix(false);
      layer = L.layerGroup().addTo(map);
    }
    return mapEl;
  }

  function render() {
    back.hidden = state.step === 'countries';
    body.innerHTML = '';
    if (state.step === 'countries') return renderCountries();
    if (state.step === 'country') return renderCountryBig();
    const box = ensureMap();
    body.appendChild(box);
    const chips = document.createElement('div'); chips.className = 'chips';
    body.appendChild(chips);
    const card = document.createElement('div'); card.className = 'card'; card.id = 'card';
    body.appendChild(card);
    requestAnimationFrame(() => map.invalidateSize());
    layer.clearLayers();
    if (state.step === 'country') renderCountry(chips); else renderCity(chips);
  }

  function renderCountries() {
    title.textContent = T('Где купить');
    // страны растянуты на весь экран: флаг слева, большая карта, название прямо на карте; «представитель» — в самом низу
    const d = document.createElement('div'); d.className = 'scrolly clist';
    d.innerHTML = '<div class="countries">' + COUNTRIES.map((c, i) => {
      const n = c.cities.length;
      return `<button class="cbtn" data-i="${i}"><span class="flag">${c.flag}</span><span class="cmap">${miniMap(c)}<span class="cname">${esc(T(c.name))}<small>${CITIES(n)}</small></span></span></button>`;
    }).join('') + '</div>' +
      `<div class="partner-box"><p>${T('Нет вашей страны или города?')}</p>
       <a class="act go" href="${wa(OFFICE_WA, PARTNER_TEXT)}" target="_blank" rel="noopener" onclick="if(this.getAttribute('href')==='#')return false">${T('Станьте нашим представителем')}</a></div>`;
    d.querySelectorAll('.cbtn').forEach(b => b.onclick = () => {
      state = { step: 'country', country: COUNTRIES[+b.dataset.i], city: null }; render();
    });
    body.appendChild(d);
  }

  // большая карта страны на весь экран: контур + города с точками продаж; нажал на город — открылась карта города
  function renderCountryBig() {
    const C = state.country, S = typeof SHAPES !== 'undefined' && SHAPES[C.id];
    title.textContent = C.flag + ' ' + T(C.name);
    const xy = ([lat, lon]) => [((S.wrap && lon < 0 ? lon + 360 : lon) * S.cs - S.minx) * S.k + S.ox, (-lat - S.miny) * S.k + S.oy];
    const d = document.createElement('div'); d.className = 'bigc';
    d.innerHTML = `<div class="bview"><div class="bigmap"><svg viewBox="0 0 160 100" aria-hidden="true"><path d="${S.d}"/></svg>` +
      C.cities.map((city, i) => { const [x, y] = xy(city.c), on = city.pts.length > 0;
        return `<button type="button" class="bcity${on ? '' : ' off'}${x > 135 || city.lbl === 'l' ? ' left' : ''}" data-i="${i}" style="left:${(x / 1.6).toFixed(2)}%;top:${y.toFixed(2)}%"><i></i><span>${esc(T(city.name))}</span></button>`; }).join('') +
      `</div></div><p class="bhint">${T('Выберите город · карту можно увеличить двумя пальцами')}</p>
      <button type="button" class="chip partner bpart">${T('+ Нет моего города')}</button><div class="card" id="card"></div>`;
    d.querySelectorAll('.bcity').forEach(b => b.onclick = () => openCity(C.cities[+b.dataset.i]));
    d.querySelector('.bpart').onclick = () => showPartner('');
    body.appendChild(d);
    zoomable(d.querySelector('.bview'), d.querySelector('.bigmap'));
  }

  // карта страны увеличивается: двумя пальцами / колёсиком, одним пальцем двигается; точки и названия городов остаются того же размера
  function zoomable(view, el) {
    let z = 1, tx = 0, ty = 0, moved = false, pinch = null, drag = null;
    const pts = new Map(), ZMAX = 8;
    const apply = () => {
      const lx = el.offsetWidth * (z - 1) / 2 + 30 * (z > 1), ly = el.offsetHeight * (z - 1) / 2 + 30 * (z > 1);
      tx = Math.max(-lx, Math.min(lx, tx)); ty = Math.max(-ly, Math.min(ly, ty));
      el.style.transform = `translate(${tx}px,${ty}px) scale(${z})`; el.style.setProperty('--s', z);
      view.classList.toggle('zoomed', z > 1.01);
    };
    // точка экрана (px,py) остаётся под пальцем при смене увеличения
    const zoomAt = (nz, px, py) => {
      nz = Math.max(1, Math.min(ZMAX, nz));
      const r = view.getBoundingClientRect(), cx = px - r.left - r.width / 2, cy = py - r.top - r.height / 2;
      tx = cx - (cx - tx) * nz / z; ty = cy - (cy - ty) * nz / z; z = nz;
      if (z === 1) tx = ty = 0;
      apply();
    };
    view.addEventListener('wheel', e => { e.preventDefault(); zoomAt(z * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY); }, { passive: false });
    view.addEventListener('pointerdown', e => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) { moved = false; drag = { x: e.clientX, y: e.clientY, tx, ty }; pinch = null; }
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; drag = null; moved = true;
      }
    });
    view.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pts.size >= 2) {
        const [a, b] = [...pts.values()], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        tx += mx - pinch.mx; ty += my - pinch.my; pinch.mx = mx; pinch.my = my;
        zoomAt(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, mx, my);
      } else if (drag && z > 1.01) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!moved && Math.hypot(dx, dy) < 6) return;
        moved = true; tx = drag.tx + dx; ty = drag.ty + dy; apply();
      }
    });
    const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) drag = null;
      else if (pts.size === 1) { const [p] = [...pts.values()]; drag = { x: p.x, y: p.y, tx, ty }; } };
    view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up); view.addEventListener('pointerleave', up);
    // двигали или увеличивали — это не нажатие на город
    view.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    // двойное нажатие — увеличить в этом месте (на компьютере удобно)
    view.addEventListener('dblclick', e => zoomAt(z < ZMAX - .1 ? z * 2 : 1, e.clientX, e.clientY));
    apply();
  }

  // маленькая карта страны справа: контур + точки городов, где продаётся
  function miniMap(c) {
    const S = typeof SHAPES !== 'undefined' && SHAPES[c.id]; if (!S) return '';
    const xy = ([lat, lon]) => [((S.wrap && lon < 0 ? lon + 360 : lon) * S.cs - S.minx) * S.k + S.ox, (-lat - S.miny) * S.k + S.oy];
    const dots = c.cities.map(city => { const [x, y] = xy(city.c), on = city.pts.length > 0;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${on ? 4 : 3}" class="${on ? 'on' : 'off'}"/>`; }).join('');
    return `<svg class="mini" viewBox="0 0 160 100" aria-hidden="true"><path d="${S.d}"/>${dots}</svg>`;
  }

  function renderCountry(chips) {
    const C = state.country;
    title.textContent = C.flag + ' ' + T(C.name);
    const bounds = [];
    C.cities.forEach(city => {
      const empty = !city.pts.length;
      const m = L.marker(city.c, { icon: L.divIcon({ className: '', html: `<span class="city-pin${empty ? ' empty' : ''}">${esc(T(city.name))}</span>`, iconSize: [0, 0] }) });
      m.on('click', () => openCity(city));
      m.addTo(layer); bounds.push(city.c);
      const ch = document.createElement('button'); ch.className = 'chip'; ch.textContent = T(city.name);
      ch.onclick = () => openCity(city); chips.appendChild(ch);
    });
    const p = document.createElement('button'); p.className = 'chip partner'; p.textContent = T('+ Нет моего города');
    p.onclick = () => showPartner(''); chips.appendChild(p);
    setTimeout(() => {
      map.invalidateSize();
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [50, 50], maxZoom: C.z + 2, animate: false });
      else map.setView(C.c, C.z, { animate: false });
    }, 30);
  }

  function openCity(city) { state = { step: 'city', country: state.country, city }; render(); }

  function renderCity(chips) {
    const C = state.country, city = state.city;
    title.textContent = T(city.name);
    const markers = [];
    city.pts.forEach((pt, i) => {
      const m = L.marker(pt.c, { icon: L.divIcon({ className: '', html: '<div class="shop-pin"></div>', iconSize: [0, 0] }) });
      m.on('click', () => { markers.forEach(x => x.getElement() && x.getElement().firstChild.classList.remove('sel')); m.getElement().firstChild.classList.add('sel'); showShop(pt); });
      m.addTo(layer); markers.push(m);
      const ch = document.createElement('button'); ch.className = 'chip'; ch.textContent = TP(pt.n);
      ch.onclick = () => { map.flyTo(pt.c, 15, { duration: .8 }); m.fire('click'); };
      chips.appendChild(ch);
    });
    const p = document.createElement('button'); p.className = 'chip partner'; p.textContent = T('+ Стать представителем');
    p.onclick = () => showPartner(T(city.name)); chips.appendChild(p);
    setTimeout(() => {
      map.invalidateSize();
      map.setView(C.c, C.z, { animate: false });
      const target = city.pts.length > 1 ? L.latLngBounds(city.pts.map(p => p.c)).pad(0.6) : null;
      if (target) map.flyToBounds(target, { duration: 1.4, maxZoom: 14 });
      else map.flyTo(city.pts.length ? city.pts[0].c : city.c, city.z + (city.pts.length ? 2 : 0), { duration: 1.4 });
      if (!city.pts.length) setTimeout(() => showPartner(T(city.name), true), 900);
    }, 30);
  }

  function cardEl() { return document.getElementById('card'); }
  function openCard(html) {
    const c = cardEl(); c.innerHTML = `<button class="ib x" aria-label="${T('Закрыть карточку')}">✕</button>` + html;
    c.querySelector('.x').onclick = () => c.classList.remove('open');
    requestAnimationFrame(() => c.classList.add('open'));
  }

  function showShop(pt) {
    const C = state.country;
    openCard(`
      <h3>${esc(TP(pt.n))}${pt.ex ? `<span class="ex">${T('пример')}</span>` : ''}</h3>
      <p>📍 ${esc(TP(pt.a))}, ${esc(T(state.city.name))}</p>
      <p>🕘 ${esc(TP(pt.h))}</p>
      <div class="acts">
        <a class="act wa" style="grid-column:1/-1" href="${wa(pt.phone, BUY_TEXT)}" target="_blank" rel="noopener" onclick="if(this.getAttribute('href')==='#')return false">${T('Написать в WhatsApp')}</a>
        <a class="act go" href="${route(C.gis, pt.c)}" target="_blank" rel="noopener" onclick="if(this.getAttribute('href')==='#')return false">${T('🧭 Как дойти — 2ГИС')}</a>
      </div>`);
  }

  function showPartner(cityName, noShops) {
    openCard(`<div class="partner-box">
      <h3 style="margin-right:0">${noShops ? T('В городе {c} пока нет точек продаж').replace('{c}', esc(cityName)) : T('Нет точки в вашем городе?')}</h3>
      <p>${T('Станьте нашим представителем — напишите нам, всё расскажем.')}</p>
      <div class="acts"><a class="act go" href="${wa(OFFICE_WA, PARTNER_TEXT + (cityName || '…'))}" target="_blank" rel="noopener" onclick="if(this.getAttribute('href')==='#')return false">${T('Написать в WhatsApp')}</a></div>
    </div>`);
  }

  function goBack() {
    const c = cardEl();
    if (c && c.classList.contains('open') && !(state.step === 'city' && !state.city.pts.length)) { c.classList.remove('open'); return; }
    if (state.step === 'city') state = { step: 'country', country: state.country, city: null };
    else state = { step: 'countries', country: null, city: null };
    render();
  }

  function open() { state = { step: 'countries', country: null, city: null }; render(); wrap.classList.add('full'); document.body.classList.add('mix-on'); sheet.classList.add('open'); }
  function close() { sheet.classList.remove('open'); document.body.classList.remove('mix-on'); }

  document.getElementById('buyBtn').onclick = open;
  document.getElementById('shClose').onclick = close;
  back.onclick = goBack;
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

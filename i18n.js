// Языки (русский / казахский / английский) и тема (тёмная / светлая).
// Выбор запоминается в браузере. Ключ перевода — русский текст; если перевода нет, показывается русский.
(function () {
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  let L = get('gv-lang'); if (!['ru', 'kk', 'en'].includes(L)) L = 'ru';
  // светлая тема отключена по решению владельца (22.11); вернуть — LIGHT = true
  const LIGHT = false;
  let TH = get('gv-theme'); if (!LIGHT || !['dark', 'light'].includes(TH)) TH = 'dark';
  const html = document.documentElement;
  html.lang = L; html.dataset.theme = TH;

  // [казахский, английский]
  const D = {
    // главный экран
    'Green Vitamin — сок ростков пшеницы': ['Green Vitamin — бидай өскіндерінің шырыны', 'Green Vitamin — wheatgrass juice'],
    'Сок ростков пшеницы · с 2018 года': ['Бидай өскіндерінің шырыны · 2018 жылдан бері', 'Wheatgrass juice · since 2018'],
    'Состав': ['Құрамы', 'Nutrition'],
    'Купить': ['Сатып алу', 'Buy'],
    'Всё о продукте': ['Өнім туралы бәрі', 'About the product'],
    'Green Vitamin упаковка': ['Green Vitamin қаптамасы', 'Green Vitamin package'],
    'Тёмная тема': ['Қараңғы тақырып', 'Dark theme'],
    'Светлая тема': ['Ашық тақырып', 'Light theme'],
    'Язык': ['Тіл', 'Language'],
    'Закрыть': ['Жабу', 'Close'],
    'Назад': ['Артқа', 'Back'],
    // состав
    'Состав на 100&nbsp;г': ['100&nbsp;г құрамы', 'Per 100&nbsp;g'],
    'Пищевая ценность': ['Тағамдық құндылығы', 'Nutrition facts'],
    'Белки': ['Ақуыздар', 'Protein'],
    'Жиры': ['Майлар', 'Fat'],
    'Углеводы': ['Көмірсулар', 'Carbohydrates'],
    'Энергия': ['Энергия', 'Energy'],
    'Витамины': ['Дәрумендер', 'Vitamins'],
    'B1 (тиамин)': ['B1 (тиамин)', 'B1 (thiamine)'],
    'B2 (рибофлавин)': ['B2 (рибофлавин)', 'B2 (riboflavin)'],
    'B3 / PP (ниацин)': ['B3 / PP (ниацин)', 'B3 / PP (niacin)'],
    'B5 (пантотеновая к-та)': ['B5 (пантотен қышқылы)', 'B5 (pantothenic acid)'],
    'B6 (пиридоксин)': ['B6 (пиридоксин)', 'B6 (pyridoxine)'],
    'Минералы': ['Минералдар', 'Minerals'],
    'Фосфор': ['Фосфор', 'Phosphorus'],
    'Железо': ['Темір', 'Iron'],
    'Биофлавоноиды': ['Биофлавоноидтар', 'Bioflavonoids'],
    'Рутин': ['Рутин', 'Rutin'],
    'Кверцетин': ['Кверцетин', 'Quercetin'],
    'Разведите пальцы — чтобы увеличить': ['Үлкейту үшін саусақтарды ажыратыңыз', 'Spread two fingers to zoom in'],
    // страницы
    'Награды': ['Марапаттар', 'Awards'],
    'Как принимать': ['Қалай қабылдау керек', 'How to use'],
    'Сертификаты': ['Сертификаттар', 'Certificates'],
    'Вопросы': ['Сұрақтар', 'FAQ'],
    'Вопросы и ответы': ['Сұрақтар мен жауаптар', 'Questions and answers'],
    '1 место — FoodExpo Qazaqstan 2026': ['1-орын — FoodExpo Qazaqstan 2026', '1st place — FoodExpo Qazaqstan 2026'],
    'Номинация «Лучший натуральный напиток»': ['«Үздік табиғи сусын» номинациясы', '“Best Natural Drink” category'],
    'Достаньте': ['Алыңыз', 'Take out'],
    'Извлеките нужное количество шариков из пакета.': ['Пакеттен қажетті мөлшерде шарикті алыңыз.', 'Take the number of balls you need out of the bag.'],
    'Приготовьте': ['Дайындаңыз', 'Prepare'],
    'Положите 2 шарика в стакан и залейте водой — 200 мл.': ['Стаканға 2 шарик салып, 200 мл су құйыңыз.', 'Put 2 balls in a glass and pour in 200 ml of water.'],
    'Наслаждайтесь': ['Ләззат алыңыз', 'Enjoy'],
    'Перемешайте и выпейте через 15 минут.': ['Араластырып, 15 минуттан кейін ішіңіз.', 'Stir and drink after 15 minutes.'],
    '❗ Не растворять в горячей воде.': ['❗ Ыстық суда ерітуге болмайды.', '❗ Do not dissolve in hot water.'],
    '🕒 Можно пить в любое время: до или после еды.': ['🕒 Кез келген уақытта ішуге болады: тамаққа дейін немесе кейін.', '🕒 Can be taken at any time: before or after meals.'],
    '❄️ Упаковка хранится в морозильнике.': ['❄️ Қаптаманы мұздатқышта сақтаңыз.', '❄️ Keep the package in the freezer.'],
    'Рецепты': ['Рецепттер', 'Recipes'],
    'Скоро здесь будут рецепты': ['Рецепттер жақында осында болады', 'Recipes coming soon'],
    'Где купить?': ['Қайдан сатып алуға болады?', 'Where to buy?'],
    'Нажмите «Купить» на главном экране — выберите страну и город, на карте будут точки продаж.': ['Басты беттегі «Сатып алу» батырмасын басыңыз — елді және қаланы таңдаңыз, картада сату нүктелері көрсетіледі.', 'Tap “Buy” on the main screen, choose your country and city, and the map will show the stores.'],
    'Как хранить?': ['Қалай сақтау керек?', 'How should it be stored?'],
    'Сколько пить в день?': ['Күніне қанша ішу керек?', 'How much should I drink per day?'],
    'Можно ли детям?': ['Балаларға беруге бола ма?', 'Is it suitable for children?'],
    'Какой срок годности?': ['Жарамдылық мерзімі қандай?', 'What is the shelf life?'],
    'Ответ скоро появится.': ['Жауап жақында пайда болады.', 'The answer is coming soon.'],
    // документы
    'Диплом победителя «Лучшие продукты питания» — Актобе, 2026': ['«Үздік азық-түлік өнімдері» жеңімпаз дипломы — Ақтөбе, 2026', 'Winner’s diploma “Best Food Products” — Aktobe, 2026'],
    'Свидетельство на товарный знак № 87803': ['Тауар белгісіне куәлік № 87803', 'Trademark certificate No. 87803'],
    'Протокол испытаний № 2554К — стр. 1': ['Сынақ хаттамасы № 2554К — 1-бет', 'Test report No. 2554K — page 1'],
    'Протокол испытаний № 2554К — стр. 2': ['Сынақ хаттамасы № 2554К — 2-бет', 'Test report No. 2554K — page 2'],
    'Протокол испытаний № 2555К': ['Сынақ хаттамасы № 2555К', 'Test report No. 2555K'],
    'Протокол испытаний № 2556К': ['Сынақ хаттамасы № 2556К', 'Test report No. 2556K'],
    'Сертификат соответствия ISO 22000:2018': ['ISO 22000:2018 сәйкестік сертификаты (орысша)', 'ISO 22000:2018 certificate (Russian)'],
    'Приложение к сертификату ISO 22000': ['ISO 22000 сертификатына қосымша (орысша)', 'Appendix to ISO 22000 certificate (Russian)'],
    'Сәйкестік сертификаты ISO 22000:2018': ['Сәйкестік сертификаты ISO 22000:2018', 'ISO 22000:2018 certificate (Kazakh)'],
    'Сертификат сәйкестігі қосымшасы': ['Сертификат сәйкестігі қосымшасы', 'Appendix to the certificate (Kazakh)'],
    'Certificate of conformity ISO 22000:2018': ['ISO 22000:2018 сертификаты (ағылшынша)', 'Certificate of conformity ISO 22000:2018'],
    'Appendix to the certificate': ['Сертификатқа қосымша (ағылшынша)', 'Appendix to the certificate'],
    // где купить
    'Где купить': ['Қайдан сатып алуға болады', 'Where to buy'],
    'Казахстан': ['Қазақстан', 'Kazakhstan'],
    'Россия': ['Ресей', 'Russia'],
    'ОАЭ': ['БАӘ', 'UAE'],
    'Алматы': ['Алматы', 'Almaty'],
    'Астана': ['Астана', 'Astana'],
    'Актобе': ['Ақтөбе', 'Aktobe'],
    'Шымкент': ['Шымкент', 'Shymkent'],
    'Москва': ['Мәскеу', 'Moscow'],
    'Дубай': ['Дубай', 'Dubai'],
    'Нет вашей страны или города?': ['Еліңіз немесе қалаңыз жоқ па?', 'Your country or city is not listed?'],
    'Станьте нашим представителем': ['Біздің өкіліміз болыңыз', 'Become our partner'],
    'Выберите город · карту можно увеличить двумя пальцами': ['Қаланы таңдаңыз · картаны екі саусақпен үлкейтуге болады', 'Choose a city · zoom the map with two fingers'],
    '+ Нет моего города': ['+ Менің қалам жоқ', '+ My city is not here'],
    '+ Стать представителем': ['+ Өкіл болу', '+ Become a partner'],
    'Закрыть карточку': ['Карточканы жабу', 'Close card'],
    'пример': ['үлгі', 'sample'],
    'Написать в WhatsApp': ['WhatsApp-қа жазу', 'Message on WhatsApp'],
    '🧭 Как дойти — 2ГИС': ['🧭 Қалай жетуге болады — 2ГИС', '🧭 Directions — 2GIS'],
    'Нет точки в вашем городе?': ['Қалаңызда сату нүктесі жоқ па?', 'No store in your city?'],
    'Станьте нашим представителем — напишите нам, всё расскажем.': ['Біздің өкіліміз болыңыз — бізге жазыңыз, бәрін айтып береміз.', 'Become our partner: message us and we will tell you everything.'],
    'В городе {c} пока нет точек продаж': ['{c} қаласында әзірге сату нүктелері жоқ', 'There are no stores in {c} yet'],
    'Здравствуйте! Хочу приобрести Витграсс.': ['Сәлеметсіз бе! Витграсс сатып алғым келеді.', 'Hello! I would like to buy Vitgrass.'],
    'Здравствуйте! Хочу стать представителем Витграсс в городе ': ['Сәлеметсіз бе! Витграсс өкілі болғым келеді, қала: ', 'Hello! I would like to become a Vitgrass partner in '],
    'Точка-пример': ['Үлгі нүкте', 'Sample store'],
    'Адрес будет здесь': ['Мекенжай осында болады', 'Address coming soon'],
    'Ежедневно': ['Күн сайын', 'Daily'],
    'Пн–Сб': ['Дс–Сн', 'Mon–Sat'],
  };
  const T = s => L === 'ru' ? s : ((D[s] || [])[L === 'kk' ? 0 : 1] || s);
  // для строк с вкраплениями (адреса-примеры, часы работы): заменяем известные куски
  const TP = s => { if (L === 'ru') return s; let r = String(s); for (const k of ['Точка-пример', 'Адрес будет здесь', 'Ежедневно', 'Пн–Сб']) r = r.split(k).join(T(k)); return r; };
  // «4 города»
  const CITIES = n => L === 'kk' ? n + ' қала' : L === 'en' ? n + (n === 1 ? ' city' : ' cities') :
    n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'город' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'города' : 'городов');
  // числа и единицы в составе: по-английски точка вместо запятой и латинские единицы
  const UNIT = s => L !== 'en' ? s : s.replace(/(\d),(\d)/g, '$1.$2').replace(/ккал/g, 'kcal').replace(/кДж/g, 'kJ').replace(/мг/g, 'mg').replace(/(\d) г\b|(\d) г$/g, (m, a, b) => (a || b) + ' g');

  window.LANG = L; window.THEME = TH; window.T = T; window.TP = TP; window.CITIES = CITIES; window.UNIT = UNIT;

  // переводит надписи в самой странице (data-t — текст, data-t-alt / data-t-aria — подписи)
  window.i18nApply = root => {
    (root || document).querySelectorAll('[data-t]').forEach(e => { e.innerHTML = T(e.dataset.t); });
    (root || document).querySelectorAll('[data-t-alt]').forEach(e => { e.alt = T(e.dataset.tAlt); });
    (root || document).querySelectorAll('[data-t-aria]').forEach(e => { e.setAttribute('aria-label', T(e.dataset.tAria)); });
  };

  // переключатель вверху справа: RU · KZ · EN и ☀/☾
  window.i18nControls = () => {
    const box = document.createElement('div'); box.className = 'prefs';
    box.innerHTML = '<div class="langs" role="group" aria-label="' + T('Язык') + '">' +
      [['ru', 'RU'], ['kk', 'KZ'], ['en', 'EN']].map(([v, n]) => `<button type="button" data-l="${v}"${v === L ? ' class="on" aria-current="true"' : ''}>${n}</button>`).join('') +
      '</div><button type="button" class="themeb" aria-label=""></button>';
    const tb = box.querySelector('.themeb');
    const upd = () => { tb.textContent = html.dataset.theme === 'light' ? '☾' : '☀'; tb.setAttribute('aria-label', T(html.dataset.theme === 'light' ? 'Тёмная тема' : 'Светлая тема'));
      const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = html.dataset.theme === 'light' ? '#f3f6ec' : '#05070a'; };
    tb.onclick = () => { html.dataset.theme = html.dataset.theme === 'light' ? 'dark' : 'light'; put('gv-theme', html.dataset.theme); window.THEME = html.dataset.theme; upd();
      dispatchEvent(new Event('themechange')); };
    box.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { if (b.dataset.l === L) return; put('gv-lang', b.dataset.l); location.reload(); });
    if (!LIGHT) tb.remove(); else upd();
    document.body.appendChild(box);
  };
})();

// мышью на компьютере браузер не перетаскивает картинки (упаковка, дипломы, сертификаты) — их можно крутить
document.addEventListener('dragstart', e => { if (e.target && e.target.tagName === 'IMG') e.preventDefault(); });

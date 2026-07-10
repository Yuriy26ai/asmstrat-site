/* ============================================================
   ASM Strategy — всплывающая форма обратной связи
   Подключение (одна строка перед </body>):
     <script src="form-modal.js" defer></script>        — на главной
     <script src="../form-modal.js" defer></script>     — на подстраницах
   Скрипт сам добавляет плавающую кнопку, модальное окно
   и кнопку «Оставить заявку» в секцию контактов.
   ============================================================ */
(function () {
  'use strict';

  /* Способ отправки заявок (в порядке приоритета):
     1) Свой сервер (server/send.php) — впиши URL в DEFAULT_ENDPOINT;
     2) Web3Forms (https://web3forms.com) — впиши Access Key в WEB3FORMS_KEY.
     Пока ничего не настроено — форма покажет прямые контакты. */
  var DEFAULT_ENDPOINT = 'REPLACE_WITH_TIMEWEB_URL/send.php';
  var WEB3FORMS_KEY = '5e4f25bc-2870-480e-a408-3f05cd577027';

  /* URL страницы политики — вычисляем от расположения самого скрипта,
     чтобы работало и на главной, и на подстраницах */
  var PRIVACY_URL = (function () {
    var s = document.currentScript;
    return s ? s.src.replace(/form-modal\.js.*$/, 'privacy/') : 'privacy/';
  })();

  /* ---------- Стили ---------- */
  var css = ''
    + '.lf-fab{position:fixed;right:22px;bottom:22px;z-index:80;display:inline-flex;align-items:center;gap:9px;'
    + 'background:#1D4D7A;color:#fff;border:0;border-radius:999px;padding:14px 22px;font:600 15px/1 Inter,system-ui,sans-serif;'
    + 'cursor:pointer;box-shadow:0 10px 28px rgba(29,77,122,.35);transition:transform .2s,background .2s;}'
    + '.lf-fab:hover{background:#163C5F;transform:translateY(-2px);}'
    + '.lf-fab svg{width:17px;height:17px;flex:none;}'
    + '@media(max-width:560px){.lf-fab{right:14px;bottom:14px;padding:13px 18px;font-size:14px;}}'
    + '.lf-overlay{position:fixed;inset:0;z-index:90;background:rgba(12,27,42,.55);backdrop-filter:blur(3px);'
    + 'display:none;align-items:center;justify-content:center;padding:20px;}'
    + '.lf-overlay.open{display:flex;}'
    + '.lf-card{background:#fff;width:100%;max-width:440px;border-radius:8px;padding:34px 32px 30px;position:relative;'
    + 'font-family:Inter,system-ui,sans-serif;max-height:92vh;overflow-y:auto;box-shadow:0 30px 80px rgba(12,27,42,.35);}'
    + '@media(max-width:560px){.lf-card{padding:26px 20px 22px;}}'
    + '.lf-close{position:absolute;top:14px;right:14px;width:34px;height:34px;border:0;background:none;cursor:pointer;'
    + 'font-size:22px;line-height:1;color:#697585;border-radius:4px;}'
    + '.lf-close:hover{color:#0C1B2A;background:#F4F5F3;}'
    + '.lf-eyebrow{font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#1D4D7A;margin:0 0 10px;}'
    + '.lf-title{font-family:Newsreader,Georgia,serif;font-weight:400;font-size:26px;color:#0C1B2A;margin:0 0 8px;letter-spacing:-.01em;}'
    + '.lf-sub{font-size:14.5px;color:#697585;margin:0 0 22px;line-height:1.55;}'
    + '.lf-field{margin-bottom:14px;}'
    + '.lf-label{display:block;font-size:13px;font-weight:600;color:#3A4654;margin-bottom:6px;}'
    + '.lf-label span{color:#697585;font-weight:400;}'
    + '.lf-input{width:100%;box-sizing:border-box;border:1px solid rgba(12,27,42,.18);border-radius:4px;padding:12px 14px;'
    + 'font:400 16px/1.4 Inter,system-ui,sans-serif;color:#0C1B2A;background:#fff;transition:border-color .2s;}'
    + '.lf-input:focus{outline:none;border-color:#1D4D7A;box-shadow:0 0 0 3px rgba(29,77,122,.12);}'
    + '.lf-input.err{border-color:#C0392B;}'
    + '.lf-consent{display:flex;gap:10px;align-items:flex-start;margin:16px 0 18px;font-size:12.5px;color:#697585;line-height:1.5;}'
    + '.lf-consent input{margin-top:2px;accent-color:#1D4D7A;width:16px;height:16px;flex:none;}'
    + '.lf-submit{width:100%;border:0;border-radius:4px;background:#1D4D7A;color:#fff;padding:15px;cursor:pointer;'
    + 'font:600 16px/1 Inter,system-ui,sans-serif;transition:background .2s;}'
    + '.lf-submit:hover{background:#163C5F;}'
    + '.lf-submit[disabled]{opacity:.6;cursor:wait;}'
    + '.lf-msg{margin:14px 0 0;font-size:14px;line-height:1.5;display:none;}'
    + '.lf-msg.err{display:block;color:#C0392B;}'
    + '.lf-done{display:none;text-align:center;padding:26px 0 10px;}'
    + '.lf-done .lf-check{width:56px;height:56px;border-radius:50%;background:#1D4D7A;margin:0 auto 18px;position:relative;}'
    + '.lf-done .lf-check::after{content:"";position:absolute;left:16px;top:18px;width:22px;height:12px;'
    + 'border-left:3px solid #fff;border-bottom:3px solid #fff;transform:rotate(-45deg);}'
    + '.lf-done h3{font-family:Newsreader,Georgia,serif;font-weight:400;font-size:24px;color:#0C1B2A;margin:0 0 8px;}'
    + '.lf-done p{font-size:14.5px;color:#697585;margin:0;line-height:1.6;}'
    + '.lf-hp{position:absolute;left:-9999px;top:-9999px;opacity:0;height:0;overflow:hidden;}'
    + '.lf-cta-inline{display:inline-flex;align-items:center;gap:9px;font:600 16px/1 Inter,system-ui,sans-serif;'
    + 'background:#fff;color:#0C1B2A;border:0;border-radius:4px;padding:15px 30px;cursor:pointer;margin-bottom:34px;transition:transform .2s;}'
    + '.lf-cta-inline:hover{transform:translateY(-1px);}'
    + 'body.lf-lock{overflow:hidden;}'
    /* exit-intent попап */
    + '.lf-exit .lf-card{max-width:480px;text-align:center;padding:40px 36px 34px;}'
    + '@media(max-width:560px){.lf-exit .lf-card{padding:28px 20px 24px;}}'
    + '.lf-exit .lf-title{font-size:28px;}'
    + '.lf-exit .lf-sub{margin-bottom:24px;}'
    + '.lf-exit-gauge{width:120px;margin:0 auto 14px;display:block;}'
    + '.lf-exit-cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}'
    + '.lf-exit-go{display:inline-flex;align-items:center;gap:8px;background:#1D4D7A;color:#fff;border:0;border-radius:4px;'
    + 'padding:15px 28px;font:600 16px/1 Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none;transition:background .2s,transform .2s;}'
    + '.lf-exit-go:hover{background:#163C5F;transform:translateY(-1px);}'
    + '.lf-exit-no{background:none;border:1px solid rgba(12,27,42,.18);border-radius:4px;color:#3A4654;'
    + 'padding:15px 22px;font:600 15px/1 Inter,system-ui,sans-serif;cursor:pointer;}'
    + '.lf-exit-no:hover{border-color:#1D4D7A;color:#1D4D7A;}'
    + '.lf-exit-note{font-size:12px;color:#697585;margin-top:16px;}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- Разметка модалки ---------- */
  var overlay = document.createElement('div');
  overlay.className = 'lf-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Форма обратной связи');
  overlay.innerHTML = ''
    + '<div class="lf-card">'
    + '  <button type="button" class="lf-close" aria-label="Закрыть">×</button>'
    + '  <form class="lf-form" novalidate>'
    + '    <p class="lf-eyebrow">Обратная связь</p>'
    + '    <h3 class="lf-title">Оставьте заявку</h3>'
    + '    <p class="lf-sub">Перезвоним, ответим на вопросы и договоримся о бесплатной диагностической встрече.</p>'
    + '    <div class="lf-field"><label class="lf-label">Имя</label>'
    + '      <input class="lf-input" name="name" type="text" autocomplete="name" maxlength="120" required></div>'
    + '    <div class="lf-field"><label class="lf-label">Телефон</label>'
    + '      <input class="lf-input" name="phone" type="tel" autocomplete="tel" placeholder="+7 ___ ___-__-__" maxlength="40" required></div>'
    + '    <div class="lf-field"><label class="lf-label">Email <span>(если удобнее письмом)</span></label>'
    + '      <input class="lf-input" name="email" type="email" autocomplete="email" maxlength="120"></div>'
    + '    <div class="lf-hp" aria-hidden="true"><input name="website" type="text" tabindex="-1" autocomplete="off"></div>'
    + '    <label class="lf-consent"><input name="consent" type="checkbox" required>'
    + '      <span>Соглашаюсь на <a href="__PRIVACY__" target="_blank" rel="noopener" style="color:#1D4D7A;">обработку персональных данных</a> для связи по моей заявке</span></label>'
    + '    <button type="submit" class="lf-submit">Отправить заявку</button>'
    + '    <p class="lf-msg"></p>'
    + '  </form>'
    + '  <div class="lf-done">'
    + '    <div class="lf-check"></div>'
    + '    <h3>Заявка отправлена</h3>'
    + '    <p>Спасибо! Свяжемся с вами в ближайшее время.<br>Если срочно — телефон <a href="tel:+79777000755" style="color:#1D4D7A;text-decoration:none;font-weight:600;">+7 977 700-07-55</a></p>'
    + '  </div>'
    + '</div>';
  overlay.innerHTML = overlay.innerHTML.replace('__PRIVACY__', PRIVACY_URL);
  document.body.appendChild(overlay);

  /* ---------- Плавающая кнопка ---------- */
  var fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'lf-fab';
  fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>Оставить заявку';
  document.body.appendChild(fab);

  /* ---------- Кнопка в секции контактов ---------- */
  var clinks = document.querySelector('.contact .clinks');
  if (clinks) {
    var inlineBtn = document.createElement('button');
    inlineBtn.type = 'button';
    inlineBtn.className = 'lf-cta-inline lf-open';
    inlineBtn.textContent = 'Оставить заявку →';
    clinks.parentNode.insertBefore(inlineBtn, clinks);
  }

  /* ---------- Логика ---------- */
  var form = overlay.querySelector('.lf-form');
  var done = overlay.querySelector('.lf-done');
  var msg = overlay.querySelector('.lf-msg');
  var submitBtn = overlay.querySelector('.lf-submit');
  var lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    overlay.classList.add('open');
    document.body.classList.add('lf-lock');
    form.style.display = '';
    done.style.display = 'none';
    msg.className = 'lf-msg';
    setTimeout(function () { var f = form.querySelector('[name=name]'); if (f) f.focus(); }, 60);
  }
  function close() {
    overlay.classList.remove('open');
    document.body.classList.remove('lf-lock');
    if (lastFocus) lastFocus.focus();
  }

  /* ---------- Режим «чек-лист»: email обязателен, после отправки — скачивание ---------- */
  var checklistReq = null;
  var tEyebrow = overlay.querySelector('.lf-eyebrow'),
      tTitle = overlay.querySelector('.lf-title'),
      tSub = overlay.querySelector('.lf-sub'),
      tEmailNote = overlay.querySelector('.lf-label span'),
      tDoneTitle = done.querySelector('h3'),
      tDoneText = done.querySelector('p');
  var DEFAULTS = {
    eyebrow: tEyebrow.textContent, title: tTitle.textContent, sub: tSub.textContent,
    emailNote: tEmailNote.textContent, doneTitle: tDoneTitle.textContent, doneHtml: tDoneText.innerHTML
  };
  function setChecklistMode(req) {
    checklistReq = req;
    if (req) {
      tEyebrow.textContent = 'Чек-лист · PDF · бесплатно';
      tTitle.textContent = req.title;
      tSub.textContent = 'Оставьте контакты — скачивание откроется сразу после отправки.';
      tEmailNote.textContent = '(обязательно — для чек-листа)';
      window.LEAD_FORM_EXTRA = { 'Чек-лист': req.title };
    } else {
      tEyebrow.textContent = DEFAULTS.eyebrow; tTitle.textContent = DEFAULTS.title; tSub.textContent = DEFAULTS.sub;
      tEmailNote.textContent = DEFAULTS.emailNote;
      tDoneTitle.textContent = DEFAULTS.doneTitle; tDoneText.innerHTML = DEFAULTS.doneHtml;
      var oldDl = done.querySelector('.lf-dl'); if (oldDl) oldDl.remove();
      if (window.LEAD_FORM_EXTRA && window.LEAD_FORM_EXTRA['Чек-лист']) window.LEAD_FORM_EXTRA = null;
    }
  }

  fab.addEventListener('click', function () { setChecklistMode(null); open(); });
  /* Главные CTA-кнопки («Получить диагностику», «Записаться…») открывают форму, а не скроллят вниз */
  document.addEventListener('click', function (e) {
    var cta = e.target.closest && e.target.closest('a.btn-primary[href*="#contacts"]');
    if (!cta) return;
    e.preventDefault();
    setChecklistMode(null);
    open();
  });
  window.openLeadForm = open; /* публичный вызов формы (используется тестом и калькулятором) */
  window.requestChecklist = function (url, title) { /* вызов с карточек чек-листов */
    setChecklistMode({ url: url, title: title });
    open();
  };
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.lf-open')) open();
  });
  overlay.querySelector('.lf-close').addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.className = 'lf-msg';

    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    var email = form.email.value.trim();
    var ok = true;

    form.name.classList.toggle('err', !name); if (!name) ok = false;
    var digits = phone.replace(/\D/g, '');
    form.phone.classList.toggle('err', digits.length < 10); if (digits.length < 10) ok = false;
    if (checklistReq && !email) { form.email.classList.add('err'); ok = false; }
    else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { form.email.classList.add('err'); ok = false; }
    else form.email.classList.remove('err');
    if (!form.consent.checked) {
      msg.textContent = 'Отметьте согласие на обработку персональных данных.';
      msg.className = 'lf-msg err'; ok = false;
    }
    if (!ok) return;

    /* honeypot: скрытое поле заполняют только боты — тихо изображаем успех */
    if (form.website.value) {
      form.style.display = 'none';
      done.style.display = 'block';
      return;
    }

    var ENDPOINT = window.LEAD_FORM_ENDPOINT || DEFAULT_ENDPOINT;
    var useOwn = ENDPOINT.indexOf('REPLACE_WITH') !== 0;
    var useW3 = !useOwn && WEB3FORMS_KEY.indexOf('REPLACE_WITH') !== 0;
    if (!useOwn && !useW3) {
      msg.innerHTML = 'Форма временно недоступна. Напишите нам: <a href="mailto:sales@asmstrat.com" style="color:#1D4D7A;font-weight:600;">sales@asmstrat.com</a> или Telegram <a href="https://t.me/asmstrat" target="_blank" rel="noopener" style="color:#1D4D7A;font-weight:600;">@asmstrat</a>';
      msg.className = 'lf-msg err';
      return;
    }

    var req;
    if (useOwn) {
      var data = new FormData();
      data.append('name', name);
      data.append('phone', phone);
      data.append('email', email);
      data.append('page', location.pathname);
      if (window.LEAD_FORM_EXTRA) {
        for (var k2 in window.LEAD_FORM_EXTRA) { data.append(k2, window.LEAD_FORM_EXTRA[k2]); }
      }
      req = fetch(ENDPOINT, { method: 'POST', body: data });
    } else {
      var payload = {
        access_key: WEB3FORMS_KEY,
        subject: 'Заявка с сайта ASM Strategy',
        from_name: 'Форма на сайте ASM Strategy',
        'Имя': name,
        'Телефон': phone,
        'Страница': location.pathname
      };
      if (email) { payload.email = email; } /* email клиента станет Reply-To */
      /* дополнительные данные (например, результаты теста управляемости) */
      if (window.LEAD_FORM_EXTRA) {
        for (var k in window.LEAD_FORM_EXTRA) { payload[k] = window.LEAD_FORM_EXTRA[k]; }
        payload.subject = 'Заявка + результаты теста — ASM Strategy';
      }
      req = fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    submitBtn.disabled = true;
    req
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (r && (r.ok || r.success === true || r.success === 'true')) {
          form.style.display = 'none';
          done.style.display = 'block';
          form.reset();
          try { localStorage.setItem('asm_lead_sent', '1'); } catch (_) {} /* заявка есть — exit-попап больше не нужен */
          if (checklistReq) {
            tDoneTitle.textContent = 'Готово — забирайте!';
            tDoneText.innerHTML = 'Чек-лист «' + checklistReq.title + '» ваш.<br>Если кнопка не сработает — напишите нам, пришлём письмом.';
            var dl = done.querySelector('.lf-dl');
            if (!dl) {
              dl = document.createElement('a');
              dl.className = 'lf-exit-go lf-dl';
              dl.style.marginTop = '18px';
              dl.target = '_blank';
              dl.rel = 'noopener';
              done.appendChild(dl);
            }
            dl.href = checklistReq.url;
            dl.setAttribute('download', '');
            dl.textContent = 'Скачать чек-лист (PDF)';
            try { localStorage.setItem('asm_checklist_done', '1'); } catch (_) {}
            if (window.ym) { try { ym(110362886, 'reachGoal', 'checklist_lead'); } catch (_) {} }
          }
          if (window.ym) { try { ym(110362886, 'reachGoal', 'lead_form_sent'); } catch (_) {} }
        } else { throw new Error((r && r.error) || 'send'); }
      })
      .catch(function () {
        msg.innerHTML = 'Не получилось отправить. Позвоните <a href="tel:+79777000755" style="color:#1D4D7A;font-weight:600;">+7 977 700-07-55</a> или напишите <a href="mailto:sales@asmstrat.com" style="color:#1D4D7A;font-weight:600;">sales@asmstrat.com</a>';
        msg.className = 'lf-msg err';
      })
      .then(function () { submitBtn.disabled = false; });
  });

  /* ============================================================
     Exit-intent: предложение пройти тест управляемости
     Показываем, когда курсор уходит за верх окна (к закрытию вкладки).
     Правила вежливости: не раньше 15 сек на странице, максимум 1 раз,
     повтор не чаще раза в 7 дней, не показываем прошедшим тест
     и отправившим заявку, не перебиваем открытую форму.
     ============================================================ */
  (function () {
    /* на страницах самих инструментов попап не нужен */
    if (/test-upravlyaemosti|cena-operacionki/.test(location.pathname)) return;
    var TEST_URL = PRIVACY_URL.replace('privacy/', 'test-upravlyaemosti/');
    var CALC_URL = PRIVACY_URL.replace('privacy/', 'cena-operacionki/');
    var HUB_URL = PRIVACY_URL.replace('privacy/', 'testy/#materials');
    var WEEK = 7 * 24 * 3600 * 1000;
    var quizDone = false, calcDone = false, checklistDone = false;
    try {
      quizDone = !!localStorage.getItem('asm_quiz_done');
      calcDone = !!localStorage.getItem('asm_calc_done');
      checklistDone = !!localStorage.getItem('asm_checklist_done');
      if (localStorage.getItem('asm_lead_sent')) return;                 /* заявка уже есть */
      if (quizDone && calcDone && checklistDone) return;                 /* всё пройдено */
      if (Date.now() - (+localStorage.getItem('asm_exit_shown') || 0) < WEEK) return;
    } catch (_) {}

    /* цепочка предложений: калькулятор → тест → чек-лист */
    var offer;
    if (!calcDone) {
      offer = { url: CALC_URL, eyebrow: 'Пока вы не ушли — 30 секунд', title: 'Сколько денег съедает ваша операционка?',
        sub: 'Два ползунка — и вы увидите, сколько рублей в год стоит рутина, которую вы тащите на себе.',
        btn: 'Посчитать' };
    } else if (!quizDone) {
      offer = { url: TEST_URL, eyebrow: 'Ещё 2 минуты — и картина полная', title: 'Насколько ваш бизнес управляем без вас?',
        sub: 'Цену операционки вы уже знаете. Теперь пройдите тест из 10 вопросов — он покажет, где именно компания держится лично на вас.',
        btn: 'Пройти тест' };
    } else {
      offer = { url: HUB_URL, eyebrow: 'Напоследок — заберите PDF', title: 'Чек-лист: владелец vs директор',
        sub: 'Где заканчивается ваша работа и начинается работа директора: 8 функций владельца против 7 функций директора. Заберите бесплатно.',
        btn: 'Забрать чек-лист' };
    }

    var armed = false, shown = false;
    var armDelay = /[?&]exitdebug/.test(location.search) ? 300 : 15000; /* exitdebug — для отладки */
    setTimeout(function () { armed = true; }, armDelay);

    var pop = document.createElement('div');
    pop.className = 'lf-overlay lf-exit';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'true');
    pop.setAttribute('aria-label', 'Предложение пройти тест');
    pop.innerHTML = ''
      + '<div class="lf-card">'
      + '  <button type="button" class="lf-close" aria-label="Закрыть">×</button>'
      + '  <svg class="lf-exit-gauge" viewBox="0 0 230 132" aria-hidden="true">'
      + '    <path d="M20 120 A95 95 0 0 1 210 120" fill="none" stroke="#EDF0F2" stroke-width="16" stroke-linecap="round"/>'
      + '    <path d="M20 120 A95 95 0 0 1 115 25" fill="none" stroke="#37A3D7" stroke-width="16" stroke-linecap="round"/>'
      + '    <circle cx="115" cy="120" r="10" fill="#1D4D7A"/>'
      + '    <line x1="115" y1="120" x2="63" y2="60" stroke="#1D4D7A" stroke-width="6" stroke-linecap="round"/>'
      + '  </svg>'
      + '  <p class="lf-eyebrow">' + offer.eyebrow + '</p>'
      + '  <h3 class="lf-title">' + offer.title + '</h3>'
      + '  <p class="lf-sub">' + offer.sub + '</p>'
      + '  <div class="lf-exit-cta">'
      + '    <a class="lf-exit-go" href="' + offer.url + '">' + offer.btn + '</a>'
      + '    <button type="button" class="lf-exit-no">Не сейчас</button>'
      + '  </div>'
      + '  <p class="lf-exit-note">Без регистрации. Результат — сразу на экране.</p>'
      + '</div>';
    document.body.appendChild(pop);

    function hide() {
      pop.classList.remove('open');
      document.body.classList.remove('lf-lock');
    }
    function show() {
      if (shown || !armed) return;
      if (overlay.classList.contains('open')) return; /* открыта форма заявки — не мешаем */
      shown = true;
      try { localStorage.setItem('asm_exit_shown', String(Date.now())); } catch (_) {}
      pop.classList.add('open');
      document.body.classList.add('lf-lock');
      if (window.ym) { try { ym(110362886, 'reachGoal', 'exit_popup_shown'); } catch (_) {} }
    }

    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget && e.clientY <= 0) show(); /* курсор ушёл за верх окна */
    });
    pop.querySelector('.lf-close').addEventListener('click', hide);
    pop.querySelector('.lf-exit-no').addEventListener('click', hide);
    pop.addEventListener('click', function (e) { if (e.target === pop) hide(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop.classList.contains('open')) hide(); });
    pop.querySelector('.lf-exit-go').addEventListener('click', function () {
      if (window.ym) { try { ym(110362886, 'reachGoal', 'exit_popup_click'); } catch (_) {} }
    });
  })();
})();

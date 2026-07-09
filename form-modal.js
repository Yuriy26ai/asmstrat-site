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
    + 'body.lf-lock{overflow:hidden;}';

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

  fab.addEventListener('click', open);
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
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { form.email.classList.add('err'); ok = false; }
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
          if (window.ym) { try { ym(110362886, 'reachGoal', 'lead_form_sent'); } catch (_) {} }
        } else { throw new Error((r && r.error) || 'send'); }
      })
      .catch(function () {
        msg.innerHTML = 'Не получилось отправить. Позвоните <a href="tel:+79777000755" style="color:#1D4D7A;font-weight:600;">+7 977 700-07-55</a> или напишите <a href="mailto:sales@asmstrat.com" style="color:#1D4D7A;font-weight:600;">sales@asmstrat.com</a>';
        msg.className = 'lf-msg err';
      })
      .then(function () { submitBtn.disabled = false; });
  });
})();

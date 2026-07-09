<?php
/**
 * ============================================================
 *  Обработчик формы обратной связи ASM Strategy
 *  Размещение: хостинг Timeweb (любой домен/поддомен с PHP)
 *  Принимает POST с сайта и отправляет письмо на sales@asmstrat.com
 * ============================================================
 *
 *  УСТАНОВКА (Timeweb):
 *  1. В панели Timeweb создайте сайт/поддомен (например form.asmstrat.com
 *     или используйте технический домен вида xxxx.tw1.ru).
 *  2. Загрузите этот файл в корень сайта как send.php.
 *  3. Проверьте: откройте https://ваш-домен/send.php в браузере —
 *     должно показать {"ok":false,"error":"method"} — это норма.
 *  4. Впишите URL в form-modal.js на сайте (константа ENDPOINT).
 */

// ---------- Настройки ----------
$TO      = 'sales@asmstrat.com';                  // куда слать заявки
$FROM    = 'sales@asmstrat.com';                  // от кого (ящик должен существовать на этом же хостинге)
$SUBJECT = 'Заявка с сайта ASM Strategy';

// Разрешённые источники (откуда принимаем запросы)
$ALLOWED_ORIGINS = [
  'https://yuriy26ai.github.io',
  'https://asmstrat.com',
  'https://www.asmstrat.com',
];

// ---------- CORS ----------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $ALLOWED_ORIGINS, true)) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  echo json_encode(['ok' => false, 'error' => 'method']); exit;
}

// ---------- Honeypot (боты заполняют скрытое поле) ----------
if (!empty($_POST['website'])) {            // поле-ловушка
  echo json_encode(['ok' => true]); exit;   // делаем вид, что всё ок
}

// ---------- Простейший антифлуд: не чаще 1 заявки в 20 сек с одного IP ----------
$ip   = preg_replace('/[^0-9a-f\.:]/i', '', $_SERVER['REMOTE_ADDR'] ?? 'x');
$lock = sys_get_temp_dir() . '/asmform_' . md5($ip);
if (is_file($lock) && (time() - filemtime($lock)) < 20) {
  echo json_encode(['ok' => false, 'error' => 'too_fast']); exit;
}
@touch($lock);

// ---------- Валидация ----------
$name  = trim(mb_substr((string)($_POST['name']  ?? ''), 0, 120));
$phone = trim(mb_substr((string)($_POST['phone'] ?? ''), 0, 40));
$email = trim(mb_substr((string)($_POST['email'] ?? ''), 0, 120));
$page  = trim(mb_substr((string)($_POST['page']  ?? ''), 0, 200));

if ($name === '' || mb_strlen(preg_replace('/\D/', '', $phone)) < 10) {
  echo json_encode(['ok' => false, 'error' => 'validation']); exit;
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  echo json_encode(['ok' => false, 'error' => 'email']); exit;
}
// защита от подстановки заголовков
foreach ([$name, $phone, $email] as $v) {
  if (preg_match('/[\r\n]/', $v)) { echo json_encode(['ok' => false, 'error' => 'validation']); exit; }
}

// ---------- Письмо ----------
$body = "Новая заявка с сайта ASM Strategy\n"
      . "----------------------------------\n"
      . "Имя:      {$name}\n"
      . "Телефон:  {$phone}\n"
      . "Email:    " . ($email !== '' ? $email : '—') . "\n"
      . "Страница: " . ($page  !== '' ? $page  : '—') . "\n"
      . "Время:    " . date('d.m.Y H:i:s') . "\n"
      . "IP:       {$ip}\n";

$headers  = "From: ASM Strategy <{$FROM}>\r\n";
if ($email !== '') { $headers .= "Reply-To: {$name} <{$email}>\r\n"; }
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";

$subject = '=?UTF-8?B?' . base64_encode($SUBJECT) . '?=';

$sent = @mail($TO, $subject, $body, $headers);

echo json_encode(['ok' => (bool)$sent, 'error' => $sent ? null : 'send']);

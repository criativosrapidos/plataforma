<?php
// Recebe os pedidos de contato e os briefings do site e manda por e-mail.
// Usado enquanto a área do cliente (Supabase) não está ligada. Funciona em qualquer hospedagem com PHP, como a HostGator.
// Também guarda uma cópia em dados/ (pasta protegida pelo .htaccess dela).

$PARA = 'criativosrapidos@gmail.com';   // quem recebe os e-mails
$DE   = 'site@criativosrapidos.com.br';  // remetente: um e-mail do próprio domínio (crie no cPanel em "Contas de e-mail")

date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json; charset=utf-8');
function sai($ok, $erro = '', $cod = 200) { http_response_code($cod); echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'erro' => $erro]); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sai(false, 'Método não permitido.', 405);
$entrada = json_decode(file_get_contents('php://input'), true);
if (!is_array($entrada) || !isset($entrada['tipo'], $entrada['dados']) || !is_array($entrada['dados'])) sai(false, 'Pedido inválido.', 400);

$tipo = $entrada['tipo'];
$d = $entrada['dados'];
$campo = function ($k, $max = 200) use ($d) {
  $v = isset($d[$k]) ? (string) $d[$k] : '';
  $v = trim(str_replace(["\r\n", "\r"], "\n", $v));
  return mb_substr($v, 0, $max, 'UTF-8');
};

// limite simples: no máximo 10 envios por hora do mesmo endereço
$pasta = __DIR__ . '/dados';
if (!is_dir($pasta)) @mkdir($pasta, 0750, true);
$ipHash = substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . 'criativos'), 0, 16);
$contFile = "$pasta/limite-$ipHash.txt";
$agora = time();
$lista = array_filter(array_map('intval', @file($contFile, FILE_IGNORE_NEW_LINES) ?: []), function ($t) use ($agora) { return $t > $agora - 3600; });
if (count($lista) >= 10) sai(false, 'Muitos envios seguidos. Tente de novo mais tarde.', 429);
$lista[] = $agora;
@file_put_contents($contFile, implode("\n", $lista));

$nome = $campo('nome', 120);
$whats = $campo('whatsapp', 30);
if ($nome === '' || strlen(preg_replace('/\D/', '', $whats)) < 10) sai(false, 'Confira o nome e o WhatsApp com DDD.', 400);

if ($tipo === 'lead') {
  $assunto = 'Novo interessado: ' . $nome . ' · ' . $campo('interesse', 80);
  $texto = "Nome: $nome\nWhatsApp: $whats\nInstagram/empresa: " . $campo('empresa', 160) . "\nInteresse: " . $campo('interesse', 80) . "\nVeio de: " . ($campo('origem', 40) === 'videos' ? 'página do Largada (/videos)' : 'home') . "\n";
  $digitos = preg_replace('/\D/', '', $whats);
  if (strlen($digitos) <= 11) $digitos = '55' . $digitos;
  $texto .= "\nChamar no WhatsApp: https://wa.me/$digitos\n";
} elseif ($tipo === 'briefing') {
  $assunto = 'Briefing recebido: ' . ($campo('empresa', 160) ?: $nome) . ' · ' . $campo('plano', 120);
  $texto = $campo('texto', 20000) . "\n";
} else {
  sai(false, 'Tipo inválido.', 400);
}
$texto .= "\nEnviado pelo site em " . date('d/m/Y H:i') . ".";

// cópia em arquivo (uma linha por envio)
@file_put_contents("$pasta/$tipo-" . date('Y-m') . '.txt', str_repeat('=', 40) . "\n$assunto\n$texto\n\n", FILE_APPEND | LOCK_EX);

$cab = "From: Site Criativos Rápidos <$DE>\r\nReply-To: $PARA\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit";
$ok = @mail($PARA, '=?UTF-8?B?' . base64_encode($assunto) . '?=', $texto, $cab, '-f' . $DE);
// mesmo se o e-mail falhar, a cópia ficou guardada em dados/
sai(true);

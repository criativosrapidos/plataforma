<?php
// Página de conferência do site na hospedagem. Abra criativosrapidos.com.br/diagnostico.php,
// tire um print e mande pra gente. Depois de tudo certo, apague este arquivo.
header('Content-Type: text/html; charset=utf-8');
$base = __DIR__;
$host = $_SERVER['HTTP_HOST'] ?? '';
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
$itens = [];
function item(&$l, $ok, $titulo, $detalhe) { $l[] = [$ok, $titulo, $detalhe]; }

item($itens, true, 'PHP funcionando', 'Versão ' . PHP_VERSION . ' · pasta: ' . $base);
foreach (['index.html', 'videos.html', 'brief.html', 'entrar.html', 'app.html', 'admin.html', 'enviar.php', '.htaccess', 'assets/config.js', 'assets/core.js', 'assets/style.css', 'assets/logo-icone.png', 'dados/.htaccess'] as $f)
  item($itens, file_exists("$base/$f"), "Arquivo $f", file_exists("$base/$f") ? 'encontrado' : 'NÃO encontrado: os arquivos precisam ficar direto dentro de public_html');
$sobra = array_values(array_filter(['default.html', 'index.php', 'index.htm'], function ($f) use ($base) { return file_exists("$base/$f"); }));
item($itens, !$sobra, 'Sem página padrão antiga', $sobra ? 'Apague: ' . implode(', ', $sobra) . ' (ela aparece no lugar do site)' : 'ok');
$sub = glob("$base/*/index.html");
$sub = array_filter($sub ?: [], function ($p) use ($base) { return strpos($p, "$base/assets") !== 0; });
item($itens, !$sub, 'Sem cópia do site numa subpasta', $sub ? 'Achei index.html em: ' . implode(', ', array_map('basename', array_map('dirname', $sub))) . '. Mova o conteúdo dessa pasta pra public_html.' : 'ok');
item($itens, $https, 'Acesso com cadeado (https)', $https ? 'ok' : 'Você abriu sem https. Se o site entra em "redirecionamento demais", o SSL ainda não está ativo: ative o AutoSSL no cPanel ou apague o bloco "sempre com https" do .htaccess por enquanto.');
$cfg = @file_get_contents("$base/assets/config.js") ?: '';
item($itens, preg_match('/WHATSAPP:\s*"\d{12,13}"/', $cfg) === 1, 'WhatsApp no config.js', preg_match('/WHATSAPP:\s*"\d{12,13}"/', $cfg) ? 'ok' : 'Vazio ou no formato errado. Use 55 + DDD + número, só números. Ex.: "5561999999999"');
$supa = preg_match('/SUPABASE_URL:\s*"https:\/\/[^"]+"/', $cfg) === 1;
item($itens, true, 'Área do cliente', $supa ? 'Supabase configurado' : 'Supabase ainda não configurado: o site funciona em modo lançamento (pedidos por e-mail)');
$gravar = is_dir("$base/dados") && is_writable("$base/dados");
item($itens, $gravar, 'Pasta dados pode guardar os pedidos', $gravar ? 'ok' : 'Sem permissão de escrita. No Gerenciador de arquivos, clique com o botão direito na pasta dados → Alterar permissões → 755');
item($itens, function_exists('mail'), 'Envio de e-mail do PHP', function_exists('mail') ? 'disponível' : 'desligado nesta hospedagem: fale com o suporte da HostGator');
// endereço sem .html (regra do .htaccess)
$limpo = null;
if ($host && ini_get('allow_url_fopen')) {
  $ctx = stream_context_create(['http' => ['method' => 'HEAD', 'timeout' => 6, 'ignore_errors' => true, 'follow_location' => 0], 'ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]);
  $h = @get_headers(($https ? 'https' : 'http') . "://$host/videos", 0, $ctx);
  if ($h) $limpo = $h[0];
}
item($itens, $limpo && strpos($limpo, '200') !== false, 'Endereço /videos sem .html', $limpo ? "Resposta: $limpo" : 'Não deu pra testar daqui. Abra ' . $host . '/videos no navegador.');
?>
<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Diagnóstico do site</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;background:#F4F3EE;color:#101216}h1{font-size:24px}li{list-style:none;background:#fff;border:1px solid #E2E0D7;border-radius:12px;padding:10px 14px;margin:8px 0}b{display:block}.ok b::before{content:"✔ ";color:#1F7A3A}.no{border-color:#B4231B}.no b::before{content:"✘ ";color:#B4231B}small{color:#5A5D66}</style></head>
<body><h1>Diagnóstico do site · <?= htmlspecialchars($host) ?></h1><p><small>Tire um print desta página e mande pra gente. Depois de tudo certo, apague o arquivo diagnostico.php.</small></p><ul>
<?php foreach ($itens as [$ok, $t, $d]) echo '<li class="' . ($ok ? 'ok' : 'no') . '"><b>' . htmlspecialchars($t) . '</b><small>' . htmlspecialchars($d) . '</small></li>'; ?>
</ul></body></html>

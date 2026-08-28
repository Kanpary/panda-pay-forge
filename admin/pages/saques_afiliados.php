<?php
// Página descontinuada — todos os saques foram centralizados em "Saques Jogadores".
// Mantida apenas para evitar 404 em links antigos.
if (!isset($pdo)) { die("Acesso restrito."); }
?>
<div class="flex flex-col items-center justify-center py-20 text-zinc-400">
    <i class="fas fa-info-circle text-5xl text-amber-500 mb-4"></i>
    <h2 class="text-xl font-black uppercase mb-2">Página descontinuada</h2>
    <p class="text-sm text-zinc-500 mb-6 text-center max-w-md">
        Os saques de afiliados agora estão centralizados na tela
        <b class="text-white">Saques Jogadores</b>, identificados pela coluna <b class="text-purple-400">Tipo: AFILIADO</b>.
    </p>
    <a href="?page=saques_jogadores" class="px-6 py-3 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-black uppercase text-xs tracking-widest transition-all">
        <i class="fas fa-arrow-right mr-2"></i> Ir para Saques Jogadores
    </a>
</div>

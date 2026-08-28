<?php
// Proteção de acesso
if (!isset($pdo)) { die("Acesso negado."); }

// Busca a contagem de usuários por estado no banco de dados
$sql = "SELECT estado, COUNT(*) as total FROM users WHERE estado IS NOT NULL AND estado != '??' GROUP BY estado ORDER BY total DESC";
$dados_mapa = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

// Total geral de usuários com estado identificado
$total_identificado = array_sum(array_column($dados_mapa, 'total'));
?>

<div class="space-y-8 animate-fade-in pb-20">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 class="text-3xl font-black text-white tracking-tighter uppercase italic">Mapa de Acessos</h2>
            <p class="text-zinc-500 text-sm">Visualização de tráfego por região e estados mais ativos.</p>
        </div>
        
        <div class="bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-2xl flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
            <span class="text-[10px] font-black text-blue-500 uppercase tracking-widest">Dados em Tempo Real</span>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div class="lg:col-span-7 bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none"></div>
            
            <h3 class="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Cobertura Nacional</h3>
            
            <div class="relative w-full max-w-md">
                <img src="https://www.nicepng.com/png/full/415-4159495_selecione-um-estado-para-ver-suas-unidades-transparente.png" alt="Mapa do Brasil" class="w-full h-auto opacity-20 grayscale invert">
                
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-5xl font-black text-white italic tracking-tighter"><?= $total_identificado ?></span>
                    <span class="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Usuários Mapeados</span>
                </div>
            </div>
        </div>

        <div class="lg:col-span-5 space-y-6">
            <div class="bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl h-full">
                <div class="flex items-center justify-between mb-8">
                    <h3 class="text-white font-black uppercase text-xs tracking-widest italic">Estados Populares</h3>
                    <i class="fas fa-fire text-orange-500"></i>
                </div>

                <div class="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    <?php if(empty($dados_mapa)): ?>
                        <div class="text-center py-20">
                            <i class="fas fa-map-marker-alt text-zinc-800 text-4xl mb-4"></i>
                            <p class="text-zinc-600 text-xs font-bold uppercase">Nenhum dado de localização ainda</p>
                        </div>
                    <?php else: ?>
                        <?php foreach($dados_mapa as $index => $item): 
                            $percentual = ($total_identificado > 0) ? ($item['total'] / $total_identificado) * 100 : 0;
                        ?>
                        <div class="group bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:border-blue-500/30 transition-all">
                            <div class="flex justify-between items-center mb-2">
                                <div class="flex items-center gap-3">
                                    <span class="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-[10px] font-black text-blue-500 border border-blue-500/20">
                                        <?= $item['estado'] ?>
                                    </span>
                                    <span class="text-sm font-bold text-white uppercase"><?= $index + 1 ?>º Lugar</span>
                                </div>
                                <span class="text-white font-black text-lg"><?= $item['total'] ?> <small class="text-[9px] text-zinc-600 uppercase">Acessos</small></span>
                            </div>
                            
                            <div class="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1000" style="width: <?= $percentual ?>%"></div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>

    </div>
</div>

<style>
    /* Scrollbar Personalizada para o Ranking */
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.5); }
</style>
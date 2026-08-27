// Versão restaurada do game.js — com suporte ao parâmetro ?panda=hardcore
// Evita redeclaração quando o script é carregado de novo (ex.: Login -> GameView no SPA)
(function () {
  if (typeof window !== "undefined" && window.__pandaGameLoaded) return;
  window.__pandaGameLoaded = true;

  const panda = document.getElementById("panda");
  const gameArea = document.getElementById("gameArea");
  const modal = document.getElementById("modal");
  const modalText = document.getElementById("modalText");
  const saldoEl = document.getElementById("saldo");
  const timerEl = document.getElementById("timer");

  const urlParams = new URLSearchParams(window.location.search);
  const modoHardcore = urlParams.get("panda") === "hardcore";
  const pixSucesso = urlParams.get("pixsucesso") === "true";

  /** true na rota /freegame: rodada grátis (sem login). false em panda.html: jogo com login */
  const isFreeGame =
    typeof window !== "undefined" &&
    (window.location.pathname || "").replace(/\/$/, "").endsWith("freegame");
  /** true na rota /login: não chamar getBalance/getPandaConfig (evita "Não autenticado") */
  const isLoginPage =
    typeof window !== "undefined" &&
    (window.location.pathname || "").replace(/\/$/, "").endsWith("login");

  /** Modo de dificuldade: 'facil' | 'normal' | 'dificil' | 'impossivel' (velocidade e quantidade de obstáculos) */
  let dificuldade = "normal";

  /** level (1–4) da API panda-config -> dificuldade interna (a API não envia mais "difficulty" no JSON) */
  var LEVEL_TO_DIFF = {
    1: "facil",
    2: "normal",
    3: "dificil",
    4: "impossivel",
  };

  function difficultyFromConfig(cfg) {
    return "normal"; // Dificuldade fixa base, controlada pelo RTP/Incremento agora
  }
  /** Nomes aleatórios para exibir no front (nunca "difícil" ou revelar a dificuldade real) */
  var NOMES_MODO_ALEATORIOS = [
    "Clássico",
    "Aventura",
    "Explorador",
    "Lucky",
    "Estrela",
    "Bambu",
    "Panda",
    "Ouro",
    "Sorte",
    "Jóia",
    "Top",
    "Master",
    "Plus",
    "Vip",
  ];

  function getModoNomeAleatorio() {
    return NOMES_MODO_ALEATORIOS[Math.floor(Math.random() * NOMES_MODO_ALEATORIOS.length)];
  }

  function atualizarModoNomeNoFront() {
    if (typeof window.pandaModoNome !== "string") window.pandaModoNome = getModoNomeAleatorio();
    var el = document.getElementById("pandaModoNomeDisplay");
    if (el) el.textContent = window.pandaModoNome;
  }

  /** Retorna só dígitos da string */
  function soNumeros(s) {
    return (s || "").replace(/\D/g, "");
  }

  /** Formata CPF: 000.000.000-00 (máx. 11 dígitos) */
  function formatarCPF(v) {
    var n = soNumeros(v).slice(0, 11);
    if (n.length <= 3) return n;
    if (n.length <= 6) return n.slice(0, 3) + "." + n.slice(3);
    if (n.length <= 9) return n.slice(0, 3) + "." + n.slice(3, 6) + "." + n.slice(6);
    return n.slice(0, 3) + "." + n.slice(3, 6) + "." + n.slice(6, 9) + "-" + n.slice(9);
  }

  /** Formata CNPJ: 00.000.000/0000-00 (máx. 14 dígitos) */
  function formatarCNPJ(v) {
    var n = soNumeros(v).slice(0, 14);
    if (n.length <= 2) return n;
    if (n.length <= 5) return n.slice(0, 2) + "." + n.slice(2);
    if (n.length <= 8) return n.slice(0, 2) + "." + n.slice(2, 5) + "." + n.slice(5);
    if (n.length <= 12)
      return n.slice(0, 2) + "." + n.slice(2, 5) + "." + n.slice(5, 8) + "/" + n.slice(8);
    return (
      n.slice(0, 2) +
      "." +
      n.slice(2, 5) +
      "." +
      n.slice(5, 8) +
      "/" +
      n.slice(8, 12) +
      "-" +
      n.slice(12)
    );
  }

  /** Formata celular: (00) 00000-0000 (11 dígitos: DDD + 9) */
  function formatarCelular(v) {
    var n = soNumeros(v).slice(0, 11);
    if (n.length <= 2) return n ? "(" + n : "";
    if (n.length <= 7) return "(" + n.slice(0, 2) + ") " + n.slice(2);
    return "(" + n.slice(0, 2) + ") " + n.slice(2, 7) + "-" + n.slice(7);
  }

  /** Retorna chave PIX sem máscara para envio à API (tipo: cpf|phone|cpf|cnpj em min ou maiúscula) */
  function chavePixParaApi(tipo, valor) {
    var t = (tipo || "").toLowerCase();
    var v = (valor || "").trim();
    if (t === "cpf" || t === "phone" || t === "celular") return soNumeros(v);
    if (t === "cnpj") return soNumeros(v);
    return v;
  }

  const CONFIG_DIFICULDADE = {
    facil: {
      spawnRateMin: 1000,
      spawnRateMax: 2000,
      spawnDecay: 15,
      chanceFlower: 0.55,
      chanceLeaf: 0.9,
      minGap: 1000,
      dropDuration: 3.5,
    },
    normal: {
      spawnRateMin: 600,
      spawnRateMax: 1600,
      spawnDecay: 20,
      chanceFlower: 0.5,
      chanceLeaf: 0.85,
      minGap: 800,
      dropDuration: 3,
    },
    dificil: {
      spawnRateMin: 220,
      spawnRateMax: 650,
      spawnDecay: 38,
      chanceFlower: 0.28,
      chanceLeaf: 0.52,
      minGap: 250,
      dropDuration: 2.2,
    },
    impossivel: {
      spawnRateMin: 80,
      spawnRateMax: 450,
      spawnDecay: 45,
      chanceFlower: 0.05,
      chanceLeaf: 0.2,
      minGap: 120,
      dropDuration: 1.5,
    },
  };

  /** Saldo da conta no backend hk22 (carregado ao abrir a página) */
  let balanceFromApi = null;

  /** ID da sessão de jogo ativa no servidor */
  let currentGameSessionId = null;

  /** Aposta da rodada atual (jogo logado): valor debitado via panda-bet */
  let valorApostaRodada = 0;

  /** true quando o jogador já atingiu a meta nesta rodada (creditamos e habilitamos saque) */
  let metaAtingidaEstaRodada = false;
  /** Valor em R$ que foi creditado ao atingir a meta (para descontar se bater no obstáculo depois) */
  let valorCreditadoMetaEstaRodada = 0;

  let gameInterval = null;
  let collisionInterval = null;
  let timerInterval = null;
  let saldo = 0;
  let timer = 0;
  let branchValueWon = 0;

  // --- SISTEMA DE DIFICULDADE PROGRESSIVA (RTP + Galhos Ultrapassados) ---
  /** Contador de galhos ultrapassados na partida atual */
  let obstaclesPassedCount = 0;
  /** RTP inicial carregado do backend (usado como dificuldade inicial em 0-100) */
  let rtpInitial = 50;
  /** Taxa de aumento de dificuldade por galho ultrapassado (em pontos percentuais) */
  let difficultyIncrement = 2;
  /** Dificuldade máxima permitida para não quebrar o jogo (em percentuais) */
  const MAX_DIFFICULTY = 98;

  /**
   * Calcula a dificuldade atual baseada em RTP inicial + galhos ultrapassados
   * @returns {number} Dificuldade atual em 0-100, onde 100 é máximo
   */
  function calculateCurrentDifficulty() {
    const inc =
      typeof window.pandaDifficultyIncrement === "number"
        ? window.pandaDifficultyIncrement
        : difficultyIncrement;
    const current = rtpInitial + obstaclesPassedCount * inc;
    return Math.min(current, MAX_DIFFICULTY);
  }

  /**
   * Converte dificuldade numérica (0-100) para um CONFIG_DIFICULDADE ajustado
   * @param {number} difficultyPercent - Dificuldade em 0-100
   * @returns {object} Configuração de dificuldade interpolada
   */
  function getConfigForDifficulty(difficultyPercent) {
    // Dificuldade base sempre 'normal' agora que 'level' foi removido/ocultado
    const baseCfg = CONFIG_DIFICULDADE[modoHardcore ? "impossivel" : "normal"];
    const diff = Math.max(0, Math.min(100, difficultyPercent));

    // Quanto maior a dificuldade, mais rápido o spawn (menor intervalo)
    // e mais velocidade (menor duração)
    const diffRatio = diff / 100;

    return {
      // Frequência (Galhos)
      spawnRateMin: Math.max(50, baseCfg.spawnRateMin * (1 - diffRatio * 0.7)),
      spawnRateMax: Math.max(100, baseCfg.spawnRateMax * (1 - diffRatio * 0.8)),
      spawnDecay: baseCfg.spawnDecay * (1 + diffRatio * 0.5),
      minGap: Math.max(50, baseCfg.minGap * (1 - diffRatio * 0.6)),

      // Velocidade (Galhos)
      dropDuration: Math.max(0.8, baseCfg.dropDuration * (1 - diffRatio * 0.4)),

      // Chances fixas (Dificuldade Inicial não controla mais itens, apenas galhos)
      chanceFlower: baseCfg.chanceFlower,
      chanceLeaf: baseCfg.chanceLeaf,
    };
  }

  function normalizeGiftValues(values) {
    if (!Array.isArray(values)) return [];
    return values
      .map(function (value) {
        return Number(value);
      })
      .filter(function (value) {
        return isFinite(value) && value > 0;
      });
  }

  function getRandomGiftValue() {
    const values = normalizeGiftValues(window.pandaGiftValues);
    if (!values.length) return 0;
    return values[Math.floor(Math.random() * values.length)];
  }

  function getRandomBranchValue() {
    const values = normalizeGiftValues(window.pandaBranchValues);
    if (!values.length) {
      return 0;
    }
    const usedValue = values[Math.floor(Math.random() * values.length)];
    return usedValue;
  }

  function roundCurrency(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function randomBetween(min, max) {
    const safeMin = Number(min || 0);
    const safeMax = Number(max || 0);
    if (safeMax <= safeMin) return safeMin;
    return safeMin + Math.random() * (safeMax - safeMin);
  }

  function getConfiguredFlowerGain() {
    const flowerValues = normalizeGiftValues(window.pandaFlowerValues);
    if (!flowerValues.length) return 0;
    return flowerValues[Math.floor(Math.random() * flowerValues.length)];
  }

  function applyPandaConfigData(data) {
    if (!data) return;
    if (typeof data.min_bet === "number") window.pandaMinBet = data.min_bet;
    if (typeof data.max_bet === "number") window.pandaMaxBet = data.max_bet;

    // Campos legados resetados para não influenciar (Removidos/Ocultos)
    window.pandaCoinValue = 0;
    window.pandaFlowerMult = 0;
    window.pandaObstacleMult = 0;
    window.pandaLeafValue = typeof data.leaf_value === "number" ? data.leaf_value : 0;
    window.pandaLevel = 1;

    if (typeof data.withdraw_multiplier === "number")
      window.pandaWithdrawMultiplier = data.withdraw_multiplier;
    window.pandaIsAffiliate = data.is_affiliate === true;
    window.pandaIsInfluencer = false;
    window.pandaWinBoost = 0;
    window.pandaRtp = typeof data.rtp === "number" ? data.rtp : 50;
    window.pandaIsDemo = data.is_demo === true;

    window.pandaDifficultyIncrement =
      typeof data.difficulty_increment === "number" ? data.difficulty_increment : 2.0;
    window.pandaBonusMax = typeof data.bonus_max === "number" ? data.bonus_max : 5.0;

    window.pandaGiftValues = normalizeGiftValues(data.gift_values);
    window.pandaFlowerValues = normalizeGiftValues(data.flower_values);
    window.pandaBranchValues = normalizeGiftValues(data.branch_values);

    rtpInitial = window.pandaRtp;
    difficultyIncrement = window.pandaDifficultyIncrement;
  }

  // -------------------------------------------------------

  // Variáveis para animação do panda
  let pandaAnimationFrame = 0;
  let pandaAnimationInterval = null;
  let pandaCurrentDirection = "left"; // Direção atual do panda

  function startContinuousPandaAnimation() {
    // Parar qualquer animação anterior
    if (pandaAnimationInterval) {
      clearInterval(pandaAnimationInterval);
    }

    // Resetar frame
    pandaAnimationFrame = 0;

    pandaAnimationInterval = setInterval(() => {
      const frame = (pandaAnimationFrame % 3) + 1; // Alterna entre 1, 2 e 3
      const src =
        typeof window.__pandaAssetUrl === "function"
          ? window.__pandaAssetUrl(frame + ".png")
          : frame + ".png";
      panda.src = src;
      pandaAnimationFrame++;
    }, 80); // Troca a cada 80ms
  }

  function stopContinuousPandaAnimation() {
    if (pandaAnimationInterval) {
      clearInterval(pandaAnimationInterval);
      pandaAnimationInterval = null;
    }
  }

  function handleInput(x) {
    if (modal.style.display === "flex") return;

    const clickX = x - gameArea.getBoundingClientRect().left;
    if (clickX < gameArea.offsetWidth / 2) {
      panda.classList.remove("right");
      panda.classList.add("left");
      pandaCurrentDirection = "left";
      gameArea.classList.add("flash-left");
    } else {
      panda.classList.remove("left");
      panda.classList.add("right");
      pandaCurrentDirection = "right";
      gameArea.classList.add("flash-right");
    }

    setTimeout(() => {
      gameArea.classList.remove("flash-left", "flash-right");
    }, 100);
  }

  gameArea.addEventListener("click", (e) => handleInput(e.clientX));
  gameArea.addEventListener("touchstart", (e) => handleInput(e.touches[0].clientX));

  function spawnFlower(cfg) {
    cfg = cfg || getConfigForDifficulty(calculateCurrentDifficulty());
    const duration = (cfg.dropDuration || 3) * 1000 + 200;
    const flower = document.createElement("div");
    flower.classList.add("flower", Math.random() > 0.5 ? "left" : "right");
    flower.style.animationDuration = (cfg.dropDuration || 3) + "s";
    flower.dataset.gain = String(getConfiguredFlowerGain());
    flower.innerText = "🌸";
    gameArea.appendChild(flower);
    setTimeout(() => flower.remove(), duration);
  }

  function spawnLeaf(cfg) {
    cfg = cfg || getConfigForDifficulty(calculateCurrentDifficulty());
    const duration = (cfg.dropDuration || 3) * 1000 + 200;
    const leaf = document.createElement("div");
    leaf.classList.add("leaf", Math.random() > 0.5 ? "left" : "right");
    leaf.style.animationDuration = (cfg.dropDuration || 3) + "s";
    leaf.innerText = "🌿";
    gameArea.appendChild(leaf);
    setTimeout(() => leaf.remove(), duration);
  }

  let lastLeftBranchTime = 0;
  let lastRightBranchTime = 0;

  function spawnBranch() {
    const now = Date.now();
    const chance = Math.random();
    // MELHORIA RTP/DIFICULDADE: usar dificuldade progressiva ao invés de CONFIG fixo
    const currentDiff = calculateCurrentDifficulty();
    const cfg = getConfigForDifficulty(currentDiff);

    // --- LÓGICA DE RTP E MULTIPLICADOR GLOBAL ---
    var chanceFlower = Math.min(0.9, cfg.chanceFlower || 0);
    var chanceLeaf = Math.min(0.9, cfg.chanceLeaf || 0);

    if (chance < chanceFlower) {
      spawnFlower(cfg);
    } else if (chance < chanceLeaf) {
      spawnLeaf(cfg);
    } else {
      gerarGalhoHardcore(now, cfg);
    }
  }

  function gerarGalhoHardcore(now, cfg) {
    // Trava global removida (residuo antigo) - Sempre 1.0

    var effectiveMinGap = cfg.minGap;
    var effectiveDuration = cfg.dropDuration || 3;

    const side = Math.random() > 0.5 ? "left" : "right";

    if (
      (side === "left" && now - lastRightBranchTime < effectiveMinGap) ||
      (side === "right" && now - lastLeftBranchTime < effectiveMinGap)
    )
      return;

    const branch = document.createElement("div");
    branch.classList.add("branch", side, "drop-" + (modoHardcore ? "impossivel" : dificuldade));
    if (modoHardcore) branch.classList.add("hardcore");
    branch.style.animationDuration = effectiveDuration + "s";
    // MELHORIA RTP/DIFICULDADE: marcar galho para contar quando ultrapassado
    branch.dataset.counted = "false";
    gameArea.appendChild(branch);
    const duration = effectiveDuration * 1000 + 200;
    setTimeout(() => {
      // Se o galho chegou ao final sem colidir, incrementa contador de dificuldade
      if (branch.parentNode === gameArea && branch.dataset.counted !== "true") {
        obstaclesPassedCount++;
      }
      branch.remove();
    }, duration);

    if (side === "left") lastLeftBranchTime = now;
    else lastRightBranchTime = now;
  }

  function checkCollision() {
    const pandaRect = panda.getBoundingClientRect();

    // --- CONFIGURAÇÃO DA HITBOX (CAIXA DE COLISÃO) ---
    // Este valor encolhe a área invisível de batida.
    // Se o panda ainda bater no vento, aumente para 20 ou 25.
    // Se ele começar a atravessar o galho sem morrer, diminua para 10 ou 5.
    const margemTolerancia = 15;

    document.querySelectorAll(".branch").forEach((branch) => {
      const branchRect = branch.getBoundingClientRect();

      // Verifica se estão no mesmo lado da tela
      const sameSide =
        (panda.classList.contains("left") && branch.classList.contains("left")) ||
        (panda.classList.contains("right") && branch.classList.contains("right"));

      // Cálculo de sobreposição COM a margem de tolerância aplicada
      const overlap =
        branchRect.top + margemTolerancia < pandaRect.bottom - margemTolerancia &&
        branchRect.bottom - margemTolerancia > pandaRect.top + margemTolerancia;

      if (sameSide && overlap) {
        // MELHORIA RTP/DIFICULDADE: marcar galho como colidido para não contar como ultrapassado
        branch.dataset.counted = "true";
        branchValueWon = getRandomBranchValue();
        endGame(true); // perdeu: bateu no obstáculo
      }
    });

    document.querySelectorAll(".flower, .leaf").forEach((el) => {
      const elRect = el.getBoundingClientRect();

      // Para os itens bons (flores/folhas), deixamos a colisão padrão.
      // É melhor que seja fácil de pegar do que difícil.
      const overlapping =
        elRect.top < pandaRect.bottom &&
        elRect.bottom > pandaRect.top &&
        elRect.left < pandaRect.right &&
        elRect.right > pandaRect.left;

      if (overlapping) {
        // --- LÓGICA DE VALORES DINÂMICOS ---
        // Verifica se o elemento coletado tem a classe 'flower' ou 'leaf'
        if (el.classList.contains("flower")) {
          // Se for flor, soma o valor configurado no array sorteado
          const flowerGain = roundCurrency(parseFloat(el.dataset.gain || 0));
          saldo = roundCurrency(saldo + flowerGain);
        } else {
          // Se for folha, soma o valor de folha do banco
          saldo = roundCurrency(saldo + Number(window.pandaLeafValue || 0));
        }

        // coinV removido (residuo antigo)

        if (!isFreeGame && valorApostaRodada > 0) {
          // No jogo real: mostra o progresso em R$ (saldo já está em reais, não precisa multiplicar por coinV)
          timerEl.innerText = `Progresso: R$ ${saldo.toFixed(2).replace(".", ",")}`;
          verificarMetaAtingida();
        } else {
          // No jogo grátis: mostra apenas a pontuação bruta
          saldoEl.innerText = `Saldo: R$ ${saldo.toFixed(2).replace(".", ",")}`;
        }

        el.remove();
        var ac = document.getElementById("audioColeta");
        if (ac && ac.src) ac.play().catch(function () {});
      }
    });
  }

  function clearGameArea() {
    document.querySelectorAll(".branch, .flower, .leaf").forEach((el) => el.remove());
  }

  /** Se logado e progresso >= meta: credita o valor no saldo, habilita o botão Sacar e mostra notificação (uma vez por rodada). */
  async function verificarMetaAtingida() {
    if (isFreeGame || valorApostaRodada <= 0 || metaAtingidaEstaRodada) return;
    const multV =
      typeof window.pandaWithdrawMultiplier === "number" ? window.pandaWithdrawMultiplier : 10;
    // CORREÇÃO MONETÁRIA: saldo já está em reais, não multiplica por coinV
    const progresso = saldo;
    const meta = valorApostaRodada * multV;
    console.log("Verificando meta:", { progresso, meta, saldo, valorApostaRodada, multV });
    if (progresso < meta) return;
    metaAtingidaEstaRodada = true;
    valorCreditadoMetaEstaRodada = progresso;
    if (typeof pandaResult === "function") {
      try {
        const res = await pandaResult(progresso, valorApostaRodada, {
          game_session_id: currentGameSessionId,
        });
        if (res.success && res.data != null && typeof res.data.balance === "number") {
          balanceFromApi = res.data.balance;
          if (typeof window !== "undefined") window.balanceFromApi = res.data.balance;
        }
      } catch (e) {}
    }
    const btn = document.getElementById("ctaSaqueTopo");
    if (btn) {
      btn.classList.remove("disabled");
      btn.textContent = "💸 Sacar Pix";
      showSaqueAtivadoNotification();
    }
  }

  async function startCountdown() {
    if (window.__pandaCountdownRunning) return;
    const startBtn = modal.querySelector("button[data-start-countdown]");
    const apostaErro = document.getElementById("apostaErro");
    const valorApostaEl = document.getElementById("valorAposta");

    if (!isFreeGame && valorApostaEl) {
      const raw = (valorApostaEl.value || "").replace(",", ".").trim();
      const amount = parseFloat(raw);
      const minB = typeof window.pandaMinBet === "number" ? window.pandaMinBet : 1;
      const maxB = typeof window.pandaMaxBet === "number" ? window.pandaMaxBet : 50;
      const saldoAtual =
        (typeof balanceFromApi === "number"
          ? balanceFromApi
          : window.balanceFromApi != null
            ? Number(window.balanceFromApi)
            : 0) || 0;

      if (apostaErro) apostaErro.style.display = "none";
      if (isNaN(amount) || amount < minB) {
        if (apostaErro) {
          apostaErro.textContent = `Informe um valor entre R$ ${minB.toFixed(2).replace(".", ",")} e R$ ${maxB.toFixed(2).replace(".", ",")}.`;
          apostaErro.style.display = "block";
        }
        return;
      }
      if (amount > maxB) {
        if (apostaErro) {
          apostaErro.textContent = `Aposta máxima é R$ ${maxB.toFixed(2).replace(".", ",")}.`;
          apostaErro.style.display = "block";
        }
        return;
      }
      if (amount > saldoAtual) {
        if (apostaErro) {
          apostaErro.textContent = "Saldo insuficiente. Faça um depósito para jogar.";
          apostaErro.style.display = "block";
        }
        return;
      }

      // --- CORREÇÃO: Desativar botão e evitar múltiplos cliques ---
      if (startBtn) {
        if (startBtn.disabled) return;
        startBtn.disabled = true;
        startBtn.style.opacity = "0.7";
        startBtn.style.cursor = "not-allowed";
      }

      if (typeof pandaBet === "function") {
        try {
          const res = await pandaBet(amount);
          if (!res.success) {
            if (apostaErro) {
              apostaErro.textContent = res.error || "Erro ao registrar aposta.";
              apostaErro.style.display = "block";
            }
            // --- CORREÇÃO: Reativar em caso de erro ---
            if (startBtn) {
              startBtn.disabled = false;
              startBtn.style.opacity = "";
              startBtn.style.cursor = "";
            }
            return;
          }
          valorApostaRodada = amount;
          if (res.data) {
            if (typeof res.data.balance === "number") {
              balanceFromApi = res.data.balance;
              if (typeof window !== "undefined") window.balanceFromApi = res.data.balance;
            }
            if (res.data.game_session_id) {
              currentGameSessionId = res.data.game_session_id;
            }
          }
        } catch (err) {
          if (apostaErro) {
            apostaErro.textContent = "Erro ao processar aposta.";
            apostaErro.style.display = "block";
          }
          if (startBtn) {
            startBtn.disabled = false;
            startBtn.style.opacity = "";
            startBtn.style.cursor = "";
          }
          return;
        }
      }
    }

    window.__pandaCountdownRunning = true;
    if (startBtn) startBtn.style.display = "none";
    let count = 3;
    modalText.innerText = count;
    modalText.classList.add("countdown");

    const countdown = setInterval(() => {
      count--;
      if (count > 0) {
        modalText.innerText = count;
        modalText.classList.remove("countdown");
        void modalText.offsetWidth;
        modalText.classList.add("countdown");
      } else {
        clearInterval(countdown);
        window.__pandaCountdownRunning = false;
        modal.style.display = "none";
        var btnMenuTopo = document.getElementById("btnMenuTopo");
        var menuTopoDrop = document.getElementById("menuTopoDropdown");
        if (btnMenuTopo) btnMenuTopo.style.display = "inline-block";
        if (menuTopoDrop) menuTopoDrop.style.display = "none";
        if (timerEl) timerEl.style.display = "inline-block";
        modalText.classList.remove("countdown");
        var audioStart = document.getElementById("audioStart");
        if (audioStart && audioStart.src) audioStart.play().catch(function () {});
        if (typeof trackGameStart === "function") trackGameStart();
        startGame();
      }
    }, 1000);
  }
  if (typeof window !== "undefined") window.startCountdown = startCountdown;

  function startGame() {
    // Rodada grátis (/freegame): lógica de "já jogou" e saldo em localStorage
    if (isFreeGame) {
      const jaJogou = localStorage.getItem("jaJogouPanda");
      const saldoSalvo = localStorage.getItem("saldoFinal");
      if (jaJogou === "true" && saldoSalvo) {
        saldo = parseFloat(saldoSalvo);
        endGame();
        return;
      }
      localStorage.setItem("jaJogouPanda", "true");
      saldo = 0;
    } else {
      // Jogo principal (panda.html): saldo = pontos coletados na rodada (começa em 0)
      saldo = 0;
    }
    branchValueWon = 0;
    obstaclesPassedCount = 0;
    metaAtingidaEstaRodada = false;
    valorCreditadoMetaEstaRodada = 0;

    if (isFreeGame && modoHardcore) {
      const saldoAnterior = parseFloat(localStorage.getItem("saldoFinal") || "0");
      saldo += saldoAnterior;

      if (saldoAnterior > 0) {
        const aviso = document.createElement("div");
        aviso.innerText = `💰 Saldo acumulado resgatado: R$ ${saldo.toFixed(2).replace(".", ",")}`;
        aviso.style.position = "fixed";
        aviso.style.top = "50%";
        aviso.style.left = "50%";
        aviso.style.transform = "translate(-50%, -50%)";
        aviso.style.background = "#16a34a";
        aviso.style.color = "#fff";
        aviso.style.padding = "12px 20px";
        aviso.style.fontSize = "18px";
        aviso.style.borderRadius = "10px";
        aviso.style.zIndex = "10000";
        aviso.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
        document.body.appendChild(aviso);
        setTimeout(() => aviso.remove(), 2500);
      }
    }

    // MELHORIA RTP/DIFICULDADE: carregar RTP inicial e resetar contador de galhos
    rtpInitial = typeof window.pandaRtp === "number" ? window.pandaRtp : 50;
    difficultyIncrement =
      typeof window.pandaDifficultyIncrement === "number" ? window.pandaDifficultyIncrement : 2;
    obstaclesPassedCount = 0;
    timer = 0;
    metaAtingidaEstaRodada = false;
    valorCreditadoMetaEstaRodada = 0;
    const multVal =
      typeof window.pandaWithdrawMultiplier === "number" ? window.pandaWithdrawMultiplier : 10;
    if (!isFreeGame && valorApostaRodada > 0) {
      const metaR = valorApostaRodada * multVal;
      saldoEl.innerText = `Meta: R$ ${metaR.toFixed(2).replace(".", ",")}`;
      // CORREÇÃO MONETÁRIA: saldo já está em reais, não multiplica por coinVal
      timerEl.innerText = `Progresso: R$ ${saldo.toFixed(2).replace(".", ",")}`;
    } else {
      saldoEl.innerText = `Saldo: R$ ${saldo.toFixed(2).replace(".", ",")}`;
      timerEl.innerText = `Tempo: ${timer}s`;
    }
    clearGameArea();

    // Iniciar animação contínua do panda
    startContinuousPandaAnimation();

    // Inicializar botão de saque como inativo (ativa ao atingir meta ou após 42s no free game)
    const btnSaque = document.getElementById("ctaSaqueTopo");
    if (btnSaque) {
      btnSaque.style.display = "block";
      btnSaque.classList.add("disabled");
      btnSaque.textContent = "⏰ Aguarde a meta...";
    }

    function spawnLoop() {
      spawnBranch();
      // MELHORIA RTP/DIFICULDADE: usar dificuldade progressiva na taxa de spawn
      const currentDiff = calculateCurrentDifficulty();
      const cfg = getConfigForDifficulty(currentDiff);
      const spawnRate = Math.max(cfg.spawnRateMin, cfg.spawnRateMax - timer * cfg.spawnDecay);
      gameInterval = setTimeout(spawnLoop, spawnRate);
    }

    spawnLoop();
    collisionInterval = setInterval(checkCollision, 100);

    timerInterval = setInterval(() => {
      timer++;
      if (isFreeGame || valorApostaRodada <= 0) timerEl.innerText = `Tempo: ${timer}s`;
    }, 1000);

    window.__pandaHidePresentes = false;
    if (window.__pandaCaixaTimeouts) {
      window.__pandaCaixaTimeouts.forEach(function (id) {
        clearTimeout(id);
      });
      window.__pandaCaixaTimeouts = [];
    }
    var currentGiftDiff = calculateCurrentDifficulty();
    var giftDifficultyRatio = Math.max(0, Math.min(95, currentGiftDiff)) / 100;
    var caixaDelay = Math.round(8000 + giftDifficultyRatio * 12000);
    var caixaSecondAt = 0;

    function showCaixaMagica() {
      if (window.__pandaHidePresentes) return;
      var giftChance = Math.max(0.2, 0.9 - (calculateCurrentDifficulty() / 100) * 0.65);
      if (Math.random() > giftChance) return;
      const caixa = document.getElementById("caixaMagica");
      if (!caixa) return;
      caixa.style.display = "block";
      const timeoutCaixa = setTimeout(() => {
        caixa.style.display = "none";
      }, 5000);

      caixa.onclick = () => {
        clearTimeout(timeoutCaixa);
        const bonusReais = getRandomGiftValue();

        // --- LÓGICA DE VALOR DINÂMICO PELO BANCO ---
        // Pega o teto configurado na tabela game_settings (padrão 5.00 se falhar)

        // O bônus usa o teto da tabela conforme modo demo ou real.
        // CORREÇÃO MONETÁRIA: adiciona bônus em reais direto, sem conversão por coinV
        saldo += bonusReais;

        if (!isFreeGame && valorApostaRodada > 0) {
          // CORREÇÃO MONETÁRIA: saldo já está em reais, não multiplica por coinV
          timerEl.innerText = `Progresso: R$ ${saldo.toFixed(2).replace(".", ",")}`;
          verificarMetaAtingida();
        } else {
          saldoEl.innerText = `Saldo: R$ ${saldo.toFixed(2).replace(".", ",")}`;
        }

        caixa.style.display = "none";

        const msg = document.createElement("div");
        msg.innerText = `🎁 Bônus mágico: R$ ${bonusReais.toFixed(2).replace(".", ",")}!`;
        msg.style.position = "fixed";
        msg.style.top = "50%";
        msg.style.left = "50%";
        msg.style.transform = "translate(-50%, -50%)";
        msg.style.background = "#16a34a";
        msg.style.color = "#fff";
        msg.style.padding = "12px 20px";
        msg.style.fontSize = "18px";
        msg.style.borderRadius = "10px";
        msg.style.zIndex = "10000";
        msg.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
        document.body.appendChild(msg);

        setTimeout(() => msg.remove(), 2500);
        var ac = document.getElementById("audioColeta");
        if (ac && ac.src) ac.play().catch(function () {});
      };
    }
    window.__pandaCaixaTimeouts = window.__pandaCaixaTimeouts || [];
    window.__pandaCaixaTimeouts.push(setTimeout(showCaixaMagica, caixaDelay));
    if (caixaSecondAt > 0)
      window.__pandaCaixaTimeouts.push(setTimeout(showCaixaMagica, caixaSecondAt));

    // No free game, habilitar botão Sacar após 42s; no jogo logado a meta já habilita
    if (isFreeGame || valorApostaRodada <= 0) {
      setTimeout(() => {
        const btnSaque = document.getElementById("ctaSaqueTopo");
        if (btnSaque && btnSaque.classList.contains("disabled")) {
          btnSaque.classList.remove("disabled");
          btnSaque.textContent = "💸 Sacar Pix";
          showSaqueAtivadoNotification();
        }
      }, 42000);
    }
  }

  function showSaqueAtivadoNotification() {
    // Confetti sutil no topo da tela
    createConfetti();

    // Pulso destacado no botão (sem atrapalhar o jogo)
    const btnSaque = document.getElementById("ctaSaqueTopo");
    if (btnSaque) {
      btnSaque.style.transform = "translateX(-50%) scale(1.1)";
      btnSaque.style.boxShadow = "0 0 20px rgba(36, 201, 79, 0.8)";

      setTimeout(() => {
        btnSaque.style.transform = "translateX(-50%) scale(1)";
        btnSaque.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
      }, 1000);
    }

    // Notificação discreta
    const notification = document.createElement("div");
    notification.innerHTML = "🎉 Saque liberado!";
    notification.style.position = "fixed";
    notification.style.top = "60px";
    notification.style.left = "50%";
    notification.style.transform = "translateX(-50%)";
    notification.style.background = "rgba(36, 201, 79, 0.9)";
    notification.style.color = "white";
    notification.style.padding = "8px 16px";
    notification.style.fontSize = "14px";
    notification.style.fontWeight = "bold";
    notification.style.borderRadius = "20px";
    notification.style.zIndex = "9998";
    notification.style.animation = "slideInTop 0.5s ease-out";
    notification.style.pointerEvents = "none";

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(-50%) translateY(-10px)";
      notification.style.transition = "all 0.5s ease-out";
      setTimeout(() => notification.remove(), 500);
    }, 2000);
  }

  function createConfetti() {
    const colors = ["#ffd700", "#ff6b35", "#24c94f", "#9b59b6", "#00ff99"];

    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const confetti = document.createElement("div");
        confetti.innerHTML = ["🎉", "✨", "🌟", "💫", "⭐"][Math.floor(Math.random() * 5)];
        confetti.style.position = "fixed";
        confetti.style.top = "0px";
        confetti.style.left = Math.random() * 100 + "%";
        confetti.style.fontSize = "20px";
        confetti.style.zIndex = "9999";
        confetti.style.pointerEvents = "none";
        confetti.style.animation = "confettiFall 2s ease-out forwards";

        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 2000);
      }, i * 100);
    }
  }

  async function endGame(perdeu = false) {
    // Esconder presentes/caixa mágica para sempre quando perde ou clica em sacar PIX
    if (
      typeof window.__pandaCaixaTimeouts !== "undefined" &&
      Array.isArray(window.__pandaCaixaTimeouts)
    ) {
      window.__pandaCaixaTimeouts.forEach(function (id) {
        clearTimeout(id);
      });
      window.__pandaCaixaTimeouts = [];
    }
    window.__pandaHidePresentes = true;
    var caixaEl = document.getElementById("caixaMagica");
    if (caixaEl) caixaEl.style.display = "none";

    const apostaDestaRodada = valorApostaRodada; // guardar antes de zerar (para exibir no modal de derrota)
    var ago = document.getElementById("audioGameOver");
    if (ago && ago.src) ago.play().catch(function () {});
    clearInterval(gameInterval);
    clearInterval(collisionInterval);
    clearInterval(timerInterval);
    clearGameArea();

    // Parar animação contínua do panda
    stopContinuousPandaAnimation();

    // Resetar botão de saque para estado inativo
    let btnSaqueReset = document.getElementById("ctaSaqueTopo");
    if (btnSaqueReset) {
      btnSaqueReset.style.display = "none";
      btnSaqueReset.classList.add("disabled");
      btnSaqueReset.textContent = "⏰ Aguarde...";
    }

    const modalContent = document.getElementById("modalContent");
    modal.style.display = "flex";
    var btnMenuTopo = document.getElementById("btnMenuTopo");
    if (btnMenuTopo) btnMenuTopo.style.display = "inline-block";
    if (timerEl) timerEl.style.display = "none";

    // Jogo logado: se perdeu, não credita; se perdeu após ter atingido a meta, backend desconta o valor da meta do saldo
    if (!isFreeGame && typeof pandaResult === "function") {
      try {
        // CORREÇÃO MONETÁRIA: saldo já está em reais, não multiplica por coinV
        const winAmount = perdeu ? branchValueWon : metaAtingidaEstaRodada ? 0 : saldo;
        const opts = { game_session_id: currentGameSessionId };
        if (perdeu && metaAtingidaEstaRodada) {
          opts.loss_after_meta = true;
          opts.loss_credited_amount = valorCreditadoMetaEstaRodada;
        }
        const res = await pandaResult(winAmount, valorApostaRodada, opts);
        if (res.success && res.data && typeof res.data.balance === "number") {
          balanceFromApi = res.data.balance;
          if (typeof window !== "undefined") window.balanceFromApi = res.data.balance;
        }
        valorApostaRodada = 0;
      } catch (e) {}
    }

    // Modal de derrota: hardcore ou bateu no obstáculo (perdeu a partida)
    if (modoHardcore || perdeu) {
      const valorApostaPerdida = !isFreeGame && apostaDestaRodada > 0 ? apostaDestaRodada : 0;
      const perdeuAposMeta =
        !isFreeGame && perdeu && metaAtingidaEstaRodada && valorApostaPerdida > 0;
      const valorMetaPerdida = perdeuAposMeta
        ? valorCreditadoMetaEstaRodada > 0
          ? valorCreditadoMetaEstaRodada
          : valorApostaPerdida *
            (typeof window.pandaWithdrawMultiplier === "number"
              ? window.pandaWithdrawMultiplier
              : 10)
        : 0;
      const valorRamoGanhado = perdeu && branchValueWon > 0 ? branchValueWon : 0;
      modalContent.innerHTML = `
      <div class="modalBox">
        <img src="logopandapix.png" alt="PandaPix" class="pandaTop" />
        <div class="resultCard" style="background-color: #dc2626;">
          <span class="resultLabel" style="color: #fecaca;">${valorRamoGanhado > 0 ? "FIM DE JOGO" : "VOCÊ PERDEU"}</span>
          <div style="font-size: 48px; margin: 20px 0;">${valorRamoGanhado > 0 ? "🐼" : "😞"}</div>
          <p style="font-size: 18px; color: #fecaca; margin: 20px 0; line-height: 1.5;">
            ${valorRamoGanhado > 0 ? `Você bateu no galho, mas ganhou <strong>R$ ${valorRamoGanhado.toFixed(2).replace(".", ",")}</strong>!` : "Que pena! Você bateu no obstáculo."}
          </p>
          ${perdeuAposMeta ? `<p style="font-size: 16px; color: #fecaca; margin: 12px 0;">Você tinha atingido a meta, mas bateu no obstáculo. O valor de <strong>R$ ${valorMetaPerdida.toFixed(2).replace(".", ",")}</strong> foi descontado do seu saldo.</p>` : valorApostaPerdida > 0 && valorRamoGanhado === 0 ? `<p style="font-size: 16px; color: #fecaca; margin: 12px 0;">Você não atingiu a meta e perdeu a aposta de <strong>R$ ${valorApostaPerdida.toFixed(2).replace(".", ",")}</strong>.</p>` : ""}

          <button onclick="${!isFreeGame ? "location.reload()" : "reiniciarJogo()"}" style="margin-top: 20px; background: #fff; color: #dc2626; font-weight: bold; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; width: 100%;">
            🔄 Tente Novamente
          </button>
        </div>
      </div>
    `;
      return;
    }

    // CORREÇÃO MONETÁRIA: saldo já está em reais em ambos os casos, não precisa de coinVEnd
    const valorGanhoReais = saldo;

    // Modal simples: você ganhou + botão para voltar ao menu (sem etapa de saque)
    modalContent.innerHTML = `
    <div class="modalBox modalGanhou">
      <img src="logopandapix.png" alt="PandaPix" class="pandaTop modalGanhouLogo" />
      <div class="resultCard modalGanhouCard">
        <div class="modalGanhouTopo text-center">
          <div class="modalGanhouLabel">Você ganhou</div>
          <div class="shimmer-text modalGanhouValor">R$ ${valorGanhoReais.toFixed(2).replace(".", ",")}</div>
          <div class="modalGanhouTempo">em ${timer}s de jogo 🐼</div>
        </div>
        <p style="margin-top: 1rem; color: #dcfce7; font-size: 0.9375rem;">O valor já está no seu saldo. Use Saque no menu quando quiser.</p>
        <button type="button" id="btnVoltarMenuGanhou" class="modalBtnInicio" style="margin-top: 1.25rem; width: 100%;">Voltar ao menu</button>
      </div>
    </div>
  `;

    document.getElementById("btnVoltarMenuGanhou").onclick = () => location.reload();

    const btnSaque = document.getElementById("ctaSaqueTopo");
    if (btnSaque) {
      btnSaque.style.display = "none";
    }

    if (isFreeGame) {
      localStorage.setItem("saldoFinal", saldo);
    }
  }

  function showPixSucessoModal(valorSaque) {
    const modalContent = document.getElementById("modalContent");

    // Gerar dados do comprovante
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString("pt-BR");
    const horaFormatada = agora.toLocaleTimeString("pt-BR");
    const transacaoId = "PX" + Math.random().toString(36).substr(2, 8).toUpperCase();
    const chave = localStorage.getItem("email") || "usuario@email.com";

    modalContent.innerHTML = `
    <div class="modalBox">
      <img src="panda_top.png" alt="Panda" class="pandaTop" />
      <div class="resultCard" style="background-color: #16a34a;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
          <span class="resultLabel" style="color: #d1fae5;">PIX SOLICITADO COM SUCESSO!</span>
        </div>
        
        <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 10px; margin: 15px 0; text-align: left;">
          <div style="font-size: 14px; color: #f0fdf4; margin-bottom: 15px; text-align: center; font-weight: bold;">
            📄 COMPROVANTE DE SAQUE
          </div>
          
          <div style="font-size: 13px; color: #d1fae5; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>💰 Valor:</span>
              <span style="font-weight: bold;">R$ ${valorSaque.toFixed(2).replace(".", ",")}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>📅 Data:</span>
              <span>${dataFormatada}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>🕐 Horário:</span>
              <span>${horaFormatada}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>🔑 ID Transação:</span>
              <span style="font-family: monospace; font-size: 12px;">${transacaoId}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>🏦 Status:</span>
              <span style="color: #00ff99; font-weight: bold;">PROCESSAMENTO</span>
            </div>
          </div>
        </div>
        
        <div style="background: rgba(0,255,153,0.1); padding: 12px; border-radius: 8px; margin: 15px 0; border: 1px solid #00ff99;">
          <p style="font-size: 14px; color: #00ff99; margin: 0; text-align: center;">
            💸 O valor será creditado em sua conta em até 5 minutos!
          </p>
        </div>
        
        <button onclick="location.href='/'" style="margin-top: 20px; background: #fff; color: #16a34a; font-weight: bold; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; width: 100%;">
          🏠 Voltar ao Início
        </button>
      </div>
    </div>
  `;
  }

  /**
   * Modal para informar o valor que deseja sacar (passo 1). Depois abre o formulário PIX.
   */
  function showWithdrawAmountModal(saldoDisponivel, onVoltar) {
    const modalContent = document.getElementById("modalContent");
    const saldo = Number(saldoDisponivel) || 0;
    const saldoFmt = saldo.toFixed(2).replace(".", ",");

    modalContent.innerHTML = `
    <div class="modalBox modalGanhou">
      <img src="logopandapix.png" alt="PandaPix" class="pandaTop modalGanhouLogo" />
      <div class="resultCard modalGanhouCard">
        <div class="modalRecargaLabel">SAQUE PIX</div>
        <p class="modalRecargaSubtitle">Saldo disponível: <strong><span class="shimmer-text">R$ ${saldoFmt}</span></strong></p>
        <div class="modalSaquePixForm">
          <label class="modalRecargaValorLabel">Valor que deseja sacar (R$)</label>
          <input type="number" id="valorSaqueInput" class="modalSaquePixInput" placeholder="0,00" min="0" step="0.01" max="${saldo}" value="" />
          <div id="minSaqueValorMsg" style="display:none; color:#ef4444; font-size:12px; margin-top:6px; text-align:center;"></div>
          <button type="button" id="btnContinuarSaque" class="modalGanhouBtnSaque" style="margin-top:12px;">Continuar</button>
        </div>
        <button type="button" id="voltarSaqueValor" class="modalBloqueadoBtnVoltar" style="margin-top: 10px;">Voltar</button>
      </div>
    </div>
  `;

    document.getElementById("voltarSaqueValor").onclick =
      typeof onVoltar === "function" ? onVoltar : endGame;

    var inputValor = document.getElementById("valorSaqueInput");
    var msgEl = document.getElementById("minSaqueValorMsg");

    function showMsg(txt) {
      if (msgEl) {
        msgEl.textContent = txt || "";
        msgEl.style.display = txt ? "block" : "none";
      }
    }
    inputValor.addEventListener("input", function () {
      showMsg("");
    });
    inputValor.placeholder = "0,00";

    document.getElementById("btnContinuarSaque").onclick = function () {
      var str = (inputValor.value || "").trim().replace(",", ".");
      var valor = parseFloat(str) || 0;
      showMsg("");
      if (valor <= 0) {
        showMsg("Informe o valor que deseja sacar.");
        return;
      }
      if (valor > saldo) {
        showMsg("Valor maior que o saldo disponível (R$ " + saldoFmt + ").");
        return;
      }
      showWithdrawPixForm(valor, onVoltar);
    };
  }

  /**
   * Modal com formulário de dados PIX para saque (backend hk22).
   * Apenas tipo de chave e chave PIX.
   */
  function showWithdrawPixForm(valorSaque, onVoltar) {
    const modalContent = document.getElementById("modalContent");

    modalContent.innerHTML = `
    <div class="modalBox modalGanhou">
      <img src="logopandapix.png" alt="PandaPix" class="pandaTop modalGanhouLogo" />
      <div class="resultCard modalGanhouCard">
        <div class="modalRecargaLabel">DADOS PARA SAQUE PIX</div>
        <p class="modalRecargaSubtitle">Valor: <strong><span class="shimmer-text">R$ ${valorSaque.toFixed(2).replace(".", ",")}</span></strong></p>
        <form id="formSaquePix" class="modalSaquePixForm">
          <label class="modalRecargaValorLabel">Tipo de chave PIX</label>
          <select id="pixType" class="modalSaquePixInput" required>
            <option value="cpf">CPF</option>
            <option value="email">E-mail</option>
            <option value="phone">Telefone</option>
            <option value="random">Chave aleatória</option>
          </select>
          <label class="modalRecargaValorLabel">Chave PIX</label>
          <input type="text" id="pixKey" class="modalSaquePixInput" placeholder="000.000.000-00" required />
          <button type="submit" class="modalGanhouBtnSaque">💸 Confirmar saque</button>
          <div id="minSaqueMsg" style="display:none; color:#ef4444; font-size:12px; margin-top:8px; text-align:center;"></div>
        </form>
        <button type="button" id="voltarSaqueForm" class="modalBloqueadoBtnVoltar" style="margin-top: 10px;">Voltar</button>
      </div>
    </div>
  `;

    document.getElementById("voltarSaqueForm").onclick =
      typeof onVoltar === "function" ? onVoltar : endGame;

    var pixTypeEl = document.getElementById("pixType");
    var pixKeyEl = document.getElementById("pixKey");
    var placeholders = {
      cpf: "000.000.000-00",
      email: "seu@email.com",
      phone: "(00) 00000-0000",
      random: "Chave aleatória",
    };

    function applyMaskSaquePix() {
      var t = pixTypeEl.value;
      if (t === "cpf") pixKeyEl.value = formatarCPF(pixKeyEl.value);
      else if (t === "phone") pixKeyEl.value = formatarCelular(pixKeyEl.value);
    }

    function updatePlaceholderSaque() {
      pixKeyEl.placeholder = placeholders[pixTypeEl.value] || "Digite sua chave PIX";
      applyMaskSaquePix();
    }
    pixTypeEl.addEventListener("change", updatePlaceholderSaque);
    pixKeyEl.addEventListener("input", applyMaskSaquePix);
    updatePlaceholderSaque();

    var minSaqueMsgEl = document.getElementById("minSaqueMsg");

    function showSaqueError(msg) {
      if (minSaqueMsgEl) {
        minSaqueMsgEl.textContent = msg || "";
        minSaqueMsgEl.style.display = msg ? "block" : "none";
      }
    }
    pixKeyEl.addEventListener("input", function () {
      showSaqueError("");
    });
    pixTypeEl.addEventListener("change", function () {
      showSaqueError("");
    });

    document.getElementById("formSaquePix").onsubmit = async (e) => {
      e.preventDefault();
      showSaqueError("");
      const pixType = pixTypeEl.value.trim();
      const pixKeyRaw = chavePixParaApi(pixType, pixKeyEl.value);

      if (!pixKeyRaw) {
        showSaqueError("Preencha a chave PIX.");
        return;
      }

      const result = await createWithdraw({
        amount: valorSaque,
        pix_key: pixKeyRaw,
        pix_type: pixType,
        nome: "",
        cpf: "",
      });

      if (result.success) {
        localStorage.setItem("valorSaqueEscolhido", valorSaque.toFixed(2));
        showPixSucessoModal(valorSaque);
        return;
      }

      const err = result.error || "Erro ao solicitar saque.";
      if (err.includes("Não autenticado") || err.includes("401")) {
        alert("Faça login no site para sacar. Abra o jogo pela página do sistema.");
        endGame();
        return;
      }
      if (
        err.includes("rollover") ||
        err.includes("apostar") ||
        err.includes("Saldo insuficiente")
      ) {
        showSaqueError(err);
        return;
      }
      showSaqueError(err);
    };
  }

  function fmtNum(v) {
    if (v == null || v === "") return "0";
    var n = typeof v === "number" ? v : Number(v);
    return (Number.isNaN(n) ? 0 : Math.round(n)).toString();
  }

  function fmtMoney(v) {
    if (v == null || v === "") return "0,00";
    var n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
    return (Number.isNaN(n) ? 0 : n).toFixed(2).replace(".", ",");
  }

  function fmtDate(s) {
    if (!s) return "-";
    var d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    var day = ("0" + d.getDate()).slice(-2);
    var month = ("0" + (d.getMonth() + 1)).slice(-2);
    var year = d.getFullYear();
    var h = ("0" + d.getHours()).slice(-2);
    var m = ("0" + d.getMinutes()).slice(-2);
    return day + "/" + month + "/" + year + " " + h + ":" + m;
  }

  function showHistoricoModal() {
    const modalContent = document.getElementById("modalContent");
    var modal = document.getElementById("modal");
    if (!modalContent || !modal) return;
    modal.style.display = "flex";

    var tabAtual = "deposits";
    var pageAtual = 1;
    var pagination = {
      current_page: 1,
      total_pages: 1,
      total: 0,
    };

    function setTabActive(tab) {
      tabAtual = tab;
      pageAtual = 1;
      modalContent.querySelectorAll(".modalHistoricoTab").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-tab") === tab);
      });
      loadHistorico();
    }

    function statusDepositoLabel(s) {
      var t = (s || "").toLowerCase();
      if (t === "completed" || t === "paid") return "Pago";
      if (t === "pending") return "Pendente";
      if (t === "cancelled") return "Cancelado";
      if (t === "expired") return "Expirado";
      return s || "-";
    }

    function statusSaqueLabel(s) {
      var t = (s || "").toLowerCase();
      if (t === "completed" || t === "approved") return "Concluído";
      if (t === "pending" || t === "processing") return "Pendente";
      if (t === "rejected") return "Rejeitado";
      if (t === "cancelled") return "Cancelado";
      return s || "-";
    }

    function renderDeposits(list) {
      if (!list || list.length === 0)
        return '<p class="modalHistoricoVazio">Nenhum depósito encontrado.</p>';
      var html = '<ul class="modalHistoricoLista">';
      list.forEach(function (r) {
        var valor = fmtMoney(r.amount);
        var bonus =
          r.bonus_amount != null && Number(r.bonus_amount) > 0
            ? " (+" + fmtMoney(r.bonus_amount) + " bônus)"
            : "";
        var status = (r.status || "").toLowerCase();
        var label = statusDepositoLabel(r.status);
        html +=
          '<li class="modalHistoricoItem"><span class="modalHistoricoItemValor">R$ ' +
          valor +
          bonus +
          '</span><span class="modalHistoricoItemStatus modalHistoricoStatus-' +
          status +
          '">' +
          label +
          '</span><span class="modalHistoricoItemData">' +
          fmtDate(r.created_at) +
          "</span></li>";
      });
      html += "</ul>";
      return html;
    }

    function renderWithdrawals(list) {
      if (!list || list.length === 0)
        return '<p class="modalHistoricoVazio">Nenhum saque encontrado.</p>';
      var html = '<ul class="modalHistoricoLista">';
      list.forEach(function (r) {
        var valor = fmtMoney(r.amount);
        var status = (r.status || "").toLowerCase();
        var label = statusSaqueLabel(r.status);
        html +=
          '<li class="modalHistoricoItem"><span class="modalHistoricoItemValor">R$ ' +
          valor +
          '</span><span class="modalHistoricoItemStatus modalHistoricoStatus-' +
          status +
          '">' +
          label +
          '</span><span class="modalHistoricoItemData">' +
          fmtDate(r.created_at) +
          "</span></li>";
      });
      html += "</ul>";
      return html;
    }

    function renderGames(list) {
      if (!list || list.length === 0)
        return '<p class="modalHistoricoVazio">Nenhuma jogada encontrada.</p>';
      var html = '<ul class="modalHistoricoLista">';
      list.forEach(function (r) {
        var aposta = fmtMoney(r.bet_amount);
        var ganho = fmtMoney(r.win_amount);
        html +=
          '<li class="modalHistoricoItem"><span class="modalHistoricoItemValor">Aposta R$ ' +
          aposta +
          '</span><span class="modalHistoricoItemValor">Ganho R$ ' +
          ganho +
          '</span><span class="modalHistoricoItemData">' +
          fmtDate(r.created_at) +
          "</span></li>";
      });
      html += "</ul>";
      return html;
    }

    function loadHistorico() {
      var container = document.getElementById("historicoConteudo");
      var pagEl = document.getElementById("historicoPaginacao");
      if (container) container.innerHTML = '<p class="modalHistoricoCarregando">Carregando...</p>';
      if (pagEl) pagEl.innerHTML = "";

      var promise;
      if (tabAtual === "deposits")
        promise =
          typeof getHistoryDeposits === "function"
            ? getHistoryDeposits(pageAtual)
            : Promise.resolve({
                success: false,
              });
      else if (tabAtual === "withdrawals")
        promise =
          typeof getHistoryWithdrawals === "function"
            ? getHistoryWithdrawals(pageAtual)
            : Promise.resolve({
                success: false,
              });
      else
        promise =
          typeof getHistoryGames === "function"
            ? getHistoryGames(pageAtual)
            : Promise.resolve({
                success: false,
              });

      promise
        .then(function (res) {
          if (!container) return;
          if (!res.success) {
            container.innerHTML =
              '<p class="modalHistoricoVazio">' +
              (res.error || "Erro ao carregar. Tente novamente.") +
              "</p>";
            return;
          }
          var data = res.data || {};
          var list = Array.isArray(data) ? data : data.data || [];
          pagination = data.pagination || {
            current_page: 1,
            total_pages: 1,
            total: 0,
          };
          if (tabAtual === "deposits") container.innerHTML = renderDeposits(list);
          else if (tabAtual === "withdrawals") container.innerHTML = renderWithdrawals(list);
          else container.innerHTML = renderGames(list);

          if (pagEl && pagination.total_pages > 1) {
            var prevDisabled = pagination.current_page <= 1;
            var nextDisabled = pagination.current_page >= pagination.total_pages;
            pagEl.innerHTML =
              '<span class="modalHistoricoPagInfo">Página ' +
              pagination.current_page +
              " de " +
              pagination.total_pages +
              "</span>" +
              '<button type="button" class="modalHistoricoPagBtn" id="historicoPagPrev"' +
              (prevDisabled ? " disabled" : "") +
              ">Anterior</button>" +
              '<button type="button" class="modalHistoricoPagBtn" id="historicoPagNext"' +
              (nextDisabled ? " disabled" : "") +
              ">Próxima</button>";
            var prevBtn = document.getElementById("historicoPagPrev");
            var nextBtn = document.getElementById("historicoPagNext");
            if (prevBtn && !prevDisabled)
              prevBtn.onclick = function () {
                pageAtual--;
                loadHistorico();
              };
            if (nextBtn && !nextDisabled)
              nextBtn.onclick = function () {
                pageAtual++;
                loadHistorico();
              };
          }
        })
        .catch(function () {
          if (container)
            container.innerHTML =
              '<p class="modalHistoricoVazio">Erro ao carregar. Tente novamente.</p>';
        });
    }

    modalContent.innerHTML = `
    <div class="modalBox modalHistorico">
      <img src="logopandapix.png" alt="PandaPix" class="pandaTop" />
      <div class="resultCard modalHistoricoCard">
        <span class="resultLabel">📜 Histórico</span>
        <div class="modalHistoricoTabs">
          <button type="button" data-tab="deposits" class="modalHistoricoTab active">Depósitos</button>
          <button type="button" data-tab="withdrawals" class="modalHistoricoTab">Saques</button>
          <button type="button" data-tab="games" class="modalHistoricoTab">Jogadas</button>
        </div>
        <div id="historicoConteudo" class="modalHistoricoConteudo">Carregando...</div>
        <div id="historicoPaginacao" class="modalHistoricoPaginacao"></div>
        <button type="button" id="voltarHistorico" class="modalBloqueadoBtnVoltar" style="margin-top: 10px;">Voltar</button>
      </div>
    </div>
  `;

    modalContent.querySelectorAll(".modalHistoricoTab").forEach(function (btn) {
      btn.onclick = function () {
        var t = btn.getAttribute("data-tab");
        if (t) setTabActive(t);
      };
    });

    var btnVoltar = document.getElementById("voltarHistorico");
    if (btnVoltar)
      btnVoltar.onclick = function () {
        modal.style.display = "none";
        location.reload();
      };

    loadHistorico();
  }

  /** Modal de sucesso após solicitar saque de afiliado (em vez de alert). */
  function showAfiliadoSaqueSucessoModal(message) {
    var modalContent = document.getElementById("modalContent");
    var modal = document.getElementById("modal");
    if (!modalContent || !modal) return;
    modal.style.display = "flex";
    modalContent.innerHTML = `
    <div class="modalBox modalGanhou">
      <img src="logopandapix.png" alt="PandaPix" class="pandaTop modalGanhouLogo" />
      <div class="resultCard modalGanhouCard">
        <span class="resultLabel">✅ Saque solicitado</span>
        <p class="modalAfiliadoSaqueSucessoMsg">${(message || "Saque solicitado com sucesso! Aguarde aprovação do administrador.").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        <button type="button" id="afiliadoSaqueSucessoVoltar" class="modalBloqueadoBtnVoltar" style="margin-top: 16px;">Voltar</button>
      </div>
    </div>
  `;
    var btnVoltar = document.getElementById("afiliadoSaqueSucessoVoltar");
    if (btnVoltar)
      btnVoltar.onclick = function () {
        modal.style.display = "none";
        location.reload();
      };
  }

  function applyAffiliateStatsToDom(data) {
    if (!data) return;
    var set = function (id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set("afiliadosNovosSub", fmtNum(data.total_referrals));
    set("afiliadosSubDeposito", fmtNum(data.referrals_with_deposit));
    set("afiliadosValorPrimeiroDep", fmtMoney(data.first_deposit_value));
    set("afiliadosDeposito", fmtMoney(data.total_deposit_value));
    set("afiliadosDepositos", fmtNum(data.total_deposit_count));
    set(
      "afiliadosComissoes",
      fmtMoney(
        data.generated_commission != null ? data.generated_commission : data.total_commission,
      ),
    );
    set("afiliadosSaldoDisponivel", fmtMoney(data.available_commission));
    set("afiliadosPagas", fmtMoney(data.paid_withdrawals));
    set("afiliadosSemDeposito", fmtNum(data.status_counts && data.status_counts.without_deposit));
    set(
      "afiliadosAguardandoDeposito",
      fmtNum(data.status_counts && data.status_counts.awaiting_deposit),
    );
    set("afiliadosEmProcessamento", fmtNum(data.status_counts && data.status_counts.processing));
    set("afiliadosConfirmados", fmtNum(data.status_counts && data.status_counts.confirmed));
    set(
      "afiliadosModoCpa",
      data.commission_mode === "all_deposits"
        ? "todos / pular " + fmtNum(data.skip_cpa || 0)
        : "primeiro",
    );
    var saldoMsg = document.getElementById("afiliadosSemSaldoMsg");
    if (saldoMsg)
      saldoMsg.style.display =
        data.available_commission == null || Number(data.available_commission) <= 0
          ? "block"
          : "none";
    var blockedMsg = document.getElementById("afiliadosNaoAfiliadoMsg");
    if (blockedMsg) blockedMsg.style.display = data.is_affiliate === true ? "none" : "block";
    var linkWrap = document.getElementById("afiliadosLinkWrap");
    if (linkWrap) linkWrap.style.display = data.is_affiliate === true ? "block" : "none";
    var withdrawBtn = document.getElementById("btnAfiliadosSolicitarSaque");
    if (withdrawBtn) withdrawBtn.style.display = data.is_affiliate === true ? "block" : "none";
    var leadList = document.getElementById("afiliadosLeadList");
    if (leadList) {
      var records = Array.isArray(data.lead_records) ? data.lead_records : [];
      if (!records.length) {
        leadList.innerHTML =
          '<div style="padding:10px 0;color:#bbf7d0;font-size:12px;">Nenhum indicado encontrado.</div>';
      } else {
        leadList.innerHTML = records
          .map(function (record) {
            var reason = record.status_reason
              ? '<div style="font-size:10px;color:#d1d5db;margin-top:4px;">' +
                record.status_reason +
                "</div>"
              : "";
            return (
              "" +
              '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.12);text-align:left;">' +
              '<div style="display:flex;justify-content:space-between;gap:10px;">' +
              "<div>" +
              '<div style="font-size:13px;font-weight:700;color:#fff;">' +
              (record.nome || "Indicado") +
              "</div>" +
              '<div style="font-size:10px;color:#bbf7d0;">' +
              (record.telefone || "") +
              "</div>" +
              "</div>" +
              '<div style="font-size:10px;font-weight:700;color:#fef08a;text-transform:uppercase;">' +
              (record.status_label || "-") +
              "</div>" +
              "</div>" +
              '<div style="margin-top:6px;font-size:11px;color:#e5e7eb;">Confirmados: ' +
              fmtNum(record.confirmed_deposit_count || 0) +
              " | Comissao: " +
              fmtMoney(record.commission_total || 0) +
              "</div>" +
              reason +
              "</div>"
            );
          })
          .join("");
      }
    }
  }

  function showAfiliadosModal() {
    const modalContent = document.getElementById("modalContent");
    if (!modalContent || !modal) return;
    modal.style.display = "flex";
    var period = "all";
    modalContent.innerHTML = `
    <div class="modalBox modalAfiliados">
      <img src="logopandapix.png" alt="PandaPix" class="pandaTop" />
      <div class="resultCard modalAfiliadosCard">
        <span class="resultLabel">🎁 Indique e Ganhe</span>
        <div class="modalAfiliadosFiltros">
          <button type="button" data-period="all" class="modalAfiliadosFiltroBtn active">Tudo</button>
          <button type="button" data-period="today" class="modalAfiliadosFiltroBtn">Hoje</button>
          <button type="button" data-period="yesterday" class="modalAfiliadosFiltroBtn">Ontem</button>
          <button type="button" data-period="this_week" class="modalAfiliadosFiltroBtn modalAfiliadosFiltroBtnLong">Esta Semana</button>
          <button type="button" data-period="last_week" class="modalAfiliadosFiltroBtn modalAfiliadosFiltroBtnLong">Última Semana</button>
        </div>
        <div class="modalAfiliadosGrid">
          <div class="modalAfiliadosStatCard"><span class="modalAfiliadosStatLabel">NOVOS SUBORDINADOS</span><span id="afiliadosNovosSub" class="modalAfiliadosStatVal">0</span></div>
          <div class="modalAfiliadosStatCard"><span class="modalAfiliadosStatLabel">SUBORDINADOS COM DEPÓSITO</span><span id="afiliadosSubDeposito" class="modalAfiliadosStatVal">0</span></div>
          <div class="modalAfiliadosStatCard"><span class="modalAfiliadosStatLabel">VALOR DO PRIMEIRO DEPÓSITO</span><span id="afiliadosValorPrimeiroDep" class="modalAfiliadosStatVal">0,00</span></div>
          <div class="modalAfiliadosStatCard"><span class="modalAfiliadosStatLabel">DEPÓSITO</span><span id="afiliadosDeposito" class="modalAfiliadosStatVal">0,00</span></div>
          <div class="modalAfiliadosStatCard"><span class="modalAfiliadosStatLabel">DEPÓSITOS</span><span id="afiliadosDepositos" class="modalAfiliadosStatVal">0</span></div>
          <div class="modalAfiliadosStatCard"><span class="modalAfiliadosStatLabel">COMISSÕES GERADAS</span><span id="afiliadosComissoes" class="modalAfiliadosStatVal">0,00</span></div>
        </div>
        <div class="modalAfiliadosCarteira">
          <p class="modalAfiliadosCarteiraTitulo">Saldo disponível de comissões</p>
          <p id="afiliadosSaldoDisponivel" class="modalAfiliadosCarteiraValor">0,00</p>
          <p id="afiliadosSemSaldoMsg" class="modalAfiliadosSemSaldoMsg" style="display: none;">Não há saldo disponível para saque.</p>
          <button type="button" id="btnAfiliadosSolicitarSaque" class="modalAfiliadosBtnSolicitarSaque">Solicitar saque</button>
          <div id="afiliadosFormSaqueWrap" class="modalAfiliadosFormSaqueWrap" style="display: none;">
            <p class="modalAfiliadosFormSaqueTitulo">Dados para o saque</p>
            <label class="modalAfiliadosFormLabel">Valor (R$)</label>
            <input type="number" id="afiliadosSaqueValor" class="modalAfiliadosFormInput" min="0" step="0.01" placeholder="0,00" />
            <label class="modalAfiliadosFormLabel">Tipo de chave PIX</label>
            <select id="afiliadosSaquePixTipo" class="modalAfiliadosFormInput">
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
              <option value="EMAIL">E-mail</option>
              <option value="PHONE">Telefone</option>
              <option value="RANDOM">Chave aleatória</option>
            </select>
            <label class="modalAfiliadosFormLabel">Chave PIX</label>
            <input type="text" id="afiliadosSaquePixChave" class="modalAfiliadosFormInput" placeholder="000.000.000-00" />
            <div class="modalAfiliadosFormBotoes">
              <button type="button" id="afiliadosSaqueConfirmar" class="modalAfiliadosBtnCopiar">Confirmar</button>
              <button type="button" id="afiliadosSaqueCancelar" class="modalBloqueadoBtnVoltar" style="margin-top: 0;">Cancelar</button>
            </div>
          </div>
        </div>
        <div class="modalAfiliadosLinkBox">
          <p class="modalAfiliadosLinkTitulo">🔗 Seu Link de Indicação</p>
          <input type="text" id="afiliadosLinkInput" class="modalAfiliadosLinkInput" readonly value="Carregando..." />
          <button type="button" id="btnCopiarAfiliados" class="modalAfiliadosBtnCopiar">📋 Copiar</button>
        </div>
        <button type="button" id="voltarAfiliados" class="modalBloqueadoBtnVoltar" style="margin-top: 12px;">Voltar</button>
      </div>
    </div>
  `;

    var mainGrid = modalContent.querySelector(".modalAfiliadosGrid");
    if (mainGrid) {
      var extraGrid = document.createElement("div");
      extraGrid.className = "modalAfiliadosGrid";
      extraGrid.innerHTML =
        "" +
        '<div class="modalAfiliadosStatCard hidden-affiliate-card"><span class="modalAfiliadosStatLabel">SEM DEPOSITO</span><span id="afiliadosSemDeposito" class="modalAfiliadosStatVal">0</span></div>' +
        '<div class="modalAfiliadosStatCard hidden-affiliate-card"><span class="modalAfiliadosStatLabel">AGUARDANDO</span><span id="afiliadosAguardandoDeposito" class="modalAfiliadosStatVal">0</span></div>' +
        '<div class="modalAfiliadosStatCard hidden-affiliate-card"><span class="modalAfiliadosStatLabel">PROCESSANDO</span><span id="afiliadosEmProcessamento" class="modalAfiliadosStatVal">0</span></div>' +
        '<div class="modalAfiliadosStatCard hidden-affiliate-card"><span class="modalAfiliadosStatLabel">CONFIRMADOS</span><span id="afiliadosConfirmados" class="modalAfiliadosStatVal">0</span></div>' +
        '<div class="modalAfiliadosStatCard hidden-affiliate-card"><span class="modalAfiliadosStatLabel">COMISSOES PAGAS</span><span id="afiliadosPagas" class="modalAfiliadosStatVal">0,00</span></div>' +
        '<div class="modalAfiliadosStatCard hidden-affiliate-card"><span class="modalAfiliadosStatLabel">PULAR CPA</span><span id="afiliadosModoCpa" class="modalAfiliadosStatVal">--</span></div>';

      // extraGrid.style.display = 'none'; // Ocultar cards solicitados - Removido para usar CSS
      mainGrid.insertAdjacentElement("afterend", extraGrid);
    }

    var walletBox = modalContent.querySelector(".modalAfiliadosCarteira");
    if (walletBox) {
      var blockedMsg = document.createElement("p");
      blockedMsg.id = "afiliadosNaoAfiliadoMsg";
      blockedMsg.className = "modalAfiliadosSemSaldoMsg";
      blockedMsg.style.display = "none";
      blockedMsg.textContent =
        "Esta area libera comissoes apenas para contas aprovadas como afiliado.";
      var withdrawButton = document.getElementById("btnAfiliadosSolicitarSaque");
      if (withdrawButton) {
        walletBox.insertBefore(blockedMsg, withdrawButton);
      } else {
        walletBox.appendChild(blockedMsg);
      }
    }

    var linkBox = modalContent.querySelector(".modalAfiliadosLinkBox");
    if (linkBox) {
      linkBox.id = "afiliadosLinkWrap";
      var leadBox = document.createElement("div");
      leadBox.className = "modalAfiliadosLinkBox";
      leadBox.innerHTML =
        "" +
        '<p class="modalAfiliadosLinkTitulo">Indicados</p>' +
        '<div id="afiliadosLeadList" style="max-height:220px;overflow-y:auto;"></div>';
      linkBox.insertAdjacentElement("afterend", leadBox);
    }

    function setFilterActive(p) {
      var btns = modalContent.querySelectorAll(".modalAfiliadosFiltroBtn");
      btns.forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-period") === p);
      });
    }

    function loadStats(p) {
      period = p;
      setFilterActive(p);
      if (typeof getAffiliateStats !== "function") return;
      getAffiliateStats(p)
        .then(function (res) {
          if (res.success && res.data) {
            var d = res.data;
            applyAffiliateStatsToDom(d);
            var inputEl = document.getElementById("afiliadosLinkInput");
            if (inputEl) inputEl.value = d.affiliate_link || "";
            window.__pandaAfiliadosSaldoDisponivel = Number(d.available_commission || 0);
          }
        })
        .catch(function () {});
    }

    modalContent.querySelectorAll(".modalAfiliadosFiltroBtn").forEach(function (btn) {
      btn.onclick = function () {
        var p = btn.getAttribute("data-period");
        if (p) loadStats(p);
      };
    });

    loadStats("all");

    var inputEl = document.getElementById("afiliadosLinkInput");
    var btnCopiar = document.getElementById("btnCopiarAfiliados");
    if (btnCopiar) {
      btnCopiar.onclick = function () {
        var link = inputEl && inputEl.value ? inputEl.value : "";
        if (link && link !== "Carregando...") {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
              .writeText(link)
              .then(function () {
                btnCopiar.textContent = "✓ Copiado!";
                setTimeout(function () {
                  btnCopiar.textContent = "📋 Copiar";
                }, 2000);
              })
              .catch(function () {
                // Fallback
                if (inputEl) {
                  inputEl.select();
                  document.execCommand("copy");
                  btnCopiar.textContent = "✓ Copiado!";
                  setTimeout(function () {
                    btnCopiar.textContent = "📋 Copiar";
                  }, 2000);
                }
              });
          } else if (inputEl) {
            // Fallback antigo
            inputEl.select();
            document.execCommand("copy");
            btnCopiar.textContent = "✓ Copiado!";
            setTimeout(function () {
              btnCopiar.textContent = "📋 Copiar";
            }, 2000);
          }
        }
      };
    }

    var btnSolicitarSaque = document.getElementById("btnAfiliadosSolicitarSaque");
    var formSaqueWrap = document.getElementById("afiliadosFormSaqueWrap");
    if (btnSolicitarSaque && formSaqueWrap) {
      btnSolicitarSaque.onclick = function () {
        var saldo =
          typeof window.__pandaAfiliadosSaldoDisponivel === "number"
            ? window.__pandaAfiliadosSaldoDisponivel
            : 0;
        if (saldo <= 0) return;
        formSaqueWrap.style.display = "block";
        var valorEl = document.getElementById("afiliadosSaqueValor");
        if (valorEl) valorEl.value = saldo.toFixed(2);
      };
    }
    var btnCancelarSaque = document.getElementById("afiliadosSaqueCancelar");
    if (btnCancelarSaque && formSaqueWrap) {
      btnCancelarSaque.onclick = function () {
        formSaqueWrap.style.display = "none";
      };
    }
    var tipoAfEl = document.getElementById("afiliadosSaquePixTipo");
    var chaveAfEl = document.getElementById("afiliadosSaquePixChave");
    var placeholdersAf = {
      CPF: "000.000.000-00",
      CNPJ: "00.000.000/0000-00",
      EMAIL: "seu@email.com",
      PHONE: "(00) 00000-0000",
      RANDOM: "Chave aleatória",
    };
    if (tipoAfEl && chaveAfEl) {
      function applyMaskAfiliados() {
        var t = tipoAfEl.value;
        if (t === "CPF") chaveAfEl.value = formatarCPF(chaveAfEl.value);
        else if (t === "CNPJ") chaveAfEl.value = formatarCNPJ(chaveAfEl.value);
        else if (t === "PHONE") chaveAfEl.value = formatarCelular(chaveAfEl.value);
      }

      function updatePlaceholderAfiliados() {
        chaveAfEl.placeholder = placeholdersAf[tipoAfEl.value] || "Sua chave PIX";
        applyMaskAfiliados();
      }
      tipoAfEl.addEventListener("change", updatePlaceholderAfiliados);
      chaveAfEl.addEventListener("input", applyMaskAfiliados);
      updatePlaceholderAfiliados();
    }
    var btnConfirmarSaque = document.getElementById("afiliadosSaqueConfirmar");
    if (btnConfirmarSaque) {
      btnConfirmarSaque.onclick = function () {
        var valorEl = document.getElementById("afiliadosSaqueValor");
        var tipoEl = document.getElementById("afiliadosSaquePixTipo");
        var chaveEl = document.getElementById("afiliadosSaquePixChave");
        var valorStr = valorEl && valorEl.value ? valorEl.value.replace(",", ".") : "0";
        var valor = parseFloat(valorStr) || 0;
        var pixType = tipoEl && tipoEl.value ? tipoEl.value : "CPF";
        var pixKey = chavePixParaApi(pixType, chaveEl && chaveEl.value ? chaveEl.value : "");
        var saldo =
          typeof window.__pandaAfiliadosSaldoDisponivel === "number"
            ? window.__pandaAfiliadosSaldoDisponivel
            : 0;
        if (valor <= 0) {
          alert("Informe um valor válido.");
          return;
        }
        if (valor > saldo) {
          alert(
            "Valor maior que o saldo disponível (R$ " + saldo.toFixed(2).replace(".", ",") + ").",
          );
          return;
        }
        if (!pixKey) {
          alert("Informe a chave PIX.");
          return;
        }
        if (typeof createAffiliateWithdraw !== "function") {
          alert("Função de saque indisponível.");
          return;
        }
        btnConfirmarSaque.disabled = true;
        createAffiliateWithdraw({
          amount: valor,
          pix_key: pixKey,
          pix_type: pixType,
        })
          .then(function (res) {
            btnConfirmarSaque.disabled = false;
            if (res.success) {
              formSaqueWrap.style.display = "none";
              if (valorEl) valorEl.value = "";
              if (chaveEl) chaveEl.value = "";
              var msg =
                res.data && res.data.message
                  ? res.data.message
                  : "Saque solicitado com sucesso! Aguarde aprovação do administrador.";
              showAfiliadoSaqueSucessoModal(msg);
              loadStats(period);
            } else {
              alert(res.error || "Erro ao solicitar saque.");
            }
          })
          .catch(function () {
            btnConfirmarSaque.disabled = false;
            alert("Erro ao solicitar saque. Tente novamente.");
          });
      };
    }

    var btnVoltar = document.getElementById("voltarAfiliados");
    if (btnVoltar) {
      btnVoltar.onclick = function (e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        location.reload();
      };
    }
  }

  async function showRechargeModal(onVoltar) {
    const modalContent = document.getElementById("modalContent");

    // Fallback caso a API não retorne cards
    const opcoesFallback = [
      {
        valor: 19.9,
        bonus: 10.0,
      },
      {
        valor: 25.0,
        bonus: 20.0,
      },
      {
        valor: 30.0,
        bonus: 30.0,
      },
    ];

    let opcoes = opcoesFallback;
    if (typeof getDepositCards === "function") {
      try {
        const res = await getDepositCards();
        if (res.success && res.data && Array.isArray(res.data.cards) && res.data.cards.length > 0) {
          opcoes = res.data.cards.map((c) => {
            const valor = parseFloat(c.amount) || 0;
            const bonusPct = (parseFloat(c.bonus_percent) || 0) / 100;
            const bonusFix = parseFloat(c.bonus_fixed) || 0;
            const bonus = bonusFix + valor * bonusPct;
            return {
              valor,
              bonus,
            };
          });
        }
      } catch (e) {
        console.warn("Cards de depósito não carregados, usando opções padrão.", e);
      }
    }

    window.__pandaOpcoesRecarga = opcoes;
    let botoes = "";
    opcoes.forEach((op) => {
      botoes += `
      <div class="modalRecargaOpcao">
        <button type="button" data-valor="${op.valor}" data-bonus="${op.bonus}" onclick="selecionarValorRecarga(${op.valor}, ${op.bonus})" class="modalRecargaBtn">
          <span class="modalRecargaBtnValor shimmer-text">R$ ${op.valor.toFixed(2).replace(".", ",")}</span>
          <span class="modalRecargaBtnBonus">+ R$ ${op.bonus.toFixed(2).replace(".", ",")} bônus</span>
        </button>
      </div>
    `;
    });

    modalContent.innerHTML = `
    <div class="modalBox modalGanhou">
      <img src="bannerdeposito.png" alt="Depósito" class="pandaTop modalGanhouLogo" />
      <div class="resultCard modalGanhouCard modalRecargaCard">
        <div class="modalRecargaLabel">ESCOLHA SUA RECARGA</div>
        <div class="winner-feed" id="winnerFeedRecarga" aria-live="polite">
          <div class="winner-feed-track" id="winnerFeedTrackRecarga"></div>
        </div>
        <div class="modalRecargaGrid">
          ${botoes}
        </div>
        <div class="modalRecargaPersonalizado">
          <div class="modalRecargaPersonalizadoRow">
            <span class="modalRecargaRs">R$</span>
            <input type="number" id="valorPersonalizado" placeholder="10,00" min="10" step="0.01" class="modalRecargaInput" />
            <button type="button" onclick="processarValorPersonalizado()" class="modalRecargaBtnGerar modalBtnSaqueStyle">Gerar PIX</button>
          </div>
          <div id="bonusRecargaMsg" style="display:none; color:#fbbf24; font-size:13px; font-weight:700; margin-top:6px; text-align:center; width:100%;"></div>
          <div id="minDepositMsg" style="display:none; color:#ef4444; font-size:12px; margin-top:4px; text-align:center;"></div>
        </div>
        <button type="button" id="backToGameOver" class="modalBloqueadoBtnVoltar">Voltar</button>
      </div>
    </div>
  `;

    document.getElementById("backToGameOver").onclick =
      typeof onVoltar === "function" ? onVoltar : endGame;

    fillWinnerFeedRecarga();

    var valorInput = document.getElementById("valorPersonalizado");
    var bonusMsg = document.getElementById("bonusRecargaMsg");

    function atualizarBonusDisplay() {
      if (!bonusMsg || !window.__pandaOpcoesRecarga) return;
      var val = parseFloat(String(valorInput.value).replace(",", ".")) || 0;
      var op = window.__pandaOpcoesRecarga.find(function (o) {
        return Math.abs(o.valor - val) < 0.01;
      });
      if (op && op.bonus > 0) {
        bonusMsg.textContent =
          "🎁 Você ganha R$ " + op.bonus.toFixed(2).replace(".", ",") + " de bônus!";
        bonusMsg.style.display = "block";
      } else {
        bonusMsg.style.display = "none";
        bonusMsg.textContent = "";
      }
    }
    if (valorInput) {
      valorInput.addEventListener("input", atualizarBonusDisplay);
      valorInput.addEventListener("blur", atualizarBonusDisplay);
    }
  }

  function fillWinnerFeedRecarga() {
    var track = document.getElementById("winnerFeedTrackRecarga");
    if (!track) return;
    var nomes = [
      "mar***osa",
      "cam***ira",
      "lea***",
      "pau***",
      "rod***ues",
      "ana***ira",
      "ped***elo",
      "jul***ima",
      "fer***des",
      "luc***tos",
      "raf***ira",
      "bru***ves",
      "gui***rme",
      "pat***cia",
      "dan***tos",
      "tha***ara",
      "leo***dro",
      "bia***a",
      "gab***la",
      "ric***do",
      "car***nos",
      "vit***ria",
      "and***ra",
      "jos***va",
    ];

    function randomItem() {
      var valor = Math.round((Math.random() * (500 - 20) + 20) * 100) / 100;
      var nome = nomes[Math.floor(Math.random() * nomes.length)];
      return (
        '<span class="winner-feed-item"><span class="valor shimmer-text">R$ ' +
        valor.toFixed(2).replace(".", ",") +
        '</span> <span class="user">' +
        nome +
        '</span> <span class="ganhou">SACOU</span></span>'
      );
    }
    var html = "";
    for (var i = 0; i < 80; i++) html += randomItem() + " ";
    track.innerHTML = html + html;
  }

  /** Ao clicar em um card de valor, atualiza o campo "Valor Personalizado", marca o card e exibe o bônus. */
  function selecionarValorRecarga(valor, bonus) {
    const valorInput = document.getElementById("valorPersonalizado");
    const v = parseFloat(valor);
    const b = typeof bonus === "number" ? bonus : 0;
    if (valorInput && !Number.isNaN(v)) {
      valorInput.value = v.toFixed(2);
    }
    document.querySelectorAll(".modalRecargaBtn").forEach(function (btn) {
      btn.classList.toggle("active", parseFloat(btn.getAttribute("data-valor")) === v);
    });
    var bonusMsg = document.getElementById("bonusRecargaMsg");
    if (bonusMsg) {
      if (b > 0) {
        bonusMsg.textContent = "🎁 Você ganha R$ " + b.toFixed(2).replace(".", ",") + " de bônus!";
        bonusMsg.style.display = "block";
      } else {
        bonusMsg.style.display = "none";
        bonusMsg.textContent = "";
      }
    }
  }
  if (typeof window !== "undefined") {
    window.selecionarValorRecarga = selecionarValorRecarga;
    window.processarValorPersonalizado = processarValorPersonalizado;
  }

  async function processarValorPersonalizado() {
    const valorInput = document.getElementById("valorPersonalizado");
    const valorStr =
      valorInput && valorInput.value ? String(valorInput.value).replace(",", ".") : "";
    const valor = parseFloat(valorStr);
    var minDeposit = 10;
    if (typeof getDepositConfig === "function") {
      try {
        var cfg = await getDepositConfig();
        if (cfg && (cfg.min_deposit != null || (cfg.data && cfg.data.min_deposit != null)))
          minDeposit = Number(cfg.min_deposit || (cfg.data && cfg.data.min_deposit)) || 10;
      } catch (e) {}
    }
    var msgEl = document.getElementById("minDepositMsg");
    if (!valor || valor < minDeposit) {
      if (msgEl) {
        msgEl.textContent = "Depósito mínimo: R$ " + minDeposit.toFixed(2).replace(".", ",");
        msgEl.style.display = "block";
      }
      return;
    }
    if (msgEl) {
      msgEl.style.display = "none";
      msgEl.textContent = "";
    }
    gerarQRCodePix(valor);
  }

  async function gerarQRCodePix(valor) {
    const modalContent = document.getElementById("modalContent");

    // Mostrar loading inicial
    modalContent.innerHTML = `
            <div class="modalBox">
              <img src="panda_top.png" alt="Panda" class="pandaTop" />
              <div class="resultCard">
                <span class="resultLabel">GERANDO PIX</span>
                <div style="margin: 30px 0;">
                  <div style="width: 40px; height: 40px; border: 4px solid #ffffff; border-top: 4px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                  <p style="margin-top: 15px; font-size: 16px;">Aguarde, gerando QR Code...</p>
                </div>
              </div>
            </div>
        `;

    try {
      // Chama a API de depósito (hk22 / api.php)
      const result = await createDeposit({
        amount: valor,
        card_id: 0,
      });

      // --- CORREÇÃO AQUI: Acessando a chave 'data' que vem do PHP ---
      const resData = result.data || result;

      if (!result.success || !resData.qrcode) {
        throw new Error(result.error || resData.error || "Erro ao gerar PIX no servidor");
      }

      // Envia os dados extraídos para a exibição
      mostrarQRCode({
        qr_code_text: resData.qrcode,
        qrCodeImage: resData.qrCodeImage,
        amount: valor,
        transactionId: resData.transactionId,
      });
    } catch (error) {
      console.error("Erro detalhado:", error);

      modalContent.innerHTML = `
              <div class="modalBox">
                <img src="panda_top.png" alt="Panda" class="pandaTop" />
                <div class="resultCard">
                  <span class="resultLabel">ERRO NO PAGAMENTO</span>
                  <p style="font-size: 16px; color: #fff; margin: 20px 0; line-height: 1.4;">
                    ${error.message}
                  </p>
                  <div style="margin: 20px 0;">
                    <button onclick="location.reload()" style="background: #16a34a; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer;">Tentar Novamente</button>
                  </div>
                </div>
              </div>
            `;
    }
  }

  function mostrarQRCode(pixData) {
    const modalContent = document.getElementById("modalContent");

    // Se a API não mandar imagem, usamos o fallback do qrserver
    const qrCodeUrl =
      pixData.qrCodeImage ||
      `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pixData.qr_code_text)}`;
    const valorFormatado = (pixData.amount || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    });

    modalContent.innerHTML = `
            <div class="modalBox modalGanhou">
              <div class="resultCard modalGanhouCard modalPixCard">
                <div class="modalGanhouLabel">PAGUE COM PIX</div>
                <p class="modalRecargaSubtitle" style="margin-bottom: 1rem;">
                  Valor: <strong><span class="shimmer-text">R$ ${valorFormatado}</span></strong>
                </p>
                <div class="modalPixQrBox">
                  <img src="${qrCodeUrl}" alt="QR Code PIX" class="modalPixQrImg" />
                </div>
                <div class="modalPixCodigoWrap">
                  <textarea id="codigoPix" readonly class="modalPixTextarea">${pixData.qr_code_text}</textarea>
                  <button type="button" id="copiarCodigoPix" class="modalGanhouBtnSaque modalPixBtnCopiar">
                    📋 Copiar Código PIX
                  </button>
                </div>
                <div class="modalPixAviso">
                  <p style="margin: 0; font-size: 0.8125rem; color: #dcfce7; text-align: center;">
                    ⏰ O saldo cai automaticamente após o pagamento.
                  </p>
                </div>
                <button type="button" id="voltarRecargaFinal" class="modalPixBtnVoltarPequeno">Voltar</button>
              </div>
            </div>
        `;

    // Lógica de copiar para o clipboard
    document.getElementById("copiarCodigoPix").onclick = () => {
      const textarea = document.getElementById("codigoPix");
      const btn = document.getElementById("copiarCodigoPix");
      const link = textarea ? textarea.value : "";

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(link)
          .then(() => {
            if (btn) btn.textContent = "✅ Copiado!";
            setTimeout(() => {
              if (btn) btn.textContent = "📋 Copiar Código PIX";
            }, 2000);
          })
          .catch(() => {
            // Fallback
            if (textarea) {
              textarea.select();
              textarea.setSelectionRange(0, 99999);
              document.execCommand("copy");
              if (btn) btn.textContent = "✅ Copiado!";
              setTimeout(() => {
                if (btn) btn.textContent = "📋 Copiar Código PIX";
              }, 2000);
            }
          });
      } else if (textarea) {
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        document.execCommand("copy");
        if (btn) btn.textContent = "✅ Copiado!";
        setTimeout(() => {
          if (btn) btn.textContent = "📋 Copiar Código PIX";
        }, 2000);
      }
    };

    document.getElementById("voltarRecargaFinal").onclick = () => location.reload();

    // --- MONITORAMENTO EM TEMPO REAL (Polling) ---
    if (pixData.transactionId && typeof getDepositStatus === "function") {
      const pollingInterval = setInterval(async () => {
        try {
          const st = await getDepositStatus(pixData.transactionId);
          // Checa status na raiz ou dentro de data
          const currentStatus = (st.data && st.data.status) || st.status;

          if (currentStatus === "completed" || currentStatus === "paid") {
            clearInterval(pollingInterval);
            modalContent.innerHTML = `
                            <div class="modalBox">
                                <div class="resultCard" style="background:#16a34a">
                                    <div style="font-size:40px">✅</div>
                                    <p style="font-weight:bold;">PAGAMENTO RECEBIDO!</p>
                                    <p>Seu saldo já foi atualizado.</p>
                                </div>
                            </div>
                        `;
            setTimeout(() => location.reload(), 2500);
          }
        } catch (e) {
          console.log("Aguardando pagamento...");
        }
      }, 3000); // Checa a cada 3 segundos
    }
  }

  function confirmarPagamento() {
    // Limpar localStorage para permitir novo jogo no modo hardcore
    localStorage.removeItem("jaJogouPanda");
    localStorage.removeItem("saldoFinal");

    window.location.href = "/freegame?panda=hardcore";
  }

  function reiniciarJogo() {
    // Limpar todo o localStorage
    localStorage.removeItem("jaJogouPanda");
    localStorage.removeItem("saldoFinal");
    localStorage.removeItem("valorSaqueEscolhido");

    window.location.href = "/freegame";
  }

  function getBonusByValue(valor) {
    if (valor >= 30) return 200;
    if (valor >= 25) return 150;
    return 100;
  }

  function mostrarNotificacaoFake() {
    const mensagens = [
      "✅ Paula fez uma recarga de R$19,90",
      "💸 Maria realizou o saque de R$250,00",
      "🔥 Lucas desbloqueou o modo bônus",
      "✅ Renata recarregou R$30,00 e liberou o saque",
      "💸 Thiago sacou R$180,00 com sucesso",
      "🚀 Ana ativou o saque imediato",
      "🎉 João ganhou R$90,00 em 2 minutos",
    ];

    const msg = mensagens[Math.floor(Math.random() * mensagens.length)];

    const toast = document.createElement("div");
    toast.className = "toast-notificacao";
    toast.innerText = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  setInterval(mostrarNotificacaoFake, 7000);

  var ctaSaqueEl = document.getElementById("ctaSaqueTopo");
  if (ctaSaqueEl) {
    ctaSaqueEl.onclick = function () {
      if (!ctaSaqueEl.classList.contains("disabled")) endGame();
    };
  }

  // Carregar saldo (só se logado) e dificuldade ao iniciar (Vue: executa se DOM já estiver pronto)
  async function _pandaOnLoad() {
    const modalAuth = document.getElementById("modalAuth");
    const modalInicio = document.getElementById("modalInicio");

    function esconderLoadingMostrar(mostrarAuth) {
      if (modalAuth) modalAuth.style.display = mostrarAuth ? "flex" : "none";
      if (modalInicio) modalInicio.style.display = mostrarAuth ? "none" : "flex";

      // Corrige efeito colateral do z-index 1001: esconde menu e saldo na tela de login/cadastro
      var btnMenuTopo = document.getElementById("btnMenuTopo");
      var saldoEl = document.getElementById("saldo");
      if (btnMenuTopo) {
        btnMenuTopo.style.display = mostrarAuth ? "none" : "inline-block";
      }
      if (saldoEl) {
        saldoEl.style.display = mostrarAuth ? "none" : "inline-block";
      }
    }

    try {
      if (isFreeGame) {
        dificuldade = "facil"; // Rodada grátis sempre no modo fácil
        window.pandaModoNome = getModoNomeAleatorio();
        atualizarModoNomeNoFront();
        var btnMenuTopo = document.getElementById("btnMenuTopo");
        if (btnMenuTopo) btnMenuTopo.style.display = "inline-block";
        if (timerEl) timerEl.style.display = "inline-block";
      } else if (isLoginPage) {
        // Na tela de login não chamar getBalance/getPandaConfig (evita requisição que retorna "Não autenticado")
        if (modalAuth) modalAuth.style.display = "flex";
        if (modalInicio) modalInicio.style.display = "none";
        var btnMenuTopo = document.getElementById("btnMenuTopo");
        if (btnMenuTopo) btnMenuTopo.style.display = "none";
      } else {
        if (typeof getBalance === "function") {
          const res = await getBalance();
          if (res.success && res.data != null) {
            balanceFromApi = res.data.balance;
            window.balanceFromApi = res.data.balance;
            if (saldoEl)
              saldoEl.innerText =
                "Saldo: R$ " + Number(res.data.balance).toFixed(2).replace(".", ",");
            // Vue já controla os modais quando autenticado; só força exibição se ainda não tiver decidido
            if (!window.__pandaAuthChecked) esconderLoadingMostrar(false);
            // Saldo menor que 1: exibir modal de depósito (HorsePay)
            if (Number(res.data.balance) < 1 && typeof showRechargeModal === "function") {
              setTimeout(function () {
                showRechargeModal(function () {
                  location.reload();
                });
              }, 500);
            }
          } else {
            esconderLoadingMostrar(true); // não logado: mostrar login
          }
        } else {
          esconderLoadingMostrar(true);
        }
        if (typeof getPandaConfig === "function") {
          const cfg = await getPandaConfig();
          if (cfg.success && cfg.data) {
            var d = difficultyFromConfig(cfg);
            if (d) dificuldade = d;
            window.pandaModoNome = getModoNomeAleatorio();
            atualizarModoNomeNoFront();
            applyPandaConfigData(cfg.data);
            if (typeof cfg.data.min_bet === "number") window.pandaMinBet = cfg.data.min_bet;
            if (typeof cfg.data.max_bet === "number") window.pandaMaxBet = cfg.data.max_bet;
            if (typeof cfg.data.withdraw_multiplier === "number")
              window.pandaWithdrawMultiplier = cfg.data.withdraw_multiplier;

            const inp = document.getElementById("valorAposta");
            if (inp) {
              if (typeof cfg.data.min_bet === "number") inp.min = cfg.data.min_bet;
              if (typeof cfg.data.max_bet === "number") inp.max = cfg.data.max_bet;
              if (typeof cfg.data.min_bet === "number" && !inp.value)
                inp.placeholder = cfg.data.min_bet.toFixed(2).replace(".", ",");
            }
          }
        }
        atualizarModoNomeNoFront();
      }
    } catch (e) {
      esconderLoadingMostrar(true); // em caso de erro, mostrar login
    }
  }
  if (document.readyState === "complete") {
    setTimeout(_pandaOnLoad, 0);
  } else {
    window.addEventListener("load", _pandaOnLoad);
  }
  // O frontend pai entrega a sessão depois que o iframe termina de carregar.
  // Nesse momento, repetir a inicialização evita exibir o login duplicado.
  window.addEventListener("pandapix:session-ready", function () {
    window.__pandaAuthChecked = true;
    _pandaOnLoad();
  });

  /** Chamado pela GameView quando o usuário vem do login: atualiza saldo e config (game.js já carregado, _pandaOnLoad não roda de novo). */
  window.__pandaRefreshBalanceAndConfig = async function () {
    if (isFreeGame) return;
    if (typeof getBalance !== "function") return;
    try {
      const res = await getBalance();
      if (res && res.success && res.data != null) {
        balanceFromApi = res.data.balance;
        window.balanceFromApi = res.data.balance;
        var el = document.getElementById("saldo");
        if (el) el.innerText = "Saldo: R$ " + Number(res.data.balance).toFixed(2).replace(".", ",");
        if (Number(res.data.balance) < 1 && typeof showRechargeModal === "function") {
          showRechargeModal(function () {
            location.reload();
          });
        }
      }
      if (typeof getPandaConfig === "function") {
        const cfg = await getPandaConfig();
        if (cfg && cfg.success && cfg.data) {
          var d = difficultyFromConfig(cfg);
          if (d) dificuldade = d;
          window.pandaModoNome = getModoNomeAleatorio();
          atualizarModoNomeNoFront();
          applyPandaConfigData(cfg.data);
          if (typeof cfg.data.min_bet === "number") window.pandaMinBet = cfg.data.min_bet;
          if (typeof cfg.data.max_bet === "number") window.pandaMaxBet = cfg.data.max_bet;
          if (typeof cfg.data.withdraw_multiplier === "number")
            window.pandaWithdrawMultiplier = cfg.data.withdraw_multiplier;

          const inp = document.getElementById("valorAposta");
          if (inp) {
            if (typeof cfg.data.min_bet === "number") inp.min = cfg.data.min_bet;
            if (typeof cfg.data.max_bet === "number") inp.max = cfg.data.max_bet;
            if (typeof cfg.data.min_bet === "number" && !inp.value)
              inp.placeholder = cfg.data.min_bet.toFixed(2).replace(".", ",");
          }
        }
      }
    } catch (_) {}
  };

  // ----- Modal Login / Cadastro (banner + telefone + senha) – só em panda.html -----
  (function initModalAuth() {
    // Inicialização do menu superior - movido para fora do bloqueio do isFreeGame
    var btnMenuTopo = document.getElementById("btnMenuTopo");
    var menuTopoDropdown = document.getElementById("menuTopoDropdown");
    if (btnMenuTopo && menuTopoDropdown) {
      function toggleMenu(e) {
        e.stopPropagation();
        var open = menuTopoDropdown.style.display === "flex";
        menuTopoDropdown.style.display = open ? "none" : "flex";
        btnMenuTopo.setAttribute("aria-expanded", open ? "false" : "true");
      }
      btnMenuTopo.onclick = toggleMenu;
      btnMenuTopo.ontouchstart = toggleMenu;

      document.addEventListener("click", function () {
        if (menuTopoDropdown) {
          menuTopoDropdown.style.display = "none";
          btnMenuTopo.setAttribute("aria-expanded", "false");
        }
      });
      menuTopoDropdown.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      menuTopoDropdown.addEventListener("touchstart", function (e) {
        e.stopPropagation();
      });
    }
    var menuTopoDeposito = document.getElementById("menuTopoDeposito");
    var menuTopoSaque = document.getElementById("menuTopoSaque");
    var menuTopoSair = document.getElementById("menuTopoSair");
    if (menuTopoDeposito)
      menuTopoDeposito.onclick = function () {
        menuTopoDropdown.style.display = "none";
        showRechargeModal(() => location.reload());
      };
    if (menuTopoSaque)
      menuTopoSaque.onclick = async function () {
        menuTopoDropdown.style.display = "none";
        const res = await getBalance();
        if (res.success && res.data != null) {
          showWithdrawAmountModal(Number(res.data.balance) || 0, () => location.reload());
        } else {
          alert("Não foi possível carregar o saldo.");
        }
      };
    if (menuTopoSair)
      menuTopoSair.onclick = async function () {
        menuTopoDropdown.style.display = "none";
        if (typeof logout === "function") {
          try {
            await logout();
          } catch (e) {}
          window.location.reload();
        } else if (typeof window.__pandaSair === "function") {
          window.__pandaSair();
        } else {
          window.location.reload();
        }
      };
    var menuTopoAfiliados = document.getElementById("menuTopoAfiliados");
    if (menuTopoAfiliados)
      menuTopoAfiliados.onclick = function () {
        menuTopoDropdown.style.display = "none";
        showAfiliadosModal();
      };
    var menuTopoHistorico = document.getElementById("menuTopoHistorico");
    if (menuTopoHistorico)
      menuTopoHistorico.onclick = function () {
        menuTopoDropdown.style.display = "none";
        showHistoricoModal();
      };

    if (isFreeGame) return;
    const modalAuth = document.getElementById("modalAuth");
    const modalInicio = document.getElementById("modalInicio");
    const formLogin = document.getElementById("formLogin");
    const formRegister = document.getElementById("formRegister");
    const errEl = document.getElementById("modalAuthError");
    const tabs = document.querySelectorAll(".modalAuthTab");

    // Capturar ref da URL (?ref=CODE) para indicação de afiliado e guardar para o cadastro
    try {
      var refParams = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search || "" : "",
      );
      var refCode = refParams.get("ref");
      if (refCode && String(refCode).trim()) {
        sessionStorage.setItem("panda_affiliate_ref", String(refCode).trim());
      }
    } catch (e) {}

    /** Formata o valor do input como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX */
    function formatPhoneInput(input) {
      if (!input) return;
      let v = input.value.replace(/\D/g, "").slice(0, 11);
      if (v.length <= 2) {
        input.value = v ? "(" + v : "";
      } else if (v.length <= 7) {
        input.value = "(" + v.slice(0, 2) + ") " + v.slice(2);
      } else {
        input.value = "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7);
      }
    }

    function showError(msg) {
      if (!errEl) return;
      errEl.textContent = msg || "";
      errEl.style.display = msg ? "block" : "none";
    }

    /** balanceData: { balance } opcional, vindo de getBalance() após login/cadastro (front puxa saldo logo após auth). */
    function showInicio(balanceData) {
      if (typeof window.__pandaOnLoginSuccess === "function") {
        window.__pandaOnLoginSuccess(
          balanceData && balanceData.balance != null ? balanceData.balance : null,
        );
        return;
      }
      if (modalAuth) modalAuth.style.display = "none";
      var btnMenuTopo = document.getElementById("btnMenuTopo");
      if (btnMenuTopo) btnMenuTopo.style.display = "inline-block";
      if (modalInicio) {
        modalInicio.style.display = "flex";
        if (typeof window.applyJaJogouInicio === "function") window.applyJaJogouInicio();
      }
    }

    if (tabs.length) {
      tabs.forEach((tab) => {
        tab.addEventListener("click", function () {
          const t = this.getAttribute("data-tab");
          tabs.forEach((x) => x.classList.remove("active"));
          this.classList.add("active");
          if (t === "login") {
            if (formLogin) formLogin.style.display = "flex";
            if (formRegister) formRegister.style.display = "none";
          } else {
            if (formLogin) formLogin.style.display = "none";
            if (formRegister) formRegister.style.display = "flex";
          }
          showError("");
        });
      });
    }

    const telLogin = document.getElementById("authTelefoneLogin");
    const telRegister = document.getElementById("authTelefoneRegister");
    if (telLogin)
      telLogin.addEventListener("input", function () {
        formatPhoneInput(this);
      });
    if (telRegister)
      telRegister.addEventListener("input", function () {
        formatPhoneInput(this);
      });

    if (formLogin) {
      formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = formLogin.querySelector('button[type="submit"]');
        if (submitBtn && submitBtn.disabled) return;
        if (submitBtn) submitBtn.disabled = true;

        const tel = (document.getElementById("authTelefoneLogin") || {}).value
          .trim()
          .replace(/\D/g, "");
        const senha = (document.getElementById("authSenhaLogin") || {}).value;
        if (!tel || !senha) {
          showError("Preencha celular e senha.");
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        showError("");
        try {
          const res = await login(
            tel.length >= 10 ? tel : document.getElementById("authTelefoneLogin").value.trim(),
            senha,
          );
          if (!res.success) {
            showError(res.error || "Erro ao entrar.");
            if (submitBtn) submitBtn.disabled = false;
            return;
          }
          var bal = null;
          try {
            bal = await getBalance();
            if (bal && bal.success && bal.data != null) {
              balanceFromApi = bal.data.balance;
              window.balanceFromApi = bal.data.balance;
            }
          } catch (_) {}
          showInicio(bal && bal.success && bal.data ? bal.data : null);
        } catch (err) {
          showError(err.message || "Erro ao entrar.");
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    if (formRegister) {
      formRegister.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = formRegister.querySelector('button[type="submit"]');
        if (submitBtn && submitBtn.disabled) return;
        if (submitBtn) submitBtn.disabled = true;

        const nome = (document.getElementById("authNomeRegister") || {}).value.trim();
        const tel = (document.getElementById("authTelefoneRegister") || {}).value
          .trim()
          .replace(/\D/g, "");
        const cpf = (document.getElementById("authCpfRegister") || {}).value
          .trim()
          .replace(/\D/g, "");
        const senha = (document.getElementById("authSenhaRegister") || {}).value;
        if (!nome) {
          showError("Informe seu nome.");
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        if (!tel || tel.length < 10 || tel.length > 11) {
          showError("Celular inválido (10 ou 11 dígitos).");
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        if (!senha || senha.length < 6) {
          showError("Senha com mínimo 6 caracteres.");
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        showError("");
        var affiliateCode = "";
        try {
          affiliateCode = sessionStorage.getItem("panda_affiliate_ref") || "";
        } catch (e) {}
        try {
          const res = await register(tel, senha, nome, affiliateCode || undefined, cpf);
          if (!res.success) {
            showError(res.error || "Erro ao cadastrar.");
            if (submitBtn) submitBtn.disabled = false;
            return;
          }
          try {
            sessionStorage.removeItem("panda_affiliate_ref");
          } catch (e) {}
          var bal = null;
          try {
            bal = await getBalance();
            if (bal && bal.success && bal.data != null) {
              balanceFromApi = bal.data.balance;
              window.balanceFromApi = bal.data.balance;
            }
          } catch (_) {}
          showInicio(bal && bal.success && bal.data ? bal.data : null);
        } catch (err) {
          showError(err.message || "Erro ao cadastrar.");
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    // Botões Depósito e Saque no modal de início (acima da logo)
    const btnDepositoInicio = document.getElementById("btnDepositoInicio");
    const btnSaqueInicio = document.getElementById("btnSaqueInicio");
    if (btnDepositoInicio) {
      btnDepositoInicio.onclick = () => showRechargeModal(() => location.reload());
    }
    if (btnSaqueInicio) {
      btnSaqueInicio.onclick = async () => {
        const res = await getBalance();
        if (res.success && res.data != null) {
          const saldoAtual = Number(res.data.balance) || 0;
          showWithdrawAmountModal(saldoAtual, () => location.reload());
        } else {
          alert("Não foi possível carregar o saldo.");
        }
      };
    }
  })();
})();

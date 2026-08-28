/*
 * Ponte entre o jogo (client-side) e o backend do PandaPix.
 * Mantém as mesmas assinaturas globais que o game.js original espera.
 * O jogo roda em iframe de mesma origem, então lê o token do Supabase
 * direto do localStorage do app.
 */
(function () {
  "use strict";

  var sessionToken = null;

  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin) return;
    if (event.data && event.data.type === "pandapix:session") {
      sessionToken = event.data.access_token || null;
      window.dispatchEvent(new CustomEvent("pandapix:session-ready"));
    }
  });

  function requestParentSession() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "pandapix:ready" }, window.location.origin);
    }
  }

  // O pai pode montar o iframe antes de terminar a hidratação. Repetir o
  // handshake evita que o jogo caia no fallback legado de autenticação.
  requestParentSession();
  setTimeout(requestParentSession, 250);
  setTimeout(requestParentSession, 1000);

  // A sessão pertence exclusivamente ao frontend pai. O iframe nunca lê
  // localStorage nem mantém uma segunda autenticação.
  function getToken() {
    return sessionToken;
  }

  function waitForSession(timeoutMs) {
    if (sessionToken) return Promise.resolve(sessionToken);
    return new Promise(function (resolve) {
      var settled = false;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        window.removeEventListener("pandapix:session-ready", onReady);
        resolve(null);
      }, timeoutMs || 4000);
      function onReady() {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        window.removeEventListener("pandapix:session-ready", onReady);
        resolve(sessionToken);
      }
      window.addEventListener("pandapix:session-ready", onReady);
      requestParentSession();
    });
  }

  // Exposto apenas como estado booleano para o jogo decidir quando iniciar.
  // O token nunca é exposto ao DOM nem persistido pelo iframe.
  window.__pandaHasParentSession = function () {
    return Boolean(sessionToken);
  };

  async function call(path, options) {
    var opts = options || {};
    var token = await waitForSession();
    var headers = { "content-type": "application/json" };
    if (token) headers["authorization"] = "Bearer " + token;

    var res = await fetch(path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: "same-origin",
    });

    var json;
    try {
      json = await res.json();
    } catch (e) {
      json = { success: false, error: "Resposta inválida do servidor" };
    }
    if (!res.ok || json.success === false) {
      throw new Error(json.error || "Erro na requisição");
    }

    // Os endpoints atuais retornam os campos diretamente no JSON, enquanto o
    // game.js legado lê também a forma { success, data }. Mantemos as duas
    // formas durante a migração para evitar saldo/configuração indefinidos.
    if (json.data == null) {
      json.data = json;
    }
    return json;
  }

  function notifyBalance(data) {
    try {
      window.parent.postMessage(
        { type: "pandapix:balance", saldo: data.saldo, saldo_bonus: data.saldo_bonus },
        window.location.origin,
      );
    } catch (e) {
      /* ignora */
    }
  }

  var currentSession = null;

  window.getPandaConfig = function () {
    return call("/api/game/config");
  };

  window.getBalance = function () {
    return call("/api/game/balance").then(function (data) {
      notifyBalance(data);
      return data;
    });
  };

  window.pandaBet = function (aposta, demo) {
    return call("/api/game/bet", {
      method: "POST",
      body: { aposta: Number(aposta), demo: !!demo },
    }).then(function (data) {
      currentSession = data.session_id;
      notifyBalance(data);
      return data;
    });
  };

  window.pandaResult = function (ganho, resultado, extra) {
    var sessionId = (extra && extra.session_id) || currentSession;
    if (!sessionId) return Promise.reject(new Error("Rodada não iniciada"));
    return call("/api/game/result", {
      method: "POST",
      body: {
        session_id: sessionId,
        ganho: Number(ganho) || 0,
        resultado: resultado || undefined,
        data: extra && extra.data ? extra.data : undefined,
      },
    }).then(function (data) {
      currentSession = null;
      notifyBalance(data);
      return data;
    });
  };

  // Fluxos que já existem no app (o jogador usa as telas do PandaPix).
  function goToApp(path) {
    try {
      window.parent.location.href = path;
    } catch (e) {
      window.location.href = path;
    }
  }

  window.createDeposit = function () {
    goToApp("/deposito");
    return Promise.resolve({ success: true, redirected: true });
  };
  window.getDepositStatus = function () {
    return Promise.resolve({ success: true, status: "pending" });
  };
  window.createWithdraw = function () {
    goToApp("/saque");
    return Promise.resolve({ success: true, redirected: true });
  };
  window.getAffiliateStats = function () {
    goToApp("/afiliado");
    return Promise.resolve({ success: true, redirected: true });
  };
  window.getHistory = function () {
    goToApp("/painel");
    return Promise.resolve({ success: true, redirected: true });
  };
})();

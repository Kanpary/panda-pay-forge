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
    }
  });

  window.parent.postMessage({ type: "pandapix:ready" }, window.location.origin);

  function getToken() {
    if (sessionToken) return sessionToken;
    try {
      var store =
        window.parent && window.parent !== window
          ? window.parent.localStorage
          : window.localStorage;
      for (var i = 0; i < store.length; i++) {
        var key = store.key(i);
        if (key && key.indexOf("-auth-token") !== -1) {
          var raw = JSON.parse(store.getItem(key));
          if (raw && raw.access_token) return raw.access_token;
        }
      }
    } catch (e) {
      /* origem diferente ou storage bloqueado */
    }
    return null;
  }

  async function call(path, options) {
    var opts = options || {};
    var token = getToken();
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

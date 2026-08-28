/**
 * Cliente da API do backend local.
 * Usa o mesmo domínio da página atual para manter sessão e banco consistentes.
 */
const API_BASE = window.location.origin;

let _csrfToken = null;

/**
 * Obtém o token CSRF (necessário para POST/PUT/DELETE).
 */
async function getCsrfToken() {
    if (_csrfToken) return _csrfToken;
    const res = await fetch(`${API_BASE}/api.php?route=csrf`, {
        credentials: 'include'
    });
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error('API retornou não-JSON (possível erro PHP):', text.slice(0, 200));
        throw new Error('Servidor indisponível. Verifique a conexão com o banco de dados.');
    }
    if (data && data.data && data.data.token) {
        _csrfToken = data.data.token;
        return _csrfToken;
    }
    throw new Error(data && data.error ? data.error : 'Não foi possível obter o token de segurança.');
}

/**
 * Faz requisição à API com credenciais e CSRF.
 */
async function apiRequest(path, options = {}) {
    const url = path.startsWith('http') ? path : `${API_BASE}/api.php?route=${path}`;
    const method = (options.method || 'GET').toUpperCase();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (['POST', 'PUT', 'DELETE'].includes(method)) {
        const token = await getCsrfToken();
        headers['X-CSRF-Token'] = token;
    }

    const res = await fetch(url, {
        ...options,
        method,
        headers,
        credentials: 'include',
    });

    const text = await res.text();
    let json;
    try {
        json = text ? JSON.parse(text) : {};
    } catch (e) {
        if (res.status !== 401) console.error('API retornou não-JSON:', text.slice(0, 200));
        return {
            success: false,
            error: 'Erro na resposta do servidor. Verifique o arquivo api.php.'
        };
    }
    if (!res.ok) {
        return {
            success: false,
            error: json.error || json.message || 'Erro na requisição'
        };
    }
    return {
        success: true,
        data: json.data || json, // Extrai o conteúdo de "data" se existir
        raw: json
    };
}

/** --- FUNÇÕES DE AUTENTICAÇÃO --- */

async function login(telefoneOuEmail, senha) {
    const res = await apiRequest('auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email: telefoneOuEmail,
            senha
        }),
    });
    
    // CORREÇÃO: Força o reload para atualizar o saldo e botões da tela
    if (res.success) {
        window.location.reload();
    }
    
    return res;
}

async function register(telefone, senha, nomeCompleto, affiliateCode, cpf) {
    const body = {
        telefone,
        senha,
        nome_completo: nomeCompleto || 'Jogador',
        cpf: cpf || ''
    };
    if (affiliateCode && String(affiliateCode).trim()) {
        body.affiliate_code = String(affiliateCode).trim();
    }
    
    const res = await apiRequest('auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    
    // CORREÇÃO: Força o reload após criar conta com sucesso
    if (res.success) {
        window.location.reload();
    }
    
    return res;
}

async function logout() {
    const res = await apiRequest('auth/logout', { method: 'POST' });
    
    // CORREÇÃO: Força o reload para limpar o saldo e voltar a ser visitante
    if (res.success) {
        window.location.reload();
    }
    
    return res;
}

/** --- FUNÇÕES DO JOGO --- */

async function getPandaConfig() {
    return apiRequest('game/panda-config');
}

async function pandaBet(amount) {
    return apiRequest('game/panda-bet', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount) }),
    });
}

async function pandaResult(winAmount, betAmount, options) {
    const body = { 
        win_amount: Number(winAmount),
        game_session_id: options && options.game_session_id ? options.game_session_id : null
    };
    if (betAmount != null && Number(betAmount) >= 0) body.bet_amount = Number(betAmount);
    if (options && options.loss_after_meta === true) body.loss_after_meta = true;
    if (options && options.loss_credited_amount != null && Number(options.loss_credited_amount) > 0) body.loss_credited_amount = Number(options.loss_credited_amount);
    return apiRequest('game/panda-result', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

async function getBalance() {
    return apiRequest('user/balance');
}

/** --- FINANCEIRO (DEPÓSITOS E SAQUES) --- */

async function createWithdraw(payload) {
    return apiRequest('withdraw/create', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

async function createDeposit(payload) {
    const res = await apiRequest('deposit/create', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    
    if (!res.success) return res;

    // Acessa os dados processados pelo apiRequest
    const data = res.data || {}; 
    
    return {
        success: true,
        qrcode: data.qrcode,
        qrCodeImage: data.qrCodeImage,
        transactionId: data.transactionId,
        message: data.message,
    };
}

async function getDepositStatus(transactionId) {
    return apiRequest(`deposit/status&transaction_id=${encodeURIComponent(transactionId)}`);
}

async function getDepositCards() {
    return apiRequest('deposit/cards');
}

async function getDepositConfig() {
    return apiRequest('deposit/config');
}

/** --- AFILIADOS E HISTÓRICO --- */

async function getAffiliateStats(period) {
    const p = period || 'all';
    return apiRequest(`affiliate/stats&period=${encodeURIComponent(p)}`);
}

async function createAffiliateWithdraw(payload) {
    return apiRequest('affiliate/withdraw', {
        method: 'POST',
        body: JSON.stringify({
            amount: Number(payload.amount),
            pix_key: String(payload.pix_key || '').trim(),
            pix_type: String(payload.pix_type || 'CPF').toUpperCase(),
        }),
    });
}

async function getHistoryDeposits(page) {
    return apiRequest(`history/deposits?page=${page || 1}`);
}

async function getHistoryWithdrawals(page) {
    return apiRequest(`history/withdrawals?page=${page || 1}`);
}

async function getHistoryGames(page) {
    return apiRequest(`history/games?page=${page || 1}`);
}

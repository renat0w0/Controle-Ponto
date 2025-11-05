// http.js - Cliente HTTP centralizado com retry, cache e interceptors

/**
 * Cliente HTTP com funcionalidades avançadas:
 * - Retry automático em caso de falha
 * - Cache de requisições com TTL
 * - Interceptors de request/response
 * - Gerenciamento automático de token
 * - Timeout configurável
 */
class APIClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || 'https://main.idsecure.com.br:5000/api/v1';
        this.timeout = config.timeout || 30000; // 30s
        this.retries = config.retries || 3;
        this.retryDelay = config.retryDelay || 1000; // 1s
        
        // Cache em memória (Map = mais rápido que Object)
        this.cache = new Map();
        this.cacheTTL = config.cacheTTL || 5 * 60 * 1000; // 5min
        
        // Interceptors (hooks antes/depois da requisição)
        this.interceptors = {
            request: [],
            response: []
        };
    }

    /**
     * Adicionar interceptor de request
     * @param {Function} fn - (config) => config
     */
    addRequestInterceptor(fn) {
        this.interceptors.request.push(fn);
    }

    /**
     * Adicionar interceptor de response
     * @param {Function} fn - (response) => response
     */
    addResponseInterceptor(fn) {
        this.interceptors.response.push(fn);
    }

    /**
     * Obter token do storage
     */
    getToken() {
        return Storage?.auth.getToken() || localStorage.getItem('cp_apiToken');
    }

    /**
     * Criar AbortController com timeout
     */
    createAbortController() {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), this.timeout);
        return controller;
    }

    /**
     * Gerar chave de cache baseada em URL + params
     */
    getCacheKey(url, options) {
        const method = options.method || 'GET';
        const body = options.body || '';
        return `${method}:${url}:${body}`;
    }

    /**
     * Obter do cache se válido
     */
    getFromCache(key) {
        if (!this.cache.has(key)) return null;
        
        const cached = this.cache.get(key);
        const now = Date.now();
        
        // Verificar se expirou
        if (now - cached.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    /**
     * Salvar no cache
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Limpar cache expirado
     */
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTTL) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Requisição com retry automático
     */
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') 
            ? endpoint 
            : `${this.baseURL}${endpoint}`;

        // Configuração padrão
        let config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Adicionar token se disponível
        const token = this.getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Executar interceptors de request
        for (const interceptor of this.interceptors.request) {
            config = await interceptor(config);
        }

        // Verificar cache (apenas GET)
        if (config.method === 'GET' && !options.skipCache) {
            const cacheKey = this.getCacheKey(url, config);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('📦 Cache hit:', endpoint);
                return cached;
            }
        }

        // Retry loop
        let lastError;
        for (let attempt = 1; attempt <= this.retries; attempt++) {
            try {
                const controller = this.createAbortController();
                config.signal = controller.signal;

                const response = await fetch(url, config);
                
                // Clone para poder ler body múltiplas vezes
                const clonedResponse = response.clone();
                let data;

                try {
                    data = await response.json();
                } catch {
                    data = await response.text();
                }

                // Executar interceptors de response
                for (const interceptor of this.interceptors.response) {
                    data = await interceptor(data, clonedResponse);
                }

                // Se não OK, lançar erro
                if (!response.ok) {
                    const error = new Error(data.message || data.error || `HTTP ${response.status}`);
                    error.status = response.status;
                    error.data = data;
                    throw error;
                }

                // Salvar no cache (apenas GET bem-sucedido)
                if (config.method === 'GET') {
                    const cacheKey = this.getCacheKey(url, config);
                    this.setCache(cacheKey, data);
                }

                return data;

            } catch (error) {
                lastError = error;

                // Não fazer retry em erros 4xx (client error)
                if (error.status >= 400 && error.status < 500) {
                    throw error;
                }

                // Timeout
                if (error.name === 'AbortError') {
                    console.warn(`⏱️ Timeout na tentativa ${attempt} de ${this.retries}`);
                }

                // Última tentativa, lançar erro
                if (attempt === this.retries) {
                    throw error;
                }

                // Aguardar antes de tentar novamente (exponential backoff)
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                console.log(`🔄 Retry ${attempt}/${this.retries} em ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    /**
     * Atalhos HTTP
     */
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    /**
     * Limpar todo o cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Instância global do cliente
const apiClient = new APIClient({
    cacheTTL: 5 * 60 * 1000, // 5min
    retries: 3,
    timeout: 30000
});

// Interceptor para logging (dev)
apiClient.addRequestInterceptor((config) => {
    console.log('🚀 Request:', config.method, config);
    return config;
});

apiClient.addResponseInterceptor((data, response) => {
    console.log('✅ Response:', response.status, data);
    return data;
});

// Limpar cache expirado a cada 1min
setInterval(() => apiClient.clearExpiredCache(), 60000);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIClient, apiClient };
}

// Gerenciador centralizado de localStorage

const Storage = {
    prefix: 'cp_',

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (item === null) return defaultValue;
            
            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        } catch (error) {
            console.error(`❌ Erro ao ler storage [${key}]:`, error);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            const serialized = typeof value === 'string' 
                ? value 
                : JSON.stringify(value);
            
            localStorage.setItem(this.prefix + key, serialized);
            return true;
        } catch (error) {
            console.error(`❌ Erro ao salvar storage [${key}]:`, error);
            
            // Se quota excedida, limpar dados antigos
            if (error.name === 'QuotaExceededError') {
                this.clearOldData();
            }
            return false;
        }
    },

    /**
     * Remover item do storage
     * @param {string} key - Chave do item
     */
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
        } catch (error) {
            console.error(`❌ Erro ao remover storage [${key}]:`, error);
        }
    },

    /**
     * Verificar se chave existe
     * @param {string} key - Chave do item
     * @returns {boolean} True se existe
     */
    has(key) {
        return localStorage.getItem(this.prefix + key) !== null;
    },

    /**
     * Limpar todos os dados do app
     * @param {boolean} keepAuth - Se true, mantém token e dados de usuário
     */
    clear(keepAuth = false) {
        if (keepAuth) {
            const auth = {
                token: this.get('apiToken'),
                email: this.get('apiEmail'),
                nome: this.get('usuarioNome'),
                id: this.get('usuarioId'),
                foto: this.get('usuarioFoto')
            };
            
            localStorage.clear();
            
            // Restaurar auth
            if (auth.token) this.set('apiToken', auth.token);
            if (auth.email) this.set('apiEmail', auth.email);
            if (auth.nome) this.set('usuarioNome', auth.nome);
            if (auth.id) this.set('usuarioId', auth.id);
            if (auth.foto) this.set('usuarioFoto', auth.foto);
        } else {
            localStorage.clear();
        }
    },

    /**
     * Obter tamanho usado (aproximado)
     * @returns {number} Bytes usados
     */
    getUsedSpace() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    },

    /**
     * Limpar dados antigos (estratégia futura)
     */
    clearOldData() {
        console.warn('⚠️ Storage cheio, limpando dados antigos...');
        // TODO: Implementar lógica de LRU ou TTL
    },

    /**
     * Helpers para dados específicos do app
     */
    auth: {
        getToken: () => Storage.get('apiToken'),
        setToken: (token) => Storage.set('apiToken', token),
        getEmail: () => Storage.get('apiEmail'),
        setEmail: (email) => Storage.set('apiEmail', email),
        clear: () => {
            Storage.remove('apiToken');
            Storage.remove('apiEmail');
        }
    },

    user: {
        get: () => ({
            nome: Storage.get('usuarioNome'),
            id: Storage.get('usuarioId'),
            email: Storage.get('usuarioEmail'),
            foto: Storage.get('usuarioFoto')
        }),
        set: (user) => {
            if (user.nome) Storage.set('usuarioNome', user.nome);
            if (user.id) Storage.set('usuarioId', user.id);
            if (user.email) Storage.set('usuarioEmail', user.email);
            if (user.foto) Storage.set('usuarioFoto', user.foto);
        },
        clear: () => {
            Storage.remove('usuarioNome');
            Storage.remove('usuarioId');
            Storage.remove('usuarioEmail');
            Storage.remove('usuarioFoto');
        }
    },

    registros: {
        get: () => Storage.get('registros', []),
        set: (registros) => Storage.set('registros', registros),
        add: (registro) => {
            const registros = Storage.registros.get();
            registros.push(registro);
            Storage.registros.set(registros);
        },
        clear: () => Storage.remove('registros')
    },

    theme: {
        get: () => Storage.get('theme', 'light'),
        set: (theme) => Storage.set('theme', theme),
        isDark: () => Storage.theme.get() === 'dark'
    }
};

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}

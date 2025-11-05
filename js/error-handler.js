// error-handler.js - Gerenciador global de erros

/**
 * Error Handler com captura global e notificações amigáveis
 * Captura:
 * - Erros de JavaScript não tratados
 * - Promises rejeitadas sem catch
 * - Erros de rede
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 50; // Manter últimos 50 erros
        this.isDevelopment = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';
        
        this.init();
    }

    /**
     * Inicializar listeners globais
     */
    init() {
        // Erros de JavaScript
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'JavaScript Error',
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error,
                timestamp: new Date()
            });
        });

        // Promises não tratadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'Unhandled Promise',
                message: event.reason?.message || String(event.reason),
                error: event.reason,
                timestamp: new Date()
            });
        });

        console.log('✅ Error Handler inicializado');
    }

    /**
     * Processar erro capturado
     */
    handleError(errorInfo) {
        // Adicionar ao log
        this.errorLog.push(errorInfo);
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift(); // Remove o mais antigo
        }

        // Log detalhado no console (dev)
        if (this.isDevelopment) {
            console.group('🔥 Erro Capturado');
            console.error('Tipo:', errorInfo.type);
            console.error('Mensagem:', errorInfo.message);
            if (errorInfo.filename) {
                console.error('Arquivo:', `${errorInfo.filename}:${errorInfo.line}:${errorInfo.column}`);
            }
            if (errorInfo.error) {
                console.error('Stack:', errorInfo.error.stack);
            }
            console.groupEnd();
        }

        // Notificação amigável para o usuário
        this.showUserNotification(errorInfo);

        // TODO: Enviar para serviço de logging (Sentry, LogRocket, etc)
        // this.sendToAnalytics(errorInfo);
    }

    /**
     * Mostrar notificação amigável para o usuário
     */
    showUserNotification(errorInfo) {
        const friendlyMessages = {
            'NetworkError': 'Sem conexão com a internet',
            'Failed to fetch': 'Erro ao conectar com o servidor',
            'JSON': 'Erro ao processar dados',
            'Timeout': 'Operação demorou muito tempo',
            'QuotaExceeded': 'Armazenamento cheio'
        };

        let userMessage = 'Ops! Algo deu errado';

        // Buscar mensagem amigável
        for (const [key, message] of Object.entries(friendlyMessages)) {
            if (errorInfo.message?.includes(key)) {
                userMessage = message;
                break;
            }
        }

        // Usar sistema de notificação se disponível
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao(userMessage, 'error');
        } else {
            // Fallback para console
            console.error('❌', userMessage);
        }
    }

    /**
     * Capturar erro manualmente
     * @param {Error} error - Objeto de erro
     * @param {Object} context - Contexto adicional
     */
    capture(error, context = {}) {
        this.handleError({
            type: 'Manual Capture',
            message: error.message,
            error: error,
            context: context,
            timestamp: new Date()
        });
    }

    /**
     * Obter log de erros
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * Limpar log
     */
    clearLog() {
        this.errorLog = [];
    }

    /**
     * Gerar relatório de erros (para debug)
     */
    generateReport() {
        return {
            totalErrors: this.errorLog.length,
            errors: this.errorLog.map(err => ({
                type: err.type,
                message: err.message,
                timestamp: err.timestamp.toISOString(),
                location: err.filename ? `${err.filename}:${err.line}` : 'N/A'
            })),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
    }

    /**
     * Exportar relatório como JSON
     */
    downloadReport() {
        const report = this.generateReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Instância global
const errorHandler = new ErrorHandler();

/**
 * Helper para try/catch assíncrono
 * @param {Function} fn - Função async
 * @param {*} fallback - Valor de retorno em caso de erro
 */
async function tryCatch(fn, fallback = null) {
    try {
        return await fn();
    } catch (error) {
        errorHandler.capture(error);
        return fallback;
    }
}

/**
 * Wrapper para eventos assíncronos
 * @param {Function} handler - Event handler async
 */
function asyncHandler(handler) {
    return function(...args) {
        Promise.resolve(handler.apply(this, args))
            .catch(error => errorHandler.capture(error));
    };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandler, errorHandler, tryCatch, asyncHandler };
}

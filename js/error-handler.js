// Gerenciador global de erros

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 50;
        this.isDevelopment = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';
        
        this.init();
    }

    init() {
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

    handleError(errorInfo) {
        this.errorLog.push(errorInfo);
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

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

        this.showUserNotification(errorInfo);
    }

    showUserNotification(errorInfo) {
        const friendlyMessages = {
            'NetworkError': 'Sem conexão com a internet',
            'Failed to fetch': 'Erro ao conectar com o servidor',
            'JSON': 'Erro ao processar dados',
            'Timeout': 'Operação demorou muito tempo',
            'QuotaExceeded': 'Armazenamento cheio'
        };

        let userMessage = 'Ops! Algo deu errado';

        for (const [key, message] of Object.entries(friendlyMessages)) {
            if (errorInfo.message?.includes(key)) {
                userMessage = message;
                break;
            }
        }

        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao(userMessage, 'error');
        } else {
            console.error('❌', userMessage);
        }
    }

    capture(error, context = {}) {
        this.handleError({
            type: 'Manual Capture',
            message: error.message,
            error: error,
            context: context,
            timestamp: new Date()
        });
    }

    getErrorLog() {
        return [...this.errorLog];
    }

    clearLog() {
        this.errorLog = [];
    }

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

const errorHandler = new ErrorHandler();

async function tryCatch(fn, fallback = null) {
    try {
        return await fn();
    } catch (error) {
        errorHandler.capture(error);
        return fallback;
    }
}

function asyncHandler(handler) {
    return function(...args) {
        Promise.resolve(handler.apply(this, args))
            .catch(error => errorHandler.capture(error));
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandler, errorHandler, tryCatch, asyncHandler };
}

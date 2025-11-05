// pwa.js - Registro do Service Worker e instalação PWA

/**
 * Registrar Service Worker
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registrado:', registration.scope);
                
                // Verificar updates a cada 1h
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);
            })
            .catch((error) => {
                console.error('❌ Erro ao registrar Service Worker:', error);
            });
    });
}

/**
 * Detectar PWA instalado
 */
function isPWAInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
}

/**
 * Prompt de instalação PWA
 */
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir mini-infobar automático
    e.preventDefault();
    deferredPrompt = e;
    
    // Mostrar botão de instalação customizado (opcional)
    console.log('💡 App pode ser instalado');
    
    // TODO: Mostrar UI customizada de instalação
    // showInstallButton();
});

/**
 * Instalar PWA programaticamente
 */
async function installPWA() {
    if (!deferredPrompt) {
        console.warn('⚠️ Prompt de instalação não disponível');
        return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`Usuário ${outcome === 'accepted' ? 'aceitou' : 'rejeitou'} instalar`);
    deferredPrompt = null;
}

/**
 * Evento após instalação
 */
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA instalado com sucesso!');
    deferredPrompt = null;
});

/**
 * Detectar modo online/offline
 */
window.addEventListener('online', () => {
    console.log('🌐 Online');
    if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao('Conexão restaurada', 'success');
    }
});

window.addEventListener('offline', () => {
    console.log('📡 Offline');
    if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao('Modo offline ativado', 'warning');
    }
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isPWAInstalled, installPWA };
}

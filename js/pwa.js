// Registro do Service Worker e instalação PWA

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registrado:', registration.scope);
                
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);
            })
            .catch((error) => {
                console.error('❌ Erro ao registrar Service Worker:', error);
            });
    });
}

function isPWAInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    console.log('💡 App pode ser instalado');
});

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

window.addEventListener('appinstalled', () => {
    console.log('✅ PWA instalado com sucesso!');
    deferredPrompt = null;
});

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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isPWAInstalled, installPWA };
}

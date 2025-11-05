// sw.js - Service Worker para PWA

const CACHE_NAME = 'controle-ponto-v3';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/login.html',
    '/style.css',
    '/pages/dashboard.html',
    '/pages/registros.html',
    '/pages/api.html',
    '/pages/importar.html',
    '/js/core.js',
    '/js/api.js',
    '/js/dashboard.js',
    '/js/registros.js',
    '/js/importar.js',
    '/js/sidebar.js',
    '/js/theme.js',
    '/js/storage.js',
    '/js/http.js',
    '/js/error-handler.js',
    'https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.2.0/remixicon.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

/**
 * Install - cachear assets essenciais
 */
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cacheando assets...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('✅ Assets cacheados com sucesso');
                return self.skipWaiting(); // Ativar imediatamente
            })
            .catch((error) => {
                console.error('❌ Erro ao cachear assets:', error);
            })
    );
});

/**
 * Activate - limpar caches antigos
 */
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker ativando...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('🗑️ Removendo cache antigo:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('✅ Service Worker ativado');
                return self.clients.claim(); // Controlar todas as páginas
            })
    );
});

/**
 * Fetch - estratégia de cache
 * Network First para API, Cache First para assets
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Estratégia 1: Network First (API do IDSecure)
    if (url.hostname === 'main.idsecure.com.br' || url.hostname === 'app.idsecure.cloud') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cachear resposta se bem-sucedida
                    if (response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback para cache se offline
                    return caches.match(request).then((cached) => {
                        if (cached) {
                            console.log('📡 Offline: usando cache para', request.url);
                            return cached;
                        }
                        // Retornar resposta offline genérica
                        return new Response(
                            JSON.stringify({ error: 'Sem conexão', offline: true }),
                            { 
                                headers: { 'Content-Type': 'application/json' },
                                status: 503
                            }
                        );
                    });
                })
        );
        return;
    }

    // Estratégia 2: Cache First (assets locais e CDN)
    event.respondWith(
        caches.match(request)
            .then((cached) => {
                if (cached) {
                    // Retornar do cache e atualizar em background
                    fetch(request)
                        .then((response) => {
                            if (response.status === 200) {
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(request, response);
                                });
                            }
                        })
                        .catch(() => {
                            // Falha silenciosa se offline
                        });
                    
                    return cached;
                }

                // Não está no cache, buscar da rede
                return fetch(request)
                    .then((response) => {
                        // Cachear apenas respostas bem-sucedidas
                        if (response.status === 200) {
                            const clonedResponse = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, clonedResponse);
                            });
                        }
                        return response;
                    })
                    .catch((error) => {
                        console.error('❌ Erro ao buscar:', request.url, error);
                        
                        // Página offline genérica para navegação
                        if (request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        throw error;
                    });
            })
    );
});

/**
 * Message - comandos do cliente
 */
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data === 'clearCache') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('🗑️ Cache limpo');
        });
    }
});

// theme.js - Sistema de troca de tema (light/dark)

// Carregar tema salvo ao iniciar
const temaSalvo = Storage.theme.get();
if (temaSalvo === 'dark') {
    document.body.classList.add('dark-theme');
}

// Função para alternar tema
function alternarTema() {
    const body = document.body;
    const isDark = body.classList.contains('dark-theme');
    const themeButton = document.getElementById('theme-button');
    
    if (isDark) {
        // Mudar para light
        body.classList.remove('dark-theme');
        Storage.theme.set('light');
        if (themeButton) {
            themeButton.querySelector('i').className = 'ri-moon-clear-fill';
        }
    } else {
        // Mudar para dark
        body.classList.add('dark-theme');
        Storage.theme.set('dark');
        if (themeButton) {
            themeButton.querySelector('i').className = 'ri-sun-fill';
        }
    }
    
    // Atualizar dashboard se existir
    if (typeof atualizarDashboard === 'function') {
        atualizarDashboard();
    }
}

// Configurar ícone inicial quando página carregar
window.addEventListener('load', () => {
    const themeButton = document.getElementById('theme-button');
    if (themeButton) {
        const isDark = document.body.classList.contains('dark-theme');
        themeButton.querySelector('i').className = isDark ? 'ri-sun-fill' : 'ri-moon-clear-fill';
        themeButton.addEventListener('click', alternarTema);
    }
});

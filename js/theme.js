// Sistema de troca de tema

const temaSalvo = Storage.theme.get();
if (temaSalvo === 'dark') {
    document.body.classList.add('dark-theme');
}

function alternarTema() {
    const body = document.body;
    const isDark = body.classList.contains('dark-theme');
    const themeButton = document.getElementById('theme-button');
    
    if (isDark) {
        body.classList.remove('dark-theme');
        Storage.theme.set('light');
        if (themeButton) {
            themeButton.querySelector('i').className = 'ri-moon-clear-fill';
        }
    } else {
        body.classList.add('dark-theme');
        Storage.theme.set('dark');
        if (themeButton) {
            themeButton.querySelector('i').className = 'ri-sun-fill';
        }
    }
    
    if (typeof atualizarDashboard === 'function') {
        atualizarDashboard();
    }
}

window.addEventListener('load', () => {
    const themeButton = document.getElementById('theme-button');
    if (themeButton) {
        const isDark = document.body.classList.contains('dark-theme');
        themeButton.querySelector('i').className = isDark ? 'ri-sun-fill' : 'ri-moon-clear-fill';
        themeButton.addEventListener('click', alternarTema);
    }
});

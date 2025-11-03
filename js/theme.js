// theme.js - Sistema de troca de tema (light/dark)

function carregarTema() {
    const temaSalvo = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', temaSalvo);
    atualizarIconeTema(temaSalvo);
}

function alternarTema() {
    const temaAtual = document.documentElement.getAttribute('data-theme');
    const novoTema = temaAtual === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', novoTema);
    localStorage.setItem('theme', novoTema);
    atualizarIconeTema(novoTema);
    
    // Se estiver no dashboard, atualizar os gráficos
    if (typeof atualizarDashboard === 'function') {
        atualizarDashboard();
    }
}

function atualizarIconeTema(tema) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    if (sunIcon && moonIcon) {
        if (tema === 'dark') {
            sunIcon.style.opacity = '0';
            sunIcon.style.transform = 'rotate(180deg)';
            moonIcon.style.opacity = '1';
            moonIcon.style.transform = 'rotate(0deg)';
        } else {
            sunIcon.style.opacity = '1';
            sunIcon.style.transform = 'rotate(0deg)';
            moonIcon.style.opacity = '0';
            moonIcon.style.transform = 'rotate(180deg)';
        }
    }
}

// Inicializar tema
document.addEventListener('DOMContentLoaded', () => {
    carregarTema();
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', alternarTema);
    }
});

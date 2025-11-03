// dashboard.js - Lógica do dashboard com KPIs e gráficos

let chartBarras = null;
let chartLinha = null;
let periodoAtual = 7;

// Funções para salvar/carregar filtro
function salvarFiltro() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    const filtro = {
        dataInicio,
        dataFim,
        periodoAtual
    };
    
    console.log('💾 Filtro salvo:', filtro);
    localStorage.setItem('dashboardFiltro', JSON.stringify(filtro));
}

function carregarFiltro() {
    const filtroSalvo = localStorage.getItem('dashboardFiltro');
    if (!filtroSalvo) return false;
    
    try {
        const filtro = JSON.parse(filtroSalvo);
        
        console.log('📥 Filtro carregado:', filtro);
        
        // Restaurar valores dos inputs
        if (filtro.dataInicio && document.getElementById('dataInicio')) {
            document.getElementById('dataInicio').value = filtro.dataInicio;
        }
        if (filtro.dataFim && document.getElementById('dataFim')) {
            document.getElementById('dataFim').value = filtro.dataFim;
        }
        
        // Restaurar período
        if (filtro.periodoAtual !== undefined) {
            periodoAtual = filtro.periodoAtual;
        }
        
        return true;
    } catch (e) {
        console.error('Erro ao carregar filtro:', e);
        return false;
    }
}

function filtrarDadosPorPeriodo() {
    const registros = carregarDados();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Se for null, retorna tudo
    if (periodoAtual === null) {
        return registros;
    }
    
    // Se for objeto com datas personalizadas
    if (typeof periodoAtual === 'object' && periodoAtual.inicio && periodoAtual.fim) {
        const inicio = new Date(periodoAtual.inicio);
        const fim = new Date(periodoAtual.fim);
        fim.setHours(23, 59, 59, 999);
        
        return registros.filter(r => {
            const data = new Date(r.data);
            return data >= inicio && data <= fim;
        });
    }
    
    // Se for "mes", filtra pelo mês atual
    if (periodoAtual === 'mes') {
        return registros.filter(r => {
            const data = new Date(r.data);
            return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
        });
    }
    
    // Se for número (7, 30), filtra pelos últimos N dias
    const dataLimite = new Date(hoje);
    dataLimite.setDate(dataLimite.getDate() - periodoAtual);
    
    return registros.filter(r => {
        const data = new Date(r.data);
        return data >= dataLimite;
    });
}

function calcularMetricas(dados) {
    let totalMinutosTrabalhados = 0;
    let totalMinutosExtras = 0;
    let diasTrabalhados = 0;
    let diasComExtra = 0;
    
    dados.forEach(reg => {
        if (reg.entrada && reg.saida) {
            const total = calcularTotalTrabalhado(reg.entrada, reg.saida);
            const extras = calcularHorasExtras(reg.data, reg.entrada, reg.saida);
            
            totalMinutosTrabalhados += total;
            totalMinutosExtras += extras;
            diasTrabalhados++;
            
            if (extras > 0) {
                diasComExtra++;
            }
        }
    });
    
    const mediaDiaria = diasTrabalhados > 0 ? Math.floor(totalMinutosTrabalhados / diasTrabalhados) : 0;
    const percentualExtras = totalMinutosTrabalhados > 0 
        ? ((totalMinutosExtras / totalMinutosTrabalhados) * 100).toFixed(1)
        : 0;
    
    return {
        totalMinutosTrabalhados,
        totalMinutosExtras,
        diasTrabalhados,
        diasComExtra,
        mediaDiaria,
        percentualExtras
    };
}

function atualizarKPIs(metricas) {
    const totalTrabalhado = document.getElementById('totalTrabalhado');
    const horasExtras = document.getElementById('horasExtras');
    const mediaDiaria = document.getElementById('mediaDiaria');
    const diasTrabalhados = document.getElementById('diasTrabalhados');
    
    if (totalTrabalhado) totalTrabalhado.textContent = formatarMinutosParaHoras(metricas.totalMinutosTrabalhados);
    if (horasExtras) horasExtras.textContent = formatarMinutosParaHoras(metricas.totalMinutosExtras);
    if (mediaDiaria) mediaDiaria.textContent = formatarMinutosParaHoras(metricas.mediaDiaria);
    if (diasTrabalhados) diasTrabalhados.textContent = metricas.diasTrabalhados;
}

function criarGraficoBarras(dados) {
    const ctx = document.getElementById('chartBarras');
    if (!ctx) {
        console.warn('⚠️ Elemento chartBarras não encontrado');
        return;
    }
    
    // Destruir gráfico anterior
    if (chartBarras) {
        chartBarras.destroy();
    }
    
    // Agrupar por semana
    const semanas = new Map();
    
    dados.forEach(reg => {
        if (!reg.entrada || !reg.saida) return;
        
        const data = new Date(reg.data);
        const ano = data.getFullYear();
        const semana = getWeekNumber(data);
        const chave = `${ano}-S${semana}`;
        
        if (!semanas.has(chave)) {
            semanas.set(chave, { normal: 0, extras: 0 });
        }
        
        const total = calcularTotalTrabalhado(reg.entrada, reg.saida);
        const extras = calcularHorasExtras(reg.data, reg.entrada, reg.saida);
        const normal = total - extras;
        
        semanas.get(chave).normal += normal / 60;
        semanas.get(chave).extras += extras / 60;
    });
    
    // Inverter a ordem para mostrar da esquerda para direita (mais antiga → mais recente)
    const labels = Array.from(semanas.keys()).reverse();
    const dataNormal = labels.map(label => semanas.get(label).normal.toFixed(2));
    const dataExtras = labels.map(label => semanas.get(label).extras.toFixed(2));
    
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#FFFFFF' : '#1E293B'; // Branco no escuro, preto no claro
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Adicionar classe updating ao container
    const container = document.querySelector('.chart-container');
    if (container) {
        container.classList.add('updating');
        setTimeout(() => container.classList.remove('updating'), 500);
    }
    
    chartBarras = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Horas Normais',
                    data: dataNormal,
                    backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
                    borderRadius: 8,
                    borderWidth: 0
                },
                {
                    label: 'Horas Extras',
                    data: dataExtras,
                    backgroundColor: isDark ? '#FBBF24' : '#F59E0B',
                    borderRadius: 8,
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: 0
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { 
                        color: textColor,
                        font: { size: 14, weight: '600' },
                        padding: 18,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1E293B' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDark ? '#F8FAFC' : '#1E293B',
                    bodyColor: isDark ? '#F8FAFC' : '#1E293B',
                    borderColor: isDark ? '#2563EB' : 'rgba(148, 163, 184, 0.3)',
                    borderWidth: 2,
                    padding: 12,
                    displayColors: true,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + 'h';
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { 
                        color: textColor,
                        font: { size: 12, weight: '500' }
                    },
                    grid: { 
                        display: false,
                        color: gridColor
                    },
                    border: {
                        color: textColor
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: { 
                        color: textColor,
                        font: { size: 12, weight: '500' },
                        callback: function(value) {
                            return value + 'h';
                        }
                    },
                    grid: { 
                        color: gridColor,
                        drawBorder: false,
                        lineWidth: 1,
                        borderDash: [4, 4]
                    },
                    border: {
                        color: textColor
                    }
                }
            }
        }
    });
}

function criarGraficoLinha(dados) {
    const ctx = document.getElementById('chartLinha');
    if (!ctx) {
        console.warn('⚠️ Elemento chartLinha não encontrado');
        return;
    }
    
    if (chartLinha) {
        chartLinha.destroy();
    }
    
    const dadosOrdenados = [...dados].sort((a, b) => new Date(a.data) - new Date(b.data));
    
    const labels = dadosOrdenados.map(r => formatarData(r.data));
    const dataExtras = dadosOrdenados.map(r => {
        if (!r.entrada || !r.saida) return 0;
        return (calcularHorasExtras(r.data, r.entrada, r.saida) / 60).toFixed(2);
    });
    
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#FFFFFF' : '#1E293B'; // Branco no escuro, preto no claro
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    chartLinha = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Horas Extras',
                data: dataExtras,
                borderColor: isDark ? '#FBBF24' : '#F59E0B',
                backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: isDark ? '#FBBF24' : '#F59E0B',
                pointBorderColor: isDark ? '#1E293B' : '#fff',
                pointBorderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: 0
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { 
                        color: textColor,
                        font: { size: 14, weight: '600' },
                        padding: 18,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1E293B' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDark ? '#F8FAFC' : '#1E293B',
                    bodyColor: isDark ? '#F8FAFC' : '#1E293B',
                    borderColor: isDark ? '#2563EB' : 'rgba(148, 163, 184, 0.3)',
                    borderWidth: 2,
                    padding: 12,
                    displayColors: true,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            return 'Extras: ' + context.parsed.y + 'h';
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { 
                        color: textColor,
                        font: { size: 12, weight: '500' },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: { 
                        display: false,
                        color: gridColor
                    },
                    border: {
                        color: textColor
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: textColor,
                        font: { size: 12, weight: '500' },
                        callback: function(value) {
                            return value + 'h';
                        }
                    },
                    grid: { 
                        color: gridColor,
                        drawBorder: false,
                        lineWidth: 1,
                        borderDash: [4, 4]
                    },
                    border: {
                        color: textColor
                    }
                }
            }
        }
    });
}

function criarTabelaSemanal(dados) {
    const tbody = document.getElementById('tabelaSemanalBody');
    if (!tbody) {
        console.log('⚠️ Elemento tabelaSemanalBody não encontrado');
        return;
    }
    tbody.innerHTML = '';
    
    const semanas = new Map();
    
    dados.forEach(reg => {
        if (!reg.entrada || !reg.saida) return;
        
        const data = new Date(reg.data);
        const ano = data.getFullYear();
        const semana = getWeekNumber(data);
        const chave = `${ano}-S${semana}`;
        
        if (!semanas.has(chave)) {
            semanas.set(chave, { dias: 0, total: 0, extras: 0 });
        }
        
        const s = semanas.get(chave);
        s.dias++;
        s.total += calcularTotalTrabalhado(reg.entrada, reg.saida);
        s.extras += calcularHorasExtras(reg.data, reg.entrada, reg.saida);
    });
    
    if (semanas.size === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="5">Nenhum dado disponível</td></tr>';
        return;
    }
    
    Array.from(semanas.entries()).forEach(([chave, dados]) => {
        const media = Math.floor(dados.total / dados.dias);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${chave}</td>
            <td>${dados.dias}</td>
            <td>${formatarMinutosParaHoras(dados.total)}</td>
            <td>${formatarMinutosParaHoras(dados.extras)}</td>
            <td>${formatarMinutosParaHoras(media)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function atualizarDashboard() {
    const dados = filtrarDadosPorPeriodo();
    const metricas = calcularMetricas(dados);
    
    atualizarKPIs(metricas);
    criarGraficoBarras(dados);
    criarGraficoLinha(dados);
    criarTabelaSemanal(dados);
}

function aplicarFiltroPersonalizado() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    if (!dataInicio || !dataFim) {
        alert('⚠️ Selecione as duas datas!');
        return;
    }
    
    if (new Date(dataInicio) > new Date(dataFim)) {
        alert('⚠️ A data inicial não pode ser maior que a final!');
        return;
    }
    
    // Desativar todos os filtros predefinidos
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    
    // Definir período personalizado
    periodoAtual = { inicio: dataInicio, fim: dataFim };
    
    salvarFiltro(); // Salvar filtro personalizado
    atualizarDashboard();
}

// Tornar função global para onclick
window.aplicarFiltroPersonalizado = aplicarFiltroPersonalizado;

// Funções de filtro por data
function aplicarFiltroData() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    if (!dataInicio || !dataFim) {
        alert('Por favor, selecione as duas datas!');
        return;
    }
    
    periodoAtual = { inicio: dataInicio, fim: dataFim };
    salvarFiltro(); // Salvar filtro
    atualizarDashboard();
}

function limparFiltroData() {
    document.getElementById('dataInicio').value = '';
    const hoje = new Date();
    document.getElementById('dataFim').valueAsDate = hoje;
    periodoAtual = 7;
    salvarFiltro(); // Salvar filtro limpo
    atualizarDashboard();
}

window.aplicarFiltroData = aplicarFiltroData;
window.limparFiltroData = limparFiltroData;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Carregar filtro salvo primeiro
    const filtroCarregado = carregarFiltro();
    
    // Se não houver filtro salvo, definir data de hoje no campo "até"
    if (!filtroCarregado) {
        const hoje = new Date();
        const dataFimInput = document.getElementById('dataFim');
        if (dataFimInput) {
            dataFimInput.valueAsDate = hoje;
        }
    }
    
    // Atualizar dashboard
    atualizarDashboard();
    
    // Filtros de período
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const periodo = e.target.dataset.periodo;
            periodoAtual = periodo === 'tudo' ? null : (periodo === 'mes' ? 'mes' : parseInt(periodo));
            
            salvarFiltro(); // Salvar quando mudar de filtro
            atualizarDashboard();
        });
    });
    
    // Atualizar gráficos quando trocar tema
    const themeButton = document.getElementById('theme-button');
    if (themeButton) {
        themeButton.addEventListener('click', () => {
            setTimeout(() => atualizarDashboard(), 100);
        });
    }
    
    // Auto-hide header ao rolar a página
    let lastScrollTop = 0;
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop < 100) {
            // Perto do topo (menos de 100px) - mostrar header
            header.style.transform = 'translateY(0)';
            header.style.opacity = '1';
        } else {
            // Longe do topo - esconder header
            header.style.transform = 'translateY(-100%)';
            header.style.opacity = '0';
        }
        
        lastScrollTop = scrollTop;
    });
});

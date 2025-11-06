// Dashboard - KPIs e gráficos

let chartBarras = null;
let chartLinha = null;
let chartPizza = null;
let periodoAtual = 7;

function salvarFiltro() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    const filtro = { dataInicio, dataFim, periodoAtual };
    
    console.log('💾 Filtro salvo:', filtro);
    localStorage.setItem('dashboardFiltro', JSON.stringify(filtro));
}

function carregarFiltro() {
    const filtroSalvo = localStorage.getItem('dashboardFiltro');
    if (!filtroSalvo) return false;
    
    try {
        const filtro = JSON.parse(filtroSalvo);
        console.log('📥 Filtro carregado:', filtro);
        
        if (filtro.dataInicio && document.getElementById('dataInicio')) {
            document.getElementById('dataInicio').value = filtro.dataInicio;
        }
        if (filtro.dataFim && document.getElementById('dataFim')) {
            document.getElementById('dataFim').value = filtro.dataFim;
        }
        
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
    
    if (periodoAtual === null) {
        return registros;
    }
    
    if (typeof periodoAtual === 'object' && periodoAtual.inicio && periodoAtual.fim) {
        const inicio = new Date(periodoAtual.inicio);
        const fim = new Date(periodoAtual.fim);
        fim.setHours(23, 59, 59, 999);
        
        return registros.filter(r => {
            const data = new Date(r.data);
            return data >= inicio && data <= fim;
        });
    }
    
    if (periodoAtual === 'mes') {
        return registros.filter(r => {
            const data = new Date(r.data);
            return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
        });
    }
    
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
    const statsCards = document.querySelectorAll('.stat-card');
    statsCards.forEach(card => {
        if (!card.querySelector('.loading-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="spinner spinner-small"></div>';
            card.style.position = 'relative';
            card.appendChild(overlay);
        }
    });
    
    setTimeout(() => {
        const dados = filtrarDadosPorPeriodo();
        const metricas = calcularMetricas(dados);
        
        atualizarKPIs(metricas);
        atualizarCardHoje();
        criarGraficoBarras(dados);
        criarGraficoPizza(dados);
        criarGraficoLinha(dados);
        criarTabelaSemanal(dados);
        
        document.querySelectorAll('.loading-overlay').forEach(el => el.remove());
    }, 300);
}

function aplicarFiltroPersonalizado() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    if (!dataInicio || !dataFim) {
        if (typeof toast !== 'undefined') {
            toast.warning('Selecione as duas datas!');
        } else {
            alert('⚠️ Selecione as duas datas!');
        }
        return;
    }
    
    if (new Date(dataInicio) > new Date(dataFim)) {
        if (typeof toast !== 'undefined') {
            toast.error('A data inicial não pode ser maior que a final!');
        } else {
            alert('⚠️ A data inicial não pode ser maior que a final!');
        }
        return;
    }
    
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    
    periodoAtual = { inicio: dataInicio, fim: dataFim };
    
    salvarFiltro();
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
    
    // Auto-hide header com efeito de transparência suave
    let lastScrollTop = 0;
    const header = document.getElementById('header');
    const scrollThreshold = 100;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop < scrollThreshold) {
            // Perto do topo - mostrar header com fade in suave
            header.classList.remove('header--hidden');
            header.classList.add('header--visible');
        } else if (scrollTop > lastScrollTop) {
            // Rolando para baixo - esconder com fade out
            header.classList.remove('header--visible');
            header.classList.add('header--hidden');
        } else {
            // Rolando para cima - mostrar com fade in
            header.classList.remove('header--hidden');
            header.classList.add('header--visible');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
});

// Atualizar card "Hoje" com dados em tempo real
function atualizarCardHoje() {
    try {
        const hoje = new Date().toISOString().split('T')[0];
        const registros = carregarDados();
        const registrosHoje = registros.filter(r => r.data === hoje);
        
        // Formatar data
        const data = new Date(hoje + 'T00:00:00');
        const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        const dataFormatada = `${diasSemana[data.getDay()]}, ${data.getDate()} de ${meses[data.getMonth()]}`;
        
        const hojeDataEl = document.getElementById('hojeData');
        if (hojeDataEl) hojeDataEl.textContent = dataFormatada;
        
        if (registrosHoje.length === 0) {
            if (document.getElementById('hojeTempo')) document.getElementById('hojeTempo').textContent = '0h 0min';
            if (document.getElementById('hojeExtra')) document.getElementById('hojeExtra').textContent = '--';
            if (document.getElementById('progressPercent')) document.getElementById('progressPercent').textContent = '0%';
            if (document.getElementById('progressCircle')) document.getElementById('progressCircle').setAttribute('stroke-dasharray', '0, 100');
            return;
        }
        
        // Agrupar registros de hoje
        const agrupado = agruparRegistrosPorData(registrosHoje)[0];
        
        if (!agrupado || !agrupado.entrada || !agrupado.saida) {
            if (document.getElementById('hojeTempo')) document.getElementById('hojeTempo').textContent = '0h 0min';
            if (document.getElementById('hojeExtra')) document.getElementById('hojeExtra').textContent = '--';
            if (document.getElementById('progressPercent')) document.getElementById('progressPercent').textContent = '0%';
            if (document.getElementById('progressCircle')) document.getElementById('progressCircle').setAttribute('stroke-dasharray', '0, 100');
            return;
        }
        
        // Calcular horas trabalhadas
        const totalMin = calcularTotalTrabalhado(agrupado.entrada, agrupado.saida);
        const horas = Math.floor(totalMin / 60);
        const minutos = totalMin % 60;
        
        if (document.getElementById('hojeTempo')) {
            document.getElementById('hojeTempo').textContent = `${horas}h ${minutos}min`;
        }
        
        // Calcular hora extra
        const extrasMin = calcularHorasExtras(hoje, agrupado.entrada, agrupado.saida);
        if (document.getElementById('hojeExtra')) {
            if (extrasMin > 0) {
                const horasExtra = Math.floor(extrasMin / 60);
                const minutosExtra = extrasMin % 60;
                document.getElementById('hojeExtra').textContent = `+${horasExtra}h ${minutosExtra}min`;
            } else if (extrasMin < 0) {
                const abs = Math.abs(extrasMin);
                const horasExtra = Math.floor(abs / 60);
                const minutosExtra = abs % 60;
                document.getElementById('hojeExtra').textContent = `-${horasExtra}h ${minutosExtra}min`;
            } else {
                document.getElementById('hojeExtra').textContent = '0h';
            }
        }
        
        // Progresso (meta de 8h = 480min)
        const meta = 480; // 8 horas
        const progresso = Math.min((totalMin / meta) * 100, 100);
        if (document.getElementById('progressPercent')) {
            document.getElementById('progressPercent').textContent = `${Math.round(progresso)}%`;
        }
        if (document.getElementById('progressCircle')) {
            document.getElementById('progressCircle').setAttribute('stroke-dasharray', `${progresso}, 100`);
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar card Hoje:', error);
    }
}

// Criar gráfico de pizza (distribuição semanal)
function criarGraficoPizza(dados) {
    try {
        const ctx = document.getElementById('chartPizza');
        if (!ctx) return;
        
        // Destruir gráfico anterior
        if (chartPizza) {
            chartPizza.destroy();
        }
        
        // Agrupar por dia da semana
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const horasPorDia = new Array(7).fill(0);
        
        dados.forEach(reg => {
            const data = new Date(reg.data + 'T00:00:00');
            const diaSemana = data.getDay();
            const totalMin = calcularTotalTrabalhado(reg.entrada, reg.saida);
            horasPorDia[diaSemana] += totalMin / 60;
        });
        
        // Cores vibrantes para cada dia
        const cores = [
            '#ef4444', // Domingo - Vermelho
            '#3b82f6', // Segunda - Azul
            '#10b981', // Terça - Verde
            '#f59e0b', // Quarta - Laranja
            '#8b5cf6', // Quinta - Roxo
            '#ec4899', // Sexta - Rosa
            '#f97316'  // Sábado - Laranja escuro
        ];
        
        chartPizza = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: diasSemana,
                datasets: [{
                    data: horasPorDia,
                    backgroundColor: cores,
                    borderWidth: 2,
                    borderColor: getComputedStyle(document.body).getPropertyValue('--body-color')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color'),
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const valor = context.parsed;
                                const horas = Math.floor(valor);
                                const minutos = Math.round((valor % 1) * 60);
                                return `${context.label}: ${horas}h ${minutos}min`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('❌ Erro ao criar gráfico de pizza:', error);
    }
}

// Inicializar com atualização automática do card Hoje
setInterval(() => {
    if (document.getElementById('hojeTempo')) {
        atualizarCardHoje();
    }
}, 60000); // Atualizar a cada minuto

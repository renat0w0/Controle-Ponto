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
    let totalMinutosAlmoco = 0;
    let diasTrabalhados = 0;
    let diasComExtra = 0;
    
    dados.forEach(reg => {
        if (reg.entrada && reg.saida) {
            const total = calcularTotalTrabalhado(reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
            const extras = calcularHorasExtras(reg.data, reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
            const almoco = calcularTempoAlmoco(reg.almoco_saida, reg.almoco_volta);
            
            totalMinutosTrabalhados += total;
            totalMinutosExtras += extras;
            totalMinutosAlmoco += almoco;
            diasTrabalhados++;
            
            if (extras > 0) {
                diasComExtra++;
            }
        }
    });
    
    const mediaDiaria = diasTrabalhados > 0 ? Math.floor(totalMinutosTrabalhados / diasTrabalhados) : 0;
    const mediaAlmoco = diasTrabalhados > 0 ? Math.floor(totalMinutosAlmoco / diasTrabalhados) : 0;
    const percentualExtras = totalMinutosTrabalhados > 0 
        ? ((totalMinutosExtras / totalMinutosTrabalhados) * 100).toFixed(1)
        : 0;
    
    return {
        totalMinutosTrabalhados,
        totalMinutosExtras,
        totalMinutosAlmoco,
        diasTrabalhados,
        diasComExtra,
        mediaDiaria,
        mediaAlmoco,
        percentualExtras
    };
}

function atualizarKPIs(metricas) {
    const totalTrabalhado = document.getElementById('totalTrabalhado');
    const horasExtras = document.getElementById('horasExtras');
    const tempoAlmoco = document.getElementById('tempoAlmoco');
    const mediaDiaria = document.getElementById('mediaDiaria');
    const diasTrabalhados = document.getElementById('diasTrabalhados');
    
    if (totalTrabalhado) totalTrabalhado.textContent = formatarMinutosParaHoras(metricas.totalMinutosTrabalhados);
    if (horasExtras) horasExtras.textContent = formatarMinutosParaHoras(metricas.totalMinutosExtras);
    if (tempoAlmoco) tempoAlmoco.textContent = formatarMinutosParaHoras(metricas.totalMinutosAlmoco);
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
        
        const total = calcularTotalTrabalhado(reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
        const extras = calcularHorasExtras(reg.data, reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
        const normal = total - extras;
        
        const atual = semanas.get(chave);
        semanas.set(chave, {
            normal: atual.normal + (normal / 60),
            extras: atual.extras + (extras / 60)
        });
    });
    
    // Inverter a ordem para mostrar da esquerda para direita (mais antiga → mais recente)
    const labels = Array.from(semanas.keys()).reverse();
    const dataNormal = labels.map(label => Math.round(semanas.get(label).normal * 100) / 100);
    const dataExtras = labels.map(label => Math.round(semanas.get(label).extras * 100) / 100);
    
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#E5E7EB' : '#1E293B';
    const titleColor = isDark ? '#F9FAFB' : '#111827';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)';
    
    chartBarras = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Horas Normais',
                    data: dataNormal,
                    backgroundColor: '#60A5FA',
                    borderRadius: 8,
                    borderWidth: 0,
                    barThickness: 25,
                    maxBarThickness: 40
                },
                {
                    label: 'Horas Extras',
                    data: dataExtras,
                    backgroundColor: '#F59E0B',
                    borderRadius: 8,
                    borderWidth: 0,
                    barThickness: 25,
                    maxBarThickness: 40
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            categoryPercentage: 0.5,
            barPercentage: 0.8,
            layout: {
                padding: { top: 30, left: 10, right: 10, bottom: 5 }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { 
                        color: titleColor,
                        font: { size: 13, weight: '600', family: "'Inter', 'Roboto', sans-serif" },
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 8,
                        boxHeight: 8
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1F2937' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDark ? '#F9FAFB' : '#111827',
                    bodyColor: isDark ? '#E5E7EB' : '#374151',
                    borderColor: isDark ? '#374151' : 'rgba(148, 163, 184, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    titleFont: { size: 13, weight: 'bold', family: "'Inter', 'Roboto', sans-serif" },
                    bodyFont: { size: 12, family: "'Inter', 'Roboto', sans-serif" },
                    boxWidth: 10,
                    boxHeight: 10,
                    boxPadding: 6,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = Math.round(context.parsed.y * 10) / 10;
                            return `${label}: ${value}h`;
                        },
                        afterBody: function(context) {
                            const index = context[0].dataIndex;
                            const total = dataNormal[index] + dataExtras[index];
                            return `\n━━━━━━━━━━\nTotal: ${Math.round(total * 10) / 10}h`;
                        }
                    }
                },
                annotation: {
                    annotations: {
                        metaLine: {
                            type: 'line',
                            yMin: 44,
                            yMax: 44,
                            borderColor: '#EF4444',
                            borderWidth: 1.5,
                            borderDash: [6, 3],
                            label: {
                                display: true,
                                content: 'Meta semanal (44h)',
                                position: 'start',
                                backgroundColor: 'rgba(239, 68, 68, 0.85)',
                                color: '#FFFFFF',
                                font: { size: 11, weight: 'bold', family: "'Inter', 'Roboto', sans-serif" },
                                padding: { top: 4, bottom: 4, left: 8, right: 8 },
                                borderRadius: 4
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { 
                        color: textColor,
                        font: { size: 11, weight: '500', family: "'Inter', 'Roboto', sans-serif" },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: { 
                        display: false
                    },
                    border: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 80,
                    ticks: { 
                        color: textColor,
                        font: { size: 11, weight: '500', family: "'Inter', 'Roboto', sans-serif" },
                        stepSize: 10,
                        callback: function(value) {
                            return value + 'h';
                        }
                    },
                    grid: { 
                        color: gridColor,
                        drawBorder: false,
                        lineWidth: 0.5,
                        borderDash: [4, 4]
                    },
                    border: {
                        display: false
                    }
                }
            }
        },
        plugins: [{
            id: 'topLabels',
            afterDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                chart.data.datasets.forEach((dataset, i) => {
                    const meta = chart.getDatasetMeta(i);
                    if (!meta.hidden && i === chart.data.datasets.length - 1) {
                        meta.data.forEach((element, index) => {
                            const normal = dataNormal[index];
                            const extras = dataExtras[index];
                            const total = Math.round((normal + extras) * 10) / 10;
                            const x = element.x;
                            const y = element.y - 8;
                            
                            ctx.fillStyle = titleColor;
                            ctx.font = `bold 11px 'Inter', 'Roboto', sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            ctx.fillText(Math.round(total) + 'h', x, y);
                        });
                    }
                });
            }
        }]
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
    
    // Agrupar por semana (igual ao gráfico de barras)
    const semanas = new Map();
    
    dados.forEach(reg => {
        if (!reg.entrada || !reg.saida) return;
        
        const data = new Date(reg.data);
        const ano = data.getFullYear();
        const semana = getWeekNumber(data);
        const chave = `${ano}-S${semana}`;
        
        if (!semanas.has(chave)) {
            semanas.set(chave, 0);
        }
        
        const extras = calcularHorasExtras(reg.data, reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
        const valorAtual = semanas.get(chave);
        semanas.set(chave, valorAtual + (extras / 60));
    });
    
    const labels = Array.from(semanas.keys()).reverse();
    const dataExtras = labels.map(label => Math.round(semanas.get(label) * 100) / 100);
    
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#E5E7EB' : '#1E293B';
    const titleColor = isDark ? '#F9FAFB' : '#111827';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)';
    
    chartLinha = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Horas Extras',
                    data: dataExtras,
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#F59E0B',
                    pointBorderColor: isDark ? '#111827' : '#fff',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { top: 10, left: 10, right: 10, bottom: 5 }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { 
                        color: titleColor,
                        font: { size: 13, weight: '600', family: "'Inter', 'Roboto', sans-serif" },
                        padding: 14,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 8,
                        boxHeight: 8
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1F2937' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDark ? '#F9FAFB' : '#111827',
                    bodyColor: isDark ? '#E5E7EB' : '#374151',
                    borderColor: isDark ? '#374151' : 'rgba(148, 163, 184, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    titleFont: { size: 13, weight: 'bold', family: "'Inter', 'Roboto', sans-serif" },
                    bodyFont: { size: 12, family: "'Inter', 'Roboto', sans-serif" },
                    boxWidth: 10,
                    boxHeight: 10,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            if (value === null || !isFinite(value) || isNaN(value)) {
                                return '';
                            }
                            
                            const label = context.dataset.label || '';
                            return `${label}: ${value.toFixed(1)}h extras`;
                        },
                        afterBody: function(context) {
                            if (context[0].datasetIndex === 1) {
                                return '\n━━━━━━━━━━\n💡 Média das últimas 3 semanas';
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { 
                        color: textColor,
                        font: { size: 11, weight: '500', family: "'Inter', 'Roboto', sans-serif" },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: { 
                        display: false
                    },
                    border: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: textColor,
                        font: { size: 11, weight: '500', family: "'Inter', 'Roboto', sans-serif" },
                        callback: function(value) {
                            return value + 'h';
                        }
                    },
                    grid: { 
                        color: gridColor,
                        drawBorder: false,
                        lineWidth: 0.5,
                        borderDash: [4, 4]
                    },
                    border: {
                        display: false
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
        s.total += calcularTotalTrabalhado(reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
        s.extras += calcularHorasExtras(reg.data, reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
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
    atualizarCardHoje();
    criarGraficoBarras(dados);
    criarGraficoPizza(dados);
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
        const totalMin = calcularTotalTrabalhado(agrupado.entrada, agrupado.saida, agrupado.almoco_saida, agrupado.almoco_volta);
        const horas = Math.floor(totalMin / 60);
        const minutos = totalMin % 60;
        
        if (document.getElementById('hojeTempo')) {
            document.getElementById('hojeTempo').textContent = `${horas}h ${minutos}min`;
        }
        
        // Calcular hora extra
        const extrasMin = calcularHorasExtras(hoje, agrupado.entrada, agrupado.saida, agrupado.almoco_saida, agrupado.almoco_volta);
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
            const totalMin = calcularTotalTrabalhado(reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
            horasPorDia[diaSemana] += totalMin / 60;
        });
        
        // Arredondar para evitar problemas de precisão
        const horasPorDiaArredondado = horasPorDia.map(h => Math.round(h * 100) / 100);
        
        // Manter a ordem cronológica (Dom → Sáb)
        const labels = diasSemana;
        const horas = horasPorDiaArredondado;
        const totalHoras = horas.reduce((a, b) => a + b, 0);
        
        // Paleta cronológica suave
        const cores = [
            '#FCA5A5', // Dom - Vermelho suave
            '#60A5FA', // Seg - Azul
            '#34D399', // Ter - Verde
            '#FBBF24', // Qua - Amarelo
            '#A78BFA', // Qui - Roxo
            '#EC4899', // Sex - Rosa
            '#FB923C'  // Sáb - Laranja
        ];
        
        const isDark = document.body.classList.contains('dark-theme');
        const textColor = isDark ? '#E5E7EB' : '#1E293B';
        const titleColor = isDark ? '#F9FAFB' : '#111827';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)';
        
        chartPizza = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Horas trabalhadas',
                    data: horas,
                    backgroundColor: cores,
                    borderRadius: 8,
                    borderWidth: 0,
                    barPercentage: 0.6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { 
                        right: 80, 
                        left: 10, 
                        top: 10, 
                        bottom: 10 
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1F2937' : 'rgba(255, 255, 255, 0.95)',
                        titleColor: isDark ? '#F9FAFB' : '#111827',
                        bodyColor: isDark ? '#E5E7EB' : '#374151',
                        borderColor: isDark ? '#374151' : 'rgba(148, 163, 184, 0.3)',
                        borderWidth: 1,
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold', family: "'Inter', 'Roboto', sans-serif" },
                        bodyFont: { size: 12, family: "'Inter', 'Roboto', sans-serif" },
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                const valor = context.parsed.x;
                                const percentual = ((valor / totalHoras) * 100).toFixed(1);
                                const horas = Math.floor(valor);
                                const minutos = Math.round((valor % 1) * 60);
                                return `${horas}h ${minutos}min (${percentual}% do total)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            color: textColor,
                            font: { size: 11, weight: '500', family: "'Inter', 'Roboto', sans-serif" },
                            callback: function(value) {
                                return value + 'h';
                            }
                        },
                        grid: {
                            color: gridColor,
                            drawBorder: false,
                            lineWidth: 0.5,
                            borderDash: [4, 4]
                        },
                        border: {
                            display: false
                        }
                    },
                    y: {
                        ticks: {
                            color: titleColor,
                            font: { size: 12, weight: '600', family: "'Inter', 'Roboto', sans-serif" }
                        },
                        grid: {
                            display: false
                        },
                        border: {
                            display: false
                        }
                    }
                }
            },
            plugins: [{
                id: 'barLabels',
                afterDatasetsDraw: function(chart) {
                    const ctx = chart.ctx;
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        if (!meta.hidden) {
                            meta.data.forEach((element, index) => {
                                const valor = horas[index];
                                const percentual = Math.round((valor / totalHoras) * 100);
                                const x = element.x + 8;
                                const y = element.y + 1;
                                
                                ctx.fillStyle = '#F9FAFB';
                                ctx.font = `bold 11px 'Inter', 'Roboto', sans-serif`;
                                ctx.textAlign = 'left';
                                ctx.textBaseline = 'middle';
                                
                                const label = `${Math.round(valor * 10) / 10}h (${percentual}%)`;
                                ctx.fillText(label, x, y);
                            });
                        }
                    });
                }
            }]
        });
        
    } catch (error) {
        console.error('❌ Erro ao criar gráfico de distribuição:', error);
    }
}

// Inicializar com atualização automática do card Hoje
setInterval(() => {
    if (document.getElementById('hojeTempo')) {
        atualizarCardHoje();
    }
}, 60000); // Atualizar a cada minuto

// ============================================
// FUNÇÕES DO MENU DE GRÁFICOS
// ============================================

function toggleChartMenu(event, menuId) {
    event.stopPropagation();
    const menu = document.getElementById(menuId);
    const allMenus = document.querySelectorAll('.chart-menu');
    
    // Fechar outros menus
    allMenus.forEach(m => {
        if (m.id !== menuId) {
            m.classList.remove('active');
        }
    });
    
    // Toggle do menu atual
    menu.classList.toggle('active');
}

function closeChartMenu(menuId) {
    const menu = document.getElementById(menuId);
    menu.classList.remove('active');
}

// Fechar menus ao clicar fora
document.addEventListener('click', () => {
    const allMenus = document.querySelectorAll('.chart-menu');
    allMenus.forEach(m => m.classList.remove('active'));
});

// ============================================
// FUNÇÕES DE ANÁLISE DOS GRÁFICOS
// ============================================

function abrirAnaliseBarras() {
    const dados = filtrarDadosPorPeriodo();
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
        
        const total = calcularTotalTrabalhado(reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
        const extras = calcularHorasExtras(reg.data, reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
        const normal = total - extras;
        
        const atual = semanas.get(chave);
        semanas.set(chave, {
            normal: atual.normal + (normal / 60),
            extras: atual.extras + (extras / 60)
        });
    });
    
    const valores = Array.from(semanas.values());
    const totais = valores.map(v => v.normal + v.extras);
    const mediaHoras = totais.reduce((a, b) => a + b, 0) / totais.length;
    const maxHoras = Math.max(...totais);
    const minHoras = Math.min(...totais);
    const acimaMeta = totais.filter(t => t >= 44).length;
    const percentualMeta = ((acimaMeta / totais.length) * 100).toFixed(1);
    
    const content = `
        <div class="analysis-section">
            <h4><i class="ri-bar-chart-line"></i> Resumo Geral</h4>
            <p>📊 Total de semanas analisadas: <span class="analysis-highlight">${totais.length}</span></p>
            <p>⏱️ Média semanal: <span class="analysis-highlight">${mediaHoras.toFixed(1)}h</span></p>
            <p>📈 Semana com mais horas: <span class="analysis-highlight">${maxHoras.toFixed(1)}h</span></p>
            <p>📉 Semana com menos horas: <span class="analysis-highlight">${minHoras.toFixed(1)}h</span></p>
        </div>
        
        <div class="analysis-section">
            <h4><i class="ri-target-line"></i> Cumprimento de Meta</h4>
            <p>🎯 Meta semanal: <span class="analysis-highlight">44h</span></p>
            <p>✅ Semanas que atingiram a meta: <span class="analysis-highlight">${acimaMeta} de ${totais.length} (${percentualMeta}%)</span></p>
            <p>${mediaHoras >= 44 ? '🎉 Parabéns! Você está acima da média da meta.' : '💪 Continue se esforçando para atingir a meta!'}</p>
        </div>
    `;
    
    mostrarAnalise('Análise - Horas Semanais', content);
}

function abrirAnaliseDistribuicao() {
    const dados = filtrarDadosPorPeriodo();
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const horasPorDia = new Array(7).fill(0);
    const diasContados = new Array(7).fill(0);
    
    dados.forEach(reg => {
        const data = new Date(reg.data + 'T00:00:00');
        const diaSemana = data.getDay();
        const totalMin = calcularTotalTrabalhado(reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
        horasPorDia[diaSemana] += totalMin / 60;
        diasContados[diaSemana]++;
    });
    
    const totalHoras = horasPorDia.reduce((a, b) => a + b, 0);
    const diaComMaisHoras = horasPorDia.indexOf(Math.max(...horasPorDia));
    const diaComMenosHoras = horasPorDia.indexOf(Math.min(...horasPorDia.filter(h => h > 0)));
    
    const content = `
        <div class="analysis-section">
            <h4><i class="ri-calendar-line"></i> Distribuição por Dia</h4>
            <p>📅 Total de horas trabalhadas: <span class="analysis-highlight">${totalHoras.toFixed(1)}h</span></p>
            <p>🏆 Dia com mais horas: <span class="analysis-highlight">${diasSemana[diaComMaisHoras]} (${horasPorDia[diaComMaisHoras].toFixed(1)}h)</span></p>
            <p>📉 Dia com menos horas: <span class="analysis-highlight">${diasSemana[diaComMenosHoras]} (${horasPorDia[diaComMenosHoras].toFixed(1)}h)</span></p>
        </div>
        
        <div class="analysis-section">
            <h4><i class="ri-pie-chart-line"></i> Percentuais</h4>
            ${diasSemana.map((dia, i) => {
                const percentual = ((horasPorDia[i] / totalHoras) * 100).toFixed(1);
                const dias = diasContados[i];
                return `<p>• ${dia}: <span class="analysis-highlight">${percentual}%</span> (${horasPorDia[i].toFixed(1)}h em ${dias} dia${dias !== 1 ? 's' : ''})</p>`;
            }).join('')}
        </div>
    `;
    
    mostrarAnalise('Análise - Distribuição Semanal', content);
}

function abrirAnaliseExtras() {
    const dados = filtrarDadosPorPeriodo();
    const semanas = new Map();
    
    dados.forEach(reg => {
        if (!reg.entrada || !reg.saida) return;
        const data = new Date(reg.data);
        const ano = data.getFullYear();
        const semana = getWeekNumber(data);
        const chave = `${ano}-S${semana}`;
        
        if (!semanas.has(chave)) {
            semanas.set(chave, 0);
        }
        
        const extras = calcularHorasExtras(reg.data, reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
        semanas.set(chave, semanas.get(chave) + (extras / 60));
    });
    
    const valores = Array.from(semanas.values());
    const totalExtras = valores.reduce((a, b) => a + b, 0);
    const mediaExtras = totalExtras / valores.length;
    const maxExtras = Math.max(...valores);
    const semanasComExtras = valores.filter(v => v > 0).length;
    const percentualExtras = ((semanasComExtras / valores.length) * 100).toFixed(1);
    
    const content = `
        <div class="analysis-section">
            <h4><i class="ri-time-line"></i> Resumo de Horas Extras</h4>
            <p>⚡ Total de horas extras: <span class="analysis-highlight">${totalExtras.toFixed(1)}h</span></p>
            <p>📊 Média semanal: <span class="analysis-highlight">${mediaExtras.toFixed(1)}h</span></p>
            <p>📈 Semana com mais extras: <span class="analysis-highlight">${maxExtras.toFixed(1)}h</span></p>
            <p>📅 Semanas com horas extras: <span class="analysis-highlight">${semanasComExtras} de ${valores.length} (${percentualExtras}%)</span></p>
        </div>
        
        <div class="analysis-section">
            <h4><i class="ri-lightbulb-line"></i> Recomendações</h4>
            ${mediaExtras > 8 
                ? '<p>⚠️ Sua média de horas extras está acima da meta de 8h/semana. Considere revisar sua carga de trabalho.</p>' 
                : '<p>✅ Sua média de horas extras está dentro da meta de 8h/semana. Continue assim!</p>'}
            <p>💡 Dica: Tente distribuir melhor suas tarefas ao longo da semana para evitar picos de trabalho.</p>
        </div>
    `;
    
    mostrarAnalise('Análise - Horas Extras', content);
}

function mostrarAnalise(titulo, conteudo) {
    const modal = document.getElementById('analysisModal');
    const title = document.getElementById('analysisTitle');
    const content = document.getElementById('analysisContent');
    
    title.textContent = titulo;
    content.innerHTML = conteudo;
    modal.classList.add('active');
}

function fecharAnalise() {
    const modal = document.getElementById('analysisModal');
    modal.classList.remove('active');
}

// ============================================
// FUNÇÕES DE EXPORTAR E COMPARTILHAR
// ============================================

function exportarDados(tipo) {
    const dados = filtrarDadosPorPeriodo();
    let csv = '';
    let filename = '';
    
    if (tipo === 'barras') {
        csv = 'Semana,Horas Normais,Horas Extras,Total\n';
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
            
            const total = calcularTotalTrabalhado(reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
            const extras = calcularHorasExtras(reg.data, reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
            const normal = total - extras;
            
            const atual = semanas.get(chave);
            semanas.set(chave, {
                normal: atual.normal + (normal / 60),
                extras: atual.extras + (extras / 60)
            });
        });
        
        semanas.forEach((valor, chave) => {
            const total = valor.normal + valor.extras;
            csv += `${chave},${valor.normal.toFixed(2)},${valor.extras.toFixed(2)},${total.toFixed(2)}\n`;
        });
        
        filename = 'horas-semanais.csv';
    } else if (tipo === 'distribuicao') {
        csv = 'Dia da Semana,Horas Trabalhadas\n';
        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const horasPorDia = new Array(7).fill(0);
        
        dados.forEach(reg => {
            const data = new Date(reg.data + 'T00:00:00');
            const diaSemana = data.getDay();
            const totalMin = calcularTotalTrabalhado(reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
            horasPorDia[diaSemana] += totalMin / 60;
        });
        
        diasSemana.forEach((dia, i) => {
            csv += `${dia},${horasPorDia[i].toFixed(2)}\n`;
        });
        
        filename = 'distribuicao-semanal.csv';
    } else if (tipo === 'extras') {
        csv = 'Semana,Horas Extras\n';
        const semanas = new Map();
        
        dados.forEach(reg => {
            if (!reg.entrada || !reg.saida) return;
            const data = new Date(reg.data);
            const ano = data.getFullYear();
            const semana = getWeekNumber(data);
            const chave = `${ano}-S${semana}`;
            
            if (!semanas.has(chave)) {
                semanas.set(chave, 0);
            }
            
            const extras = calcularHorasExtras(reg.data, reg.entrada, reg.saida, reg.almoco_saida, reg.almoco_volta);
            semanas.set(chave, semanas.get(chave) + (extras / 60));
        });
        
        semanas.forEach((valor, chave) => {
            csv += `${chave},${valor.toFixed(2)}\n`;
        });
        
        filename = 'horas-extras.csv';
    }
    
    // Download do CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    mostrarToast('✅ Dados exportados com sucesso!', 'success');
}

function compartilharGrafico(nomeGrafico) {
    if (navigator.share) {
        navigator.share({
            title: `Controle de Ponto - ${nomeGrafico}`,
            text: `Confira meu relatório de ${nomeGrafico}`,
            url: window.location.href
        }).then(() => {
            mostrarToast('✅ Compartilhado com sucesso!', 'success');
        }).catch(() => {
            copiarLink();
        });
    } else {
        copiarLink();
    }
}

function copiarLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        mostrarToast('🔗 Link copiado para área de transferência!', 'success');
    });
}

// ========================================
// REGISTRO RÁPIDO DE ALMOÇO (Dashboard)
// ========================================

function abrirRegistroRapido() {
    const modal = document.getElementById('registroRapidoModal');
    modal.classList.add('active');
    
    // Atualizar hora e data atual
    atualizarHorarioAtual();
    
    // Atualizar a cada segundo
    if (window.intervalHorarioAtual) {
        clearInterval(window.intervalHorarioAtual);
    }
    window.intervalHorarioAtual = setInterval(atualizarHorarioAtual, 1000);
}

function fecharRegistroRapido() {
    const modal = document.getElementById('registroRapidoModal');
    modal.classList.remove('active');
    
    if (window.intervalHorarioAtual) {
        clearInterval(window.intervalHorarioAtual);
    }
}

function atualizarHorarioAtual() {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    const horaDisplay = document.getElementById('horaAtualDisplay');
    const dataDisplay = document.getElementById('dataAtualDisplay');
    
    if (horaDisplay) {
        horaDisplay.textContent = `${horas}:${minutos}`;
    }
    
    if (dataDisplay) {
        dataDisplay.textContent = `${diasSemana[agora.getDay()]}, ${agora.getDate()} de ${meses[agora.getMonth()]} de ${agora.getFullYear()}`;
    }
}

function registrarHorarioRapido(tipo) {
    const agora = new Date();
    const dataHoje = agora.toISOString().split('T')[0];
    const horaAgora = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
    
    const registros = carregarDados();
    
    // Procurar registro do dia atual
    let registroHoje = registros.find(r => r.data === dataHoje);
    
    if (!registroHoje) {
        // Criar novo registro para hoje (só com almoço, entrada/saída vêm da catraca)
        registroHoje = {
            data: dataHoje,
            entrada: null,
            almoco_saida: null,
            almoco_volta: null,
            saida: null
        };
        registros.push(registroHoje);
    }
    
    // Atualizar APENAS horários de almoço
    switch(tipo) {
        case 'almoco_saida':
            registroHoje.almoco_saida = horaAgora;
            toast.success(`🍽️ Saída para almoço registrada: ${horaAgora}`);
            break;
        case 'almoco_volta':
            registroHoje.almoco_volta = horaAgora;
            toast.success(`🍽️ Retorno do almoço registrado: ${horaAgora}`);
            break;
        default:
            toast.error('❌ Tipo de registro inválido!');
            return;
    }
    
    // Salvar
    salvarDados(registros);
    
    // Atualizar dashboard
    atualizarDashboard();
    
    // Fechar modal após 1.5s
    setTimeout(() => {
        fecharRegistroRapido();
    }, 1500);
}

// Tornar funções globais
window.abrirRegistroRapido = abrirRegistroRapido;
window.fecharRegistroRapido = fecharRegistroRapido;
window.registrarHorarioRapido = registrarHorarioRapido;

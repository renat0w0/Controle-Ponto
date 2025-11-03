// registros.js - Gerenciamento da tabela de registros

// Variável para armazenar registros filtrados
let registrosFiltrados = null;

function removerRegistroEAtualizar(data, entrada) {
    if (confirm('⚠️ Deseja remover este registro?')) {
        removerRegistro(data, entrada);
        atualizarTabela();
    }
}

// Tornar função global para uso em onclick inline no HTML
window.removerRegistroEAtualizar = removerRegistroEAtualizar;

// Adicionar registro manual
function adicionarRegistroManual() {
    const data = document.getElementById('novaData').value;
    const hora = document.getElementById('novaHora').value;
    
    if (!data || !hora) {
        alert('⚠️ Por favor, preencha data e hora!');
        return;
    }
    
    const registros = carregarDados();
    
    // Adicionar novo registro
    registros.push({
        data: data,
        hora: hora,
        tipo: 'manual'
    });
    
    // Salvar
    localStorage.setItem('registros', JSON.stringify(registros));
    
    // Limpar campos
    document.getElementById('novaData').value = '';
    document.getElementById('novaHora').value = '';
    
    // Atualizar tabela
    atualizarTabela();
    
    alert('✅ Registro adicionado com sucesso!');
}

// Aplicar filtro de datas
function aplicarFiltro() {
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;
    
    if (!dataInicio || !dataFim) {
        alert('⚠️ Selecione as datas de início e fim!');
        return;
    }
    
    const registros = carregarDados();
    
    // Filtrar registros pelo período
    registrosFiltrados = registros.filter(reg => {
        return reg.data >= dataInicio && reg.data <= dataFim;
    });
    
    // Atualizar tabela com registros filtrados
    renderizarRegistros(registrosFiltrados);
}

// Limpar filtro
function limparFiltro() {
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataFim').value = '';
    registrosFiltrados = null;
    atualizarTabela();
}

// Renderizar registros (usado tanto para todos quanto para filtrados)
function renderizarRegistros(registros) {
    const tabelaDiv = document.getElementById('registrosTabela');
    
    console.log('📊 Renderizando registros:', registros.length);
    
    if (registros.length === 0) {
        tabelaDiv.innerHTML = `
            <div class="card">
                <div style="text-align: center; padding: 3rem;">
                    <i class="ri-inbox-line" style="font-size: 4rem; color: var(--text-color); opacity: 0.3;"></i>
                    <p style="color: var(--text-color); margin-top: 1rem; font-size: 1.1rem;">
                        ℹ️ Nenhum registro encontrado.
                    </p>
                    <p style="color: var(--text-color); opacity: 0.7; margin-top: 0.5rem;">
                        Vá em "Sincronizar API" para importar seus registros.
                    </p>
                </div>
            </div>
        `;
        atualizarEstatisticas(0, '-');
        return;
    }
    
    // Agrupar registros por data
    const registrosAgrupados = agruparRegistrosPorData(registros);
    
    console.log('📦 Registros agrupados:', registrosAgrupados.length);
    
    // Ordenar por data (mais recente primeiro)
    registrosAgrupados.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    // Calcular período
    const datas = registrosAgrupados.map(r => r.data).sort();
    const dataInicio = datas[0];
    const dataFim = datas[datas.length - 1];
    const periodo = dataInicio === dataFim ? formatarData(dataInicio) : `${formatarData(dataInicio)} até ${formatarData(dataFim)}`;
    
    let html = '<div class="card">';
    html += '<div style="overflow-x: auto;">';
    html += '<table class="table"><thead><tr>';
    html += '<th>Data</th><th>Dia</th><th>Entrada</th><th>Saída</th><th>Total</th><th>Hora Extra</th>';
    html += '</tr></thead><tbody>';
    
    registrosAgrupados.forEach(reg => {
        const totalMin = calcularTotalTrabalhado(reg.entrada, reg.saida);
        const extrasMin = calcularHorasExtras(reg.data, reg.entrada, reg.saida);
        const diaSemana = obterDiaDaSemana(reg.data);
        const isFimDeSemana = ehFimDeSemana(reg.data);
        
        // Classes para linha de fim de semana
        const rowClass = isFimDeSemana ? 'weekend-row' : '';
        
        // Badge do dia
        const badgeDiaClass = isFimDeSemana ? 'badge-dia badge-weekend' : 'badge-dia';
        
        // Badge de horas extras
        let extraBadgeClass = 'badge-extra neutral';
        let extraPrefix = '';
        if (extrasMin > 0) {
            extraBadgeClass = 'badge-extra positive';
            extraPrefix = '+';
        } else if (extrasMin < 0) {
            extraBadgeClass = 'badge-extra negative';
        }
        
        html += `<tr class="${rowClass}">`;
        html += `<td><strong>${formatarData(reg.data)}</strong></td>`;
        html += `<td><span class="${badgeDiaClass}">${diaSemana}</span></td>`;
        html += `<td>${reg.entrada || '-'}</td>`;
        html += `<td>${reg.saida || '-'}</td>`;
        html += `<td><strong>${formatarMinutosParaHoras(totalMin)}</strong></td>`;
        html += `<td><span class="${extraBadgeClass}">${extraPrefix}${formatarMinutosParaHoras(Math.abs(extrasMin))}</span></td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    html += '</div></div>';
    tabelaDiv.innerHTML = html;
    
    // Atualizar estatísticas
    atualizarEstatisticas(registrosAgrupados.length, periodo);
}

function atualizarEstatisticas(total, periodo) {
    const totalEl = document.getElementById('totalRegistros');
    const periodoEl = document.getElementById('periodoAtual');
    
    if (totalEl) totalEl.textContent = total;
    if (periodoEl) periodoEl.textContent = periodo;
}

// Atualizar a função original para usar renderizarRegistros
function atualizarTabela() {
    const registros = registrosFiltrados || carregarDados();
    renderizarRegistros(registros);
}

// Tornar funções globais
window.adicionarRegistroManual = adicionarRegistroManual;
window.aplicarFiltro = aplicarFiltro;
window.limparFiltro = limparFiltro;

// Carregar tabela ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 Página de registros carregada');
    
    // Verificar se há dados
    const registros = carregarDados();
    console.log('📊 Total de registros no localStorage:', registros.length);
    
    // Mostrar um exemplo de registro
    if (registros.length > 0) {
        console.log('📄 Exemplo de registro:', JSON.stringify(registros[0]));
    }
    
    // Definir filtros padrão para mostrar últimos 90 dias
    const hoje = new Date();
    const noventaDiasAtras = new Date();
    noventaDiasAtras.setDate(hoje.getDate() - 90);
    
    document.getElementById('filtroDataInicio').value = noventaDiasAtras.toISOString().split('T')[0];
    document.getElementById('filtroDataFim').value = hoje.toISOString().split('T')[0];
    
    // Carregar tabela sem filtro (mostrar tudo)
    registrosFiltrados = null;
    atualizarTabela();
});

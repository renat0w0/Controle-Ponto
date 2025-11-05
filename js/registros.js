// registros.js - Gerenciamento da tabela de registros

// Variável para armazenar registros filtrados
let registrosFiltrados = null;

// Paginação
let paginaAtual = 1;
const ITENS_POR_PAGINA = 50;

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
    
    // Resetar para página 1
    paginaAtual = 1;
    
    // Atualizar tabela com registros filtrados
    renderizarRegistros(registrosFiltrados);
}

// Limpar filtro
function limparFiltro() {
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataFim').value = '';
    registrosFiltrados = null;
    paginaAtual = 1; // Resetar página
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
                        Vá em "Gerar Dados" para importar seus registros.
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
    
    // Paginação
    const totalPaginas = Math.ceil(registrosAgrupados.length / ITENS_POR_PAGINA);
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    const registrosPaginados = registrosAgrupados.slice(inicio, fim);
    
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
    
    registrosPaginados.forEach(reg => {
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
    html += '</div>';
    
    // Adicionar controles de paginação
    if (totalPaginas > 1) {
        html += '<div class="pagination-controls" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-top: 1px solid var(--border-color);">';
        html += `<div class="pagination-info" style="color: var(--text-color); font-size: 0.9rem;">Página ${paginaAtual} de ${totalPaginas} • Mostrando ${registrosPaginados.length} de ${registrosAgrupados.length} registros</div>`;
        html += '<div class="pagination-buttons" style="display: flex; gap: 0.75rem; align-items: center;">';
        
        // Botão Anterior
        if (paginaAtual > 1) {
            html += `<button onclick="mudarPagina(${paginaAtual - 1})" class="btn btn-primary btn-pagination"><i class="ri-arrow-left-s-line"></i></button>`;
        } else {
            html += `<button disabled class="btn btn-pagination" style="background: var(--border-color); color: var(--text-color-light); cursor: not-allowed; opacity: 0.5;"><i class="ri-arrow-left-s-line"></i></button>`;
        }
        
        // Números de página (mostrar até 5 páginas)
        const maxBotoes = 5;
        let inicioRange = Math.max(1, paginaAtual - Math.floor(maxBotoes / 2));
        let fimRange = Math.min(totalPaginas, inicioRange + maxBotoes - 1);
        
        if (fimRange - inicioRange < maxBotoes - 1) {
            inicioRange = Math.max(1, fimRange - maxBotoes + 1);
        }
        
        for (let i = inicioRange; i <= fimRange; i++) {
            if (i === paginaAtual) {
                html += `<button class="btn btn-primary btn-pagination active">${i}</button>`;
            } else {
                html += `<button onclick="mudarPagina(${i})" class="btn btn-pagination" style="background: var(--body-color); color: var(--text-color); border: 1px solid var(--border-color);">${i}</button>`;
            }
        }
        
        // Botão Próximo
        if (paginaAtual < totalPaginas) {
            html += `<button onclick="mudarPagina(${paginaAtual + 1})" class="btn btn-primary btn-pagination"><i class="ri-arrow-right-s-line"></i></button>`;
        } else {
            html += `<button disabled class="btn btn-pagination" style="background: var(--border-color); color: var(--text-color-light); cursor: not-allowed; opacity: 0.5;"><i class="ri-arrow-right-s-line"></i></button>`;
        }
        
        html += '</div></div>';
    }
    
    html += '</div>';
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

// Função para mudar de página
function mudarPagina(novaPagina) {
    paginaAtual = novaPagina;
    atualizarTabela();
    // Scroll suave para o topo da página
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.mudarPagina = mudarPagina;

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

// Função para exportar PDF
function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const registros = registrosFiltrados || carregarDados();
    
    if (registros.length === 0) {
        alert('Não há registros para exportar!');
        return;
    }
    
    // Agrupar registros por data usando a mesma função da tabela
    const registrosAgrupados = agruparRegistrosPorData(registros);
    
    // Ordenar por data
    registrosAgrupados.sort((a, b) => a.data.localeCompare(b.data));
    
    // Preparar dados para a tabela
    const tableData = [];
    let totalHoras = 0;
    let totalExtras = 0;
    
    registrosAgrupados.forEach(reg => {
        // Calcular horas do dia
        let horasDoDia = 0;
        if (reg.entrada && reg.saida) {
            const [hE, mE] = reg.entrada.split(':').map(Number);
            const [hS, mS] = reg.saida.split(':').map(Number);
            horasDoDia = (hS * 60 + mS - hE * 60 - mE) / 60;
            totalHoras += horasDoDia;
        }
        
        // Calcular hora extra
        const extrasMin = calcularHorasExtras(reg.data, reg.entrada, reg.saida);
        const horasExtras = extrasMin / 60;
        totalExtras += horasExtras;
        
        // Formatar data
        const [ano, mes, dia] = reg.data.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;
        
        // Dia da semana
        const diaSemana = obterDiaDaSemana(reg.data);
        
        // Horários
        const horarios = reg.entrada && reg.saida ? `${reg.entrada} - ${reg.saida}` : '-';
        
        // Formatar hora extra
        let horaExtraStr = '-';
        if (extrasMin > 0) {
            horaExtraStr = `+${Math.floor(horasExtras)}h ${Math.round((horasExtras % 1) * 60)}min`;
        } else if (extrasMin < 0) {
            const abs = Math.abs(horasExtras);
            horaExtraStr = `-${Math.floor(abs)}h ${Math.round((abs % 1) * 60)}min`;
        }
        
        tableData.push([
            dataFormatada,
            diaSemana,
            horarios,
            horasDoDia > 0 ? `${Math.floor(horasDoDia)}h ${Math.round((horasDoDia % 1) * 60)}min` : '-',
            horaExtraStr
        ]);
    });
    
    // Título
    doc.setFontSize(18);
    doc.text('Relatório de Ponto', 14, 20);
    
    // Período
    doc.setFontSize(11);
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;
    if (dataInicio && dataFim) {
        const [aI, mI, dI] = dataInicio.split('-');
        const [aF, mF, dF] = dataFim.split('-');
        doc.text(`Período: ${dI}/${mI}/${aI} a ${dF}/${mF}/${aF}`, 14, 28);
    } else {
        doc.text(`Total de ${registros.length} registros`, 14, 28);
    }
    
    // Tabela
    doc.autoTable({
        head: [['Data', 'Dia', 'Horários', 'Total', 'H. Extra']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 28 },
            1: { cellWidth: 20 },
            2: { cellWidth: 50 },
            3: { cellWidth: 28 },
            4: { cellWidth: 28, halign: 'center' }
        }
    });
    
    // Total
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total de Horas: ${Math.floor(totalHoras)}h ${Math.round((totalHoras % 1) * 60)}min`, 14, finalY);
    
    // Total de horas extras
    if (totalExtras !== 0) {
        const absExtras = Math.abs(totalExtras);
        const sinal = totalExtras > 0 ? '+' : '-';
        doc.text(`Total de Horas Extras: ${sinal}${Math.floor(absExtras)}h ${Math.round((absExtras % 1) * 60)}min`, 14, finalY + 7);
    }
    
    // Informações do usuário
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const nomeUsuario = usuario.nome || 'Usuário';
    const emailUsuario = usuario.email || 'N/A';
    
    // Footer com informações
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    
    // Linha 1: Exportado por
    doc.text(`Exportado por: ${nomeUsuario} (${emailUsuario})`, 14, pageHeight - 20);
    
    // Linha 2: Registros de
    doc.text(`Registros de: ${nomeUsuario}`, 14, pageHeight - 15);
    
    // Linha 3: Data/hora da exportação
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, pageHeight - 10);
    
    // Download
    const nomeArquivo = `registros-ponto-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nomeArquivo);
    
    console.log('📄 PDF exportado:', nomeArquivo);
}

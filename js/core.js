// core.js - Funções compartilhadas e configurações globais

const CONFIG = {
    horaEntradaNormal: { hora: 7, minuto: 30 },
    horaSaidaNormal: { hora: 17, minuto: 30 },
    cargaHorariaDiaria: 540, // 9 horas em minutos
    jornadaNormal: 520 // 8h40min em minutos (jornada padrão para cálculo de extras)
};

// Funções de utilidade
function formatarMinutosParaHoras(minutos) {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${String(mins).padStart(2, '0')}min`;
}

function formatarData(dataStr) {
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}

function converterParaMinutos(horaStr) {
    if (!horaStr) return 0;
    const [hora, minuto] = horaStr.split(':').map(Number);
    return hora * 60 + minuto;
}

function converterMinutosParaHora(minutos) {
    const hora = Math.floor(minutos / 60);
    const minuto = minutos % 60;
    return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
}

function obterDiaDaSemana(dataStr) {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const data = new Date(dataStr + 'T00:00:00');
    return dias[data.getDay()];
}

function ehFimDeSemana(dataStr) {
    const data = new Date(dataStr + 'T00:00:00');
    const diaSemana = data.getDay();
    return diaSemana === 0 || diaSemana === 6;
}

function calcularHorasExtras(dataStr, entrada, saida) {
    const data = new Date(dataStr + 'T00:00:00');
    const diaSemana = data.getDay();
    
    // Fim de semana = todo período é extra
    if (diaSemana === 0 || diaSemana === 6) {
        return calcularTotalTrabalhado(entrada, saida);
    }
    
    // Dia de semana - calcula extras após 17:30
    const minutosSaida = converterParaMinutos(saida);
    const horaSaidaNormal = 17 * 60 + 30; // 17:30 em minutos = 1050
    
    if (minutosSaida > horaSaidaNormal) {
        return minutosSaida - horaSaidaNormal;
    }
    
    return 0;
}

function calcularTotalTrabalhado(entrada, saida) {
    const minutosEntrada = converterParaMinutos(entrada);
    const minutosSaida = converterParaMinutos(saida);
    return minutosSaida - minutosEntrada;
}

// Gerenciamento de dados no localStorage
function carregarDados() {
    const dados = localStorage.getItem('registros');
    return dados ? JSON.parse(dados) : [];
}

function salvarDados(registros) {
    localStorage.setItem('registros', JSON.stringify(registros));
}

function adicionarRegistro(registro) {
    const registros = carregarDados();
    registros.push(registro);
    salvarDados(registros);
}

function removerRegistro(data, entrada) {
    let registros = carregarDados();
    registros = registros.filter(r => !(r.data === data && r.entrada === entrada));
    salvarDados(registros);
}

function limparDados() {
    abrirModal(
        'Tem certeza que deseja limpar todos os dados?',
        'Esta ação não pode ser desfeita e todos os registros serão removidos permanentemente.',
        () => {
            localStorage.removeItem('registros');
            fecharModal();
            
            // Mostrar notificação de sucesso
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:1rem 1.5rem;border-radius:12px;box-shadow:0 8px 16px rgba(0,0,0,0.2);z-index:10001;animation:slideIn 0.3s ease;';
            overlay.innerHTML = '<i class="ri-check-line" style="margin-right:8px;"></i>Dados removidos com sucesso!';
            document.body.appendChild(overlay);
            
            setTimeout(() => {
                overlay.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => window.location.reload(), 300);
            }, 2000);
        }
    );
}

// Funções do Modal
function abrirModal(titulo, mensagem, onConfirm) {
    const modal = document.getElementById('confirmModal');
    
    if (!modal) {
        console.error('Modal não encontrado! Certifique-se de que o HTML do modal está na página.');
        // Fallback para o confirm padrão
        if (confirm(mensagem)) {
            onConfirm();
        }
        return;
    }
    
    const modalTitle = modal.querySelector('.modal__title');
    const modalMessage = modal.querySelector('.modal__message');
    const confirmBtn = modal.querySelector('#modalConfirmBtn');
    
    modalTitle.textContent = titulo;
    modalMessage.textContent = mensagem;
    
    // Remover listeners antigos e adicionar novo
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', onConfirm);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
    const modal = document.getElementById('confirmModal');
    if (e.target === modal) {
        fecharModal();
    }
});

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fecharModal();
    }
});


// Exportar CSV
function exportarCSV() {
    const registros = carregarDados();
    
    if (registros.length === 0) {
        alert('⚠️ Não há registros para exportar!');
        return;
    }
    
    // Cabeçalho com BOM UTF-8
    let csv = '\uFEFF';
    csv += 'Data;Entrada;Saída;Total Trabalhado;Horas Extras\n';
    
    registros.forEach(reg => {
        const totalMin = calcularTotalTrabalhado(reg.entrada, reg.saida);
        const extrasMin = calcularHorasExtras(reg.data, reg.entrada, reg.saida);
        
        csv += `${formatarData(reg.data)};`;
        csv += `${reg.entrada};`;
        csv += `${reg.saida};`;
        csv += `${formatarMinutosParaHoras(totalMin)};`;
        csv += `${formatarMinutosParaHoras(extrasMin)}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `registros_ponto_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Agrupar registros por data
function agruparRegistrosPorData(registros) {
    const mapa = new Map();
    
    registros.forEach(reg => {
        // Se já vem agrupado (tem entrada/saida), só passar direto
        if (reg.entrada && reg.saida) {
            if (!mapa.has(reg.data)) {
                mapa.set(reg.data, { entrada: reg.entrada, saida: reg.saida });
            }
            return;
        }
        
        // Caso contrário, agrupar pelo campo 'hora'
        if (!reg.data || !reg.hora) {
            console.warn('⚠️ Registro inválido:', JSON.stringify(reg));
            return;
        }
        
        if (!mapa.has(reg.data)) {
            mapa.set(reg.data, { entrada: null, saida: null });
        }
        
        const dia = mapa.get(reg.data);
        const minutos = converterParaMinutos(reg.hora);
        
        if (!dia.entrada || minutos < converterParaMinutos(dia.entrada)) {
            dia.entrada = reg.hora;
        }
        if (!dia.saida || minutos > converterParaMinutos(dia.saida)) {
            dia.saida = reg.hora;
        }
    });
    
    return Array.from(mapa.entries()).map(([data, horarios]) => ({
        data,
        entrada: horarios.entrada,
        saida: horarios.saida
    }));
}

// Proteção de acesso: redireciona para login se não estiver autenticado
(function(){
    const paginasProtegidas = [
        'dashboard.html',
        'registros.html',
        'importar.html',
        'api.html'
    ];
    const paginaAtual = window.location.pathname.split('/').pop();
    if (paginasProtegidas.includes(paginaAtual)) {
        const token = localStorage.getItem('apiToken');
        if (!token) {
            window.location.href = 'login.html';
        }
    }
})();

// Tornar funções disponíveis globalmente para uso em onclick inline no HTML
window.limparDados = limparDados;
window.exportarCSV = exportarCSV;

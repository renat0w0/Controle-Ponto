// Funções compartilhadas

const CONFIG = {
    horaEntradaNormal: { hora: 7, minuto: 30 },
    horaSaidaNormal: { hora: 17, minuto: 30 },
    cargaHorariaDiaria: 540,
    jornadaNormal: 520
};

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
    if (diaSemana === 0 || diaSemana === 6) {
        return calcularTotalTrabalhado(entrada, saida);
    }
    
    const minutosSaida = converterParaMinutos(saida);
    const horaSaidaNormal = 17 * 60 + 30;
    
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

function carregarDados() {
    return Storage.registros.get();
}

function salvarDados(registros) {
    Storage.registros.set(registros);
}

function adicionarRegistro(registro) {
    Storage.registros.add(registro);
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
            Storage.registros.clear();
            fecharModal();
            
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

function abrirModal(titulo, mensagem, onConfirm) {
    const modal = document.getElementById('confirmModal');
    
    if (!modal) {
        console.error('Modal não encontrado! Certifique-se de que o HTML do modal está na página.');
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

function exportarCSV() {
    const registros = carregarDados();
    
    if (registros.length === 0) {
        alert('⚠️ Não há registros para exportar!');
        return;
    }
    
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

function agruparRegistrosPorData(registros) {
    const mapa = new Map();
    
    registros.forEach(reg => {
        if (reg.entrada && reg.saida) {
            if (!mapa.has(reg.data)) {
                mapa.set(reg.data, { entrada: reg.entrada, saida: reg.saida });
            }
            return;
        }
        
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

(function(){
    const paginasProtegidas = [
        'dashboard.html',
        'registros.html',
        'importar.html',
        'api.html'
    ];
    const paginaAtual = window.location.pathname.split('/').pop();
    if (paginasProtegidas.includes(paginaAtual)) {
        const token = Storage.auth.getToken();
        if (!token) {
            window.location.href = 'login.html';
        }
    }
})();

function iniciarTimerHeader() {
    const timerDisplay = document.getElementById('timerDisplay');
    if (!timerDisplay) return;
    
    function atualizarTimer() {
        const registros = carregarDados();
        const hoje = new Date().toISOString().split('T')[0];
        
        // Filtrar registros de hoje
        const registrosHoje = registros.filter(r => r.data === hoje);
        
        if (registrosHoje.length === 0) {
            timerDisplay.textContent = '⏱️ 0h 0min';
            return;
        }
        
        registrosHoje.sort((a, b) => a.hora.localeCompare(b.hora));
        
        const entrada = registrosHoje[0].hora;
        const agora = new Date();
        const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
        
        const saida = registrosHoje.length > 1 ? registrosHoje[registrosHoje.length - 1].hora : horaAtual;
        
        const [hE, mE] = entrada.split(':').map(Number);
        const [hS, mS] = saida.split(':').map(Number);
        
        const totalMinutos = (hS * 60 + mS) - (hE * 60 + mE);
        const horas = Math.floor(totalMinutos / 60);
        const minutos = totalMinutos % 60;
        
        timerDisplay.textContent = `⏱️ ${horas}h ${minutos}min`;
        
        if (registrosHoje.length % 2 !== 0) {
            timerDisplay.style.color = '#10b981';
        } else {
            timerDisplay.style.color = 'var(--text-color)';
        }
    }
    
    atualizarTimer();
    setInterval(atualizarTimer, 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarTimerHeader);
} else {
    iniciarTimerHeader();
}

window.limparDados = limparDados;
window.exportarCSV = exportarCSV;

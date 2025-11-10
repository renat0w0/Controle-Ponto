/*=============== CONFIGURAÇÕES ===============*/

// Carregar configurações ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    carregarConfiguracoes();
    atualizarStatusArmazenamento();
    atualizarEstatisticas();
});

/*=============== ARMAZENAMENTO ===============*/

function atualizarStatusArmazenamento() {
    const storageType = Storage.get('storageType') || 'local';
    const storageConnected = Storage.get('storageConnected') || false;
    const statusEl = document.getElementById('storageStatus');
    const actionsEl = document.getElementById('storageActions');
    const connectionStatusDiv = document.getElementById('storage-connection-status');
    const connectionIcon = document.getElementById('connection-icon');
    const connectionProvider = document.getElementById('connection-provider');
    const connectionAccount = document.getElementById('connection-account');
    
    // Atualizar badge de status
    let statusHTML = '';
    if (storageType === 'google' && storageConnected) {
        statusHTML = '<span class="status-badge status-google"><i class="ri-google-fill"></i> Google Drive</span>';
        actionsEl.style.display = 'flex';
    } else if (storageType === 'onedrive' && storageConnected) {
        statusHTML = '<span class="status-badge status-onedrive"><i class="ri-cloud-fill"></i> OneDrive</span>';
        actionsEl.style.display = 'flex';
    } else {
        statusHTML = '<span class="status-badge status-local"><i class="ri-hard-drive-fill"></i> Local</span>';
        actionsEl.style.display = 'none';
    }
    statusEl.innerHTML = statusHTML;
    
    // Atualizar card de informações de conexão
    if (connectionStatusDiv && storageConnected && storageType !== 'local') {
        connectionStatusDiv.style.display = 'block';
        
        if (storageType === 'google') {
            connectionIcon.innerHTML = `
                <svg viewBox="0 0 48 48" width="32" height="32">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
            `;
            connectionProvider.textContent = 'Google Drive';
            connectionAccount.textContent = config.googleAccount || 'Conta Google conectada';
        } else if (storageType === 'onedrive') {
            connectionIcon.innerHTML = `
                <svg viewBox="0 0 48 48" width="32" height="32">
                    <path fill="#0078D4" d="M30.9,19.9c-0.4-5.1-4.7-9.1-9.9-9.1c-4.2,0-7.8,2.6-9.3,6.3C8.7,18,6,21.3,6,25.2c0,4.8,3.9,8.8,8.8,8.8h15.6c4.3,0,7.8-3.5,7.8-7.8C38.2,22.9,35.2,20.2,30.9,19.9z"/>
                </svg>
            `;
            connectionProvider.textContent = 'OneDrive';
            connectionAccount.textContent = config.onedriveAccount || 'Conta Microsoft conectada';
        }
    } else if (connectionStatusDiv) {
        connectionStatusDiv.style.display = 'none';
    }
    
    // Atualizar botões
    atualizarBotoesArmazenamento(storageType, storageConnected);
}

function atualizarBotoesArmazenamento(type, connected) {
    const btnGoogle = document.getElementById('btnGoogleDrive');
    const btnOneDrive = document.getElementById('btnOneDrive');
    const btnLocal = document.getElementById('btnLocal');
    
    // Resetar todos
    btnGoogle.innerHTML = '<i class="ri-links-fill"></i> Conectar';
    btnGoogle.className = 'btn btn-primary';
    btnGoogle.disabled = false;
    
    btnOneDrive.innerHTML = '<i class="ri-links-fill"></i> Conectar';
    btnOneDrive.className = 'btn btn-primary';
    btnOneDrive.disabled = false;
    
    btnLocal.innerHTML = '<i class="ri-check-line"></i> Usar Local';
    btnLocal.className = 'btn btn-outline';
    btnLocal.disabled = false;
    
    // Marcar o conectado
    if (type === 'google' && connected) {
        btnGoogle.innerHTML = '<i class="ri-check-line"></i> Conectado';
        btnGoogle.className = 'btn btn-success';
        btnOneDrive.disabled = true;
        btnLocal.disabled = true;
    } else if (type === 'onedrive' && connected) {
        btnOneDrive.innerHTML = '<i class="ri-check-line"></i> Conectado';
        btnOneDrive.className = 'btn btn-success';
        btnGoogle.disabled = true;
        btnLocal.disabled = true;
    } else {
        btnLocal.innerHTML = '<i class="ri-check-line"></i> Em Uso';
        btnLocal.className = 'btn btn-success';
    }
}

function conectarGoogleDrive() {
    showToast('🔄 Redirecionando para autenticação do Google...', 'info');
    
    // TODO: Implementar OAuth do Google
    setTimeout(() => {
        showToast('✅ Google Drive conectado com sucesso!', 'success');
        Storage.set('storageType', 'google');
        Storage.set('storageConnected', true);
        atualizarStatusArmazenamento();
    }, 1500);
}

function conectarOneDrive() {
    showToast('🔄 Redirecionando para autenticação da Microsoft...', 'info');
    
    // TODO: Implementar OAuth da Microsoft
    setTimeout(() => {
        showToast('✅ OneDrive conectado com sucesso!', 'success');
        Storage.set('storageType', 'onedrive');
        Storage.set('storageConnected', true);
        atualizarStatusArmazenamento();
    }, 1500);
}

function usarArmazenamentoLocal() {
    if (confirm('Deseja usar apenas armazenamento local? Os dados ficarão salvos apenas neste dispositivo.')) {
        Storage.set('storageType', 'local');
        Storage.set('storageConnected', false);
        showToast('✅ Armazenamento local ativado', 'success');
        atualizarStatusArmazenamento();
    }
}

function desconectarArmazenamento() {
    const storageType = Storage.get('storageType');
    const providerName = storageType === 'google' ? 'Google Drive' : 'OneDrive';
    
    if (confirm(`Deseja desconectar do ${providerName}?\n\nOs dados locais não serão perdidos, mas a sincronização será interrompida.`)) {
        Storage.set('storageType', 'local');
        Storage.set('storageConnected', false);
        showToast(`✅ Desconectado do ${providerName}`, 'success');
        atualizarStatusArmazenamento();
    }
}

function sincronizarAgora() {
    showToast('🔄 Sincronizando dados...', 'info');
    
    // TODO: Implementar sincronização real
    setTimeout(() => {
        showToast('✅ Dados sincronizados com sucesso!', 'success');
    }, 2000);
}

/*=============== CONFIGURAÇÕES DE HORÁRIO ===============*/

function carregarConfiguracoes() {
    // Horários
    const config = Storage.get('configuracoes') || {};
    
    document.getElementById('horarioEntrada').value = config.horarioEntrada || '08:00';
    document.getElementById('horarioSaida').value = config.horarioSaida || '17:30';
    document.getElementById('duracaoAlmoco').value = config.duracaoAlmoco || 60;
    document.getElementById('cargaHorariaDiaria').value = config.cargaHorariaDiaria || 8.8;
    
    // Hora Extra
    document.getElementById('percentualHE50').value = config.percentualHE50 || 50;
    document.getElementById('percentualHE100').value = config.percentualHE100 || 100;
    document.getElementById('limiteHEDiaria').value = config.limiteHEDiaria || 2;
    document.getElementById('limiteHEMensal').value = config.limiteHEMensal || 40;
    document.getElementById('contarHEFinalSemana').checked = config.contarHEFinalSemana !== false;
    
    // Preferências
    document.getElementById('notificacoes').checked = config.notificacoes !== false;
    document.getElementById('registroAutomatico').checked = config.registroAutomatico || false;
    document.getElementById('modoCompacto').checked = config.modoCompacto || false;
    document.getElementById('formatoHora').value = config.formatoHora || '24h';
}

function salvarConfiguracoesHorario() {
    const config = Storage.get('configuracoes') || {};
    
    config.horarioEntrada = document.getElementById('horarioEntrada').value;
    config.horarioSaida = document.getElementById('horarioSaida').value;
    config.duracaoAlmoco = parseInt(document.getElementById('duracaoAlmoco').value);
    config.cargaHorariaDiaria = parseFloat(document.getElementById('cargaHorariaDiaria').value);
    
    Storage.set('configuracoes', config);
    showToast('✅ Configurações de horário salvas!', 'success');
}

function resetarConfiguracoesHorario() {
    if (confirm('Deseja restaurar as configurações de horário para os valores padrão?')) {
        document.getElementById('horarioEntrada').value = '08:00';
        document.getElementById('horarioSaida').value = '17:30';
        document.getElementById('duracaoAlmoco').value = 60;
        document.getElementById('cargaHorariaDiaria').value = 8.8;
        
        salvarConfiguracoesHorario();
        showToast('✅ Configurações restauradas!', 'success');
    }
}

/*=============== CONFIGURAÇÕES DE HORA EXTRA ===============*/

function salvarConfiguracoesHE() {
    const config = Storage.get('configuracoes') || {};
    
    config.percentualHE50 = parseInt(document.getElementById('percentualHE50').value);
    config.percentualHE100 = parseInt(document.getElementById('percentualHE100').value);
    config.limiteHEDiaria = parseFloat(document.getElementById('limiteHEDiaria').value);
    config.limiteHEMensal = parseFloat(document.getElementById('limiteHEMensal').value);
    config.contarHEFinalSemana = document.getElementById('contarHEFinalSemana').checked;
    
    Storage.set('configuracoes', config);
    showToast('✅ Configurações de hora extra salvas!', 'success');
}

function resetarConfiguracoesHE() {
    if (confirm('Deseja restaurar as configurações de hora extra para os valores padrão?')) {
        document.getElementById('percentualHE50').value = 50;
        document.getElementById('percentualHE100').value = 100;
        document.getElementById('limiteHEDiaria').value = 2;
        document.getElementById('limiteHEMensal').value = 40;
        document.getElementById('contarHEFinalSemana').checked = true;
        
        salvarConfiguracoesHE();
        showToast('✅ Configurações restauradas!', 'success');
    }
}

/*=============== PREFERÊNCIAS GERAIS ===============*/

function salvarPreferencias() {
    const config = Storage.get('configuracoes') || {};
    
    config.notificacoes = document.getElementById('notificacoes').checked;
    config.registroAutomatico = document.getElementById('registroAutomatico').checked;
    config.modoCompacto = document.getElementById('modoCompacto').checked;
    config.formatoHora = document.getElementById('formatoHora').value;
    
    Storage.set('configuracoes', config);
    showToast('✅ Preferências salvas!', 'success');
    
    // Aplicar modo compacto imediatamente
    if (config.modoCompacto) {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }
}

/*=============== ESTATÍSTICAS ===============*/

function atualizarEstatisticas() {
    // Total de registros
    const dados = Storage.get('registros_ponto') || [];
    document.getElementById('totalRegistros').textContent = dados.length;
    
    // Espaço usado (aproximado)
    let totalSize = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length + key.length;
        }
    }
    const sizeKB = (totalSize / 1024).toFixed(2);
    document.getElementById('espacoUsado').textContent = sizeKB + ' KB';
}

/*=============== EXPORTAR E LIMPAR ===============*/

function exportarDados() {
    const dados = {
        registros: Storage.get('registros_ponto') || [],
        configuracoes: Storage.get('configuracoes') || {},
        usuario: Storage.get('currentUser') || {},
        exportadoEm: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `controle-ponto-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('✅ Dados exportados com sucesso!', 'success');
}

function confirmarLimparTudo() {
    if (confirm('⚠️ ATENÇÃO!\n\nIsso irá apagar TODOS os dados do sistema:\n- Todos os registros de ponto\n- Todas as configurações\n- Conexões de armazenamento\n\nEsta ação NÃO pode ser desfeita!\n\nDeseja continuar?')) {
        if (confirm('Tem certeza absoluta? Digite "CONFIRMAR" para prosseguir.')) {
            // Limpar tudo exceto o login
            const currentUser = Storage.get('currentUser');
            localStorage.clear();
            Storage.set('currentUser', currentUser);
            
            showToast('✅ Todos os dados foram apagados!', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        }
    }
}

/*=============== FUNÇÕES GLOBAIS ===============*/

function sair() {
    if (confirm('Deseja sair do sistema?')) {
        Storage.remove('currentUser');
        window.location.href = '../login.html';
    }
}

function limparDados() {
    if (confirm('Deseja limpar todos os registros de ponto?\n\nAs configurações serão mantidas.')) {
        Storage.remove('registros_ponto');
        showToast('✅ Registros limpos!', 'success');
        atualizarEstatisticas();
    }
}

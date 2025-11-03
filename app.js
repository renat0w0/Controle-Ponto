// Armazenamento de dados
let registros = JSON.parse(localStorage.getItem('registrosPonto')) || {};

// Elementos do DOM
const form = document.getElementById('pontoForm');
const dataInput = document.getElementById('data');
const horaInput = document.getElementById('hora');
const tabelaBody = document.getElementById('tabelaBody');
const btnLimpar = document.getElementById('btnLimpar');
const btnExportar = document.getElementById('btnExportar');
const totalDias = document.getElementById('totalDias');
const totalHorasExtras = document.getElementById('totalHorasExtras');

// Elementos de upload
const uploadArea = document.getElementById('uploadArea');
const csvFileInput = document.getElementById('csvFileInput');
const importStatus = document.getElementById('importStatus');

// Elementos API
const apiEmail = document.getElementById('apiEmail');
const apiSenha = document.getElementById('apiSenha');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const loginStatus = document.getElementById('loginStatus');
const apiLogin = document.getElementById('apiLogin');
const apiConfig = document.getElementById('apiConfig');
const personSearch = document.getElementById('personSearch');
const searchResults = document.getElementById('searchResults');
const personId = document.getElementById('personId');
const personName = document.getElementById('personName');
const dataInicio = document.getElementById('dataInicio');
const dataFim = document.getElementById('dataFim');
const btnSincronizar = document.getElementById('btnSincronizar');
const apiStatus = document.getElementById('apiStatus');

// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Inicializar com data atual
dataInput.valueAsDate = new Date();

// Inicializar datas da API (último mês)
const hoje = new Date();
const umMesAtras = new Date();
umMesAtras.setMonth(hoje.getMonth() - 1);
dataInicio.valueAsDate = umMesAtras;
dataFim.valueAsDate = hoje;

// Verificar se já está logado
const tokenSalvo = localStorage.getItem('apiToken');
const emailSalvo = localStorage.getItem('apiEmail');
const personIdSalvo = localStorage.getItem('personId');

if (tokenSalvo) {
    // Já está logado
    apiLogin.style.display = 'none';
    apiConfig.style.display = 'block';
}

if (emailSalvo) apiEmail.value = emailSalvo;
if (personIdSalvo) {
    personId.value = personIdSalvo;
    const personNameSalvo = localStorage.getItem('personName');
    if (personNameSalvo) {
        personSearch.value = personNameSalvo;
    }
}

// Variável para controlar debounce da busca
let searchTimeout;

// Listener de busca de pessoa
personSearch.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const query = this.value.trim();
    
    if (query.length < 3) {
        searchResults.classList.remove('show');
        return;
    }
    
    searchTimeout = setTimeout(() => buscarPessoas(query), 500);
});

// Função para buscar pessoas na API
async function buscarPessoas(query) {
    const token = localStorage.getItem('apiToken');
    if (!token) {
        searchResults.innerHTML = '<div class="search-empty">Faça login primeiro</div>';
        searchResults.classList.add('show');
        return;
    }
    
    searchResults.innerHTML = '<div class="search-loading">Buscando...</div>';
    searchResults.classList.add('show');
    
    try {
        const url = `https://report.idsecure.com.br:5000/api/v1/accesslog/persons?value=${encodeURIComponent(query)}&pageSize=10&status=1&personType=Person&sortField=name`;
        
        console.log('Buscando URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const dados = await response.json();
        console.log('Resposta busca pessoas (status', response.status, '):', dados);
        
        if (!response.ok) {
            throw new Error(dados.message || dados.error || 'Erro ao buscar pessoas');
        }
        
        const pessoas = dados.data?.data || dados.data || [];
        
        console.log('Pessoas encontradas:', pessoas);
        console.log('Primeira pessoa:', pessoas[0]);
        
        if (pessoas.length === 0) {
            searchResults.innerHTML = '<div class="search-empty">Nenhuma pessoa encontrada</div>';
            return;
        }
        
        let html = '';
        pessoas.forEach(pessoa => {
            console.log('Pessoa:', pessoa);
            html += `
                <div class="search-result-item" onclick="selecionarPessoa('${pessoa.personId || pessoa.id || pessoa.personID}', '${(pessoa.name || pessoa.fullName || '').replace(/'/g, "\\'")}')">
                    <div class="name">${pessoa.name || pessoa.fullName || 'Nome não disponível'}</div>
                    <div class="details">ID: ${pessoa.personId || pessoa.id || pessoa.personID || 'N/A'}</div>
                </div>
            `;
        });
        
        searchResults.innerHTML = html;
        
    } catch (erro) {
        console.error('Erro ao buscar pessoas:', erro);
        searchResults.innerHTML = '<div class="search-empty">Erro ao buscar pessoas</div>';
    }
}

// Função para selecionar pessoa
function selecionarPessoa(id, nome) {
    personId.value = id;
    personSearch.value = nome;
    searchResults.classList.remove('show');
    
    // Salvar no localStorage
    localStorage.setItem('personId', id);
    localStorage.setItem('personName', nome);
}

// Função para buscar usuário logado e preencher automaticamente
async function buscarUsuarioLogado(email) {
    const token = localStorage.getItem('apiToken');
    if (!token) return;
    
    try {
        // Buscar pelo email do usuário
        const emailParts = email.split('@')[0]; // Pega a parte antes do @
        const url = `https://report.idsecure.com.br:5000/api/v1/accesslog/persons?value=${encodeURIComponent(emailParts)}&pageSize=10&status=1&personType=Person&sortField=name`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const dados = await response.json();
            const pessoas = dados.data?.data || dados.data || [];
            
            // Se encontrou pessoas, pega a primeira
            if (pessoas.length > 0) {
                const pessoa = pessoas[0];
                const id = pessoa.personId || pessoa.id || pessoa.personID;
                const nome = pessoa.name || pessoa.fullName;
                
                if (id && nome) {
                    selecionarPessoa(id, nome);
                }
            }
        }
    } catch (erro) {
        console.log('Não foi possível buscar usuário logado:', erro);
    }
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', function(e) {
    if (!personSearch.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.remove('show');
    }
});

// Configuração de horas extras
const CONFIG = {
    horaEntradaNormal: { hora: 7, minuto: 30 },  // Entrada normal às 7:30
    horaSaidaNormal: { hora: 17, minuto: 30 },   // Saída normal às 17:30
    cargaHorariaDiaria: 9 * 60                    // 9 horas = 540 minutos
};

// Função para obter nome do dia da semana
function getDiaSemana(dataStr) {
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const date = new Date(ano, mes - 1, dia);
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return { nome: dias[date.getDay()], numero: date.getDay() };
}

// Função para verificar se é fim de semana
function isFimDeSemana(dataStr) {
    const dia = getDiaSemana(dataStr).numero;
    return dia === 0 || dia === 6; // Domingo = 0, Sábado = 6
}

// Função para converter hora em minutos
function horaParaMinutos(hora, minuto) {
    return hora * 60 + minuto;
}

// Função para converter minutos em formato de hora
function minutosParaHora(minutos) {
    const horas = Math.floor(Math.abs(minutos) / 60);
    const mins = Math.abs(minutos) % 60;
    return `${horas}h ${mins.toString().padStart(2, '0')}min`;
}

// Função para calcular horas trabalhadas
function calcularHorasTrabalhadas(entrada, saida) {
    const [hEntrada, mEntrada] = entrada.split(':').map(Number);
    const [hSaida, mSaida] = saida.split(':').map(Number);
    
    const totalMinutos = horaParaMinutos(hSaida, mSaida) - horaParaMinutos(hEntrada, mEntrada);
    return totalMinutos;
}

// Função para calcular horas extras
function calcularHorasExtras(dataStr, saida) {
    const [hSaida, mSaida] = saida.split(':').map(Number);
    const minutosSaida = horaParaMinutos(hSaida, mSaida);
    
    // Se for fim de semana, todo o período trabalhado é hora extra
    if (isFimDeSemana(dataStr)) {
        const entrada = registros[dataStr].sort()[0];
        const [hEntrada, mEntrada] = entrada.split(':').map(Number);
        const minutosEntrada = horaParaMinutos(hEntrada, mEntrada);
        return minutosSaida - minutosEntrada;
    }
    
    // Para dias de semana, calcular o que passou das 17:30
    const minutosLimite = horaParaMinutos(CONFIG.horaSaidaNormal.hora, CONFIG.horaSaidaNormal.minuto);
    
    if (minutosSaida > minutosLimite) {
        return minutosSaida - minutosLimite;
    }
    
    return 0;
}

// Função para formatar data no padrão brasileiro
function formatarData(dataStr) {
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Função para adicionar registro
function adicionarRegistro(data, hora) {
    if (!registros[data]) {
        registros[data] = [];
    }
    
    // Evitar horários duplicados
    if (!registros[data].includes(hora)) {
        registros[data].push(hora);
        registros[data].sort();
        salvarDados();
        atualizarTabela();
        return true;
    }
    return false;
}

// Função para remover um dia completo
function removerDia(data) {
    if (confirm(`Deseja realmente remover todos os registros de ${formatarData(data)}?`)) {
        delete registros[data];
        salvarDados();
        atualizarTabela();
    }
}

// Função para salvar dados no localStorage
function salvarDados() {
    localStorage.setItem('registrosPonto', JSON.stringify(registros));
    atualizarDashboard();
}

// Função para atualizar a tabela
function atualizarTabela() {
    const datas = Object.keys(registros).sort().reverse();
    
    if (datas.length === 0) {
        tabelaBody.innerHTML = `
            <tr class="empty-state">
                <td colspan="7">
                    <div class="empty-state-content">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <p>Nenhum registro encontrado</p>
                        <small>Adicione manualmente ou importe o CSV da catraca</small>
                    </div>
                </td>
            </tr>
        `;
        totalDias.textContent = '0 dias registrados';
        totalHorasExtras.textContent = '0h extras';
        return;
    }
    
    totalDias.textContent = `${datas.length} dia${datas.length > 1 ? 's' : ''} registrado${datas.length > 1 ? 's' : ''}`;
    
    let html = '';
    let totalMinutosExtras = 0;
    
    datas.forEach(data => {
        const horarios = registros[data].sort();
        const entrada = horarios[0];
        const saida = horarios[horarios.length - 1];
        const diaSemana = getDiaSemana(data);
        const isFDS = isFimDeSemana(data);
        
        const minutosTrabalhados = calcularHorasTrabalhadas(entrada, saida);
        const horasTrabalhadas = minutosParaHora(minutosTrabalhados);
        
        const minutosExtras = calcularHorasExtras(data, saida);
        totalMinutosExtras += minutosExtras;
        const horasExtras = minutosExtras > 0 ? minutosParaHora(minutosExtras) : '-';
        
        html += `
            <tr>
                <td><strong>${formatarData(data)}</strong></td>
                <td class="dia-semana ${isFDS ? 'fim-semana' : ''}">${diaSemana.nome}</td>
                <td>${entrada}</td>
                <td>${saida}</td>
                <td>${horasTrabalhadas}</td>
                <td class="${minutosExtras > 0 ? 'horas-extras' : 'sem-extras'}">
                    ${horasExtras}
                    ${isFDS ? ' <small>(FDS)</small>' : ''}
                </td>
                <td>
                    <button class="btn btn-danger" onclick="removerDia('${data}')">Excluir</button>
                </td>
            </tr>
        `;
    });
    
    tabelaBody.innerHTML = html;
    totalHorasExtras.textContent = minutosParaHora(totalMinutosExtras) + ' extras';
}

// Função para exportar CSV
function exportarCSV() {
    const datas = Object.keys(registros).sort();
    
    if (datas.length === 0) {
        alert('Não há dados para exportar!');
        return;
    }
    
    // BOM (Byte Order Mark) para UTF-8 - garante que o Excel reconheça acentuação
    let csv = '\uFEFF';
    
    // Cabeçalho
    csv += 'Data;Dia da Semana;Entrada;Saída;Horas Trabalhadas;Horas Extras\n';
    
    datas.forEach(data => {
        const horarios = registros[data].sort();
        const entrada = horarios[0];
        const saida = horarios[horarios.length - 1];
        const diaSemana = getDiaSemana(data).nome;
        const minutosTrabalhados = calcularHorasTrabalhadas(entrada, saida);
        const horasTrabalhadas = minutosParaHora(minutosTrabalhados);
        const minutosExtras = calcularHorasExtras(data, saida);
        const horasExtras = minutosExtras > 0 ? minutosParaHora(minutosExtras) : '0h 00min';
        
        // Usando ponto e vírgula (;) como separador - padrão brasileiro
        csv += `${formatarData(data)};${diaSemana};${entrada};${saida};${horasTrabalhadas};${horasExtras}\n`;
    });
    
    // Criar e baixar arquivo com encoding correto
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `controle_ponto_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Função para processar CSV da catraca
function processarCSVCatraca(conteudo) {
    const linhas = conteudo.split('\n');
    let registrosImportados = 0;
    let registrosDuplicados = 0;

    // Pular cabeçalho
    for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i].trim();
        if (!linha) continue;

        // Parse da linha CSV
        const colunas = linha.split(',');
        if (colunas.length < 1) continue;

        const dataHora = colunas[0].trim();
        if (!dataHora) continue;

        // Extrair data e hora (formato: "03/11/2025 06:47")
        const match = dataHora.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
        if (!match) continue;

        const [, dia, mes, ano, hora, minuto] = match;
        const dataFormatada = `${ano}-${mes}-${dia}`;
        const horaFormatada = `${hora}:${minuto}`;

        // Adicionar registro
        if (!registros[dataFormatada]) {
            registros[dataFormatada] = [];
        }

        if (!registros[dataFormatada].includes(horaFormatada)) {
            registros[dataFormatada].push(horaFormatada);
            registros[dataFormatada].sort();
            registrosImportados++;
        } else {
            registrosDuplicados++;
        }
    }

    return { registrosImportados, registrosDuplicados };
}

function mostrarStatusLogin(mensagem, tipo) {
    loginStatus.textContent = mensagem;
    loginStatus.className = `import-status ${tipo}`;
    
    if (tipo === 'success') {
        setTimeout(() => {
            loginStatus.className = 'import-status';
        }, 2000);
    }
}

function mostrarStatusAPI(mensagem, tipo) {
}

// Upload de arquivo
uploadArea.addEventListener('click', () => {
    csvFileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#4F46E5';
    uploadArea.style.background = '#f5f3ff';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#d1d5db';
    uploadArea.style.background = '#f9fafb';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#d1d5db';
    uploadArea.style.background = '#f9fafb';
    
    const arquivo = e.dataTransfer.files[0];
    if (arquivo && arquivo.name.endsWith('.csv')) {
        processarArquivo(arquivo);
    } else {
        mostrarStatus('Selecione um arquivo CSV válido!', 'error');
    }
});

csvFileInput.addEventListener('change', (e) => {
    const arquivo = e.target.files[0];
    if (arquivo) {
        processarArquivo(arquivo);
    }
});

function processarArquivo(arquivo) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const conteudo = e.target.result;
            const resultado = processarCSVCatraca(conteudo);
            
            salvarDados();
            atualizarTabela();
            
            mostrarStatus(
                `✅ Importação concluída! ${resultado.registrosImportados} registros importados` +
                (resultado.registrosDuplicados > 0 ? ` (${resultado.registrosDuplicados} duplicados ignorados)` : ''),
                'success'
            );
            
            csvFileInput.value = '';
        } catch (erro) {
            console.error(erro);
            mostrarStatus('❌ Erro ao processar arquivo. Verifique o formato do CSV.', 'error');
        }
    };
    
    reader.readAsText(arquivo, 'UTF-8');
}

function mostrarStatus(mensagem, tipo) {
    importStatus.textContent = mensagem;
    importStatus.className = `import-status ${tipo}`;
    
    setTimeout(() => {
        importStatus.className = 'import-status';
    }, 5000);
}

// Gerenciamento de tabs
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Remover active de todos
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Adicionar active no selecionado
        btn.classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
    });
});

// Event Listeners
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const data = dataInput.value;
    const hora = horaInput.value;
    
    if (adicionarRegistro(data, hora)) {
        horaInput.value = '';
        horaInput.focus();
        
        // Feedback visual
        const btn = form.querySelector('button[type="submit"]');
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Adicionado!';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
            btn.innerHTML = textoOriginal;
            btn.style.background = '';
        }, 1500);
    } else {
        alert('Este horário já foi registrado para esta data!');
    }
});

btnLimpar.addEventListener('click', () => {
    if (confirm('Deseja realmente limpar TODOS os registros? Esta ação não pode ser desfeita!')) {
        registros = {};
        salvarDados();
        atualizarTabela();
    }
});

btnExportar.addEventListener('click', exportarCSV);

// ===== INTEGRAÇÃO COM API =====

// Login na API
btnLogin.addEventListener('click', async () => {
    const email = apiEmail.value.trim();
    const senha = apiSenha.value.trim();

    if (!email || !senha) {
        mostrarStatusLogin('⚠️ Por favor, informe e-mail e senha', 'error');
        return;
    }

    // Mostrar loading
    btnLogin.disabled = true;
    btnLogin.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rotating">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
        </svg>
        Conectando...
    `;

    try {
        const apiUrl = 'https://main.idsecure.com.br:5000/api/v1/operators/login';
        console.log('Fazendo login em:', apiUrl);
        console.log('Dados enviados:', { email: email, password: '***' });
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: senha
            })
        });

        console.log('Status da resposta:', response.status, response.statusText);

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('E-mail ou senha incorretos');
            }
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const dados = await response.json();
        
        console.log('Resposta da API:', dados);
        
        // A API pode retornar o token em diferentes formatos
        const token = dados.token || dados.data?.token || dados.accessToken || dados.data?.accessToken;
        
        if (!token) {
            console.error('Estrutura da resposta:', dados);
            throw new Error('Token não recebido da API. Verifique o console para ver a resposta.');
        }

        // Salvar token e credenciais
        localStorage.setItem('apiToken', `Bearer ${token}`);
        localStorage.setItem('apiEmail', email);

        mostrarStatusLogin('✅ Login realizado com sucesso!', 'success');

        // Buscar informações do usuário logado
        buscarUsuarioLogado(email);

        // Aguardar um pouco e mostrar tela de sincronização
        setTimeout(() => {
            apiLogin.style.display = 'none';
            apiConfig.style.display = 'block';
            apiSenha.value = ''; // Limpar senha por segurança
        }, 1000);

    } catch (erro) {
        console.error('Erro ao fazer login:', erro);
        
        let mensagemErro = '❌ Erro ao fazer login. ';
        
        if (erro.message.includes('Failed to fetch')) {
            mensagemErro += 'Verifique sua conexão com a internet.';
        } else {
            mensagemErro += erro.message;
        }
        
        mostrarStatusLogin(mensagemErro, 'error');
    } finally {
        btnLogin.disabled = false;
        btnLogin.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Fazer Login
        `;
    }
});

// Logout
btnLogout.addEventListener('click', () => {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('apiToken');
        apiConfig.style.display = 'none';
        apiLogin.style.display = 'block';
        apiSenha.value = '';
        mostrarStatusAPI('', 'success');
    }
});

function mostrarStatusLogin(mensagem, tipo) {
    loginStatus.textContent = mensagem;
    loginStatus.className = `import-status ${tipo}`;
    
    if (tipo === 'success') {
        setTimeout(() => {
            loginStatus.className = 'import-status';
        }, 2000);
    }
}

function mostrarStatusAPI(mensagem, tipo) {
    apiStatus.textContent = mensagem;
    apiStatus.className = `import-status ${tipo}`;
    
    if (tipo === 'success') {
        setTimeout(() => {
            apiStatus.className = 'import-status';
        }, 8000);
    }
}

// Converter data para timestamp Unix
function dataParaTimestamp(dataString) {
    const data = new Date(dataString + 'T00:00:00');
    return Math.floor(data.getTime() / 1000);
}

// Sincronizar com API
btnSincronizar.addEventListener('click', async () => {
    const token = localStorage.getItem('apiToken');
    const pessoa = personId.value.trim();
    const inicio = dataInicio.value;
    const fim = dataFim.value;

    if (!token) {
        mostrarStatusAPI('⚠️ Sessão expirada. Faça login novamente.', 'error');
        setTimeout(() => {
            apiConfig.style.display = 'none';
            apiLogin.style.display = 'block';
        }, 2000);
        return;
    }

    if (!pessoa) {
        mostrarStatusAPI('⚠️ Por favor, informe o ID da pessoa', 'error');
        return;
    }

    if (!inicio || !fim) {
        mostrarStatusAPI('⚠️ Por favor, informe o período', 'error');
        return;
    }

    // Salvar personId
    localStorage.setItem('personId', pessoa);

    // Mostrar loading
    btnSincronizar.disabled = true;
    btnSincronizar.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rotating">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        Sincronizando...
    `;

    try {
        const tsInicio = dataParaTimestamp(inicio);
        const tsFim = dataParaTimestamp(fim) + 86399; // Até 23:59:59

        // Usar o endpoint /logs em vez de /logsByPerson
        const url = `https://report.idsecure.com.br:5000/api/v1/accesslog/logs?` +
            `pageSize=1000&pageNumber=1&sortOrder=desc&sortField=Time&` +
            `dtStart=${tsInicio}&dtEnd=${tsFim}&personsIds=${pessoa}&getPhotos=false`;

        console.log('Sincronizando de:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': token,
                'Accept': 'application/json',
            },
            mode: 'cors'
        });

        console.log('Status sincronização:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const dados = await response.json();
        console.log('Dados recebidos:', dados);
        
        // A resposta tem estrutura: { data: { data: [...], total, page, etc }, success, message }
        const logs = dados.data?.data || dados.data;
        
        if (!logs || !Array.isArray(logs)) {
            console.error('Estrutura inesperada:', dados);
            throw new Error('Formato de resposta inválido ou sem dados');
        }

        console.log(`Total de registros recebidos: ${logs.length}`);

        // Processar dados da API
        const resultado = processarDadosAPI(logs);
        
        salvarDados();
        atualizarTabela();

        mostrarStatusAPI(
            `✅ Sincronização concluída! ${resultado.registrosImportados} registros importados` +
            (resultado.registrosDuplicados > 0 ? ` (${resultado.registrosDuplicados} duplicados ignorados)` : ''),
            'success'
        );

    } catch (erro) {
        console.error('Erro ao sincronizar:', erro);
        
        let mensagemErro = '❌ Erro ao sincronizar com a API. ';
        
        if (erro.message.includes('Failed to fetch')) {
            mensagemErro += 'Verifique: 1) Se está na rede correta, 2) CORS habilitado, 3) Token válido.';
        } else if (erro.message.includes('401')) {
            mensagemErro += 'Sessão expirada. Faça login novamente.';
            setTimeout(() => {
                localStorage.removeItem('apiToken');
                apiConfig.style.display = 'none';
                apiLogin.style.display = 'block';
            }, 2000);
        } else if (erro.message.includes('403')) {
            mensagemErro += 'Sem permissão para acessar esta API.';
        } else {
            mensagemErro += erro.message;
        }
        
        mostrarStatusAPI(mensagemErro, 'error');
    } finally {
        btnSincronizar.disabled = false;
        btnSincronizar.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Sincronizar Dados
        `;
    }
});

// Processar dados da API
function processarDadosAPI(dados) {
    let registrosImportados = 0;
    let registrosDuplicados = 0;

    console.log('Processando dados, primeiro registro:', dados[0]);

    dados.forEach(log => {
        // A API retorna o campo 'time' como string ISO: "2025-11-03T06:47:28"
        const timeString = log.time || log.timestamp || log.Time || log.dateTime;
        
        if (!timeString) {
            console.warn('Registro sem timestamp:', log);
            return;
        }

        // Converter string ISO para Date
        const dataHora = new Date(timeString);
        
        if (isNaN(dataHora.getTime())) {
            console.warn('Data inválida:', timeString, log);
            return;
        }
        
        const ano = dataHora.getFullYear();
        const mes = String(dataHora.getMonth() + 1).padStart(2, '0');
        const dia = String(dataHora.getDate()).padStart(2, '0');
        const hora = String(dataHora.getHours()).padStart(2, '0');
        const minuto = String(dataHora.getMinutes()).padStart(2, '0');

        const dataFormatada = `${ano}-${mes}-${dia}`;
        const horaFormatada = `${hora}:${minuto}`;

        // Adicionar registro
        if (!registros[dataFormatada]) {
            registros[dataFormatada] = [];
        }

        if (!registros[dataFormatada].includes(horaFormatada)) {
            registros[dataFormatada].push(horaFormatada);
            registros[dataFormatada].sort();
            registrosImportados++;
        } else {
            registrosDuplicados++;
        }
    });

    console.log(`✅ Processamento concluído: ${registrosImportados} importados, ${registrosDuplicados} duplicados`);
    return { registrosImportados, registrosDuplicados };
}

// Inicializar
atualizarTabela();

// ==================== DASHBOARD ====================

let chartBarras = null;
let chartLinha = null;
let periodoAtual = 7; // Padrão: últimos 7 dias

// Inicializar dashboard após a página carregar
setTimeout(() => {
    atualizarDashboard();
}, 100);

// Filtros de período
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const periodo = this.dataset.periodo;
        if (periodo === 'tudo') {
            periodoAtual = null;
        } else if (periodo === 'mes') {
            periodoAtual = 'mes';
        } else {
            periodoAtual = parseInt(periodo);
        }
        
        atualizarDashboard();
    });
});

// Função para filtrar dados por período
function filtrarDadosPorPeriodo() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const datas = Object.keys(registros).filter(data => {
        if (!periodoAtual) return true; // Tudo
        
        const [ano, mes, dia] = data.split('-').map(Number);
        const dataRegistro = new Date(ano, mes - 1, dia);
        
        if (periodoAtual === 'mes') {
            return dataRegistro.getMonth() === hoje.getMonth() && 
                   dataRegistro.getFullYear() === hoje.getFullYear();
        } else {
            const diffTime = hoje - dataRegistro;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays < periodoAtual;
        }
    });
    
    return datas.sort();
}

// Função para calcular métricas do dashboard
function calcularMetricas(datas) {
    let totalMinutosTrabalhados = 0;
    let totalMinutosExtras = 0;
    let diasComExtra = 0;
    
    datas.forEach(data => {
        const horarios = registros[data].sort();
        const entrada = horarios[0];
        const saida = horarios[horarios.length - 1];
        
        const minutosTrabalhados = calcularHorasTrabalhadas(entrada, saida);
        const minutosExtras = calcularHorasExtras(data, saida);
        
        totalMinutosTrabalhados += minutosTrabalhados;
        totalMinutosExtras += minutosExtras;
        
        if (minutosExtras > 0) diasComExtra++;
    });
    
    const diasTrabalhados = datas.length;
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

// Função para atualizar KPIs
function atualizarKPIs(metricas) {
    document.getElementById('kpiTotalHoras').textContent = minutosParaHora(metricas.totalMinutosTrabalhados);
    document.getElementById('kpiHorasExtras').textContent = minutosParaHora(metricas.totalMinutosExtras);
    document.getElementById('kpiMediaDiaria').textContent = minutosParaHora(metricas.mediaDiaria);
    document.getElementById('kpiDiasTrabalhados').textContent = metricas.diasTrabalhados;
    document.getElementById('kpiDiasExtra').textContent = metricas.diasComExtra;
    document.getElementById('kpiPercentualExtras').textContent = `${metricas.percentualExtras}%`;
}

// Função para criar gráfico de barras
function criarGraficoBarras(datas) {
    const ctx = document.getElementById('chartBarras');
    if (!ctx) return;
    
    if (chartBarras) {
        chartBarras.destroy();
        chartBarras = null;
    }
    
    if (datas.length === 0) return;
    
    // Agrupar por semana
    const semanas = {};
    datas.forEach(data => {
        const [ano, mes, dia] = data.split('-').map(Number);
        const dataObj = new Date(ano, mes - 1, dia);
        const inicioSemana = new Date(dataObj);
        inicioSemana.setDate(dataObj.getDate() - dataObj.getDay());
        const chave = inicioSemana.toISOString().split('T')[0];
        
        if (!semanas[chave]) {
            semanas[chave] = { normais: 0, extras: 0 };
        }
        
        const horarios = registros[data].sort();
        const entrada = horarios[0];
        const saida = horarios[horarios.length - 1];
        
        const minutosTrabalhados = calcularHorasTrabalhadas(entrada, saida);
        const minutosExtras = calcularHorasExtras(data, saida);
        
        semanas[chave].normais += (minutosTrabalhados - minutosExtras);
        semanas[chave].extras += minutosExtras;
    });
    
    const labels = Object.keys(semanas).map(data => {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}`;
    });
    
    const dataNormais = Object.values(semanas).map(s => (s.normais / 60).toFixed(1));
    const dataExtras = Object.values(semanas).map(s => (s.extras / 60).toFixed(1));
    
    chartBarras = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Horas Normais',
                    data: dataNormais,
                    backgroundColor: '#3b82f6',
                },
                {
                    label: 'Horas Extras',
                    data: dataExtras,
                    backgroundColor: '#ef4444',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: { stacked: true },
                y: { 
                    stacked: true,
                    beginAtZero: true,
                    title: { display: true, text: 'Horas' }
                }
            },
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
}

// Função para criar gráfico de linha
function criarGraficoLinha(datas) {
    const ctx = document.getElementById('chartLinha');
    if (!ctx) return;
    
    if (chartLinha) {
        chartLinha.destroy();
        chartLinha = null;
    }
    
    if (datas.length === 0) return;
    
    const labels = datas.map(data => {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}`;
    });
    
    const dataExtras = datas.map(data => {
        const horarios = registros[data].sort();
        const saida = horarios[horarios.length - 1];
        const minutosExtras = calcularHorasExtras(data, saida);
        return (minutosExtras / 60).toFixed(1);
    });
    
    chartLinha = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Horas Extras',
                data: dataExtras,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Horas Extras' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Função para criar tabela semanal
function criarTabelaSemanal(datas) {
    const tbody = document.getElementById('tabelaSemanalBody');
    
    if (datas.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="5">Nenhum dado disponível</td></tr>';
        return;
    }
    
    // Agrupar por semana
    const semanas = {};
    datas.forEach(data => {
        const [ano, mes, dia] = data.split('-').map(Number);
        const dataObj = new Date(ano, mes - 1, dia);
        const inicioSemana = new Date(dataObj);
        inicioSemana.setDate(dataObj.getDate() - dataObj.getDay());
        const chave = inicioSemana.toISOString().split('T')[0];
        
        if (!semanas[chave]) {
            semanas[chave] = { dias: 0, minutos: 0, extras: 0 };
        }
        
        const horarios = registros[data].sort();
        const entrada = horarios[0];
        const saida = horarios[horarios.length - 1];
        
        semanas[chave].dias++;
        semanas[chave].minutos += calcularHorasTrabalhadas(entrada, saida);
        semanas[chave].extras += calcularHorasExtras(data, saida);
    });
    
    let html = '';
    Object.keys(semanas).reverse().forEach(chave => {
        const s = semanas[chave];
        const [ano, mes, dia] = chave.split('-');
        const media = s.dias > 0 ? Math.floor(s.minutos / s.dias) : 0;
        
        html += `
            <tr>
                <td>Semana de ${dia}/${mes}/${ano}</td>
                <td>${s.dias}</td>
                <td>${minutosParaHora(s.minutos)}</td>
                <td class="${s.extras > 0 ? 'extras' : ''}">${minutosParaHora(s.extras)}</td>
                <td>${minutosParaHora(media)}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Função principal para atualizar dashboard
function atualizarDashboard() {
    const datas = filtrarDadosPorPeriodo();
    const metricas = calcularMetricas(datas);
    
    atualizarKPIs(metricas);
    criarGraficoBarras(datas);
    criarGraficoLinha(datas);
    criarTabelaSemanal(datas);
}

// ==================== MENU LATERAL ====================

// Carregar tema salvo
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Atualizar gráficos se estiver na página dashboard
        const dashboardPage = document.getElementById('page-dashboard');
        if (dashboardPage && dashboardPage.classList.contains('active')) {
            setTimeout(() => atualizarDashboard(), 100);
        }
    });
}

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarClose = document.getElementById('sidebarClose');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

// Toggle sidebar (expandir/recolher)
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('expanded');
    sidebarOverlay.classList.toggle('show');
});

// Fechar sidebar
sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('expanded');
    sidebarOverlay.classList.remove('show');
});

// Fechar ao clicar no overlay
sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('expanded');
    sidebarOverlay.classList.remove('show');
});

// Navegação entre páginas
console.log('Configurando navegação. NavItems encontrados:', navItems.length);
console.log('Páginas encontradas:', pages.length);

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetPage = item.dataset.page;
        console.log('Clicou em:', targetPage);
        
        // Atualizar nav ativo
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Mostrar página correta
        pages.forEach(page => page.classList.remove('active'));
        const pageElement = document.getElementById(`page-${targetPage}`);
        console.log('Elemento da página:', pageElement);
        if (pageElement) {
            pageElement.classList.add('active');
            console.log('Página ativada:', targetPage);
        } else {
            console.error('Página não encontrada:', `page-${targetPage}`);
        }
        
        // Fechar menu no mobile
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('expanded');
            sidebarOverlay.classList.remove('show');
        }
        
        // Atualizar dashboard se for a página dashboard
        if (targetPage === 'dashboard') {
            setTimeout(() => atualizarDashboard(), 100);
        }
    });
});

// Desktop: expandir/recolher ao passar mouse (apenas desktop)
if (window.innerWidth > 768) {
    sidebar.addEventListener('mouseenter', () => {
        sidebar.classList.add('expanded');
    });
    
    sidebar.addEventListener('mouseleave', () => {
        sidebar.classList.remove('expanded');
    });
}

// api.js - Integração com IDSecure API

let tokenAPI = null;
let debounceTimer = null;

async function fazerLogin(email, senha) {
    try {
        const response = await fetch('https://main.idsecure.com.br:5000/api/v1/operators/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password: senha })
        });
        
        const dados = await response.json();
        
        console.log('📡 Resposta do login:', response.status, dados);
        
        if (response.ok) {
            tokenAPI = dados.token || dados.data?.token || dados.accessToken;
            
            if (tokenAPI) {
                localStorage.setItem('apiToken', tokenAPI);
                localStorage.setItem('apiEmail', email);
                return { sucesso: true, token: tokenAPI };
            }
        }
        
        // Mensagem de erro mais específica
        let mensagemErro = dados.message || dados.error || 'Erro ao fazer login';
        
        if (response.status === 401) {
            mensagemErro = 'Email ou senha incorretos';
        } else if (dados.code) {
            mensagemErro = `Erro ${dados.code}: ${mensagemErro}`;
        }
        
        return { sucesso: false, erro: mensagemErro };
    } catch (erro) {
        console.error('❌ Erro na requisição de login:', erro);
        return { sucesso: false, erro: `Erro de conexão: ${erro.message}` };
    }
}

async function buscarPessoas(query) {
    if (!tokenAPI) {
        console.error('Token não disponível');
        return [];
    }
    
    try {
        // Usar parâmetro 'value' ao invés de 'search' e incluir fotos
        const url = `https://report.idsecure.com.br:5000/api/v1/accesslog/persons?value=${encodeURIComponent(query)}&pageSize=10&status=1&personType=Person&sortField=name&getPhotos=true`;
        
        console.log('🔍 Buscando pessoas:', { query, url, token: tokenAPI ? 'presente' : 'ausente' });
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenAPI}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Resposta da API:', { status: response.status, ok: response.ok });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta:', response.status, response.statusText, errorText);
            return [];
        }
        
        const dados = await response.json();
        console.log('✅ Dados recebidos:', dados);
        console.log('📋 Estrutura data:', dados.data);
        
        // A API retorna: { data: { data: [...pessoas], total: N } }
        const pessoas = dados.data?.data || [];
        console.log('� Array de pessoas extraído:', pessoas);
        console.log('📊 Total de pessoas:', pessoas.length);
        
        return pessoas;
    } catch (erro) {
        console.error('❌ Erro ao buscar pessoas:', erro);
        return [];
    }
}

async function buscarUsuarioLogado(email) {
    // Tentar primeiro pela API /me que retorna dados completos do operador logado
    try {
        console.log('🔍 Buscando dados do operador via /api/v1/operators/me');
        
        const response = await fetch('https://main.idsecure.com.br:5000/api/v1/operators/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenAPI}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const dados = await response.json();
            console.log('👤 Dados completos do operador:', dados);
            
            // Dados podem estar em dados.data ou direto em dados
            const operador = dados.data || dados;
            
            // Salvar informações no localStorage
            localStorage.setItem('usuarioNome', operador.name || 'Usuário');
            localStorage.setItem('usuarioId', operador.id || operador.personId || '');
            localStorage.setItem('usuarioEmail', operador.email || email);
            
            // Verificar se tem foto no personPhoto
            if (operador.personPhoto?.photo) {
                localStorage.setItem('usuarioFoto', operador.personPhoto.photo);
                console.log('✅ Foto encontrada em personPhoto.photo');
            } else if (operador.photo) {
                localStorage.setItem('usuarioFoto', operador.photo);
                console.log('✅ Foto encontrada em photo');
            } else {
                console.log('⚠️ Nenhuma foto disponível no perfil');
                localStorage.removeItem('usuarioFoto');
            }
            
            return operador;
        } else {
            console.log('⚠️ Erro ao buscar via /me, tentando busca por nome...');
        }
    } catch (erro) {
        console.error('❌ Erro ao buscar via /me:', erro);
    }
    
    // Fallback: buscar por email/nome
    const pessoas = await buscarPessoas(email.split('@')[0]);
    if (pessoas.length > 0) {
        const pessoa = pessoas[0];
        console.log('👤 Dados do usuário (fallback):', pessoa);
        console.log('📸 Foto disponível:', pessoa.photo ? 'SIM' : 'NÃO');
        
        // Salvar nome, foto e ID no localStorage
        localStorage.setItem('usuarioNome', pessoa.name || 'Usuário');
        localStorage.setItem('usuarioId', pessoa.id || pessoa.personId || '');
        if (pessoa.photo) {
            localStorage.setItem('usuarioFoto', pessoa.photo);
            console.log('✅ Foto salva no localStorage');
        } else {
            console.log('⚠️ Nenhuma foto retornada pela API');
        }
        return pessoa;
    }
    return null;
}

async function buscarRegistros(personId, dataInicio, dataFim) {
    try {
        // Converter datas para timestamp Unix (segundos)
        const tsInicio = Math.floor(new Date(`${dataInicio}T00:00:00`).getTime() / 1000);
        const tsFim = Math.floor(new Date(`${dataFim}T23:59:59`).getTime() / 1000);
        
        // Usar GET com query parameters
        const url = `https://report.idsecure.com.br:5000/api/v1/accesslog/logs?` +
            `pageSize=1000&pageNumber=1&sortOrder=desc&sortField=Time&` +
            `dtStart=${tsInicio}&dtEnd=${tsFim}&personsIds=${personId}&getPhotos=false`;
        
        console.log('🔍 Buscando registros:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenAPI}`,
                'Accept': 'application/json'
            }
        });
        
        const dados = await response.json();
        
        console.log('📡 Resposta da API de logs:', dados);
        
        // API retorna estrutura { data: { data: [...], total: N } }
        const logs = dados.data?.data || [];
        console.log('📊 Total de logs recebidos:', logs.length);
        
        if (response.ok && logs.length > 0) {
            // Processar logs para formato esperado
            const registros = logs.map(log => {
                const dataHora = new Date(log.time);
                
                // Usar apenas horário LOCAL (não UTC)
                const ano = dataHora.getFullYear();
                const mes = String(dataHora.getMonth() + 1).padStart(2, '0');
                const dia = String(dataHora.getDate()).padStart(2, '0');
                const hora = String(dataHora.getHours()).padStart(2, '0');
                const minuto = String(dataHora.getMinutes()).padStart(2, '0');
                
                return {
                    date: `${ano}-${mes}-${dia}`,
                    time: `${hora}:${minuto}`
                };
            });
            
            return registros;
        }
        
        return [];
    } catch (erro) {
        console.error('❌ Erro ao buscar registros:', erro);
        throw erro;
    }
}

async function sincronizarDados() {
    const personId = document.getElementById('personId').value;
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    if (!personId) {
        alert('⚠️ Selecione uma pessoa primeiro!');
        return;
    }
    
    if (!dataInicio || !dataFim) {
        alert('⚠️ Selecione o período de sincronização!');
        return;
    }
    
    const syncStatus = document.getElementById('syncStatus');
    syncStatus.innerHTML = '⏳ Sincronizando...';
    syncStatus.className = 'status-message info';
    
    try {
        // Converter datas para timestamp Unix (segundos)
        const tsInicio = Math.floor(new Date(`${dataInicio}T00:00:00`).getTime() / 1000);
        const tsFim = Math.floor(new Date(`${dataFim}T23:59:59`).getTime() / 1000);
        
        // Usar GET com query parameters
        const url = `https://report.idsecure.com.br:5000/api/v1/accesslog/logs?` +
            `pageSize=1000&pageNumber=1&sortOrder=desc&sortField=Time&` +
            `dtStart=${tsInicio}&dtEnd=${tsFim}&personsIds=${personId}&getPhotos=false`;
        
        console.log('Sincronizando de:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenAPI}`,
                'Accept': 'application/json'
            }
        });
        
        const dados = await response.json();
        
        console.log('📡 Resposta da API de logs:', dados);
        console.log('📋 Estrutura data de logs:', dados.data);
        
        // API retorna estrutura { data: { data: [...], total: N } }
        const logs = dados.data?.data || [];
        console.log('📊 Array de logs extraído:', logs);
        console.log('📊 Total de logs:', logs.length);
        
        if (response.ok && logs.length > 0) {
            const registros = logs.map(log => {
                const dataHora = new Date(log.time);
                
                // Usar apenas horário LOCAL (não UTC) para evitar diferença de fuso
                const ano = dataHora.getFullYear();
                const mes = String(dataHora.getMonth() + 1).padStart(2, '0');
                const dia = String(dataHora.getDate()).padStart(2, '0');
                const hora = String(dataHora.getHours()).padStart(2, '0');
                const minuto = String(dataHora.getMinutes()).padStart(2, '0');
                
                return {
                    data: `${ano}-${mes}-${dia}`,
                    hora: `${hora}:${minuto}`
                };
            });
            
            console.log('🕐 Primeiros 3 registros processados:', registros.slice(0, 3));
            
            const registrosAgrupados = agruparRegistrosPorData(registros);
            
            let importados = 0;
            const registrosExistentes = carregarDados();
            
            registrosAgrupados.forEach(novoReg => {
                const existe = registrosExistentes.some(r => 
                    r.data === novoReg.data && r.entrada === novoReg.entrada
                );
                
                if (!existe) {
                    adicionarRegistro(novoReg);
                    importados++;
                }
            });
            
            syncStatus.innerHTML = `✅ ${importados} registros sincronizados com sucesso!`;
            syncStatus.className = 'status-message success';
        } else {
            syncStatus.innerHTML = `❌ Erro: ${dados.message || 'Erro desconhecido'}`;
            syncStatus.className = 'status-message error';
        }
    } catch (erro) {
        syncStatus.innerHTML = `❌ Erro: ${erro.message}`;
        syncStatus.className = 'status-message error';
    }
}

function configurarBuscaPessoas() {
    const searchInput = document.getElementById('personSearch');
    const suggestionsDiv = document.getElementById('personSuggestions');
    
    if (!searchInput || !suggestionsDiv) {
        console.error('Elementos de busca não encontrados');
        return;
    }
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(debounceTimer);
        
        if (query.length < 3) {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.classList.remove('show');
            return;
        }
        
        // Mostrar "buscando..."
        suggestionsDiv.innerHTML = '<div class="no-results">🔍 Buscando...</div>';
        suggestionsDiv.classList.add('show');
        
        debounceTimer = setTimeout(async () => {
            const pessoas = await buscarPessoas(query);
            
            console.log('👥 Pessoas recebidas para renderizar:', pessoas);
            console.log('🔢 Quantidade:', pessoas.length);
            
            if (pessoas.length > 0) {
                console.log('✏️ Renderizando', pessoas.length, 'pessoas');
                suggestionsDiv.innerHTML = pessoas.map(p => {
                    console.log('  - Pessoa:', p.id, p.name);
                    return `
                        <div class="suggestion-item" onclick="selecionarPessoa(${p.id}, '${p.name.replace(/'/g, "\\'")}')">
                            <strong>${p.name}</strong>
                            ${p.document ? `<span class="doc">CPF: ${p.document}</span>` : ''}
                        </div>
                    `;
                }).join('');
                suggestionsDiv.classList.add('show');
                console.log('✅ Dropdown exibido');
            } else {
                console.log('⚠️ Nenhuma pessoa encontrada');
                suggestionsDiv.innerHTML = '<div class="no-results">❌ Nenhuma pessoa encontrada</div>';
                suggestionsDiv.classList.add('show');
            }
        }, 500);
    });
    
    // Abrir dropdown ao clicar no input
    searchInput.addEventListener('click', () => {
        searchInput.select(); // Seleciona o texto para facilitar edição
        if (searchInput.value.trim().length >= 3) {
            // Se já tem texto, dispara a busca
            searchInput.dispatchEvent(new Event('input'));
        }
    });
    
    // Fechar sugestões ao clicar fora
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.classList.remove('show');
        }
    });
}

// Tornar funções globais para serem acessíveis pelo onclick no HTML
window.selecionarPessoa = function(id, nome) {
    console.log('🎯 Pessoa selecionada:', id, nome);
    const personIdField = document.getElementById('personId');
    const personSearchField = document.getElementById('personSearch');
    const personSuggestionsField = document.getElementById('personSuggestions');
    
    if (personIdField) personIdField.value = id;
    if (personSearchField) personSearchField.value = nome;
    if (personSuggestionsField) personSuggestionsField.classList.remove('show');
};

window.sincronizarDados = sincronizarDados;
window.loginAPISimplificado = loginAPISimplificado;
window.limparCredenciais = limparCredenciais;

// Nova função para sincronizar registros de qualquer pessoa
window.sincronizarRegistrosUsuario = async function() {
    const dataInicio = document.getElementById('dataInicio')?.value;
    const dataFim = document.getElementById('dataFim')?.value;
    const personId = document.getElementById('personId')?.value;
    const mensagemDiv = document.getElementById('mensagemAPI');
    const btnTexto = document.getElementById('btnSyncTexto');
    
    if (!dataInicio || !dataFim) {
        mensagemDiv.innerHTML = '<div class="alert alert-error">⚠️ Selecione o período de sincronização!</div>';
        return;
    }
    
    if (!personId) {
        mensagemDiv.innerHTML = '<div class="alert alert-error">⚠️ Selecione uma pessoa primeiro!</div>';
        return;
    }
    
    // Verificar se há token salvo
    const tokenSalvo = localStorage.getItem('apiToken');
    if (!tokenSalvo) {
        mensagemDiv.innerHTML = '<div class="alert alert-error">❌ Sessão expirada. Faça login novamente.</div>';
        setTimeout(() => {
            window.location.href = '../login.html';
        }, 2000);
        return;
    }
    
    btnTexto.innerHTML = '<span class="loading"></span> Sincronizando registros...';
    mensagemDiv.innerHTML = '';
    
    try {
        // Buscar registros do período selecionado usando o ID da pessoa selecionada
        const registros = await buscarRegistros(personId, dataInicio, dataFim);
        
        if (registros && registros.length > 0) {
            // Agrupar registros
            const registrosAgrupados = agruparRegistrosPorData(registros.map(r => ({
                data: r.date,
                hora: r.time
            })));
            
            // Salvar no localStorage
            let importados = 0;
            const registrosExistentes = carregarDados();
            
            registrosAgrupados.forEach(novoReg => {
                const existe = registrosExistentes.some(r => 
                    r.data === novoReg.data && r.entrada === novoReg.entrada
                );
                
                if (!existe) {
                    adicionarRegistro(novoReg);
                    importados++;
                }
            });
            
            mensagemDiv.innerHTML = `<div class="alert alert-success">✅ ${importados} registros sincronizados com sucesso!</div>`;
            btnTexto.innerHTML = '🔄 Sincronizar Registros';
            
            // Redirecionar para dashboard após 2 segundos
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            mensagemDiv.innerHTML = '<div class="alert alert-warning">⚠️ Nenhum registro encontrado no período selecionado</div>';
            btnTexto.innerHTML = '🔄 Sincronizar Registros';
        }
        
    } catch (erro) {
        console.error('Erro:', erro);
        mensagemDiv.innerHTML = `<div class="alert alert-error">❌ Erro: ${erro.message}</div>`;
        btnTexto.innerHTML = '🔄 Sincronizar Registros';
    }
};

// Configurar busca de pessoas na página de API
function configurarBuscaPessoasNaPagina() {
    const searchInput = document.getElementById('personSearch');
    const suggestionsDiv = document.getElementById('personSuggestions');
    
    if (!searchInput || !suggestionsDiv) {
        console.log('⚠️ Elementos de busca não encontrados na página');
        return;
    }
    
    console.log('✅ Configurando busca de pessoas na página');
    
    let searchTimeout;
    
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length < 3) {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        // Mostrar "buscando..."
        suggestionsDiv.innerHTML = '<div class="search-loading">Buscando...</div>';
        suggestionsDiv.style.display = 'block';
        
        searchTimeout = setTimeout(async () => {
            const pessoas = await buscarPessoas(query);
            
            console.log('👥 Pessoas encontradas:', pessoas.length);
            
            if (pessoas.length > 0) {
                suggestionsDiv.innerHTML = pessoas.map(p => {
                    const pessoaId = p.id || p.personId || 'N/A';
                    const pessoaNome = p.name || p.fullName || 'Nome não disponível';
                    const pessoaDoc = p.document ? ` • CPF: ${p.document}` : '';
                    
                    console.log('  📋 Pessoa:', { id: pessoaId, name: pessoaNome });
                    
                    return `
                        <div class="search-suggestion-item" onclick="selecionarPessoaNaPagina('${pessoaId}', '${pessoaNome.replace(/'/g, "\\'")}')">
                            <div class="name">${pessoaNome}</div>
                            <div class="details">ID: ${pessoaId}${pessoaDoc}</div>
                        </div>
                    `;
                }).join('');
                suggestionsDiv.style.display = 'block';
            } else {
                suggestionsDiv.innerHTML = '<div class="search-empty">❌ Nenhuma pessoa encontrada</div>';
                suggestionsDiv.style.display = 'block';
            }
        }, 500);
    });
    
    // Fechar sugestões ao clicar fora
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
}

// Função para selecionar pessoa na página de API
window.selecionarPessoaNaPagina = function(id, nome) {
    console.log('🎯 Pessoa selecionada na página:', id, nome);
    const personIdField = document.getElementById('personId');
    const personSearchField = document.getElementById('personSearch');
    const personSuggestionsField = document.getElementById('personSuggestions');
    
    if (personIdField) personIdField.value = id;
    if (personSearchField) personSearchField.value = nome;
    if (personSuggestionsField) personSuggestionsField.style.display = 'none';
};

// Preencher automaticamente com o usuário logado
async function preencherUsuarioLogado() {
    const usuarioNome = localStorage.getItem('usuarioNome');
    const usuarioId = localStorage.getItem('usuarioId');
    const emailSalvo = localStorage.getItem('apiEmail');
    
    console.log('📋 Dados salvos:', { usuarioNome, usuarioId, emailSalvo });
    
    // Se já tiver ID salvo, usar
    if (usuarioId && usuarioNome) {
        console.log('✅ Usando dados salvos do usuário');
        const personIdField = document.getElementById('personId');
        const personSearchField = document.getElementById('personSearch');
        
        if (personIdField) personIdField.value = usuarioId;
        if (personSearchField) personSearchField.value = usuarioNome;
        return;
    }
    
    // Caso contrário, buscar da API
    if (emailSalvo) {
        console.log('🔍 Buscando dados do usuário da API...');
        const pessoa = await buscarUsuarioLogado(emailSalvo);
        
        if (pessoa) {
            const pessoaId = pessoa.id || pessoa.personId;
            const pessoaNome = pessoa.name || pessoa.fullName;
            
            console.log('✅ Dados do usuário buscados:', { pessoaId, pessoaNome });
            
            const personIdField = document.getElementById('personId');
            const personSearchField = document.getElementById('personSearch');
            
            if (personIdField) personIdField.value = pessoaId;
            if (personSearchField) personSearchField.value = pessoaNome;
        }
    }
}

// Configurar formulário de login
document.addEventListener('DOMContentLoaded', () => {
    // Verificar token salvo
    const tokenSalvo = localStorage.getItem('apiToken');
    const emailSalvo = localStorage.getItem('apiEmail');
    
    if (tokenSalvo) {
        tokenAPI = tokenSalvo;
        const apiEmailField = document.getElementById('apiEmail');
        if (apiEmailField) apiEmailField.value = emailSalvo || '';
        
        // Esconder login e mostrar sincronização (apenas se os elementos existirem)
        const loginSection = document.getElementById('loginSection');
        const syncSection = document.getElementById('syncSection');
        const loginStatus = document.getElementById('loginStatus');
        
        if (loginSection) loginSection.style.display = 'none';
        if (syncSection) syncSection.style.display = 'block';
        if (loginStatus) loginStatus.style.display = 'none';
        
        configurarBuscaPessoas();
    }
    
    // Configurar busca de pessoas na página de API
    const personSearchField = document.getElementById('personSearch');
    if (personSearchField && tokenSalvo) {
        configurarBuscaPessoasNaPagina();
        
        // Preencher automaticamente com o usuário logado
        preencherUsuarioLogado();
    }
    
    // Configurar datas padrão (apenas se os campos existirem)
    const dataInicioField = document.getElementById('dataInicio');
    const dataFimField = document.getElementById('dataFim');
    
    if (dataInicioField && dataFimField) {
        const hoje = new Date();
        const umMesAtras = new Date();
        umMesAtras.setMonth(umMesAtras.getMonth() - 1);
        
        dataInicioField.value = umMesAtras.toISOString().split('T')[0];
        dataFimField.value = hoje.toISOString().split('T')[0];
    }
    
    // Form submit
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('apiEmail').value;
            const senha = document.getElementById('apiPassword').value;
            const statusDiv = document.getElementById('loginStatus');
            
            statusDiv.innerHTML = '⏳ Conectando...';
            statusDiv.className = 'status-message info';
            
            const resultado = await fazerLogin(email, senha);
            
            if (resultado.sucesso) {
                statusDiv.innerHTML = '✅ Login realizado com sucesso!';
                statusDiv.className = 'status-message success';
                
                // Esconder seção de login e mostrar sincronização
                setTimeout(() => {
                    document.getElementById('loginSection').style.display = 'none';
                    document.getElementById('syncSection').style.display = 'block';
                    document.getElementById('apiPassword').value = ''; // Limpar senha
                }, 1000);
                
                await buscarUsuarioLogado(email);
                configurarBuscaPessoas();
            } else {
                statusDiv.innerHTML = `❌ Erro: ${resultado.erro}`;
                statusDiv.className = 'status-message error';
            }
        });
    }
});

// Função simplificada para login direto
async function loginAPISimplificado() {
    const email = document.getElementById('apiEmail').value;
    const senha = document.getElementById('apiSenha').value;
    const mensagemDiv = document.getElementById('mensagemAPI');
    const btnTexto = document.getElementById('btnLoginTexto');

    if (!email || !senha) {
        mensagemDiv.innerHTML = '<div class="alert alert-error">Por favor, preencha email e senha</div>';
        return;
    }

    btnTexto.innerHTML = '<span class="loading"></span> Conectando...';
    mensagemDiv.innerHTML = '';

    try {
        // Fazer login
        const resultado = await fazerLogin(email, senha);
        
        if (!resultado.sucesso) {
            mensagemDiv.innerHTML = `<div class="alert alert-error">❌ Erro no login: ${resultado.erro}</div>`;
            btnTexto.innerHTML = 'Conectar e Buscar Registros';
            return;
        }

        btnTexto.innerHTML = '<span class="loading"></span> Buscando registros...';

        // Buscar usuário logado
        const pessoa = await buscarUsuarioLogado(email);
        
        if (!pessoa) {
            mensagemDiv.innerHTML = '<div class="alert alert-error">❌ Erro ao buscar dados do usuário</div>';
            btnTexto.innerHTML = 'Conectar e Buscar Registros';
            return;
        }

        // Buscar registros do último mês
        const hoje = new Date();
        const umMesAtras = new Date(hoje);
        umMesAtras.setMonth(umMesAtras.getMonth() - 1);

        const dataInicio = umMesAtras.toISOString().split('T')[0];
        const dataFim = hoje.toISOString().split('T')[0];

        const registros = await buscarRegistros(pessoa.id, dataInicio, dataFim);

        if (registros && registros.length > 0) {
            // Salvar no localStorage
            const registrosExistentes = carregarDados();
            const registrosImportados = registros.map(r => ({
                data: r.date,
                hora: r.time,
                tipo: 'api'
            }));

            const todosRegistros = [...registrosExistentes, ...registrosImportados];
            localStorage.setItem('registros', JSON.stringify(todosRegistros));

            mensagemDiv.innerHTML = `<div class="alert alert-success">✅ ${registros.length} registros importados com sucesso!</div>`;
            btnTexto.innerHTML = 'Conectar e Buscar Registros';

            // Redirecionar para dashboard após 2 segundos
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            mensagemDiv.innerHTML = '<div class="alert alert-error">⚠️ Nenhum registro encontrado no período</div>';
            btnTexto.innerHTML = 'Conectar e Buscar Registros';
        }

    } catch (erro) {
        console.error('Erro:', erro);
        mensagemDiv.innerHTML = `<div class="alert alert-error">❌ Erro: ${erro.message}</div>`;
        btnTexto.innerHTML = 'Conectar e Buscar Registros';
    }
}

function limparCredenciais() {
    localStorage.removeItem('apiToken');
    localStorage.removeItem('apiEmail');
    document.getElementById('apiEmail').value = '';
    document.getElementById('apiSenha').value = '';
    document.getElementById('mensagemAPI').innerHTML = '<div class="alert alert-success">✅ Credenciais removidas</div>';
}


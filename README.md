# ⏰ Controle de Ponto (Web)# ⏰ Controle de Ponto (Web)



Aplicação web moderna e responsiva para controle de ponto eletrônico com integração à API IDSecure. Desenvolvida com foco em usabilidade, performance e experiência do usuário.

### ✨ Principais Funcionalidades

- 📊 **Dashboard Interativo** - KPIs em tempo real e gráficos Chart.js
- 📝 **Gestão de Registros** - Visualização, filtros e exportação PDF/CSV
- 📥 **Importação CSV** - Parser inteligente com drag & drop
- 🔌 **Integração API** - Sincronização automática com IDSecure
- 🎨 **Tema Dark/Light** - Personalização com persistência
- 📱 **PWA** - Funciona offline como aplicativo nativo
- 🔔 **Notificações** - Toast profissionais sem alerts

---

## 🖼️ Screenshots

### Dashboard
Dashboard com KPIs, gráficos interativos e resumo semanal.

### Registros
Tabela de registros com filtros, paginação e exportação.

### Tema Dark
Interface completa com suporte a tema escuro.

---

## 🚀 Começando

### Pré-requisitos

- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Servidor HTTP local (opcional, mas recomendado)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/renat0w0/Controle-Ponto.git
   cd Controle-Ponto
   ```

2. **Inicie um servidor local**

   **Python:**
   ```bash
   python -m http.server 8000
   ```

   **Node.js:**
   ```bash
   npx http-server -p 8000
   ```

   **VS Code:**
   - Instale a extensão "Live Server"
   - Clique com botão direito em `login.html` > "Open with Live Server"

3. **Acesse no navegador**
   ```
   http://localhost:8000/login.html
   ```

### Acesso Rápido

```
📄 Login:        /login.html
📊 Dashboard:    /pages/dashboard.html
📝 Registros:    /pages/registros.html
📥 Importar:     /pages/importar.html
🔌 API:          /pages/api.html
```

---

## 🛠️ Tecnologias

<div align="center">

| Frontend | Bibliotecas | Ferramentas |
|----------|-------------|-------------|
| ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) | ![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white) | ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white) |
| ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) | ![jsPDF](https://img.shields.io/badge/jsPDF-4285F4?style=for-the-badge&logo=adobe&logoColor=white) | ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white) |
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) | ![Remix Icons](https://img.shields.io/badge/Remix_Icons-000000?style=for-the-badge&logo=remix&logoColor=white) | ![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white) |

</div>

---

## 📁 Estrutura do Projeto

```
Controle-Ponto/
├── 📄 index.html              # Redirecionamento inicial
├── 🔐 login.html              # Autenticação IDSecure
├── 🎨 style.css               # Estilos globais e temas
├── 📱 manifest.json           # Configuração PWA
├── ⚙️ sw.js                   # Service Worker
│
├── 📂 js/
│   ├── core.js                # Funções compartilhadas
│   ├── dashboard.js           # Lógica do dashboard
│   ├── registros.js           # Gestão de registros
│   ├── importar.js            # Importação CSV
│   ├── api.js                 # Integração IDSecure
│   ├── toast.js               # Sistema de notificações
│   ├── storage.js             # Gerenciador LocalStorage
│   ├── sidebar.js             # Navegação lateral
│   └── theme.js               # Alternância de tema
│
└── 📂 pages/
    ├── dashboard.html         # Dashboard principal
    ├── registros.html         # Listagem de registros
    ├── importar.html          # Interface de importação
    └── api.html               # Sincronização API
```

---

## 📖 Guia de Uso

### 1️⃣ Autenticação

Faça login com suas credenciais IDSecure em `/login.html`

### 2️⃣ Importação de Dados

**Via CSV:**
- Arraste e solte o arquivo na área de upload
- Formato aceito: `DD/MM/YYYY HH:MM`
- Agrupamento automático por dia (primeira = entrada, última = saída)

**Via API:**
- Selecione o período desejado
- Clique em "Sincronizar Registros"
- Dados são salvos localmente

### 3️⃣ Visualização e Análise

- **Dashboard**: Métricas gerais e gráficos
- **Registros**: Tabela detalhada com filtros
- **Exportação**: PDF (com info do usuário) ou CSV

### 4️⃣ Cálculo de Horas

- **Dias úteis**: Extras após 17:30
- **Fins de semana**: Todo período é extra
- **Meta diária**: 8 horas (configurável)

---

## ⚙️ Configuração

### LocalStorage

O sistema utiliza LocalStorage para persistência:

```javascript
{
  "cp_registros": [],        // Registros de ponto
  "cp_apiToken": "",         // Token de autenticação
  "cp_apiEmail": "",         // Email do usuário
  "cp_usuario": {},          // Dados do usuário
  "cp_selected-theme": ""    // Preferência de tema
}
```

### Limpar Dados

Use "Limpar Dados" na sidebar para resetar os registros mantendo suas preferências.

---

## 🔒 Segurança

- ✅ Proteção de rotas (redirecionamento automático)
- ✅ Token JWT para autenticação API
- ✅ Dados armazenados localmente (privacidade)
- ✅ Sem cookies ou trackers de terceiros
- ✅ HTTPS recomendado para produção

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga estes passos:

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'feat: adiciona MinhaFeature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. **Abra** um Pull Request

### Convenção de Commits

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: tarefas gerais
```

---

## 🐛 Problemas Conhecidos

- CORS pode bloquear requisições ao abrir arquivos diretamente (use servidor local)
- Alguns navegadores limitam LocalStorage em modo privado

[Reportar novo problema →](https://github.com/renat0w0/Controle-Ponto/issues/new)

---

## 📝 Roadmap

- [x] Sistema de notificações toast
- [x] Exportação PDF com informações do usuário
- [x] Tema dark/light
- [ ] Sincronização multi-dispositivo
- [ ] Gráficos adicionais (pizza de distribuição)
- [ ] Configuração de metas personalizadas
- [ ] Relatórios mensais automatizados

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

## 👤 Autor

<div align="center">

**Renato Alves**

[![GitHub](https://img.shields.io/badge/GitHub-@renat0w0-181717?style=for-the-badge&logo=github)](https://github.com/renat0w0)

</div>

---

## ⭐ Apoie o Projeto

Se este projeto te ajudou, considere dar uma estrela ⭐

<div align="center">

[![Star](https://img.shields.io/github/stars/renat0w0/Controle-Ponto?style=social)](https://github.com/renat0w0/Controle-Ponto/stargazers)

**Desenvolvido com 💙 por Renato Alves**

</div>

# ⏰ Controle de Ponto (Web)# ⏰ Controle de Ponto (Web)



Aplicação web moderna para controle de ponto eletrônico, com login, importação de CSV, sincronização com a API IDSecure, dashboard com gráficos (Chart.js), tema claro/escuro e armazenamento local (LocalStorage).Aplicação web moderna para controle de ponto eletrônico, com login, importação de CSV, sincronização com a API IDSecure, dashboard com gráficos (Chart.js), tema claro/escuro e armazenamento local (LocalStorage).



## 📸 Visão geral## 📸 Visão geral



- Dashboard com KPIs, gráficos e resumo semanal- Dashboard com KPIs, gráficos e resumo semanal

- Páginas dedicadas para Registros, Importação de CSV e Sincronização via API- Páginas dedicadas para Registros, Importação de CSV e Sincronização via API

- Interface responsiva com sidebar, tema dark/light e header auto-hide- Interface responsiva com sidebar, tema dark/light e header auto-hide



## ✨ Funcionalidades## ✨ Funcionalidades



### 📊 Dashboard interativo (pages/dashboard.html)### 📊 Dashboard interativo (pages/dashboard.html)

- KPIs: Total trabalhado, Horas extras, Média diária, Dias trabalhados

- KPIs: Total trabalhado, Horas extras, Média diária, Dias trabalhados- Gráficos (Chart.js):

- Gráficos (Chart.js):  - Barras empilhadas por semana (Horas Normais × Extras)

  - Barras empilhadas por semana (Horas Normais × Extras)  - Linha da evolução diária de horas extras

  - Linha da evolução diária de horas extras- Filtros de período: últimos 7 dias, mês atual, todos, ou intervalo personalizado

- Filtros de período: últimos 7 dias, mês atual, todos, ou intervalo personalizado- Resumo semanal com: dias, total, extras e média diária

- Resumo semanal com: dias, total, extras e média diária

### 📝 Registros (pages/registros.html)

### 📝 Registros (pages/registros.html)- Tabela agrupada por data com dia da semana, entrada, saída, total e extra

- Filtro por período (de/até) e exportação para CSV (UTF-8 com BOM)

- Tabela agrupada por data com dia da semana, entrada, saída, total e extra- Destaques visuais para fim de semana e para horas extras

- Filtro por período (de/até) e exportação para CSV (UTF-8 com BOM)

- Destaques visuais para fim de semana e para horas extras### � Importação (pages/importar.html)

- Arraste-e-solte ou seleção de arquivo CSV

### 📥 Importação (pages/importar.html)- Parser flexível: detecta padrões “DD/MM/YYYY HH:MM” em qualquer linha

- Agrupamento automático por dia (primeira ocorrência = entrada, última = saída)

- Arraste-e-solte ou seleção de arquivo CSV- Feedback de importados e duplicados

- Parser flexível: detecta padrões "DD/MM/YYYY HH:MM" em qualquer linha

- Agrupamento automático por dia (primeira ocorrência = entrada, última = saída)### 🔌 Integração com API IDSecure (pages/api.html)

- Feedback de importados e duplicados- Login pelo endpoint de operadores: main.idsecure.com.br

- Busca de pessoas e sincronização de logs via report.idsecure.com.br

### 🔌 Integração com API IDSecure (pages/api.html)- Seleção de período para sincronizar e persistência no LocalStorage

- Logout e limpeza de credenciais

- Login pelo endpoint de operadores: main.idsecure.com.br

- Busca de pessoas e sincronização de logs via report.idsecure.com.br### 🎨 UI/UX

- Seleção de período para sincronizar e persistência no LocalStorage- Tema Claro/Escuro com persistência

- Logout e limpeza de credenciais- Sidebar colapsável, auto-hide do header ao rolar, ícones Remix Icons

- Layout responsivo focado em desktop e dispositivos móveis

### 🎨 UI/UX

## 🛠️ Tecnologias

- Tema Claro/Escuro com persistência

- Sidebar colapsável, auto-hide do header ao rolar, ícones Remix Icons- HTML5, CSS3 (variáveis, gradientes, responsivo)

- Layout responsivo focado em desktop e dispositivos móveis- JavaScript (ES6+)

- Chart.js (gráficos interativos)

## 🛠️ Tecnologias- LocalStorage (dados e preferências)

- Remix Icons

- HTML5, CSS3 (variáveis, gradientes, responsivo)

- JavaScript (ES6+)## 📁 Estrutura do projeto

- Chart.js (gráficos interativos)

- LocalStorage (dados e preferências)```

- Remix IconsControle-Ponto/

├── index.html               # Redireciona para a aplicação (login/dashboard)

## 📁 Estrutura do projeto├── login.html               # Tela de login (IDSecure)

├── style.css                # Estilos globais, temas e componentes

```text├── app.js                   # (Legado) Lógica consolidada/experimental

Controle-Ponto/├── js/

├── index.html               # Redireciona para a aplicação (login/dashboard)│   ├── core.js             # Utilidades, cálculos, storage, proteção de rotas

├── login.html               # Tela de login (IDSecure)│   ├── dashboard.js        # Métricas, gráficos e tabela semanal

├── style.css                # Estilos globais, temas e componentes│   ├── registros.js        # Listagem/agrupamento e exportação CSV

├── app.js                   # (Legado) Lógica consolidada/experimental│   ├── importar.js         # Parser CSV e fluxo de importação

├── js/│   ├── api.js              # Login/busca/sincronização com IDSecure

│   ├── core.js             # Utilidades, cálculos, storage, proteção de rotas│   ├── sidebar.js          # Sidebar, tema (dark), avatar do usuário

│   ├── dashboard.js        # Métricas, gráficos e tabela semanal│   └── theme.js            # (Opcional) Toggle de tema baseado em data-theme

│   ├── registros.js        # Listagem/agrupamento e exportação CSV└── pages/

│   ├── importar.js         # Parser CSV e fluxo de importação    ├── dashboard.html      # Dashboard principal

│   ├── api.js              # Login/busca/sincronização com IDSecure    ├── registros.html      # Registros com filtros e exportação

│   ├── sidebar.js          # Sidebar, tema (dark), avatar do usuário    ├── importar.html       # Importação CSV

│   └── theme.js            # (Opcional) Toggle de tema baseado em data-theme    └── api.html            # Sincronização via API IDSecure

└── pages/```

    ├── dashboard.html      # Dashboard principal

    ├── registros.html      # Registros com filtros e exportaçãoObservação: `app.js` concentra uma versão mais antiga/monolítica do fluxo. As páginas em `pages/` utilizam os módulos em `js/` e são o caminho recomendado.

    ├── importar.html       # Importação CSV

    └── api.html            # Sincronização via API IDSecure## 🚀 Como executar

```

Você pode abrir diretamente os arquivos HTML ou servir via um servidor local (recomendado para evitar problemas de CORS e caminhos relativos).

Observação: `app.js` concentra uma versão mais antiga/monolítica do fluxo. As páginas em `pages/` utilizam os módulos em `js/` e são o caminho recomendado.

1) Abrir diretamente (rápido):

## 🚀 Como executar- Abra `login.html` no navegador. Após login, acesse as páginas em `pages/`.



Você pode abrir diretamente os arquivos HTML ou servir via um servidor local (recomendado para evitar problemas de CORS e caminhos relativos).2) Servidor local (recomendado):

- Python (3.x):

**Opção 1 - Abrir diretamente (rápido):**  - Windows PowerShell: `python -m http.server 8000`

  - Acesse: `http://localhost:8000/login.html`

- Abra `login.html` no navegador. Após login, acesse as páginas em `pages/`.- Node.js (http-server):

  - `npx http-server -p 8000`

**Opção 2 - Servidor local (recomendado):**  - Acesse: `http://localhost:8000/login.html`



- Python (3.x):URLs úteis quando servido localmente:

  - Windows PowerShell: `python -m http.server 8000`- Login: `/login.html`

  - Acesse: `http://localhost:8000/login.html`- Dashboard: `/pages/dashboard.html`

- Node.js (http-server):- Registros: `/pages/registros.html`

  - `npx http-server -p 8000`- Importar CSV: `/pages/importar.html`

  - Acesse: `http://localhost:8000/login.html`- Sincronizar API: `/pages/api.html`



URLs úteis quando servido localmente:## 🔑 Autenticação e dados



- Login: `/login.html`- Login: feito na `login.html` chamando `fazerLogin(email, senha)` (IDSecure).

- Dashboard: `/pages/dashboard.html`- Proteção de rotas: `core.js` redireciona para `login.html` se não houver `apiToken` no LocalStorage.

- Registros: `/pages/registros.html`- Armazenamento no navegador:

- Importar CSV: `/pages/importar.html`  - `registros`: lista dos registros agrupados por dia (entrada/saída)

- Sincronizar API: `/pages/api.html`  - `apiToken`, `apiEmail`: sessão do IDSecure

  - `usuarioNome`, `usuarioFoto`: dados do usuário exibidos na sidebar

## 🔑 Autenticação e dados  - Preferências de tema

- Logout: botão “Sair” na sidebar remove credenciais e volta para o login.

- Login: feito na `login.html` chamando `fazerLogin(email, senha)` (IDSecure).

- Proteção de rotas: `core.js` redireciona para `login.html` se não houver `apiToken` no LocalStorage.## 📥 Importação de CSV

- Armazenamento no navegador:

  - `registros`: lista dos registros agrupados por dia (entrada/saída)- Vá em “Importar CSV” e solte/selecione o arquivo.

  - `apiToken`, `apiEmail`: sessão do IDSecure- O parser reconhece datas no padrão brasileiro em qualquer linha (ex.: `03/11/2025 06:47`).

  - `usuarioNome`, `usuarioFoto`: dados do usuário exibidos na sidebar- O sistema agrupa automaticamente por dia e define a primeira ocorrência como “entrada” e a última como “saída”.

  - Preferências de tema

- Logout: botão "Sair" na sidebar remove credenciais e volta para o login.Exemplo de linha válida (dentro do arquivo):



## 📥 Importação de CSV```

03/11/2025 06:47, alguma outra coluna, ...

- Vá em "Importar CSV" e solte/selecione o arquivo.```

- O parser reconhece datas no padrão brasileiro em qualquer linha (ex.: `03/11/2025 06:47`).

- O sistema agrupa automaticamente por dia e define a primeira ocorrência como "entrada" e a última como "saída".## 🔄 Sincronização via API (IDSecure)



Exemplo de linha válida (dentro do arquivo):1. Faça login em `login.html` com suas credenciais IDSecure.

2. Acesse “Sincronizar API”, selecione o período e clique em “Sincronizar Registros”.

```csv3. Os logs são buscados do endpoint `accesslog/logs` e salvos localmente.

03/11/2025 06:47, alguma outra coluna, ...

```Observações:

- Requer conectividade externa e permissões no IDSecure.

## 🔄 Sincronização via API (IDSecure)- Em caso de CORS/rede, a interface mostrará mensagens de erro.



1. Faça login em `login.html` com suas credenciais IDSecure.## 🧮 Cálculo de horas

2. Acesse "Sincronizar API", selecione o período e clique em "Sincronizar Registros".

3. Os logs são buscados do endpoint `accesslog/logs` e salvos localmente.- Dias úteis: horas extras após 17:30.

- Finais de semana: todo o período é extra.

Observações:- Jornada padrão usada nos cálculos: 8h40min (configurável em `core.js`).



- Requer conectividade externa e permissões no IDSecure.## 🧪 Dicas de uso

- Em caso de CORS/rede, a interface mostrará mensagens de erro.

- Use “Limpar Dados” na sidebar para resetar registros do navegador.

## 🧮 Cálculo de horas- Exporte CSV pela página “Registros”.

- Troque o tema pelo botão “Tema” na sidebar; as cores dos gráficos se adaptam.

- Dias úteis: horas extras após 17:30.

- Finais de semana: todo o período é extra.## 🐛 Problemas conhecidos

- Jornada padrão usada nos cálculos: 8h40min (configurável em `core.js`).

- Abertura direta de arquivos pode causar limitações (CORS) ao chamar a API IDSecure. Prefira servir a pasta via servidor local.

## 🧪 Dicas de uso

Se encontrar um bug, abra uma issue: https://github.com/renat0w0/Controle-Ponto/issues

- Use "Limpar Dados" na sidebar para resetar registros do navegador.

- Exporte CSV pela página "Registros".## 🤝 Contribuição

- Troque o tema pelo botão "Tema" na sidebar; as cores dos gráficos se adaptam.

1. Faça fork do projeto

## 🐛 Problemas conhecidos2. Crie sua branch (`git checkout -b feature/minha-feature`)

3. Commit (`git commit -m "feat: adiciona minha feature"`)

- Abertura direta de arquivos pode causar limitações (CORS) ao chamar a API IDSecure. Prefira servir a pasta via servidor local.4. Push (`git push origin feature/minha-feature`)

5. Abra um Pull Request

Se encontrar um bug, abra uma issue em: <https://github.com/renat0w0/Controle-Ponto/issues>

## 📄 Licença

## 🤝 Contribuição

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).

1. Faça fork do projeto

2. Crie sua branch (`git checkout -b feature/minha-feature`)## � Autor

3. Commit (`git commit -m "feat: adiciona minha feature"`)

4. Push (`git push origin feature/minha-feature`)Renato Alves — [@renat0w0](https://github.com/renat0w0)

5. Abra um Pull Request

## ⭐ Apoie

## 📄 Licença

Se este projeto te ajudou, deixe uma estrela no repositório.

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).

---

## 👤 Autor

Desenvolvido com ❤️ por Renato Alves

Renato Alves — [@renat0w0](https://github.com/renat0w0)

## ⭐ Apoie

Se este projeto te ajudou, deixe uma estrela no repositório.

---

Desenvolvido com ❤️ por Renato Alves

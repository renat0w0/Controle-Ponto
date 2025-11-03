# ⏰ Sistema de Controle de Ponto

Um sistema web moderno e intuitivo para controle de ponto eletrônico, com dashboard completo, gráficos interativos e tema claro/escuro.

## 📸 Demonstração

Sistema completo de gestão de horas trabalhadas com interface responsiva e moderna.

## ✨ Funcionalidades

### 📊 Dashboard Interativo
- **KPIs em tempo real**: Visualização de horas trabalhadas, extras e estatísticas
- **Gráficos dinâmicos**: 
  - Gráfico de barras empilhadas (Horas Normais vs Extras)
  - Gráfico de linha para evolução de horas extras
  - Cores adaptativas para cada tema
- **Filtros de período**: 7 dias, 15 dias, 30 dias ou visualização completa
- **Filtro por data**: Selecione período personalizado (De/Até)
- **Resumo semanal**: Tabela com análise por semana (dias trabalhados, total, extras, média diária)

### 📝 Gestão de Registros
- **Tabela completa** de todos os registros de ponto
- **Informações detalhadas**: Data, dia da semana, entrada, saída, total trabalhado e horas extras
- **Busca e filtros** para encontrar registros específicos
- **Estatísticas rápidas**: Total de registros e período atual

### 🔄 Importação de Dados
- **Upload de CSV**: Importe múltiplos registros de uma vez
- **Formato flexível**: Suporta diversos formatos de data e hora
- **Validação automática**: Verifica dados antes da importação
- **Feedback visual**: Progresso e confirmação da importação

### 🔌 Integração com API
- **Sincronização IDSecure**: Busque registros diretamente da API IDSecure
- **Seleção de período**: Escolha o intervalo de datas para sincronizar
- **Login seguro**: Autenticação integrada
- **Atualização automática**: Sincronize sempre que necessário

### 🎨 Interface Moderna
- **Tema Claro/Escuro**: Alternância suave entre temas
  - Modo claro: Interface clean e minimalista
  - Modo escuro: Visual profissional com gradientes e profundidade
- **Design responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Header auto-hide**: Se oculta automaticamente ao rolar a página
- **Animações suaves**: Transições e efeitos visuais elegantes
- **Sidebar colapsável**: Navegação lateral com menu expansível

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica e moderna
- **CSS3**: Estilização avançada com variáveis CSS, gradientes e animações
- **JavaScript (ES6+)**: Lógica de negócio e manipulação do DOM
- **Chart.js**: Biblioteca para gráficos interativos e responsivos
- **LocalStorage**: Armazenamento local de dados e preferências
- **Remix Icons**: Ícones modernos e consistentes

## 📁 Estrutura do Projeto

```
autorefresh/
├── pages/
│   ├── dashboard.html      # Dashboard principal com gráficos
│   ├── registros.html      # Página de visualização de registros
│   ├── importar.html       # Importação de CSV
│   └── api.html           # Sincronização com API IDSecure
├── js/
│   ├── core.js            # Funções utilitárias e cálculos
│   ├── dashboard.js       # Lógica do dashboard e gráficos
│   ├── registros.js       # Gerenciamento de registros
│   ├── importar.js        # Lógica de importação CSV
│   ├── api.js             # Integração com API
│   ├── sidebar.js         # Controle da sidebar e tema
│   └── theme.js           # Gerenciamento de tema
├── style.css              # Estilos globais
├── app.js                 # Script principal
└── README.md              # Este arquivo
```

## 🚀 Como Usar

### 1. Instalação Local

Clone o repositório:
```bash
git clone https://github.com/renat0w0/autorefresh.git
cd autorefresh
```

### 2. Executar o Projeto

Abra o arquivo `pages/dashboard.html` diretamente no navegador ou use um servidor local:

**Opção 1 - Direto no navegador:**
- Abra `pages/dashboard.html` no seu navegador

**Opção 2 - Com servidor local (recomendado):**
```bash
# Usando Python
python -m http.server 8000

# Usando Node.js
npx http-server

# Usando PHP
php -S localhost:8000
```

Acesse: `http://localhost:8000/pages/dashboard.html`

### 3. Importar Dados

**Via CSV:**
1. Vá para a página "Importar"
2. Clique em "Escolher arquivo"
3. Selecione seu arquivo CSV
4. Clique em "Importar Registros"

**Formato do CSV:**
```csv
data,entrada,saida
2025-09-01,06:43,17:26
2025-09-02,06:48,17:48
2025-09-03,06:51,20:31
```

**Via API IDSecure:**
1. Vá para a página "Sincronizar API"
2. Faça login com suas credenciais
3. Selecione o período desejado
4. Clique em "Sincronizar Registros"

## 💡 Recursos Especiais

### Cálculo de Horas Extras
O sistema calcula automaticamente as horas extras baseado em:
- **Dias úteis**: Extras após 17:30h
- **Finais de semana**: Todo tempo trabalhado é considerado extra
- **Jornada normal**: 8h40min (configurável)

### Agrupamento Semanal
- Agrupa registros por semana do ano (S1, S2, S3...)
- Calcula totais, extras e média diária por semana
- Visualização em gráficos e tabelas

### Temas Adaptativos
- **Cores dinâmicas**: Gráficos mudam de cor conforme o tema
- **Persistência**: Preferência de tema salva no navegador
- **Contraste otimizado**: Textos sempre legíveis em ambos os temas

### Performance
- **Lazy loading**: Carregamento otimizado de recursos
- **Debouncing**: Otimização de eventos de scroll
- **Cache inteligente**: Uso eficiente do LocalStorage

## 🎯 Funcionalidades Futuras

- [ ] Exportação de relatórios em PDF
- [ ] Notificações de lembrete de ponto
- [ ] Integração com Google Calendar
- [ ] Modo offline completo (PWA)
- [ ] Backup automático na nuvem
- [ ] Múltiplos perfis de usuário
- [ ] Relatórios personalizáveis
- [ ] API própria para integração

## 🐛 Problemas Conhecidos

Nenhum problema conhecido no momento. Se encontrar algum bug, por favor abra uma [issue](https://github.com/renat0w0/autorefresh/issues).

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Renato Alves** - [@renat0w0](https://github.com/renat0w0)

## 📞 Contato

- GitHub: [@renat0w0](https://github.com/renat0w0)
- LinkedIn: [Renato Alves](https://linkedin.com/in/renat0w0)

## ⭐ Mostre seu apoio

Se este projeto foi útil para você, dê uma ⭐️!

---

**Desenvolvido com ❤️ por Renato Alves**

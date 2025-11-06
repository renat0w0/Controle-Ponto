/*=============== SHOW SIDEBAR ===============*/
const showSidebar = (toggleId, sidebarId, headerId, mainId) => {
   const toggle = document.getElementById(toggleId),
         sidebar = document.getElementById(sidebarId),
         header = document.getElementById(headerId),
         main = document.getElementById(mainId)

   if(toggle && sidebar && header && main){
       toggle.addEventListener('click', () => {
           sidebar.classList.toggle('show-sidebar')
           header.classList.toggle('left-pd')
           main.classList.toggle('left-pd')
       })
   }
}
showSidebar('header-toggle','sidebar', 'header', 'main')

/*=============== LINK ACTIVE ===============*/
const sidebarLink = document.querySelectorAll('.sidebar__list a')

function linkColor(){
    sidebarLink.forEach(l => l.classList.remove('active-link'))
    this.classList.add('active-link')
}

sidebarLink.forEach(l => l.addEventListener('click', linkColor))

/*=============== DARK LIGHT THEME ===============*/ 
const themeButton = document.getElementById('theme-button')
const darkTheme = 'dark-theme'
const iconTheme = 'ri-sun-fill'

const selectedTheme = localStorage.getItem('selected-theme')
const selectedIcon = localStorage.getItem('selected-icon')

const getCurrentTheme = () => document.body.classList.contains(darkTheme) ? 'dark' : 'light'
const getCurrentIcon = () => themeButton.classList.contains(iconTheme) ? 'ri-moon-clear-fill' : 'ri-sun-fill'

if (selectedTheme) {
  document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'](darkTheme)
  themeButton.classList[selectedIcon === 'ri-moon-clear-fill' ? 'add' : 'remove'](iconTheme)
}

themeButton.addEventListener('click', () => {
    document.body.classList.toggle(darkTheme)
    themeButton.classList.toggle(iconTheme)
    localStorage.setItem('selected-theme', getCurrentTheme())
    localStorage.setItem('selected-icon', getCurrentIcon())
})

/*=============== USER DATA IN SIDEBAR ===============*/
async function preencherSidebarUsuario() {
    const user = Storage.user.get();
    let { nome, email, foto } = user;
    
    if (!nome && email) {
        console.log('🔍 Buscando dados do usuário da API...');
        try {
            if (typeof buscarUsuarioLogado === 'function') {
                await buscarUsuarioLogado(email);
                const updatedUser = Storage.user.get();
                nome = updatedUser.nome || 'Usuário';
                foto = updatedUser.foto;
            }
        } catch (erro) {
            console.error('❌ Erro ao buscar usuário:', erro);
            nome = 'Usuário';
        }
    }
    
    if (!nome) nome = 'Usuário';
    
    console.log('🔄 Preenchendo sidebar com:', { nome, email, foto: foto ? 'presente' : 'ausente' });
    
    const nomeEl = document.getElementById('sidebarUserNome');
    const emailEl = document.getElementById('sidebarUserEmail');
    const imgEl = document.getElementById('sidebarUserImg');
    
    if (nomeEl) nomeEl.textContent = nome;
    if (emailEl) emailEl.textContent = email;
    
    if (imgEl) {
        if (foto) {
            console.log('📸 Aplicando foto no sidebar');
            imgEl.innerHTML = `<img src="${foto}" alt="Foto de perfil" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">`;
        } else {
            console.log('⚠️ Nenhuma foto, usando iniciais');
            // Criar avatar com iniciais e degradê colorido
            const iniciais = nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            const isDark = document.body.classList.contains('dark-theme');
            const bgGradient = isDark 
                ? 'linear-gradient(135deg, hsl(228, 24%, 16%), hsl(228, 24%, 25%))' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            const textColor = '#fff';
            imgEl.innerHTML = `<div style="width:48px;height:48px;border-radius:50%;background:${bgGradient};display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:bold;color:${textColor};box-shadow:0 4px 8px rgba(0,0,0,0.2);">${iniciais}</div>`;
        }
    } else {
        console.log('⚠️ Elemento sidebarUserImg não encontrado');
    }
}
window.preencherSidebarUsuario = preencherSidebarUsuario;
window.logoutIDSec = function() {
    Storage.auth.clear();
    Storage.user.clear();
    window.location.href = '../login.html';
};
document.addEventListener('DOMContentLoaded', preencherSidebarUsuario);


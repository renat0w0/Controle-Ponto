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
        // Container para foto + badge
        let containerHTML = '';
        
        if (foto) {
            console.log('📸 Aplicando foto no sidebar');
            containerHTML = `
                <div style="position: relative; width: 44px; height: 44px;">
                    <img src="${foto}" alt="Foto de perfil" style="width:44px;height:44px;border-radius:50%;object-fit:cover;">
                    ${getStorageBadge()}
                </div>
            `;
        } else {
            console.log('⚠️ Nenhuma foto, usando iniciais');
            // Criar avatar com iniciais e degradê colorido
            const iniciais = nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            const isDark = document.body.classList.contains('dark-theme');
            const bgGradient = isDark 
                ? 'linear-gradient(135deg, hsl(228, 24%, 16%), hsl(228, 24%, 25%))' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            const textColor = '#fff';
            containerHTML = `
                <div style="position: relative; width: 44px; height: 44px;">
                    <div style="width:44px;height:44px;border-radius:50%;background:${bgGradient};display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:bold;color:${textColor};box-shadow:0 4px 8px rgba(0,0,0,0.2);">${iniciais}</div>
                    ${getStorageBadge()}
                </div>
            `;
        }
        
        imgEl.innerHTML = containerHTML;
    } else {
        console.log('⚠️ Elemento sidebarUserImg não encontrado');
    }
}

/*=============== STORAGE BADGE ===============*/
function getStorageBadge() {
    const storageType = Storage.get('storageType');
    const storageConnected = Storage.get('storageConnected');
    
    if (!storageType || storageType === 'local' || !storageConnected) {
        return ''; // Sem badge se for local ou não conectado
    }
    
    let badgeHTML = '';
    
    if (storageType === 'google') {
        // Badge do Google Drive com efeito 3D na borda
        badgeHTML = `
            <div style="position: absolute; bottom: -3px; right: -3px; width: 22px; height: 22px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.2); border: 3px solid rgba(59, 130, 246, 0.9); z-index: 10;" title="Conectado ao Google Drive">
                <svg viewBox="0 0 48 48" style="width: 14px; height: 14px;">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
            </div>
        `;
    } else if (storageType === 'onedrive') {
        // Badge do OneDrive com efeito 3D na borda
        badgeHTML = `
            <div style="position: absolute; bottom: -3px; right: -3px; width: 22px; height: 22px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.2); border: 3px solid rgba(59, 130, 246, 0.9); z-index: 10;" title="Conectado ao OneDrive">
                <svg viewBox="0 0 48 48" style="width: 14px; height: 14px;">
                    <path fill="#0078D4" d="M30.9,19.9c-0.4-5.1-4.7-9.1-9.9-9.1c-4.2,0-7.8,2.6-9.3,6.3C8.7,18,6,21.3,6,25.2c0,4.8,3.9,8.8,8.8,8.8h15.6c4.3,0,7.8-3.5,7.8-7.8C38.2,22.9,35.2,20.2,30.9,19.9z"/>
                </svg>
            </div>
        `;
    }
    
    return badgeHTML;
}
window.preencherSidebarUsuario = preencherSidebarUsuario;
window.logoutIDSec = function() {
    Storage.auth.clear();
    Storage.user.clear();
    window.location.href = '../login.html';
};
document.addEventListener('DOMContentLoaded', preencherSidebarUsuario);


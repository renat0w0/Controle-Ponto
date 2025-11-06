// Sistema de notificações toast profissional

class Toast {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        
        const icons = {
            success: 'ri-checkbox-circle-fill',
            error: 'ri-error-warning-fill',
            warning: 'ri-alert-fill',
            info: 'ri-information-fill'
        };

        toast.innerHTML = `
            <i class="${icons[type]}"></i>
            <span class="toast__message">${message}</span>
            <button class="toast__close" onclick="this.parentElement.remove()">
                <i class="ri-close-line"></i>
            </button>
        `;

        this.container.appendChild(toast);

        setTimeout(() => toast.classList.add('toast--show'), 10);

        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('toast--show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }

    loading(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast--loading';
        
        toast.innerHTML = `
            <div class="toast__spinner"></div>
            <span class="toast__message">${message}</span>
        `;

        this.container.appendChild(toast);
        setTimeout(() => toast.classList.add('toast--show'), 10);

        return {
            dismiss: () => {
                toast.classList.remove('toast--show');
                setTimeout(() => toast.remove(), 300);
            },
            update: (newMessage, type = 'success') => {
                toast.classList.remove('toast--show');
                setTimeout(() => {
                    toast.remove();
                    this.show(newMessage, type);
                }, 300);
            }
        };
    }
}

const toast = new Toast();

window.toast = toast;

// Shared app functionality
class App {
    static init(pageName) {
        this.currentPage = pageName;
        this.setupNavbar();
        this.checkAuth(pageName);
    }

    static checkAuth(pageName) {
        const publicPages = ['index', 'login'];
        if (!publicPages.includes(pageName) && !API.isLoggedIn()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

    static setupNavbar() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        // Scroll effect
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 20);
        });

        // Active link
        document.querySelectorAll('.nav-links a').forEach(link => {
            if (link.getAttribute('href')?.includes(this.currentPage)) {
                link.classList.add('active');
            }
        });

        // Mobile toggle
        const toggle = document.querySelector('.mobile-toggle');
        const links = document.querySelector('.nav-links');
        if (toggle && links) {
            toggle.addEventListener('click', () => {
                links.classList.toggle('mobile-open');
            });
        }

        // User info
        if (API.isLoggedIn()) {
            this.updateNavUser();
        }
    }

    static updateNavUser() {
        const user = API.getUser();
        if (!user) return;

        const avatar = document.querySelector('.nav-avatar');
        if (avatar) {
            avatar.textContent = user.full_name?.charAt(0)?.toUpperCase() || 'U';
            avatar.style.background = user.avatar_color || '#00d4ff';
        }

        const xpEl = document.querySelector('.nav-xp-value');
        if (xpEl) xpEl.textContent = user.xp || 0;

        const levelEl = document.querySelector('.nav-level-value');
        if (levelEl) levelEl.textContent = user.level || 1;

        const streakEl = document.querySelector('.nav-streak-value');
        if (streakEl) streakEl.textContent = user.streak_days || 0;
    }

    static logout() {
        API.clearAuth();
        window.location.href = '/login.html';
    }

    static showToast(message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: '✓', error: '✕', info: 'ℹ', xp: '⚡'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    static showLoading(text = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `<div class="spinner"></div><div class="loading-text">${text}</div>`;
        document.body.appendChild(overlay);
    }

    static hideLoading() {
        document.getElementById('loading-overlay')?.remove();
    }

    static formatDate(dateStr) {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    static getScoreColor(score) {
        if (score >= 80) return 'var(--accent-green)';
        if (score >= 60) return 'var(--accent-cyan)';
        if (score >= 40) return 'var(--accent-amber)';
        return 'var(--accent-red)';
    }

    static getScoreLabel(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 75) return 'Great';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Work';
    }

    static createScoreCircle(score, size = 120, label = '') {
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (score / 100) * circumference;
        const color = this.getScoreColor(score);

        return `
            <div class="score-circle-container">
                <div class="score-circle" style="width:${size}px;height:${size}px">
                    <svg viewBox="0 0 100 100">
                        <circle class="score-circle-bg" cx="50" cy="50" r="45"/>
                        <circle class="score-circle-fill" cx="50" cy="50" r="45"
                            stroke="${color}"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${offset}"/>
                    </svg>
                    <span class="score-value" style="color:${color}">${Math.round(score)}</span>
                </div>
                ${label ? `<span class="score-label">${label}</span>` : ''}
            </div>
        `;
    }

    static createProgressBar(value, max = 100, gradient = 'var(--gradient-primary)') {
        const percent = Math.min(100, (value / max) * 100);
        return `
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width:${percent}%;background:${gradient}"></div>
            </div>
        `;
    }

    static getActivityIcon(type) {
        const icons = {
            'achievement': '🏆',
            'resume_upload': '📄',
            'interview_practice': '🎤',
            'skill_analysis': '📊',
            'study_plan': '✅',
            'default': '📌'
        };
        return icons[type] || icons['default'];
    }
}

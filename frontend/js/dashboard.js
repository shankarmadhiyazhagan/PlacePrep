document.addEventListener('DOMContentLoaded', () => {
    App.init('dashboard');
    loadDashboard();
});

async function loadDashboard() {
    try {
        const data = await API.getDashboard();
        renderUserHeader(data.user);
        renderStats(data.stats);
        renderScoreCards(data.stats);
        renderRecentActivity(data.recent_activities);
        renderInterviewTrend(data.interview_trend);
        App.updateNavUser();
        // Update stored user
        const user = API.getUser();
        if (user) {
            user.xp = data.user.xp;
            user.level = data.user.level;
            user.streak_days = data.user.streak_days;
            API.setUser(user);
        }
    } catch (err) {
        App.showToast(err.message, 'error');
    }
}

function renderUserHeader(user) {
    const el = document.getElementById('user-header');
    if (!el) return;

    const xpProgress = user.xp % 500;
    const xpNeeded = 500;

    el.innerHTML = `
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
            <div class="nav-avatar" style="width:56px;height:56px;font-size:1.4rem;background:${user.avatar_color}">
                ${user.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style="flex:1">
                <h2 style="margin-bottom:4px">Welcome back, ${user.full_name}! 👋</h2>
                <p style="color:var(--text-secondary);margin:0">${user.target_role} • Level ${user.level}</p>
                <div style="display:flex;align-items:center;gap:16px;margin-top:8px">
                    <span class="tag tag-purple">⚡ ${user.xp} XP</span>
                    <span class="tag tag-amber">🔥 ${user.streak_days} day streak</span>
                </div>
                <div style="margin-top:8px;max-width:300px">
                    <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-muted)">
                        <span>Level ${user.level}</span>
                        <span>${xpProgress}/${xpNeeded} XP</span>
                    </div>
                    ${App.createProgressBar(xpProgress, xpNeeded)}
                </div>
            </div>
        </div>
    `;
}

function renderStats(stats) {
    const el = document.getElementById('stats-grid');
    if (!el) return;

    el.innerHTML = `
        <div class="stat-card glass-card animate-in animate-delay-1">
            <div class="stat-icon" style="background:rgba(0,212,255,0.1);color:var(--accent-cyan)">📄</div>
            <div class="stat-info">
                <h4>${stats.total_resumes}</h4>
                <div class="stat-label">Resumes Analyzed</div>
            </div>
        </div>
        <div class="stat-card glass-card animate-in animate-delay-2">
            <div class="stat-icon" style="background:rgba(139,92,246,0.1);color:var(--accent-purple)">🎤</div>
            <div class="stat-info">
                <h4>${stats.total_interviews}</h4>
                <div class="stat-label">Mock Interviews</div>
            </div>
        </div>
        <div class="stat-card glass-card animate-in animate-delay-3">
            <div class="stat-icon" style="background:rgba(16,185,129,0.1);color:var(--accent-green)">📊</div>
            <div class="stat-info">
                <h4>${stats.total_skill_analyses}</h4>
                <div class="stat-label">Skill Analyses</div>
            </div>
        </div>
        <div class="stat-card glass-card animate-in animate-delay-4">
            <div class="stat-icon" style="background:rgba(245,158,11,0.1);color:var(--accent-amber)">🔥</div>
            <div class="stat-info">
                <h4>${stats.total_xp_earned}</h4>
                <div class="stat-label">Total XP Earned</div>
            </div>
        </div>
    `;
}

function renderScoreCards(stats) {
    const el = document.getElementById('score-cards');
    if (!el) return;

    el.innerHTML = `
        <div class="glass-card" style="text-align:center">
            ${App.createScoreCircle(stats.avg_resume_score, 110, 'Avg Resume Score')}
        </div>
        <div class="glass-card" style="text-align:center">
            ${App.createScoreCircle(stats.avg_interview_score, 110, 'Avg Interview Score')}
        </div>
        <div class="glass-card" style="text-align:center">
            ${App.createScoreCircle(stats.placement_readiness, 110, 'Placement Readiness')}
        </div>
    `;
}

function renderRecentActivity(activities) {
    const el = document.getElementById('recent-activity');
    if (!el) return;

    if (!activities?.length) {
        el.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No activity yet</h3>
                <p>Start by uploading a resume or practicing interviews!</p>
            </div>
        `;
        return;
    }

    el.innerHTML = `
        <div class="timeline">
            ${activities.map(a => `
                <div class="timeline-item">
                    <div class="timeline-dot" style="background:rgba(0,212,255,0.2);color:var(--accent-cyan)">
                        ${App.getActivityIcon(a.type)}
                    </div>
                    <div class="timeline-item-content glass-card" style="padding:14px 18px">
                        <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
                            <div>
                                <div style="font-weight:600;font-size:0.9rem">${a.title}</div>
                                <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">${a.description}</div>
                            </div>
                            ${a.xp_earned ? `<span class="tag tag-purple" style="white-space:nowrap">+${a.xp_earned} XP</span>` : ''}
                        </div>
                        <div class="timeline-time">${App.formatDate(a.created_at)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderInterviewTrend(trend) {
    const el = document.getElementById('interview-trend');
    if (!el) return;

    if (!trend?.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📈</div><h3>No interview data yet</h3><p>Complete mock interviews to see your progress trend!</p></div>';
        return;
    }

    const maxScore = 100;
    const width = el.clientWidth - 60;
    const height = 200;
    const padding = 30;

    const points = trend.map((t, i) => {
        const x = padding + (i / Math.max(trend.length - 1, 1)) * (width - padding * 2);
        const y = height - padding - (t.score / maxScore) * (height - padding * 2);
        return { x, y, score: t.score, date: t.date };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    el.innerHTML = `
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
            <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="var(--accent-cyan)"/>
                    <stop offset="100%" stop-color="var(--accent-purple)"/>
                </linearGradient>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="rgba(0,212,255,0.2)"/>
                    <stop offset="100%" stop-color="rgba(0,212,255,0)"/>
                </linearGradient>
            </defs>
            <path d="${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z" fill="url(#areaGrad)"/>
            <path d="${pathData}" fill="none" stroke="url(#lineGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            ${points.map(p => `
                <circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--accent-cyan)" stroke="var(--bg-primary)" stroke-width="2"/>
                <text x="${p.x}" y="${p.y - 12}" text-anchor="middle" fill="var(--text-secondary)" font-size="11" font-family="JetBrains Mono">${p.score}</text>
            `).join('')}
        </svg>
    `;
}

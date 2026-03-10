document.addEventListener('DOMContentLoaded', () => {
    App.init('progress');
    loadProgressData();
    document.getElementById('add-plan-form')?.addEventListener('submit', addStudyPlan);
});

async function loadProgressData() {
    try {
        const [dashboard, plans, activities] = await Promise.all([
            API.getDashboard(),
            API.getStudyPlans(),
            API.getActivities()
        ]);

        renderProgressStats(dashboard);
        renderStudyPlans(plans);
        renderActivityTimeline(activities);
    } catch (err) {
        App.showToast(err.message, 'error');
    }
}

function renderProgressStats(data) {
    const el = document.getElementById('progress-stats');
    if (!el) return;

    const stats = data.stats;
    const user = data.user;

    el.innerHTML = `
        <div class="stats-grid" style="margin-bottom:24px">
            <div class="stat-card glass-card">
                <div class="stat-icon" style="background:rgba(139,92,246,0.1);color:var(--accent-purple)">⚡</div>
                <div class="stat-info">
                    <h4 style="background:var(--gradient-secondary);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${user.xp}</h4>
                    <div class="stat-label">Total XP • Level ${user.level}</div>
                </div>
            </div>
            <div class="stat-card glass-card">
                <div class="stat-icon" style="background:rgba(245,158,11,0.1);color:var(--accent-amber)">🔥</div>
                <div class="stat-info">
                    <h4>${user.streak_days}</h4>
                    <div class="stat-label">Day Streak</div>
                </div>
            </div>
            <div class="stat-card glass-card">
                <div class="stat-icon" style="background:rgba(0,212,255,0.1);color:var(--accent-cyan)">📝</div>
                <div class="stat-info">
                    <h4>${stats.completed_tasks}</h4>
                    <div class="stat-label">Tasks Completed</div>
                </div>
            </div>
            <div class="stat-card glass-card">
                <div class="stat-icon" style="background:rgba(16,185,129,0.1);color:var(--accent-green)">📈</div>
                <div class="stat-info">
                    <h4>${Math.round(stats.placement_readiness)}%</h4>
                    <div class="stat-label">Placement Ready</div>
                </div>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:20px;text-align:center">
            <div class="glass-card" style="padding:20px">
                ${App.createScoreCircle(stats.avg_resume_score, 90, 'Resume Score')}
            </div>
            <div class="glass-card" style="padding:20px">
                ${App.createScoreCircle(stats.avg_interview_score, 90, 'Interview Score')}
            </div>
            <div class="glass-card" style="padding:20px">
                ${App.createScoreCircle(stats.placement_readiness, 90, 'Readiness')}
            </div>
        </div>
    `;
}

function renderStudyPlans(plans) {
    const el = document.getElementById('study-plans-list');
    if (!el) return;

    if (!plans?.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><h3>No study plans</h3><p>Create your first study plan!</p></div>';
        return;
    }

    const pending = plans.filter(p => p.status !== 'completed');
    const completed = plans.filter(p => p.status === 'completed');

    el.innerHTML = `
        ${pending.length ? `
            <div style="margin-bottom:16px">
                <h4 style="font-size:0.85rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Pending (${pending.length})</h4>
                ${pending.map(p => renderPlanItem(p)).join('')}
            </div>
        ` : ''}
        ${completed.length ? `
            <div>
                <h4 style="font-size:0.85rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Completed (${completed.length})</h4>
                ${completed.map(p => renderPlanItem(p)).join('')}
            </div>
        ` : ''}
    `;
}

function renderPlanItem(plan) {
    const isCompleted = plan.status === 'completed';
    const priorityColors = { high: 'var(--accent-red)', medium: 'var(--accent-amber)', low: 'var(--accent-green)' };

    return `
        <div class="plan-item">
            <div class="plan-checkbox ${isCompleted ? 'checked' : ''}" onclick="togglePlan(${plan.id}, '${isCompleted ? 'pending' : 'completed'}')">
                ${isCompleted ? '✓' : ''}
            </div>
            <div style="flex:1">
                <div class="plan-title ${isCompleted ? 'completed' : ''}">${plan.title}</div>
                ${plan.description ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">${plan.description}</div>` : ''}
            </div>
            <span class="plan-priority" style="color:${priorityColors[plan.priority] || priorityColors.medium}">${plan.priority}</span>
            <button class="btn btn-icon btn-secondary" onclick="deletePlan(${plan.id})" style="padding:6px;font-size:0.8rem" title="Delete">🗑</button>
        </div>
    `;
}

async function addStudyPlan(e) {
    e.preventDefault();
    const title = document.getElementById('plan-title').value.trim();
    const description = document.getElementById('plan-desc')?.value?.trim() || '';
    const category = document.getElementById('plan-category')?.value || 'general';
    const priority = document.getElementById('plan-priority')?.value || 'medium';

    if (!title) return;

    try {
        await API.createStudyPlan({ title, description, category, priority });
        document.getElementById('plan-title').value = '';
        if (document.getElementById('plan-desc')) document.getElementById('plan-desc').value = '';
        const plans = await API.getStudyPlans();
        renderStudyPlans(plans);
        App.showToast('Study plan added!', 'success');
    } catch (err) {
        App.showToast(err.message, 'error');
    }
}

async function togglePlan(id, newStatus) {
    try {
        await API.updateStudyPlan(id, { status: newStatus });
        const plans = await API.getStudyPlans();
        renderStudyPlans(plans);
        if (newStatus === 'completed') {
            App.showToast('Task completed! +30 XP 🎉', 'xp');
        }
    } catch (err) {
        App.showToast(err.message, 'error');
    }
}

async function deletePlan(id) {
    if (!confirm('Delete this study plan?')) return;
    try {
        await API.deleteStudyPlan(id);
        const plans = await API.getStudyPlans();
        renderStudyPlans(plans);
        App.showToast('Plan deleted', 'info');
    } catch (err) {
        App.showToast(err.message, 'error');
    }
}

function renderActivityTimeline(activities) {
    const el = document.getElementById('activity-timeline');
    if (!el) return;

    if (!activities?.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📌</div><h3>No activity yet</h3><p>Activities will appear here as you use the platform</p></div>';
        return;
    }

    el.innerHTML = `
        <div class="timeline">
            ${activities.map(a => `
                <div class="timeline-item">
                    <div class="timeline-dot" style="background:rgba(0,212,255,0.15);color:var(--accent-cyan)">
                        ${App.getActivityIcon(a.type)}
                    </div>
                    <div class="timeline-item-content glass-card" style="padding:12px 16px">
                        <div style="display:flex;justify-content:space-between;align-items:start">
                            <div>
                                <div style="font-weight:600;font-size:0.9rem">${a.title}</div>
                                ${a.description ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">${a.description}</div>` : ''}
                            </div>
                            ${a.xp_earned ? `<span class="tag tag-purple">+${a.xp_earned} XP</span>` : ''}
                        </div>
                        <div class="timeline-time">${App.formatDate(a.created_at)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

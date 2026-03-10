let skillTags = [];

document.addEventListener('DOMContentLoaded', () => {
    App.init('skillgap');
    setupSkillInput();
    document.getElementById('skillgap-form')?.addEventListener('submit', analyzeSkills);
    loadSkillGapHistory();
});

function setupSkillInput() {
    const input = document.getElementById('skill-input');
    const addBtn = document.getElementById('add-skill-btn');
    if (!input || !addBtn) return;

    const addSkill = () => {
        const val = input.value.trim();
        if (val && !skillTags.includes(val)) {
            skillTags.push(val);
            renderSkillTags();
            input.value = '';
        }
        input.focus();
    };

    addBtn.addEventListener('click', addSkill);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
    });

    // Quick add suggestions
    document.querySelectorAll('.quick-skill').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.textContent.trim();
            if (!skillTags.includes(val)) {
                skillTags.push(val);
                renderSkillTags();
            }
        });
    });
}

function renderSkillTags() {
    const el = document.getElementById('skill-tags');
    if (!el) return;

    el.innerHTML = skillTags.map((s, i) => `
        <span class="tag tag-cyan" style="cursor:pointer" onclick="removeSkill(${i})">
            ${s} ✕
        </span>
    `).join('');
}

function removeSkill(index) {
    skillTags.splice(index, 1);
    renderSkillTags();
}

async function analyzeSkills(e) {
    e.preventDefault();

    if (skillTags.length === 0) {
        App.showToast('Add at least one skill', 'error');
        return;
    }

    const targetRole = document.getElementById('sg-role').value;
    const expLevel = document.getElementById('sg-experience').value;

    App.showLoading('AI is analyzing your role-based skills...');

    try {
        const result = await API.analyzeSkillGap({
            target_role: targetRole,
            current_skills: skillTags,
            experience_level: expLevel
        });
        App.hideLoading();
        renderSkillGapAnalysis(result.analysis);
        App.showToast(`Role Based Analysis complete! +${result.xp_earned} XP`, 'xp');
        loadSkillGapHistory();
    } catch (err) {
        App.hideLoading();
        App.showToast(err.message, 'error');
    }
}

function renderSkillGapAnalysis(analysis) {
    const el = document.getElementById('analysis-section');
    if (!el) return;

    el.style.display = 'block';

    el.innerHTML = `
       <div class="glass-card animate-in" style="margin-bottom:24px">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px">
                <h3>📊 Role Based Analyzer Results</h3>
                <span class="tag tag-cyan">Est. Time: ${analysis.estimated_time_to_ready || 'N/A'}</span>
            </div>
            <div style="text-align:center;margin-bottom:24px">
                ${App.createScoreCircle(analysis.overall_readiness, 140, 'Overall Placement Readiness')}
            </div>
        </div>

        ${analysis.gap_analysis ? `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-bottom:24px">
                <div class="glass-card animate-in animate-delay-1">
                    <h4 style="color:var(--accent-red);margin-bottom:16px">🔴 Critical Gaps</h4>
                    ${(analysis.gap_analysis.critical_gaps || []).length ?
                analysis.gap_analysis.critical_gaps.map(g => `
                            <div style="padding:8px 12px;background:rgba(239,68,68,0.08);border-radius:var(--radius-sm);margin-bottom:8px;font-size:0.9rem;color:var(--text-secondary)">
                                ${g}
                            </div>
                        `).join('') :
                '<p style="color:var(--text-muted);font-size:0.9rem">No critical gaps found!</p>'
            }
                </div>
                <div class="glass-card animate-in animate-delay-2">
                    <h4 style="color:var(--accent-amber);margin-bottom:16px">🟡 Moderate Gaps</h4>
                    ${(analysis.gap_analysis.moderate_gaps || []).length ?
                analysis.gap_analysis.moderate_gaps.map(g => `
                            <div style="padding:8px 12px;background:rgba(245,158,11,0.08);border-radius:var(--radius-sm);margin-bottom:8px;font-size:0.9rem;color:var(--text-secondary)">
                                ${g}
                            </div>
                        `).join('') :
                '<p style="color:var(--text-muted);font-size:0.9rem">No moderate gaps found!</p>'
            }
                </div>
                <div class="glass-card animate-in animate-delay-3">
                    <h4 style="color:var(--accent-green);margin-bottom:16px">🟢 Minor Gaps</h4>
                    ${(analysis.gap_analysis.minor_gaps || []).length ?
                analysis.gap_analysis.minor_gaps.map(g => `
                            <div style="padding:8px 12px;background:rgba(16,185,129,0.08);border-radius:var(--radius-sm);margin-bottom:8px;font-size:0.9rem;color:var(--text-secondary)">
                                ${g}
                            </div>
                        `).join('') :
                '<p style="color:var(--text-muted);font-size:0.9rem">No minor gaps!</p>'
            }
                </div>
            </div>
        ` : ''}

        <div class="glass-card animate-in" style="margin-bottom:24px">
            <h4 style="margin-bottom:20px">🎯 Required Skills Assessment</h4>
            ${(analysis.required_skills || []).map(s => `
                <div class="skill-bar">
                    <div class="skill-bar-header">
                        <span class="skill-name">${s.skill}</span>
                        <span style="display:flex;align-items:center;gap:8px">
                            <span class="tag tag-${s.importance === 'critical' ? 'red' : s.importance === 'important' ? 'amber' : 'green'}" style="font-size:0.7rem">${s.importance}</span>
                            <span class="skill-level">${s.current_level}/${s.target_level}</span>
                        </span>
                    </div>
                    <div class="skill-bar-track">
                        <div class="skill-bar-current" style="width:${(s.current_level / s.target_level) * 100}%;background:${App.getScoreColor(s.current_level)}"></div>
                        <div class="skill-bar-target" style="left:${(s.target_level / 100) * 100}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>

        ${analysis.roadmap?.length ? `
            <div class="glass-card animate-in" style="margin-bottom:24px">
                <h4 style="margin-bottom:20px">🗺️ Learning Roadmap</h4>
                ${analysis.roadmap.map((phase, i) => `
                    <div class="roadmap-phase glass-card phase-${phase.phase || (i + 1)}" style="margin-bottom:16px">
                        <div class="roadmap-phase-number" style="background:${['rgba(0,212,255,0.2)', 'rgba(139,92,246,0.2)', 'rgba(245,158,11,0.2)', 'rgba(16,185,129,0.2)'][i % 4]};color:${['var(--accent-cyan)', 'var(--accent-purple)', 'var(--accent-amber)', 'var(--accent-green)'][i % 4]}">
                            ${phase.phase || (i + 1)}
                        </div>
                        <h4 style="margin-bottom:4px">${phase.title}</h4>
                        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:12px">⏱️ ${phase.duration}</p>
                        
                        <div style="margin-bottom:12px">
                            <div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:6px">Skills to Build:</div>
                            <div style="display:flex;flex-wrap:wrap;gap:6px">
                                ${(phase.skills || []).map(s => `<span class="tag tag-cyan">${s}</span>`).join('')}
                            </div>
                        </div>

                        ${phase.resources?.length ? `
                            <div style="margin-bottom:12px">
                                <div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:6px">Resources:</div>
                                ${phase.resources.map(r => `
                                    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:0.85rem">
                                        <span>${r.type === 'course' ? '🎓' : r.type === 'book' ? '📖' : '💻'}</span>
                                        <a href="${r.url}" target="_blank" style="color:var(--accent-cyan);text-decoration:none">${r.name}</a>
                                        <span class="tag tag-${r.priority === 'high' ? 'red' : 'amber'}" style="font-size:0.65rem">${r.priority}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}

                        ${phase.milestones?.length ? `
                            <div>
                                <div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:6px">Milestones:</div>
                                ${phase.milestones.map(m => `
                                    <div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.85rem;color:var(--text-secondary)">
                                        <span>✓</span> ${m}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;

    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadSkillGapHistory() {
    const el = document.getElementById('skillgap-history');
    if (!el) return;

    try {
        const history = await API.getSkillGapHistory();
        if (!history?.length) {
            el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><h3>No analyses yet</h3><p>Run your first Role Based Analysis!</p></div>';
            return;
        }

        el.innerHTML = history.map(g => `
            <div class="glass-card" style="margin-bottom:12px;padding:16px 20px;cursor:pointer" onclick="viewSkillGap(${g.id})">
                <div style="display:flex;align-items:center;justify-content:space-between">
                    <div>
                        <div style="font-weight:600;font-size:0.9rem">${g.target_role}</div>
                        <div style="font-size:0.8rem;color:var(--text-muted)">${App.formatDate(g.created_at)}</div>
                    </div>
                    <span class="tag" style="background:${App.getScoreColor(g.overall_readiness)}20;color:${App.getScoreColor(g.overall_readiness)}">${Math.round(g.overall_readiness)}% Ready</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        el.innerHTML = '<div class="empty-state"><p>Failed to load history</p></div>';
    }
}

async function viewSkillGap(id) {
    try {
        App.showLoading('Loading analysis...');
        const result = await API.getSkillGapDetail(id);
        App.hideLoading();
        renderSkillGapAnalysis(result);
    } catch (err) {
        App.hideLoading();
        App.showToast(err.message, 'error');
    }
}

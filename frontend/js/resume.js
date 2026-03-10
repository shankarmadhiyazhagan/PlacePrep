let currentAnalysis = null;

document.addEventListener('DOMContentLoaded', () => {
    App.init('resume');
    setupUploadZone();
    loadResumeHistory();
});

function setupUploadZone() {
    const zone = document.getElementById('upload-zone');
    const input = document.getElementById('file-input');
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    input.addEventListener('change', () => {
        if (input.files.length) handleFile(input.files[0]);
    });
}

async function handleFile(file) {
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!file.name.match(/\.(pdf|txt|doc|docx)$/i)) {
        App.showToast('Please upload a PDF, TXT, DOC, or DOCX file', 'error');
        return;
    }

    const targetRole = document.getElementById('target-role')?.value || 'Software Engineer';

    // Show uploading state
    const zone = document.getElementById('upload-zone');
    zone.innerHTML = `
        <div class="spinner" style="margin:0 auto 16px"></div>
        <div class="upload-text">Analyzing ${file.name}...</div>
        <div class="upload-hint">Our AI is scanning your resume for ATS compatibility, keyword optimization, and more</div>
    `;

    try {
        const result = await API.uploadResume(file, targetRole);
        currentAnalysis = result;
        renderAnalysis(result);
        App.showToast(`Resume analyzed! +${result.xp_earned} XP`, 'xp');
        loadResumeHistory();

        // Reset upload zone
        zone.innerHTML = `
            <div class="upload-icon">📤</div>
            <div class="upload-text">Drop your resume here or click to browse</div>
            <div class="upload-hint">Supports PDF, TXT, DOC, DOCX • Max 10MB</div>
        `;
    } catch (err) {
        App.showToast(err.message, 'error');
        zone.innerHTML = `
            <div class="upload-icon">📤</div>
            <div class="upload-text">Drop your resume here or click to browse</div>
            <div class="upload-hint">Supports PDF, TXT, DOC, DOCX • Max 10MB</div>
        `;
    }
}

function renderAnalysis(result) {
    const el = document.getElementById('analysis-results');
    if (!el) return;

    const a = result.analysis;
    el.style.display = 'block';

    el.innerHTML = `
        <div class="glass-card animate-in" style="margin-bottom:24px">
            <h3 style="margin-bottom:20px">📊 Resume Analysis: ${result.filename}</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:20px;text-align:center">
                ${App.createScoreCircle(a.ats_score, 100, 'ATS Score')}
                ${App.createScoreCircle(a.overall_score, 100, 'Overall')}
                ${App.createScoreCircle(a.formatting_score || 70, 100, 'Formatting')}
                ${App.createScoreCircle(a.content_score || 65, 100, 'Content')}
                ${App.createScoreCircle(a.impact_score || 60, 100, 'Impact')}
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
            <div class="glass-card animate-in animate-delay-1">
                <h4 style="color:var(--accent-green);margin-bottom:16px">✅ Strengths</h4>
                ${(a.strengths || []).map(s => `
                    <div style="display:flex;gap:8px;margin-bottom:10px;font-size:0.9rem">
                        <span style="color:var(--accent-green)">•</span>
                        <span style="color:var(--text-secondary)">${s}</span>
                    </div>
                `).join('')}
            </div>
            <div class="glass-card animate-in animate-delay-2">
                <h4 style="color:var(--accent-red);margin-bottom:16px">⚠️ Weaknesses</h4>
                ${(a.weaknesses || []).map(w => `
                    <div style="display:flex;gap:8px;margin-bottom:10px;font-size:0.9rem">
                        <span style="color:var(--accent-red)">•</span>
                        <span style="color:var(--text-secondary)">${w}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="glass-card animate-in animate-delay-3" style="margin-bottom:24px">
            <h4 style="color:var(--accent-cyan);margin-bottom:16px">💡 Suggestions for Improvement</h4>
            ${(a.suggestions || []).map((s, i) => `
                <div style="display:flex;gap:12px;margin-bottom:12px;padding:12px;background:var(--bg-glass);border-radius:var(--radius-sm)">
                    <span style="color:var(--accent-cyan);font-weight:700;font-family:Outfit">${i + 1}</span>
                    <span style="color:var(--text-secondary);font-size:0.9rem">${s}</span>
                </div>
            `).join('')}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
            <div class="glass-card animate-in animate-delay-4">
                <h4 style="color:var(--accent-green);margin-bottom:16px">🔑 Keywords Found</h4>
                <div style="display:flex;flex-wrap:wrap;gap:8px">
                    ${(a.keywords_found || []).map(k => `<span class="tag tag-green">${k}</span>`).join('')}
                </div>
            </div>
            <div class="glass-card animate-in animate-delay-5">
                <h4 style="color:var(--accent-red);margin-bottom:16px">🔍 Missing Keywords</h4>
                <div style="display:flex;flex-wrap:wrap;gap:8px">
                    ${(a.keywords_missing || []).map(k => `<span class="tag tag-red">${k}</span>`).join('')}
                </div>
            </div>
        </div>

        ${a.section_analysis ? `
            <div class="glass-card animate-in">
                <h4 style="margin-bottom:20px">📋 Section-by-Section Analysis</h4>
                ${Object.entries(a.section_analysis).map(([section, data]) => `
                    <div class="skill-bar">
                        <div class="skill-bar-header">
                            <span class="skill-name">${section.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                            <span class="skill-level">${data.score}/100</span>
                        </div>
                        <div class="skill-bar-track">
                            <div class="skill-bar-current" style="width:${data.score}%;background:${App.getScoreColor(data.score)}"></div>
                        </div>
                        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">${data.feedback}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}

async function loadResumeHistory() {
    const el = document.getElementById('resume-history');
    if (!el) return;

    try {
        const history = await API.getResumeHistory();
        if (!history?.length) {
            el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📄</div><h3>No resumes yet</h3><p>Upload your first resume!</p></div>';
            return;
        }

        el.innerHTML = history.map(r => `
            <div class="glass-card" style="margin-bottom:12px;cursor:pointer;padding:16px 20px" onclick="viewResume(${r.id})">
                <div style="display:flex;align-items:center;justify-content:space-between">
                    <div style="display:flex;align-items:center;gap:12px">
                        <span style="font-size:1.5rem">📄</span>
                        <div>
                            <div style="font-weight:600;font-size:0.9rem">${r.filename}</div>
                            <div style="font-size:0.8rem;color:var(--text-muted)">${App.formatDate(r.uploaded_at)}</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px">
                        <span class="tag" style="background:${App.getScoreColor(r.ats_score)}20;color:${App.getScoreColor(r.ats_score)}">ATS: ${Math.round(r.ats_score)}</span>
                        <span class="tag" style="background:${App.getScoreColor(r.overall_score)}20;color:${App.getScoreColor(r.overall_score)}">Score: ${Math.round(r.overall_score)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        el.innerHTML = '<div class="empty-state"><p>Failed to load history</p></div>';
    }
}

async function viewResume(id) {
    try {
        App.showLoading('Loading analysis...');
        const result = await API.getResumeDetail(id);
        App.hideLoading();
        renderAnalysis({ filename: result.filename, analysis: result.analysis || result });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        App.hideLoading();
        App.showToast(err.message, 'error');
    }
}

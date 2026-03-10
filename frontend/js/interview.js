let currentSession = null;
let timerInterval = null;
let totalSeconds = 0;

document.addEventListener('DOMContentLoaded', () => {
    App.init('interview');
    document.getElementById('interview-form')?.addEventListener('submit', startInterview);
    loadInterviewHistory();
});

async function startInterview(e) {
    e.preventDefault();
    const role = document.getElementById('int-role').value;
    const company = document.getElementById('int-company').value || 'General';
    const difficulty = document.getElementById('int-difficulty').value;
    const category = document.getElementById('int-category').value;
    const numQuestions = parseInt(document.getElementById('int-num').value) || 5;

    App.showLoading('Generating interview questions...');

    try {
        const data = await API.generateInterview({
            role, company, difficulty, category, num_questions: numQuestions
        });
        App.hideLoading();
        currentSession = data;
        totalSeconds = 0;
        renderQuestions(data.questions);
        startTimer();
        document.getElementById('setup-section').style.display = 'none';
        document.getElementById('questions-section').style.display = 'block';
        document.getElementById('questions-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
        App.hideLoading();
        App.showToast(err.message, 'error');
    }
}

function renderQuestions(questions) {
    const el = document.getElementById('questions-container');
    if (!el) return;

    el.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px">
            <div>
                <h2>${currentSession.role} Interview</h2>
                <p style="color:var(--text-secondary)">${currentSession.company} • ${currentSession.difficulty} • ${currentSession.category}</p>
            </div>
            <div style="display:flex;align-items:center;gap:16px">
                <div id="global-timer" class="question-timer" style="font-size:1.1rem;padding:8px 16px;background:var(--bg-glass);border-radius:var(--radius-md)">
                    ⏱️ 00:00
                </div>
            </div>
        </div>

        ${questions.map((q, i) => `
            <div class="question-card glass-card animate-in" style="animation-delay:${i * 0.1}s">
                <div class="question-header">
                    <span class="question-number">Question ${q.id} of ${questions.length}</span>
                    <div style="display:flex;align-items:center;gap:8px">
                        <span class="tag tag-${q.difficulty === 'hard' ? 'red' : q.difficulty === 'medium' ? 'amber' : 'green'}">${q.difficulty}</span>
                        <button class="btn btn-sm btn-secondary" onclick="toggleHint(${i})" style="font-size:0.8rem">💡 Hint</button>
                    </div>
                </div>
                <div class="question-text">${q.question}</div>
                <div class="question-hint" id="hint-${i}">
                    💡 <strong>Hint:</strong> ${q.hint || 'Think about the key concepts involved'}
                </div>
                <div class="form-group" style="margin-bottom:0">
                    <textarea class="form-textarea answer-input" id="answer-${i}" 
                        placeholder="Type your answer here... Be detailed and include specific examples"
                        rows="4"></textarea>
                </div>
            </div>
        `).join('')}

        <div style="display:flex;gap:16px;justify-content:center;margin-top:24px">
            <button class="btn btn-secondary btn-lg" onclick="resetInterview()">✕ Cancel</button>
            <button class="btn btn-primary btn-lg" onclick="submitAnswers()">🚀 Submit Answers</button>
        </div>
    `;
}

function toggleHint(index) {
    const hint = document.getElementById(`hint-${index}`);
    if (hint) hint.style.display = hint.style.display === 'block' ? 'none' : 'block';
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        totalSeconds++;
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        const el = document.getElementById('global-timer');
        if (el) el.textContent = `⏱️ ${mins}:${secs}`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

async function submitAnswers() {
    if (!currentSession) return;

    const answers = [];
    const inputs = document.querySelectorAll('.answer-input');
    let hasEmpty = false;

    inputs.forEach((input, i) => {
        const val = input.value.trim();
        if (!val) hasEmpty = true;
        answers.push(val || '(No answer provided)');
    });

    if (hasEmpty && !confirm('Some answers are empty. Submit anyway?')) return;

    stopTimer();
    App.showLoading('AI is evaluating your answers...');

    try {
        const result = await API.evaluateInterview({
            session_id: currentSession.session_id,
            answers: answers,
            time_taken_seconds: totalSeconds
        });
        App.hideLoading();
        renderEvaluation(result);
        App.showToast(`Interview scored! +${result.xp_earned} XP`, 'xp');
        loadInterviewHistory();
    } catch (err) {
        App.hideLoading();
        App.showToast(err.message, 'error');
    }
}

function renderEvaluation(result) {
    const el = document.getElementById('questions-container');
    if (!el) return;

    const ev = result.evaluation;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    el.innerHTML = `
        <div class="glass-card animate-in" style="margin-bottom:24px">
            <h3 style="margin-bottom:4px">🎯 Interview Results</h3>
            <p style="color:var(--text-muted);font-size:0.9rem">Completed in ${mins}m ${secs}s</p>
            
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:20px;margin-top:24px;text-align:center">
                ${App.createScoreCircle(ev.overall_score, 100, 'Overall Score')}
                ${App.createScoreCircle(ev.communication_score || 0, 100, 'Communication')}
                ${App.createScoreCircle(ev.technical_depth_score || 0, 100, 'Technical Depth')}
                ${App.createScoreCircle(ev.confidence_score || 0, 100, 'Confidence')}
            </div>

            <div style="margin-top:20px;padding:16px;background:var(--bg-glass);border-radius:var(--radius-md)">
                <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.7">${ev.overall_feedback}</p>
            </div>
        </div>

        <h3 style="margin-bottom:16px">Question-by-Question Evaluation</h3>
        ${(ev.evaluations || []).map((evaluation, i) => {
        const q = currentSession.questions[i];
        return `
                <div class="eval-card glass-card animate-in" style="animation-delay:${i * 0.1}s;border-color:${App.getScoreColor(evaluation.score)}">
                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
                        <div style="font-weight:600;flex:1">Q${i + 1}: ${q?.question || ''}</div>
                        <div class="eval-score" style="color:${App.getScoreColor(evaluation.score)}">${evaluation.score}/100</div>
                    </div>
                    <div class="eval-feedback">${evaluation.feedback}</div>
                    <div class="eval-tags">
                        ${(evaluation.strengths || []).map(s => `<span class="tag tag-green">${s}</span>`).join('')}
                        ${(evaluation.improvements || []).map(s => `<span class="tag tag-amber">${s}</span>`).join('')}
                    </div>
                </div>
            `;
    }).join('')}

        <div style="text-align:center;margin-top:24px">
            <button class="btn btn-primary btn-lg" onclick="resetInterview()">🔄 Practice Again</button>
        </div>
    `;
}

function resetInterview() {
    stopTimer();
    totalSeconds = 0;
    currentSession = null;
    document.getElementById('setup-section').style.display = 'block';
    document.getElementById('questions-section').style.display = 'none';
    document.getElementById('questions-container').innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadInterviewHistory() {
    const el = document.getElementById('interview-history');
    if (!el) return;

    try {
        const history = await API.getInterviewHistory();
        if (!history?.length) {
            el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎤</div><h3>No interviews yet</h3><p>Start your first mock interview!</p></div>';
            return;
        }

        el.innerHTML = history.map(s => `
            <div class="glass-card" style="margin-bottom:12px;padding:16px 20px;cursor:pointer" onclick="viewInterviewSession(${s.id})">
                <div style="display:flex;align-items:center;justify-content:space-between">
                    <div>
                        <div style="font-weight:600;font-size:0.9rem">${s.role} - ${s.company}</div>
                        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">${s.category} • ${s.difficulty} • ${App.formatDate(s.created_at)}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        ${s.status === 'completed' ? `
                            <span class="tag" style="background:${App.getScoreColor(s.overall_score)}20;color:${App.getScoreColor(s.overall_score)}">${Math.round(s.overall_score)}/100</span>
                        ` : `<span class="tag tag-amber">In Progress</span>`}
                        <span style="color:var(--text-muted);font-size:1rem">›</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        el.innerHTML = '<div class="empty-state"><p>Failed to load history</p></div>';
    }
}

async function viewInterviewSession(id) {
    try {
        App.showLoading('Loading session details...');
        const session = await API.getInterviewDetail(id);
        App.hideLoading();
        renderSessionDetail(session);
        document.getElementById('setup-section').style.display = 'none';
        document.getElementById('questions-section').style.display = 'block';
        document.getElementById('questions-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
        App.hideLoading();
        App.showToast(err.message, 'error');
    }
}

function renderSessionDetail(session) {
    const el = document.getElementById('questions-container');
    if (!el) return;

    const ev = session.evaluations || {};
    const questions = session.questions || [];
    const answers = session.answers || [];
    const timeSecs = session.time_taken_seconds || 0;
    const mins = Math.floor(timeSecs / 60);
    const secs = timeSecs % 60;

    el.innerHTML = `
        <div class="glass-card animate-in" style="margin-bottom:24px">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
                <div>
                    <h3 style="margin-bottom:4px">🎯 ${session.role} Interview Results</h3>
                    <p style="color:var(--text-muted);font-size:0.85rem">${session.company} • ${session.category} • ${session.difficulty} • Completed in ${mins}m ${secs}s</p>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:20px;text-align:center">
                ${App.createScoreCircle(ev.overall_score || 0, 100, 'Overall Score')}
                ${App.createScoreCircle(ev.communication_score || 0, 100, 'Communication')}
                ${App.createScoreCircle(ev.technical_depth_score || 0, 100, 'Technical Depth')}
                ${App.createScoreCircle(ev.confidence_score || 0, 100, 'Confidence')}
            </div>

            ${ev.overall_feedback ? `
                <div style="margin-top:20px;padding:16px;background:var(--bg-glass);border-radius:var(--radius-md)">
                    <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.7">${ev.overall_feedback}</p>
                </div>
            ` : ''}
        </div>

        <h3 style="margin-bottom:16px">Question-by-Question Breakdown</h3>
        ${questions.map((q, i) => {
        const evaluation = (ev.evaluations || [])[i] || {};
        const answer = answers[i] || '(No answer recorded)';
        return `
                <div class="eval-card glass-card animate-in" style="animation-delay:${i * 0.1}s;border-color:${App.getScoreColor(evaluation.score || 0)}">
                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
                        <div style="font-weight:600;flex:1">Q${i + 1}: ${q.question}</div>
                        <div class="eval-score" style="color:${App.getScoreColor(evaluation.score || 0)}">${evaluation.score || 0}/100</div>
                    </div>
                    <div style="padding:10px 14px;background:rgba(255,255,255,0.04);border-radius:var(--radius-sm);margin-bottom:12px;font-size:0.88rem;color:var(--text-muted);line-height:1.6">
                        <strong style="color:var(--text-secondary)">Your answer:</strong> ${answer}
                    </div>
                    ${evaluation.feedback ? `<div class="eval-feedback">${evaluation.feedback}</div>` : ''}
                    <div class="eval-tags">
                        ${(evaluation.strengths || []).map(s => `<span class="tag tag-green">${s}</span>`).join('')}
                        ${(evaluation.improvements || []).map(s => `<span class="tag tag-amber">${s}</span>`).join('')}
                    </div>
                </div>
            `;
    }).join('')}

        <div style="text-align:center;margin-top:24px">
            <button class="btn btn-primary btn-lg" onclick="resetInterview()">🔄 New Interview</button>
        </div>
    `;
}

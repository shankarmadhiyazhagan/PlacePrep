const API_BASE = window.location.origin;

class API {
    static getToken() {
        return localStorage.getItem('placeprep_token');
    }

    static setToken(token) {
        localStorage.setItem('placeprep_token', token);
    }

    static setUser(user) {
        localStorage.setItem('placeprep_user', JSON.stringify(user));
    }

    static getUser() {
        try {
            return JSON.parse(localStorage.getItem('placeprep_user'));
        } catch { return null; }
    }

    static clearAuth() {
        localStorage.removeItem('placeprep_token');
        localStorage.removeItem('placeprep_user');
    }

    static isLoggedIn() {
        return !!this.getToken();
    }

    static async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const headers = options.headers || {};

        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (response.status === 401) {
                this.clearAuth();
                window.location.href = '/login.html';
                return null;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Request failed');
            }

            return data;
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Network error. Please check your connection.');
            }
            throw error;
        }
    }

    static get(endpoint) {
        return this.request(endpoint);
    }

    static post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    static patch(endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    }

    static delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    static upload(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {}
        });
    }

    // Auth
    static register(data) { return this.post('/api/auth/register', data); }
    static login(data) { return this.post('/api/auth/login', data); }
    static getMe() { return this.get('/api/auth/me'); }

    // Resume
    static uploadResume(file, targetRole) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_role', targetRole);
        return this.upload('/api/resume/upload', formData);
    }
    static getResumeHistory() { return this.get('/api/resume/history'); }
    static getResumeDetail(id) { return this.get(`/api/resume/${id}`); }

    // Interview
    static generateInterview(data) { return this.post('/api/interview/generate', data); }
    static evaluateInterview(data) { return this.post('/api/interview/evaluate', data); }
    static getInterviewHistory() { return this.get('/api/interview/history'); }
    static getInterviewDetail(id) { return this.get(`/api/interview/${id}`); }

    // Skill Gap
    static analyzeSkillGap(data) { return this.post('/api/skillgap/analyze', data); }
    static getSkillGapHistory() { return this.get('/api/skillgap/history'); }
    static getSkillGapDetail(id) { return this.get(`/api/skillgap/${id}`); }

    // Progress
    static getDashboard() { return this.get('/api/progress/dashboard'); }
    static getActivities() { return this.get('/api/progress/activities'); }
    static getStudyPlans() { return this.get('/api/progress/study-plans'); }
    static createStudyPlan(data) { return this.post('/api/progress/study-plans', data); }
    static updateStudyPlan(id, data) { return this.patch(`/api/progress/study-plans/${id}`, data); }
    static deleteStudyPlan(id) { return this.delete(`/api/progress/study-plans/${id}`); }
}

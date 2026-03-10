# 🚀 PlacePrep — AI-Powered Placement Preparation Platform

PlacePrep is a full-stack web application that helps students and job seekers prepare for placements using AI. It offers mock interviews with AI evaluation, role-based skill gap analysis, resume analysis, and a study planner with activity tracking.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎤 **Mock Interview** | Generate role-specific interview questions and get per-answer AI feedback with scores |
| 📊 **Role Based Analyzer** | Analyze your skill gaps for any target role and get a personalized learning roadmap |
| 📄 **Resume Analysis** | Upload your resume (PDF) and get AI-powered feedback and skill extraction |
| 📈 **Analysis Dashboard** | Track study plans, activity timeline, XP progress, and streaks |
| 🏆 **XP & Levels** | Earn XP for every action — interviews, analyses, and uploads |

---

## 🛠️ Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — REST API framework
- [SQLAlchemy](https://www.sqlalchemy.org/) + SQLite — ORM & database
- [Google Gemini AI](https://ai.google.dev/) — AI-powered analysis and evaluation
- [PyPDF2](https://pypdf2.readthedocs.io/) — Resume PDF parsing
- JWT Authentication via `python-jose` + `passlib`

**Frontend**
- Vanilla HTML, CSS, JavaScript (no frameworks)
- Custom glassmorphism design system
- Served directly by FastAPI as static files

---

## 📁 Project Structure

```
shankar2.o/
├── backend/
│   ├── main.py              # FastAPI app entry point + static file serving
│   ├── models.py            # SQLAlchemy database models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── auth.py              # JWT authentication
│   ├── database.py          # DB connection & session
│   ├── ai_service.py        # Gemini AI integration
│   ├── requirements.txt
│   └── routes/
│       ├── auth_routes.py
│       ├── interview_routes.py
│       ├── resume_routes.py
│       ├── skillgap_routes.py
│       └── progress_routes.py
└── frontend/
    ├── index.html           # Landing page
    ├── login.html           # Login / Register
    ├── dashboard.html       # User dashboard
    ├── interview.html       # Mock interview
    ├── skillgap.html        # Role Based Analyzer
    ├── resume.html          # Resume upload & analysis
    ├── progress.html        # Analysis & study planner
    ├── css/styles.css
    └── js/
        ├── api.js           # Centralized API client
        ├── app.js           # Shared utilities
        ├── dashboard.js
        ├── interview.js
        ├── skillgap.js
        ├── resume.js
        └── progress.js
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.10+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/placeprep.git
cd placeprep
```

### 2. Set up the backend
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure environment variables
Create a `.env` file inside the `backend/` folder:
```env
SECRET_KEY=your_jwt_secret_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 4. Run the server
```bash
# From inside the backend/ folder with venv active
uvicorn main:app --reload
```

The app will be available at:
- **App:** [http://localhost:8000](http://localhost:8000)
- **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| POST | `/api/interview/generate` | Generate interview questions |
| POST | `/api/interview/evaluate` | Submit answers for AI evaluation |
| GET | `/api/interview/history` | Get past interview sessions |
| GET | `/api/interview/{id}` | Get session detail |
| POST | `/api/skillgap/analyze` | Run role-based skill gap analysis |
| GET | `/api/skillgap/history` | Get past analyses |
| POST | `/api/resume/upload` | Upload and analyze a resume |
| GET | `/api/progress/dashboard` | Get XP, level, and activity data |

---

## 📸 Pages

- **Landing Page** — Feature overview and call-to-action
- **Dashboard** — XP level, interview score trend chart, recent activity
- **Mock Interview** — Configure session → answer questions → get AI scored results
- **Role Based Analyzer** — Input skills → get gap analysis, skill bars, and learning roadmap
- **Resume** — Upload PDF → get AI feedback and extracted skills
- **Analysis** — Study planner tasks + full activity timeline

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

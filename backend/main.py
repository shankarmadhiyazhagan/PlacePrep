from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import engine, Base
from routes import auth_routes, resume_routes, interview_routes, skillgap_routes, progress_routes
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PlacePrep API",
    description="AI-Powered Placement Preparation Platform",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(resume_routes.router)
app.include_router(interview_routes.router)
app.include_router(skillgap_routes.router)
app.include_router(progress_routes.router)

# Serve frontend
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

if os.path.exists(FRONTEND_DIR):
    app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_DIR, "css")), name="css")
    app.mount("/js", StaticFiles(directory=os.path.join(FRONTEND_DIR, "js")), name="js")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

    @app.get("/login")
    @app.get("/login.html")
    async def serve_login():
        return FileResponse(os.path.join(FRONTEND_DIR, "login.html"))

    @app.get("/dashboard")
    @app.get("/dashboard.html")
    async def serve_dashboard():
        return FileResponse(os.path.join(FRONTEND_DIR, "dashboard.html"))

    @app.get("/resume")
    @app.get("/resume.html")
    async def serve_resume():
        return FileResponse(os.path.join(FRONTEND_DIR, "resume.html"))

    @app.get("/interview")
    @app.get("/interview.html")
    async def serve_interview():
        return FileResponse(os.path.join(FRONTEND_DIR, "interview.html"))

    @app.get("/skillgap")
    @app.get("/skillgap.html")
    async def serve_skillgap():
        return FileResponse(os.path.join(FRONTEND_DIR, "skillgap.html"))

    @app.get("/progress")
    @app.get("/progress.html")
    async def serve_progress():
        return FileResponse(os.path.join(FRONTEND_DIR, "progress.html"))


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "app": "PlacePrep", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

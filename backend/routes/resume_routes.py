from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import json
import os
import shutil
from datetime import datetime

router = APIRouter(prefix="/api/resume", tags=["Resume"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def extract_text_from_pdf(file_path: str) -> str:
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        return f"Error extracting text: {str(e)}"


def extract_text_from_file(file_path: str, filename: str) -> str:
    ext = filename.lower().split('.')[-1]
    if ext == 'pdf':
        return extract_text_from_pdf(file_path)
    elif ext in ['txt', 'text']:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    return "Unsupported file format"


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    target_role: str = Form(default="Software Engineer"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    allowed = ['pdf', 'txt', 'doc', 'docx']
    ext = file.filename.lower().split('.')[-1]
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type not supported. Allowed: {', '.join(allowed)}")

    # Save file
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_name = f"{current_user.id}_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    file_size = len(content)

    # Extract text
    resume_text = extract_text_from_file(file_path, file.filename)

    # AI Analysis
    from ai_service import analyze_resume
    analysis = analyze_resume(resume_text, target_role)

    # Save to DB
    resume = models.Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        ats_score=analysis.get("ats_score", 0),
        overall_score=analysis.get("overall_score", 0),
        analysis_json=json.dumps(analysis),
        strengths=json.dumps(analysis.get("strengths", [])),
        weaknesses=json.dumps(analysis.get("weaknesses", [])),
        suggestions=json.dumps(analysis.get("suggestions", [])),
        keywords_found=json.dumps(analysis.get("keywords_found", [])),
        keywords_missing=json.dumps(analysis.get("keywords_missing", []))
    )
    db.add(resume)

    # Award XP
    xp_earned = 100
    current_user.xp += xp_earned
    current_user.level = (current_user.xp // 500) + 1

    activity = models.Activity(
        user_id=current_user.id,
        activity_type="resume_upload",
        title=f"Uploaded resume: {file.filename}",
        description=f"ATS Score: {analysis.get('ats_score', 0)}/100 | Overall: {analysis.get('overall_score', 0)}/100",
        xp_earned=xp_earned
    )
    db.add(activity)
    db.commit()
    db.refresh(resume)

    return {
        "id": resume.id,
        "filename": resume.filename,
        "file_size": file_size,
        "analysis": analysis,
        "xp_earned": xp_earned,
        "uploaded_at": resume.uploaded_at.isoformat()
    }


@router.get("/history")
def get_resume_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resumes = db.query(models.Resume).filter(
        models.Resume.user_id == current_user.id
    ).order_by(models.Resume.uploaded_at.desc()).all()

    return [{
        "id": r.id,
        "filename": r.filename,
        "file_size": r.file_size,
        "ats_score": r.ats_score,
        "overall_score": r.overall_score,
        "uploaded_at": r.uploaded_at.isoformat()
    } for r in resumes]


@router.get("/{resume_id}")
def get_resume_detail(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return {
        "id": resume.id,
        "filename": resume.filename,
        "file_size": resume.file_size,
        "ats_score": resume.ats_score,
        "overall_score": resume.overall_score,
        "analysis": json.loads(resume.analysis_json),
        "strengths": json.loads(resume.strengths),
        "weaknesses": json.loads(resume.weaknesses),
        "suggestions": json.loads(resume.suggestions),
        "keywords_found": json.loads(resume.keywords_found),
        "keywords_missing": json.loads(resume.keywords_missing),
        "uploaded_at": resume.uploaded_at.isoformat()
    }

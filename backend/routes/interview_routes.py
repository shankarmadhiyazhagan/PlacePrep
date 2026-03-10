from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from schemas import InterviewGenRequest, InterviewAnswerSubmit
import models
import json
from datetime import datetime

router = APIRouter(prefix="/api/interview", tags=["Interview"])


@router.post("/generate")
def generate_questions(
    req: InterviewGenRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from ai_service import generate_interview_questions
    questions = generate_interview_questions(
        role=req.role,
        company=req.company,
        difficulty=req.difficulty,
        category=req.category,
        num_questions=req.num_questions
    )

    session = models.InterviewSession(
        user_id=current_user.id,
        role=req.role,
        company=req.company,
        difficulty=req.difficulty,
        category=req.category,
        questions_json=json.dumps(questions),
        total_questions=len(questions),
        status="in_progress"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "role": session.role,
        "company": session.company,
        "difficulty": session.difficulty,
        "category": session.category,
        "questions": questions,
        "total_questions": len(questions)
    }


@router.post("/evaluate")
def evaluate_answers(
    req: InterviewAnswerSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == req.session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    questions = json.loads(session.questions_json)

    from ai_service import evaluate_interview_answers
    evaluation = evaluate_interview_answers(questions, req.answers)

    session.answers_json = json.dumps(req.answers)
    session.evaluations_json = json.dumps(evaluation)
    session.overall_score = evaluation.get("overall_score", 0)
    session.answered_questions = len(req.answers)
    session.time_taken_seconds = req.time_taken_seconds
    session.status = "completed"
    session.completed_at = datetime.utcnow()

    # Award XP
    base_xp = 75
    bonus_xp = int(evaluation.get("overall_score", 0) * 0.5)
    xp_earned = base_xp + bonus_xp
    current_user.xp += xp_earned
    current_user.level = (current_user.xp // 500) + 1

    activity = models.Activity(
        user_id=current_user.id,
        activity_type="interview_practice",
        title=f"Completed {session.category} interview for {session.role}",
        description=f"Score: {evaluation.get('overall_score', 0)}/100 | Questions: {len(req.answers)}/{session.total_questions}",
        xp_earned=xp_earned
    )
    db.add(activity)
    db.commit()

    return {
        "session_id": session.id,
        "evaluation": evaluation,
        "xp_earned": xp_earned,
        "completed_at": session.completed_at.isoformat()
    }


@router.get("/history")
def get_interview_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sessions = db.query(models.InterviewSession).filter(
        models.InterviewSession.user_id == current_user.id
    ).order_by(models.InterviewSession.created_at.desc()).limit(20).all()

    return [{
        "id": s.id,
        "role": s.role,
        "company": s.company,
        "difficulty": s.difficulty,
        "category": s.category,
        "overall_score": s.overall_score,
        "total_questions": s.total_questions,
        "answered_questions": s.answered_questions,
        "time_taken_seconds": s.time_taken_seconds,
        "status": s.status,
        "created_at": s.created_at.isoformat(),
        "completed_at": s.completed_at.isoformat() if s.completed_at else None
    } for s in sessions]


@router.get("/{session_id}")
def get_session_detail(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": session.id,
        "role": session.role,
        "company": session.company,
        "difficulty": session.difficulty,
        "category": session.category,
        "questions": json.loads(session.questions_json),
        "answers": json.loads(session.answers_json) if session.answers_json else [],
        "evaluations": json.loads(session.evaluations_json) if session.evaluations_json else {},
        "overall_score": session.overall_score,
        "total_questions": session.total_questions,
        "answered_questions": session.answered_questions,
        "time_taken_seconds": session.time_taken_seconds,
        "status": session.status,
        "created_at": session.created_at.isoformat(),
        "completed_at": session.completed_at.isoformat() if session.completed_at else None
    }

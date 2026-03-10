from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from auth import get_current_user
from schemas import StudyPlanCreate, StudyPlanUpdate
import models
import json
from datetime import datetime

router = APIRouter(prefix="/api/progress", tags=["Progress & Study Plan"])


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Aggregate stats
    total_resumes = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).count()
    total_interviews = db.query(models.InterviewSession).filter(
        models.InterviewSession.user_id == current_user.id,
        models.InterviewSession.status == "completed"
    ).count()
    total_skill_analyses = db.query(models.SkillGap).filter(models.SkillGap.user_id == current_user.id).count()

    # Average scores
    avg_resume_score = db.query(func.avg(models.Resume.overall_score)).filter(
        models.Resume.user_id == current_user.id
    ).scalar() or 0

    avg_interview_score = db.query(func.avg(models.InterviewSession.overall_score)).filter(
        models.InterviewSession.user_id == current_user.id,
        models.InterviewSession.status == "completed"
    ).scalar() or 0

    latest_readiness = db.query(models.SkillGap.overall_readiness).filter(
        models.SkillGap.user_id == current_user.id
    ).order_by(models.SkillGap.created_at.desc()).first()

    # Recent activities
    activities = db.query(models.Activity).filter(
        models.Activity.user_id == current_user.id
    ).order_by(models.Activity.created_at.desc()).limit(10).all()

    # Interview score trend (last 10)
    interview_scores = db.query(
        models.InterviewSession.overall_score,
        models.InterviewSession.created_at
    ).filter(
        models.InterviewSession.user_id == current_user.id,
        models.InterviewSession.status == "completed"
    ).order_by(models.InterviewSession.created_at.desc()).limit(10).all()

    # Study plan stats
    pending_tasks = db.query(models.StudyPlan).filter(
        models.StudyPlan.user_id == current_user.id,
        models.StudyPlan.status == "pending"
    ).count()
    completed_tasks = db.query(models.StudyPlan).filter(
        models.StudyPlan.user_id == current_user.id,
        models.StudyPlan.status == "completed"
    ).count()

    # Total XP earned
    total_xp_earned = db.query(func.sum(models.Activity.xp_earned)).filter(
        models.Activity.user_id == current_user.id
    ).scalar() or 0

    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "avatar_color": current_user.avatar_color,
            "target_role": current_user.target_role,
            "xp": current_user.xp,
            "level": current_user.level,
            "streak_days": current_user.streak_days,
            "xp_to_next_level": 500 - (current_user.xp % 500)
        },
        "stats": {
            "total_resumes": total_resumes,
            "total_interviews": total_interviews,
            "total_skill_analyses": total_skill_analyses,
            "avg_resume_score": round(avg_resume_score, 1),
            "avg_interview_score": round(avg_interview_score, 1),
            "placement_readiness": round(latest_readiness[0], 1) if latest_readiness else 0,
            "total_xp_earned": total_xp_earned,
            "pending_tasks": pending_tasks,
            "completed_tasks": completed_tasks
        },
        "interview_trend": [
            {"score": s.overall_score, "date": s.created_at.isoformat()}
            for s in reversed(interview_scores)
        ],
        "recent_activities": [
            {
                "id": a.id,
                "type": a.activity_type,
                "title": a.title,
                "description": a.description,
                "xp_earned": a.xp_earned,
                "created_at": a.created_at.isoformat()
            }
            for a in activities
        ]
    }


@router.get("/activities")
def get_activities(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    activities = db.query(models.Activity).filter(
        models.Activity.user_id == current_user.id
    ).order_by(models.Activity.created_at.desc()).limit(50).all()

    return [{
        "id": a.id,
        "type": a.activity_type,
        "title": a.title,
        "description": a.description,
        "xp_earned": a.xp_earned,
        "created_at": a.created_at.isoformat()
    } for a in activities]


# Study Plan CRUD
@router.get("/study-plans")
def get_study_plans(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plans = db.query(models.StudyPlan).filter(
        models.StudyPlan.user_id == current_user.id
    ).order_by(models.StudyPlan.created_at.desc()).all()

    return [{
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "category": p.category,
        "priority": p.priority,
        "status": p.status,
        "due_date": p.due_date.isoformat() if p.due_date else None,
        "completed_at": p.completed_at.isoformat() if p.completed_at else None,
        "created_at": p.created_at.isoformat()
    } for p in plans]


@router.post("/study-plans")
def create_study_plan(
    plan: StudyPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    due_date = None
    if plan.due_date:
        try:
            due_date = datetime.fromisoformat(plan.due_date)
        except:
            pass

    new_plan = models.StudyPlan(
        user_id=current_user.id,
        title=plan.title,
        description=plan.description,
        category=plan.category,
        priority=plan.priority,
        due_date=due_date
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    return {
        "id": new_plan.id,
        "title": new_plan.title,
        "status": new_plan.status,
        "created_at": new_plan.created_at.isoformat()
    }


@router.patch("/study-plans/{plan_id}")
def update_study_plan(
    plan_id: int,
    update: StudyPlanUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.id == plan_id,
        models.StudyPlan.user_id == current_user.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")

    if update.status:
        plan.status = update.status
        if update.status == "completed":
            plan.completed_at = datetime.utcnow()
            # Award XP
            xp_earned = 30
            current_user.xp += xp_earned
            current_user.level = (current_user.xp // 500) + 1
            activity = models.Activity(
                user_id=current_user.id,
                activity_type="study_plan",
                title=f"Completed: {plan.title}",
                description="Study plan task completed",
                xp_earned=xp_earned
            )
            db.add(activity)
    if update.title:
        plan.title = update.title
    if update.description:
        plan.description = update.description
    if update.priority:
        plan.priority = update.priority

    db.commit()
    return {"message": "Updated", "status": plan.status}


@router.delete("/study-plans/{plan_id}")
def delete_study_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.id == plan_id,
        models.StudyPlan.user_id == current_user.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")

    db.delete(plan)
    db.commit()
    return {"message": "Deleted"}

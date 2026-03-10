from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from schemas import SkillGapRequest
import models
import json

router = APIRouter(prefix="/api/skillgap", tags=["Role Based Analyzer"])


@router.post("/analyze")
def analyze_skills(
    req: SkillGapRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from ai_service import analyze_skill_gap
    analysis = analyze_skill_gap(
        target_role=req.target_role,
        current_skills=req.current_skills,
        experience_level=req.experience_level
    )

    skill_gap = models.SkillGap(
        user_id=current_user.id,
        target_role=req.target_role,
        current_skills=json.dumps(req.current_skills),
        required_skills=json.dumps(analysis.get("required_skills", [])),
        gap_analysis_json=json.dumps(analysis.get("gap_analysis", {})),
        roadmap_json=json.dumps(analysis.get("roadmap", [])),
        proficiency_scores=json.dumps(analysis.get("current_skills_assessment", [])),
        resources_json=json.dumps([]),
        overall_readiness=analysis.get("overall_readiness", 0)
    )
    db.add(skill_gap)

    # Award XP
    xp_earned = 60
    current_user.xp += xp_earned
    current_user.level = (current_user.xp // 500) + 1

    activity = models.Activity(
        user_id=current_user.id,
        activity_type="skill_analysis",
        title=f"Role Based Analysis for {req.target_role}",
        description=f"Overall readiness: {analysis.get('overall_readiness', 0)}% | Skills analyzed: {len(req.current_skills)}",
        xp_earned=xp_earned
    )
    db.add(activity)
    db.commit()
    db.refresh(skill_gap)

    return {
        "id": skill_gap.id,
        "analysis": analysis,
        "xp_earned": xp_earned
    }


@router.get("/history")
def get_skill_gap_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    gaps = db.query(models.SkillGap).filter(
        models.SkillGap.user_id == current_user.id
    ).order_by(models.SkillGap.created_at.desc()).limit(10).all()

    return [{
        "id": g.id,
        "target_role": g.target_role,
        "overall_readiness": g.overall_readiness,
        "created_at": g.created_at.isoformat()
    } for g in gaps]


@router.get("/{gap_id}")
def get_skill_gap_detail(
    gap_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    gap = db.query(models.SkillGap).filter(
        models.SkillGap.id == gap_id,
        models.SkillGap.user_id == current_user.id
    ).first()

    if not gap:
        raise HTTPException(status_code=404, detail="Role Based Analysis not found")

    return {
        "id": gap.id,
        "target_role": gap.target_role,
        "overall_readiness": gap.overall_readiness,
        "current_skills": json.loads(gap.current_skills),
        "required_skills": json.loads(gap.required_skills),
        "gap_analysis": json.loads(gap.gap_analysis_json),
        "roadmap": json.loads(gap.roadmap_json),
        "proficiency_scores": json.loads(gap.proficiency_scores),
        "created_at": gap.created_at.isoformat()
    }

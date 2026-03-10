from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    target_role: Optional[str] = "Software Engineer"


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    avatar_color: str
    target_role: str
    xp: int
    level: int
    streak_days: int
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class ResumeAnalysis(BaseModel):
    ats_score: float
    overall_score: float
    strengths: list
    weaknesses: list
    suggestions: list
    keywords_found: list
    keywords_missing: list
    formatting_score: float
    content_score: float
    impact_score: float
    section_analysis: dict


class InterviewGenRequest(BaseModel):
    role: str
    company: Optional[str] = "General"
    difficulty: Optional[str] = "medium"
    category: Optional[str] = "technical"
    num_questions: Optional[int] = 5


class InterviewAnswerSubmit(BaseModel):
    session_id: int
    answers: list
    time_taken_seconds: Optional[int] = 0


class SkillGapRequest(BaseModel):
    target_role: str
    current_skills: list
    experience_level: Optional[str] = "fresher"


class StudyPlanCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "general"
    priority: Optional[str] = "medium"
    due_date: Optional[str] = None


class StudyPlanUpdate(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None


class ActivityLog(BaseModel):
    activity_type: str
    title: str
    description: Optional[str] = ""
    xp_earned: Optional[int] = 0

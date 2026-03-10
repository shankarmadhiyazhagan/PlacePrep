from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar_color = Column(String(7), default="#00d4ff")
    target_role = Column(String(100), default="Software Engineer")
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak_days = Column(Integer, default=0)
    last_active = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    resumes = relationship("Resume", back_populates="user")
    interviews = relationship("InterviewSession", back_populates="user")
    skill_gaps = relationship("SkillGap", back_populates="user")
    activities = relationship("Activity", back_populates="user")
    study_plans = relationship("StudyPlan", back_populates="user")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    ats_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)
    analysis_json = Column(Text, default="{}")
    strengths = Column(Text, default="[]")
    weaknesses = Column(Text, default="[]")
    suggestions = Column(Text, default="[]")
    keywords_found = Column(Text, default="[]")
    keywords_missing = Column(Text, default="[]")
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="resumes")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(100), nullable=False)
    company = Column(String(100), default="General")
    difficulty = Column(String(20), default="medium")
    category = Column(String(50), default="technical")
    questions_json = Column(Text, default="[]")
    answers_json = Column(Text, default="[]")
    evaluations_json = Column(Text, default="[]")
    overall_score = Column(Float, default=0.0)
    total_questions = Column(Integer, default=0)
    answered_questions = Column(Integer, default=0)
    time_taken_seconds = Column(Integer, default=0)
    status = Column(String(20), default="in_progress")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="interviews")


class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_role = Column(String(100), nullable=False)
    current_skills = Column(Text, default="[]")
    required_skills = Column(Text, default="[]")
    gap_analysis_json = Column(Text, default="{}")
    roadmap_json = Column(Text, default="[]")
    proficiency_scores = Column(Text, default="{}")
    resources_json = Column(Text, default="[]")
    overall_readiness = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="skill_gaps")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    xp_earned = Column(Integer, default=0)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activities")


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    category = Column(String(50), default="general")
    priority = Column(String(20), default="medium")
    status = Column(String(20), default="pending")
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="study_plans")

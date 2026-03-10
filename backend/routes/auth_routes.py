from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from schemas import UserCreate, UserLogin, UserResponse, TokenResponse
import models
import random

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

AVATAR_COLORS = ["#00d4ff", "#ff006e", "#8338ec", "#06d6a0", "#ffd166", "#ef476f", "#118ab2"]


@router.post("/register", response_model=TokenResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        (models.User.username == user_data.username) | (models.User.email == user_data.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    user = models.User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        avatar_color=random.choice(AVATAR_COLORS),
        target_role=user_data.target_role or "Software Engineer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Award XP for registration
    activity = models.Activity(
        user_id=user.id,
        activity_type="achievement",
        title="Welcome to PlacePrep!",
        description="Created your account and started your placement journey",
        xp_earned=50
    )
    user.xp = 50
    db.add(activity)
    db.commit()

    token = create_access_token(data={"sub": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(data={"sub": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

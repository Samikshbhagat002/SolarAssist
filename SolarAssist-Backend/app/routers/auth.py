from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from .. import models, schemas, auth_utils
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserOut)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing = db.query(models.User).filter(func.lower(models.User.email) == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    new_user = models.User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=auth_utils.hash_password(payload.password),
        role=payload.role,
        business_name=payload.business_name,
        business_address=payload.business_address,
        city=payload.city,
        state=payload.state,
        service_area=payload.service_area,
        gst_id=payload.gst_id,
        vendor_status=(
            models.VendorStatusEnum.PENDING
            if payload.role in (models.RoleEnum.VENDOR, models.RoleEnum.REPAIR_PROVIDER)
            else None
        ),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(func.lower(models.User.email) == payload.email).first()

    if not user or not auth_utils.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated")

    token = auth_utils.create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "user": user}


@router.post("/forgot-password")
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(func.lower(models.User.email) == payload.email).first()
    generic_response = {"message": "If an account with that email exists, a reset link has been sent."}

    if not user:
        return generic_response

    token = auth_utils.generate_reset_token()
    user.reset_token = token
    user.reset_token_expiry = auth_utils.reset_token_expiry_time()
    db.commit()

    reset_link = f"http://localhost:5173/reset-password/{token}"
    # TODO: replace with real email sending — for now, printed for testing
    print(f"\n[PASSWORD RESET] Send this link to {user.email}:\n{reset_link}\n")

    return generic_response


@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    user = db.query(models.User).filter(models.User.reset_token == payload.token).first()

    if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")

    user.hashed_password = auth_utils.hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()

    return {"message": "Password has been reset successfully"}

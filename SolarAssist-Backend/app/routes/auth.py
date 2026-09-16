from datetime import datetime, timezone
from email.message import EmailMessage
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
import os
import smtplib

from .. import auth_utils, models, schemas
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


def send_password_reset_email(recipient: str, reset_link: str) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM") or smtp_user

    if not smtp_host or not smtp_user or not smtp_password or not sender:
        raise HTTPException(
            status_code=503,
            detail="Password reset email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM.",
        )

    message = EmailMessage()
    message["Subject"] = "Reset your SolarAssist password"
    message["From"] = sender
    message["To"] = recipient
    message.set_content(
        "We received a request to reset your SolarAssist password.\n\n"
        f"Use this link within 30 minutes:\n{reset_link}\n\n"
        "If you did not request this, you can safely ignore this email."
    )

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as smtp:
            smtp.starttls()
            smtp.login(smtp_user, smtp_password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        raise HTTPException(status_code=503, detail="The password reset email could not be sent.") from exc


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
        specializations=payload.specializations,
        years_experience=payload.years_experience,
        vendor_status=(
            models.ApprovalStatusEnum.PENDING
            if payload.role == models.RoleEnum.VENDOR
            else None
        ),
        repair_provider_status=(
            models.ApprovalStatusEnum.PENDING
            if payload.role == models.RoleEnum.REPAIR_PROVIDER
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

    if user.role == models.RoleEnum.VENDOR and user.vendor_status == models.ApprovalStatusEnum.PENDING:
        raise HTTPException(status_code=403, detail="Your vendor account is pending admin approval")

    if user.role == models.RoleEnum.REPAIR_PROVIDER and user.repair_provider_status != models.ApprovalStatusEnum.APPROVED:
        raise HTTPException(status_code=403, detail="Your repair provider account is pending admin approval")

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

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    reset_link = f"{frontend_url}/reset-password/{token}"
    send_password_reset_email(user.email, reset_link)

    return generic_response


@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    user = db.query(models.User).filter(models.User.reset_token == payload.token).first()

    if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")

    user.hashed_password = auth_utils.hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()

    return {"message": "Password has been reset successfully"}

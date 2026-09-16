from fastapi import APIRouter, Depends, HTTPException
import os
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/account", tags=["Account Profile"])


class GoogleLinkRequest(schemas.BaseModel):
    credential: str


@router.get("/profile", response_model=schemas.UserOut)
def get_account_profile(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=schemas.UserOut)
def update_account_profile(
    payload: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    for field in ("full_name", "phone", "city", "state"):
        value = getattr(payload, field)
        if value is not None:
            setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/google/link", response_model=schemas.UserOut)
def link_google_account(
    payload: GoogleLinkRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=503, detail="Google account linking is not configured.")

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
    except ModuleNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail="Google account linking requires the google-auth package in the active backend Python environment.",
        ) from exc

    try:
        google_user = id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            client_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="The Google credential is invalid or expired.") from exc

    google_subject = google_user.get("sub")
    if not google_subject:
        raise HTTPException(status_code=400, detail="The Google account did not provide a valid identity.")

    existing = db.query(models.User).filter(models.User.google_subject == google_subject).first()
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=409, detail="That Google account is already linked to another SolarAssist account.")

    current_user.google_subject = google_subject
    db.commit()
    db.refresh(current_user)
    return current_user

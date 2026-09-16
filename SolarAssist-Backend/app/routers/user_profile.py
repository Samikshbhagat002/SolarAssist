from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import require_role

router = APIRouter(prefix="/user", tags=["User Profile"])


@router.get("/profile", response_model=schemas.UserOut)
def get_user_profile(current_user: models.User = Depends(require_role("USER"))):
    return current_user


@router.put("/profile", response_model=schemas.UserOut)
def update_user_profile(
    payload: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("USER")),
):
    for field in ("full_name", "phone", "city", "state"):
        value = getattr(payload, field)
        if value is not None:
            setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user

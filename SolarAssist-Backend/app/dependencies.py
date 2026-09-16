from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
import os
from . import models, auth_utils
from .database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = auth_utils.decode_access_token(token)
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_role(role):
    allowed_roles = {role} if isinstance(role, str) else set(role)
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role.value not in allowed_roles:
            raise HTTPException(status_code=403, detail="You don't have permission to access this")
        return current_user
    return role_checker


def admin_creator_emails():
    configured = os.getenv("ADMIN_EMAILS", "")
    return {
        email.strip().casefold()
        for email in configured.split(",")
        if email.strip()
    }


def require_admin_creator(current_user: models.User = Depends(get_current_user)):
    """Allow admin APIs only to explicitly configured project creators."""
    allowed_emails = admin_creator_emails()
    if current_user.role != models.RoleEnum.ADMIN or current_user.email.casefold() not in allowed_emails:
        raise HTTPException(status_code=403, detail="Only configured project creators can access the admin portal")
    return current_user

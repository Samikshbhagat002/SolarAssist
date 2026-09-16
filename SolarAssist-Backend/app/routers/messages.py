from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])

@router.get("/{other_user_id}", response_model=list[schemas.MessageOut])
def get_conversation(other_user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(models.ChatMessage).filter(
        or_(
            and_(models.ChatMessage.sender_id == current_user.id, models.ChatMessage.receiver_id == other_user_id),
            and_(models.ChatMessage.sender_id == other_user_id, models.ChatMessage.receiver_id == current_user.id),
        )
    ).order_by(models.ChatMessage.created_at).all()

@router.post("/", response_model=schemas.MessageOut)
def send_message(payload: schemas.MessageCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    msg = models.ChatMessage(sender_id=current_user.id, receiver_id=payload.receiver_id, content=payload.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
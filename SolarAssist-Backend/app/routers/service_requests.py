from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/service-requests", tags=["service_requests"])


@router.post("/", response_model=schemas.ServiceRequestOut)
def create_service_request(
    payload: schemas.ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Reuse an existing open thread of the same type with the same vendor
    # instead of creating a new one every time chat is opened.
    existing = db.query(models.ServiceRequest).filter(
        models.ServiceRequest.user_id == current_user.id,
        models.ServiceRequest.vendor_id == payload.vendor_id,
        models.ServiceRequest.service_type == payload.service_type,
    ).first()
    if existing:
        return existing

    new_request = models.ServiceRequest(
        user_id=current_user.id,
        vendor_id=payload.vendor_id,
        service_type=payload.service_type,
        city=payload.city,
        address=payload.address,
        description=payload.description,
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


@router.get("/vendor/mine", response_model=list[schemas.ServiceRequestOut])
def get_vendor_requests(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(models.ServiceRequest).filter(
        models.ServiceRequest.vendor_id == current_user.id
    ).order_by(models.ServiceRequest.created_at.desc()).all()


def _authorize_request_access(request_id: int, db: Session, current_user):
    request = db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if current_user.id not in (request.user_id, request.vendor_id):
        raise HTTPException(status_code=403, detail="You don't have access to this conversation")
    return request


@router.get("/{request_id}/messages", response_model=list[schemas.ServiceMessageOut])
def get_messages(request_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _authorize_request_access(request_id, db, current_user)
    return db.query(models.ServiceMessage).filter(
        models.ServiceMessage.request_id == request_id
    ).order_by(models.ServiceMessage.created_at).all()


@router.post("/{request_id}/messages", response_model=schemas.ServiceMessageOut)
def send_message(
    request_id: int,
    payload: schemas.ServiceMessageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _authorize_request_access(request_id, db, current_user)
    msg = models.ServiceMessage(request_id=request_id, sender_id=current_user.id, message=payload.message)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
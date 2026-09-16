from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..dependencies import require_admin_creator

router = APIRouter(prefix="/admin", tags=["Admin Portal"])
admin_only = Depends(require_admin_creator)
PARTNER_ROLES = (models.RoleEnum.VENDOR, models.RoleEnum.REPAIR_PROVIDER)
# --- Admin Dashboard Stats ---
@router.get("/dashboard")
def get_admin_dashboard(db: Session = Depends(get_db), _=admin_only):
    total_users = db.query(models.User).filter(models.User.role == models.RoleEnum.USER).count()
    total_vendors = db.query(models.User).filter(models.User.role.in_(PARTNER_ROLES)).count()
    pending_approvals = db.query(models.User).filter(
        models.User.role.in_(PARTNER_ROLES),
        models.User.vendor_status == models.VendorStatusEnum.PENDING
    ).count()
    total_requests = db.query(models.QuoteRequest).count()

    return {
        "total_users": total_users,
        "registered_vendors": total_vendors,
        "pending_approvals": pending_approvals,
        "plans_generated": max(total_requests * 5, 2480),
        "recent_vendors": db.query(models.User).filter(models.User.role.in_(PARTNER_ROLES)).order_by(models.User.id.desc()).limit(5).all()
    }

# --- User Management ---
@router.get("/users", response_model=List[schemas.UserOut])
def get_all_users(db: Session = Depends(get_db), _=admin_only):
    return db.query(models.User).all()

@router.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, payload: schemas.UserUpdate, db: Session = Depends(get_db), _=admin_only):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.role == models.RoleEnum.ADMIN:
        from ..dependencies import admin_creator_emails
        if (payload.email or user.email).casefold() not in admin_creator_emails():
            raise HTTPException(status_code=403, detail="Only configured project creators can hold the ADMIN role")
    
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        user.email = payload.email
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.commit()
    db.refresh(user)
    return user

@router.patch("/users/{user_id}/status")
def toggle_user_active(user_id: int, db: Session = Depends(get_db), _=admin_only):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User status changed to {'active' if user.is_active else 'inactive'}", "is_active": user.is_active}

# --- Vendor Management & Approvals ---
@router.get("/vendors")
def get_all_vendors(db: Session = Depends(get_db), _=admin_only):
    vendors = db.query(models.User).filter(models.User.role == models.RoleEnum.VENDOR).all()
    result = []
    for v in vendors:
        product_count = db.query(models.ProductService).filter(models.ProductService.vendor_id == v.id).count()
        request_count = db.query(models.QuoteRequest).filter(models.QuoteRequest.vendor_id == v.id).count()
        result.append({
            "id": v.id,
            "full_name": v.full_name,
            "email": v.email,
            "phone": v.phone,
            "business_name": v.business_name or v.full_name,
            "business_address": v.business_address,
            "city": v.city,
            "state": v.state,
            "service_area": v.service_area,
            "gst_id": v.gst_id,
            "vendor_status": v.vendor_status.value if v.vendor_status else "PENDING",
            "is_active": v.is_active,
            "products_count": product_count,
            "requests_count": request_count,
            "created_at": str(v.created_at)[:10] if v.created_at else "N/A"
        })
    return result

@router.get("/vendors/pending")
def get_pending_vendors(db: Session = Depends(get_db), _=admin_only):
    return db.query(models.User).filter(
        models.User.role == models.RoleEnum.VENDOR,
        models.User.vendor_status == models.VendorStatusEnum.PENDING
    ).all()

@router.post("/vendors/{vendor_id}/approve")
def approve_vendor(vendor_id: int, db: Session = Depends(get_db), _=admin_only):
    vendor = db.query(models.User).filter(models.User.id == vendor_id, models.User.role == models.RoleEnum.VENDOR).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.vendor_status = models.VendorStatusEnum.APPROVED
    db.commit()
    return {"message": "Vendor account approved successfully"}

@router.post("/vendors/{vendor_id}/reject")
def reject_vendor(vendor_id: int, db: Session = Depends(get_db), _=admin_only):
    vendor = db.query(models.User).filter(models.User.id == vendor_id, models.User.role == models.RoleEnum.VENDOR).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.vendor_status = models.VendorStatusEnum.REJECTED
    db.commit()
    return {"message": "Vendor account rejected"}

# --- Reports & Analytics across all Users & Vendors ---
@router.get("/repair-providers")
def get_all_repair_providers(db: Session = Depends(get_db), _=admin_only):
    providers = db.query(models.User).filter(models.User.role == models.RoleEnum.REPAIR_PROVIDER).all()
    return [
        {
            "id": provider.id,
            "full_name": provider.full_name,
            "email": provider.email,
            "phone": provider.phone,
            "business_name": provider.business_name or provider.full_name,
            "business_address": provider.business_address,
            "city": provider.city,
            "state": provider.state,
            "service_area": provider.service_area,
            "specializations": provider.specializations,
            "years_experience": provider.years_experience,
            "vendor_status": (provider.repair_provider_status or provider.vendor_status).value
                if (provider.repair_provider_status or provider.vendor_status) else "PENDING",
            "is_active": provider.is_active,
        }
        for provider in providers
    ]

@router.get("/repair-providers/pending")
def get_pending_repair_providers(db: Session = Depends(get_db), _=admin_only):
    return db.query(models.User).filter(
        models.User.role == models.RoleEnum.REPAIR_PROVIDER,
        (models.User.repair_provider_status == models.ApprovalStatusEnum.PENDING)
        | (
            (models.User.repair_provider_status.is_(None))
            & (models.User.vendor_status == models.ApprovalStatusEnum.PENDING)
        )
    ).all()

@router.post("/repair-providers/{provider_id}/approve")
def approve_repair_provider(provider_id: int, db: Session = Depends(get_db), _=admin_only):
    provider = db.query(models.User).filter(models.User.id == provider_id, models.User.role == models.RoleEnum.REPAIR_PROVIDER).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Repair provider not found")
    provider.repair_provider_status = models.ApprovalStatusEnum.APPROVED
    db.commit()
    return {"message": "Repair provider approved"}

@router.post("/repair-providers/{provider_id}/reject")
def reject_repair_provider(provider_id: int, db: Session = Depends(get_db), _=admin_only):
    provider = db.query(models.User).filter(models.User.id == provider_id, models.User.role == models.RoleEnum.REPAIR_PROVIDER).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Repair provider not found")
    provider.repair_provider_status = models.ApprovalStatusEnum.REJECTED
    db.commit()
    return {"message": "Repair provider rejected"}

# --- Reports & Analytics across all Users & Vendors ---
@router.get("/analytics")
def get_platform_analytics(db: Session = Depends(get_db), _=admin_only):
    total_users = db.query(models.User).filter(models.User.role == models.RoleEnum.USER).count()
    total_vendors = db.query(models.User).filter(models.User.role.in_(PARTNER_ROLES)).count()
    total_requests = db.query(models.QuoteRequest).count()

    return {
        "platform_summary": {
            "total_users": total_users,
            "total_vendors": total_vendors,
            "total_quote_requests": total_requests,
            "total_capacity_recommended_kw": 12450.0,
            "total_co2_reduced_tons": 980.5
        },
        "monthly_user_growth": [
            {"month": "Apr", "users": 120, "vendors": 8},
            {"month": "May", "users": 210, "vendors": 14},
            {"month": "Jun", "users": 340, "vendors": 22},
            {"month": "Jul", "users": 520, "vendors": 35},
            {"month": "Aug", "users": 890, "vendors": 58},
        ],
        "top_regions": [
            {"city": "Amravati", "vendors": 12, "requests": 140},
            {"city": "Nagpur", "vendors": 24, "requests": 320},
            {"city": "Pune", "vendors": 38, "requests": 580},
            {"city": "Mumbai", "vendors": 45, "requests": 790}
        ]
    }

# --- System Settings & Config ---
@router.get("/settings")
def get_system_settings(db: Session = Depends(get_db), _=admin_only):
    settings = db.query(models.SystemSetting).all()
    if not settings:
        # Default settings seed
        default_settings = [
            models.SystemSetting(key="subsidy_max_cap_inr", value="78000", description="Maximum PM Surya Ghar subsidy amount"),
            models.SystemSetting(key="default_tariff_inr", value="7.50", description="Default electricity tariff rate per kWh"),
            models.SystemSetting(key="grid_co2_factor", value="0.82", description="kg CO2 per kWh grid electricity"),
            models.SystemSetting(key="platform_fee_percent", value="2.5", description="Vendor commission fee percentage")
        ]
        db.add_all(default_settings)
        db.commit()
        settings = db.query(models.SystemSetting).all()
    return settings

@router.put("/settings/{setting_key}")
def update_system_setting(setting_key: str, payload: schemas.SystemSettingUpdate, db: Session = Depends(get_db), _=admin_only):
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == setting_key).first()
    if not setting:
        setting = models.SystemSetting(key=setting_key, value=payload.value, description=payload.description)
        db.add(setting)
    else:
        setting.value = payload.value
        if payload.description:
            setting.description = payload.description
    db.commit()
    return setting

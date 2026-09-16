import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class RoleEnum(str, enum.Enum):
    USER = "USER"
    VENDOR = "VENDOR"
    REPAIR_PROVIDER = "REPAIR_PROVIDER"
    ADMIN = "ADMIN"


class ApprovalStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


# Keep the vendor-specific name used by existing routers compatible with the
# shared approval-status column type.
VendorStatusEnum = ApprovalStatusEnum


class RequestStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"


class ServiceRequestStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    google_subject = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum, name="role_enum"), default=RoleEnum.USER, nullable=False)
    is_active = Column(Boolean, default=True)

    # Provider Business Info
    business_name = Column(String(200), nullable=True)
    business_address = Column(String(300), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    service_area = Column(String(200), nullable=True)
    gst_id = Column(String(50), nullable=True)
    specializations = Column(String(255), nullable=True)
    years_experience = Column(String(50), nullable=True)

    # Status columns using shared ApprovalStatusEnum
    vendor_status = Column(
        Enum(ApprovalStatusEnum, name="approval_status_enum"), nullable=True
    )
    repair_provider_status = Column(
        Enum(ApprovalStatusEnum, name="approval_status_enum"), nullable=True
    )

    # Password reset
    reset_token = Column(String(255), nullable=True)
    reset_token_expiry = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProductService(Base):
    __tablename__ = "product_services"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)  # e.g., Panel Kit, Inverter, Installation, Maintenance, Battery
    capacity_kw = Column(Float, nullable=True)
    price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    warranty_years = Column(Integer, default=5)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class QuoteRequest(Base):
    __tablename__ = "quote_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    customer_name = Column(String(150), nullable=False)
    customer_email = Column(String(255), nullable=False)
    customer_phone = Column(String(20), nullable=True)
    location = Column(String(200), nullable=True)
    service_name = Column(String(200), nullable=False)
    capacity_kw = Column(Float, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    status = Column(
        Enum(RequestStatusEnum, name="request_status_enum"),
        default=RequestStatusEnum.PENDING,
        nullable=False,
    )
    user_notes = Column(Text, nullable=True)
    vendor_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ServiceRequest(Base):
    """A customer service request and its assigned vendor/provider."""
    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    service_type = Column(String(120), nullable=False, index=True)
    description = Column(Text, nullable=True)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=True)
    address = Column(String(300), nullable=True)
    status = Column(
        Enum(ServiceRequestStatusEnum, name="service_request_status_enum"),
        default=ServiceRequestStatusEnum.PENDING,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ServiceMessage(Base):
    __tablename__ = "service_messages"

    id = Column(Integer, primary_key=True, index=True)
    service_request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator, model_validator
from typing import Optional, List, Dict, Any
from enum import Enum


class RoleEnum(str, Enum):
    USER = "USER"
    VENDOR = "VENDOR"
    REPAIR_PROVIDER = "REPAIR_PROVIDER"
    ADMIN = "ADMIN"


class ApprovalStatusEnum(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


# Alias for backward compatibility if needed across endpoints
VendorStatusEnum = ApprovalStatusEnum


class RequestStatusEnum(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    confirm_password: str
    role: RoleEnum

    # Vendor & Repair Provider fields
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    service_area: Optional[str] = None
    gst_id: Optional[str] = None
    specializations: Optional[str] = None
    years_experience: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return str(v).strip().casefold()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self

    @field_validator("role")
    @classmethod
    def no_self_admin(cls, v: RoleEnum) -> RoleEnum:
        if v == RoleEnum.ADMIN:
            raise ValueError("Admin accounts cannot be self-registered")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return str(v).strip().casefold()


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    google_subject: Optional[str] = None
    phone: Optional[str] = None
    role: RoleEnum
    is_active: bool = True

    # Business & Provider details
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    service_area: Optional[str] = None
    gst_id: Optional[str] = None
    vendor_status: Optional[str] = None
    repair_provider_status: Optional[str] = None
    specializations: Optional[str] = None
    years_experience: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[RoleEnum] = None
    is_active: Optional[bool] = None


class ProviderProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    service_area: Optional[str] = None
    gst_id: Optional[str] = None
    specializations: Optional[str] = None
    years_experience: Optional[str] = None
    phone: Optional[str] = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return str(v).strip().casefold()


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


# --- Product / Service Schemas ---
class ProductServiceBase(BaseModel):
    name: str
    category: str
    capacity_kw: Optional[float] = None
    price: float
    description: Optional[str] = None
    warranty_years: Optional[int] = 5
    is_available: Optional[bool] = True


class ProductServiceCreate(ProductServiceBase):
    pass


class ProductServiceOut(ProductServiceBase):
    id: int
    vendor_id: int

    model_config = ConfigDict(from_attributes=True)


# --- Quote Request Schemas ---
class QuoteRequestCreate(BaseModel):
    vendor_id: int
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    location: Optional[str] = None
    service_name: str
    capacity_kw: Optional[float] = None
    estimated_cost: Optional[float] = None
    user_notes: Optional[str] = None


class QuoteRequestUpdate(BaseModel):
    status: RequestStatusEnum
    vendor_notes: Optional[str] = None


class QuoteRequestOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    vendor_id: int
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    location: Optional[str] = None
    service_name: str
    capacity_kw: Optional[float] = None
    estimated_cost: Optional[float] = None
    status: RequestStatusEnum
    user_notes: Optional[str] = None
    vendor_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Service Requests and Messaging ---
class ServiceRequestCreate(BaseModel):
    vendor_id: Optional[int] = None
    service_type: str
    city: str
    state: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None


class ServiceRequestOut(BaseModel):
    id: int
    user_id: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    vendor_id: int
    service_type: str
    description: Optional[str] = None
    city: str
    state: Optional[str] = None
    address: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)


class ServiceMessageCreate(BaseModel):
    message: str

    @field_validator("message")
    @classmethod
    def message_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be blank")
        return value


class ServiceRequestUpdate(BaseModel):
    status: RequestStatusEnum


class ServiceMessageOut(BaseModel):
    id: int
    service_request_id: int
    sender_id: int
    message: str
    created_at: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)


# --- System Setting Schemas ---
class SystemSettingOut(BaseModel):
    id: int
    key: str
    value: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SystemSettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None


# --- ML Pipeline Request & Response Schemas ---
class PipelineRecommendRequest(BaseModel):
    monthlyConsumption: float
    monthlyBill: float
    roofArea: Optional[float] = 400
    budget: Optional[float] = 300000
    state: Optional[str] = "Maharashtra"
    city: Optional[str] = "Amravati"
    userType: Optional[str] = "Residential"
    battery: Optional[str] = "No"


class FinancialAnalysisRequest(BaseModel):
    capacity_kw: float
    monthly_consumption_kwh: float
    monthly_bill_inr: float
    estimated_system_cost: Optional[float] = None
    

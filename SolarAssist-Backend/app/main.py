from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
import os

load_dotenv()

from . import models, auth_utils
from .database import Base, engine, SessionLocal
from .routes import auth
from .routers import admin, vendor, pipeline, service_requests, user_profile, account_profile

app = FastAPI(title="SolarAssist API")


def seed_database():
    db = SessionLocal()
    try:
        # 1. Seed Admin
        admin_email = os.getenv("ADMIN_SEED_EMAIL", "admin@solarassist.com").strip().casefold()
        admin_password = os.getenv("ADMIN_SEED_PASSWORD", "").strip()
        admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
        if not admin_password:
            print("[WARNING] ADMIN_SEED_PASSWORD is not configured; no admin account will be seeded.")
        elif not admin_user:
            admin_user = models.User(
                full_name="SolarAssist Admin",
                email=admin_email,
                phone="+91 9999900000",
                hashed_password=auth_utils.hash_password(admin_password),
                role=models.RoleEnum.ADMIN,
                is_active=True
            )
            db.add(admin_user)
        else:
            admin_user.role = models.RoleEnum.ADMIN
            admin_user.is_active = True
            admin_user.hashed_password = auth_utils.hash_password(admin_password)

        # 2. Seed Approved Vendor
        approved_vendor = db.query(models.User).filter(models.User.email == "vendor@solarassist.com").first()
        if not approved_vendor:
            approved_vendor = models.User(
                full_name="Rajesh Sharma",
                email="vendor@solarassist.com",
                phone="+91 9823012345",
                hashed_password=auth_utils.hash_password("vendor123"),
                role=models.RoleEnum.VENDOR,
                business_name="SunPower Solar Solutions",
                business_address="12 Solar Park Road, MIDC",
                city="Nagpur",
                state="Maharashtra",
                service_area="Vidarbha & Central Maharashtra",
                gst_id="27ABCDE1234F1ZH",
                vendor_status=models.VendorStatusEnum.APPROVED,
                repair_provider_status=models.ApprovalStatusEnum.APPROVED,
                is_active=True
            )
            db.add(approved_vendor)
        else:
            approved_vendor.hashed_password = auth_utils.hash_password("vendor123")
            approved_vendor.role = models.RoleEnum.VENDOR
            approved_vendor.vendor_status = models.VendorStatusEnum.APPROVED
            approved_vendor.is_active = True
            approved_vendor.business_name = approved_vendor.business_name or "SunPower Solar Solutions"

        # 3. Seed an approved repair and maintenance provider for the existing-system flow.
        repair_provider = db.query(models.User).filter(
            models.User.email == "repair@solarassist.com"
        ).first()
        if not repair_provider:
            repair_provider = models.User(
                full_name="Neha Kulkarni",
                email="repair@solarassist.com",
                phone="+91 98888 12345",
                hashed_password=auth_utils.hash_password("repair123"),
                role=models.RoleEnum.REPAIR_PROVIDER,
                business_name="SolarCare Repair & Maintenance",
                business_address="18 Clean Energy Road, Civil Lines",
                city="Nagpur",
                state="Maharashtra",
                service_area="Nagpur & nearby areas",
                vendor_status=models.VendorStatusEnum.APPROVED,
                is_active=True,
            )
            db.add(repair_provider)
        else:
            repair_provider.hashed_password = auth_utils.hash_password("repair123")
            repair_provider.role = models.RoleEnum.REPAIR_PROVIDER
            repair_provider.vendor_status = models.VendorStatusEnum.APPROVED
            repair_provider.repair_provider_status = models.ApprovalStatusEnum.APPROVED
            repair_provider.is_active = True
            repair_provider.business_name = repair_provider.business_name or "SolarCare Repair & Maintenance"

        # 4. Seed Pending Vendor Request (For Admin Approvals test)
        pending_vendor = db.query(models.User).filter(models.User.email == "pending_vendor@solarassist.com").first()
        if not pending_vendor:
            pending_vendor = models.User(
                full_name="Amit Patel",
                email="pending_vendor@solarassist.com",
                phone="+91 9765432109",
                hashed_password=auth_utils.hash_password("vendor123"),
                role=models.RoleEnum.VENDOR,
                business_name="Apex Solar Technologies",
                business_address="45 Clean Energy Complex",
                city="Amravati",
                state="Maharashtra",
                service_area="Amravati & Akola Region",
                gst_id="27XYZAB5678G2ZK",
                vendor_status=models.VendorStatusEnum.PENDING,
                is_active=True
            )
            db.add(pending_vendor)

        # 4. Seed Standard User
        normal_user = db.query(models.User).filter(models.User.email == "user@solarassist.com").first()
        if not normal_user:
            normal_user = models.User(
                full_name="Archita Sharma",
                email="user@solarassist.com",
                phone="+91 9123456789",
                hashed_password=auth_utils.hash_password("user123"),
                role=models.RoleEnum.USER,
                is_active=True
            )
            db.add(normal_user)

        db.commit()

        # Refresh approved_vendor and normal_user to get IDs
        if approved_vendor:
            db.refresh(approved_vendor)
        if repair_provider:
            db.refresh(repair_provider)
        if normal_user:
            db.refresh(normal_user)

        # Seed products for approved vendor
        if approved_vendor and db.query(models.ProductService).filter(models.ProductService.vendor_id == approved_vendor.id).count() == 0:
            products = [
                models.ProductService(
                    vendor_id=approved_vendor.id,
                    name="5kW Monocrystalline On-Grid Solar Package",
                    category="Panel Kit",
                    capacity_kw=5.0,
                    price=260000,
                    description="High efficiency 440W Tier-1 Mono PERC panels with 5kW SolarEdge string inverter.",
                    warranty_years=25
                ),
                models.ProductService(
                    vendor_id=approved_vendor.id,
                    name="3kW Rooftop Hybrid Solar with Lithium Battery",
                    category="Hybrid System",
                    capacity_kw=3.0,
                    price=195000,
                    description="Complete off-grid backup kit with 4.8kWh LiFePO4 battery pack.",
                    warranty_years=10
                ),
                models.ProductService(
                    vendor_id=approved_vendor.id,
                    name="10kW Commercial Solar Panel System",
                    category="Commercial",
                    capacity_kw=10.0,
                    price=480000,
                    description="Heavy duty commercial solar plant with smart net-metering setup.",
                    warranty_years=25
                )
            ]
            db.add_all(products)
            db.commit()

        if repair_provider and db.query(models.ProductService).filter(models.ProductService.vendor_id == repair_provider.id).count() == 0:
            db.add_all([
                models.ProductService(
                    vendor_id=repair_provider.id,
                    name="Solar Panel Repair",
                    category="Repair",
                    price=0,
                    description="On-site diagnosis and repair for panels, wiring and mounting issues.",
                    warranty_years=1,
                ),
                models.ProductService(
                    vendor_id=repair_provider.id,
                    name="Solar System Maintenance",
                    category="Maintenance",
                    price=0,
                    description="Preventive inspection, cleaning and performance checks.",
                    warranty_years=1,
                ),
                models.ProductService(
                    vendor_id=repair_provider.id,
                    name="Solar Fitter Site Visit",
                    category="Fitter",
                    price=0,
                    description="Roof survey, mounting inspection and fitter support.",
                    warranty_years=1,
                ),
            ])
            db.commit()

        # Seed quote request
        if approved_vendor and normal_user and db.query(models.QuoteRequest).count() == 0:
            req = models.QuoteRequest(
                user_id=normal_user.id,
                vendor_id=approved_vendor.id,
                customer_name=normal_user.full_name,
                customer_email=normal_user.email,
                customer_phone=normal_user.phone,
                location="Nagpur, Maharashtra",
                service_name="5kW Monocrystalline On-Grid Solar Package",
                capacity_kw=5.0,
                estimated_cost=260000,
                status=models.RequestStatusEnum.PENDING,
                user_notes="Looking for installation within 2 weeks. Please send site survey technician."
            )
            db.add(req)
            db.commit()

    except Exception as exc:
        db.rollback()
        print(f"[WARNING] Seeding error: {exc}")
    finally:
        db.close()


def migrate_role_enum():
    if engine.dialect.name != "mysql":
        return
    with engine.begin() as connection:
        connection.execute(text(
            "ALTER TABLE users MODIFY COLUMN role "
            "ENUM('USER', 'VENDOR', 'REPAIR_PROVIDER', 'ADMIN', 'SERVICE_PROVIDER') "
            "NOT NULL"
        ))
        # Older deployments used SERVICE_PROVIDER for repair businesses.
        # Normalize those rows before narrowing the MySQL enum values.
        connection.execute(text(
        "UPDATE users SET role = 'REPAIR_PROVIDER' "
        "WHERE role = 'SERVICE_PROVIDER'"
        ))
        connection.execute(text(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('USER', 'VENDOR', 'REPAIR_PROVIDER', 'ADMIN') "
        "NOT NULL"
        ))


def migrate_user_columns():
    """Add columns introduced after the initial SQLite database was created."""
    inspector = inspect(engine)
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    missing_columns = {
        "repair_provider_status": "VARCHAR(20)",
        "specializations": "VARCHAR(255)",
        "years_experience": "VARCHAR(50)",
        "google_subject": "VARCHAR(255)",
    }

    with engine.begin() as connection:
        for column_name, column_type in missing_columns.items():
            if column_name not in user_columns:
                connection.execute(
                    text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}")
                )
        connection.execute(text(
            "UPDATE users SET repair_provider_status = 'PENDING' "
            "WHERE role = 'REPAIR_PROVIDER' AND repair_provider_status IS NULL"
        ))


@app.on_event("startup")
def startup_event():
    try:
        Base.metadata.create_all(bind=engine)
        migrate_user_columns()
        migrate_role_enum()
        seed_database()
    except Exception as exc:
        print(f"[WARNING] Could not initialize database tables: {exc}")

# CORS: list every real frontend origin explicitly.
# NOTE: "*" cannot be combined with allow_credentials=True — browsers reject
# that combination for credentialed requests (your JWT Authorization header
# counts as credentialed), so a wildcard here was silently doing nothing.
FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# Add your deployed frontend URL via an env var once it exists, e.g.:
# FRONTEND_URL=https://solarassist.vercel.app
deployed_frontend_url = os.getenv("FRONTEND_URL")
if deployed_frontend_url:
    FRONTEND_ORIGINS.append(deployed_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(vendor.router)
app.include_router(service_requests.router)
app.include_router(user_profile.router)
app.include_router(account_profile.router)
app.include_router(pipeline.router)
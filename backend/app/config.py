import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR.parent / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

# Database URL for MySQL 8.x
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://root:root@localhost:3306/edumate_ai?charset=utf8mb4"
)
DATABASE_PATH = os.getenv("DATABASE_PATH", str(BASE_DIR / "edumate.db"))

# SMTP Configuration for Result Emails
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = os.getenv("SMTP_PORT", "587")
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_SENDER_EMAIL = os.getenv("SMTP_SENDER_EMAIL", "noreply@edumate.ai")
SMTP_SENDER_NAME = os.getenv("SMTP_SENDER_NAME", "EduMate AI")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads"))
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")

os.makedirs(UPLOAD_DIR, exist_ok=True)

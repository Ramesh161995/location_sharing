"""
Simple configuration for the Location Sharing App (Python 3.13 Compatible)
"""
import os
from typing import List


class Settings:
    """Simple application settings without complex dependencies"""
    
    # App Configuration
    APP_NAME: str = "Location Sharing App"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Location Sharing App"
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Database Configuration (MySQL)
    MYSQL_HOST: str = "127.0.0.1"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "Root@1234"
    MYSQL_DATABASE: str = "location_sharing"
    
    # Legacy MongoDB (for backward compatibility, not used)
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "location_sharing_app"
    MONGODB_MAX_POOL_SIZE: int = 10
    
    # Redis Configuration (simplified)
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_DB: int = 0
    REDIS_MAX_CONNECTIONS: int = 20
    
    # JWT Configuration
    SECRET_KEY: str = "your-super-secret-jwt-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Phone Authentication
    SMS_PROVIDER: str = "twilio"
    TWILIO_ACCOUNT_SID: str = None
    TWILIO_AUTH_TOKEN: str = None
    TWILIO_PHONE_NUMBER: str = None
    
    # Google Maps API
    GOOGLE_MAPS_API_KEY: str = None
    
    # OpenAI API
    OPENAI_API_KEY: str = None
    
    # Email Configuration
    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_USER: str = None
    SMTP_PASSWORD: str = None
    EMAILS_FROM_EMAIL: str = "noreply@locationsharingapp.com"
    EMAILS_FROM_NAME: str = "Location Sharing App"
    
    # Security
    BCRYPT_ROUNDS: int = 12
    PASSWORD_MIN_LENGTH: int = 8
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # AI Features
    AI_ENABLED: bool = True
    ML_MODEL_PATH: str = "./models"
    ANOMALY_DETECTION_THRESHOLD: float = 0.8
    
    # Monitoring
    SENTRY_DSN: str = None
    PROMETHEUS_PORT: int = 9090
    
    def __init__(self):
        """Initialize settings from environment variables if available"""
        # Load environment variables from .env file
        from dotenv import load_dotenv
        load_dotenv()
        
        # Override with environment variables if they exist
        self.DEBUG = os.getenv("DEBUG", "True").lower() == "true"
        self.HOST = os.getenv("HOST", self.HOST)
        self.PORT = int(os.getenv("PORT", self.PORT))
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", self.LOG_LEVEL)
        
        # MySQL Configuration
        self.MYSQL_HOST = os.getenv("MYSQL_HOST", self.MYSQL_HOST)
        self.MYSQL_PORT = int(os.getenv("MYSQL_PORT", self.MYSQL_PORT))
        self.MYSQL_USER = os.getenv("MYSQL_USER", self.MYSQL_USER)
        self.MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", self.MYSQL_PASSWORD)
        self.MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", self.MYSQL_DATABASE)
        
        # Legacy MongoDB (not used, kept for backward compatibility)
        self.MONGODB_URL = os.getenv("MONGODB_URL", self.MONGODB_URL)
        self.MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", self.MONGODB_DB_NAME)
        
        self.REDIS_URL = os.getenv("REDIS_URL", self.REDIS_URL)
        self.SECRET_KEY = os.getenv("SECRET_KEY", self.SECRET_KEY)


# Global settings instance
settings = Settings()
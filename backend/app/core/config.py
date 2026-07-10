"""
Core configuration for the Location Sharing App
"""
from typing import List, Optional, Union
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings"""
    
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
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database Configuration
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "location_sharing_app"
    MONGODB_MAX_POOL_SIZE: int = 10
    
    # Redis Configuration
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
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Google Maps API
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    
    # OpenAI API
    OPENAI_API_KEY: Optional[str] = None
    
    # Email Configuration
    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
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
    SENTRY_DSN: Optional[str] = None
    PROMETHEUS_PORT: int = 9090
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()

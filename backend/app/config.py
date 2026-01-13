from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # API Keys
    GROQ_API_KEY: str
    SERPAPI_API_KEY: str
    GITHUB_TOKEN: Optional[str] = None  # Optional GitHub API token for enriched data
    
    # JWT Secret
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # App Settings
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"


# Create global settings instance
settings = Settings()
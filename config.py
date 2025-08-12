import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Configuration class for the MITRE ATT&CK application"""
    
    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    OPENAI_MAX_TOKENS: int = int(os.getenv("OPENAI_MAX_TOKENS", "800"))
    OPENAI_TEMPERATURE: float = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))
    
    # Application Configuration
    APP_HOST: str = os.getenv("APP_HOST", "0.0.0.0")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))
    APP_DEBUG: bool = os.getenv("APP_DEBUG", "false").lower() == "true"
    
    # File Paths
    FEEDBACK_CSV: str = os.getenv("FEEDBACK_CSV", "feedback.csv")
    MITRE_CSV: str = os.getenv("MITRE_CSV", "mitre.csv")
    
    @classmethod
    def validate(cls) -> bool:
        """Validate that required configuration is present"""
        print(f"DEBUG: OPENAI_API_KEY loaded: {'Yes' if cls.OPENAI_API_KEY else 'No'}")
        print(f"DEBUG: OPENAI_API_KEY value: {cls.OPENAI_API_KEY[:10] if cls.OPENAI_API_KEY else 'None'}...")
        if not cls.OPENAI_API_KEY:
            print("Warning: OPENAI_API_KEY not set. LLM features will not work.")
            return False
        return True
    
    @classmethod
    def get_openai_config(cls) -> dict:
        """Get OpenAI configuration as a dictionary"""
        return {
            "api_key": cls.OPENAI_API_KEY,
            "model": cls.OPENAI_MODEL,
            "max_tokens": cls.OPENAI_MAX_TOKENS,
            "temperature": cls.OPENAI_TEMPERATURE
        }

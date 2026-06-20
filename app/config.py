from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: str
    anthropic_base_url: str = "https://api.anthropic.com"
    deepseek_api_key: str = ""
    kimi_api_key: str = ""
    supabase_url: str
    supabase_service_key: str
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

settings = Settings()

from urllib.parse import urlsplit, urlunsplit

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: str = ""
    anthropic_base_url: str = "https://api.anthropic.com"
    deepseek_api_key: str = ""
    kimi_api_key: str = ""
    minimax_api_key: str = ""
    minimax_base_url: str = "https://api.minimaxi.com/v1"
    supabase_url: str
    supabase_service_key: str
    supabase_anon_key: str = ""
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

    @property
    def frontend_origin(self) -> str:
        parsed = urlsplit(self.frontend_url)
        if parsed.scheme and parsed.netloc:
            return urlunsplit((parsed.scheme, parsed.netloc, "", "", ""))
        return self.frontend_url.rstrip("/")

settings = Settings()

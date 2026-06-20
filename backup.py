import json
import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

result = supabase.table("gifts").select("id, session_id, slug, config, created_at").execute()
gifts = result.data or []

filename = f"backup_gifts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
with open(filename, "w", encoding="utf-8") as f:
    json.dump(gifts, f, ensure_ascii=False, indent=2)

print(f"备份完成：{len(gifts)} 条礼物 → {filename}")

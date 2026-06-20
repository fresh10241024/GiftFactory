# Gift Backend

给朋友定制一个专属网站作为礼物。用户通过几轮自然对话描述想法，AI 生成一个独一无二的礼物网站，收到礼物的人打开链接就能看到。

## 核心流程

```
用户对话 → AI 理解意图 → 生成网站配置 JSON → 唯一 URL → 收礼人打开
```

## API 接口

### 创建一个设计会话
```
POST /sessions
→ { session_id }
```

### 发消息（对话）
```
POST /sessions/:id/chat
Body: { "message": "我想给我最好的朋友..." }
→ { reply, ready, state }
   ready=true 时说明信息收集完毕，可以生成网站
```

### 生成礼物网站
```
POST /sessions/:id/generate
→ { slug, config }
   slug 是唯一短码，如 "a3f9b2c1"
```

### 获取礼物网站配置（前端渲染用）
```
GET /gifts/:slug
→ { config, slug }
```

### 获取对话历史
```
GET /sessions/:id/messages
→ { messages }
```

## 本地开发

```bash
# 1. 克隆项目
git clone <repo-url>
cd gift-backend

# 2. 创建虚拟环境（需要 Python 3.12）
python3.12 -m venv venv
source venv/bin/activate

# 3. 安装依赖
pip install -r requirements.txt

# 4. 配置环境变量
cp .env.example .env
# 填入 ANTHROPIC_API_KEY 和 SUPABASE_URL / SUPABASE_SERVICE_KEY

# 5. 启动
uvicorn app.main:app --reload
# 接口文档：http://localhost:8000/docs
```

## 数据库

使用 Supabase（PostgreSQL）。建表 SQL 在 `supabase_schema.sql`，直接粘贴到 Supabase SQL Editor 执行。

三张表：
- `sessions` — 每次礼物设计流程
- `messages` — 对话历史
- `gifts` — 生成的礼物网站配置（含唯一 slug）

## 部署

项目已配置 Railway 一键部署（`railway.json` + `Procfile`）。

在 Railway 里设置以下环境变量：
```
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
FRONTEND_URL=https://your-frontend.vercel.app
```

## 技术栈

- **FastAPI** — 后端框架
- **Anthropic Claude** — 对话理解 + 配置生成
- **Supabase** — 数据库 + 存储
- **Railway** — 部署

## 给前端的说明

`GET /gifts/:slug` 返回的 `config` 结构：

```json
{
  "theme": "gentle",
  "recipient_name": "小林",
  "headline": "有你在的那年夏天",
  "subtitle": "副标题",
  "body_paragraphs": ["段落1", "段落2"],
  "closing": "落款语",
  "accent_color": "#e8c4a0",
  "sender_name": "晓明",
  "occasion": "毕业"
}
```

`theme` 对应前端的渲染模板：`gentle` / `vibrant` / `nostalgic` / `minimal` / `dreamy`

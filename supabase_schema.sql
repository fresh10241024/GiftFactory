-- sessions 表：一次礼物设计流程
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  status TEXT DEFAULT 'chatting',  -- chatting | ready | done
  style_summary JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- messages 表：对话历史
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,          -- user | assistant
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- gifts 表：生成的礼物网站（完整 HTML）
CREATE TABLE gifts (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  slug TEXT UNIQUE NOT NULL,   -- 短码，如 "a3f9b2c1"
  html TEXT NOT NULL,          -- AI 生成的完整 HTML 文件内容
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_gifts_slug ON gifts(slug);

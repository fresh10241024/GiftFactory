# Frontend Changelog & Backend Handoff

> 前端变更记录 & 后端对接说明
> 由 hy 维护，每次前端改动后更新。

---

## [2026-06-27] 语言切换功能（双语 EN / 中文）

### 改动内容

- **新增**：Header 右侧加入语言切换按钮（胶囊滑块样式，EN ↔ 中文）
- **文件改动**：
  - `fronted.hy/src/index.html` — 新增 `lang-toggle` 按钮，所有可翻译文本加 `data-i18n` 属性
  - `fronted.hy/src/styles/base.css` — 新增 `.lang-toggle` 组件样式
  - `fronted.hy/src/scripts/index.js` — 新增 `TRANSLATIONS` 对象 + `applyLanguage()` 函数

### 当前实现逻辑

- 语言偏好存储在 `localStorage('lang')`，默认 `en`
- 纯前端实现，切换后所有静态文本立即替换（含首页、Modal 等）
- 动画由 GSAP 驱动，GSAP 滚动控制区域做静默更新避免冲突

### 预留后端接口（待 rx 实现后接入）

目前语言偏好仅存本地，**登录用户的语言偏好未同步至服务器**。
后续如需持久化，前端约定如下：

```
GET  /api/user/preferences
  Response: { "lang": "en" | "zh", ... }

PATCH /api/user/preferences
  Body:    { "lang": "en" | "zh" }
  Response: { "success": true }
```

接入时机：用户登录成功后（`saveAuth()` 函数内）调用 `GET /api/user/preferences` 读取偏好，`applyLanguage()` 切换时调用 `PATCH` 同步。

**接入前前端代码无需改动，后端实现以上两个接口即可。**

---

## [2026-06-27] Chat 输入球优化（自动换行 + Send 按钮 + 等比圆生长）

### 改动内容

- **修改**：`<input type="text">` → `<textarea>`，支持多行输入与自动换行
- **修改**：输入球生长算法改为等比正圆（内切矩形公式），最大直径 420px → 560px
- **新增**：Send ↵ 按钮，有文字时淡入显示于球体底部
- **移除**：回车发送逻辑；Enter 现在仅换行，发送只能点 Send 按钮
- **文件改动**：
  - `fronted.hy/src/chat.html` — textarea 替换 input，新增 send-btn 元素
  - `fronted.hy/src/styles/chat.css` — textarea 样式、send-btn 样式、border-radius 改为 9999px
  - `fronted.hy/src/scripts/chat.js` — 重写 adjustSize()，新增 sendBtn 事件处理

### 当前实现逻辑

- 圆形生长分三阶段：① 单行文字宽度决定初始圆径 → ② 测量换行后文字高度 → ③ 用公式 `D ≥ H / √(1 − ratio²)` 确保文字内切于圆，始终保持 width === height
- Send 按钮用 `mousedown preventDefault` 阻止 textarea 失焦竞态问题
- Shift+Enter 换行，Enter 也换行（textarea 默认行为）

### 预留后端接口

无新增后端接口需求，此次为纯前端交互优化。

---

## [2026-06-27] 聊天消息携带语言代码（language_code）

### 改动内容

- **修改**：`sendChatMessage` 请求体新增 `language_code` 字段
- **文件改动**：`fronted.hy/src/scripts/api.js`

### 当前实现逻辑

每次用户发送聊天消息时，前端自动从 `localStorage('lang')` 读取当前语言偏好，拼入请求体：

```json
POST /api/sessions/{session_id}/chat
{
  "message": "用户输入的内容",
  "language_code": "zh"   // 或 "en"，随用户切换实时变化
}
```

- 取值：`"en"`（英文，默认）或 `"zh"`（中文）
- 用户切换语言后，下一条消息即生效，无需刷新

### 需要 rx 接入

**rx 需要做的事：**
在 `/api/sessions/{session_id}/chat` 接口中读取 `language_code` 字段，并将其注入系统提示词（system prompt），指示模型用对应语言回复。

例如系统提示词可追加：
> "Please respond in **Chinese** / **English** based on the user's language preference."

前端已完成，等后端接入即可完整跑通双语对话。

---

## 记录模板（每次复制使用）

```
## [YYYY-MM-DD] 改动标题

### 改动内容
- 新增 / 修改 / 删除：...
- 文件改动：...

### 当前实现逻辑
- ...

### 预留后端接口（待 rx 实现后接入）
- 接口路径、请求/响应格式
- 接入时机说明
```

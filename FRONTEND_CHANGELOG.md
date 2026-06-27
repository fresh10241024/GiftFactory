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

## [2026-06-27] 设计决策：Chat 页面截图分享功能（待实现）

> 功能尚未开发，记录设计决策供实现时参考。

### 功能概述

在 Chat 对话页提供「保存图片」入口，用户可将当前回答的这一刻导出为图片留念或分享。

### 交互设计决策

**触发入口**
- 位置：header 同行，现有右上角信息区（AI Generative Canvas...）的左侧
- 形态：轻量图标按钮，风格与页面现有元素保持一致（低调）
- 显示时机：用户在输入球中有文字时才出现

**弹层动画**
- 弹层以截图按钮为变换原点，从该点 `scale(0) → scale(1)` 展开（origin transform）
- 同时配合 opacity + 轻微位移，给人"从按钮处生长出来"的感觉
- 使用 GSAP 实现，与页面其他动画风格统一

**弹层内容**
- 标题：Save this moment / 保存这一刻
- 副提示：Keep it as a memory, share with a friend, or post it. / 留作纪念，发给朋友，或分享到社交平台。
- 尺寸选项：原始尺寸 / 3:4 两个卡片式选项
- 下载按钮：Save Image / 保存图片

**多语言**：所有文案接入现有 `TRANSLATIONS` 对象，跟随语言切换自动变化。

### 截图内容约束

**截图时需隐藏的元素**（临时隐藏，截图后恢复）
- Header 区域
- Upload 按钮
- Generate Analysis 按钮
- 截图按钮本身

**截图时保留的核心内容**
- 当前问题文字
- 蓝色回答球（含用户输入的文字）
- 黑色背景

### 两种尺寸的渲染逻辑（关键约束）

两种尺寸是**两套完全不同的渲染路径**，不是简单裁剪：

**原始尺寸**
- 直接用 `html2canvas` 截取当前 DOM
- 隐藏 UI 控件后截图，保留横版布局

**3:4 竖版**
- 不裁剪原页面，而是动态生成一个专属隐藏 DOM 节点
- 该节点采用竖版居中布局：
  ```
  ┌─────────────────┐
  │                 │
  │   问题文字       │  居中，大字
  │                 │
  │    蓝色球        │  居中
  │  (回答文字)      │
  │                 │
  │  GiftFactory    │  品牌落款
  └─────────────────┘
  ```
- 问题 + 球垂直排列居中，背景黑色，底部品牌水印
- 再对这个隐藏节点执行 `html2canvas` 截图

> 直接裁剪横版页面到 3:4 会切掉左侧问题文字，视觉效果差，必须用专属竖版布局。

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

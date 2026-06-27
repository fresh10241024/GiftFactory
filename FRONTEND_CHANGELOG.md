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

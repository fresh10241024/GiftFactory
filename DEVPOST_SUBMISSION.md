# 🏆 Hackathon Submission Draft: GiftFactory

这是为您量身定制的 Devpost 黑客松提交文案草稿。您可以直接复制以下中英双语的优质内容填入表单。

---

## 📍 1. Project overview (项目概览)

**Project name (项目名称):**
> GiftFactory: AI-Curated Interactive Web Gifts

**Elevator pitch (一句话介绍 - 限制200字符):**
> *(中文释义：不再使用千篇一律的模板。GiftFactory 通过沉浸式 AI 对话理解您的独特记忆，动态生成一个 100% 定制的交互式网页，作为令人难忘的数字礼物。)*
> 
> No more generic templates. GiftFactory uses an immersive AI chat to understand your unique memories, dynamically generating a 100% custom, interactive webpage as an unforgettable digital gift.

---

## 📍 2. Project details (项目详情)

*(注：这部分通常会有个长篇 Story 描述您的灵感、做法等，如果表单里有，可以填入以下内容)*

**Inspiration (灵感来源):**
> *(中文释义：我们意识到传统的数字礼物通常非常生硬且缺乏情感深度。我们希望创造一种体验，让送礼的过程本身就成为一次回忆之旅，而最终产出的是一件专门为收礼人量身定制的数字艺术品。)*
> 
> We realized that traditional digital gifts are often rigid and lack emotional depth. We wanted to create an experience where the gift-giving process itself is a journey of reflection, and the final output is a piece of digital art tailored specifically to the recipient.

**What it does (产品功能):**
> *(中文释义：GiftFactory 提供了一个沉浸式、极具电影感的聊天界面。用户回答关于他们想要送礼对象的深刻问题，并可以上传承载记忆的照片。我们的 AI 会分析这些输入的情感共鸣，并自动设计、编写和部署一个定制的动画网页（使用诸如新粗野主义或毛玻璃等现代设计风格原型），供收礼人沉浸式探索。)*
> 
> GiftFactory offers an immersive, cinema-like chat interface. Users answer profound questions about the person they are gifting to and can upload memory photos. Our AI analyzes the emotional resonance of these inputs and automatically architects, writes, and deploys a bespoke, animated webpage (using modern design archetypes like Neo-Brutalism or Glassmorphism) that the recipient can explore.

**How we built it (技术实现):**
> *(中文释义：
> - **前端：** 纯原生 JS 搭配 Vite 构建，利用 GSAP 实现电影级动画，Lenis 实现平滑滚动。在全球 CDN Vercel 上部署。
> - **后端：** 托管在 Railway 上的 FastAPI (Python)。
> - **AI 核心：** Anthropic Claude 3.5 & DeepSeek 模型负责策划对话、分析情感，并生成礼物最终的原始 HTML/CSS/JS 代码。
> - **数据库与鉴权：** Supabase 处理安全身份验证和会话状态。
> - **分析/赞助商：** 集成 Novus.ai 进行项目指标追踪。)*
> 
> - **Frontend:** Pure Vanilla JS with Vite, powered by GSAP for cinematic animations and Lenis for smooth scrolling. Deployed globally on Vercel.
> - **Backend:** FastAPI (Python) hosted on Railway.
> - **AI Core:** Anthropic Claude 3.5 & DeepSeek models orchestrate the conversation, analyze emotions, and generate the final raw HTML/CSS/JS code for the gift.
> - **Database & Auth:** Supabase handles secure authentication and session states.
> - **Analytics/Sponsor:** Novus.ai integrated for project metrics.

---

## 📍 3. Built with (建造时使用的技术)

*您可以直接把这些标签一个个填进去：*
> Vite, JavaScript, CSS3, GSAP, Lenis, Python, FastAPI, Supabase, Anthropic-Claude, DeepSeek, Vercel, Railway, Novus.ai

---

## 📍 4. "Try it out" links (“试用”链接)

**Demo Website:**
> `https://gift-factory-1j7w.vercel.app/` (请填入您最终确定的 Vercel 链接)

**GitHub Repo:**
> `https://github.com/fresh10241024/GiftFactory`

---

## 📍 5. Project Media (项目多媒体)

- **Image gallery (图片集):** 建议截取 3-4 张精美的网页截图（比如：暗黑首页、沉浸式对话页、生成分析页的文字排版效果）。推荐按 `3:2` 比例裁剪。
- **Video demo link (视频演示):** 强烈建议您使用屏幕录制软件（带上语音讲解器）录制一段 2 分钟左右的演示视频，上传到 YouTube 填在这里。这对于评委非常重要！

---

## 📍 6. Additional info (补充信息 - 评委可见)

**Do you meet all eligibility criteria outlined in the Hackathon rules? (符合资格吗?)**
> *(中文释义：是的，我们团队符合所有参赛资格要求。所有工作均在黑客松期间开发。)*
> 
> Yes, our team meets all eligibility criteria. All work was developed during the hackathon period.

**When did you begin your project? (什么时候开始的?)**
> May 20, 2026 *(请根据您实际的黑客松开始日期填写)*

**How likely are you to use the product moving forward? (未来使用的可能性?)**
> *(在下拉菜单中选择一个积极的选项，例如 Very Likely)*

**How will this advance your skills, workflow improvement, productivity, etc? (技能提升说明 - 限制255字符):**
> *(中文释义：将 LLM 整合用于动画 HTML/CSS 生成，提升了我们的提示词工程能力。将复杂的 GSAP UI 时间轴与异步 AI 流同步，大幅提升了我们的全栈架构技能。)*
> 
> Integrating LLMs for animated HTML/CSS generation leveled up our prompt engineering. Syncing complex GSAP UI timelines with asynchronous AI streams drastically advanced our full-stack architecture skills, paving the way for faster future workflows.

**Add the public URL to your deployed project:**
> `https://gift-factory-1j7w.vercel.app/`

**🚨 Novus.ai proof of installation (硬性要求！):**
> *(注：截图里强调这是获取奖金的强制要求！请确保您的前端代码里已经安装了 Novus.ai 的追踪代码。如果有独立的仪表盘链接或验证截图，请将截图上传到图床或直接填写您的验证 URL。如果还未在前端植入，请尽快在 `index.html` 的 `<head>` 标签里引入他们的 SDK！)*
> `https://your-novus-dashboard-proof-link.com`

---

## 📍 7. Story (项目故事 - 核心必填)

**Challenges we ran into (我们遇到的挑战):**
> *(中文释义：最大的挑战是处理 AI 输出的不确定性。让大模型（Claude/DeepSeek）稳定生成包含复杂动画的结构化 HTML/CSS 非常困难。我们不得不在后端编写复杂的修复算法来处理被截断的 JSON 或不完整的 HTML 标签。此外，在前端用 GSAP 同步极具电影感的 UI 状态过渡，并让用户在等待 AI“写代码”时还能保持沉浸感，也是一项艰巨的 UX 挑战。)*
> 
> The biggest challenge was managing the non-deterministic nature of LLM outputs. Prompting models (Claude/DeepSeek) to reliably generate structured HTML/CSS with complex animations was incredibly difficult. We had to build a robust parsing layer in the backend to patch truncated JSON and unclosed HTML tags automatically. Additionally, synchronizing cinematic UI state transitions with GSAP on the frontend, while keeping the user immersed during the AI's "code generation" wait time, was a significant UX hurdle.

**Accomplishments that we're proud of (我们引以为傲的成就):**
> *(中文释义：我们最自豪的是实现了“剧本优先”的生成架构：AI 在写代码前会先像导演一样写出“五幕剧”式的分镜计划，这使得生成的网页充满连贯的情感共鸣，而不是干瘪的模板拼凑。同时，我们打造了一个无干扰、极简的对话 UI，配合平滑的图片上传和画廊动画，将冰冷的代码生成包装成了一场温暖的数字情感体验。)*
> 
> We are immensely proud of achieving a "Script-First Generation" architecture: before writing any code, the AI acts as a director, planning a cohesive "5-act" narrative scene-by-scene. This ensures the resulting webpages have genuine emotional resonance rather than feeling like generic templates. We're also proud of our minimalist, distraction-free UI—complete with smooth image uploads and GSAP gallery animations—that transforms cold code generation into a warm, emotional digital experience.

**What we learned (我们学到了什么):**
> *(中文释义：我们学到了针对代码生成的提示词工程（Prompt Engineering）需要极其严格的边界约束和错误恢复机制。在前端，我们深入掌握了如何使用 GSAP 和 Lenis 在现代前端框架中管理复杂的滚动动画和组件生命周期。我们还体会到了前后端分离部署（Vercel 负责前端，Railway 负责 Python AI 后端）在黑客松中带来的极速迭代优势。)*
> 
> We learned that prompt engineering for code generation requires extremely strict constraints and robust error-recovery mechanisms. On the frontend, we deepened our expertise in managing complex scroll animations and component lifecycles using GSAP and Lenis within a modern framework. We also experienced firsthand the massive iteration speed advantage of a decoupled architecture—deploying the static frontend on Vercel while running the heavy Python/AI workloads on Railway.

**What's next for GiftFactory: AI-Curated Interactive Web Gifts (GiftFactory 的下一步计划):**
> *(中文释义：
> 1. 支持更丰富的视觉表现：引入基于 Three.js 的 3D 互动场景。
> 2. 多人协作送礼：允许一群朋友共同加入同一个 AI 会话，贡献各自的记忆，AI 将整合所有人提供的内容生成一个“集体回忆”网页。
> 3. 语音交互：集成语音输入，让口述回忆的过程变得更加亲密和自然。)*
> 
> 1. **Richer Visual Archetypes:** Integrating 3D interactive scenes using Three.js to provide even more diverse gift experiences.
> 2. **Collaborative Gifting:** Allowing multiple friends to join the same AI session and contribute their memories, letting the AI weave them into a single, collective "memory lane" webpage.
> 3. **Voice Integration:** Implementing voice input for memory collection to make the storytelling process feel even more intimate, natural, and expressive.

**Do you meet all eligibility criteria outlined in the Hackathon rules? (符合资格吗?)**
> *(中文释义：是的，我们团队符合所有参赛资格要求。所有工作均在黑客松期间开发。)*
> 
> Yes, our team meets all eligibility criteria. All work was developed during the hackathon period.

**When did you begin your project? (什么时候开始的?)**
> May 20, 2026 *(请根据您实际的黑客松开始日期填写)*

**How likely are you to use the product moving forward? (未来使用的可能性?)**
> *(在下拉菜单中选择一个积极的选项，例如 Very Likely)*

**How will this advance your skills, workflow improvement, productivity, etc? (技能提升说明 - 限制255字符):**
> *(中文释义：将 LLM 整合用于动画 HTML/CSS 生成，提升了我们的提示词工程能力。将复杂的 GSAP UI 时间轴与异步 AI 流同步，大幅提升了我们的全栈架构技能。)*
> 
> Integrating LLMs for animated HTML/CSS generation leveled up our prompt engineering. Syncing complex GSAP UI timelines with asynchronous AI streams drastically advanced our full-stack architecture skills, paving the way for faster future workflows.

**Add the public URL to your deployed project:**
> `https://gift-factory-1j7w.vercel.app/`

**🚨 Novus.ai proof of installation (硬性要求！):**
> *(注：截图里强调这是获取奖金的强制要求！请确保您的前端代码里已经安装了 Novus.ai 的追踪代码。如果有独立的仪表盘链接或验证截图，请将截图上传到图床或直接填写您的验证 URL。如果还未在前端植入，请尽快在 `index.html` 的 `<head>` 标签里引入他们的 SDK！)*
> `https://your-novus-dashboard-proof-link.com`
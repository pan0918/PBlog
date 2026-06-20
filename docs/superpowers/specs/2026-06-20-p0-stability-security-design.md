# P0 设计方案：稳定性 + AI 接口防护

- **日期**: 2026-06-20
- **分支**: `p0-stability-security`
- **范围**: 两个相互独立、可一次性完成的工作流 —— ① 消除"整站白屏" + 错误边界；② AI 聊天接口防护（访客自带 Key 模式）
- **明确移出范围**: `rehype-sanitize`（留言墙已确认安全、文章为站长本人撰写，价值低且会与 KaTeX/highlight 输出冲突）→ 推迟到 P1 内容管线那轮，与 `rehype-slug`/TOC 修复一起做。

---

## 背景与动机

通读源码后确认两个 P0 级问题：

1. **整站可见性完全依赖客户端 JS**：
   - `app/layout.tsx` 用内联 `<style>` 把 `#app-mount-root` 默认设为 `opacity:0; visibility:hidden`，只有当 `SplashScreen` 在 `useEffect` 里给 `<html>` 加 `.splash-seen` 才显示。
   - `components/ThemeProvider.tsx` 在 `mounted` 之前渲染 `<div className="invisible">`。
   - 全项目**无 error boundary**。
   - 综合效果：任一 client 组件在揭开门控前抛错 → 整页白屏（即历史上"Vercel 部署空白页"的同类根因）。

2. **`/api/chat` 是无防护的中继**：
   - 服务端会用前端传入的**任意 `apiBaseUrl`** 发起 `fetch` → 开放中继 / SSRF。
   - 若服务端配置了 key，则任意访客可无限白嫖。
   - 硬编码 `maxOutputTokens:150 / temperature:0.85`，无视 `siteConfig.geminiConfig`。

**部署模式已确认为"访客自带 Key"**：访客在猫宠设置里填自己的 key（存 `sessionStorage`），随请求体发给 `/api/chat`；服务端 env key 仅作兜底。因此防护重点在"封死开放中继/SSRF + 输入校验"，无需重型频率限制。

---

## 工作流 ① 消除整站白屏 + 错误边界

**采用方案 A**：`<head>` 阻塞脚本设主题 + 开屏改纯覆盖层 + 移除全站隐藏门控 + 加错误边界。

### 改动点

1. **`app/layout.tsx`**
   - 在 `<head>` 注入一段**内联阻塞脚本**：首屏绘制前读取 `localStorage['blog-theme']`，据此给 `document.documentElement` 加/去 `dark` 类。默认深色（保持现状：仅 `'light'` 关闭深色）。用 try/catch 包裹，避免隐私模式下 localStorage 抛错。
   - **删除** `#app-mount-root` 的 opacity/visibility 门控样式与 `html.splash-seen` 依赖；`#app-mount-root` 容器保留（或简化），内容随 SSR 直接可见。
   - 保留既有 `suppressHydrationWarning`。

2. **`components/SplashScreen.tsx`**
   - 改为**纯覆盖层语义**：首次会话显示 2 秒后淡出，底层内容始终存在；不再负责"揭开全站"。
   - 移除 `document.documentElement.classList.add('splash-seen')` 逻辑（门控已删）。
   - 保留 `sessionStorage['hasSeenSplash']` 控制"每会话只展示一次"。

3. **`components/ThemeProvider.tsx`**
   - **不再**在 `mounted` 前返回 `invisible` 包裹。
   - 初始 `isDark` 从"已被 head 脚本应用到 `<html>` 的 class"读取（`document.documentElement.classList.contains('dark')`），消除闪烁与水合不一致。
   - `toggleTheme` 行为不变（写 `localStorage`、切换 class）。

4. **新增错误边界（猫宠风格兜底页）**
   - `app/error.tsx`（路由级，`"use client"`，含"重试/回首页"）。
   - `app/global-error.tsx`（根级，兜底整个 `<html>`）。
   - `app/not-found.tsx`（404 页，统一风格）。

### 结果
- JS 失败/报错也能看到内容（SSR 兜底）。
- 主题首屏零闪烁，且不靠"隐藏全站"实现。
- 开屏纯装饰，不再是白屏单点故障。

---

## 工作流 ② AI 接口防护（BYO 模式）

### 改动点

1. **`app/api/chat/route.ts`**
   - **`apiBaseUrl` 白名单**：仅允许白名单 host（默认 `generativelanguage.googleapis.com`、`api.openai.com`，外加 `siteConfig` 中可配置的兼容端点）。非白名单 → `400`。
   - **同源校验**：校验 `Origin`/`Referer` 的 host 属于本站请求 host，否则 `403`（无来源头时按宽松策略放行，避免误伤正常 SSR/无头场景，但跨站明确拒绝）。
   - **输入限制**：`message` 为非空字符串且 ≤ 2000 字；`history` 为数组且截断到 ≤ 10 条、逐条校验 `role/content` 类型与长度；整体防御性 try/catch。
   - **读配置**：`maxOutputTokens`/`temperature` 取自 `siteConfig.geminiConfig`，去除硬编码。
   - 保留对 Gemini 与 OpenAI 兼容两种格式的支持。

2. **`siteConfig.ts`**
   - 新增 `petConfig.allowedApiHosts: string[]`（或 `geminiConfig.allowedHosts`），集中维护白名单，便于站长扩展自托管端点。

3. **`components/CyberCat.tsx`**
   - 修正 `hasApiKey` 中对 `process.env.PET_API_KEY`/`process.env.GEMINI_API_KEY` 的**客户端误用**（非 `NEXT_PUBLIC_` 前缀，客户端恒为 `undefined`）。BYO 模式下指示器以 `!!config.apiKey` 为准。

### 约定
- **建议服务端不要配置 `GEMINI_API_KEY`**，保持纯 BYO；若未来要"统一 Key"，需另起一轮加频率限制。
- 频率限制：BYO 下无站长额度可烧，且 Vercel serverless 内存限流为 best-effort → 本轮不做。

---

## 影响文件

| 文件 | 改动 |
|---|---|
| `app/layout.tsx` | head 主题脚本；移除可见性门控 |
| `components/SplashScreen.tsx` | 改纯覆盖层；移除 splash-seen 揭示逻辑 |
| `components/ThemeProvider.tsx` | 移除 invisible 包裹；从 class 初始化 isDark |
| `app/error.tsx`（新增） | 路由级错误边界 |
| `app/global-error.tsx`（新增） | 根级错误边界 |
| `app/not-found.tsx`（新增） | 404 页 |
| `app/api/chat/route.ts` | 白名单 + 同源 + 输入限制 + 读配置 |
| `siteConfig.ts` | 新增 host 白名单字段 |
| `components/CyberCat.tsx` | 修 hasApiKey 客户端误用 |

各改动互不冲突，可在同一分支一次性完成。

---

## 风险

- **低-中**。主要风险是主题首屏脚本的水合一致性 → 由 `suppressHydrationWarning` + "从已应用 class 初始化" 规避。
- 错误边界为新增文件，不影响既有路径。
- API 同源校验需对"无 Origin/Referer"场景宽松，避免误伤。

## 验证标准（本地 `next dev` / `next build`）

1. 首次访问展示开屏 2s 后淡出；二次访问（同会话）不再展示。
2. 切换深/浅色后**刷新页面无闪烁**。
3. **禁用 JS** 后页面仍显示内容（SSR 可见）。
4. 人为在某 client 组件抛错 → 显示错误边界兜底页，而非白屏。
5. `next build` 通过，无类型/构建错误。
6. `/api/chat`：
   - `apiBaseUrl` 为非白名单 host → `400`。
   - 跨源请求（伪造 `Origin` 为他站）→ `403`。
   - 超长 `message` → `400`。
   - 正常 BYO 请求 → 正常返回。

## 回滚

所有改动在 `p0-stability-security` 分支；如有问题可弃用该分支回到 `main`。

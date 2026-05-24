# PBlogs - 个人博客系统

基于 Next.js 16 + React 19 + Tailwind CSS v4 的毛玻璃风格个人博客。

---

## 快速开始

```bash
cd PBlogs
npm install
npm run dev
# 访问 http://localhost:3000
```

---

## 项目结构

```
PBlogs/
├── app/                        # 页面路由 (Next.js App Router)
│   ├── layout.tsx              # 根布局 - 所有 Provider 和背景层在这里组装
│   ├── page.tsx                # 首页 - 网格布局，组装所有首页组件
│   ├── globals.css             # 全局样式 - Tailwind v4 + 毛玻璃基础
│   ├── posts/[slug]/page.tsx   # 文章详情页 (Server Component)
│   ├── moments/page.tsx        # 说说/碎碎念
│   ├── chatter/                # 杂谈 (列表 + 详情)
│   ├── timeline/page.tsx       # 归档时间线
│   ├── photowall/page.tsx      # 照片墙
│   ├── music/page.tsx          # 音乐播放器
│   ├── projects/page.tsx       # 项目展示
│   ├── friends/page.tsx        # 友链
│   ├── about/page.tsx          # 关于页
│   └── api/                    # API 路由 (AI 猫猫、Gitalk OAuth)
│
├── components/                 # 所有 UI 组件
│   ├── ThemeProvider.tsx        # 暗黑模式上下文 (核心，几乎所有组件依赖)
│   ├── MusicProvider.tsx        # 音乐播放上下文
│   ├── ToastProvider.tsx        # 提示消息上下文
│   ├── Navbar.tsx               # 导航栏 (PC 顶栏 + 手机端圆盘菜单)
│   ├── ProfileCard.tsx          # 首页个人信息卡片
│   ├── CloudPlayer.tsx          # 首页音乐卡片
│   ├── SearchBar.tsx            # 搜索栏
│   ├── ThemeToggleBlock.tsx     # 主题切换卡片
│   ├── SplashScreen.tsx         # 开屏动画
│   ├── BackgroundEffects.tsx    # 背景特效容器
│   ├── Fireflies.tsx            # 萤火虫 (暗色模式)
│   ├── Sakura.tsx               # 樱花 (亮色模式)
│   ├── WindyGrass.tsx           # 摇曳草地
│   ├── BackgroundSlider.tsx     # 背景图轮播
│   ├── DanmakuBackground.tsx    # 弹幕背景
│   ├── CyberCat.tsx             # AI 猫猫助手
│   ├── Comments.tsx             # Gitalk 评论
│   ├── ClickEffect.tsx          # 点击粒子特效
│   ├── GlobalToolbox.tsx        # 浮动工具箱 (计算器)
│   ├── FloatingPlayer.tsx       # 浮动迷你播放器
│   ├── MusicPlayer.tsx          # 完整音乐播放器
│   ├── SiteDashboard.tsx        # 底部状态栏 (时钟/运行时间/徽章)
│   ├── ClientTOC.tsx            # 文章目录
│   ├── BackButton.tsx           # 返回按钮
│   ├── PageTransition.tsx       # 页面过渡动画
│   └── ...
│
├── data/                       # 静态数据
│   ├── albums.ts               # 相册数据
│   ├── projects.ts             # 项目数据
│   └── friends.ts              # 友链数据
│
├── posts/                      # 博客文章 (Markdown)
├── moments/                    # 说说 (Markdown)
├── chatters/                   # 杂谈 (Markdown)
├── app/about/about.md          # 关于页内容
└── siteConfig.ts               # 全站配置中心 ← 重点修改这个文件
```

---

## 核心配置文件: siteConfig.ts

这是整个博客的"控制中心"，几乎所有组件都从这里读取配置。

```typescript
// siteConfig.ts
export const siteConfig = {
  // === 基本信息 ===
  title: "PB の 宝藏之地",        // 网站标题 (浏览器标签)
  authorName: "PB",              // 博主名字
  bio: "一个热爱技术的普通人",      // 个人简介
  avatarUrl: "...",              // 头像 URL
  faviconUrl: "...",             // 浏览器图标 URL

  // === 导航栏 ===
  navTitle: "PB",                // 导航栏左侧文字
  navSuffix: "の",               // 分隔符
  navAfter: "宝藏之地",           // 导航栏右侧文字

  // === 背景 ===
  useGradient: false,            // true=渐变色背景, false=图片轮播
  themeColors: ["#a18cd1", ...], // 渐变色组合
  bgImages: ["url1", "url2", ...], // 背景图片数组 (useGradient=false 时生效)

  // === 社交链接 ===
  social: {
    github: "",
    email: "your@email.com",
    qq: "",
    wechat: "",
  },

  // === 音乐 (网易云音乐 ID) ===
  cloudMusicIds: ["1809646618", ...],

  // === 弹幕文字 ===
  danmakuList: ["在干嘛呢？", ...],

  // === Gitalk 评论 (需配置 OAuth) ===
  gitalkConfig: {
    clientID: "",
    clientSecret: "",
    repo: "",           // 存储评论的 GitHub 仓库
    owner: "",          // GitHub 用户名
    admin: [""],
  },

  // === AI 猫猫 (Gemini API) ===
  geminiConfig: {
    modelId: "gemini-2.5-flash-lite",
    systemPrompt: "你是一只傲娇的猫...",
  },

  // === 底部 ===
  buildDate: "2026-05-21T00:00:00",  // 建站日期 (影响运行时间计算)
  icpConfig: { name: "", link: "" },  // 备案号
};
```

---

## 写文章

在 `posts/` 目录下创建 `.md` 文件即可：

```markdown
---
title: "文章标题"
date: "2026-05-21"
description: "文章描述，会显示在首页和搜索结果中"
tags: ["标签1", "标签2"]
cover: "https://...封面图URL"
---

正文内容，支持标准 Markdown 语法。

## 二级标题

支持代码高亮：
\```python
print("Hello World")
\```

支持数学公式：
$E = mc^2$

$$
\int_{0}^{1} x^2 dx = \frac{1}{3}
$$
```

**文件名即 URL**：`posts/hello-world.md` → 访问 `/posts/hello-world`

---

## 说说 / 杂谈

### 说说 (moments/)

```markdown
---
title: "今天的心情"
date: "2026-05-21"
mood: "开心"
weather: "晴天"
---
说说内容...
```

### 杂谈 (chatters/)

```markdown
---
title: "杂谈标题"
date: "2026-05-21"
description: "简短描述"
tags: ["标签"]
cover: "封面图URL"
---
正文内容...
```

---

## 修改静态数据

### 相册 (data/albums.ts)

```typescript
export const albums: Album[] = [
  {
    id: "my-album",
    title: "相册标题",
    description: "相册描述",
    cover: "封面图URL",
    date: "2026.05",
    photos: [
      { url: "图片URL", caption: "图片说明" },
    ],
  },
];
```

### 项目 (data/projects.ts)

```typescript
export const projectsData: Project[] = [
  {
    id: "proj_1",
    name: "项目名称",
    description: "项目描述",
    icon: "🚀",
    githubUrl: "https://github.com/...",
    tags: ["React", "TypeScript"],
  },
];
```

### 友链 (data/friends.ts)

```typescript
export const friendsData: Friend[] = [
  {
    id: "friend-1",
    name: "友链名称",
    description: "简介",
    avatar: "头像URL",
    url: "https://...",
    themeColor: "rgba(99, 102, 241, 0.5)",
  },
];
```

---

## 组件层级关系 (layout.tsx 组装顺序)

理解这个很重要，改组件时要知道谁依赖谁：

```
layout.tsx
  └── ThemeProvider          ← 最底层，所有组件的暗黑模式都靠它
       ├── SplashScreen      ← 开屏动画，2秒后消失
       ├── MusicProvider     ← 音乐全局状态
       │    ├── 背景层
       │    │    ├── BackgroundSlider     ← 背景图轮播
       │    │    ├── 渐变色叠加层
       │    │    ├── 模糊光晕层
       │    │    └── BackgroundEffects   ← 暗色=萤火虫, 亮色=樱花
       │    ├── DanmakuBackground        ← 弹幕 (仅桌面端)
       │    ├── {children}               ← 页面内容
       │    ├── FloatingPlayer           ← 浮动音乐播放器 (仅桌面端)
       │    ├── GlobalToolbox            ← 工具箱 (仅桌面端)
       │    ├── MobileBackButton         ← 手机端返回键
       │    └── ClickEffect              ← 点击特效 (仅桌面端)
       └── CyberCat                     ← AI 猫猫 (仅桌面端)
```

---

## 常用修改指南

### 换主题色

修改 `siteConfig.ts` 中的 `themeColors`，以及 `globals.css` 中的 `--tw-*` 相关样式。

### 去掉某个背景特效

在 `app/layout.tsx` 中注释掉对应组件：
```tsx
// <BackgroundSlider />        ← 去掉背景轮播
// <BackgroundEffects />       ← 去掉萤火虫/樱花/草地
// <DanmakuBackground />       ← 去掉弹幕
```

### 去掉 AI 猫猫

在 `app/layout.tsx` 中注释：
```tsx
// <CyberCat />
```

### 去掉音乐播放器

1. 在 `app/layout.tsx` 注释：
```tsx
// <MusicProvider>
//   ...
//   <FloatingPlayer />
// </MusicProvider>
```

2. 在 `components/CloudPlayer.tsx` 中可以替换为空占位组件。

### 去掉开屏动画

在 `app/layout.tsx` 注释：
```tsx
// <SplashScreen />
```

### 去掉手机端圆盘菜单

在 `components/Navbar.tsx` 中，找到手机端部分（`md:hidden`），整块删除即可。

### 修改导航栏链接

在 `components/Navbar.tsx` 中修改 `navLinks` 数组。

### 添加新页面

1. 在 `app/` 下创建目录和 `page.tsx`
2. 在 `Navbar.tsx` 的 `navLinks` 中添加链接
3. 参照已有页面的模式（用 `Navbar` + `PageTransition` 包裹）

---

## 环境变量 (可选)

在项目根目录创建 `.env.local`：

```bash
# Gemini API Key (AI 猫猫助手)
GEMINI_API_KEY=your-api-key-here
```

Gitalk 的 OAuth 配置直接写在 `siteConfig.ts` 中即可。

---

## 技术栈版本

| 依赖 | 版本 |
|------|------|
| Next.js | 16.2.1 |
| React | 19.2.4 |
| Tailwind CSS | v4 |
| TypeScript | 5.x |
| Framer Motion | 12.x |
| highlight.js | 11.x |
| KaTeX | 0.16.x |

---

## 部署

推荐部署到 Vercel：

```bash
# 1. 初始化 Git
git init && git add . && git commit -m "first commit"

# 2. 推送到 GitHub
git remote add origin https://github.com/your-username/blog.git
git push -u origin main

# 3. 在 Vercel 导入仓库，框架选 Next.js，点击 Deploy
```

自定义域名：在 Vercel Settings → Domains 中添加你的域名，然后在域名服务商添加 DNS 解析。

---

## 关键设计模式

### 毛玻璃卡片样式

所有卡片统一使用这个样式模式：
```
bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl rounded-3xl
```

### Server/Client 组件分工

- **Server Component** (默认)：读取文件系统、处理 Markdown、传递数据给客户端
- **Client Component** (`"use client"`)：处理交互、动画、状态

例如 `app/posts/[slug]/page.tsx` 是 Server Component，它读取 Markdown 文件、渲染成 HTML，然后把 HTML 传给客户端组件渲染。

### ThemeProvider 模式

自定义 `ThemeProvider` 而非 `next-themes`，通过 `localStorage` 持久化，避免 hydration 闪烁。所有需要暗黑模式的组件用 `useTheme()` 获取 `isDark`。

# PBlogs - 个人博客系统

基于 Next.js 16 + React 19 + Tailwind CSS v4 的毛玻璃风格个人博客。内容存放在 Turso（libSQL）数据库，后台在 `/admin` 维护，部署在 Vercel。

---

## 快速开始

```bash
cd PBlog
npm install
npm run dev      # 访问 http://localhost:3000
npm test         # 运行 tests/ 下的全部测试
npm run lint
```

本地开发需要先配置 `.env.local`（见下文「环境变量」）。

---

## 项目结构

```
PBlog/
├── app/                        # 页面路由 (Next.js App Router)
│   ├── layout.tsx              # 根布局 - Provider、背景层、导航栏、装饰组件
│   ├── page.tsx                # 首页
│   ├── posts/[[...slug]]/      # 文章详情页（含 not-found.tsx）
│   ├── moments/                # 说说
│   ├── chatter/                # 留言墙（访客留言，后台审核后展示）
│   ├── timeline/               # 归档时间线
│   ├── photowall/              # 照片墙
│   ├── music/                  # 音乐播放器
│   ├── projects/ friends/      # 项目展示 / 友链
│   ├── about/                  # 关于页（内容在 about.md）
│   ├── admin/                  # 后台管理系统
│   └── api/                    # API：后台 CRUD、访客账号、评论、留言、歌曲、AI 猫猫
│
├── components/                 # UI 组件
│   ├── ThemeProvider.tsx       # 暗黑模式上下文
│   ├── MusicProvider.tsx       # 全局音乐播放状态
│   ├── SiteChrome.tsx          # 前台导航栏（跨页面保持挂载）
│   ├── Navbar.tsx              # 导航栏 (PC 顶栏 + 手机端圆盘菜单)
│   ├── ClientDecorations.tsx   # 背景特效、弹幕、浮动播放器、工具箱、点击特效、AI 猫猫
│   ├── Comments.tsx            # 文章评论入口（原生评论系统）
│   ├── comments/ account/      # 评论区、登录注册、个人资料
│   └── ...
├── lib/
│   ├── db/                     # 各张表的数据库访问
│   ├── posts.ts markdown.ts    # 文章查询与 Markdown 渲染
│   ├── images/cdn.ts           # 图床（图片 / 音乐）地址改写与按尺寸压缩
│   ├── datetime.ts             # 统一按 Asia/Shanghai 格式化日期
│   ├── admin/ public-auth/     # 后台鉴权、访客账号、限流
│   └── schema.sql              # 数据库结构
├── scripts/                    # 数据库初始化、迁移、回填脚本
├── tests/                      # Node 测试
└── siteConfig.ts               # 全站配置中心
```

---

## 核心配置文件: siteConfig.ts

几乎所有组件都从这里读取配置：

```typescript
export const siteConfig = {
  title: "Frud's Blog",          // 网站标题
  authorName: "Frud_",           // 博主名字（也是评论区「作者」的名字）
  bio: "...",                    // 个人简介
  avatarUrl: "...",              // 头像
  faviconUrl: "...",             // 浏览器图标

  navTitle / navSuffix / navAfter, // 导航栏文字

  useGradient: true,             // true=渐变色背景, false=bgImages 图片轮播
  themeColors: [...],            // 渐变色
  bgImages: [...],               // 背景图（useGradient=false 时生效）
  defaultPostCover: "...",       // 文章没有封面时的默认图

  assetCdn: { ... },             // 图片 / 音乐加速，见下文

  social: { github, email, qq, wechat, twitter, xiaohongshu },
  chatterTitle / chatterDescription, // 留言墙标题
  danmakuList: [...],            // 弹幕文字
  buildDate: "2026-05-21T00:00:00",  // 建站日期（运行时间）

  siteUrl: "https://www.aibrium.cn", // 正式地址，用于 sitemap 和分享预览
  aiConfig: { model, monthlyBudgetUsd }, // DeepSeek 模型和访客功能每月费用上限（美元）
  petConfig: { ... },            // AI 猫猫「煤球」的人设和主动消息
};
```

---

## 内容管理

文章、说说、相册、项目、友链、歌曲都存放在数据库，请在后台管理系统 `/admin` 中维护。保存后会自动刷新前台对应页面的缓存。

- **文章**：Vditor 编辑器，支持 Markdown、数学公式、代码高亮、图片上传（直传图床）、快捷保存、全屏写作和本地草稿。摘要旁的「AI 生成摘要和标签」按钮会根据正文生成摘要（同时用作搜索引擎描述）和标签，已有的标签自动勾选，新标签点一下才会创建。
- **AI 用量**：仪表盘显示本月 AI 调用次数和估算花费。访客聊天超过 `aiConfig.monthlyBudgetUsd` 后煤球暂停聊天，下个月自动恢复；后台写作辅助不计入额度。调用记录存在 `ai_usage_logs` 表，首次调用时自动创建，无需手动迁移。
- **说说**：保存为草稿后再发布时，会记录第一次发布的时间。
- **留言墙**：访客提交后进入待审核，在后台通过后才展示；同一 IP 10 分钟最多 3 条、1 小时最多 10 条。
- **评论 / 用户**：文章下方的原生评论系统，访客注册登录后评论、回复、点赞；后台可隐藏评论、禁言或封禁用户。

所有前台日期统一按北京时间（`Asia/Shanghai`）显示，见 `lib/datetime.ts`。

---

## 图片与音乐加速

图片和音乐都存放在图床（CloudFlare-ImgBed，部署在 Cloudflare Pages，文件存在 HuggingFace）里。加载慢主要有两个原因：

1. `pages.dev` 域名在国内经常被 DNS 污染或限速；
2. 图床每次请求都会现场去 HuggingFace 取文件，Cloudflare 边缘并不缓存，而且原图往往有好几 MB。

解决办法是给图床绑定自己的域名，并开启 **Cloudflare Image Transformations**：浏览器按显示尺寸请求图片，Cloudflare 第一次回源后转成 AVIF/WebP 并缓存在边缘，之后直接从边缘返回。小卡片只下载、解码几十 KB 的小图，页面更流畅，手机也不容易发热。音乐会一并走自己的域名，并支持分段加载（拖动进度条只下载需要的部分）。

所有改写逻辑都在 `lib/images/cdn.ts`。`siteConfig.assetCdn` 留空时完全不生效，可以分步开启。

### 0. 把域名的 DNS 交给 Cloudflare

博客域名 `aibrium.cn` 在阿里云注册，博客本身部署在 Vercel。要在 Cloudflare 上给图床绑定子域名、开启图片转换，域名的 **DNS 解析** 需要放在 Cloudflare（域名仍在阿里云注册，博客仍在 Vercel）：

1. Cloudflare 控制台 → 添加域 → `aibrium.cn` → Free 计划；
2. 核对导入的 DNS 记录：`aibrium.cn`（A 记录指向 Vercel）和 `www`（CNAME 指向 Vercel）必须设为 **仅 DNS（灰色云朵）**；
3. 阿里云 → 域名 → 管理 → DNS 修改，把 DNS 服务器换成 Cloudflare 给的两个；
4. 等 Cloudflare 显示域名「活动」，并确认 Vercel → Settings → Domains 仍为 Valid Configuration。

### 1. 给图床绑定自己的域名

Cloudflare 控制台 → Workers & Pages → `cloudflare-imgbed` → **自定义域（Custom domains）** → 添加 `img.aibrium.cn`。不要提前手动添加 CNAME，让 Pages 自动创建，否则会出现 522 错误。旧的 `pages.dev` 地址继续可用，数据库里的链接不需要改。

### 2. 开启图片转换（可选，但效果最明显）

Cloudflare 控制台 → **Images → Transformations** → 选择 `aibrium.cn` → **Enable for zone**。在 **Sources** 中保持「仅允许的来源」，并把 `img.aibrium.cn` 加入允许列表。

免费套餐每月包含 **5,000 个不同的转换**（同一张图的同一尺寸只算一次，个人博客远远用不完）。超出后，已缓存的图片照常返回；新的转换会失败，此时代码里的 `onerror=redirect` 会自动回退到原图，不会出现裂图。用量可以在 Images → Transformations 页面查看。

如果图床开启了防盗链（Referer 白名单），记得把博客域名加进去。

### 3. 修改 siteConfig.ts 并重新部署

```typescript
assetCdn: {
  imageOrigins: ["https://a68b43cc.cloudflare-imgbed-9pz.pages.dev", "https://cloudflare-imgbed-9pz.pages.dev", "https://img.aibrium.cn"],
  imageHost: "/media",                         // 经博客域名转发（见下文「为什么要经 Vercel 转发」）
  imageTransformHost: "/media",                // 开启了图片转换就填，和 imageHost 相同；没开启就留空
  mediaProxyOrigin: "https://img.aibrium.cn",  // /media 转发到的图床域名（第 1 步绑定的）
},
```

部署后在浏览器开发者工具的 Network 面板检查：

- 图片地址变成 `https://www.aibrium.cn/media/cdn-cgi/image/width=...`，`content-type` 为 `image/avif` 或 `image/webp`；
- 刷新后响应头 `x-vercel-cache` 为 `HIT`；
- 音乐地址变成 `https://www.aibrium.cn/media/file/...mp3`。

### 为什么要经 Vercel 转发

国内访问 Cloudflare 免费套餐通常被分配到美国节点，晚高峰实测只有几 KB/s；同一时间访问 Vercel（新加坡节点）有几百 KB/s。所以浏览器只访问博客自己的域名 `/media/...`，由 `next.config.ts` 的 rewrites 转发到 `img.aibrium.cn`：Cloudflare 负责压缩和缓存，Vercel 负责把文件送到国内访客手里，并按图床返回的缓存头把文件缓存在 Vercel 的节点上。

代价是图片和音乐的流量计入 Vercel 免费额度（每月 100 GB Fast Data Transfer，个人博客通常用不完，可在 Vercel 控制台 Usage 页查看）。想改回直连，把 `imageHost`、`imageTransformHost` 改成 `"https://img.aibrium.cn"` 即可。

### 其他已做的加载优化

- 首页大图、文章封面优先加载（`fetchpriority="high"`），其余图片懒加载、异步解码；
- 文章正文图片自动生成 `srcset`，按正文宽度加载；
- 网易云封面使用其 CDN 自带的缩放参数（`?param=`）；
- `/api/songs` 播放列表走缓存，后台修改歌曲后自动刷新；
- 网站图标使用 64px 的压缩版（原图约 1 MB）。

长期来看，如果首次加载仍然偏慢，可以把图床的存储渠道从 HuggingFace 换成 Cloudflare R2（CloudFlare-ImgBed 原生支持），回源会快很多。

---

## 组件层级关系 (layout.tsx 组装顺序)

```
layout.tsx
  └── ThemeProvider              ← 暗黑模式
       └── EffectQualityProvider ← 按设备性能 / 减少动画偏好调节特效
            ├── SplashScreen     ← 开屏动画
            └── MusicProvider    ← 音乐全局状态
                 ├── 背景层：BackgroundSlider（useGradient=false 时）、渐变色、光晕
                 ├── ClientDecorations   ← 背景特效、弹幕、浮动播放器、工具箱、
                 │                          手机返回键、点击特效、AI 猫猫（后台页面不显示）
                 └── ToastProvider
                      ├── SiteChrome     ← 导航栏（后台页面不显示）
                      └── {children}     ← 页面内容
```

---

## 常用修改指南

### 换主题色

修改 `siteConfig.ts` 中的 `themeColors`，以及 `app/globals.css` 中的颜色变量。

### 去掉某个装饰组件

在 `components/ClientDecorations.tsx` 中删除对应的行：

```tsx
<BackgroundEffects />   // 萤火虫 / 樱花
<DanmakuBackground />   // 弹幕
<FloatingPlayer />      // 浮动音乐播放器
<GlobalToolbox />       // 工具箱
<ClickEffect />         // 点击特效
<CyberCat />            // AI 猫猫
```

开屏动画在 `app/layout.tsx` 中的 `<SplashScreen />`。

### 修改导航栏链接

在 `components/Navbar.tsx` 中修改 `navLinks` 数组；手机端圆盘菜单在同一文件的 `md:hidden` 部分。

### 添加新页面

1. 在 `app/` 下创建目录和 `page.tsx`，内容用 `PageTransition` 包裹（导航栏已在根布局中统一挂载，页面里不要再放 `<Navbar />`）；
2. 在 `Navbar.tsx` 的 `navLinks` 中添加链接。

---

## 环境变量

本地放在 `.env.local`；Vercel 部署时在 Project Settings → Environment Variables 配置同名变量。

```bash
# 数据库（必填）
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# 后台与访客登录 JWT（必填，至少 32 位随机字符串）
JWT_SECRET=...
JWT_EXPIRES_IN=7d                  # 可选，后台登录有效期

# 图床上传（后台上传图片、访客头像、照片墙缩略图）
IMAGE_BED_TOKEN=...
IMAGE_BED_BASE_URL=...             # 可选，默认 https://a68b43cc.cloudflare-imgbed-9pz.pages.dev
IMAGE_BED_UPLOAD_CHANNEL=...       # 可选，默认 huggingface

# AI 功能（可选）：煤球聊天、后台一键生成摘要和标签
DEEPSEEK_API_KEY=...               # 不填时煤球只会回复固定文案，后台 AI 按钮不可用

# 仅 scripts/seed-admin.ts 使用
ADMIN_INIT_USERNAME=admin
ADMIN_INIT_PASSWORD=...
```

---

## 数据库脚本

```bash
npx tsx scripts/init-db.ts          # 建表（幂等，可重复执行）
npx tsx scripts/seed-admin.ts       # 创建后台管理员
npm run migrate:comments            # 评论系统相关表迁移
npm run photos:backfill             # 为旧照片补生成缩略图 / 预览图
```

---

## 技术栈版本

| 依赖 | 版本 |
|------|------|
| Next.js | 16.2.1 |
| React | 19.2.4 |
| Tailwind CSS | v4 |
| TypeScript | 5.x |
| Framer Motion | 12.x |
| Turso / libSQL | @libsql/client 0.17 |
| highlight.js | 11.x |
| KaTeX | 0.16.x |

---

## 部署

推荐部署到 Vercel：推送到 GitHub 后在 Vercel 导入仓库，框架选 Next.js，配置好环境变量即可。构建时会读取数据库预渲染页面，所以 `TURSO_DATABASE_URL` 和 `TURSO_AUTH_TOKEN` 必须在构建环境中可用。

自定义域名：在 Vercel Settings → Domains 中添加域名，然后在 Cloudflare 添加对应的 DNS 记录。

---

## 关键设计模式

### 毛玻璃卡片样式

```
bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl rounded-3xl
```

### Server/Client 组件分工

- **Server Component**（默认）：读取数据库、渲染 Markdown、传递数据给客户端；
- **Client Component**（`"use client"`）：交互、动画、状态。

例如 `app/posts/[[...slug]]/page.tsx` 在服务端读取文章、用 `lib/markdown.ts` 渲染成 HTML 再交给页面展示；文章不存在时返回 404。

### 缓存

文章列表、首页统计用 `unstable_cache` 缓存，页面用 ISR；后台保存内容时通过 `lib/admin/revalidate.ts` 刷新相关页面。数据库查询出错时会直接抛错而不是返回空数据，这样一次临时故障不会把「文章不存在」或空列表写进缓存，线上会继续提供上一次成功生成的页面。

### ThemeProvider 模式

自定义 `ThemeProvider` 而非 `next-themes`，通过 `localStorage` 持久化，并在 `<head>` 中提前设置主题 class，避免闪烁。需要暗黑模式的组件用 `useTheme()` 获取 `isDark`。

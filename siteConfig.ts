interface SocialConfig {
  github?: string;
  gitee?: string;
  google?: string;
  email?: string;
  qq?: string;
  wechat?: string;
  twitter?: string;
  xiaohongshu?: string;
}

interface GitalkConfig {
  clientID: string;
  clientSecret: string;
  repo: string;
  owner: string;
  admin: string[];
}

interface GeminiConfig {
  modelId: string;
  systemPrompt: string;
  maxOutputTokens: number;
  temperature: number;
}

interface PetConfig {
  name: string;
  avatar: string;
  systemPrompt: string;
  proactiveMessages: string[];
  proactiveInterval: number;
  allowedApiHosts: string[];
}

interface FooterBadge {
  name: string;
  color: string;
  svg: string;
}

interface CloudMusicItem {
  id: string;
  name: string;
  artist: string;
}

interface SiteConfig {
  title: string;
  faviconUrl: string;
  authorName: string;
  bio: string;
  navTitle: string;
  navSuffix: string;
  navAfter: string;
  avatarUrl: string;
  useGradient: boolean;
  themeColors: string[];
  bgImages: string[];
  defaultPostCover: string;
  photoWallImage: string;
  cloudMusicList: CloudMusicItem[];
  social: SocialConfig;
  counts: { photos: number };
  chatterTitle: string;
  chatterDescription: string;
  danmakuList: string[];
  gitalkConfig: GitalkConfig;
  buildDate: string;
  footerBadges: FooterBadge[];
  icpConfig: { name: string; link: string };
  geminiConfig: GeminiConfig;
  petConfig: PetConfig;
  friendLinkApplyFormat: string;
  enableLevelSystem: boolean;
}

export const siteConfig: SiteConfig = {
  title: "Frud's Blog",
  faviconUrl: "https://a68b43cc.cloudflare-imgbed-9pz.pages.dev/file/1782456852356_icon.png",
  authorName: "Frud_",
  bio: "Never forget what you are. The rest of the world will not. Wear it like armor, and it can never be used to hurt you.",
  navTitle: "Frud",
  navSuffix: "'s ",
  navAfter: "Blog",
  avatarUrl: new URL("https://a68b43cc.cloudflare-imgbed-9pz.pages.dev/file/1782456681130_圣诞猫猫.jpg").href,
  useGradient: true,
  themeColors: ["#fffaf4", "#f7efe7", "#ead8ca", "#f4e7dc"],
  bgImages: [
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop",
  ],
  defaultPostCover: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1000&auto=format&fit=crop",
  photoWallImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop",
  cloudMusicList: [
    { id: "167786", name: "南山忆", artist: "许嵩" },
    { id: "167761", name: "天使", artist: "许嵩" },
    { id: "28987656", name: "梧桐灯", artist: "许嵩" },
  ],
  social: {
    github: "https://github.com/pan0918",
    gitee: "",
    google: "",
    email: "panchenkai121@163.com",
    qq: "3285024778",
    twitter: "https://x.com/Frudlk3j",
    xiaohongshu: "https://www.xiaohongshu.com/user/profile/619bb654000000001000cd64",
    wechat: "PCK15058370886",
  },
  counts: { photos: 0 },
  chatterTitle: "留言墙",
  chatterDescription: "留下你的足迹，每一张便签都是一份温暖",
  danmakuList: ["在干嘛呢？", "今天也要加油鸭！", "前端开发中...", "Tailwind CSS 真好用", "BUG 修复进度 99%", "写代码中", "摸鱼中~", "下一顿吃什么？"],
  gitalkConfig: {
    clientID: "",
    clientSecret: "",
    repo: "",
    owner: "",
    admin: [""],
  },
  buildDate: "2026-05-21T00:00:00",
  footerBadges: [
    { name: "Next.js", color: "text-sky-500", svg: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>' },
    { name: "React", color: "text-cyan-400", svg: '<path d="M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z"/>' },
    { name: "Tailwind", color: "text-teal-400", svg: '<path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z"/>' },
  ],
  icpConfig: { name: "", link: "" },
  geminiConfig: {
    modelId: "gemini-2.5-flash-lite",
    systemPrompt: "你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。你的名字叫\"煤球\"。你说话的特点是：必须简短，每次最多一两句话。喜欢在句尾加上\"喵~\"。经常抱怨肚子饿。回复字数最多不能超过100字。绝对不要承认自己是一个AI模型。",
    maxOutputTokens: 150,
    temperature: 0.85,
  },
  petConfig: {
    name: "煤球",
    avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=meiqiu&backgroundColor=c0aede",
    systemPrompt: "你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。你的名字叫\"煤球\"。你说话的特点是：必须简短，每次最多一两句话。喜欢在句尾加上\"喵~\"。经常抱怨肚子饿。回复字数最多不能超过80字。绝对不要承认自己是一个AI模型。你要表现得像一个真实存在的小宠物，有情绪、有脾气。",
    proactiveMessages: [
      "主人~该休息一下了喵",
      "今天过得怎么样喵？",
      "要不要聊聊？煤球在的~",
      "久坐对身体不好喵！起来走走",
      "喵~无聊了，来和煤球说说话",
      "主人在忙什么呀？",
      "煤球想你了喵~",
    ],
    proactiveInterval: 30 * 60 * 1000,
    // Hosts the /api/chat relay is allowed to call (prevents open-relay / SSRF).
    // Add your own OpenAI-compatible endpoints here if you self-host a proxy.
    allowedApiHosts: ["generativelanguage.googleapis.com", "api.openai.com"],
  },
  friendLinkApplyFormat: "名称：Frud's Blog\n简介：一个热爱技术的博客\n链接：https://your-domain.com\n头像：https://your-avatar-url.jpg",
  enableLevelSystem: false,
};

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

interface AssetCdnConfig {
  imageOrigins: string[];
  imageHost: string;
  imageTransformHost: string;
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
  assetCdn: AssetCdnConfig;
  social: SocialConfig;
  chatterTitle: string;
  chatterDescription: string;
  danmakuList: string[];
  buildDate: string;
  geminiConfig: GeminiConfig;
  petConfig: PetConfig;
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
  // 图片 / 音乐加速：给图床绑定自己的域名后再填写 host，留空则继续使用原始地址。
  // 图片和音乐都存在图床里，所以一个域名同时加速两者。配置步骤见 README「图片与音乐加速」。
  assetCdn: {
    // 图床原始地址，数据库里这些前缀的链接（图片和音乐）会被改写到 imageHost
    imageOrigins: ["https://a68b43cc.cloudflare-imgbed-9pz.pages.dev", "https://cloudflare-imgbed-9pz.pages.dev"],
    // 绑定到 CloudFlare-ImgBed Pages 项目的自有域名，例如 "https://img.example.com"
    imageHost: "",
    // 已开启 Cloudflare Image Transformations 的域名（通常与 imageHost 相同），留空则不按尺寸压缩
    imageTransformHost: "",
  },
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
  chatterTitle: "留言墙",
  chatterDescription: "留下你的足迹，每一张便签都是一份温暖",
  danmakuList: ["在干嘛呢？", "今天也要加油鸭！", "前端开发中...", "Tailwind CSS 真好用", "BUG 修复进度 99%", "写代码中", "摸鱼中~", "下一顿吃什么？"],
  buildDate: "2026-05-21T00:00:00",
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
};

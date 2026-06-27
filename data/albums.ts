export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    id: "fenghua",
    title: "奉化印象",
    description: "2026年端午，奉化溪口蒋氏故居与弥勒大佛",
    cover: "https://cloudflare-imgbed-9pz.pages.dev/file/1782490958641_IMG_2274.jpeg",
    date: "2026.06",
    photos: [
      { url: "https://cloudflare-imgbed-9pz.pages.dev/file/1782490970676_IMG_2281.jpeg", caption: "三隐潭" },
      { url: "https://cloudflare-imgbed-9pz.pages.dev/file/1782490967080_IMG_2258.jpeg", caption: "历史照片" },
      { url: "https://cloudflare-imgbed-9pz.pages.dev/file/1782490969963_IMG_2242.jpeg", caption: "金色殿宇" },
      { url: "https://cloudflare-imgbed-9pz.pages.dev/file/1782490958641_IMG_2274.jpeg", caption: "弥勒大佛" },
      { url: "https://cloudflare-imgbed-9pz.pages.dev/file/1782490958941_IMG_2260.jpeg", caption: "蒋氏宗祠" },
      { url: "https://cloudflare-imgbed-9pz.pages.dev/file/1782490958402_IMG_2269.jpeg", caption: "雪窦寺" },
      { url: "https://cloudflare-imgbed-9pz.pages.dev/file/1782490964894_IMG_2246.jpeg", caption: "蒋氏故居" },
    ],
  },
  {
    id: "nature",
    title: "自然风光",
    description: "用镜头记录大自然的美好瞬间",
    cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop",
    date: "2026.05",
    photos: [
      { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop", caption: "星空" },
      { url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop", caption: "山峦" },
      { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop", caption: "云海" },
    ],
  },
  {
    id: "city",
    title: "城市漫步",
    description: "城市中的光影与故事",
    cover: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1000&auto=format&fit=crop",
    date: "2026.04",
    photos: [
      { url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1000&auto=format&fit=crop", caption: "街景" },
      { url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1000&auto=format&fit=crop", caption: "夜景" },
    ],
  },
];

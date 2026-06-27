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
];

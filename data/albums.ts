export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
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

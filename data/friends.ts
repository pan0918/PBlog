export interface Friend { id: string; name: string; url: string; description: string; avatar: string; themeColor: string; }

export const friendsData: Friend[] = [
  {
    id: "example",
    name: "示例友链",
    description: "这是一个示例友链，欢迎交换链接！",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=EX&backgroundColor=6366f1",
    url: "https://example.com",
    themeColor: "rgba(99, 102, 241, 0.5)",
  },
];

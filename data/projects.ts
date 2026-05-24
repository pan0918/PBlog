export type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  githubUrl: string;
  tags: string[];
  stars?: string;
};

export const projectsData: Project[] = [
  {
    id: "proj_vllm",
    name: "vLLM",
    githubUrl: "https://github.com/vllm-project/vllm",
    description: "高吞吐量、低延迟的 LLM 推理与服务引擎。支持 PagedAttention、连续批处理、张量并行等核心技术，可显著提升大模型部署效率，是当前最流行的大模型推理框架之一。",
    icon: "⚡",
    tags: ["Python", "LLM", "Inference", "CUDA"],
    stars: "80k+",
  },
  {
    id: "proj_skills",
    name: "Claude Code Skills",
    githubUrl: "https://github.com/anthropics/skills",
    description: "Anthropic 官方发布的 Claude Code Agent Skills 仓库，包含构建 AI Agent 能力的示例、模式与最佳实践，是学习 Agent 开发的权威参考资源。",
    icon: "🤖",
    tags: ["Python", "Agent", "Claude", "AI"],
    stars: "138k+",
  },
  {
    id: "proj_lightrag",
    name: "LightRAG",
    githubUrl: "https://github.com/HKUDS/LightRAG",
    description: "香港大学数据科学实验室开发的轻量级 RAG 框架。基于知识图谱提取与检索，支持增量更新和混合检索，在性能与成本间取得了极佳的平衡。",
    icon: "🔍",
    tags: ["Python", "RAG", "Knowledge Graph", "NLP"],
    stars: "15k+",
  },
  {
    id: "proj_verl",
    name: "veRL",
    githubUrl: "https://github.com/verl-project/verl",
    description: "字节跳动火山引擎开源的高效强化学习框架，专为 LLM RLHF 训练设计。支持 PPO、GRPO 等算法，可扩展至多节点分布式训练，是训练高级 LLM 的核心基础设施。",
    icon: "🧪",
    tags: ["Python", "RLHF", "PPO", "Distributed"],
    stars: "12k+",
  },
  {
    id: "proj_learning_research",
    name: "learning_research",
    githubUrl: "https://github.com/pengsida/learning_research",
    description: "系统化的科研方法论与经验总结。涵盖论文阅读、实验设计、写作技巧等科研全流程，是研究生和科研新人的必备指南。",
    icon: "📚",
    tags: ["Research", "Academic", "Methodology"],
    stars: "12k+",
  },
  {
    id: "proj_proda",
    name: "ProDa",
    githubUrl: "https://github.com/OpenRaiser/ProDa",
    description: "面向 AI 训练的数据工程平台，提供从原始语料到高质量训练数据的全流程工具链。支持数据合成、标注、基准测试等，是数据科学与工程的实用 IDE。",
    icon: "📖",
    tags: ["TypeScript", "Data Engineering", "AI", "Benchmark"],
    stars: "160+",
  },
];

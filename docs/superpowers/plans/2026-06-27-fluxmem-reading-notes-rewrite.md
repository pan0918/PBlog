# FluxMem Reading Notes Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the FluxMem post as a personal paper-reading note with correctly mapped figures and polished hard-coded experiment tables.

**Architecture:** Keep the post as one Markdown document because the existing blog loads posts directly from frontmatter and Markdown content. Add a focused Node test that treats figure order, uniqueness, experiment values, and writing constraints as the post's content contract.

**Tech Stack:** Markdown frontmatter, KaTeX syntax, Node.js test runner, Next.js production build.

---

### Task 1: Add the post content contract

**Files:**
- Create: `tests/fluxmem-post.test.mjs`
- Read: `posts/Research/FluxMem.md`

- [ ] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const figures = [
  "1782549995163_image.png",
  "1782550008403_image.png",
  "1782550062669_image.png",
  "1782550068501_image.png",
];

test("FluxMem reading note keeps figures and results aligned", async () => {
  const post = await readFile("posts/Research/FluxMem.md", "utf8");
  const positions = figures.map((figure) => post.indexOf(figure));

  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);

  for (const figure of figures) {
    assert.equal(post.split(figure).length - 1, 1);
  }

  assert.match(post, /Full Context\s*\|\s*81\.23/);
  assert.match(post, /EverMemOS\s*\|\s*93\.05/);
  assert.match(post, /FluxMem\s*\|\s*95\.06/);
  assert.match(post, /AWM\s*\|\s*3\.6/);
  assert.match(post, /FluxMem\s*\|\s*8\.1/);
  assert.match(post, /Flash-Searcher\s*\|\s*52\.12/);
  assert.match(post, /FluxMem\s*\|\s*64\.85/);
  assert.doesNotMatch(post, /internal-api-drive-stream\.feishu\.cn/);
  assert.doesNotMatch(post, /[—–]/);
});
```

- [ ] **Step 2: Run the test and verify the current post fails**

Run: `node --test tests/fluxmem-post.test.mjs`

Expected: FAIL because Figure 3 and Figure 4 are currently used in the wrong sections and multiple figure URLs are duplicated.

- [ ] **Step 3: Commit the failing content contract**

```bash
git add tests/fluxmem-post.test.mjs
git commit -m "test: define FluxMem post figure mapping"
```

### Task 2: Rewrite the article

**Files:**
- Modify: `posts/Research/FluxMem.md`

- [ ] **Step 1: Replace the frontmatter**

Use this metadata:

```yaml
---
title: "FluxMem：把记忆看成一张会不断改写的图"
date: "2026-05-29"
description: "论文阅读笔记：从静态检索到持续演化的记忆连接"
tags: ["Agent Memory", "LLM"]
cover: "https://a68b43cc.cloudflare-imgbed-9pz.pages.dev/file/1782550008403_image.png"
---
```

- [ ] **Step 2: Rebuild the body in the approved order**

Use these sections:

```markdown
## 我为什么会注意到这篇论文
## 静态记忆的问题不只在“记不住”
## FluxMem 如何表示记忆
## 三个阶段，一张不断变化的局部图
### Stage I：先搭出一个能用的上下文
### Stage II：根据反馈修连接、改内容
### Stage III：把反复成功的经验沉淀成技能
## PEMS：技能什么时候才算学稳了
## 三组实验分别在测什么
### LoCoMo：长上下文里找对证据
### Mind2Web：网页导航更依赖可复用技能
### GAIA：复杂任务中的整体收益
## 消融实验里我最关心的两件事
## Case Study：工具选错和思路算错是两种问题
## 读完之后，我怎么理解 FluxMem
```

Insert Figure 1 below the static-memory problem, Figure 2 before the three stages, Figure 3 in the ablation section, and Figure 4 in the Case Study section. Each figure URL must occur once.

- [ ] **Step 3: Add the hard-coded experiment tables**

Use compact tables with explicit metric captions:

```markdown
| 方法 | LoCoMo 平均分 |
|---|---:|
| Full Context | 81.23 |
| EverMemOS | 93.05 |
| FluxMem | 95.06 |

| 方法 | Cross-Task SR |
|---|---:|
| AWM | 3.6 |
| FluxMem | 8.1 |

| 方法 | GAIA 平均成功率 |
|---|---:|
| Flash-Searcher | 52.12 |
| FluxMem | 64.85 |
```

- [ ] **Step 4: Run the content contract**

Run: `node --test tests/fluxmem-post.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the rewritten post**

```bash
git add posts/Research/FluxMem.md
git commit -m "docs: rewrite FluxMem reading notes"
```

### Task 3: Humanize and verify rendering

**Files:**
- Modify if needed: `posts/Research/FluxMem.md`
- Test: `tests/fluxmem-post.test.mjs`

- [ ] **Step 1: Audit the draft**

Check for inflated significance, formulaic three-part summaries, excessive bold text, repeated sentence shapes, vague attribution, promotional conclusions, and first-person lines that sound manufactured.

- [ ] **Step 2: Revise the final text**

Preserve concrete paper details and the user's conversational technical voice. Remove every em dash and en dash. Keep first-person judgments where they add information rather than merely announcing a section.

- [ ] **Step 3: Run all content tests**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: the FluxMem route is generated successfully with no Markdown or KaTeX parse failure.

- [ ] **Step 5: Commit final editorial corrections**

```bash
git add posts/Research/FluxMem.md tests/fluxmem-post.test.mjs
git commit -m "docs: polish FluxMem note and verify figures"
```

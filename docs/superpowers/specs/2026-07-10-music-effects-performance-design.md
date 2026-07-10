# PBlog 音乐播放器与全站动效性能优化设计

## 目标

在不改变现有暖色毛玻璃视觉、页面布局、音乐功能和交互习惯的前提下，移除播放器重复下载与跳转竞态，降低播放期间的 React 更新压力，并为全站装饰动画建立统一的自动质量分级与后台暂停机制。

## 全局约束

- 保留当前播放器、萤火虫、樱花、草地、弹幕、点击粒子、动态渐变、页面转场和局部毛玻璃效果。
- 不新增用户可见的特效设置入口；质量档完全自动选择。
- 桌面浏览器默认使用高质量档；移动端或不超过 4 个逻辑核心的设备使用低功耗档；`prefers-reduced-motion` 使用静态档。
- 页面隐藏时暂停装饰动画，但音乐必须继续播放。
- 不修改音频服务端，不引入新的大型播放器或动画依赖，不使用 Blob 作为跳转方案。
- 持续动画只改变 `transform` 和 `opacity`；高质量档必须保持当前颜色、密度和视觉层级。

## 1. 音乐播放架构

### 1.1 原生媒体加载

`MusicProvider` 中的 `<audio>` 始终直接使用 `currentSong.url`，并保持 `preload="metadata"` 与 `crossOrigin="anonymous"`。删除 `audioSrc`、所有 Blob 引用、整曲 `fetch(...).blob()`、对象 URL 创建与销毁，以及 seek 时的源地址切换。

切歌只更新 `currentIndex`，由 React 更新 `<audio src>`。切歌 effect 负责暂停旧媒体、重置时间状态和记录“是否应在新媒体可播放后继续播放”的意图，但不主动调用 `audio.load()`。

### 1.2 明确的跳转接口

控制接口改为：

```ts
seekToSeconds(seconds: number): void
seekToPercent(percent: number): void
```

`seekToSeconds` 只接收秒数，校验元数据和有限时长后，将目标夹在 `0` 与 `duration - 0.05` 之间，直接设置 `audio.currentTime`，立即同步界面时间与歌词，并延续当前“跳转后播放”的交互。

`seekToPercent` 只接收 `0–100`，换算成秒后调用 `seekToSeconds`。进度条调用百分比接口，歌词行直接调用秒数接口。跳转过程中不更换 `src`，不调用 `load()`。

### 1.3 状态边界与更新频率

现有低频 `MusicContext` 保留，继续承载播放列表、当前歌曲、播放状态、音量、播放模式和控制函数。时间轴数据继续放在外部 `musicPlaybackStore` 中，从而不让时间变化刷新所有 `useMusic()` 消费者。

外部 store 只存储不可推导的状态：

```ts
currentTime
duration
currentLyric
```

`progress` 由 `currentTime / duration` 推导。store 更新前比较新旧值，没有变化时不通知订阅者。为只显示歌词的组件提供标量订阅，使歌词不因时间轴的每次变化而重渲染。

可见页面的时间轴 UI 最多约每 200ms 同步一次；隐藏页面停止 UI 时间同步，媒体播放不受影响。`duration` 只在 `loadedmetadata` 和 `durationchange` 更新。歌曲结束只由 `onEnded` 处理，删除 `timeupdate` 中的第二套结束判断。

### 1.4 媒体事件与错误处理

使用 `seeking`、`seeked`、`waiting`、`canplay`、`playing` 和 `error` 维护低频加载状态。播放 Promise 失败时恢复为未播放状态；音频错误时停止 loading，并通过现有歌词区域显示简短错误提示。所有 fetch、事件和媒体资源在卸载时完成清理。

## 2. 自动特效质量架构

新增一个共享的 `EffectQualityProvider`，只注册一套 `resize`、`visibilitychange` 和媒体查询监听，并向装饰组件提供：

```ts
type EffectQuality = "high" | "low" | "static";

quality
isVisible
isActive
```

选择规则：

- `prefers-reduced-motion: reduce`：`static`
- 否则窗口宽度小于 768px，或 `hardwareConcurrency <= 4`：`low`
- 其他情况：`high`
- 页面隐藏不会改变质量档，只把 `isActive` 设为 false，避免恢复页面时重建全部节点。

Provider 同步根元素上的质量与可见性 class，CSS 动画统一通过这些 class 暂停。卸载时移除监听和根元素 class。

## 3. 各动画组件设计

### 3.1 背景渐变与柔光

把当前 `background-position` 无限动画替换成略大于视口的固定渐变图层，只缓慢动画 `transform`。高质量周期约 38 秒，低功耗约 55 秒，静态档不动画。当前两块模糊柔光改为颜色和覆盖范围相同的静态径向渐变，消除持续的大面积 blur 合成成本。

高质量档保留现有背景颜色、透明度和柔光位置，确保桌面默认视觉基本不变。

### 3.2 萤火虫、樱花与草地

粒子参数使用可重复的伪随机函数和 `useMemo` 一次生成，不因页面隐藏而 setState 或重建：

- 萤火虫：高质量 20、低功耗 10、静态 5。
- 樱花：高质量 14、低功耗 8、静态 5。
- 草叶：高质量 30、低功耗 15、静态 10。

移动和呼吸只用 CSS `transform`、`opacity`。萤火虫使用径向渐变发光，删除动画中的 box-shadow；樱花删除 blur 和逐节点 `will-change`。静态档保留少量静态装饰，不运行无限动画。

`BackgroundEffects` 继续只挂载当前主题对应的樱花或萤火虫，并保留草地。

### 3.3 弹幕

弹幕改为固定轨道：高质量 6 条、低功耗 3 条、静态 0 条。每条只创建一次，使用负延迟错开位置并通过 CSS 循环移动，不再用 interval 持续增删 React state。运动只改变 transform 和 opacity，页面隐藏时暂停。

### 3.4 点击粒子

保留 Canvas 实现和现有颜色。高质量每次最多 8 个、同时最多 12 个；低功耗每次最多 5 个、同时最多 6 个；静态档不生成粒子。Canvas 高质量限制约 30 FPS、DPR 不超过 1.5，低功耗约 20 FPS、DPR 不超过 1.25；页面隐藏时取消动画帧，恢复后仅在仍有粒子时继续。粒子结束后立即回收，卸载时清理 RAF 与监听。

### 3.5 首页波浪、播放器旋转和页面转场

首页波浪高质量限制约 30 FPS、低功耗约 20 FPS，并使用对应的 DPR 上限；静态档绘制一帧。页面隐藏时停止 RAF，恢复后继续。波浪颜色、层数、振幅和高度保持不变。

播放器封面旋转继续使用 CSS transform，并在暂停播放或页面隐藏时暂停。Framer Motion 只保留页面进入、弹窗、卡片与按钮等短时交互，不用于粒子循环。

## 4. 局部毛玻璃

高质量档保持现有卡片和播放器毛玻璃参数，因此桌面默认外观不变。低功耗档降低 blur 强度并提高底色不透明度；静态档关闭 backdrop-filter，以实色半透明表面维持层级和文字对比。不会新增全屏毛玻璃，也不会移动毛玻璃图层。

## 5. 测试与验收

先用测试锁定以下行为，再修改实现：

- Provider 不包含 Blob、对象 URL、音频整曲 fetch 或 `audioSrc`。
- `<audio src>` 直接使用 `currentSong.url`，seek 路径不调用 `load()`。
- 同时存在且正确区分 `seekToSeconds` 与 `seekToPercent`。
- 进度条传百分比，歌词传秒数。
- 结束切歌只保留 `onEnded`。
- 时间轴状态不进入低频 React Context，progress 为推导值，无变化的 store 更新不广播。
- 自动质量判断、固定粒子预算、后台暂停和监听清理存在。
- 弹幕、粒子和 Canvas 节点数量有上限，静态档不运行无限动画。
- 动态渐变不再动画 `background-position`，主要连续动画只用 transform/opacity。

最终执行：

```bash
node --test tests/*.test.mjs
npm run lint
npx tsc --noEmit
npm run build
```

随后在桌面视口下对比首页与音乐页的亮色、暗色视觉，验证布局、配色、卡片、波浪、粒子和播放器样式没有明显变化；检查 `<audio>` 始终为远程 URL、没有 `blob:`，并验证进度条与歌词跳转不会回到开头。若本地检查环境无法访问远程音频，则以代码测试和浏览器 DOM/source 验证为准，并明确记录该限制。

## 6. 非目标

- 不改音乐文件托管或数据库结构。
- 不重新设计播放器 UI。
- 不替换图标体系、字体、主题色或毛玻璃风格。
- 不调整文章、后台管理和内容查询等与本次性能目标无关的模块。

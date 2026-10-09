# Before Sending 项目交接

## 开始工作

这是现有互动书信网站，不要重新创建项目或替换整个视觉系统。使用 React + Vite，动画使用 GSAP，写作差异记录使用 diff-match-patch。执行 `npm ci` 安装锁定依赖，`npm start` 启动，`npm run check` 检查生产构建。推荐 Node.js 24 LTS；Windows 可双击 `start-demo.cmd`。

## 当前体验

- 全屏纵向场景：首页、一个管理员选择场景、书桌、装信、邮票、投递、等待、档案。文档距离驱动 GSAP ScrollTrigger，固定全屏 frame 在同一 viewport 内交叠，不是普通上下堆叠。`journey.mjs` 的数据、原始章节 ID 和完成条件保留；`verticalJourney.mjs` 仅将四个管理员章节合并展示，匿名档案独立开放阅读。
- 首页旧插画 full bleed，左上品牌、右上 overlay 导航。没有副标题和画面解释文案。`HomeArtwork` 通过原图互补裁剪保持花草与线完整；GSAP 做克制的微动与滚动转场，不虚构耳朵或眨眼动画。
- 管理员章节仍是同一幅淡色背景，只有一个实例、四个独立目标。SELECT 不显示读写信封；点击动物立即通过原 Provider 保存选择与解锁条件，但不跳页。CONFIRMED 只保留所选角色，其他三位淡出后再呈现两封旧信封。Read 去档案，Write 去书桌；“换一位陪伴者”反向恢复四人。确认不更换背景或路由。
- 写信页首先是旧铅笔画桌面和小信纸。点击或继续下滚触发同一张纸的等比抬起，约 1.15 秒后才启用输入。信纸以原图顶部、中段重复纹理、原图底部构成，随正文增长而不拉伸原图。底部留白 220px；管理员、草稿提示、统计和操作跟随真正信尾。放回桌面反向归位并保留草稿。
- 正文、删除和修改保留写作历史；红线默认藏住删除内容，拉开才显示。继续写作会收回旧痕迹。
- 写作阶段没有回放、时间轴、再写一会儿、装进信封或通用前后页按钮。点击“写完了”仅解锁“装进信封”；继续修改文字则再次收起。
- 装信、贴邮票、投递逐步解锁。回放只在投递完成后的“回看寄出的信”内出现，不自动播放或中断写作。
- 投递是本地演示，不会发送邮件。寄出的自己的信不再自动变成收信；档案室样信仍可阅读。
- “留一针”和底部“撤回一笔”入口已移除。正文键盘撤销保留。
- 中 / EN 只切换界面，不翻译用户信件，不清空已选管理员或输入内容。

## 关键文件

- `src/App.jsx` 挂载 `src/components/HorizontalJourney.jsx`；后者管理当前场景、管理员门禁和草稿。
- `src/data/journey.mjs`：章节映射、前置条件、修改后完成状态作废。
- `src/components/PostOfficeScenes.jsx`、`src/data/postOffice.js`、`src/post-office.css`：前三个邮局场景、分类、抽屉、预览与独立文字排版。
- `src/components/JourneyWriting.jsx`、`src/animation/useDeskPaper.js`：写作与桌面纸张动画。
- `src/components/JourneyCompanion.jsx`：本地 select / confirming / confirmed / resetting 视觉状态及 GSAP 时间线；父级 chooseKeeper 只更新现有选择，write/read 回调负责之后的导航。脚底按每张旧图的实际坐标对齐，不把线头当脚底。场景取消浏览器自动滚动锚定，避免移动角色引起页面跳动。
- `src/components/HomeArtwork.jsx`、`src/animation/useHomeMotion.js`：同一张 home-original 的互补裁剪图层，路径沿用旧 prepare-home-layers.mjs；无素材生成。页面转场统一交给 useVerticalJourney，避免两套滚动变换叠加。
- `src/components/JourneyRitual.jsx`、`SentLetterMemory.jsx`：寄送阶段和寄出后的回放。
- `src/animation/useVerticalJourney.js`：纵向文档距离驱动全屏 frame，GSAP scrub .8，章节交界按滚动方向吸附；不捕获滚轮或左右方向键。导航使用 window.scrollTo。ResizeObserver 维护真实章节高度，书写 resize 事件同步刷新长度，避免连续输入时错误进入下一幕。
- `src/data/verticalJourney.mjs`：将 dog/cat/rabbit/mouse 地址映射到单一 dog 场景，不改动管理员 ID、Provider 或现有存储数据。
- `useDeskPaper` 被动观察继续下滚来触发抬纸。html 是文档滚动容器，textarea 自动增高且无内部滚动条。长信内容在全屏 frame 中随文档位置移动；frame 使用 overflow: clip，防止焦点制造隐藏的第二滚动容器。不要将长信重新限制成一屏或固定比例。
- `src/components/LivingLetter.jsx`：复用的文字痕迹，旧场景实现保留但不再是主入口。
- `src/components/ThreadTail.jsx`：单根红线、拉出删除文字和收回状态。
- `src/components/DeliveryWorktable.jsx`：旧实现保留，当前流程复用其邮票素材。
- `src/data/animalAssets.js`：统一角色静态图和动作映射。
- `src/components/AnimalMedia.jsx`：一次性动作播放与淡入淡出。
- `src/i18n/`、`src/design-system.css`：双语及排版 token。仍有部分旧 CSS 局部字号，可后续逐步清理，不宜整体重写。

## 美术素材

以 2026-09-06 留存视觉文件与四张历史截图为美术依据；最新请求明确改变呈现方式为全屏转场和动态长信。旧样式继续保存在 `home-scroll-stage.css`、`archive-rooms.css`、`living-letter.css`、`writing-desk.css`，`visual-restoration.css` 适配旧视觉，最后加载 `scene-system.css` 管理场景布局。

使用 `public/assets/administrators/` 中的旧姿态、`home-original.png`、`post-office-facade.png`，以及 `writing-desk/paper.png`、`desk-empty.png`、`demo-cutouts/drawer-bg.jpg`。没有生成替代图片。

原始美术中的新版目录为 EXCLUDED，禁止引用及制作派生素材。其旧网页派生图、视频及制作脚本已经移到项目外的本次备份目录，仅留作恢复资料，不再提供给网页或进入迁移包。旧 embedded HTML 也已隔离，避免误开旧视觉。原始美术文件没有删除。

当前角色活动名称和触发机制保留，视觉反馈改接旧静态姿态与原有淡入淡出，不再播放被禁用的视频。详细映射及功能保留清单见 `VISUAL_RESTORATION.md`。

## 数据与迁移边界

当前浏览器使用 localStorage 保存草稿、管理员和语言，主要键为 `before-sending-letter-v3`、`before-sending-administrator`、`before-sending-language-v1`、`before-sending-entrance-seen-v1`。不同电脑、不同端口或 localhost / 127.0.0.1 是不同存储环境。压缩包不包含这些私人浏览器数据。

不要清空用户 localStorage 来测试。独立端口启动测试服务，使用测试信件。不要把 `edge-*profile` 等浏览器配置目录装入迁移包。

项目没有真实邮件服务、数据库、登录或 AI 接口。不要把本地投递动画描述为真正发信。`localhost:5173` 仅指当前电脑，并不是互联网网址。

## 检查与打包

`npm run check` 是构建检查，并不是完整自动化测试套件。修改后仍须浏览器检查：管理员选择到桌面、输入和删除、红线拖出、回放、封信、贴邮票、投递、手机布局及控制台。

运行 `powershell -NoProfile -File tools/export-project.ps1` 会在项目上一级目录生成迁移 ZIP。包里包含源代码、依赖锁文件、启动文件和旧版成品；不包含原始美术目录、node_modules、构建缓存、测试浏览器配置或私人草稿。解压后安装依赖即可继续开发。

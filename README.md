# Before Sending / 句子形成之前

现有 React + Vite 互动书信 Demo。沿用原项目，并非重新搭建。

## 换电脑运行

1. 把迁移压缩包通过 U 盘、移动硬盘或自己的网盘带到新电脑。
2. **先完整解压**，不要直接在压缩包里打开文件。项目文件夹中应当能看到 `package.json`。
3. 从 [Node.js 官方网站](https://nodejs.org/en/download) 安装 **Node.js 24 LTS**。安装完成后重新打开终端。
4. Windows 可以双击项目内的 `start-demo.cmd`。首次启动会安装依赖，需要联网；以后直接启动即可。
5. 或在项目文件夹打开终端，依次执行：

```bash
npm ci
npm start
```

打开终端显示的地址，通常是 http://localhost:5173/ 。如果端口被占用，Vite 会使用下一个可用端口，以终端输出为准。

以后重新启动只需要 `npm start`。关闭终端会停止网站。不要双击 `index.html` 或旧的 embedded HTML 来运行当前版本。

### Windows 常见问题

- `npm` 无法识别：确认已安装 Node.js，关闭并重新打开终端。
- PowerShell 提示不允许运行 `npm.ps1`：使用 `npm.cmd ci` 和 `npm.cmd start`，不必放宽系统执行策略。
- 打不开网站：先检查终端里的服务还在运行，以及端口是否变化。
- 新电脑无需安装 Python、抠图模型或 FFmpeg 即可运行网站，旧版成品图片已经包含在 `public` 中。

## 迁移范围

- 压缩包包含代码、配置、依赖锁文件和运行所需的旧版成品素材。原始美术目录不进入迁移包，避免再次携带被排除的素材。
- 不包含 `node_modules`、旧构建产物、浏览器缓存或测试浏览器配置。这些不是继续开发所需的项目源文件。
- **草稿、寄信记录、所选管理员、界面语言保存在旧电脑的浏览器 localStorage 中，不在项目文件夹里，不会随压缩包迁移。** 重要的信请另外保留正文；当前没有跨设备同步功能。
- 这个本地网址不是已发布网站。在另一台电脑上也需要启动项目，不能直接使用旧电脑的 localhost 服务。
- 此 Demo 不发送真实邮件，不使用登录、数据库或 AI 写信 API。

## 继续开发

在新电脑的代码工具中打开**解压后的项目文件夹**，先阅读 `PROJECT_HANDOFF.md`。不必重新创建项目，也不必复制旧电脑的依赖目录。

```bash
npm run check
```

此命令构建并检查当前前端。

## 主要文件

- `src/App.jsx`、`src/components/HorizontalJourney.jsx`：纵向章节、管理员前置校验、渐进式流程与草稿状态。组件文件名保留以兼容原项目。
- `src/components/PostOfficeScenes.jsx`、`src/data/postOffice.js`：邮局门外、柜台、独立抽屉与真实文字界面。
- `src/components/HomeArtwork.jsx`、`src/animation/useHomeMotion.js`：满屏旧插画、独立轻微动作和悬停注记。
- `src/components/JourneyCompanion.jsx`：同一邮局场景中的选择、确认、重新选择，以及确认后才出现的读写入口。
- `src/components/JourneyWriting.jsx`、`src/animation/useDeskPaper.js`：桌面、信纸抬起、书写和明确完成操作。
- `src/components/JourneyRitual.jsx`、`SentLetterMemory.jsx`：装信、贴邮票、投递，以及仅寄出后可打开的书写回放。
- `src/components/AnimalMedia.jsx`：管理员单次动作播放。
- `src/data/animalAssets.js`：统一静态图和动作视频映射。
- `src/components/LivingLetter.jsx`、`ThreadTail.jsx`：写信、红线、读信、回放。
- `src/trace/letterSession.js`：输入、删除、停顿和文本历史。
- `src/animation/useVerticalJourney.js`、`src/scene-system.css`：纵向文档距离驱动 GSAP ScrollTrigger 全屏叠层转场与吸附；长信贡献真实内容高度。
- `src/data/verticalJourney.mjs`：单一管理员章节及旧地址兼容。
- `src/animation/useObjectGesture.js`：纸张、邮票和信封拖动。
- `src/i18n/`、`src/design-system.css`：中英界面及排版变量。
- `src/visual-restoration.css`：2026-09-06 视觉词汇及可增长信纸；`scene-system.css` 在其后加载，负责最新全屏场景布局。
- `src/animation/useGrowingPaper.js`、`tools/prepare-long-paper.ps1`：编辑器自动增长；从原有信纸提取可重复的中段纸纹。
- `public/assets/administrators/`、`writing-desk/`、`demo-cutouts/`：旧版角色、信纸、桌面和抽屉墙。

章节顺序为首页、一个管理员选择场景、书桌、装信、邮票、投递、等待、档案。滚轮仍是纵向，但场景在同一 viewport 内柔和交叠、缩放与轻微模糊后吸附，不再上下露出两个半页。导航浮在场景上，不占文档高度。首页旧插画全幅展示，窄屏优先保全角色。没有安装新的动画库或生成替代插画；系统开启减少动态效果时关闭空间位移、缩放、模糊和闲置微动。

管理员页先只显示四位管理员，不显示信封。点击动物后保存选择，另外三位在约 750ms 内淡出，所选角色以 1.03 倍轻移到中心；约 800ms 后两封旧信封依次出现。然后才进入 Read / Write，所选角色沿用到书桌。可通过“换一位陪伴者”回到第一状态。两个状态仍在同一个 section，旧的四个管理员地址仍指向这里。匿名档案仍可由导航直接阅读，寄信操作按原完成条件解锁。

写信台先显示旧桌面和小信纸。点击信纸，或在桌面内继续下滚，触发约 1.15 秒的拿纸动画。仍然是同一个纸张对象，等比缩放和位移；长信通过增加中部纸纹延长，不纵向拉伸整张原图。顶部和底部保留原图边缘，原图中段提取为 `paper-middle.png`，纹理制作脚本仅依赖 Windows 自带的 System.Drawing。

动画完成后才启用编辑。正文随输入增长，页面滚动而非编辑器内部滚动；最后一行下方保留 220px 空间。管理员和草稿提示位于整封信的真正底部，统计及操作栏在信纸之后。桌面只出现于起始 viewport，不重复铺满长信。“放回桌面”反向收起并保留草稿。场景吸附只发生在章节交界，不会把正在书写的长信吸回顶部。

当前入口已清理安慰性短句、画面解说和重复品牌。保留角色名称与身份、必要操作提示、书写统计、核心机制、导航、隐私与本地投递说明；信件正文及管理员行为数据未被批量删除。

写作中不显示回放或封信入口；点击“写完了”才显示“装进信封”，修改正文会重新收起封信入口。删除线头、停顿线结和寄出后的回放仍由当前实现驱动。

`VISUAL_RESTORATION.md` 记录视觉来源、保留的功能文件及素材排除范围。`design-qa.md` 记录浏览器检查。

`node tools/verify-vertical-logic.mjs` 检查单一管理员场景、四种选择、纵向全屏转场、旧地址兼容、三段式长信和必要文案清理。

`node tools/verify-horizontal-logic.mjs` 保留原文件名，继续检查原始数据前置条件和修改后状态回退，不代表页面仍横向滚动。

`node tools/verify-visual-restoration.mjs` 检查旧素材是否齐全，以及源码和生产输出中是否重新出现被排除的素材。

## 重新打迁移包

Windows PowerShell，在项目目录运行：

```powershell
powershell -NoProfile -File tools/export-project.ps1
```

压缩包会生成在项目文件夹的旁边，文件名带时间，不覆盖旧包。

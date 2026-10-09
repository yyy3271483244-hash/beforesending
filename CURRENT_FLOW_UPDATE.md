# Before Sending 连续交互更新

更新日期：2026-09-06。继续修改现有 React / Vite 项目，没有建立另一个网站。在线预览与 `Before-Sending-embedded.html` 使用同一套源代码。

## 打开方式

- 首页：http://127.0.0.1:5173/ 。不带片段地址时从 Opening 开始。
- 离线：项目根目录 `Before-Sending-embedded.html`，已重新打包。
- `#bureau` 是兼容的档案入口；进入后读写选择、抽屉、展开阅读由同一个连续滚动舞台承载。
- `#replay`、`#seal` 保留兼容入口，但分别定位到写信连续流程中的回看、寄信准备阶段。

## 最新读信流程

管理员选择与读写选择分成两个状态。未选择时只有四位管理员；选择后，其余角色退后消失，保留当前管理员，再显示两只信封。隐藏入口不占排版高度，也不能提前接收焦点。

读写入口 → 抽屉墙 → 展开信件，组成一个可逆舞台：

- 点击 Read 后进入抽屉墙。
- 每个有信的抽屉摆放三封无文字信封；预览是与信件数据绑定的 HTML，不是图片中的文字。
- 点击信封后，选中的信封抬起、移到中心、打开，再露出正文。
- 向上滚动直接反向控制动画：纸张收束、回到信封、信封退回原格。
- 原抽屉保持打开，能选其他信。不会留下重复悬空的入口信封。
- 再往上滚，返回保留已选管理员的 Read / Write 状态，不重置成首页或四选一。
- 柜体铺满视口；窄屏通过横向平移查看整面柜墙。阅读时柜体降至低透明度，仍留在后方。
- 鼠标仍能拖拉抽屉；触屏采用点按开关抽屉，保留原生上下滚动和横向查看，不抢夺场景回退手势。

## 其他连续系统

- 首页：单一固定舞台，Opening / Post Office 分层覆盖视口，ScrollTrigger pin + scrub，滚动可反向恢复。
- 写信：新空桌面和独立信纸；滚动抬纸、居中后才启用输入与管理员响应。
- Write → Replay → Prepare → Pack → Drop：保留同一张主信纸，准备阶段没有邮箱；折信、装入信封、封口、邮票、投递分阶段出现。
- Replay 按真实记录播放，可暂停、重播、调整速度；返回编辑后使用新事件版本。
- 准备阶段有横向信封与邮票选择、收件信息、到达时间和痕迹分享设置；只有实际投递才提交发送状态。
- 管理员减少追随和连续织线动作；连续退格合并，明显停顿留痕，不显示情绪判断。
- 拉线与实际删除片段绑定：拖动渐显，短拉松手收回，完整拉出可暂留，再次点击收回。读者的揭示状态不写入持久记录。
- 纸角可拖动翻面，两角都支持，短拖回弹；背面文字直接留在纸上。永久剪断同时清除可恢复片段和历史中的对应文字。

## Existing Assets Used

当前活动流程使用的文件：

| 路径 | 用途 |
|---|---|
| `public/assets/demo-cutouts/drawer-bg.jpg` | 原画柜体、前板及读信背景 |
| `public/assets/administrators/post-office-facade.png` | 低透明度邮局背景 |
| `public/assets/administrators/` 中现有角色姿势 | 管理员选择、书写、等待和阅读 |
| `public/assets/home-stage/paper-field.jpg` 与五个对象切图 | 窄屏首页分层构图 |
| `public/assets/writing-desk/desk-empty.png` | 用户提供的无纸桌面 |
| `public/assets/writing-desk/paper.png` | 用户横向信纸的透明导出，1264 × 782 |
| `public/assets/writing-desk/reading-paper.png` | 用户竖向信纸的透明导出，675 × 864 |
| `public/assets/entrance-envelopes/read-*.png` | 米白读信入口，拆分本体、翻盖、线头 |
| `public/assets/entrance-envelopes/write-*.png` | 粉色写信入口，拆分本体、翻盖、信纸、线、笔 |
| `public/assets/archive-envelopes/{ivory,pink,blue}.png` | 三色无文字透明信封，600 × 440，用于抽屉和封装 |
| `public/assets/art/stamp-*.png` 中四枚现有邮票 | 准备与封口阶段 |

三色抽屉信封是本轮派生素材，不声称它们是用户上传的三张原图。停用的旧写实信封保留在 `demo美术素材/停用旧信封/`，不再用于活动界面。原始上传素材保留。

## Motion / Creative Tools Used

- GSAP timeline：对象位移、翻盖、角色选择、折信、投递。
- GSAP ScrollTrigger：首页、写信、读信的连续可逆滚动进度。
- SVG path / clip-path：线头、针迹、纸角揭示及透明素材分层。
- Pointer Events：线头、纸角、桌面拖拉；ResizeObserver：响应尺寸变化并重算场景。
- CSS transform、透视与遮罩：纸面和信封自身的层次，不以卡片放大作为通用交互。
- 原生 View Transitions：流程之外的兼容路由转换；内部滚动状态不靠换页。

本轮没有新装动画运行时，也没有复制 GitHub 动效仓库。已有 Lenis、p5、Rive 等依赖没有为这些效果强行接入。

## Feather Principles Referenced

沿用用户指定的空间原则：共享对象连续、层级有前后关系、抽出与放回对称、滚动直接控制场景、任务分阶段进入。转译为同一张纸、同一只信封与原画抽屉，不复制 Feather 的品牌或界面；本轮没有宣称重新逐帧测量参考网站。

## Main Files Modified

- `src/App.jsx`：兼容路由与连续流程连接，避免被跳过的浏览器转场产生未处理异常。
- `src/components/HomeScrollStage.jsx`、`src/home-scroll-stage.css`：单舞台首页。
- `src/components/PostOfficeChoices.jsx`、`src/post-office-choices.css`：两阶段管理员与入口选择。
- `src/components/ReadingFlow.jsx`、`src/reading-flow.css`：可逆读信、满幅柜墙、原格归还。
- `src/components/ArchiveRooms.jsx`、`src/archive-rooms.css`：三封信、数据预览、受控提取、触屏手势。
- `src/components/LivingLetter.jsx`、`src/living-letter.css`、`src/writing-desk.css`：纸面、书写与阅读。
- `src/animation/useWritingDesk.js`、`src/animation/useLetterReplay.js`：连续写信与真实事件回放。
- `src/components/DeliveryWorktable.jsx`：准备、封装、投递、等待对象。
- `src/components/PaperTurner.jsx`、`src/paper-turner.css`：纸角翻面和背面排版。
- `src/trace/letterSession.js`：删改记录、合并、撤销、停顿与永久清除。
- `src/experience.css`：窄屏不溢出。
- `tools/prepare-writing-paper.mjs`、`tools/prepare-archive-envelopes.mjs`：透明素材预处理。
- `Before-Sending-embedded.html` 与 `dist/`：同步构建产物。

## Tests Performed

浏览器测试使用独立临时上下文，不覆盖用户现有浏览器草稿。测试连接本机 Edge 的 CDP 会话；不是跨浏览器矩阵。

| 脚本 | 实测范围 |
|---|---|
| `verify-home-stage.mjs` | 1920 × 1080、1440 × 900、390 × 844、320 × 568；单舞台、满幅、逐段往返、销毁清理 |
| `verify-reading-flow.mjs` | 同上四种尺寸；管理员两状态、三封无字信、预览数据、点击提取、原生滚轮回退、原格保持打开、已选角色保持、反复往返、再次选信、无路由跳转和运行异常 |
| `verify-reading-touch.mjs` | 390 × 844 原生 CDP 触摸；阅读退回、抽屉上下滑动、横向柜墙平移、点按开抽屉 |
| `verify-continuous-flow.mjs` | 四种尺寸；实际输入、自动回看、重写、信封与邮票横拖、收件方式、折信、回退保留、投递与等待 |
| `verify-thread-pull.mjs` | 真实删除、渐进拉出、短拉回收、完整拉出、独立片段、键盘、永久剪断和不记录读者行为 |
| `verify-paper-corners.mjs` | 鼠标与真实 CDP 触摸；两侧纸角、25/50/75% 中间态、短拖返回、完整翻面、反向翻回、共享片段数据；真实触摸拉线 |
| `verify-session-safety.mjs` | 撤销、合并删除、失焦停止、禁止粘贴、准备阶段不录停顿、延迟阅读门控、未送达撤回、即时投递与阅读 |
| `verify-embedded-entry.mjs` | 在线及离线根入口从首页开始；选管理员、写信、回看、准备、投递、等待、档案入口 |

测试截图在 `ui-preview/home-stage/`、`ui-preview/reading-flow/`、`ui-preview/continuous-flow/`、`ui-preview/paper-corners/`。已实际检查桌面与窄屏截图；修正了手机顶部标题压到正文的问题。生产构建及离线打包通过。

旧的 `verify-living-letter`、`verify-letter-behaviors`、`verify-archive-interactions` 等脚本包含旧布局/旧路由断言，不是当前连续流程的验收入口。

## Remaining Issues

- 这是本地原型，没有真实邮件或邮政发送、跨设备收信、服务器定时投递、公共投稿或多人同步。延迟时间是本地门控，不是服务器安全边界。
- 匿名信件处的 18 封信为演示样信；没有将用户真实草稿或删除内容加入公共档案。
- 角色使用现有立绘姿势与克制位移，不是完整骨骼或逐帧动画。
- 尚未进行真实手机软键盘/输入法设备测试、超长信件压力测试、Safari/Firefox 矩阵和内存剖析。
- 触屏抽屉用点按开关，以优先保留自然场景滚动；鼠标拖拉仍可用。

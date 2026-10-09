# Before Sending 本轮交付

> 历史版本报告。2026-09-06 后续连续流程、素材替换和测试结果以 [CURRENT_FLOW_UPDATE.md](CURRENT_FLOW_UPDATE.md) 为准；下文部分入口、样信数量、素材与交互描述已被后续版本替代。

本轮在现有 Vite / React 项目内修改。核心结果是把原图中的抽屉、动物、信纸、线与信封接入可操作流程。没有另起项目，也没有更换技术栈。

## 页面入口

| 页面 | 本地入口 |
|---|---|
| 首页与向内滚动 | http://127.0.0.1:5173/#opening |
| 四位管理员 | http://127.0.0.1:5173/#administrators |
| 读写分流 | http://127.0.0.1:5173/#office |
| 写信台 | http://127.0.0.1:5173/#write |
| 回看 | http://127.0.0.1:5173/#replay |
| 寄信台 | http://127.0.0.1:5173/#seal |
| 等待 | http://127.0.0.1:5173/#waiting |
| 原图档案柜 | http://127.0.0.1:5173/#bureau |
| 示例信拆信台 | http://127.0.0.1:5173/#unseal/archive-02 |
| 示例信阅读 | http://127.0.0.1:5173/#reading/archive-02 |
| 示例信回应 | http://127.0.0.1:5173/#stitch/archive-02 |

支持刷新、浏览器前进后退；保留 ?preview=drawers 入口。档案中的六封信复用 src/data/content.js 已有样信，并标为馆藏样信。没有把个人草稿自动放入匿名档案。

## Existing Assets Used

42 张上传原图的名称、路径、尺寸、内容及建议位置见 ASSET_INVENTORY.md。重点使用：

- demo美术素材/首页视觉/image (1).png：1456 x 816，完整四动物首页，同时裁切其中的红色邮箱。
- demo美术素材/读信页面/抽屉.jpeg：1456 x 816，按原画不等宽边界拆成 35 个抽屉前板，原图柜体始终对齐。
- demo美术素材/读信页面/背景图/0_0.jpeg：1456 x 816，室内、拆信与读信空间。
- demo美术素材/写信页/0_2 (1).jpeg：1456 x 816，书桌。
- demo美术素材/写信页/0_2 (2).jpeg：1232 x 928，不规则信纸，外部白底移除后用于正反面。
- demo美术素材/动物管理员/老鼠/0_2 (1).jpeg：1024 x 1024，静止和挥手。
- demo美术素材/动物管理员/老鼠/0_3.jpeg：1232 x 928，拉线、织线、抱信。
- demo美术素材/动物管理员/兔子/0_1.jpeg、狗/0_3 (1).jpeg、猫/0_3.jpeg：各 1232 x 928，另外三位管理员的工作姿势。
- demo美术素材/寄信页面/寄信页背景.jpeg：1456 x 816，纸面邮路。
- demo美术素材/视觉元素/0_2 (4).jpeg：1232 x 928，刺绣绷与针线。
- 原项目 public/assets/art/envelope-blue.png、envelope-ash.png、envelope-wine.png、stamp-night.png、stamp-window.png、paper-texture.png：信封、邮票与纸面。

新派生文件位于 public/assets/administrators，包含 17 张角色姿势、原首页副本、信纸副本及透明信纸。原始素材没有覆盖。

## Motion / Creative Plugins Used

实际运行：GSAP、GSAP ScrollTrigger、原生 View Transitions、SVG 路径、CSS perspective / clip-path、Pointer Events、ResizeObserver。

GSAP 管抽屉拉出、角色搬运、折信、寄信；ScrollTrigger 管首页向室内滚动；View Transitions 延续同一封信与同一张纸；SVG 管线圈、回针与刺绣。没有为了效果引入新运行时依赖。

已经检查但没有接入本轮：GSAP Flip、Lenis、p5、Rive。GitHub 已连接仓库查询返回空结果，本轮未取得或复制远端仓库代码。

## Pages Modified / Components Added

- 首页：1400 x 900 桌面构图基准，四动物完整呈现；局部原图低频动作、滚动视差、室内角色进入。
- 管理员选择：四角色直接站在房间内；确认后其余角色后退，选择保存到全局 Context 与本地存储。
- 读写分流：书桌与档案柜是可选的空间对象。
- 写信：纸面、真实编辑行定位、角色跟随、停顿与删除痕迹、翻面、剪断、撤回一笔。
- 回放：事件顺序、暂停、速度与进度调整；永久隐藏内容过滤。
- 寄信与等待：折纸、三种信封、两枚邮票、痕迹分享开关、拖投、此刻 / 一小时 / 明天、到达前取回。
- 抽屉：原图前板、柜内阴影、抽屉托盘、抬起的信封；鼠标点击 / 拖动、Escape 关闭、取信到拆信台。
- 拆信 / 阅读 / 刺绣：同一封信的身份与信封延续；最终正文先呈现，主动拉线临时揭示；七针回应回到同一封信并保存。

主要新组件文件：ArchiveRooms.jsx、AdministratorSystem.jsx、LivingLetter.jsx、DeliveryWorktable.jsx。App.jsx 集中管理原有草稿与页面路由。

## Writing Event System

保留当前数据模型 finalText / events / fragments / knots / stitch。新增字符来源标记、原始删除范围、所属段落、编辑位置与停顿等级。

实际事件：insert、delete、replace、pause、undo、permanentHide、send。连续停顿更新同一个 pause / knot：3 秒为一级、5 秒二级、8 秒三级，最高三级。失焦、隐藏页面停止计时；检测到长时间定时器中断时丢弃离开期间的时间。

连续退格合并相邻删除内容。撤回时恢复正文，撤销相应事件并移除错误线头。Permanent Hide 清除对应碎片以及历史快照中的来源字符；旧版没有来源标记的数据采用保守历史遮蔽。

接收端只保存用户明确留下的刺绣，不保存阅读时长、悬停记录、拉线记录或回放进度。

## Administrator System

四位管理员共享 following / weaving / collecting / stitching / carrying / waiting / reading / reacting 行为接口。选择持续到写信、回放、寄信、等待、拆信和阅读。

老鼠优先完整接入：编辑行位置跟随、停顿织线、删除搬运队列、送至背面、恢复跟随、收信拉线反应。新输入不会抢断正在完成的搬运动作。

猫、兔子、小狗使用各自已有工作姿势与不同移动速度，共享事件逻辑。当前是原画姿势切换与局部动作，还不是独立的逐帧或骨骼角色动画。

## Feather Principles Referenced

参考 https://feather.computer/ 以及用户指定的空间原则：前中后景、对象提取、抽屉深度、共享物体跨页连续、分阶段进入。转译成原画柜体 / 前板 / 内部信封 / 信纸，而非复制 Feather 的品牌、颜色或界面。网页版内容已读取；没有声称逐帧复刻其动画曲线。

## Files Modified

- src/App.jsx
- src/components/ArchiveRooms.jsx
- src/components/AdministratorSystem.jsx
- src/components/LivingLetter.jsx
- src/components/DeliveryWorktable.jsx
- src/trace/letterSession.js
- src/archive-rooms.css
- src/living-letter.css
- vite.config.mjs：排除浏览器测试缓存监听，修复 Windows 文件锁导致的预览退出。
- tools/asset-audit.mjs、tools/prepare-administrators.mjs
- tools/verify-living-letter.mjs、tools/verify-letter-behaviors.mjs
- public/assets/administrators/*
- ASSET_INVENTORY.md、IMPLEMENTATION_REPORT.md、构建与离线输出。

## Tests Performed

使用独立浏览器测试会话，不覆盖用户当前浏览器中的草稿。

verify-living-letter.mjs 已通过：首页原图完整处于 1400 x 900 首屏、3/5/8 秒线结、连续停顿单结、编辑行切换、删除记录、永久剪断同时清除回放快照、35 个原图抽屉、打开与取信、拆信后身份一致、七针回应刷新保留、管理员延续、390 x 844 移动端无整页横向溢出、Reduced Motion 抽屉可用、无浏览器运行时异常。

verify-letter-behaviors.mjs 已通过：撤回恢复正文且无虚假线头、编辑器失焦停止计时、连续退格合并、鼠标拉线 / 松手恢复、键盘按住揭示、线结按住显示真实停顿时长、拖入邮箱记录 send、未到达阅读入口保持封闭、到达前取回、直接拖出抽屉与 Escape 关闭、四角色分别跨页面保持、手机写信 / 寄信无整页横向溢出、无运行时异常。

已查看测试截图，包括首页、管理员、读写分流、写信线结、背面、抽屉展开、拆信、拉线、寄信、等待、刺绣和手机页面。测试中发现并修复了连续拉线时旧计时器干扰新动作、过期页面动画覆盖新导航、邮箱覆盖底部控制、信纸白底等问题。

最终生产构建与离线打包通过。额外实际打开 Before-Sending-embedded.html，验证 35 个抽屉存在、中心抽屉可展开，并且没有浏览器运行时异常。

## Remaining Issues

- 仍是本机浏览器原型；没有真实邮箱投递、跨设备访问、公共投稿或多人同步。六封档案信为项目既有样信。
- 猫、兔子、小狗共享完整事件逻辑，但独立的个性化动作编排仍可继续深化。没有接入逐帧 / Rive 骨骼动画。
- 匿名 / 实名署名切换尚未制作；当前信件没有强制署名。
- 尚未做真实手机软键盘 / 输入法组合输入的设备测试、长篇信件压力测试、跨浏览器兼容矩阵、内存剖析。
- 延迟投递是本地状态门控；不能把它当作服务器级的保密投递或定时服务。
- View Transitions 不可用的浏览器回退为即时页面状态切换；核心操作仍可用。

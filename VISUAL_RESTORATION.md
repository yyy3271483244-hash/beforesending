# Before Sending: Selective Visual Restoration

## 依据与边界

采用项目中留存的 2026-09-06 文件快照，以及用户提供的四张历史网页截图。没有寻找或恢复 Git，没有整体覆盖项目，没有新增框架或生成插画。

四张附件已原样归档到 `视觉参考/OLD_VERSION_REFERENCE/`，便于后续核对。原目录此前在此工作副本中不可见；使用的是本次用户提供的原始附件，不是另找的参考图。

## 旧视觉来源

| 历史文件 / 素材 | 本次恢复方式 |
| --- | --- |
| `src/home-scroll-stage.css` | 复用浅色邮局、角色排列、上下标题与信封入口规则；由当前 JourneyCompanion 接入 |
| `src/archive-rooms.css`、ArchiveRooms 的坐标 | 复用 7 列 × 5 行原始画面边界、抽屉裁片与轻微展开层次；映射当前信件 ID |
| `src/living-letter.css` | 保留旧正文、Georgia 斜体品牌、针线与手工纸视觉规则 |
| `src/writing-desk.css` | 提取双页纸比例、信纸留白、桌面衬底；适配现有抬纸动画，不切回旧状态逻辑 |
| `administrators/home-original.png` | 首页四位管理员、中央红邮筒和连接线的原图 |
| `administrators/post-office-facade.png` | 四位管理员共享的原邮局背景，沿用 .42 淡化程度 |
| `administrators/*-idle/following/weaving/carrying.png` | 当前动作名称映射到旧角色姿态；补用 mouse-reacting.png |
| `writing-desk/paper.png`、`desk-empty.png` | 原双页信纸与淡铅笔画桌面 |
| `demo-cutouts/drawer-bg.jpg` | 原粉彩抽屉墙，未替换、调色或重新生成 |
| `entrance-envelopes/*-complete.png`、`archive-envelopes/blue.png` | 旧读写入口、柜前装饰信封和抽屉内信封 |

上述四个历史 CSS 以及五张关键背景/信纸文件的文件时间均为 2026-09-06。旧 CSS 原文件未被覆盖，恢复适配集中在 `src/visual-restoration.css` 中；最新场景布局由其后加载的 `src/scene-system.css` 管理。

## 修改的视觉组件

- `PostOfficeScenes.jsx`：恢复旧首页及整面抽屉墙；保留当前分类、信件正文、随机选择、关闭及寄出记录入口。
- `JourneyCompanion.jsx`：从独立场景改回同一幅淡色背景中的四位角色，继续调用当前选择与确认回调。
- `JourneyWriting.jsx`：替换背景与信纸呈现，将统计放在页脚注记；显示已有线头与停顿线结，未修改事件记录算法。
- `LivingLetter.jsx`：增加 `pauseMarks` 视觉开关。保留当前单根线展开所有未永久隐藏旧句的操作，同时单独显示停顿结，避免同位置多条删除线头互相遮挡。回放等其他调用默认行为不变。
- `HorizontalJourney.jsx`：增加恢复样式作用域、页名和读信入口回调；当前状态、门禁和章节顺序保持。
- `animalAssets.js`、`keeperRooms.js`、`postOffice.js`：仅调整视觉资源映射。信件数据、角色个性内容保留。
- `main.jsx`：最后载入视觉适配层。

## 保留的当前功能

最新场景/长信修改后，以下七个文件仍与 `Before-Sending-long-letter-backup-20260928` 备份 SHA-256 一致：`App.jsx`、`data/journey.mjs`、`trace/letterSession.js`、`AdministratorSystem.jsx`、`ThreadTail.jsx`、`SentLetterMemory.jsx`、`i18n/Language.jsx`。`JourneyRitual.jsx` 仅清理装饰性文案及对应标题结构，不改变寄信状态和操作回调。

按最新明确要求，纵向滚动距离驱动全屏场景叠层转场和章节吸附，四个管理员地址仍合并到一个共享场景。没有恢复横向滚动。浏览器存储键、信件数据、管理员性格、停顿/删除/替换事件、永久隐藏逻辑、拉线与回放实现没有恢复成旧版本。封信、邮票、投递、等待仍使用当前完成状态与逐步解锁逻辑。语言系统未修改。

视觉更换的必要差异：旧角色静态姿态与淡入淡出取代新版角色视频；动作触发、选择及业务回调仍保留。当前 20 个有信抽屉的数据映射到原 35 格墙面，不删成截图中的少量样信。

## 素材排除

原始美术目录的“新版”子目录标记为 **EXCLUDED**。没有读取它来生成任何替代图，没有把它的图换路径继续使用。

旧网页派生目录 `public/assets/animals_v2_cutout`、`keeper-rooms`、`post-office`，以及旧 embedded HTML 和对应新版动物制作脚本已移到项目外备份，网页不再提供或打包这些文件。原始美术没有删除。备份位置：`C:/Users/32714/Desktop/Before-Sending-visual-backup-20260928/excluded/`。

Vite 禁止访问原始禁用目录；迁移脚本不再包含原始美术目录或新版动物清单。构建重新生成，旧 dist 中的禁用成品也已清除。

`node tools/verify-visual-restoration.mjs` 会扫描源码及构建输出，核对 26 个关键旧资产（含旧纸中央提取的重复纹理）和被排除的分发目录。排除规则与本说明中的路径是审计文字，不是加载素材的引用。

## 已恢复页面

HOME、KEEPER SELECTION、WRITING DESK、ARCHIVE 已逐页对照。装信、邮票、投递、等待和回放使用同一套旧纸张/旧插画与浅色文字规则，没有变更流程。

后续结构要求优先于早期静态截图中的布局：首页改为满屏、左上单品牌与大幅旧插画；Keeper 改为同一场景先选人、再显示信封；Writing Desk 先桌面、再同纸等比抬起。旧背景、旧角色、淡色笔触和当前功能仍保留。没有重新生成图片，也没有引入新版素材。

首页原图仍是 `administrators/home-original.png`；仅在 DOM 中按既有 `prepare-home-layers.mjs` 的边界互补裁剪，保留整幅原画的花草与连线。底层纸色使用现有 `home-stage/paper-field.jpg`，该文件的原制作脚本明确从同一旧首页图取样。没有生成替代插画。

长信使用原 `paper.png` 的顶部和底部，中间新增 `paper-middle.png`。`tools/prepare-long-paper.ps1` 从原纸 (0,351,1264,80) 提取纸纹并镜像拼接，以保持纵向重复边界连续；原纸图像不修改。增加的是中段内容高度，不是将原图纵向拉伸。管理员是独立旧 PNG，始终位于实际纸底。

验证详情和截图见 `design-qa.md`。运行方式仍为双击 `start-demo.cmd` 或执行 `npm start`。

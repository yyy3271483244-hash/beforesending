export const ART = "/assets/art";

export const writingTools = [
  {
    id: "fountain",
    label: "钢笔",
    image: `${ART}/pen-fountain.png`,
    note: "墨色较深，落笔会稍微停留",
  },
  {
    id: "pencil",
    label: "铅笔",
    image: `${ART}/pen-pencil.png`,
    note: "线条轻，删除时留下擦痕",
  },
  {
    id: "ballpoint",
    label: "圆珠笔",
    image: `${ART}/pen-ballpoint.png`,
    note: "字迹细而连续",
  },
];

export const paperChoices = [
  { id: "fiber", label: "花瓣纤维纸", note: "手工纤维与碎花会留住墨迹", image: "/assets/ui-reference/paper-flower-fiber.jpg" },
  { id: "ledger", label: "纸夹素笺", note: "像从私人档案里取下的一页", image: "/assets/ui-reference/paper-clipped.jpg" },
  { id: "onion", label: "旧式边框信纸", note: "印刷边框包住没有说完的话", image: "/assets/ui-reference/paper-ornament.jpg" },
];

export const envelopeChoices = [
  { id: "ash", label: "米白信封", image: "/assets/archive-envelopes/ivory.png" },
  { id: "blue", label: "雾蓝信封", image: "/assets/archive-envelopes/blue.png" },
  { id: "wine", label: "浅粉信封", image: "/assets/archive-envelopes/pink.png" },
];

export const stampChoices = [
  { id: "distance", label: "森林距离", image: "/assets/ui-reference/stamp-forest.jpg" },
  { id: "window", label: "空椅与窗", image: `${ART}/stamp-window.png` },
  { id: "night", label: "夜间路线", image: `${ART}/stamp-night.png` },
  { id: "flowers", label: "未寄出的花", image: "/assets/ui-reference/stamp-flower.jpg" },
];

export const identityChoices = [
  { id: "real", label: "真实姓名" },
  { id: "nickname", label: "昵称" },
  { id: "initials", label: "首字母" },
  { id: "anonymous", label: "不署名" },
  { id: "relation", label: "一种关系" },
];

export const destinationChoices = [
  { id: "recipient", label: "寄给一个人", note: "在演示中模拟递送，不会真的发送邮件" },
  { id: "public", label: "放进世间", note: "匿名进入公共信件档案" },
  { id: "private", label: "收进私人抽屉", note: "只留在这次浏览中" },
  { id: "vanish", label: "让它消失", note: "抵达后不保存" },
];

export const archiveLetters = [
  {
    id: "archive-00",
    recipient: "写给曾经爱过的人",
    date: "2025.08.16",
    status: "已寄出",
    category: "恋人",
    opening: "我终于没有再问，如果那天我们都慢一点。",
    text: "我终于没有再问，如果那天我们都慢一点。\n\n这并不等于我忘记了。只是那些没有被说完的话，已经在后来很长的时间里，慢慢有了自己的结尾。",
    envelope: "wine",
  },
  {
    id: "archive-01",
    recipient: "写给已经离开的人",
    date: "2025.11.03",
    status: "未寄出",
    category: "已经离开的人",
    opening: "那天我把你的杯子挪回了原来的位置。",
    text: "那天我把你的杯子挪回了原来的位置。\n\n并不是因为忘了你已经不在，只是桌面空得太完整，我一时不知道该把手放在哪里。后来雨下了很久，我没有关窗。",
    envelope: "wine",
  },
  {
    id: "archive-02",
    recipient: "写给十七岁的我",
    date: "2026.01.18",
    status: "只留在这里",
    category: "过去的自己",
    opening: "你以为那扇门关上以后，世界就会变小。",
    text: "你以为那扇门关上以后，世界就会变小。\n\n其实它只是换了一种打开的方法。你没有做错所有事，也不必在每一次沉默里寻找证据。",
    envelope: "blue",
  },
  {
    id: "archive-03",
    recipient: "写给妈妈",
    date: "2026.03.07",
    status: "已寄出",
    category: "家人",
    opening: "我总说路上不堵，其实只是怕你继续等。",
    text: "我总说路上不堵，其实只是怕你继续等。\n\n我知道你的灯为什么总是亮到很晚。下次回家，我会提前告诉你真的时间。",
    envelope: "ash",
  },
  {
    id: "archive-04",
    recipient: "写给很久以前的朋友",
    date: "2026.04.22",
    status: "未寄出",
    category: "朋友",
    opening: "我们没有告别，只是后来谁也没有再问。",
    text: "我们没有告别，只是后来谁也没有再问。\n\n我偶尔仍会在经过旧车站时想起你说过的话。不是想回去，只是想承认那段路确实存在过。",
    envelope: "blue",
  },
  {
    id: "archive-05",
    recipient: "写给未来的我",
    date: "2026.06.30",
    status: "只留在这里",
    category: "未来的自己",
    opening: "希望你看到这封信时，已经不再急着证明什么。",
    text: "希望你看到这封信时，已经不再急着证明什么。\n\n这里的我仍在学习怎样慢一点。请替我看看，窗边那盆植物后来有没有开花。",
    envelope: "ash",
  },
];

export function createLetterDraft() {
  return {
    id: `letter-${Date.now()}`,
    createdAt: Date.now(),
    recipient: "",
    finalText: "",
    selectedPen: "fountain",
    selectedPaper: "fiber",
    selectedEnvelope: "ash",
    selectedStamp: "distance",
    senderIdentityType: "anonymous",
    senderIdentity: "",
    destinationType: "recipient",
    origin: "北京",
    destination: "成都",
    recipientEmail: "",
    deliveryStatus: "draft",
    deliveryStart: null,
    deliveryArrival: null,
    realArrivalDate: null,
    writingEvents: [],
    deletedFragments: [],
    versions: [],
    decorations: [],
    writingStartedAt: null,
    writingEndedAt: null,
    publicArchivePermission: false,
    traceSharingPermission: false,
  };
}

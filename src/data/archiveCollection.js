import { archiveLetters } from "./content";

const occupied = [9, 16, 17, 18, 25, 26];
const companions = [
  [["给那年夏天", "那条小路后来种满了树。", "我又从那里经过了一次。树影落在以前等车的地方，像一封不需要寄出的回信。"], ["给下一次相见", "这次，我想慢慢说。", "不必一次讲完，也不必把每一个停顿填满。留一点安静给我们坐一会儿。"]],
  [["给旧房间", "窗边的光还和从前一样。", "我带走了几本书，留下一枚找不到锁的钥匙。有些地方，不住了也还是记得。"], ["给一段告别", "那天没有说完的话，今天写在这里。", "它并不需要一个新的答案。我只是想让那些字有一个可以落下来的地方。"]],
  [["给明天的自己", "今天先写到这里吧。", "剩下的话留给明天。那时候，也许窗外会有不同的声音，你会想到另一种说法。"], ["给第一次出发", "你把车票折了两次，放进口袋。", "后来记得最清楚的不是目的地，而是站台上那一阵风。请替我留住它。"]],
  [["给晚饭后的灯", "桌上的汤还留着一点温度。", "有些照顾没有写成句子，却每天准时出现。今天想把它们认真放进一封信。"], ["给家里的窗", "我看见你新换的窗帘了。", "照片里只有小小的一角，但我一下就认出了家。等见面时，我们再慢慢聊。"]],
  [["给旧同桌", "翻书的时候，掉出来一张小纸条。", "上面没有重要的事。只是那个下午，你问我放学以后要不要绕远一点走。"], ["给一次远行", "隔着很远的地方，也想起了你。", "这里的雨停得很慢。等天晴了，我会去拍你说过的那座桥，再给你写一封。"]],
  [["给下一个春天", "窗边已经有了一点新的绿色。", "不知道到那时我们在哪里。先把这个很小的变化记下来，让它等一等未来。"], ["给慢下来的日子", "今天没有什么需要赶着完成。", "我整理了抽屉，把散开的信放在一起。空出来的一小格，就留给还没有写的话。"]],
];

export const archiveEntries = archiveLetters.flatMap((entry, index) => {
  const siblings = companions[index].map(([recipient, opening, text], number) => ({
    id: `${entry.id}-${number + 1}`, recipient, opening, text: `${opening}\n\n${text}`,
    date: entry.date, status: "馆藏样信", category: entry.category,
  }));
  return [entry, ...siblings].map((item, number) => ({
    ...item, title: item.recipient, previewText: item.opening, finalText: item.text,
    colorVariant: ["ivory", "pink", "blue"][number], envelopeKind: ["ash", "wine", "blue"][number],
    events: [], fragments: [], knots: [], stitch: [], allowTraces: false,
    drawer: occupied[index], slot: number,
  }));
});

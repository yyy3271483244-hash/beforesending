import { useMemo, useState } from "react";
import { ART, archiveLetters, envelopeChoices } from "../data/content";

const categories = ["全部", "恋人", "家人", "朋友", "过去的自己", "未来的自己", "已经离开的人"];

function envelopeFor(id) {
  return envelopeChoices.find((item) => item.id === id) || envelopeChoices[0];
}

export default function ArchiveScene({ contributedLetters = [], onBack, onWrite }) {
  const [category, setCategory] = useState("全部");
  const [selected, setSelected] = useState(null);
  const allLetters = useMemo(() => [...contributedLetters, ...archiveLetters], [contributedLetters]);
  const filtered = category === "全部" ? allLetters : allLetters.filter((letter) => letter.category === category);

  const drawLetter = () => {
    if (!filtered.length) return;
    let next = filtered[Math.floor(Math.random() * filtered.length)];
    if (next.id === selected?.id && filtered.length > 1) {
      next = filtered[(filtered.indexOf(next) + 1) % filtered.length];
    }
    setSelected(next);
  };

  return (
    <main className="bs-archive-scene">
      <button className="bs-margin-back" onClick={onBack}>回到那间房</button>
      <header className="bs-archive-heading">
        <p>公共信件档案 / 无编号室</p>
        <h1>有些信在这里，等一个陌生人读到。</h1>
      </header>

      <div className="bs-archive-workspace">
        <aside className="bs-archive-filters" aria-label="按写信对象筛选">
          <h2>TO / FROM</h2>
          {categories.map((item) => (
            <button key={item} className={category === item ? "is-active" : ""} onClick={() => { setCategory(item); setSelected(null); }}>
              <span>♡</span>{item}
            </button>
          ))}
          <small>选择一种关系，<br />再从右边抽一封信。</small>
        </aside>

        <section className="bs-archive-room">
          <header className="bs-reading-banner">
            <div><small>READING ROOM / LETTER BOX 017</small><h2>从这里抽出一封，写给某种关系的信。</h2></div>
            <img src={`${ART}/characters-connected.png`} alt="两个小人靠近彼此" />
          </header>
          <div className="bs-envelope-browser" aria-label="匿名信件格">
          {filtered.slice(0, 8).map((letter, index) => (
            <button
              className="bs-browser-envelope"
              key={letter.id}
              onClick={() => setSelected(letter)}
              aria-label={`打开${letter.recipient}`}
            >
              <img src={envelopeFor(letter.envelope).image} alt="" />
              <span><b>{letter.recipient}</b><small>{letter.date} · {letter.status}</small></span>
            </button>
          ))}
          </div>

        <button className="bs-draw-handle" onClick={drawLetter}>
          <span>从档案里抽一封</span>
        </button>
        </section>
      </div>

      {selected && (
          <section
            className="bs-opened-letter-desk"
          >
            <button className="bs-letter-return" onClick={drawLetter}>继续抽另一封</button>
            <div
              className="bs-open-envelope"
            >
              <img src={envelopeFor(selected.envelope).image} alt={`${selected.recipient}的信封`} />
            </div>
            <article
              className="bs-stranger-letter"
            >
              <header>
                <span>{selected.date}</span>
                <span>{selected.status}</span>
              </header>
              <h2>{selected.recipient}</h2>
              <p>{selected.text}</p>
              <footer>此处没有评论，也不会显示谁读过它。</footer>
            </article>
            <aside
              className="bs-letter-response"
            >
              <b>attached note</b>
              <p>有人读到这里，停了一会儿。没有留下评论，只把信重新折好。</p>
            </aside>
          </section>
        )}

      <button className="bs-archive-write" onClick={onWrite}>读完以后，也写一封</button>
    </main>
  );
}

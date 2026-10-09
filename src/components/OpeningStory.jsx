import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ART } from "../data/content";

const navItems = ["HOME", "WRITING", "READING", "ABOUT"];

function BlogBox({ title, tone = "pink", icon = "♥", children, className = "" }) {
  return (
    <section className={`ob-box ob-box--${tone} ${className}`}>
      <h2><span>{icon}</span>{title}</h2>
      <div className="ob-box__content">{children}</div>
    </section>
  );
}

function TinyButton({ color, children }) {
  return <span className={`ob-tiny-button ob-tiny-button--${color}`}>{children}</span>;
}

export default function OpeningStory({ onWrite, onRead }) {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !rootRef.current) return undefined;

    const context = gsap.context(() => {
      gsap.fromTo(
        [".ob-banner__logo", ".ob-scene-characters", ".ob-scene-letter", ".ob-scene-mailbox"],
        { opacity: 0, y: 18, rotate: -0.6 },
        { opacity: 1, y: 0, rotate: 0, duration: 0.85, stagger: 0.08, ease: "power2.out" },
      );
      gsap.to(".ob-scene-letter", {
        y: -8,
        rotate: -2,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".ob-status-light", {
        opacity: 0.35,
        duration: 1.1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, rootRef);

    return () => context.revert();
  }, []);

  return (
    <main className="ob-site" ref={rootRef}>
      <div className="ob-browser-note">★ best viewed in 1024 × 768 · internet explorer 6.0 · sound on ★</div>

      <header className="ob-banner">
        <div className="ob-banner__logo" aria-label="Before Sending">
          <span className="ob-logo-before">BEFORE</span>
          <span className="ob-logo-sending">SENDING</span>
          <small>句 子 形 成 之 前</small>
        </div>
        <img className="ob-banner__characters" src={`${ART}/characters-connected.png`} alt="Before Sending 的两个小人" />
        <img className="ob-banner__mail" src="/assets/archive-envelopes/blue.png" alt="蓝色信封" />
        <span className="ob-banner__star ob-banner__star--one">★</span>
        <span className="ob-banner__star ob-banner__star--two">♥</span>
        <span className="ob-banner__tag">a tiny home for words not sent yet</span>
      </header>

      <nav className="ob-nav" aria-label="网站导航">
        <span className="ob-nav__start">♥</span>
        {navItems.map((item, index) => (
          <button
            type="button"
            key={item}
            className={index === 0 ? "is-current" : ""}
            onClick={item === "WRITING" ? onWrite : item === "READING" ? onRead : undefined}
            title={item === "WRITING" || item === "READING" ? `enter ${item.toLowerCase()}` : item}
          >
            {item}
          </button>
        ))}
        <span className="ob-nav__end">☆</span>
      </nav>

      <div className="ob-marquee" aria-label="网站滚动消息">
        <span className="ob-marquee__track">♡ welcome to BEFORE SENDING ♡ some letters arrive late · some stay in the drawer · last update 21.08.2026 ♡</span>
      </div>

      <div className="ob-layout">
        <aside className="ob-sidebar ob-sidebar--left">
          <BlogBox title="PROFILE" tone="blue" icon="☆">
            <div className="ob-profile-picture">
              <img src={`${ART}/character-writing.png`} alt="蓝衣小人正在写信" />
              <span className="ob-blink-dot" />
            </div>
            <p className="ob-profile-name">before_sender</p>
            <p className="ob-muted">a quiet person on the other side of the screen.</p>
          </BlogBox>

          <BlogBox title="ABOUT" tone="pink" icon="♥">
            <p>这里收藏一封信在寄出以前，曾经犹豫过的时间。</p>
            <p className="ob-signature">from somewhere, 2005-ish</p>
          </BlogBox>

          <BlogBox title="LINKS" tone="mint" icon="→">
            <ul className="ob-link-list">
              <li><button type="button">my writing desk</button></li>
              <li><button type="button">stranger letters</button></li>
              <li><button type="button">tiny mail archive</button></li>
              <li><button type="button">guestbook (closed)</button></li>
            </ul>
          </BlogBox>

          <BlogBox title="MOOD" tone="yellow" icon="☀">
            <p className="ob-now"><b>currently:</b><br />waiting...</p>
            <div className="ob-mood-meter"><i /><i /><i /><i /><i /></div>
          </BlogBox>

          <div className="ob-button-stack" aria-label="旧网页按钮装饰">
            <TinyButton color="pink">WRITE ME!</TinyButton>
            <TinyButton color="blue">MAIL CLUB</TinyButton>
            <TinyButton color="mint">NO AI ♡</TinyButton>
          </div>
        </aside>

        <section className="ob-main-column">
          <div className="ob-panel-title"><span>♥</span> BEFORE SENDING — MAIN ROOM <span>♥</span></div>

          <section className="ob-main-scene" aria-label="Before Sending 首页场景">
            <div className="ob-scene-windowbar">
              <span>♡ before_sending.htm</span>
              <span className="ob-window-controls">_ □ ×</span>
            </div>
            <div className="ob-scene-grid">
              <section className="ob-scene-intro">
                <p className="ob-scene-kicker">WELCOME TO MY HOMEPAGE!</p>
                <h3><span>BEFORE</span><em>SENDING</em></h3>
                <p>一封信被看见以前，<br />先在一个人心里修改很多次。</p>
                <div className="ob-scene-mini-nav"><span>story</span><span>letter</span><span>memory</span></div>
              </section>

              <div className="ob-scene-stage">
                <span className="ob-stage-label">THE TWO OF THEM</span>
                <span className="ob-stage-note ob-stage-note--one">you said: “it’s fine.”</span>
                <span className="ob-stage-note ob-stage-note--two">draft saved at 01:42 am</span>
                <img className="ob-scene-characters" src={`${ART}/characters-seated.png`} alt="两个小人坐在同一个房间里" />
                <img className="ob-scene-letter" src="/assets/archive-envelopes/ivory.png" alt="一封等待被寄出的信" />
                <span className="ob-stage-heart">♥</span>
                <div className="ob-stage-footer"><span>MESSAGE: 01</span><span>REPLY: —</span></div>
              </div>

              <aside className="ob-scene-mailbox">
                <div className="ob-mailbox-title">MAIL BOX</div>
                <img src={`${ART}/mailbox-blue.png`} alt="蓝色邮筒" />
                <p>new mail: <b>01</b><br />unread: <b>01</b></p>
              </aside>
            </div>
            <div className="ob-scene-statusbar">
              <span>● online</span>
              <span>currently: waiting for the right words...</span>
              <span>21.08.2006</span>
            </div>
          </section>

          <div className="ob-scene-caption">
            <span>WELCOME!</span>
            <p>有些信已经寄出，有些信从未抵达，<br />有些信只是为了被写下。</p>
          </div>

          <section className="ob-entry-room" aria-labelledby="entry-room-title">
            <div className="ob-entry-title" id="entry-room-title">☆ WHERE WOULD YOU LIKE TO GO? ☆</div>
            <div className="ob-entry-grid">
              <button type="button" className="ob-entry ob-entry--writing" onClick={onWrite}>
                <img className="ob-entry-character" src={`${ART}/character-writing.png`} alt="一个人坐在桌边写信" />
                <img className="ob-entry-envelope" src="/assets/archive-envelopes/ivory.png" alt="" />
                <span><b>WRITING</b><small>write what stayed unsaid</small></span>
              </button>
              <div className="ob-entry-divider">OR</div>
              <button type="button" className="ob-entry ob-entry--reading" onClick={onRead}>
                <img className="ob-entry-character" src={`${ART}/characters-separated.png`} alt="两个隔着距离的人" />
                <img className="ob-entry-envelope" src="/assets/archive-envelopes/blue.png" alt="" />
                <span><b>READING</b><small>draw a stranger's letter</small></span>
              </button>
            </div>
            <p>choose one of the two pieces of paper above · no registration required</p>
          </section>

          <BlogBox title="SITE UPDATES" tone="blue" icon="★" className="ob-updates">
            <table>
              <tbody>
                <tr><th>21.08.26</th><td>changed the homepage skin ♡</td></tr>
                <tr><th>18.08.26</th><td>counted 142 erased words</td></tr>
                <tr><th>12.08.26</th><td>found a blue mailbox</td></tr>
              </tbody>
            </table>
          </BlogBox>

          <div className="ob-webmaster-note">
            <span className="ob-mini-envelope">✉</span>
            <p><b>webmaster note:</b> this homepage is still under construction. please leave the unfinished parts unfinished for a little while.</p>
            <span className="ob-under-construction">UNDER<br />CONSTRUCTION</span>
          </div>
        </section>

        <aside className="ob-sidebar ob-sidebar--right">
          <BlogBox title="STATUS" tone="pink" icon="♥">
            <p className="ob-status-line"><span className="ob-status-light" /> waiting...</p>
            <p>window: open<br />music: none<br />ink: still wet</p>
          </BlogBox>

          <BlogBox title="LETTERS" tone="blue" icon="✉">
            <table className="ob-counter-table">
              <tbody>
                <tr><th>sent</th><td>0027</td></tr>
                <tr><th>unsent</th><td>0013</td></tr>
                <tr><th>words erased</th><td>00142</td></tr>
              </tbody>
            </table>
          </BlogBox>

          <BlogBox title="WEATHER" tone="mint" icon="☁">
            <div className="ob-weather"><span>☁</span><p><b>cloudy</b><br />17°C / light wind</p></div>
          </BlogBox>

          <div className="ob-stamp-widget">
            <img src={`${ART}/stamp-flowers.png`} alt="花朵邮票" />
            <span>tiny postal graphic</span>
          </div>

          <BlogBox title="VISITORS" tone="yellow" icon="☆">
            <div className="ob-visitor-counter" aria-label="访客 1273">0 0 1 2 7 3</div>
            <p className="ob-center">you are not alone here.</p>
          </BlogBox>

          <BlogBox title="ARCHIVE" tone="pink" icon="▣">
            <ul className="ob-archive-list">
              <li><span>2026.08</span><b>04</b></li>
              <li><span>2026.07</span><b>09</b></li>
              <li><span>2026.06</span><b>12</b></li>
            </ul>
          </BlogBox>

          <div className="ob-last-update">LAST UPDATE<br /><b>21.08.2026</b></div>
        </aside>
      </div>

      <footer className="ob-footer">
        <p>♡ BEFORE SENDING personal homepage ♡ established 2026 / best viewed slowly</p>
        <p>HOME · WRITING · READING · ABOUT · TOP</p>
        <span>made with two characters, one mailbox &amp; many unsent words</span>
      </footer>
    </main>
  );
}

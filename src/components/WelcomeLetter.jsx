import { useI18n } from "../i18n/Language";import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export function WelcomeLetter({ onRead, onContinue, onResponse }) {const { t } = useI18n();
  const root = useRef(null),envelope = useRef(null),paper = useRef(null),heading = useRef(null);
  const scroll = useRef(null),timeline = useRef(null),locked = useRef(false);
  const [phase, setPhase] = useState('closed');
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  useLayoutEffect(() => {
    root.current.querySelector('h1')?.focus({ preventScroll: true });
    return () => timeline.current?.kill();
  }, []);
  useEffect(() => {
    if (phase !== 'reading') return;
    heading.current?.focus({ preventScroll: true });
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) onResponse(visible.target.dataset.response);
    }, { root: scroll.current, threshold: [.4, .75] });
    scroll.current.querySelectorAll('[data-response]').forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [phase, onResponse]);

  function open() {
    if (locked.current) return;
    locked.current = true;
    setPhase('opening');
    const container = root.current.getBoundingClientRect();
    const box = envelope.current.getBoundingClientRect();
    const width = box.width * .84,height = Math.min(container.height * .28, box.height * .9);
    const x = box.left - container.left + box.width * .08;
    const y = box.top - container.top + box.height * .08;
    const endWidth = Math.min(640, container.width - 48);
    const endHeight = container.height * (container.width < 700 ? .66 : .70);
    const endTop = container.height - 104 - endHeight;
    const quiet = reduced();
    const duration = (value) => quiet ? .01 : value;
    const at = (value) => quiet ? 0 : value;
    const paragraphs = root.current.querySelectorAll('.welcome-letter > p');
    const title = heading.current;
    const continueButton = root.current.querySelector('.entrance-continue');
    gsap.set(paper.current, { left: x, top: y, width, height, visibility: 'visible', zIndex: 2 });
    gsap.set([title, ...paragraphs, continueButton], { opacity: 0, y: quiet ? 0 : 7 });
    gsap.set(root.current.querySelector('.welcome-envelope-flap'), { transformPerspective: 900 });
    timeline.current = gsap.timeline({ defaults: { ease: 'sine.inOut' }, onComplete: () => {
        setPhase('reading');
        gsap.set(paper.current, { clearProps: 'left,top,width,height' });
        onRead();
      } }).
    to(root.current.querySelectorAll('.welcome-knot i'), { x: (index) => quiet ? 0 : index ? 14 : -14, y: quiet ? 0 : -5, opacity: 0, duration: duration(.32) }, 0).
    to(root.current.querySelector('.welcome-knot'), { opacity: 0, duration: duration(.23) }, at(.17)).
    to(root.current.querySelector('.welcome-envelope-flap'), { rotateX: quiet ? 0 : -178, opacity: quiet ? 0 : 1, duration: duration(.48) }, at(.22)).
    set(root.current.querySelector('.welcome-envelope-flap'), { zIndex: 1 }, at(.55)).
    to(root.current.querySelectorAll('.welcome-greeting,.welcome-invitation'), { opacity: 0, duration: duration(.3) }, at(.32)).
    to(paper.current, { top: endTop, height: endHeight, duration: duration(1.38), ease: 'power2.inOut' }, at(.58)).
    to(paper.current, { left: (container.width - endWidth) / 2, width: endWidth, duration: duration(.98), ease: 'sine.inOut' }, at(.98)).
    set(paper.current, { zIndex: 7 }, at(1.78)).
    to(root.current.querySelectorAll('.welcome-paper-fold'), { opacity: .18, duration: duration(.5) }, at(1.35)).
    to(root.current.querySelector('.welcome-reading-shade'), { opacity: 1, duration: duration(.6) }, at(.95)).
    to(title, { opacity: 1, y: 0, duration: duration(.35) }, at(.85)).
    to([...paragraphs].slice(0, 2), { opacity: 1, y: 0, duration: duration(.38), stagger: quiet ? 0 : .05 }, at(1.1)).
    to([...paragraphs].slice(2), { opacity: 1, y: 0, duration: duration(.4), stagger: quiet ? 0 : .035 }, at(1.35)).
    to(continueButton, { opacity: 1, y: 0, duration: duration(.2) }, at(1.9));
  }

  function leave() {
    if (phase !== 'reading') return;
    setPhase('leaving');
    timeline.current?.kill();
    timeline.current = gsap.timeline({ defaults: { duration: reduced() ? .01 : .6, ease: 'sine.inOut' }, onComplete: onContinue })
      .to(paper.current, { y: reduced() ? 0 : 36, opacity: 0 }, 0)
      .to(envelope.current, { opacity: 0 }, 0)
      .to(root.current.querySelector('.welcome-reading-shade'), { opacity: 0 }, 0);
  }

  return <section ref={root} className={`welcome-ritual phase-${phase}`} aria-label={t("欢迎信")}>
    <div className="welcome-reading-shade" aria-hidden="true" />
    <h1 className="welcome-greeting" tabIndex={-1} aria-hidden={phase !== 'closed'}>{t("你来啦。")}<br />{t("这里有一封你的信。")}</h1>
    <button ref={envelope} className="welcome-envelope" disabled={phase !== 'closed'} onClick={open} aria-label={t("拆开看看")} aria-hidden={phase === 'reading'}>
      <span className="welcome-envelope-lining" aria-hidden="true" />
      <img className="welcome-envelope-flap" src="/assets/archive-envelopes/ivory.png" alt="" />
      <img className="welcome-envelope-front" src="/assets/archive-envelopes/ivory.png" alt="" />
      <span className="welcome-addressee">{t("给刚刚走进来的你")}</span>
      <span className="welcome-knot" aria-hidden="true"><i /><i /></span>
    </button>
    <p className="welcome-invitation" aria-hidden={phase !== 'closed'}>{t("拆开看看")}</p>
    <div ref={paper} className="welcome-floating-paper" inert={phase !== 'reading' ? true : undefined} aria-hidden={phase !== 'reading'}>
      <div className="welcome-paper-fold fold-upper" aria-hidden="true" />
      <div className="welcome-paper-fold fold-lower" aria-hidden="true" />
      <div className="welcome-letter-scroll" ref={scroll} tabIndex={phase === 'reading' ? 0 : -1} aria-label={t("欢迎信正文")}>
        <article className="welcome-letter">
          <h1 ref={heading} tabIndex={-1}>{t("给刚刚走进来的你")}</h1>
          <p>{t("你来啦。")}</p>
          <p>{t("先不用急着想，要把信寄给谁。也不必一坐下来，就知道第一句话该怎么写。")}</p>
          <p>{t("有些话，我们已经在心里说过很多遍，却还没有找到一个合适的开头。这里，为这些话留了一张信纸。")}</p>
          <p data-response="companions">{t("等你坐下，可以请一位管理员陪着你。小狗愿意接过你的信，猫会安静地待在一旁；兔子照看针线，老鼠收好那些暂时不想丢掉的纸条。")}</p>
          <p data-response="thread">{t("写到一半停下来，没有关系。删去一句，再换一种说法，也没有关系。信纸边上的线头，会把这些迟疑轻轻留下。回头看看，也许就能找到下一句的开头。")}</p>
          <p data-response="keeping">{t("没有写完的信，可以先留在这台设备的草稿里。那些舍不得的句子，也可以沿着痕迹慢慢找回来。不必今天就整理好，更不必今天就寄出。")}</p>
          <p>{t("在一封信抵达别人之前，")}<br />{t("它先陪你，走过了一段路。")}</p>
          <p className="welcome-signature">{t("我们在这里，慢慢等你。")}<br /><span>{t("Before Sending · 信件处")}</span></p>
          <button className="entrance-continue" onClick={leave}>{t("坐下来，写封信")}<span aria-hidden="true">→</span></button>
        </article>
      </div>
    </div>
  </section>;
}

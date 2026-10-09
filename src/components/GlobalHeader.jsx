import {createPortal} from 'react-dom';
import {useEffect, useState} from 'react';
import {useI18n, LanguageSwitch} from '../i18n/Language';

export function GlobalHeader({navigate, busy, about, toggleAbout, currentId}) {
  const {language}=useI18n(), en=language==='en';
  const [titleRun,setTitleRun]=useState(0);
  useEffect(()=>{if(currentId==='opening')setTitleRun(run=>run+1);},[currentId]);
  return createPortal(<header className="global-header" data-global-header>
    <div className="global-header-inner">
      <button className="global-brand" onClick={()=>navigate('opening')} disabled={busy} aria-label="Before Sending">
        {currentId==='opening' ? <span className="global-brand-art" aria-hidden="true">
          <img key={`before-${titleRun}`} src={`/assets/branding/before-embroidered.webp?run=${titleRun}`} alt="" draggable={false} />
          <img key={`sending-${titleRun}`} src={`/assets/branding/sending-embroidered.webp?run=${titleRun}`} alt="" draggable={false} />
        </span> : 'Before Sending'}
      </button>
      <div className="global-header-right">
        <nav className="global-navigation" aria-label={en?'Post office navigation':'邮局导航'}>
          <button aria-current={currentId==='opening'?'page':undefined} onClick={()=>navigate('opening')} disabled={busy}>{en?'Home':'首页'}</button>
          <button aria-current={currentId==='write'?'page':undefined} onClick={()=>navigate('write')} disabled={busy}>{en?'Write a Letter':'写一封信'}</button>
          <button aria-current={currentId==='bureau'?'page':undefined} onClick={()=>navigate('bureau')} disabled={busy}>{en?'Anonymous Bureau':'匿名档案室'}</button>
          <button aria-expanded={about} onClick={toggleAbout}>{en?'About':'关于'}</button>
        </nav>
        <LanguageSwitch className="global-language" />
      </div>
    </div>
  </header>,document.body);
}

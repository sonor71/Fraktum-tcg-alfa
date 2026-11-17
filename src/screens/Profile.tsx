import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CloudAccountPanel } from "../cloud/CloudAccountPanel";
import { RARITY_ORDER } from "../game/cards";
import { getAvailableWillUpgradePoints, getXpRequiredForLevel, useGameStore, type OwnedCard } from "../useGameStore";
import { AVATARS, BANNERS, FRAMES, PixelAtlasTile, PlayerPortrait, PlayerIdentityChip, avatarValue, avatarIndex, useIdentity, type BannerId, type FrameId } from "../features/PlayerIdentity";

import { RankBadge, RANKS, useRankPreview, type RankId } from "../features/PlayerRanks";
import "../features/club-emotes-ranks.css";
type Tab = "appearance" | "cards" | "progress";
function number(n:number){return Math.max(0,Math.floor(n)).toLocaleString("ru-RU");}
function cardImage(card:OwnedCard){return card.frontSrc||card.image||"/cards/card-back.png";}

export default function Profile(){
  const navigate=useNavigate(), avatarInput=useRef<HTMLInputElement>(null);
  const name=useGameStore(s=>s.playerName),setName=useGameStore(s=>s.setPlayerName);
  const setAvatar=useGameStore(s=>s.setAvatar), avatar=useGameStore(s=>s.avatar);
  const level=useGameStore(s=>s.level),xp=useGameStore(s=>s.xp),wins=useGameStore(s=>s.wins);
  const history=useGameStore(s=>s.matchHistory),coins=useGameStore(s=>s.coins);
  const premium=useGameStore(s=>s.premium),packs=useGameStore(s=>s.openedPacksCount);
  const cards=useGameStore(s=>s.ownedCards),deck=useGameStore(s=>s.deckIds);
  const showcaseIds=useGameStore(s=>s.showcaseCardIds),setShowcaseCard=useGameStore(s=>s.setShowcaseCard);
  const upgrades=useGameStore(s=>s.willUpgrades);
  const frame=useIdentity(s=>s.frame),banner=useIdentity(s=>s.banner),bio=useIdentity(s=>s.bio);
  const setFrame=useIdentity(s=>s.setFrame),setBanner=useIdentity(s=>s.setBanner),setBio=useIdentity(s=>s.setBio);
  const [tab,setTab]=useState<Tab>("appearance");
  const rank=useRankPreview(s=>s.rank),setRank=useRankPreview(s=>s.setRank);
  const selectedAvatarIndex=avatarIndex(avatar);
  const usingFallbackAvatar=!avatar||avatar==="/vite.svg"||avatar.startsWith("/ui/fraktum/icons/");
  const displayedAvatarIndex=selectedAvatarIndex??(usingFallbackAvatar?0:null);
  const displayedFrame=FRAMES.some(item=>item.id===frame)?frame:FRAMES[0].id;
  const [editSlot,setEditSlot]=useState<number|null>(null),[query,setQuery]=useState(""),[notice,setNotice]=useState("");
  const chosen=useMemo(()=>[0,1,2].map(i=>cards.find(c=>c.instanceId===showcaseIds[i])??null),[cards,showcaseIds]);
  const filtered=useMemo(()=>[...cards].filter(c=>c.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a,b)=>(RARITY_ORDER[b.rarity]??0)-(RARITY_ORDER[a.rarity]??0)).slice(0,100),[cards,query]);
  const xpNeed=Math.max(1,getXpRequiredForLevel(level));
  const past=Array.from({length:Math.max(0,level-1)},(_,i)=>getXpRequiredForLevel(i+1)).reduce((a,b)=>a+b,0);
  const xpNow=Math.max(0,Math.min(xpNeed,xp-past));
  const stats=[["ПОБЕДЫ",wins],["МАТЧИ",history.length],["КАРТЫ",cards.length],
    ["В КОЛОДЕ",deck.length],["ОТКРЫТО ПАКОВ",packs],["МОНЕТЫ",coins],
    ["PREMIUM",premium],["ОЧКИ ВОЛИ",getAvailableWillUpgradePoints(level,upgrades)]];

  function upload(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>2_000_000){
      setNotice("Нужен JPG, PNG или WEBP до 2 МБ.");e.target.value="";return;
    }
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{try{
      const canvas=document.createElement("canvas");canvas.width=canvas.height=160;
      const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas");
      const side=Math.min(img.width,img.height);ctx.imageSmoothingEnabled=false;
      ctx.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,160,160);
      setAvatar(canvas.toDataURL("image/webp",.78));setNotice("Аватар сохранён.");
    }catch{setNotice("Не удалось обработать фото.");}finally{URL.revokeObjectURL(url);}};
    img.onerror=()=>{URL.revokeObjectURL(url);setNotice("Ошибка загрузки фото.");};
    img.src=url;e.target.value="";
  }
  return <section className="frProfilePage" data-banner={banner}>
    <header className="frProfileHero">
      <div className="frProfileHeroTop"><span>FRAKTUM / ПАСПОРТ ИГРОКА</span><button type="button" onClick={()=>navigate("/")}>← МЕНЮ</button></div>
      <div className="frProfileHeroMain">
        <PlayerPortrait size="large" />
        <div className="frProfileHeading">
          <span>ИГРОК • УРОВЕНЬ {level}</span><h1>{name||"Игрок FRAKTUM"}</h1>
          <p>{bio||"Ваша история начинается здесь. Выберите аватарку, рамку и любимые карты."}</p>
          <div className="frProfileXP"><i style={{width:Math.round(xpNow/xpNeed*100)+"%"}}/></div>
          <small>{number(xpNow)} / {number(xpNeed)} XP</small>
        </div>
      </div>
    </header>
    <nav className="frProfileTabs" role="tablist" aria-label="Профиль">
      {([["appearance","ОФОРМЛЕНИЕ"],["cards","ВИТРИНА КАРТ"],["progress","ПРОГРЕСС"]] as const).map(([id,label])=>
        <button key={id} type="button" role="tab" aria-selected={tab===id} className={tab===id?"is-active":""} onClick={()=>setTab(id)}>{label}</button>)}
    </nav>
    {tab==="appearance"&&<div className="frProfileColumns">
      <section className="frFantasyPanel">
        <h2>НАСТРОЙКА ИГРОКА</h2>
        <label className="frFieldLabel">НИКНЕЙМ<input maxLength={28} value={name} onChange={e=>setName(e.target.value)}/></label>
        <label className="frFieldLabel">О СЕБЕ<textarea rows={3} maxLength={140} value={bio} onChange={e=>setBio(e.target.value)} placeholder="Короткое описание игрока..."/></label>
        <h3>ЕДИНЫЙ СТАТУС ИГРОКА</h3><div className="frRankPreview"><RankBadge rank={rank}/><select aria-label="Предпросмотр статуса" value={rank} onChange={e=>setRank(e.target.value as RankId)}>{RANKS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></div><p className="frHint">Локальный предпросмотр. Платные и служебные статусы назначаются сервером.</p><h3>АВАТАРКИ · 15 ВАРИАНТОВ</h3>
        <div className="frAvatarPicker" role="group" aria-label="Выбор аватарки">
          {AVATARS.map(item=><button type="button" key={item.id}
            className={displayedAvatarIndex===item.index?"is-selected":""}
            aria-label={item.label} aria-pressed={displayedAvatarIndex===item.index}
            onClick={()=>{setAvatar(avatarValue(item.index));setNotice("Аватар выбран.");}} title={item.label}>
            <PixelAtlasTile index={item.index}/><small>{item.label}</small>
          </button>)}
          <button type="button" className="frAvatarCustomUpload" onClick={()=>avatarInput.current?.click()}>+ СВОЁ ФОТО</button>
        </div>
        <input ref={avatarInput} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={upload}/>
        {notice&&<p role="status" className="frHint">{notice}</p>}
        <p className="frHint">Выбранная рамка пока сохраняется только в этом браузере.</p>
      </section>
      <section className="frFantasyPanel">
        <h2>РАМКА И ФОН</h2><h3>РАМКИ</h3>
        <div className="frFrameGrid" role="group" aria-label="Выбор рамки">
          {FRAMES.map(item=><button type="button" key={item.id}
            className={displayedFrame===item.id?"is-selected":""}
            aria-label={item.label} aria-pressed={displayedFrame===item.id}
            onClick={()=>setFrame(item.id as FrameId)}>
            <span className="frPixelFramePreview">
              {displayedAvatarIndex===null ? <img alt="" src={avatar}/> : <PixelAtlasTile index={displayedAvatarIndex}/>}
              <PixelAtlasTile index={item.index}/>
            </span>
            <small>{item.label}</small>
          </button>)}
        </div>
        <h3>ФОН ПРОФИЛЯ</h3>
        <div className="frBannerPicker">{BANNERS.map(item=><button key={item.id} data-banner={item.id} type="button"
          className={banner===item.id?"is-selected":""} onClick={()=>setBanner(item.id as BannerId)}>{item.label}</button>)}</div>
      </section>

    </div>}
    {tab==="cards"&&<section className="frFantasyPanel frShowcasePanel">
      <header><h2>ВИТРИНА КАРТ</h2><p>Нажмите на слот, чтобы выбрать карту из своей коллекции.</p></header>
      <div className="frShowcaseGrid">{chosen.map((card,i)=><button type="button" className="frShowcaseSlot" key={i} onClick={()=>setEditSlot(i)}>
        {card?<img src={cardImage(card)} alt={card.title}/>:<span className="frShowcaseEmpty">✦</span>}
        <strong>{card?card.title:"ВЫБРАТЬ КАРТУ "+(i+1)}</strong><small>СЛОТ {i+1}</small>
      </button>)}</div>
      {editSlot!==null&&<div className="frCardPicker">
        <div className="frPanelHeading"><h3>КАРТА ДЛЯ СЛОТА {editSlot+1}</h3><button type="button" onClick={()=>setEditSlot(null)}>ЗАКРЫТЬ</button></div>
        <input value={query} placeholder="Поиск по коллекции..." onChange={e=>setQuery(e.target.value)}/>
        <div className="frCardPickerGrid">{filtered.map(card=><button key={card.instanceId} type="button" onClick={()=>{setShowcaseCard(editSlot,card.instanceId);setEditSlot(null);}}>
          <img alt="" src={cardImage(card)}/><span>{card.title}</span></button>)}</div>
        {!filtered.length&&<p>Нет карт для выбора. Получите их в магазине.</p>}
      </div>}
    </section>}
    {tab==="progress"&&<div className="frProfileColumns">
      <section className="frFantasyPanel"><h2>ДОСТИЖЕНИЯ</h2><div className="frStatGrid">{stats.map(([label,value])=>
        <div key={String(label)}><span>{label}</span><b>{number(Number(value))}</b></div>)}</div></section>
      <section className="frFantasyPanel"><h2>КАК ТЕБЯ ВИДЯТ</h2><PlayerIdentityChip/><p className="frHint">Эта карточка появляется в меню и рядом с героем во время матча.</p></section>
    </div>}
    <details className="frCloudDetails"><summary>СИНХРОНИЗАЦИЯ АККАУНТА</summary><CloudAccountPanel/></details>
  </section>;
}

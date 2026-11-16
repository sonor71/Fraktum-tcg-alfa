import { useMemo, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useGameStore } from "../useGameStore";
import { PlayerIdentityChip, PlayerPortrait } from "../features/PlayerIdentity";
import "./clubs.css";

type ClubTab = "home" | "chat" | "wars" | "cards";
type ClubMessage = { id:string; sender:string; text:string; createdAt:number };
type ClubDraft = {
  name:string; tag:string; messages:ClubMessage[];
  createClub:(name:string,tag:string)=>void;
  leaveClub:()=>void;
  postMessage:(sender:string,text:string)=>void;
};
const useClubDraft=create<ClubDraft>()(persist((set)=>({
  name:"",tag:"",messages:[],
  createClub:(name,tag)=>set({name:name.trim().slice(0,30),tag:tag.trim().toUpperCase().slice(0,5),messages:[]}),
  leaveClub:()=>set({name:"",tag:"",messages:[]}),
  postMessage:(sender,text)=>set((state)=>({messages:[...state.messages,
    {id:String(Date.now())+"-"+state.messages.length,sender,text:text.slice(0,400),createdAt:Date.now()}].slice(-100)})),
}),{name:"fraktum-club-local-v1"}));

const TABS:[ClubTab,string][]=[
  ["home","О КЛУБЕ"],["chat","ЧАТ"],["wars","ВОЙНЫ"],["cards","КАРТЫ"]
];
function formatTime(epoch:number){return new Date(epoch).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"});}
export default function Clubs(){
  const player=useGameStore(s=>s.playerName),level=useGameStore(s=>s.level);
  const wins=useGameStore(s=>s.wins),cards=useGameStore(s=>s.ownedCards.length);
  const clubName=useClubDraft(s=>s.name),clubTag=useClubDraft(s=>s.tag),messages=useClubDraft(s=>s.messages);
  const createClub=useClubDraft(s=>s.createClub),leaveClub=useClubDraft(s=>s.leaveClub),postMessage=useClubDraft(s=>s.postMessage);
  const [tab,setTab]=useState<ClubTab>("home");
  const [newName,setNewName]=useState(""),[newTag,setNewTag]=useState(""),[message,setMessage]=useState("");
  const [notice,setNotice]=useState("");
  const membership=useMemo(()=>({count:clubName?1:0,role:"ОСНОВАТЕЛЬ"}),[clubName]);
  function submitClub(){
    if(newName.trim().length<3||newTag.trim().length<2){setNotice("Название: от 3 символов. Тег: от 2 символов.");return;}
    createClub(newName,newTag);setTab("home");setNotice("");
  }
  function send(){
    if(!clubName){setNotice("Сначала создай локальный клуб.");return;}
    if(!message.trim())return;
    postMessage(player||"Игрок",message.trim());setMessage("");
  }
  return <section className="frClubsPage">
    <header className="frClubsHero">
      <div><small>FRAKTUM / СОЮЗЫ И КЛУБЫ</small><h1>КЛУБЫ</h1>
        <p>Собирай команду, показывай достижения и готовься к клубным войнам.</p></div>
      <PlayerIdentityChip compact />
    </header>
    <div className="frLocalNote" role="note">ТЕСТОВЫЙ РЕЖИМ · Клуб и сообщения сохраняются только на этом устройстве. Онлайн-синхронизация ещё не подключена.</div>
    {!clubName? <div className="frClubCreate">
      <div className="frClubEmblem" aria-hidden="true">✦</div>
      <div className="frClubIntro">
        <h2>ОСНОВАТЬ КЛУБ</h2>
        <p>Придумай имя своему объединению. Оформление и личный кабинет можно проверить прямо сейчас.</p>
        <form onSubmit={e=>{e.preventDefault();submitClub();}}>
          <label>НАЗВАНИЕ КЛУБА<input value={newName} maxLength={30} onChange={e=>setNewName(e.target.value)} placeholder="Например, Хранители Воли" required/></label>
          <label>ТЕГ<input value={newTag} maxLength={5} onChange={e=>setNewTag(e.target.value.toUpperCase())} placeholder="WILL" required/></label>
          <button type="submit">СОЗДАТЬ ЛОКАЛЬНЫЙ КЛУБ</button>
        </form>
        {notice&&<p role="status">{notice}</p>}
      </div>
    </div>:<>
      <div className="frClubOverview">
        <div className="frClubEmblem">✦<small>{clubTag}</small></div>
        <div className="frClubOverviewText"><span>КЛУБ • [{clubTag}]</span><h2>{clubName}</h2><p>Небольшой клубный дом и личная витрина участников.</p></div>
        <div className="frClubNumber"><strong>{membership.count}</strong><small>УЧАСТНИК</small></div>
      </div>
      <div className="frClubTabs" role="tablist" aria-label="Клубные разделы">
        {TABS.map(([id,label])=><button type="button" key={id} role="tab" aria-selected={tab===id}
          className={tab===id?"is-active":""} onClick={()=>setTab(id)}>{label}</button>)}
      </div>
      {tab==="home"&&<div className="frClubContent">
        <div className="frClubSection">
          <h3>УЧАСТНИКИ</h3>
          <div className="frMemberRow"><PlayerPortrait/><div><strong>{player}</strong><small>{membership.role} · LVL {level}</small></div><span className="frClubRole">ОСНОВАТЕЛЬ</span></div>
          <p className="frClubFinePrint">Другие участники появятся после подключения серверных приглашений.</p>
        </div>
        <div className="frClubSection frClubStats">
          <h3>ПРОГРЕСС ОСНОВАТЕЛЯ</h3>
          <div><span>ПОБЕДЫ</span><strong>{wins}</strong></div>
          <div><span>КАРТЫ</span><strong>{cards}</strong></div>
          <div><span>РЕЙТИНГ КЛУБА</span><strong>НЕ АКТИВЕН</strong></div>
          <button type="button" className="frClubLeave" onClick={()=>{if(window.confirm("Удалить локальный макет клуба с этого устройства?")){leaveClub();setTab("home");}}}>УДАЛИТЬ ЛОКАЛЬНЫЙ КЛУБ</button>
        </div>
      </div>}
      {tab==="chat"&&<div className="frClubSection frClubChat">
        <h3>ЧАТ КЛУБА</h3><p className="frClubFinePrint">Сейчас сообщения видны только тебе в этом браузере. Это проверка интерфейса, не настоящий групповой чат.</p>
        <div className="frChatLog" role="log" aria-live="polite">
          {!messages.length&&<div className="frChatEmpty">ЗДЕСЬ ПОЯВЯТСЯ ТВОИ СООБЩЕНИЯ. ОНЛАЙН-ЧАТ — В СЛЕДУЮЩЕЙ ВЕРСИИ.</div>}
          {messages.map(item=><div key={item.id} className="frChatBubble"><span>{item.sender}</span><p>{item.text}</p><small>{formatTime(item.createdAt)} · ЛОКАЛЬНО</small></div>)}
        </div>
        <form className="frChatCompose" onSubmit={e=>{e.preventDefault();send();}}>
          <input aria-label="Сообщение клубу" maxLength={400} value={message}
            onChange={e=>setMessage(e.target.value)} placeholder="Написать сообщение..."/>
          <button type="submit" disabled={!message.trim()}>ОТПРАВИТЬ</button>
        </form>
      </div>}
      {tab==="wars"&&<div className="frClubSection frClubFeature">
        <div className="frFeatureIcon">⚔</div><h3>КЛУБНЫЕ ВОЙНЫ</h3>
        <p>Здесь появятся заявки на войну, общий счёт и награды. Пока серверные клубные матчи недоступны.</p>
        <div className="frClubWarsMock"><span>[{clubTag}]</span><strong>VS</strong><span>???</span></div>
        <div className="frClubFinePrint">ПОДГОТОВКА РЕЖИМА</div>
      </div>}
      {tab==="cards"&&<div className="frClubSection frClubFeature">
        <div className="frFeatureIcon">✦</div><h3>КЛУБНЫЕ КАРТЫ</h3>
        <p>Особые клубные карты и награды будут привязаны к будущим войнам и клубному прогрессу.</p>
        <div className="frClubCardSlots"><span>?</span><span>?</span><span>?</span></div>
        <div className="frClubFinePrint">НЕ ДОСТУПНО В ЭТОЙ ВЕРСИИ</div>
      </div>}
    </>}
  </section>;
}

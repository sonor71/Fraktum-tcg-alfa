import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPackById } from "../data/packs";
import { useGameStore } from "../useGameStore";
import { useIdentity, type MusicTrack } from "./PlayerIdentity";

type ItemTab = "all" | "packs" | "chests" | "books" | "relics" | "music";
const CATEGORY:[ItemTab,string][]=[
  ["all","ВСЁ"],["packs","ПАКИ"],["chests","СУНДУКИ"],
  ["books","КНИГИ"],["relics","АРТЕФАКТЫ"],["music","МУЗЫКА"]
];
function Art({ index }: { index:number }){
  return <span className="frItemArt" style={{
    backgroundPosition:((index%6)*20)+"% "+(Math.floor(index/6)*100)+"%"
  }} aria-hidden="true"/>;
}
const CHRONICLE = [
  "Раньше обращение карт находилось под строгим контролем. Особые документы определяли порядок их использования и поддерживали баланс.",
  "После смерти главного создателя карт прежние правила начали нарушаться. Карты стали похищать, а некоторые матчи превратились в опасные поединки.",
  "На далёкой лесной поляне появился небольшой лагерь. Старый маг и раненый рыцарь рассказали путнику о нарушенном порядке и предложили пройти испытание."
];
export default function InventoryItems(){
  const navigate=useNavigate();
  const pending=useGameStore(s=>s.pendingPackPurchases);
  const settings=useGameStore(s=>s.settings);
  const setSettings=useGameStore(s=>s.setSettings);
  const musicTrack=useIdentity(s=>s.musicTrack);
  const selectMusic=useIdentity(s=>s.setMusicTrack);
  const [tab,setTab]=useState<ItemTab>("all"),[openBook,setOpenBook]=useState(false);
  const packs=useMemo(()=>Object.entries(pending).sort((a,b)=>b[1].createdAt-a[1].createdAt),[pending]);
  const show=(id:ItemTab)=>tab==="all"||tab===id;
  function chooseTrack(id:MusicTrack){selectMusic(id);setSettings({music:true});}
  return <section className="frItemsPage">
    <header className="frItemsHeading"><div><span>ХРАНИЛИЩЕ FRAKTUM</span><h2>МОИ ПРЕДМЕТЫ</h2>
      <p>Паки, книги истории, коллекционные предметы и музыка — отдельно от игровых карт.</p></div>
      <div className="frItemsCount">{packs.length} <small>НЕОТКРЫТЫХ ПАКОВ</small></div>
    </header>
    <nav className="frItemsTabs" role="tablist" aria-label="Предметы">
      {CATEGORY.map(([id,label])=><button type="button" role="tab" aria-selected={tab===id}
        className={id===tab?"is-active":""} key={id} onClick={()=>setTab(id)}>{label}</button>)}
    </nav>
    {show("packs")&&<section className="frItemsSection"><h3>НЕОТКРЫТЫЕ ПАКИ</h3>
      {packs.length?<div className="frItemGrid">{packs.map(([session,purchase])=>{
        const meta=getPackById(purchase.packId);
        return <article key={session} className="frItemTile"><Art index={6}/><h4>{meta.title}</h4>
          <p>Куплен и сохранён в инвентаре.</p>
          <button type="button" onClick={()=>navigate("/pack?packId="+encodeURIComponent(purchase.packId),{
            state:{packId:purchase.packId,packTitle:meta.title,openSessionId:session}
          })}>ОТКРЫТЬ ПАК</button></article>;
      })}</div>:<div className="frItemEmpty"><Art index={9}/><div><strong>ПОКА НЕТ ПАКОВ</strong>
        <p>В магазине нажми «Сохранить в инвентарь», и пак появится здесь.</p>
        <button type="button" onClick={()=>navigate("/shop")}>В МАГАЗИН</button></div></div>}
    </section>}
    {show("chests")&&<section className="frItemsSection"><h3>СУНДУКИ</h3>
      <div className="frItemGrid frPreviewTiles">
        {[["Обычный сундук",5],["Ледяной сундук",6],["Огненный сундук",7],["Легендарный сундук",8]].map(([label,index])=>
          <div key={String(label)} className="frItemTile is-locked"><Art index={Number(index)}/><h4>{label}</h4><p>Система выпадения появится позже.</p><span>ЕЩЁ НЕ ДОСТУПНО</span></div>)}
      </div>
    </section>}
    {show("books")&&<section className="frItemsSection"><h3>БИБЛИОТЕКА ИСТОРИИ</h3>
      <div className="frItemGrid">
        <article className="frItemTile"><Art index={1}/><h4>Летопись карт</h4>
          <p>Вводная история мира FRAKTUM.</p><button type="button" onClick={()=>setOpenBook(true)}>ЧИТАТЬ</button></article>
        <article className="frItemTile is-locked"><Art index={0}/><h4>Запретные знания</h4>
          <p>Будущая сюжетная книга.</p><span>ПОКА ЗАКРЫТО</span></article>
        <article className="frItemTile is-locked"><Art index={2}/><h4>Хроники льда</h4>
          <p>Будущий том стихии.</p><span>ПОКА ЗАКРЫТО</span></article>
      </div>
    </section>}
    {show("relics")&&<section className="frItemsSection"><h3>АРТЕФАКТЫ И МАТЕРИАЛЫ</h3>
      <div className="frItemEmpty"><Art index={11}/><div><strong>ХРАНИЛИЩЕ АРТЕФАКТОВ</strong>
        <p>В будущих обновлениях здесь будут кристаллы, материалы и реликвии для крафта. Сейчас таких выпадений в игре нет.</p></div></div>
    </section>}
    {show("music")&&<section className="frItemsSection"><h3>МУЗЫКАЛЬНАЯ КОЛЛЕКЦИЯ</h3>
      <p className="frSectionSubtitle">Две композиции уже включены в игру. Выбери, какая должна звучать на фоне.</p>
      <div className="frItemGrid">
        {[["Обе по очереди","cycle",11],["Главная тема FRAKTUM","main",4],["Fracture Crown","crown",10]].map(([label,id,index])=>
          <article key={String(id)} className={"frItemTile"+(musicTrack===id?" is-selected":"")}>
            <Art index={Number(index)}/><h4>{label}</h4>
            <p>{musicTrack===id?"ВЫБРАНО":"Доступно"}</p>
            <button type="button" onClick={()=>chooseTrack(id as MusicTrack)}>{musicTrack===id?"ИГРАЕТ В ФОНЕ":"ВЫБРАТЬ"}</button>
          </article>)}
      </div>
      {!settings.music&&<p className="frHint">Музыка выключена в настройках. Выбор композиции включит её.</p>}
    </section>}
    {openBook&&<div className="frBookScrim" role="presentation" onClick={()=>setOpenBook(false)}>
      <section className="frBookDialog" role="dialog" aria-modal="true" aria-label="Летопись карт"
        onClick={event=>event.stopPropagation()}>
        <header><span>ХРОНИКА FRAKTUM · ТОМ I</span><button type="button" onClick={()=>setOpenBook(false)}>×</button></header>
        <Art index={1}/><h2>ЛЕТОПИСЬ КАРТ</h2>{CHRONICLE.map((text,i)=><p key={i}>{text}</p>)}
        <button type="button" onClick={()=>setOpenBook(false)}>ЗАКРЫТЬ КНИГУ</button>
      </section>
    </div>}
  </section>;
}

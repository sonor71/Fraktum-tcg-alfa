import { useState } from "react";
export const CLUB_EMOTE_COLUMNS=12;
export const CLUB_EMOTE_COUNT=104;
export const emoteToken=(index:number)=>`[emote:${index}]`;
export function ClubEmote({index}:{index:number}){
if(index<0||index>=CLUB_EMOTE_COUNT)return null;
const col=index%12,row=Math.floor(index/12);
return <span className="frClubEmote" role="img" aria-label={`Эмоция ${index+1}`} style={{backgroundPosition:`-${col*32}px -${row*32}px`}}/>;
}
export function ClubEmoteText({text}:{text:string}){
return <>{text.split(/(\[emote:\d+\])/g).map((part,i)=>{const match=/^\[emote:(\d+)\]$/.exec(part);return match?<ClubEmote key={i} index={Number(match[1])}/>:<span key={i}>{part}</span>;})}</>;
}
export function ClubEmotePicker({onPick}:{onPick:(token:string)=>void}){
const [open,setOpen]=useState(false);
return <div className="frEmoteWrap"><button type="button" aria-label="Добавить эмоцию" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>☺</button>{open&&<div className="frEmotePicker" role="group" aria-label="Эмоции клуба">{Array.from({length:CLUB_EMOTE_COUNT},(_,i)=><button type="button" key={i} title={`Эмоция ${i+1}`} onClick={()=>{onPick(emoteToken(i));setOpen(false);}}><ClubEmote index={i}/></button>)}</div>}</div>;
}
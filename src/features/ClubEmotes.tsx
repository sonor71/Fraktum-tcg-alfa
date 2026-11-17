import { useEffect, useRef, useState } from "react";
export const CLUB_EMOTE_COLUMNS=12;
export const CLUB_EMOTE_COUNT=104;
export const emoteToken=(index:number)=>`[emote:${index}]`;
const SPRITE="/custom/ranks/Smile%20pack.png";
let spriteImage:HTMLImageElement|null=null;
let spritePromise:Promise<HTMLImageElement>|null=null;
function loadSprite(){
 if(!spritePromise) spritePromise=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{spriteImage=image;resolve(image);};
  image.onerror=()=>{spritePromise=null;reject(new Error("Cannot load club emoji sprite"));};
  image.src=SPRITE;
 });
 return spritePromise;
}
export function ClubEmote({index}:{index:number}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  let active=true;
  if(index<0||index>=CLUB_EMOTE_COUNT)return;
  loadSprite().then(image=>{
   if(!active||!ref.current)return;
   const context=ref.current.getContext("2d");
   if(!context)return;
   const sourceW=image.naturalWidth/CLUB_EMOTE_COLUMNS;
   const sourceH=image.naturalHeight/9;
   context.clearRect(0,0,32,32);
   context.imageSmoothingEnabled=false;
   context.drawImage(image,(index%12)*sourceW,Math.floor(index/12)*sourceH,sourceW,sourceH,0,0,32,32);
  }).catch(()=>{});
  return ()=>{active=false;};
 },[index]);
 return <canvas ref={ref} width={32} height={32} className="frClubEmote" role="img" aria-label={`Эмоция ${index+1}`}/>;
}
export function ClubEmoteText({text}:{text:string}){
return <>{text.split(/(\[emote:\d+\])/g).map((part,i)=>{const match=/^\[emote:(\d+)\]$/.exec(part);return match?<ClubEmote key={i} index={Number(match[1])}/>:<span key={i}>{part}</span>;})}</>;
}
export function ClubEmotePicker({onPick}:{onPick:(token:string)=>void}){
const [open,setOpen]=useState(false);
return <div className="frEmoteWrap"><button type="button" aria-label="Добавить эмоцию" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>☺</button>{open&&<div className="frEmotePicker" role="group" aria-label="Эмоции клуба">{Array.from({length:CLUB_EMOTE_COUNT},(_,i)=><button type="button" key={i} title={`Эмоция ${i+1}`} onClick={()=>{onPick(emoteToken(i));setOpen(false);}}><ClubEmote index={i}/></button>)}</div>}</div>;
}
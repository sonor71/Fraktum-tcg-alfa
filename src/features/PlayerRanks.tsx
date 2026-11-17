import { create } from "zustand";
import { persist } from "zustand/middleware";
export const RANKS = [
{id:"player",label:"Игрок",asset:"player.png"},
{id:"pro",label:"Про",asset:"pro.png"},
{id:"platinum",label:"Платина",asset:"platinum.png"},
{id:"ruby",label:"Рубин",asset:"ruby.png"},
{id:"elite",label:"Элита",asset:"elite.png"},
{id:"ultimate",label:"Ультимейт",asset:"ultimate.png"},
{id:"helper",label:"Хелпер",asset:"helper.png"},
{id:"trial",label:"Пробный модератор",asset:"trial.png"},
{id:"mod",label:"Модератор",asset:"mod.png"},
{id:"admin",label:"Администратор",asset:"admin.png"},
{id:"owner",label:"Основатель",asset:"owner.png"},
] as const;
export type RankId = typeof RANKS[number]["id"];
export const useRankPreview=create<{rank:RankId;setRank:(rank:RankId)=>void}>()(persist(set=>({rank:"player",setRank:rank=>set({rank})}),{name:"fraktum-rank-preview-v1"}));
export function RankBadge({rank="player"}:{rank?:RankId}){
const item=RANKS.find(r=>r.id===rank)??RANKS[0];
return <img className="frRankBadge" src={"/ui/fraktum/custom/ranks/"+item.asset} alt={item.label} title={item.label}/>;
}
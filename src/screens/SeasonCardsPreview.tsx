import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  SEASON_CARD_ARTWORK, SEASON_CANDIDATE_POOLS,
  type SeasonCardArtwork, type SeasonPackCandidate,
} from "../data/seasonCardArtwork";
import "./season-cards.css";

const CANDIDATE_PACK_LABELS: Record<SeasonPackCandidate, string> = {
  flame: "Огонь",
  ice: "Лёд",
  electric: "Молния",
  desert: "Пустыня",
  void: "Бездна",
  normal: "Общий",
};
const RARITY_LABELS: Record<string, string> = {
  common: "Обычная", rare: "Редкая", epic: "Эпическая", mythic: "Мифическая",
  legendary: "Легендарная", chromatic: "Хроматическая",
  exotic: "Экзотическая", divine: "Божественная",
  forgotten: "Забытая", archaic: "Архаичная",
};
const PACK_ORDER: readonly SeasonPackCandidate[] = ["flame", "ice", "electric", "desert", "void", "normal"];

export default function SeasonCardsPreview() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<SeasonPackCandidate | "all">("all");
  const [selected, setSelected] = useState<SeasonCardArtwork | null>(null);
  const cards = SEASON_CARD_ARTWORK.filter((card) => filter === "all" || card.proposedPack === filter);

  return (
    <main className="seasonPreview">
      <header className="seasonPreviewHeader">
        <button type="button" onClick={() => navigate("/inventory")}>← ИНВЕНТАРЬ</button>
        <div>
          <span>FRAKTUM TCG • ГАЛЕРЕЯ НОВОГО СЕЗОНА</span>
          <h1>38 новых карт</h1>
          <p>Все карты доступны в маркете и выпадают из паков.
            Сейчас используются временные базовые характеристики без уникальных способностей — окончательный баланс ещё не утверждён.</p>
        </div>
      </header>
      <nav className="seasonPreviewFilters" aria-label="Предлагаемый пак">
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
          ВСЕ <b>{SEASON_CARD_ARTWORK.length}</b>
        </button>
        {PACK_ORDER.map((pack) =>
          <button key={pack} type="button" aria-pressed={filter === pack} onClick={() => setFilter(pack)}>
            {CANDIDATE_PACK_LABELS[pack]} <b>{SEASON_CANDIDATE_POOLS[pack].length}</b>
          </button>,
        )}
      </nav>
      <section className="seasonPreviewGrid" aria-label="Новые изображения карт">
        {cards.map((card) =>
          <button key={card.id} type="button" className="seasonPreviewItem" onClick={() => setSelected(card)}>
            <div className="seasonPreviewArt"><img src={card.image} alt={card.title} loading="lazy" draggable={false}/></div>
            <strong>{card.title}</strong>
            <span>{CANDIDATE_PACK_LABELS[card.proposedPack]} · {card.sourceRarity
              ? RARITY_LABELS[card.sourceRarity]
              : "Временная редкость: обычная"}</span>
          </button>,
        )}
      </section>
      {selected && <div className="seasonPreviewModal" onClick={() => setSelected(null)} role="presentation">
        <section role="dialog" aria-modal="true" aria-label={selected.title}
          onClick={(event) => event.stopPropagation()}>
          <button className="seasonPreviewClose" type="button" onClick={() => setSelected(null)}
            aria-label="Закрыть">×</button>
          <img src={selected.image} alt={selected.title} draggable={false} />
          <div><h2>{selected.title}</h2>
            <p>Пак: {CANDIDATE_PACK_LABELS[selected.proposedPack]}</p>
            <p>Редкость по первичной таблице: {selected.sourceRarity
              ? RARITY_LABELS[selected.sourceRarity]
              : "не подтверждена"}</p>
            <p>Игровые характеристики: временные. В матчах используется базовая атака 1 и 3 HP; Феликс Призма — персонаж с временными 20 HP. Уникальные способности пока не реализованы.</p>
          </div>
        </section>
      </div>}
    </main>
  );
}

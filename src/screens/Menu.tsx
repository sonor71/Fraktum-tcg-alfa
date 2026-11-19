import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlayerIdentityChip } from "../features/PlayerIdentity";
import "./core-menu.css";

const MAIN_ACTIONS = [
  { title: "АРЕНА", subtitle: "Матчи и рейтинговая игра", path: "/play", icon: "play", primary: true },
  { title: "ИНВЕНТАРЬ", subtitle: "Карты, коллекция и колоды", path: "/inventory", icon: "inventory" },
  { title: "МАРКЕТ", subtitle: "Торговля между игроками", path: "/market", icon: "market" },
  { title: "МАГАЗИН", subtitle: "Наборы и игровые товары", path: "/shop", icon: "shop" },
  { title: "КЛУБЫ", subtitle: "Чат, войны и клубные карты", path: "/clubs", icon: "clubs" },
  { title: "ПРОФИЛЬ", subtitle: "Статистика и прогресс", path: "/profile", icon: "profile" },
];

const NEWS = [
  { src: "/ui/fraktum/menu/news/info1.png", alt: "Новость FRAKTUM TCG 1" },
  { src: "/ui/fraktum/menu/news/info2.png", alt: "Новость FRAKTUM TCG 2" },
  { src: "/ui/fraktum/menu/news/info3.png", alt: "Новость FRAKTUM TCG 3" },
];

const BACKGROUNDS = [
  "/ui/fraktum/menu/backgrounds/phon1.png",
  "/ui/fraktum/menu/backgrounds/phon2.png",
  "/ui/fraktum/menu/backgrounds/phon3.png",
];

const NEWS_INTERVAL_MS = 7000;
const BACKGROUND_INTERVAL_MS = 60000;
const NEWS_SLIDE_TRANSITION_MS = 720;

export default function Menu() {
  const navigate = useNavigate();
  const [newsIndex, setNewsIndex] = useState(0);
  const [newsPaused, setNewsPaused] = useState(false);
  const [withoutTransition, setWithoutTransition] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBackgroundIndex((current) => (current + 1) % BACKGROUNDS.length);
    }, BACKGROUND_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (newsPaused) return;
    const timer = window.setInterval(() => {
      setNewsIndex((current) => Math.min(current + 1, NEWS.length));
    }, NEWS_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [newsPaused]);

  // The fourth slide repeats the first. Once it has slid fully left,
  // jump invisibly to the real first slide so every automatic move goes right-to-left.
  useEffect(() => {
    if (newsIndex !== NEWS.length) return;
    const timer = window.setTimeout(() => {
      setWithoutTransition(true);
      setNewsIndex(0);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setWithoutTransition(false));
      });
    }, NEWS_SLIDE_TRANSITION_MS + 20);
    return () => window.clearTimeout(timer);
  }, [newsIndex]);

  const goToNews = (index: number) => {
    setWithoutTransition(false);
    setNewsIndex(index);
  };

  const nextNews = () => setNewsIndex((current) => Math.min(current + 1, NEWS.length));
  const previousNews = () => setNewsIndex((current) => (current === 0 ? NEWS.length - 1 : Math.min(current - 1, NEWS.length - 1)));
  const visibleNewsIndex = newsIndex % NEWS.length;

  return (
    <section className="coreMenuRoot coreMenuRoot--homeV2">
      <div className="coreMenuBackdrop coreMenuBackdrop--slideshow" aria-hidden="true">
        {BACKGROUNDS.map((src, index) => (
          <img
            className={index === backgroundIndex ? "coreMenuBgImage is-visible" : "coreMenuBgImage"}
            src={src}
            key={src}
            alt=""
            draggable={false}
          />
        ))}
      </div>

      <div className="coreMenuLayout">
        <div className="coreMenuPanel">
          <div className="coreMenuHeading">
            <div className="frMenuIdentity"><PlayerIdentityChip /></div>
            <p>FRAKTUM TCG</p>
            <h1>Собери колоду. Выйди на арену.</h1>
            <span>Основная версия сфокусирована на карточных матчах и соревновательной игре.</span>
          </div>

          <div className="coreMenuGrid">
            {MAIN_ACTIONS.map((action) => (
              <button
                key={action.path}
                type="button"
                className={action.primary ? "coreMenuAction is-primary" : "coreMenuAction"}
                data-icon={action.icon}
                onClick={() => navigate(action.path)}
              >
                <strong>{action.title}</strong>
                <span>{action.subtitle}</span>
              </button>
            ))}
          </div>

          <button className="coreMenuSettings" type="button" onClick={() => navigate("/settings")}>
            НАСТРОЙКИ
          </button>
        </div>

        <div className="coreMenuRightColumn">
          <section className="coreMenuPassPreview" aria-label="Предпросмотр FRAKTUM PASS">
            <div className="coreMenuPassCopy">
              <span className="coreMenuPassEyebrow">СЕЗОННЫЙ ПРОПУСК</span>
              <h2>FRAKTUM PASS</h2>
              <p>Награды за завершённые матчи</p>
              <span className="coreMenuPassRewards">Монеты · паки · сундуки</span>
              <span className="coreMenuPassSoon">ПРЕВЬЮ</span>
            </div>

          </section>

          <aside
          className="coreMenuNews"
          aria-label="Новости FRAKTUM TCG"
          onMouseEnter={() => setNewsPaused(true)}
          onMouseLeave={() => setNewsPaused(false)}
          onFocusCapture={() => setNewsPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setNewsPaused(false);
          }}
        >
          <div className="coreMenuNewsHeader">
            <h2>НОВОСТИ</h2>
            <span>FRAKTUM TCG / {visibleNewsIndex + 1}—{NEWS.length}</span>
          </div>
          <div className="coreMenuNewsViewport" aria-roledescription="карусель">
            <div
              className="coreMenuNewsTrack"
              style={{
                transform: `translate3d(-${newsIndex * 100}%, 0, 0)`,
                transition: withoutTransition ? "none" : undefined,
              }}
            >
              {[...NEWS, NEWS[0]].map((news, index) => (
                <div className="coreMenuNewsSlide" key={`${news.src}-${index}`} aria-hidden={index !== newsIndex}>
                  <img src={news.src} alt={index === NEWS.length ? "" : news.alt} draggable={false} />
                </div>
              ))}
            </div>
          </div>
          <div className="coreMenuNewsControls">
            <button type="button" className="coreMenuNewsArrow" onClick={previousNews} aria-label="Предыдущая новость">‹</button>
            <div className="coreMenuNewsDots" aria-label="Выбор новости">
              {NEWS.map((news, index) => (
                <button
                  type="button"
                  key={news.src}
                  className={visibleNewsIndex === index ? "coreMenuNewsDot is-active" : "coreMenuNewsDot"}
                  onClick={() => goToNews(index)}
                  aria-current={visibleNewsIndex === index ? "true" : undefined}
                  aria-label={`Новость ${index + 1}`}
                />
              ))}
            </div>
            <button type="button" className="coreMenuNewsArrow" onClick={nextNews} aria-label="Следующая новость">›</button>
          </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

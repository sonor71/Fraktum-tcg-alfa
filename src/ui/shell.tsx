import type { PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CloudAutoSync } from "../cloud/CloudAutoSync";
import { PlayerIdentityChip } from "../features/PlayerIdentity";
import "./core-shell.css";

const NAV_ITEMS = [
  { label: "Главная", path: "/", icon: "home" },
  { label: "Арена", path: "/play", icon: "play" },
  { label: "Инвентарь", path: "/inventory", icon: "inventory" },
  { label: "Пасс", path: "/pass", icon: "pass" },
  { label: "Маркет", path: "/market", icon: "market" },
  { label: "Магазин", path: "/shop", icon: "shop" },
  { label: "Клубы", path: "/clubs", icon: "clubs" },
  { label: "Профиль", path: "/profile", icon: "profile" },
];

export default function Shell({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMatch = location.pathname.startsWith("/match/");

  return (
    <div className={isMatch ? "coreShell coreShell--match" : "coreShell"}>
      <CloudAutoSync />

      {!isMatch ? (
        <header className="coreShellHeader">
          <button className="coreBrand" type="button" onClick={() => navigate("/")}>
            FRAKTUM
            <span>TRADING CARD GAME</span>
          </button>

          <nav className="coreNav" aria-label="Основная навигация">
            {NAV_ITEMS.map((item) => {
              const active = item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  type="button"
                  className={active ? "coreNavButton is-active" : "coreNavButton"}
                  data-icon={item.icon}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button type="button" className="frShellIdentityButton" onClick={() => navigate("/profile")}
            aria-label="Открыть профиль"><PlayerIdentityChip compact /></button>

          <button
            className={location.pathname === "/settings" ? "coreSettings is-active" : "coreSettings"}
            type="button"
            onClick={() => navigate("/settings")}
            aria-label="Настройки"
          >
            ⚙
          </button>
        </header>
      ) : null}

      <main className={isMatch ? "coreShellContent coreShellContent--match" : "coreShellContent"}>
        {children}
      </main>
    </div>
  );
}

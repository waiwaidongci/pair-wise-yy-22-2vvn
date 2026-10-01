import { useState } from "react";
import { createRoot } from "react-dom/client";
import { routes } from "./router/routes";
import { DashboardPage } from "./pages/DashboardPage";
import { RelicsPage } from "./pages/RelicsPage";
import { DamagesPage } from "./pages/DamagesPage";
import { PlansPage } from "./pages/PlansPage";
import { ImagesPage } from "./pages/ImagesPage";
import "./styles.css";

function renderPage(route: string) {
  switch (route) {
    case "/dashboard":
      return <DashboardPage />;
    case "/relics":
      return <RelicsPage />;
    case "/damages":
      return <DamagesPage />;
    case "/plans":
      return <PlansPage />;
    case "/images":
      return <ImagesPage />;
    default:
      return <DashboardPage />;
  }
}

function App() {
  const [active, setActive] = useState<string>(routes[0]?.route ?? "/dashboard");
  const current = routes.find((route) => route.route === active) ?? routes[0];
  return (
    <div className="shell">
      <aside>
        <div className="brand">文物修复档案协作平台</div>
        <nav>
          {routes.map((route) => (
            <button
              key={route.route}
              className={active === route.route ? "active" : ""}
              onClick={() => setActive(route.route)}
            >
              {route.name}
            </button>
          ))}
        </nav>
      </aside>
      {renderPage(current?.route ?? "/dashboard")}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

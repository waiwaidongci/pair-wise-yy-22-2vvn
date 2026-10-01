import { useState } from "react";
import { createRoot } from "react-dom/client";
import { routes } from "./router/routes";
import { PlansPage } from "./pages/PlansPage";
import "./styles.css";

/**
 * 应用外壳：左侧导航按 routes 切换。
 * 「修复方案」承载可恢复材料领用链工作台；其余页面保留评审占位。
 */
function Placeholder({ name }: { name: string }) {
  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">relic-restore</p>
          <h1>{name}</h1>
        </div>
      </section>
      <div className="panel">
        <p>该模块为评审占位；材料领用链能力集中在「修复方案」工作台。</p>
      </div>
    </main>
  );
}

function App() {
  const [active, setActive] = useState<string>("/plans");
  const current = routes.find((route) => route.route === active) ?? routes[0];

  return (
    <div className="shell">
      <aside>
        <div className="brand">文物修复档案协作平台</div>
        <nav>
          {routes.map((route) => (
            <button key={route.route} className={active === route.route ? "active" : ""} onClick={() => setActive(route.route)}>
              {route.name}
            </button>
          ))}
        </nav>
      </aside>
      <main className="page">
        {active === "/plans" ? <PlansPage /> : <Placeholder name={current?.name ?? "工作台"} />}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

import type { AppView } from "../app-types";

const OPTIONS_FOLDER = "Options";

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: "session", label: "Sesión" },
  { id: "projects", label: "Proyectos" },
  { id: "settings", label: "Ajustes" },
  { id: "history", label: "Historial" },
  { id: "bugs", label: "Bugs" },
];

interface Win311NavProps {
  view: AppView;
  onSelect: (view: AppView) => void;
}

export function Win311Nav({ view, onSelect }: Win311NavProps) {
  return (
    <div className="retro-nav">
      <nav className="main-nav tree-nav" aria-label="Navegación">
        <div className="tree-panel">
          <div className="tree-group">
            <div className="tree-folder is-open" aria-hidden="true">
              <span className="tree-folder-icon" />
              <span className="tree-folder-name">{OPTIONS_FOLDER}</span>
            </div>
            <ul className="tree-children">
              {NAV_ITEMS.map((item, index) => {
                const isLast = index === NAV_ITEMS.length - 1;
                return (
                  <li key={item.id} className={`tree-branch ${isLast ? "is-last" : ""}`}>
                    <button
                      type="button"
                      className={`nav-btn tree-leaf ${view === item.id ? "active" : ""}`}
                      onClick={() => onSelect(item.id)}
                    >
                      <span className="tree-leaf-icon" />
                      <span className="tree-leaf-label">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

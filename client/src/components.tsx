import { Link, NavLink } from "react-router-dom";
import { priorityLabels, statusLabels, t } from "./i18n";
import { useAuth } from "./auth";

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge status-${status}`}>{statusLabels[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`badge prio-${priority}`}>{priorityLabels[priority]}</span>
  );
}

export function BottomNav() {
  const { user } = useAuth();
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end>
        <span className="icon">📋</span>
        {t.navIssues}
      </NavLink>
      <NavLink to="/new">
        <span className="icon">➕</span>
        {t.navNew}
      </NavLink>
      {user?.role === "admin" && (
        <NavLink to="/admin">
          <span className="icon">⚙️</span>
          {t.navAdmin}
        </NavLink>
      )}
    </nav>
  );
}

export function TopBar() {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <div>
        <h1>{t.appName}</h1>
        <div className="who">
          {user?.name} · {user && roleName(user.role)}
        </div>
      </div>
      <div className="topbar-actions">
        {user?.role === "admin" && (
          <Link to="/admin" className="topbar-link">
            ⚙️ {t.manageUsers}
          </Link>
        )}
        <button onClick={logout}>{t.logout}</button>
      </div>
    </header>
  );
}

function roleName(role: string) {
  return { staff: "עובד/ת", maintenance: "תחזוקה", admin: "מנהל/ת" }[role] ?? role;
}

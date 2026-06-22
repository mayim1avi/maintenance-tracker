import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  api,
  type Category,
  type Issue,
  type Location,
} from "../api";
import { PriorityBadge, StatusBadge } from "../components";
import { statusLabels, t } from "../i18n";
import { useAuth } from "../auth";

type Tab = "all" | "assigned" | "reported";

export default function IssueList() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>(
    user?.role === "maintenance" ? "assigned" : "all"
  );
  const [status, setStatus] = useState("");
  const [locationId, setLocationId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Location[]>("/api/locations").then(setLocations).catch(() => {});
    api.get<Category[]>("/api/categories").then(setCategories).catch(() => {});
  }, []);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (tab === "assigned") p.set("mine", "assigned");
    if (tab === "reported") p.set("mine", "reported");
    if (status) p.set("status", status);
    if (locationId) p.set("location_id", locationId);
    if (categoryId) p.set("category_id", categoryId);
    if (priority) p.set("priority", priority);
    return p.toString();
  }, [tab, status, locationId, categoryId, priority]);

  useEffect(() => {
    setLoading(true);
    api
      .get<Issue[]>("/api/issues?" + query)
      .then(setIssues)
      .finally(() => setLoading(false));
  }, [query]);

  function clearFilters() {
    setStatus("");
    setLocationId("");
    setCategoryId("");
    setPriority("");
  }

  const hasFilters = status || locationId || categoryId || priority;

  return (
    <div>
      <div className="segmented">
        <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
          {t.allIssues}
        </button>
        <button
          className={tab === "assigned" ? "active" : ""}
          onClick={() => setTab("assigned")}
        >
          {t.myAssigned}
        </button>
        <button
          className={tab === "reported" ? "active" : ""}
          onClick={() => setTab("reported")}
        >
          {t.myReported}
        </button>
      </div>

      <div className="filter-row">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t.status}: הכל</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">{t.priority}: הכל</option>
          <option value="urgent">דחופה</option>
          <option value="medium">בינונית</option>
          <option value="low">נמוכה</option>
        </select>
      </div>
      <div className="filter-row">
        <select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
          <option value="">{t.location}: הכל</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">{t.category}: הכל</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {hasFilters && (
        <button className="btn secondary small" onClick={clearFilters}>
          {t.clearFilters}
        </button>
      )}

      <div style={{ marginTop: 12 }}>
        {loading ? (
          <div className="empty">{t.loading}</div>
        ) : issues.length === 0 ? (
          <div className="empty">{t.noIssues}</div>
        ) : (
          issues.map((i) => <IssueCard key={i.id} issue={i} />)
        )}
      </div>
    </div>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Link to={`/issues/${issue.id}`} className="card issue-card">
      <div className="row">
        <h3>{issue.title}</h3>
        <div className="badges">
          <PriorityBadge priority={issue.priority} />
          <StatusBadge status={issue.status} />
        </div>
      </div>
      <div className="issue-meta">
        {issue.location_name && <span>📍 {issue.location_name}</span>}
        {issue.category_name && <span>🔧 {issue.category_name}</span>}
        {issue.assignee_name && (
          <span>
            {t.assignedTo}: {issue.assignee_name}
          </span>
        )}
        {issue.photo_path && <span>📷</span>}
      </div>
    </Link>
  );
}

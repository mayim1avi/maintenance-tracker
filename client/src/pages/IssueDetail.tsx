import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  api,
  type Comment,
  type Employee,
  type Issue,
} from "../api";
import { PriorityBadge, StatusBadge } from "../components";
import { statusLabels, t } from "../i18n";
import { useAuth } from "../auth";

interface DetailIssue extends Issue {
  comments: Comment[];
}

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState<DetailIssue | null>(null);
  const [staff, setStaff] = useState<Employee[]>([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const canManage = user?.role === "maintenance" || user?.role === "admin";

  async function load() {
    const data = await api.get<DetailIssue>(`/api/issues/${id}`);
    setIssue(data);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
    if (canManage)
      api
        .get<Employee[]>("/api/employees")
        .then((e) => setStaff(e.filter((x) => x.active && x.role !== "staff")))
        .catch(() => {});
  }, [id]);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      await api.patch(`/api/issues/${id}`, body);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await api.post(`/api/issues/${id}/comments`, { body: comment.trim() });
      setComment("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!issue) return <div className="empty">{error || t.loading}</div>;

  return (
    <div>
      <button className="btn secondary small" onClick={() => navigate(-1)}>
        ← {t.back}
      </button>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="row" style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>{issue.title}</h2>
          <div className="badges">
            <PriorityBadge priority={issue.priority} />
            <StatusBadge status={issue.status} />
          </div>
        </div>

        {issue.description && <p style={{ marginTop: 10 }}>{issue.description}</p>}

        {issue.photo_path && (
          <img className="detail-photo" src={issue.photo_path} alt={t.photo} />
        )}

        <div style={{ marginTop: 10 }}>
          <div className="kv">
            <span className="k">{t.location}</span>
            <span>{issue.location_name || "—"}</span>
          </div>
          <div className="kv">
            <span className="k">{t.category}</span>
            <span>{issue.category_name || "—"}</span>
          </div>
          <div className="kv">
            <span className="k">{t.reportedBy}</span>
            <span>{issue.reporter_name}</span>
          </div>
          <div className="kv">
            <span className="k">{t.assignedTo}</span>
            <span>{issue.assignee_name || t.unassigned}</span>
          </div>
          <div className="kv">
            <span className="k">{t.createdAt}</span>
            <span>{fmt(issue.created_at)}</span>
          </div>
          {issue.resolved_at && (
            <div className="kv">
              <span className="k">{t.resolvedAt}</span>
              <span>{fmt(issue.resolved_at)}</span>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {canManage && (
        <div className="card">
          <label>{t.status}</label>
          <select
            value={issue.status}
            disabled={busy}
            onChange={(e) => patch({ status: e.target.value })}
          >
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          <label>{t.assignedTo}</label>
          <select
            value={issue.assigned_to ?? ""}
            disabled={busy}
            onChange={(e) =>
              patch({ assigned_to: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">{t.unassigned}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {issue.assigned_to !== user?.id && (
            <button
              className="btn secondary"
              disabled={busy}
              onClick={() => patch({ assigned_to: user?.id })}
            >
              {t.assignToMe}
            </button>
          )}
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>{t.comments}</h3>
        {issue.comments.length === 0 ? (
          <div className="muted">{t.noComments}</div>
        ) : (
          issue.comments.map((c) => (
            <div className="comment" key={c.id}>
              <div className="meta">
                {c.author_name} · {fmt(c.created_at)}
              </div>
              <div>{c.body}</div>
            </div>
          ))
        )}
        <form onSubmit={sendComment}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.addComment}
          />
          <button className="btn" disabled={busy || !comment.trim()}>
            {t.send}
          </button>
        </form>
      </div>
    </div>
  );
}

function fmt(s: string) {
  // SQLite returns UTC "YYYY-MM-DD HH:MM:SS"
  const d = new Date(s.replace(" ", "T") + "Z");
  return d.toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

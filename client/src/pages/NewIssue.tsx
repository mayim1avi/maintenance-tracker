import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Category, type Location } from "../api";
import { t } from "../i18n";

export default function NewIssue() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationId, setLocationId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get<Location[]>("/api/locations")
      .then((l) => setLocations(l.filter((x) => x.active)))
      .catch(() => {});
    api
      .get<Category[]>("/api/categories")
      .then((c) => setCategories(c.filter((x) => x.active)))
      .catch(() => {});
  }, []);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setPhoto(f);
    setPreview(f ? URL.createObjectURL(f) : "");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("נא להזין כותרת");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const form = new FormData();
      form.set("title", title.trim());
      form.set("description", description.trim());
      if (locationId) form.set("location_id", locationId);
      if (categoryId) form.set("category_id", categoryId);
      form.set("priority", priority);
      if (photo) form.set("photo", photo);
      const { id } = await api.postForm<{ id: number }>("/api/issues", form);
      navigate(`/issues/${id}`);
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2 style={{ marginTop: 0 }}>{t.navNew}</h2>
      {error && <div className="error-msg">{error}</div>}

      <label>
        {t.title} <span className="opt">({t.required})</span>
      </label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="לדוגמה: מזגן לא עובד בחדר 204"
      />

      <label>
        {t.description} <span className="opt">({t.optional})</span>
      </label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="פרטים נוספים על התקלה…"
      />

      <label>{t.location}</label>
      <select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
        <option value="">{t.choose}</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.zone ? `${l.zone} · ${l.name}` : l.name}
          </option>
        ))}
      </select>

      <label>{t.category}</label>
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">{t.choose}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <label>{t.priority}</label>
      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="low">נמוכה</option>
        <option value="medium">בינונית</option>
        <option value="urgent">דחופה</option>
      </select>

      <label>
        {t.photo} <span className="opt">({t.optional})</span>
      </label>
      <div className="photo-label" onClick={() => fileRef.current?.click()}>
        📷 {t.takePhoto}
      </div>
      <input
        ref={fileRef}
        className="photo-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPhoto}
      />
      {preview && <img className="photo-preview" src={preview} alt="" />}

      <button className="btn" disabled={busy}>
        {busy ? t.loading : t.create}
      </button>
    </form>
  );
}

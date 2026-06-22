import { useEffect, useState } from "react";
import {
  api,
  type Category,
  type Employee,
  type Location,
} from "../api";
import { roleLabels, t } from "../i18n";

type Tab = "employees" | "locations" | "categories";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("employees");
  return (
    <div>
      <div className="segmented">
        <button
          className={tab === "employees" ? "active" : ""}
          onClick={() => setTab("employees")}
        >
          {t.employees}
        </button>
        <button
          className={tab === "locations" ? "active" : ""}
          onClick={() => setTab("locations")}
        >
          {t.locations}
        </button>
        <button
          className={tab === "categories" ? "active" : ""}
          onClick={() => setTab("categories")}
        >
          {t.categories}
        </button>
      </div>
      {tab === "employees" && <Employees />}
      {tab === "locations" && <Locations />}
      {tab === "categories" && <Categories />}
    </div>
  );
}

function useError() {
  const [error, setError] = useState("");
  return { error, setError };
}

function Employees() {
  const [list, setList] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const { error, setError } = useError();

  const load = () => api.get<Employee[]>("/api/employees").then(setList);
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/employees", { name, username, password, role });
      setName("");
      setUsername("");
      setPassword("");
      setRole("staff");
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggle(emp: Employee) {
    await api.patch(`/api/employees/${emp.id}`, { active: !emp.active });
    load();
  }

  return (
    <div>
      <form className="card" onSubmit={add}>
        <h3 style={{ marginTop: 0 }}>{t.add}</h3>
        {error && <div className="error-msg">{error}</div>}
        <label>{t.name}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <label>{t.username}</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="none"
        />
        <label>{t.password}</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} />
        <label>{t.role}</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="staff">{roleLabels.staff}</option>
          <option value="maintenance">{roleLabels.maintenance}</option>
          <option value="admin">{roleLabels.admin}</option>
        </select>
        <button className="btn">{t.add}</button>
      </form>

      {list.map((emp) => (
        <div className={`card list-item ${emp.active ? "" : "inactive"}`} key={emp.id}>
          <div>
            <strong>{emp.name}</strong>
            <div className="muted">
              {emp.username} · {roleLabels[emp.role]}
            </div>
          </div>
          <button className="btn secondary small" onClick={() => toggle(emp)}>
            {emp.active ? t.inactive : t.active}
          </button>
        </div>
      ))}
    </div>
  );
}

function Locations() {
  const [list, setList] = useState<Location[]>([]);
  const [name, setName] = useState("");
  const [zone, setZone] = useState("");
  const { error, setError } = useError();

  const load = () => api.get<Location[]>("/api/locations").then(setList);
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/locations", { name, zone });
      setName("");
      setZone("");
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggle(loc: Location) {
    await api.patch(`/api/locations/${loc.id}`, { active: !loc.active });
    load();
  }

  return (
    <div>
      <form className="card" onSubmit={add}>
        <h3 style={{ marginTop: 0 }}>{t.add}</h3>
        {error && <div className="error-msg">{error}</div>}
        <label>{t.name}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <label>
          {t.zone} <span className="opt">({t.optional})</span>
        </label>
        <input value={zone} onChange={(e) => setZone(e.target.value)} />
        <button className="btn">{t.add}</button>
      </form>

      {list.map((loc) => (
        <div className={`card list-item ${loc.active ? "" : "inactive"}`} key={loc.id}>
          <div>
            <strong>{loc.name}</strong>
            {loc.zone && <div className="muted">{loc.zone}</div>}
          </div>
          <button className="btn secondary small" onClick={() => toggle(loc)}>
            {loc.active ? t.inactive : t.active}
          </button>
        </div>
      ))}
    </div>
  );
}

function Categories() {
  const [list, setList] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const { error, setError } = useError();

  const load = () => api.get<Category[]>("/api/categories").then(setList);
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/categories", { name });
      setName("");
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggle(cat: Category) {
    await api.patch(`/api/categories/${cat.id}`, { active: !cat.active });
    load();
  }

  return (
    <div>
      <form className="card" onSubmit={add}>
        <h3 style={{ marginTop: 0 }}>{t.add}</h3>
        {error && <div className="error-msg">{error}</div>}
        <label>{t.name}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn">{t.add}</button>
      </form>

      {list.map((cat) => (
        <div className={`card list-item ${cat.active ? "" : "inactive"}`} key={cat.id}>
          <strong>{cat.name}</strong>
          <button className="btn secondary small" onClick={() => toggle(cat)}>
            {cat.active ? t.inactive : t.active}
          </button>
        </div>
      ))}
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "../auth";
import { t } from "../i18n";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || t.loginError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <h1>{t.appName}</h1>
        <div className="sub">מערכת דיווח ומעקב תקלות</div>
        {error && <div className="error-msg">{error}</div>}
        <label>{t.username}</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
        />
        <label>{t.password}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button className="btn" disabled={busy}>
          {busy ? t.loading : t.login}
        </button>
      </form>
    </div>
  );
}

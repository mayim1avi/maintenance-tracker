import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { BottomNav, TopBar } from "./components";
import { t } from "./i18n";
import Login from "./pages/Login";
import IssueList from "./pages/IssueList";
import NewIssue from "./pages/NewIssue";
import IssueDetail from "./pages/IssueDetail";
import Admin from "./pages/Admin";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="empty">{t.loading}</div>;
  if (!user) return <Login />;

  return (
    <div className="app">
      <TopBar />
      <main className="content">
        <Routes>
          <Route path="/" element={<IssueList />} />
          <Route path="/new" element={<NewIssue />} />
          <Route path="/issues/:id" element={<IssueDetail />} />
          <Route
            path="/admin"
            element={user.role === "admin" ? <Admin /> : <Navigate to="/" />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Sidebar       from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login         from "./pages/Login";
import Dashboard     from "./pages/Dashboard";
import Places        from "./pages/Places";
import EntreeSortie  from "./pages/EntreeSortie";
import Paiements     from "./pages/Paiements";
import Reservations  from "./pages/Reservations";
import Historique    from "./pages/Historique";
import Utilisateurs  from "./pages/Utilisateurs";

function Layout() {
  const { logout, user } = useAuth();
  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
      <Sidebar onLogout={logout} user={user} />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/places"       element={<Places />} />
          <Route path="/entrees"      element={<EntreeSortie />} />
          <Route path="/paiements"    element={<Paiements />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/historique"   element={<Historique />} />
          <Route path="/utilisateurs" element={
            <ProtectedRoute adminOnly><Utilisateurs /></ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute><Layout /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
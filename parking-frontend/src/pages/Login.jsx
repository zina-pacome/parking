import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ParkingSquare, Mail, Lock, LogIn, AlertCircle } from "lucide-react";

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]       = useState({ email: "", mot_de_passe: "" });
  const [erreur, setErreur]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErreur("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.mot_de_passe);
      navigate("/");
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16
                          bg-blue-600 rounded-2xl mb-4">
            <ParkingSquare size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ParkManager</h1>
          <p className="text-slate-400 text-sm mt-1">Connectez-vous à votre espace</p>
        </div>

        {/* Carte */}
        <div className="bg-white rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Connexion</h2>

          {erreur && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg
                            text-sm text-red-700 flex items-center gap-2">
              <AlertCircle size={16} />
              {erreur}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Adresse email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2
                                           text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@parking.mg"
                  required
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg
                             text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2
                                           text-slate-400" />
                <input
                  type="password"
                  name="mot_de_passe"
                  value={form.mot_de_passe}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg
                             text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5
                         bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                         text-white font-medium rounded-lg text-sm transition-colors"
            >
              <LogIn size={16} />
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          {/* Comptes test */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-xs font-medium text-slate-500 mb-2">Comptes de test :</p>
            <div className="space-y-1 text-xs text-slate-600 font-mono">
              <p>admin@parking.mg</p>
              <p>agent@parking.mg</p>
              <p className="text-slate-400">mot de passe : password</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
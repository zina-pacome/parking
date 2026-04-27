import { useState, useEffect } from "react";
import { Users, Plus, X, CheckCircle, AlertTriangle, Crown, User, Shield } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const ROLE_CONFIG = {
  admin: { label: "Administrateur", icon: Crown, bg: "bg-violet-50", text: "text-violet-700" },
  agent: { label: "Agent",          icon: User,  bg: "bg-blue-50",   text: "text-blue-700"  },
};

const FORM_VIDE = { nom: "", email: "", mot_de_passe: "", role: "agent" };

export default function Utilisateurs() {
  const { user: moi } = useAuth();
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [message,   setMessage]   = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(FORM_VIDE);

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    setLoading(true);
    try {
      const res = await api.get('/utilisateurs');
      setUsers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const ouvrirCreation = () => {
    setEditing(null); setForm(FORM_VIDE); setShowModal(true);
  };

  const ouvrirEdition = (user) => {
    setEditing(user);
    setForm({ nom: user.nom, email: user.email, mot_de_passe: "", role: user.role });
    setShowModal(true);
  };

  const sauvegarder = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      if (editing) {
        await api.put(`/utilisateurs/${editing.id}`, form);
        setMessage({ type: 'success', texte: 'Utilisateur modifié' });
      } else {
        await api.post('/utilisateurs', form);
        setMessage({ type: 'success', texte: 'Utilisateur créé' });
      }
      setShowModal(false);
      charger();
    } catch (err) {
      setMessage({ type: 'error', texte: err.response?.data?.message || 'Erreur' });
    }
  };

  const toggleActif = async (id) => {
    try {
      await api.put(`/utilisateurs/${id}/toggle`);
      charger();
    } catch (err) {
      setMessage({ type: 'error', texte: err.response?.data?.message || 'Erreur' });
    }
  };

  const supprimer = async (id, nom) => {
    if (!window.confirm(`Supprimer "${nom}" ?`)) return;
    try {
      await api.delete(`/utilisateurs/${id}`);
      setMessage({ type: 'success', texte: 'Utilisateur supprimé' });
      charger();
    } catch (err) {
      setMessage({ type: 'error', texte: err.response?.data?.message || 'Erreur' });
    }
  };

  const stats = {
    total:    users.length,
    admins:   users.filter(u => u.role === 'admin').length,
    agents:   users.filter(u => u.role === 'agent').length,
    inactifs: users.filter(u => !u.actif).length,
  };

  const inputClass = `w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm
    bg-gray-50 focus:bg-white focus:outline-none focus:ring-2
    focus:ring-violet-300 transition-all`;

  return (
    <div className="p-6 space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Utilisateurs</h2>
          <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-1">
            <Shield size={11} /> Accès réservé aux administrateurs
          </p>
        </div>
        <button onClick={ouvrirCreation}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600
                     hover:bg-violet-700 text-white text-sm font-medium
                     rounded-xl transition-colors shadow-md shadow-violet-200">
          <Plus size={16} /> Nouvel utilisateur
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
            : 'bg-red-50 border border-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {message.texte}
          <button onClick={() => setMessage(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total",    value: stats.total,    color: "text-gray-700",   icon: Users  },
          { label: "Admins",   value: stats.admins,   color: "text-violet-600", icon: Crown  },
          { label: "Agents",   value: stats.agents,   color: "text-blue-600",   icon: User   },
          { label: "Inactifs", value: stats.inactifs, color: "text-red-500",    icon: Shield },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100"
               style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <Icon size={14} className={color} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
           style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent
                            rounded-full animate-spin"></div>
            <span className="text-sm">Chargement...</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Utilisateur", "Email", "Rôle", "Statut", "Créé le", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium
                                        text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => {
                const cfg    = ROLE_CONFIG[u.role] || ROLE_CONFIG.agent;
                const Icon   = cfg.icon;
                const estMoi = u.id === moi?.id;
                return (
                  <tr key={u.id} className={`hover:bg-gray-50 transition-colors
                    ${!u.actif ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center
                                        justify-center text-xs font-bold text-violet-600">
                          {u.nom.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {u.nom}
                            {estMoi && (
                              <span className="ml-1.5 text-xs text-violet-500 font-normal">
                                (vous)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1
                                       rounded-lg text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1
                                       rounded-lg text-xs font-medium ${
                        u.actif
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          u.actif ? 'bg-emerald-500' : 'bg-red-400'
                        }`}></span>
                        {u.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => ouvrirEdition(u)}
                          className="text-xs text-violet-600 hover:text-violet-800
                                     font-medium transition-colors">
                          Modifier
                        </button>
                        {!estMoi && (
                          <>
                            <span className="text-gray-200">|</span>
                            <button onClick={() => toggleActif(u.id)}
                              className={`text-xs font-medium transition-colors ${
                                u.actif
                                  ? 'text-amber-500 hover:text-amber-700'
                                  : 'text-emerald-500 hover:text-emerald-700'
                              }`}>
                              {u.actif ? 'Désactiver' : 'Activer'}
                            </button>
                            <span className="text-gray-200">|</span>
                            <button onClick={() => supprimer(u.id, u.nom)}
                              className="text-xs text-red-400 hover:text-red-600
                                         font-medium transition-colors">
                              Supprimer
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center
                        justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users size={16} className="text-violet-600" />
                {editing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
              </h3>
              <button onClick={() => setShowModal(false)}
                className="text-gray-300 hover:text-gray-500">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={sauvegarder} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Nom *</label>
                <input type="text" value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  placeholder="Jean Dupont" required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email *</label>
                <input type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="jean@parking.mg" required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Mot de passe {editing ? '(vide = inchangé)' : '*'}
                </label>
                <input type="password" value={form.mot_de_passe}
                  onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
                  placeholder={editing ? '••••••' : 'Minimum 6 caractères'}
                  required={!editing} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Rôle *</label>
                <select value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className={inputClass}>
                  <option value="agent">Agent de parking</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500
                             hover:bg-gray-50 rounded-xl text-sm transition-colors">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5
                             bg-violet-600 hover:bg-violet-700 text-white font-medium
                             rounded-xl text-sm transition-colors">
                  {editing ? 'Sauvegarder' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { CalendarClock, Plus, X, CheckCircle, Clock } from "lucide-react";
import api from "../api/axios";

const STATUT_CONFIG = {
  active:    { label: "Active",    bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500"  },
  confirmee: { label: "Confirmée", bg: "bg-emerald-50",text: "text-emerald-700",dot: "bg-emerald-500" },
  annulee:   { label: "Annulée",   bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-400"     },
  expiree:   { label: "Expirée",   bg: "bg-gray-100",  text: "text-gray-500",   dot: "bg-gray-400"    },
};

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [places,       setPlaces]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [message,      setMessage]      = useState(null);
  const maintenant = new Date().toISOString().slice(0, 16);
  const [form, setForm] = useState({
    plaque: "", type_vehicule: "voiture", nom_conducteur: "",
    telephone: "", place_id: "", debut: maintenant, fin: "",
  });

  useEffect(() => { charger(); chargerPlaces(); }, []);

  const charger = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reservations');
      setReservations(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const chargerPlaces = async () => {
    try {
      const res = await api.get('/places');
      setPlaces(res.data.filter(p => p.statut !== 'occupee' && p.statut !== 'hors_service'));
    } catch (err) { console.error(err); }
  };

  const creerReservation = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.post('/reservations', form);
      setMessage({ type: 'success', texte: `Place ${res.data.place} réservée !` });
      setShowModal(false);
      setForm({ plaque: "", type_vehicule: "voiture", nom_conducteur: "",
        telephone: "", place_id: "", debut: maintenant, fin: "" });
      charger(); chargerPlaces();
    } catch (err) {
      setMessage({ type: 'error', texte: err.response?.data?.message || 'Erreur' });
    }
  };

  const confirmer = async (id) => {
    try {
      await api.put(`/reservations/${id}/confirmer`);
      charger();
    } catch (err) {
      setMessage({ type: 'error', texte: err.response?.data?.message || 'Erreur' });
    }
  };

  const annuler = async (id) => {
    if (!window.confirm('Annuler cette réservation ?')) return;
    try {
      await api.put(`/reservations/${id}/annuler`);
      charger(); chargerPlaces();
    } catch (err) {
      setMessage({ type: 'error', texte: err.response?.data?.message || 'Erreur' });
    }
  };

  const formatDateTime = (d) => d ? new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  }) : '—';

  const stats = {
    actives:    reservations.filter(r => r.statut === 'active').length,
    confirmees: reservations.filter(r => r.statut === 'confirmee').length,
    annulees:   reservations.filter(r => r.statut === 'annulee').length,
    expirees:   reservations.filter(r => r.statut === 'expiree').length,
  };

  const inputClass = `w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm
    bg-gray-50 focus:bg-white focus:outline-none focus:ring-2
    focus:ring-violet-300 transition-all`;

  return (
    <div className="p-6 space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Réservations</h2>
          <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-1">
            <Clock size={11} /> Expiration automatique toutes les 5 minutes
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600
                     hover:bg-violet-700 text-white text-sm font-medium
                     rounded-xl transition-colors shadow-md shadow-violet-200">
          <Plus size={16} /> Nouvelle réservation
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
            : 'bg-red-50 border border-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <X size={16} />}
          {message.texte}
          <button onClick={() => setMessage(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Actives",    value: stats.actives,    color: "text-violet-600"  },
          { label: "Confirmées", value: stats.confirmees, color: "text-emerald-600" },
          { label: "Annulées",   value: stats.annulees,   color: "text-red-500"     },
          { label: "Expirées",   value: stats.expirees,   color: "text-gray-400"    },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100"
               style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12
                          flex items-center justify-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent
                            rounded-full animate-spin"></div>
            <span className="text-sm">Chargement...</span>
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center"
               style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center
                            justify-center mx-auto mb-4">
              <CalendarClock size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">Aucune réservation enregistrée</p>
          </div>
        ) : reservations.map(r => {
          const cfg  = STATUT_CONFIG[r.statut] || STATUT_CONFIG.active;
          const actif = ['active', 'confirmee'].includes(r.statut);
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5
                                       flex items-center justify-between gap-4"
                 style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center`}>
                  <CalendarClock size={18} className={cfg.text} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-mono font-bold text-gray-900">{r.plaque}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium
                                     ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Place {r.place_numero} · Zone {r.zone}
                    {r.nom_conducteur && ` · ${r.nom_conducteur}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock size={10} />
                    {formatDateTime(r.debut)} → {formatDateTime(r.fin)}
                  </p>
                </div>
              </div>
              {actif && (
                <div className="flex gap-2 flex-shrink-0">
                  {r.statut === 'active' && (
                    <button onClick={() => confirmer(r.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50
                                 hover:bg-emerald-100 text-emerald-700 text-xs font-medium
                                 rounded-xl border border-emerald-100 transition-colors">
                      <CheckCircle size={12} /> Confirmer
                    </button>
                  )}
                  <button onClick={() => annuler(r.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50
                               hover:bg-red-100 text-red-700 text-xs font-medium
                               rounded-xl border border-red-100 transition-colors">
                    <X size={12} /> Annuler
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center
                        justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl
                          max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CalendarClock size={16} className="text-violet-600" />
                Nouvelle réservation
              </h3>
              <button onClick={() => setShowModal(false)}
                className="text-gray-300 hover:text-gray-500">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={creerReservation} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Plaque *</label>
                  <input type="text" value={form.plaque}
                    onChange={e => setForm({ ...form, plaque: e.target.value.toUpperCase() })}
                    placeholder="MG-001-AB" required className={inputClass + " font-mono"} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                  <select value={form.type_vehicule}
                    onChange={e => setForm({ ...form, type_vehicule: e.target.value })}
                    className={inputClass}>
                    <option value="voiture">Voiture</option>
                    <option value="moto">Moto</option>
                    <option value="camion">Camion</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Conducteur</label>
                <input type="text" value={form.nom_conducteur}
                  onChange={e => setForm({ ...form, nom_conducteur: e.target.value })}
                  placeholder="Optionnel" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Téléphone</label>
                <input type="text" value={form.telephone}
                  onChange={e => setForm({ ...form, telephone: e.target.value })}
                  placeholder="Optionnel" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Place *</label>
                <select value={form.place_id}
                  onChange={e => setForm({ ...form, place_id: e.target.value })}
                  required className={inputClass}>
                  <option value="">-- Choisir une place --</option>
                  {places.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.numero} — Zone {p.zone} — {p.type} ({p.statut})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Début *</label>
                  <input type="datetime-local" value={form.debut} min={maintenant}
                    onChange={e => setForm({ ...form, debut: e.target.value })}
                    required className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Fin *</label>
                  <input type="datetime-local" value={form.fin}
                    min={form.debut || maintenant}
                    onChange={e => setForm({ ...form, fin: e.target.value })}
                    required className={inputClass} />
                </div>
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
                  <CalendarClock size={15} /> Réserver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
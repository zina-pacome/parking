import { useState, useEffect } from "react";
import {
  ParkingSquare, Bike, Accessibility, Star,
  Plus, X, CheckCircle, AlertTriangle,
  Wrench, Trash2, RefreshCw, MapPin
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const STATUT_CONFIG = {
  libre:        { label: "Libre",        bg: "bg-emerald-50",  border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500"  },
  occupee:      { label: "Occupée",      bg: "bg-amber-50",    border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500"    },
  reservee:     { label: "Réservée",     bg: "bg-violet-50",   border: "border-violet-200",  text: "text-violet-700",  dot: "bg-violet-500"   },
  hors_service: { label: "Hors service", bg: "bg-red-50",      border: "border-red-200",     text: "text-red-700",     dot: "bg-red-400"      },
};

const TYPE_ICON = {
  standard:  ParkingSquare,
  moto:      Bike,
  handicape: Accessibility,
  vip:       Star,
};

export default function Places() {
  const { user }  = useAuth();
  const isAdmin   = user?.role === 'admin';

  const [places,    setPlaces]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filtre,    setFiltre]    = useState("tous");
  const [zone,      setZone]      = useState("tous");
  const [message,   setMessage]   = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [form,      setForm]      = useState({
    numero: "", zone: "A", etage: 0, type: "standard"
  });

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  }, []);

  const charger = async () => {
    try {
      const res = await api.get('/places');
      setPlaces(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const ajouterPlace = async (e) => {
    e.preventDefault();
    try {
      await api.post('/places', form);
      setMessage({ type: 'success', texte: `Place ${form.numero} ajoutée` });
      setShowModal(false);
      setForm({ numero: "", zone: "A", etage: 0, type: "standard" });
      charger();
    } catch (err) {
      setMessage({ type: 'error', texte: err.response?.data?.message || 'Erreur' });
    }
  };

  const changerStatut = async (id, statut) => {
    try {
      await api.put(`/places/${id}`, { statut });
      setSelected(null);
      charger();
    } catch (err) {
      setMessage({ type: 'error', texte: err.response?.data?.message || 'Erreur' });
    }
  };

  const supprimerPlace = async (id) => {
    if (!window.confirm('Supprimer cette place ?')) return;
    try {
      await api.delete(`/places/${id}`);
      setMessage({ type: 'success', texte: 'Place supprimée' });
      setSelected(null);
      charger();
    } catch (err) {
      setMessage({ type: 'error', texte: err.response?.data?.message || 'Erreur' });
    }
  };

  const placesFiltrees = places.filter(p => {
    const okStatut = filtre === "tous" || p.statut === filtre;
    const okZone   = zone   === "tous" || p.zone   === zone;
    return okStatut && okZone;
  });

  const stats = {
    total:        places.length,
    libres:       places.filter(p => p.statut === 'libre').length,
    occupees:     places.filter(p => p.statut === 'occupee').length,
    reservees:    places.filter(p => p.statut === 'reservee').length,
    hors_service: places.filter(p => p.statut === 'hors_service').length,
  };

  const zones = [...new Set(places.map(p => p.zone))].sort();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent
                          rounded-full animate-spin"></div>
          <span className="text-sm">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestion des places</h2>
          <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-1">
            <RefreshCw size={11} /> Mise à jour toutes les 30 secondes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={charger}
            className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400
                       hover:text-violet-600 hover:border-violet-200 transition-colors"
            style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <RefreshCw size={16} />
          </button>
          {isAdmin && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600
                         hover:bg-violet-700 text-white text-sm font-medium
                         rounded-xl transition-colors">
              <Plus size={16} /> Ajouter une place
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
            : 'bg-red-50 border border-red-100 text-red-700'
        }`}>
          {message.type === 'success'
            ? <CheckCircle size={16} />
            : <AlertTriangle size={16} />}
          {message.texte}
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total",        value: stats.total,        icon: ParkingSquare, iconBg: "bg-violet-50",  iconColor: "text-violet-600" },
          { label: "Libres",       value: stats.libres,       icon: CheckCircle,   iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
          { label: "Occupées",     value: stats.occupees,     icon: Bike,          iconBg: "bg-amber-50",   iconColor: "text-amber-600"  },
          { label: "Hors service", value: stats.hors_service, icon: Wrench,        iconBg: "bg-red-50",     iconColor: "text-red-500"    },
        ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100"
               style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center`}>
                <Icon size={15} className={iconColor} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1"
             style={{boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
          {["tous", "libre", "occupee", "reservee", "hors_service"].map(f => (
            <button key={f} onClick={() => setFiltre(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtre === f
                  ? "bg-violet-600 text-white"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}>
              {f === "tous" ? "Tous" : STATUT_CONFIG[f]?.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1"
             style={{boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
          <button onClick={() => setZone("tous")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              zone === "tous" ? "bg-violet-600 text-white" : "text-gray-400 hover:bg-gray-50"
            }`}>
            Toutes zones
          </button>
          {zones.map(z => (
            <button key={z} onClick={() => setZone(z)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                zone === z ? "bg-violet-600 text-white" : "text-gray-400 hover:bg-gray-50"
              }`}>
              Zone {z}
            </button>
          ))}
        </div>
      </div>

      {/* Grille */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {placesFiltrees.map(place => {
          const cfg      = STATUT_CONFIG[place.statut] || STATUT_CONFIG.libre;
          const IconeType = TYPE_ICON[place.type] || ParkingSquare;
          return (
            <div key={place.id} onClick={() => isAdmin && setSelected(place)}
              className={`${cfg.bg} ${cfg.border} border rounded-2xl p-3
                         transition-all hover:scale-105 hover:shadow-md
                         ${isAdmin ? 'cursor-pointer' : ''}
                         ${selected?.id === place.id ? 'ring-2 ring-violet-400' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <IconeType size={15} className={cfg.text} />
                <div className={`w-2 h-2 rounded-full ${cfg.dot}`}></div>
              </div>
              <p className={`font-bold text-sm ${cfg.text}`}>{place.numero}</p>
              <p className="text-xs text-gray-400 mt-0.5">Zone {place.zone}</p>
              {place.plaque && (
                <p className="text-xs font-mono text-gray-600 mt-1 truncate">
                  {place.plaque}
                </p>
              )}
              {place.heure_entree && (
                <p className="text-xs text-gray-400">
                  {new Date(place.heure_entree).toLocaleTimeString('fr-FR', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              )}
              <p className={`text-xs font-medium mt-1 ${cfg.text}`}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {placesFiltrees.length === 0 && (
        <div className="text-center py-16 text-gray-300">
          <ParkingSquare size={48} className="mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Aucune place pour ce filtre</p>
        </div>
      )}

      {/* Modal détail */}
      {selected && isAdmin && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center
                        justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPin size={16} className="text-violet-600" />
                Place {selected.numero}
              </h3>
              <button onClick={() => setSelected(null)}
                className="text-gray-300 hover:text-gray-500 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 mb-5">
              {[
                ["Zone",        selected.zone],
                ["Type",        selected.type],
                ["Statut",      STATUT_CONFIG[selected.statut]?.label],
                ["Plaque",      selected.plaque || "—"],
                ["Réservation", selected.reservation_id
                  ? `#${selected.reservation_id} — jusqu'au ${
                      selected.fin_resa
                        ? new Date(selected.fin_resa).toLocaleString('fr-FR', {
                            day: '2-digit', month: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })
                        : '—'
                    }`
                  : "—"
                ],
              ].map(([label, value]) => (
                <div key={label}
                  className="flex justify-between py-2 border-b border-gray-50 text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-medium text-gray-800">{value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {selected.statut === 'libre' && (
                <button onClick={() => changerStatut(selected.id, 'hors_service')}
                  className="w-full flex items-center gap-2 py-2.5 px-4 bg-red-50
                             hover:bg-red-100 text-red-700 text-sm rounded-xl
                             border border-red-100 transition-colors">
                  <Wrench size={14} /> Mettre hors service
                </button>
              )}
              {selected.statut === 'hors_service' && (
                <button onClick={() => changerStatut(selected.id, 'libre')}
                  className="w-full flex items-center gap-2 py-2.5 px-4 bg-emerald-50
                             hover:bg-emerald-100 text-emerald-700 text-sm rounded-xl
                             border border-emerald-100 transition-colors">
                  <CheckCircle size={14} /> Remettre en service
                </button>
              )}
              {selected.statut !== 'occupee' && (
                <button onClick={() => supprimerPlace(selected.id)}
                  className="w-full flex items-center gap-2 py-2.5 px-4 bg-gray-50
                             hover:bg-red-50 text-gray-400 hover:text-red-600
                             text-sm rounded-xl border border-gray-100 transition-colors">
                  <Trash2 size={14} /> Supprimer la place
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center
                        justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Plus size={16} className="text-violet-600" /> Nouvelle place
              </h3>
              <button onClick={() => setShowModal(false)}
                className="text-gray-300 hover:text-gray-500">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={ajouterPlace} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Numéro *
                </label>
                <input type="text" value={form.numero}
                  onChange={e => setForm({ ...form, numero: e.target.value.toUpperCase() })}
                  placeholder="ex: C01" required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl
                             text-sm bg-gray-50 focus:bg-white focus:outline-none
                             focus:ring-2 focus:ring-violet-300 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Zone *</label>
                  <input type="text" value={form.zone}
                    onChange={e => setForm({ ...form, zone: e.target.value.toUpperCase() })}
                    placeholder="A" maxLength={2} required
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl
                               text-sm bg-gray-50 focus:bg-white focus:outline-none
                               focus:ring-2 focus:ring-violet-300 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Étage</label>
                  <input type="number" value={form.etage} min={0}
                    onChange={e => setForm({ ...form, etage: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl
                               text-sm bg-gray-50 focus:bg-white focus:outline-none
                               focus:ring-2 focus:ring-violet-300 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                <select value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl
                             text-sm bg-gray-50 focus:bg-white focus:outline-none
                             focus:ring-2 focus:ring-violet-300 transition-all">
                  <option value="standard">Standard</option>
                  <option value="moto">Moto</option>
                  <option value="handicape">Handicapé</option>
                  <option value="vip">VIP</option>
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
                  <Plus size={15} /> Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
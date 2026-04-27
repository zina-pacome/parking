import { useState, useEffect } from "react";
import { Banknote, CreditCard, Smartphone, Filter, X, Receipt } from "lucide-react";
import api from "../api/axios";

const METHODE_CONFIG = {
  especes: { label: "Espèces",       icon: Banknote,    bg: "bg-emerald-50", text: "text-emerald-700", iconColor: "text-emerald-600" },
  carte:   { label: "Carte",         icon: CreditCard,  bg: "bg-violet-50",  text: "text-violet-700",  iconColor: "text-violet-600"  },
  mobile:  { label: "Mobile Money",  icon: Smartphone,  bg: "bg-blue-50",    text: "text-blue-700",    iconColor: "text-blue-600"    },
};

export default function Paiements() {
  const [paiements, setPaiements] = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [recu,      setRecu]      = useState(null);
  const [filtres,   setFiltres]   = useState({
    date: new Date().toISOString().split('T')[0], methode: "",
  });

  useEffect(() => { chargerStats(); }, []);
  useEffect(() => { chargerPaiements(); }, [chargerPaiements]);

  const chargerStats = async () => {
    try {
      const res = await api.get('/paiements/stats');
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const chargerPaiements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtres.date)    params.append('date',    filtres.date);
      if (filtres.methode) params.append('methode', filtres.methode);
      params.append('limite', '100');
      const res = await api.get(`/paiements?${params}`);
      setPaiements(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const voirRecu = async (id) => {
    try {
      const res = await api.get(`/paiements/${id}`);
      setRecu(res.data);
    } catch (err) { console.error(err); }
  };

  const formatHeure  = (d) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
  const formatDate   = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const formatDuree  = (m) => {
    if (!m) return '—';
    const h = Math.floor(m / 60), min = m % 60;
    return h > 0 ? `${h}h${min > 0 ? min + 'min' : ''}` : `${min}min`;
  };

  const totalFiltres = paiements.reduce((s, p) => s + Number(p.montant), 0);

  const inputClass = `px-3.5 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50
    focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all`;

  return (
    <div className="p-6 space-y-5">

      <div>
        <h2 className="text-xl font-bold text-gray-900">Paiements</h2>
        <p className="text-gray-400 text-sm mt-0.5">Suivi financier et encaissements</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Aujourd'hui",   value: Number(stats.totaux.aujourd_hui),   color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Cette semaine", value: Number(stats.totaux.cette_semaine), color: "text-violet-600",  bg: "bg-violet-50"  },
            { label: "Ce mois",       value: Number(stats.totaux.ce_mois),       color: "text-blue-600",    bg: "bg-blue-50"    },
            { label: "Total global",  value: Number(stats.totaux.total_global),  color: "text-gray-700",    bg: "bg-gray-50"    },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100"
                 style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
              <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
              <p className={`text-lg font-bold ${color}`}>
                {value.toLocaleString()} Ar
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Méthodes du jour */}
      {stats?.par_methode?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5"
             style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <p className="text-sm font-semibold text-gray-800 mb-4">
            Méthodes utilisées aujourd'hui
          </p>
          <div className="flex flex-wrap gap-3">
            {stats.par_methode.map(m => {
              const cfg = METHODE_CONFIG[m.methode] || METHODE_CONFIG.especes;
              const Icon = cfg.icon;
              return (
                <div key={m.methode}
                  className={`${cfg.bg} rounded-2xl px-4 py-3 flex items-center gap-3`}>
                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
                    <Icon size={18} className={cfg.iconColor} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</p>
                    <p className="text-xs text-gray-500">
                      {m.nb} paiement(s) · {Number(m.total).toLocaleString()} Ar
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3"
           style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Filter size={13} /> Filtres
        </div>
        <input type="date" value={filtres.date}
          onChange={e => setFiltres({ ...filtres, date: e.target.value })}
          className={inputClass} />
        <select value={filtres.methode}
          onChange={e => setFiltres({ ...filtres, methode: e.target.value })}
          className={inputClass}>
          <option value="">Toutes méthodes</option>
          <option value="especes">Espèces</option>
          <option value="carte">Carte</option>
          <option value="mobile">Mobile Money</option>
        </select>
        <button onClick={() => setFiltres({ date: "", methode: "" })}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200
                     rounded-xl text-xs text-gray-400 hover:text-gray-600
                     hover:bg-gray-50 transition-colors">
          <X size={12} /> Effacer
        </button>
      </div>

      {/* Résumé */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{paiements.length} paiement(s)</p>
        {totalFiltres > 0 && (
          <p className="text-sm font-semibold text-violet-600">
            Total : {totalFiltres.toLocaleString()} Ar
          </p>
        )}
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
        ) : paiements.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center
                            justify-center mx-auto mb-4">
              <Banknote size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">Aucun paiement pour ces filtres</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["#", "Plaque", "Place", "Entrée", "Sortie", "Durée", "Méthode", "Montant", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium
                                          text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paiements.map(pay => {
                  const cfg  = METHODE_CONFIG[pay.methode] || METHODE_CONFIG.especes;
                  const Icon = cfg.icon;
                  return (
                    <tr key={pay.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-gray-400">#{pay.id}</td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-gray-800 text-sm">
                        {pay.plaque}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {pay.place_numero}
                        <span className="text-xs text-gray-400 ml-1">Z.{pay.zone}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                        {formatHeure(pay.heure_entree)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                        {formatHeure(pay.heure_sortie)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">
                        {formatDuree(pay.duree_minutes)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1
                                         rounded-lg text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-violet-600">
                        {Number(pay.montant).toLocaleString()} Ar
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => voirRecu(pay.id)}
                          className="flex items-center gap-1 text-xs text-violet-600
                                     hover:text-violet-800 font-medium transition-colors">
                          <Receipt size={12} /> Reçu
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal reçu */}
      {recu && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center
                        justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12
                              bg-violet-50 rounded-2xl mb-3">
                <Receipt size={22} className="text-violet-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Reçu de paiement</h3>
              <p className="text-xs text-gray-400">#{recu.id} · {formatDate(recu.created_at)}</p>
            </div>
            <div className="space-y-2 mb-5">
              {[
                ["Plaque",    recu.plaque],
                ["Place",     `${recu.place_numero} — Zone ${recu.zone}`],
                ["Conducteur",recu.nom_conducteur || '—'],
                ["Entrée",    formatHeure(recu.heure_entree)],
                ["Sortie",    formatHeure(recu.heure_sortie)],
                ["Durée",     formatDuree(recu.duree_minutes)],
                ["Méthode",   METHODE_CONFIG[recu.methode]?.label || recu.methode],
                ["Agent",     recu.agent || '—'],
              ].map(([label, value]) => (
                <div key={label}
                  className="flex justify-between py-1.5 border-b border-gray-50 text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-medium text-gray-800">{value}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3">
                <span className="font-semibold text-gray-800">Total payé</span>
                <span className="font-bold text-violet-600 text-2xl">
                  {Number(recu.montant).toLocaleString()} Ar
                </span>
              </div>
            </div>
            <button onClick={() => setRecu(null)}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white
                         font-medium rounded-xl text-sm transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { Car, Bike, Truck, Search, X, Filter } from "lucide-react";
import api from "../api/axios";

const TYPE_VEHICULE = { voiture: Car, moto: Bike, camion: Truck };

export default function Historique() {
  const [historique, setHistorique] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [stats,      setStats]      = useState(null);
  const [filtres,    setFiltres]    = useState({
    date: new Date().toISOString().split('T')[0],
    plaque: "", type: "",
  });

  useEffect(() => { chargerStats(); }, []);
  useEffect(() => { chargerHistorique(); }, [filtres]);

  const chargerStats = async () => {
    try {
      const res = await api.get('/historique/stats');
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const chargerHistorique = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtres.date)   params.append('date',   filtres.date);
      if (filtres.plaque) params.append('plaque', filtres.plaque);
      if (filtres.type)   params.append('type',   filtres.type);
      params.append('limite', '100');
      const res = await api.get(`/historique?${params}`);
      setHistorique(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const formatHeure = (date) => date
    ? new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const formatDuree = (minutes) => {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`;
  };

  const totalRevenu = historique
    .filter(h => h.montant)
    .reduce((s, h) => s + Number(h.montant), 0);

  const inputClass = `px-3.5 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50
    focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all`;

  return (
    <div className="p-6 space-y-5">

      <div>
        <h2 className="text-xl font-bold text-gray-900">Historique</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          Toutes les entrées et sorties enregistrées
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Entrées aujourd'hui", value: stats.today.total_entrees,  color: "text-violet-600", bg: "bg-violet-50"  },
            { label: "Sorties aujourd'hui", value: stats.today.total_sorties,  color: "text-emerald-600",bg: "bg-emerald-50" },
            { label: "En cours",            value: stats.today.en_cours,       color: "text-amber-600",  bg: "bg-amber-50"   },
            { label: "Revenu du jour",
              value: `${Number(stats.today.revenu_jour).toLocaleString()} Ar`,
              color: "text-violet-600", bg: "bg-violet-50" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100"
                 style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
              <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
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
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input type="text" value={filtres.plaque}
            onChange={e => setFiltres({ ...filtres, plaque: e.target.value })}
            placeholder="Plaque..."
            className={inputClass + " pl-8 font-mono"} />
        </div>
        <select value={filtres.type}
          onChange={e => setFiltres({ ...filtres, type: e.target.value })}
          className={inputClass}>
          <option value="">Tous types</option>
          <option value="voiture">Voiture</option>
          <option value="moto">Moto</option>
          <option value="camion">Camion</option>
        </select>
        <button onClick={() => setFiltres({ date: "", plaque: "", type: "" })}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200
                     rounded-xl text-xs text-gray-400 hover:text-gray-600
                     hover:bg-gray-50 transition-colors">
          <X size={12} /> Effacer
        </button>
      </div>

      {/* Résumé */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {historique.length} résultat(s)
        </p>
        {totalRevenu > 0 && (
          <p className="text-sm font-semibold text-violet-600">
            Total : {totalRevenu.toLocaleString()} Ar
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
        ) : historique.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center
                            justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">Aucun résultat pour ces filtres</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Plaque", "Type", "Place", "Entrée", "Sortie", "Durée", "Montant", "Statut"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium
                                          text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historique.map(row => {
                  const IconeType = TYPE_VEHICULE[row.type_vehicule] || Car;
                  return (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-gray-800 text-sm">
                        {row.plaque}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                          <IconeType size={14} className="text-gray-500" />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
                        {row.place_numero}
                        <span className="text-xs text-gray-400 ml-1">Z.{row.zone}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                        {formatHeure(row.heure_entree)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                        {formatHeure(row.heure_sortie)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">
                        {formatDuree(row.duree_minutes)}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-sm">
                        {row.montant
                          ? <span className="text-violet-600">
                              {Number(row.montant).toLocaleString()} Ar
                            </span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1
                                         rounded-lg text-xs font-medium ${
                          row.statut === 'en_cours'
                            ? 'bg-violet-50 text-violet-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            row.statut === 'en_cours' ? 'bg-violet-500' : 'bg-gray-400'
                          }`}></span>
                          {row.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, ArcElement
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import StatCard from "../components/StatCard";
import {
  ParkingSquare, Car, CheckCircle,
  Banknote, TrendingUp,
  Calendar, Activity
} from "lucide-react";
import api from "../api/axios";

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, ArcElement
);

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function Dashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [heure,   setHeure]   = useState(new Date().toLocaleTimeString("fr-FR"));

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeure(new Date().toLocaleTimeString("fr-FR"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const charger = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  if (!stats) return null;

  const places         = stats.places;
  const tauxOccupation = places.total > 0
    ? Math.round((places.occupees / places.total) * 100) : 0;

  // Graphique barres — 7 derniers jours
  const joursLabels = [];
  const entreesData = [];
  const sortiesData = [];

  for (let i = 6; i >= 0; i--) {
    const date    = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const jourFr  = JOURS[date.getDay() === 0 ? 6 : date.getDay() - 1];
    const found   = stats.activite_semaine?.find(a => {
      return new Date(a.jour).toISOString().split('T')[0] === dateStr;
    });
    joursLabels.push(jourFr);
    entreesData.push(found ? Number(found.entrees) : 0);
    sortiesData.push(found ? Number(found.sorties) : 0);
  }

  const barData = {
    labels: joursLabels,
    datasets: [
      {
        label:           "Entrées",
        data:            entreesData,
        backgroundColor: "#7C3AED",
        borderRadius:    6,
        borderSkipped:   false,
      },
      {
        label:           "Sorties",
        data:            sortiesData,
        backgroundColor: "#A78BFA",
        borderRadius:    6,
        borderSkipped:   false,
      },
    ],
  };

  const doughnutData = {
    labels:   ["Libres", "Occupées", "Réservées"],
    datasets: [{
      data:            [places.libres || 0, places.occupees || 0, places.reservees || 0],
      backgroundColor: ["#7C3AED", "#EF4444", "#F59E0B"],
      borderWidth:     0,
      hoverOffset:     4,
    }],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top", labels: { font: { size: 11 }, usePointStyle: true } }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } },
           grid: { color: '#F3F4F6' } },
      x: { ticks: { font: { size: 10 } }, grid: { display: false } }
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom", labels: { font: { size: 11 }, usePointStyle: true } },
    },
    cutout: "72%",
  };

  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="p-6 space-y-6">

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Bonjour,{" "}
            <span className="text-violet-600">Administrateur</span> 👋
          </h2>
          <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-1">
            <Calendar size={12} />
            {dateLabel}
          </p>
        </div>
        <div className="text-right bg-white border border-gray-100 rounded-2xl
                        px-5 py-3" style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <p className="text-2xl font-mono font-bold text-violet-600">{heure}</p>
          <p className="text-xs text-gray-400 flex items-center justify-end gap-1">
            <Activity size={10} /> Temps réel
          </p>
        </div>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Places totales"
          value={places.total || 0}
          sub="Capacité maximale"
          icon={ParkingSquare}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <StatCard
          label="Places libres"
          value={places.libres || 0}
          trend={`${100 - tauxOccupation}% disponible`}
          trendUp={true}
          icon={CheckCircle}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Places occupées"
          value={places.occupees || 0}
          trend={`${tauxOccupation}% d'occupation`}
          trendUp={false}
          icon={Car}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Revenu du jour"
          value={`${(stats.revenu_jour || 0).toLocaleString()} Ar`}
          trend="Paiements encaissés"
          trendUp={true}
          icon={Banknote}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Barres */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5"
             style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Entrées / Sorties
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">7 derniers jours</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-violet-600
                            bg-violet-50 px-3 py-1 rounded-full">
              <TrendingUp size={11} />
              Activité
            </div>
          </div>
          <Bar data={barData} options={barOptions} />
        </div>

        {/* Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col"
             style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Occupation</h3>
            <p className="text-xs text-gray-400 mt-0.5">État actuel</p>
          </div>
          <div className="relative flex-1 flex items-center justify-center">
            <div className="w-44">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-2xl font-bold text-gray-900">{tauxOccupation}%</span>
              <span className="text-xs text-gray-400">occupé</span>
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              { label: "Revenu semaine", value: `${(stats.revenu_semaine || 0).toLocaleString()} Ar`, color: "text-violet-600" },
              { label: "Réservations",   value: places.reservees || 0,  color: "text-amber-600"  },
              { label: "Hors service",   value: places.hors_service || 0, color: "text-red-500"  },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{label}</span>
                <span className={`text-xs font-semibold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
           style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
        <div className="flex items-center justify-between px-5 py-4
                        border-b border-gray-50">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Activité récente</h3>
            <p className="text-xs text-gray-400 mt-0.5">Dernières opérations</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>

        {!stats.historique?.length ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            Aucune activité pour le moment
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {["Plaque", "Statut", "Place", "Entrée", "Sortie", "Montant"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium
                                          text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(stats.historique || []).map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-gray-800 text-sm">
                      {item.plaque}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1
                                       rounded-lg text-xs font-medium ${
                        item.statut === 'en_cours'
                          ? 'bg-violet-50 text-violet-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.statut === 'en_cours' ? 'bg-violet-500' : 'bg-gray-400'
                        }`}></span>
                        {item.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
                      {item.place_numero}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                      {item.heure_entree
                        ? new Date(item.heure_entree).toLocaleTimeString('fr-FR', {
                            hour: '2-digit', minute: '2-digit'
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                      {item.heure_sortie
                        ? new Date(item.heure_sortie).toLocaleTimeString('fr-FR', {
                            hour: '2-digit', minute: '2-digit'
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-sm">
                      {item.montant
                        ? <span className="text-violet-600">
                            {Number(item.montant).toLocaleString()} Ar
                          </span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
import { useState, useEffect } from "react";
import {
  Car, Bike, Truck, LogIn, LogOut, MapPin, Clock,
  Banknote, CheckCircle, AlertCircle, Receipt,
  X, ParkingSquare, CalendarClock
} from "lucide-react";
import api from "../api/axios";

export default function EntreeSortie() {
  const [places,         setPlaces]         = useState([]);
  const [entreesEnCours, setEntreesEnCours] = useState([]);
  const [onglet,         setOnglet]         = useState("entree");
  const [loading,        setLoading]        = useState(false);
  const [message,        setMessage]        = useState(null);
  const [recu,           setRecu]           = useState(null);
  const [modalSortie,    setModalSortie]    = useState(null);
  const [formEntree,     setFormEntree]     = useState({
    plaque: "", type_vehicule: "voiture",
    nom_conducteur: "", telephone: "", place_id: ""
  });

  useEffect(() => { chargerDonnees(); }, []);

  const chargerDonnees = async () => {
    try {
      const [placesRes, entreesRes] = await Promise.all([
        api.get('/places/libres'),
        api.get('/entrees'),
      ]);
      setPlaces(placesRes.data);
      setEntreesEnCours(entreesRes.data);
    } catch (err) { console.error(err); }
  };

  const handleEntree = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/entrees', formEntree);
      if (res.data.reservation) {
        setMessage({ type: 'reservation', texte: res.data.reservation.message });
      } else {
        setMessage({ type: 'success', texte: `Entrée enregistrée — Place ${res.data.place}` });
      }
      setFormEntree({ plaque: "", type_vehicule: "voiture", nom_conducteur: "", telephone: "", place_id: "" });
      chargerDonnees();
    } catch (err) {
      setMessage({ type: 'error', texte: err.response?.data?.message || 'Erreur serveur' });
    } finally { setLoading(false); }
  };

  const handleSortie = async (methode = 'especes') => {
    if (!modalSortie) return;
    setLoading(true);
    try {
      const res = await api.post(`/entrees/${modalSortie.id}/sortie`, { methode_paiement: methode });
      setModalSortie(null);
      setRecu(res.data);
      chargerDonnees();
    } catch (err) {
      setMessage({ type: 'error', texte: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };

  const formatDuree = (minutes) => {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m} min`;
  };

  const formatHeure = (date) =>
    new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const getIconeVehicule = (type) =>
    type === 'moto' ? Bike : type === 'camion' ? Truck : Car;

  const getDureeMin  = (h) => Math.ceil((new Date() - new Date(h)) / 60000);
  const getMontant   = (h) => Math.max(1, Math.ceil(getDureeMin(h) / 60)) * 2000;

  const inputClass = `w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm
    bg-gray-50 focus:bg-white focus:outline-none focus:ring-2
    focus:ring-violet-300 focus:border-transparent transition-all`;

  return (
    <div className="p-6 space-y-5">

      {/* En-tête */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Entrée / Sortie</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          {entreesEnCours.length} véhicule(s) actuellement dans le parking
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
          message.type === 'reservation'
            ? 'bg-violet-50 border border-violet-100 text-violet-700'
            : message.type === 'success'
            ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
            : 'bg-red-50 border border-red-100 text-red-700'
        }`}>
          {message.type === 'reservation' ? <CalendarClock size={16} />
            : message.type === 'success'  ? <CheckCircle size={16} />
            : <AlertCircle size={16} />}
          <div>
            <p className="font-semibold">
              {message.type === 'reservation' ? 'Réservation détectée !'
                : message.type === 'success'  ? 'Entrée enregistrée'
                : 'Erreur'}
            </p>
            <p className="font-normal opacity-90">{message.texte}</p>
          </div>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Reçu */}
      {recu && (
        <div className="bg-white border border-violet-100 rounded-2xl p-6 max-w-md"
             style={{boxShadow:'0 4px 16px rgba(124,58,237,0.08)'}}>
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12
                            bg-violet-50 rounded-2xl mb-3">
              <Receipt size={22} className="text-violet-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Reçu de paiement</h3>
          </div>
          <div className="space-y-2">
            {[
              ["Plaque",  recu.plaque],
              ["Place",   recu.place],
              ["Entrée",  formatHeure(recu.heure_entree)],
              ["Sortie",  formatHeure(recu.heure_sortie)],
              ["Durée",   formatDuree(recu.duree_minutes)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3">
              <span className="font-semibold text-gray-800">Total</span>
              <span className="font-bold text-violet-600 text-2xl">
                {recu.montant.toLocaleString()} Ar
              </span>
            </div>
          </div>
          <button onClick={() => setRecu(null)}
            className="w-full mt-5 py-2.5 bg-violet-600 hover:bg-violet-700
                       text-white rounded-xl text-sm font-medium transition-colors">
            Fermer
          </button>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2">
        {[
          { key: "entree", label: "Enregistrer une entrée", icon: LogIn  },
          { key: "sortie", label: "Enregistrer une sortie", icon: LogOut },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setOnglet(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm
                        font-medium transition-colors ${
              onglet === key
                ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                : "bg-white border border-gray-100 text-gray-500 hover:border-violet-200 hover:text-violet-600"
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Formulaire entrée */}
      {onglet === "entree" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-lg"
             style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center">
              <LogIn size={15} className="text-violet-600" />
            </div>
            Nouveau véhicule
          </h3>
          <form onSubmit={handleEntree} className="space-y-4">

            {/* Ligne 1 : Plaque + Type véhicule */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Plaque *
                </label>
                <input
                  type="text"
                  value={formEntree.plaque}
                  onChange={e => setFormEntree({
                    ...formEntree, plaque: e.target.value.toUpperCase()
                  })}
                  placeholder="MG-001-AB"
                  required
                  className={inputClass + " font-mono"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Type de véhicule
                </label>
                <select
                  value={formEntree.type_vehicule}
                  onChange={e => setFormEntree({
                    ...formEntree, type_vehicule: e.target.value
                  })}
                  className={inputClass}
                >
                  <option value="voiture">Voiture</option>
                  <option value="moto">Moto</option>
                  <option value="camion">Camion</option>
                </select>
              </div>
            </div>

            {/* Nom conducteur */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Nom du conducteur
              </label>
              <input
                type="text"
                value={formEntree.nom_conducteur}
                onChange={e => setFormEntree({
                  ...formEntree, nom_conducteur: e.target.value
                })}
                placeholder="Optionnel"
                className={inputClass}
              />
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Téléphone
              </label>
              <input
                type="text"
                value={formEntree.telephone}
                onChange={e => setFormEntree({
                  ...formEntree, telephone: e.target.value
                })}
                placeholder="Optionnel"
                className={inputClass}
              />
            </div>

            {/* Place */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Place
              </label>
              <select
                value={formEntree.place_id}
                onChange={e => setFormEntree({
                  ...formEntree, place_id: e.target.value
                })}
                className={inputClass}
              >
                <option value="">-- Choisir (auto si réservation active) --</option>
                {places.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.numero} — Zone {p.zone} — {p.type}
                    {p.statut === 'reservee' ? ' — Réservée' : ' — Libre'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                <CalendarClock size={11} />
                Si le véhicule a une réservation active, la place est attribuée automatiquement
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3
                        bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300
                        text-white font-medium rounded-xl text-sm transition-colors"
            >
              <LogIn size={16} />
              {loading ? "Enregistrement..." : "Enregistrer l'entrée"}
            </button>

          </form>
        </div>
      )}

      {/* Liste sorties */}
      {onglet === "sortie" && (
        <div className="space-y-3">
          {entreesEnCours.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center"
                 style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center
                              justify-center mx-auto mb-4">
                <ParkingSquare size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm font-medium">Aucun véhicule dans le parking</p>
            </div>
          ) : (
            entreesEnCours.map(e => {
              const IconeVehicule = getIconeVehicule(e.type_vehicule);
              return (
                <div key={e.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5
                             flex items-center justify-between gap-4"
                  style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 border border-amber-100
                                    rounded-2xl flex items-center justify-center">
                      <IconeVehicule size={22} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-gray-900 text-base">
                        {e.plaque}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} />
                        Place {e.place_numero} · Zone {e.zone}
                        {e.nom_conducteur && ` · ${e.nom_conducteur}`}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        Entrée {formatHeure(e.heure_entree)} ·{" "}
                        {formatDuree(getDureeMin(e.heure_entree))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-violet-600 flex items-center justify-end gap-1">
                      <Banknote size={14} />
                      ~{getMontant(e.heure_entree).toLocaleString()} Ar
                    </p>
                    <p className="text-xs text-gray-400 mb-2">estimation</p>
                    <button onClick={() => setModalSortie(e)} disabled={loading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500
                                 hover:bg-red-600 text-white text-xs font-medium
                                 rounded-xl transition-colors ml-auto">
                      <LogOut size={13} /> Sortie
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal paiement */}
      {modalSortie && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center
                        justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Enregistrer la sortie</h3>
              <button onClick={() => setModalSortie(null)}
                className="text-gray-300 hover:text-gray-500">
                <X size={18} />
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
              {[
                ["Plaque",     modalSortie.plaque],
                ["Place",      modalSortie.place_numero],
                ["Entrée",     formatHeure(modalSortie.heure_entree)],
                ["Durée est.", formatDuree(getDureeMin(modalSortie.heure_entree))],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-medium text-gray-800">{value}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-1 border-t border-gray-100">
                <span className="font-semibold text-gray-700 text-sm">Montant estimé</span>
                <span className="font-bold text-violet-600">
                  ~{getMontant(modalSortie.heure_entree).toLocaleString()} Ar
                </span>
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-3">Méthode de paiement :</p>
            <div className="space-y-2">
              {[
                { key: "especes", label: "Espèces",       icon: Banknote,   bg: "hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700" },
                { key: "carte",   label: "Carte bancaire", icon: CheckCircle,bg: "hover:bg-violet-50  hover:border-violet-200  hover:text-violet-700"  },
                { key: "mobile",  label: "Mobile Money",   icon: Receipt,    bg: "hover:bg-blue-50    hover:border-blue-200    hover:text-blue-700"    },
              ].map(({ key, label, icon: Icon, bg }) => (
                <button key={key} onClick={() => handleSortie(key)} disabled={loading}
                  className={`w-full flex items-center gap-3 px-4 py-3 border
                              border-gray-100 rounded-xl text-sm font-medium
                              text-gray-500 transition-all disabled:opacity-50 ${bg}`}>
                  <Icon size={17} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
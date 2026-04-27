import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ParkingSquare, ArrowLeftRight,
  CreditCard, CalendarClock, History,
  Users, LogOut, ChevronLeft, ChevronRight
} from "lucide-react";

const menus = [
  { path: "/",             label: "Dashboard",     icon: LayoutDashboard },
  { path: "/places",       label: "Places",        icon: ParkingSquare   },
  { path: "/entrees",      label: "Entrée/Sortie", icon: ArrowLeftRight  },
  { path: "/paiements",    label: "Paiements",     icon: CreditCard      },
  { path: "/reservations", label: "Réservations",  icon: CalendarClock   },
  { path: "/historique",   label: "Historique",    icon: History         },
  { path: "/utilisateurs", label: "Utilisateurs",  icon: Users           },
];

export default function Sidebar({ onLogout, user }) {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`relative flex min-h-screen bg-[#1E1B4B] flex-col
                   transition-all duration-300 ease-in-out sticky top-0 h-screen
                   ${collapsed ? 'w-16' : 'w-56'}`}>

      {/* Bouton collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 w-6 h-6 bg-violet-600 rounded-full
                   flex items-center justify-center shadow-lg z-10
                   hover:bg-violet-500 transition-colors"
      >
        {collapsed
          ? <ChevronRight size={12} className="text-white" />
          : <ChevronLeft  size={12} className="text-white" />
        }
      </button>

      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b border-white/10
                       ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-violet-500 rounded-xl flex items-center
                        justify-center flex-shrink-0">
          <ParkingSquare size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-semibold text-white leading-tight">
              ParkManager
            </p>
            <p className="text-xs text-white/40">Gestion de parking</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {menus.map(({ path, label, icon: Icon }) => {
          const actif = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-xl transition-all
                         ${collapsed ? 'w-10 h-10 justify-center mx-auto' : 'px-3 py-2.5'}
                         ${actif
                           ? 'bg-violet-600 text-white'
                           : 'text-white/50 hover:bg-white/10 hover:text-white'
                         }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && (
                <span className="text-xs font-medium">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profil + déconnexion */}
      <div className={`p-3 border-t border-white/10 space-y-2`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center
                            justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.nom?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user?.nom || 'Admin'}
              </p>
              <p className="text-xs text-white/40 capitalize">
                {user?.role || 'admin'}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          title={collapsed ? 'Se déconnecter' : undefined}
          className={`flex items-center gap-2.5 text-white/40 hover:text-red-400
                      hover:bg-white/10 rounded-xl transition-colors
                      ${collapsed
                        ? 'w-10 h-10 justify-center mx-auto'
                        : 'w-full px-3 py-2'
                      }`}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && (
            <span className="text-xs font-medium">Se déconnecter</span>
          )}
        </button>
      </div>

    </aside>
  );
}
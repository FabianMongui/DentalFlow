import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icons } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useDentalFlow } from '../context/DentalFlowContext';
import type { ClientType, UserRole } from '../types';

const dashboardItem = { to: '/', icon: Icons.Dashboard, label: 'Dashboard' };
const trabajosItem = { to: '/trabajos', icon: Icons.Trabajos, label: 'Trabajos' };
const reportesItem = { to: '/reportes', icon: Icons.Reportes, label: 'Reportes' };
const configuracionItem = { to: '/configuracion', icon: Icons.Configuracion, label: 'Configuración' };
const laboratoriosItem = { to: '/laboratorios', icon: Icons.Laboratorios, label: 'Laboratorios' };
const citasItem = { to: '/citas', icon: Icons.Citas, label: 'Citas' };
const serviciosItem = { to: '/servicios', icon: Icons.Servicios, label: 'Servicios' };
const clientesItem = { to: '/clientes', icon: Icons.Clientes, label: 'Clientes' };
const superAdminItem = { to: '/super-admin', icon: Icons.SuperAdmin, label: 'Super Admin' };

const getNavItems = (role?: UserRole, clientType?: ClientType) => {
  if (role === 'super_admin') {
    return [
      dashboardItem,
      trabajosItem,
      citasItem,
      laboratoriosItem,
      clientesItem,
      serviciosItem,
      reportesItem,
      configuracionItem,
      superAdminItem,
    ];
  }

  const items = [dashboardItem, trabajosItem];
  if (role === 'client_admin' && clientType === 'Cliente individual') items.push(citasItem, laboratoriosItem);
  if (role === 'client_admin' && clientType === 'Laboratorio') items.push(serviciosItem);
  items.push(reportesItem, configuracionItem);
  return items;
};

const bottomNavColumns: Record<number, string> = {
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { getClientById } = useDentalFlow();
  const navItems = getNavItems(currentUser?.role, getClientById(currentUser?.clientId)?.type);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`hidden lg:flex flex-col gap-1 p-4 h-screen fixed left-0 top-0 z-50 bg-white border-r border-outline-variant transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-60'
      }`}
    >
      <div className={`px-2 py-6 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-primary truncate">DentalFlow</h1>
            <p className="text-xs text-slate-400 mt-1 truncate">Gestión simple de trabajos</p>
          </div>
        )}
        {collapsed && <Icons.Dashboard className="w-7 h-7 text-primary" />}
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${collapsed ? 'justify-center px-0' : ''} ${
                isActive
                  ? 'bg-secondary-container/20 text-secondary font-bold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-base truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? 'Expandir menú' : 'Contraer menú'}
        aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
        className="absolute right-0 bottom-24 translate-x-1/2 w-10 h-10 rounded-full border border-outline-variant bg-white shadow-md flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/40 transition-colors z-10"
      >
        {collapsed ? <Icons.ChevronRight className="w-4 h-4" /> : <Icons.ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`mt-auto pt-3 border-t border-slate-100 flex flex-col gap-2 ${collapsed ? 'items-center' : ''}`}>
        <button
          type="button"
          onClick={handleLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className={`flex items-center gap-3 rounded-full text-red-500 hover:bg-red-50 transition-colors ${
            collapsed ? 'w-10 h-10 justify-center shrink-0' : 'w-full px-3 py-2'
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <Icons.Logout className="w-4 h-4" />
          </span>
          {!collapsed && <span className="text-sm font-bold">Cerrar sesión</span>}
        </button>

        {/* {!collapsed && (
          <p className="text-[11px] text-slate-400 italic px-3 pt-1">DentalFlow v1.0 · modo demo local</p>
        )} */}
      </div>
    </aside>
  );
};

export const BottomNav = () => {
  const { currentUser } = useAuth();
  const { getClientById } = useDentalFlow();
  const navItems = getNavItems(currentUser?.role, getClientById(currentUser?.clientId)?.type);
  const columnsClass = bottomNavColumns[navItems.length] ?? 'grid-cols-4';

  return (
    <nav className={`fixed bottom-0 left-0 w-full z-50 grid ${columnsClass} lg:hidden px-1 py-2 bg-white border-t border-outline-variant shadow-lg pb-[calc(env(safe-area-inset-bottom)+0.5rem)]`}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-0 ${
              isActive
                ? 'bg-secondary-container text-secondary font-bold scale-105'
                : 'text-slate-500'
            }`
          }
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[9px] uppercase font-bold mt-1 tracking-tight truncate w-full text-center">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

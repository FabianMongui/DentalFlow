import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar, BottomNav } from './components/Navigation';
import { Header } from './components/Common';
import { RequireAuth, RequireRole, RequireClientType } from './components/RouteGuards';
import { AuthProvider } from './context/AuthContext';
import { DentalFlowProvider } from './context/DentalFlowContext';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import CreateJob from './pages/CreateJob';
import JobDetail from './pages/JobDetail';
import Clients from './pages/Clients';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SuperAdmin from './pages/SuperAdmin';
import Laboratories from './pages/Laboratories';
import Services from './pages/Services';
import Login from './pages/Login';

const SIDEBAR_COLLAPSED_KEY = 'dentalflow.sidebar.collapsed';

const Layout = ({
  children,
  title,
  showCreate = true,
  collapsed,
  onToggleSidebar,
}: {
  children: React.ReactNode;
  title: string;
  showCreate?: boolean;
  collapsed: boolean;
  onToggleSidebar: () => void;
}) => {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar collapsed={collapsed} onToggle={onToggleSidebar} />
      <div className={`flex-1 flex flex-col pb-24 lg:pb-8 min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-60'}`}>
        <Header title={title} showCreate={showCreate} />
        <main className="p-4 sm:p-5 md:p-8 max-w-7xl mx-auto w-full min-w-0">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default function App() {
  const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  const toggleSidebar = () => setCollapsed((current) => !current);

  return (
    <AuthProvider>
      <DentalFlowProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Layout title="Panel General" collapsed={collapsed} onToggleSidebar={toggleSidebar}><Dashboard /></Layout></RequireAuth>} />
          <Route path="/trabajos" element={<RequireAuth><Layout title="Gestión de Trabajos" collapsed={collapsed} onToggleSidebar={toggleSidebar}><Jobs /></Layout></RequireAuth>} />
          <Route path="/trabajos/nuevo" element={<RequireAuth><Layout title="Crear Nuevo Trabajo" showCreate={false} collapsed={collapsed} onToggleSidebar={toggleSidebar}><CreateJob /></Layout></RequireAuth>} />
          <Route path="/trabajos/:id" element={<RequireAuth><Layout title="Detalle de Trabajo" collapsed={collapsed} onToggleSidebar={toggleSidebar}><JobDetail /></Layout></RequireAuth>} />
          <Route path="/clientes" element={<RequireRole role="super_admin"><Layout title="Clientes y Laboratorios" collapsed={collapsed} onToggleSidebar={toggleSidebar}><Clients /></Layout></RequireRole>} />
          <Route path="/reportes" element={<RequireAuth><Layout title="Reportes" collapsed={collapsed} onToggleSidebar={toggleSidebar}><Reports /></Layout></RequireAuth>} />
          <Route path="/configuracion" element={<RequireAuth><Layout title="Configuración" showCreate={false} collapsed={collapsed} onToggleSidebar={toggleSidebar}><Settings /></Layout></RequireAuth>} />
          <Route path="/super-admin" element={<RequireRole role="super_admin"><Layout title="Administración de Cuentas" showCreate={false} collapsed={collapsed} onToggleSidebar={toggleSidebar}><SuperAdmin /></Layout></RequireRole>} />
          <Route path="/laboratorios" element={<RequireClientType clientType="Cliente individual"><Layout title="Laboratorios" collapsed={collapsed} onToggleSidebar={toggleSidebar}><Laboratories /></Layout></RequireClientType>} />
          <Route path="/servicios" element={<RequireClientType clientType="Laboratorio"><Layout title="Servicios" showCreate={false} collapsed={collapsed} onToggleSidebar={toggleSidebar}><Services /></Layout></RequireClientType>} />
          <Route path="*" element={<RequireAuth><Layout title="No encontrado" collapsed={collapsed} onToggleSidebar={toggleSidebar}><Jobs /></Layout></RequireAuth>} />
        </Routes>
      </DentalFlowProvider>
    </AuthProvider>
  );
}

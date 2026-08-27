import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { initials } from '../components/Common';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useDentalFlow } from '../context/DentalFlowContext';

const Login = () => {
  const navigate = useNavigate();
  const { loginAsSuperAdmin, loginAsClient } = useAuth();
  const { clients } = useDentalFlow();

  const handleSuperAdminLogin = () => {
    loginAsSuperAdmin();
    navigate('/');
  };

  const handleClientLogin = (client: (typeof clients)[number]) => {
    if (loginAsClient(client)) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex font-sans">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] relative overflow-hidden bg-gradient-to-br from-primary via-primary-container to-secondary">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 70%, white 1px, transparent 1px)',
          backgroundSize: '48px 48px, 64px 64px',
        }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-black/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Icons.Dashboard className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">DentalFlow</span>
          </div>

          <div className="space-y-6 max-w-md">
            <h2 className="font-display text-4xl xl:text-[2.75rem] font-bold leading-[1.1] tracking-tight">
              La gestión de tu laboratorio, sin fricción.
            </h2>
            <p className="text-white/80 text-base leading-relaxed">
              Controla trabajos, pagos, citas y clientes desde un solo lugar, pensado para técnicos y laboratorios dentales.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              {[
                'Seguimiento de trabajos en tiempo real',
                'Pagos y correcciones bajo control',
                'Reportes claros para tomar decisiones',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium text-white/90">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Icons.Check className="w-3 h-3" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/60">© {new Date().getFullYear()} DentalFlow · Todos los derechos reservados</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        <div className="lg:hidden absolute top-0 right-0 w-[380px] h-[380px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
        <div className="lg:hidden absolute bottom-0 left-0 w-[320px] h-[320px] bg-secondary/5 rounded-full blur-[90px] translate-y-1/2 -translate-x-1/4" />

        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-[440px] relative z-10 flex flex-col gap-8"
        >
          <header className="flex lg:hidden flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-xl shadow-primary/10 flex items-center justify-center border border-slate-100">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Icons.Dashboard className="text-white w-6 h-6" />
              </div>
            </div>
            <div>
              <h1 className="font-display text-3xl font-extrabold text-primary tracking-tight">DentalFlow</h1>
              <p className="text-slate-500 font-medium mt-1 text-sm">Gestión simple para técnicos y laboratorios dentales.</p>
            </div>
          </header>

          <div className="hidden lg:block">
            <h1 className="font-display text-2xl font-bold text-slate-800">Bienvenido de nuevo</h1>
            <p className="text-slate-500 text-sm mt-1">Ingresa a tu cuenta para continuar.</p>
          </div>

          <section className="bg-white border border-outline-variant rounded-[28px] p-6 sm:p-8 shadow-xl shadow-slate-200/60">
            <form onSubmit={(e) => { e.preventDefault(); handleSuperAdminLogin(); }} className="flex flex-col gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Correo electrónico</label>
                <div className="relative flex items-center">
                  <Icons.Mail className="absolute left-4 w-5 h-5 text-slate-300" />
                  <input
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    className="w-full h-13 pl-12 pr-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 focus:bg-white transition-all font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contraseña</label>
                  <button type="button" className="text-[11px] font-bold text-primary hover:underline">¿Olvidaste tu contraseña?</button>
                </div>
                <div className="relative flex items-center">
                  <Icons.Lock className="absolute left-4 w-5 h-5 text-slate-300" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full h-13 pl-12 pr-12 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 focus:bg-white transition-all font-medium"
                  />
                  <button type="button" className="absolute right-4 text-slate-300 hover:text-slate-500">
                    <Icons.Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 px-1">
                <input type="checkbox" className="w-4.5 h-4.5 rounded-md border-slate-200 text-primary focus:ring-primary/40 cursor-pointer" id="rem" />
                <label htmlFor="rem" className="text-sm font-medium text-slate-500 cursor-pointer">Recordar mi sesión</label>
              </div>

              <button className="h-13 bg-primary text-white text-base font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary-container active:scale-[0.98] transition-all mt-1">
                Iniciar sesión
              </button>
            </form>

            <div className="mt-7 pt-7 border-t border-slate-100 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Modo demo · elige una cuenta</p>
              <button
                type="button"
                onClick={handleSuperAdminLogin}
                className="h-13 w-full bg-primary/5 border border-primary/15 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-primary hover:bg-primary/10 active:scale-[0.98] transition-all"
              >
                <Icons.SuperAdmin className="w-5 h-5" />
                Entrar como Súper administrador
              </button>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    disabled={!client.active}
                    onClick={() => handleClientLogin(client)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                      client.active
                        ? 'border-slate-100 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]'
                        : 'border-slate-100 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-gradient-to-br from-primary/10 to-secondary/10 text-primary border border-primary/10 shrink-0">
                      {initials(client.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-sm text-slate-700 truncate">{client.name}</span>
                      <span className="block text-xs text-slate-400">{client.type}{!client.active ? ' · Cuenta inactiva' : ''}</span>
                    </span>
                    <Icons.ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <footer className="flex flex-col items-center gap-5">
            <p className="text-sm font-medium text-slate-500 text-center">
              Acceso de demostración local, sin contraseñas reales todavía.
            </p>
            <div className="flex gap-6">
              {['Privacidad', 'Términos', 'Ayuda'].map(link => (
                <button key={link} className="text-xs font-bold text-slate-300 hover:text-slate-500 transition-colors uppercase tracking-widest">{link}</button>
              ))}
            </div>
          </footer>
        </motion.main>
      </div>
    </div>
  );
};

export default Login;

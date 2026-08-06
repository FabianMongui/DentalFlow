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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] relative z-10 flex flex-col gap-8"
      >
        <header className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl shadow-primary/10 flex items-center justify-center border border-slate-100">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icons.Dashboard className="text-white w-6 h-6" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">DentalFlow</h1>
            <p className="text-slate-500 font-medium mt-1">Gestión simple para técnicos y laboratorios dentales.</p>
          </div>
        </header>

        <section className="bg-white border border-outline-variant rounded-[32px] p-8 md:p-10 shadow-2xl shadow-slate-200">
          <form onSubmit={(e) => { e.preventDefault(); handleSuperAdminLogin(); }} className="flex flex-col gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Correo electrónico</label>
              <div className="relative flex items-center">
                <Icons.Mail className="absolute left-4 w-5 h-5 text-slate-300" />
                <input 
                  type="email" 
                  placeholder="nombre@ejemplo.com" 
                  className="w-full h-14 pl-12 pr-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-medium text-slate-700" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between px-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contraseña</label>
                <button className="text-[11px] font-bold text-primary hover:underline">¿Olvidaste tu contraseña?</button>
              </div>
              <div className="relative flex items-center">
                <Icons.Lock className="absolute left-4 w-5 h-5 text-slate-300" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full h-14 pl-12 pr-12 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-medium" 
                />
                <button className="absolute right-4 text-slate-300 hover:text-slate-500">
                  <Icons.Eye className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 px-1">
              <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-200 text-primary focus:ring-primary cursor-pointer" id="rem" />
              <label htmlFor="rem" className="text-sm font-medium text-slate-500 cursor-pointer">Recordar mi sesión</label>
            </div>

            <button className="h-14 bg-primary text-white text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all mt-2">
              Iniciar sesión
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Modo demo · elige una cuenta</p>
            <button
              type="button"
              onClick={handleSuperAdminLogin}
              className="h-14 w-full bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-center gap-3 font-bold text-primary hover:bg-primary/10 active:scale-95 transition-all"
            >
              <Icons.SuperAdmin className="w-5 h-5" />
              Entrar como Súper administrador
            </button>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {clients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  disabled={!client.active}
                  onClick={() => handleClientLogin(client)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                    client.active
                      ? 'border-slate-100 hover:border-primary hover:bg-primary/5 active:scale-95'
                      : 'border-slate-100 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-slate-50 text-slate-500 border border-slate-100 shrink-0">
                    {initials(client.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-sm text-slate-700 truncate">{client.name}</span>
                    <span className="block text-xs text-slate-400">{client.type}{!client.active ? ' · Cuenta inactiva' : ''}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <footer className="flex flex-col items-center gap-6 mt-4">
          <p className="text-sm font-medium text-slate-500">
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
  );
};

export default Login;

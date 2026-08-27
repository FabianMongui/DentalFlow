import Swal from 'sweetalert2';

/** Color de marca activo, leído del tema del cliente (ver ThemeContext). */
const brandColor = () => {
  const root = getComputedStyle(document.documentElement);
  const hue = root.getPropertyValue('--brand-h').trim() || '277';
  const chroma = root.getPropertyValue('--brand-c').trim() || '0.215';
  return `oklch(0.457 ${chroma} ${hue})`;
};

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export const notifySuccess = (title: string) => toast.fire({ icon: 'success', title });
export const notifyError = (title: string) => toast.fire({ icon: 'error', title });

export const confirmDelete = async (title: string, text?: string) => {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
  });
  return result.isConfirmed;
};

export const confirmReject = async (title: string, text?: string) => {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: 'Rechazar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
  });
  return result.isConfirmed;
};

export const confirmDiscard = async () => {
  const result = await Swal.fire({
    icon: 'warning',
    title: '¿Descartar cambios?',
    text: 'Tienes cambios sin guardar en este trabajo.',
    showCancelButton: true,
    confirmButtonText: 'Descartar',
    cancelButtonText: 'Seguir editando',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: brandColor(),
    reverseButtons: true,
  });
  return result.isConfirmed;
};

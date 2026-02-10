import Swal, { type SweetAlertOptions, type SweetAlertResult } from 'sweetalert2';

const brandHeaderHtml = `
  <div class="kx-brand" aria-label="KONTAXPRO">
    <span class="kx-brand__kontax">KONTAX</span><span class="kx-brand__pro">PRO</span>
  </div>
`;

const baseOptions = (): SweetAlertOptions => ({
  backdrop: true,
  buttonsStyling: false,
  customClass: {
    popup: 'kx-swal',
    title: 'kx-swal-title',
    htmlContainer: 'kx-swal-text',
    confirmButton: 'kx-swal-btn kx-swal-btn--ok',
    cancelButton: 'kx-swal-btn kx-swal-btn--no',
  },
});

/**
 * Loading (marca + dots)
 */
export const showLoading = (message = 'Procesando...'): void => {
  Swal.fire({
    ...baseOptions(),
    title: '',
    html: `
      ${brandHeaderHtml}

      <div class="kx-swal-loading">
        <div class="kx-dots" aria-label="Cargando">
          <span></span><span></span><span></span>
        </div>
        <div class="kx-swal-loading__label">Estamos procesando su solicitud...</div>
      </div>

      <div style="margin-top:10px; font-weight:800; color: var(--text); letter-spacing:-0.01em;">
        ${message}
      </div>
    `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
  });
};

/** Cerrar alerta */
export const closeAlert = (): void => {
  Swal.close();
};

/**
 * Success con autocierre (SIN marca)
 */
export const showSuccessAutoClose = (
  title: string,
  timer = 1500
): Promise<SweetAlertResult> => {
  return Swal.fire({
    ...baseOptions(),
    icon: 'success',
    title,
    showConfirmButton: false,
    timer,
  });
};

/**
 * Error (SIN marca)
 */
export const showError = (title: string, text = ''): Promise<SweetAlertResult> => {
  return Swal.fire({
    ...baseOptions(),
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Entendido',
  });
};

/**
 * Warning (SIN marca)
 */
export const showWarning = (title: string, text = ''): Promise<SweetAlertResult> => {
  return Swal.fire({
    ...baseOptions(),
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'Entendido',
  });
};

/**
 * Info (SIN marca)
 */
export const showInfo = (title = '¡Atención!', text = ''): Promise<SweetAlertResult> => {
  return Swal.fire({
    ...baseOptions(),
    icon: 'info',
    title,
    text,
    confirmButtonText: 'Entendido',
  });
};

/**
 * Confirmación personalizada (Sí / No) (SIN marca)
 */
export const showConfirmCustom = (
  title: string,
  text = '',
  confirmText = 'Sí',
  cancelText = 'No'
): Promise<SweetAlertResult> => {
  return Swal.fire({
    ...baseOptions(),
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
};

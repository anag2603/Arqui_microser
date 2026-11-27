const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export function validateEmail(email) {
  const value = email.trim();
  if (!value) return 'El email es obligatorio';
  if (value.length > 254 || !EMAIL_REGEX.test(value)) return 'Ingresa un email válido';
  return null;
}

export function validatePassword(password) {
  if (!password) return 'La contraseña es obligatoria';
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return `La contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres`;
  }
  return null;
}

export function validatePasswordMatch(password, confirm) {
  if (!confirm) return 'Confirma tu contraseña';
  if (password !== confirm) return 'Las contraseñas no coinciden';
  return null;
}
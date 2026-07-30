export const validation = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Para login: senhas antigas podem ter menos de 8 caracteres, então só exigimos preenchimento.
  password: (password: string): {isValid: boolean; message?: string} => {
    if (password.length === 0) {
      return {isValid: false, message: 'Informe sua senha'};
    }
    return {isValid: true};
  },

  // Para cadastro/troca de senha: política mínima de 8 caracteres (igual ao backend).
  newPassword: (password: string): {isValid: boolean; message?: string} => {
    if (password.length < 8) {
      return {isValid: false, message: 'A senha deve ter pelo menos 8 caracteres'};
    }
    if (password.length > 128) {
      return {isValid: false, message: 'A senha deve ter no máximo 128 caracteres'};
    }
    return {isValid: true};
  },

  name: (name: string): {isValid: boolean; message?: string} => {
    if (name.trim().length < 2) {
      return {isValid: false, message: 'O nome deve ter pelo menos 2 caracteres'};
    }
    return {isValid: true};
  },
};

export const validation = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  password: (password: string): {isValid: boolean; message?: string} => {
    if (password.length < 6) {
      return {isValid: false, message: 'A senha deve ter pelo menos 6 caracteres'};
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

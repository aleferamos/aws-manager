import { AppLanguage } from '../../shared/config/languages.config';

export interface SetPasswordAdminAreaTranslation {
  title: string;
  subtitle: string;

  emailLabel: string;
  emailPlaceholder: string;

  passwordLabel: string;
  passwordPlaceholder: string;

  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;

  confirmButton: string;
  languagePlaceholder: string;

  toast: {
    invalidFormSummary: string;
    invalidFormDetail: string;

    passwordDefinedSummary: string;
    passwordDefinedDetail: string;

    saveErrorSummary: string;
    saveErrorDetail: string;
  };
}

export const setPasswordAdminAreaTranslations: Record<
  AppLanguage,
  SetPasswordAdminAreaTranslation
> = {
  'en-US': {
    title: 'Set Admin Password',
    subtitle: 'Define the administrator email and password',

    emailLabel: 'Administrator email',
    emailPlaceholder: 'Enter the administrator email',

    passwordLabel: 'Enter your password',
    passwordPlaceholder: 'Enter your password',

    confirmPasswordLabel: 'Repeat your password',
    confirmPasswordPlaceholder: 'Repeat your password',

    confirmButton: 'Confirm',
    languagePlaceholder: 'Language',

    toast: {
      invalidFormSummary: 'Invalid fields',
      invalidFormDetail: 'Please fill in the fields correctly before continuing.',

      passwordDefinedSummary: 'Admin user configured',
      passwordDefinedDetail: 'The administrator email and password were saved successfully.',

      saveErrorSummary: 'Save error',
      saveErrorDetail: 'Unable to configure the administrator user.',
    },
  },

  'pt-BR': {
    title: 'Definir administrador',
    subtitle: 'Defina o e-mail e a senha do administrador',

    emailLabel: 'E-mail do administrador',
    emailPlaceholder: 'Digite o e-mail do administrador',

    passwordLabel: 'Digite sua senha',
    passwordPlaceholder: 'Digite sua senha',

    confirmPasswordLabel: 'Repita sua senha',
    confirmPasswordPlaceholder: 'Repita sua senha',

    confirmButton: 'Confirmar',
    languagePlaceholder: 'Idioma',

    toast: {
      invalidFormSummary: 'Campos invalidos',
      invalidFormDetail: 'Preencha corretamente os campos antes de continuar.',

      passwordDefinedSummary: 'Administrador configurado',
      passwordDefinedDetail: 'O e-mail e a senha do administrador foram salvos com sucesso.',

      saveErrorSummary: 'Erro ao salvar',
      saveErrorDetail: 'Nao foi possivel configurar o administrador.',
    },
  },
};

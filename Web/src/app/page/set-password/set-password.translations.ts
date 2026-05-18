import { AppLanguage } from '../../shared/config/languages.config';

export interface SetPasswordTranslation {
  title: string;
  subtitle: string;
  emailLabel: string;
  codeLabel: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  confirmButton: string;
  languagePlaceholder: string;
  invalidInviteTitle: string;
  invalidInviteDescription: string;

  toast: {
    passwordDefinedSummary: string;
    passwordDefinedDetail: string;
    saveErrorSummary: string;
    saveErrorDetail: string;
  };
}

export const setPasswordTranslations: Record<AppLanguage, SetPasswordTranslation> = {
  'en-US': {
    title: 'Set your password',
    subtitle: 'Create a secure password to activate your AWS Manager account.',
    emailLabel: 'Account email',
    codeLabel: 'Invitation code',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    confirmPasswordLabel: 'Confirm password',
    confirmPasswordPlaceholder: 'Repeat your password',
    confirmButton: 'Set password',
    languagePlaceholder: 'Language',
    invalidInviteTitle: 'Invalid invitation link',
    invalidInviteDescription: 'Open the link from your invitation email or request a new invite.',

    toast: {
      passwordDefinedSummary: 'Password defined',
      passwordDefinedDetail: 'Your password was created successfully.',
      saveErrorSummary: 'Save error',
      saveErrorDetail: 'Unable to define your password.',
    },
  },

  'pt-BR': {
    title: 'Defina sua senha',
    subtitle: 'Crie uma senha segura para ativar sua conta no AWS Manager.',
    emailLabel: 'Email da conta',
    codeLabel: 'Codigo do convite',
    passwordLabel: 'Senha',
    passwordPlaceholder: 'Digite sua senha',
    confirmPasswordLabel: 'Confirmar senha',
    confirmPasswordPlaceholder: 'Repita sua senha',
    confirmButton: 'Definir senha',
    languagePlaceholder: 'Idioma',
    invalidInviteTitle: 'Link de convite invalido',
    invalidInviteDescription: 'Abra o link recebido no email de convite ou solicite um novo convite.',

    toast: {
      passwordDefinedSummary: 'Senha definida',
      passwordDefinedDetail: 'Sua senha foi criada com sucesso.',
      saveErrorSummary: 'Erro ao salvar',
      saveErrorDetail: 'Nao foi possivel definir sua senha.',
    },
  },
};

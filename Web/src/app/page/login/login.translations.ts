import { AppLanguage } from '../../shared/config/languages.config';

export interface LoginTranslation {
  title: string;
  subtitle: string;
  loginLabel: string;
  loginPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  forgotPassword: string;
  loginButton: string;
  languagePlaceholder: string;

  forgotPasswordDialog: {
    title: string;
    subtitle: string;
    close: string;
    emailLabel: string;
    emailPlaceholder: string;
    cancel: string;
    submit: string;
  };

  toast: {
    loginSuccessSummary: string;
    loginErrorSummary: string;
    loginErrorDetail: string;
    forgotPasswordSummary: string;
    forgotPasswordDetail: string;
    forgotPasswordErrorSummary: string;
    forgotPasswordErrorDetail: string;
  };
}

export const loginTranslations: Record<AppLanguage, LoginTranslation> = {
  'en-US': {
    title: 'Login',
    subtitle: 'Access your AWS Manager account',
    loginLabel: 'E-mail',
    loginPlaceholder: 'Enter your login',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    forgotPassword: 'Forgot my password',
    loginButton: 'Sign in',
    languagePlaceholder: 'Language',

    forgotPasswordDialog: {
      title: 'Recover password',
      subtitle: 'Enter your account email to receive a password reset link.',
      close: 'Close dialog',
      emailLabel: 'Account email',
      emailPlaceholder: 'Enter your email',
      cancel: 'Cancel',
      submit: 'Send recovery link',
    },

    toast: {
      loginSuccessSummary: 'Login successful',
      loginErrorSummary: 'Login error',
      loginErrorDetail: 'Unable to sign in. Check your credentials.',
      forgotPasswordSummary: 'Recovery requested',
      forgotPasswordDetail: 'If the email exists, a recovery link will be sent.',
      forgotPasswordErrorSummary: 'Recovery error',
      forgotPasswordErrorDetail: 'Unable to request password recovery.',
    },
  },

  'pt-BR': {
    title: 'Entrar',
    subtitle: 'Acesse sua conta do AWS Manager',
    loginLabel: 'E-mail',
    loginPlaceholder: 'Digite seu login',
    passwordLabel: 'Senha',
    passwordPlaceholder: 'Digite sua senha',
    forgotPassword: 'Esqueci minha senha',
    loginButton: 'Entrar',
    languagePlaceholder: 'Idioma',

    forgotPasswordDialog: {
      title: 'Recuperar senha',
      subtitle: 'Informe o email da sua conta para receber um link de redefinicao.',
      close: 'Fechar dialog',
      emailLabel: 'Email da conta',
      emailPlaceholder: 'Digite seu email',
      cancel: 'Cancelar',
      submit: 'Enviar link de recuperacao',
    },

    toast: {
      loginSuccessSummary: 'Login realizado',
      loginErrorSummary: 'Erro ao entrar',
      loginErrorDetail: 'Não foi possível entrar. Verifique suas credenciais.',
      forgotPasswordSummary: 'Recuperacao solicitada',
      forgotPasswordDetail: 'Se o email existir, um link de recuperacao sera enviado.',
      forgotPasswordErrorSummary: 'Erro na recuperacao',
      forgotPasswordErrorDetail: 'Nao foi possivel solicitar a recuperacao de senha.',
    },
  },
};

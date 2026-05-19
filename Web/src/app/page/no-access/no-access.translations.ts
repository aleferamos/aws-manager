import { AppLanguage } from '../../shared/config/languages.config';

export const noAccessTranslations: Record<AppLanguage, {
  title: string;
  description: string;
}> = {
  'en-US': {
    title: 'No access',
    description: 'You do not have permission to access this page.',
  },
  'pt-BR': {
    title: 'Sem acesso',
    description: 'Voce nao possui permissao para acessar esta pagina.',
  },
};

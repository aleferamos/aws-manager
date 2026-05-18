import { AppLanguage } from '../../shared/config/languages.config';

export interface ConfigurationTranslations {
  eyebrow: string;
  title: string;
  subtitle: string;
  form: {
    siteUrlLabel: string;
    siteUrlPlaceholder: string;
    siteUrlHelper: string;
    save: string;
  };
  info: {
    title: string;
    description: string;
    currentValue: string;
  };
  toast: {
    loadErrorSummary: string;
    loadErrorDetail: string;
    updateSuccessSummary: string;
    updateSuccessDetail: string;
    updateErrorSummary: string;
    updateErrorDetail: string;
  };
}

export const configurationTranslations: Record<AppLanguage, ConfigurationTranslations> = {
  'en-US': {
    eyebrow: 'Settings',
    title: 'Application settings',
    subtitle: 'Define the public Web URL used by AWS Manager in e-mail links.',
    form: {
      siteUrlLabel: 'Site URL',
      siteUrlPlaceholder: 'https://aws-manager.company.com',
      siteUrlHelper: 'This address is used to generate password definition links sent by e-mail.',
      save: 'Save settings',
    },
    info: {
      title: 'Password definition link',
      description: 'When a user is invited or requests password recovery, AWS Manager combines this URL with /set-password and the secure e-mail parameters.',
      currentValue: 'Current URL',
    },
    toast: {
      loadErrorSummary: 'Load settings error',
      loadErrorDetail: 'Unable to load application settings.',
      updateSuccessSummary: 'Settings saved',
      updateSuccessDetail: 'Application settings were updated successfully.',
      updateErrorSummary: 'Save settings error',
      updateErrorDetail: 'Unable to update application settings.',
    },
  },

  'pt-BR': {
    eyebrow: 'Configuracao',
    title: 'Configuracoes da aplicacao',
    subtitle: 'Defina a URL publica do Web usada pelo AWS Manager nos links enviados por e-mail.',
    form: {
      siteUrlLabel: 'URL do site',
      siteUrlPlaceholder: 'https://aws-manager.empresa.com',
      siteUrlHelper: 'Este endereco e usado para gerar os links de definicao de senha enviados por e-mail.',
      save: 'Salvar configuracoes',
    },
    info: {
      title: 'Link de definicao de senha',
      description: 'Quando um usuario e convidado ou solicita recuperacao de senha, o AWS Manager combina essa URL com /set-password e os parametros seguros do e-mail.',
      currentValue: 'URL atual',
    },
    toast: {
      loadErrorSummary: 'Erro ao carregar configuracoes',
      loadErrorDetail: 'Nao foi possivel carregar as configuracoes da aplicacao.',
      updateSuccessSummary: 'Configuracoes salvas',
      updateSuccessDetail: 'As configuracoes da aplicacao foram atualizadas com sucesso.',
      updateErrorSummary: 'Erro ao salvar configuracoes',
      updateErrorDetail: 'Nao foi possivel atualizar as configuracoes da aplicacao.',
    },
  },
};

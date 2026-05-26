import { AppLanguage } from '../../../shared/config/languages.config';

export interface CloudFrontQueryTranslation {
  eyebrow: string;
  title: string;
  subtitle: string;
  reload: string;
  close: string;
  emptyCredential: {
    title: string;
    description: string;
  };
  stats: {
    total: string;
    enabled: string;
  };
  search: {
    placeholder: string;
    ariaLabel: string;
  };
  table: {
    id: string;
    status: string;
    enabled: string;
    domainName: string;
    aliases: string;
    origins: string;
    priceClass: string;
    lastModified: string;
    loading: string;
    emptyTitle: string;
    emptyDescription: string;
    showing: string;
    rowsPerPage: string;
    firstPage: string;
    previousPage: string;
    nextPage: string;
    lastPage: string;
  };
  toast: {
    listErrorSummary: string;
    listErrorDetail: string;
  };
}

export const cloudFrontQueryTranslations: Record<AppLanguage, CloudFrontQueryTranslation> = {
  'en-US': {
    eyebrow: 'AWS CDN',
    title: 'CloudFront',
    subtitle: 'View CloudFront distributions for the selected credential.',
    reload: 'Reload distributions',
    close: 'Close',
    emptyCredential: {
      title: 'Select a credential',
      description: 'Choose an AWS credential in the top bar to load CloudFront distributions.',
    },
    stats: {
      total: 'Total distributions',
      enabled: 'Enabled distributions',
    },
    search: {
      placeholder: 'Search distributions by any field',
      ariaLabel: 'Search CloudFront distributions',
    },
    table: {
      id: 'Distribution ID',
      status: 'Status',
      enabled: 'Enabled',
      domainName: 'Domain name',
      aliases: 'Aliases',
      origins: 'Origins',
      priceClass: 'Pricing plan',
      lastModified: 'Last modified',
      loading: 'Loading CloudFront distributions...',
      emptyTitle: 'No distributions found',
      emptyDescription: 'This credential did not return CloudFront distributions.',
      showing: 'Showing {first}-{last} of {total}',
      rowsPerPage: 'Rows per page',
      firstPage: 'First page',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      lastPage: 'Last page',
    },
    toast: {
      listErrorSummary: 'CloudFront error',
      listErrorDetail: 'Unable to load CloudFront distributions.',
    },
  },
  'pt-BR': {
    eyebrow: 'AWS CDN',
    title: 'CloudFront',
    subtitle: 'Visualize distribuicoes CloudFront para a credencial selecionada.',
    reload: 'Recarregar distribuicoes',
    close: 'Fechar',
    emptyCredential: {
      title: 'Selecione uma credencial',
      description: 'Escolha uma credencial AWS no topo para carregar as distribuicoes CloudFront.',
    },
    stats: {
      total: 'Total de distribuicoes',
      enabled: 'Distribuicoes ativas',
    },
    search: {
      placeholder: 'Buscar distribuicoes por qualquer campo',
      ariaLabel: 'Buscar distribuicoes CloudFront',
    },
    table: {
      id: 'Distribution ID',
      status: 'Status',
      enabled: 'Ativa',
      domainName: 'Domain name',
      aliases: 'Aliases',
      origins: 'Origins',
      priceClass: 'Pricing plan',
      lastModified: 'Last modified',
      loading: 'Carregando distribuicoes CloudFront...',
      emptyTitle: 'Nenhuma distribuicao encontrada',
      emptyDescription: 'Esta credencial nao retornou distribuicoes CloudFront.',
      showing: 'Mostrando {first}-{last} de {total}',
      rowsPerPage: 'Linhas por pagina',
      firstPage: 'Primeira pagina',
      previousPage: 'Pagina anterior',
      nextPage: 'Proxima pagina',
      lastPage: 'Ultima pagina',
    },
    toast: {
      listErrorSummary: 'Erro CloudFront',
      listErrorDetail: 'Nao foi possivel carregar as distribuicoes CloudFront.',
    },
  },
};

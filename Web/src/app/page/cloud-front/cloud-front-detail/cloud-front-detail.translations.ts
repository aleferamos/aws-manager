import { AppLanguage } from '../../../shared/config/languages.config';

export interface CloudFrontDetailTranslation {
  eyebrow: string;
  title: string;
  subtitle: string;
  back: string;
  reload: string;
  createInvalidation: string;
  close: string;
  emptyCredential: {
    title: string;
    description: string;
  };
  tabs: {
    overview: string;
    invalidations: string;
  };
  overview: {
    status: string;
    enabled: string;
    domainName: string;
    arn: string;
    aliases: string;
    origins: string;
    priceClass: string;
    httpVersion: string;
    ipv6: string;
    lastModified: string;
    comment: string;
  };
  table: {
    id: string;
    status: string;
    createTime: string;
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
  form: {
    title: string;
    subtitle: string;
    pathsLabel: string;
    pathsPlaceholder: string;
    pathsHelper: string;
    callerReferenceLabel: string;
    callerReferencePlaceholder: string;
    cancel: string;
    create: string;
  };
  toast: {
    detailErrorSummary: string;
    detailErrorDetail: string;
    invalidationsErrorSummary: string;
    invalidationsErrorDetail: string;
    createSummary: string;
    createDetail: string;
    createErrorSummary: string;
    createErrorDetail: string;
  };
}

export const cloudFrontDetailTranslations: Record<AppLanguage, CloudFrontDetailTranslation> = {
  'en-US': {
    eyebrow: 'AWS CDN',
    title: 'Distribution details',
    subtitle: 'View distribution metadata and manage invalidations.',
    back: 'Back to distributions',
    reload: 'Reload',
    createInvalidation: 'Create invalidation',
    close: 'Close',
    emptyCredential: {
      title: 'Select a credential',
      description: 'Choose an AWS credential in the top bar to load this distribution.',
    },
    tabs: {
      overview: 'Overview',
      invalidations: 'Invalidations',
    },
    overview: {
      status: 'Status',
      enabled: 'Enabled',
      domainName: 'Domain name',
      arn: 'ARN',
      aliases: 'Aliases',
      origins: 'Origins',
      priceClass: 'Pricing plan',
      httpVersion: 'HTTP version',
      ipv6: 'IPv6',
      lastModified: 'Last modified',
      comment: 'Comment',
    },
    table: {
      id: 'Invalidation ID',
      status: 'Status',
      createTime: 'Created at',
      loading: 'Loading invalidations...',
      emptyTitle: 'No invalidations found',
      emptyDescription: 'Create an invalidation to refresh cached paths.',
      showing: 'Showing {first}-{last} of {total}',
      rowsPerPage: 'Rows per page',
      firstPage: 'First page',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      lastPage: 'Last page',
    },
    form: {
      title: 'Create invalidation',
      subtitle: 'Inform one path per line. Use /* to invalidate all cached objects.',
      pathsLabel: 'Paths',
      pathsPlaceholder: '/*\n/assets/app.js',
      pathsHelper: 'CloudFront paths must start with /. One path per line.',
      callerReferenceLabel: 'Caller reference',
      callerReferencePlaceholder: 'Optional unique reference',
      cancel: 'Cancel',
      create: 'Create',
    },
    toast: {
      detailErrorSummary: 'CloudFront error',
      detailErrorDetail: 'Unable to load the distribution.',
      invalidationsErrorSummary: 'Invalidations error',
      invalidationsErrorDetail: 'Unable to load invalidations.',
      createSummary: 'Invalidation created',
      createDetail: 'The invalidation was created successfully.',
      createErrorSummary: 'Create invalidation error',
      createErrorDetail: 'Unable to create the invalidation.',
    },
  },
  'pt-BR': {
    eyebrow: 'AWS CDN',
    title: 'Detalhes da distribuicao',
    subtitle: 'Veja metadados da distribuicao e gerencie invalidations.',
    back: 'Voltar para distribuicoes',
    reload: 'Recarregar',
    createInvalidation: 'Criar invalidation',
    close: 'Fechar',
    emptyCredential: {
      title: 'Selecione uma credencial',
      description: 'Escolha uma credencial AWS no topo para carregar esta distribuicao.',
    },
    tabs: {
      overview: 'Overview',
      invalidations: 'Invalidations',
    },
    overview: {
      status: 'Status',
      enabled: 'Ativa',
      domainName: 'Domain name',
      arn: 'ARN',
      aliases: 'Aliases',
      origins: 'Origins',
      priceClass: 'Pricing plan',
      httpVersion: 'HTTP version',
      ipv6: 'IPv6',
      lastModified: 'Last modified',
      comment: 'Comentario',
    },
    table: {
      id: 'Invalidation ID',
      status: 'Status',
      createTime: 'Criada em',
      loading: 'Carregando invalidations...',
      emptyTitle: 'Nenhuma invalidation encontrada',
      emptyDescription: 'Crie uma invalidation para atualizar paths em cache.',
      showing: 'Mostrando {first}-{last} de {total}',
      rowsPerPage: 'Linhas por pagina',
      firstPage: 'Primeira pagina',
      previousPage: 'Pagina anterior',
      nextPage: 'Proxima pagina',
      lastPage: 'Ultima pagina',
    },
    form: {
      title: 'Criar invalidation',
      subtitle: 'Informe um path por linha. Use /* para invalidar todo o cache.',
      pathsLabel: 'Paths',
      pathsPlaceholder: '/*\n/assets/app.js',
      pathsHelper: 'Paths CloudFront devem iniciar com /. Um path por linha.',
      callerReferenceLabel: 'Caller reference',
      callerReferencePlaceholder: 'Referencia unica opcional',
      cancel: 'Cancelar',
      create: 'Criar',
    },
    toast: {
      detailErrorSummary: 'Erro CloudFront',
      detailErrorDetail: 'Nao foi possivel carregar a distribuicao.',
      invalidationsErrorSummary: 'Erro nas invalidations',
      invalidationsErrorDetail: 'Nao foi possivel carregar as invalidations.',
      createSummary: 'Invalidation criada',
      createDetail: 'A invalidation foi criada com sucesso.',
      createErrorSummary: 'Erro ao criar invalidation',
      createErrorDetail: 'Nao foi possivel criar a invalidation.',
    },
  },
};

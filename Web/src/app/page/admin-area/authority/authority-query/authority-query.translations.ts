import { AppLanguage } from '../../../../shared/config/languages.config';

export interface AuthorityQueryTranslation {
  title: string;
  subtitle: string;
  addButton: string;

  stats: {
    total: string;
  };

  filters: {
    searchLabel: string;
    searchPlaceholder: string;
  };

  scopes: {
    system: string;
    credential: string;
  };

  table: {
    code: string;
    name: string;
    scope: string;
    createdAt: string;
    actions: string;
    loading: string;
    emptyTitle: string;
    emptyDescription: string;
    rowsPerPage: string;
    paginatorInfo: string;
    firstPage: string;
    previousPage: string;
    nextPage: string;
    lastPage: string;
  };

  actions: {
    view: string;
    delete: string;
  };

  dialog: {
    addTitle: string;
    addSubtitle: string;
    viewTitle: string;
    viewSubtitle: string;
    loadingView: string;
    close: string;
    closeButton: string;
    cancel: string;
    save: string;
    update: string;
    deleteTitle: string;
    deleteCancel: string;
    deleteConfirm: string;
  };

  form: {
    codeLabel: string;
    codePlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    scopeLabel: string;
    scopePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
  };

  access: {
    title: string;
    description: string;
    loading: string;
    emptyUsers: string;
    emptyCredentials: string;
  };

  toast: {
    createdSummary: string;
    createdDetail: string;
    createErrorSummary: string;
    createErrorDetail: string;
    listErrorSummary: string;
    listErrorDetail: string;
    viewErrorSummary: string;
    viewErrorDetail: string;
    updatedSummary: string;
    updatedDetail: string;
    updateErrorSummary: string;
    updateErrorDetail: string;
    deleteConfirm: string;
    deletedSummary: string;
    deletedDetail: string;
    deleteErrorSummary: string;
    deleteErrorDetail: string;
    accessErrorSummary: string;
    accessErrorDetail: string;
  };
}

export const authorityQueryTranslations: Record<AppLanguage, AuthorityQueryTranslation> = {
  'en-US': {
    title: 'Authorities',
    subtitle: 'Manage authority groups used to organize access rules.',
    addButton: 'Add authority',

    stats: {
      total: 'Total authorities',
    },

    filters: {
      searchLabel: 'Search',
      searchPlaceholder: 'Search by name or description',
    },

    scopes: {
      system: 'System',
      credential: 'Credential',
    },

    table: {
      code: 'Code',
      name: 'Name',
      scope: 'Scope',
      createdAt: 'Created at',
      actions: 'Actions',
      loading: 'Loading authorities...',
      emptyTitle: 'No authorities found',
      emptyDescription: 'Create the first authority to start organizing access.',
      rowsPerPage: 'Rows per page',
      paginatorInfo: 'Showing {first}-{last} of {total}',
      firstPage: 'First page',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      lastPage: 'Last page',
    },

    actions: {
      view: 'View',
      delete: 'Delete',
    },

    dialog: {
      addTitle: 'Add authority',
      addSubtitle: 'Create an authority with a name and optional description.',
      viewTitle: 'View authority',
      viewSubtitle: 'View and update authority information.',
      loadingView: 'Loading authority...',
      close: 'Close dialog',
      closeButton: 'Close',
      cancel: 'Cancel',
      save: 'Save authority',
      update: 'Update authority',
      deleteTitle: 'Delete authority',
      deleteCancel: 'No',
      deleteConfirm: 'Yes, delete',
    },

    form: {
      codeLabel: 'Code',
      codePlaceholder: 'AWS_INVOICE',
      nameLabel: 'Name',
      namePlaceholder: 'Name',
      scopeLabel: 'Scope',
      scopePlaceholder: 'CREDENTIAL',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Optional context for this authority',
    },

    access: {
      title: 'Access usage',
      description: 'Where this authority is currently applied.',
      loading: 'Loading access...',
      emptyUsers: 'No users linked.',
      emptyCredentials: 'No user credentials linked.',
    },

    toast: {
      createdSummary: 'Authority created',
      createdDetail: 'The authority was created successfully.',
      createErrorSummary: 'Create authority error',
      createErrorDetail: 'Unable to create the authority. Check the fields and try again.',
      listErrorSummary: 'Load authorities error',
      listErrorDetail: 'Unable to load authorities. Try again in a moment.',
      viewErrorSummary: 'View authority error',
      viewErrorDetail: 'Unable to load the authority details. Try again in a moment.',
      updatedSummary: 'Authority updated',
      updatedDetail: 'The authority was updated successfully.',
      updateErrorSummary: 'Update authority error',
      updateErrorDetail: 'Unable to update the authority. Check the fields and try again.',
      deleteConfirm: 'Delete this authority? This action cannot be undone.',
      deletedSummary: 'Authority deleted',
      deletedDetail: 'The authority was deleted successfully.',
      deleteErrorSummary: 'Delete authority error',
      deleteErrorDetail: 'Unable to delete the authority. Try again in a moment.',
      accessErrorSummary: 'Load access error',
      accessErrorDetail: 'Unable to load access information. Try again in a moment.',
    },
  },

  'pt-BR': {
    title: 'Autoridades',
    subtitle: 'Gerencie grupos de autoridade usados para organizar regras de acesso.',
    addButton: 'Cadastrar autoridade',

    stats: {
      total: 'Total de autoridades',
    },

    filters: {
      searchLabel: 'Busca',
      searchPlaceholder: 'Busque por nome ou descricao',
    },

    scopes: {
      system: 'Sistema',
      credential: 'Credencial',
    },

    table: {
      code: 'Codigo',
      name: 'Nome',
      scope: 'Escopo',
      createdAt: 'Criada em',
      actions: 'Acoes',
      loading: 'Carregando autoridades...',
      emptyTitle: 'Nenhuma autoridade encontrada',
      emptyDescription: 'Cadastre a primeira autoridade para comecar a organizar acessos.',
      rowsPerPage: 'Linhas por pagina',
      paginatorInfo: 'Exibindo {first}-{last} de {total}',
      firstPage: 'Primeira pagina',
      previousPage: 'Pagina anterior',
      nextPage: 'Proxima pagina',
      lastPage: 'Ultima pagina',
    },

    actions: {
      view: 'Visualizar',
      delete: 'Excluir',
    },

    dialog: {
      addTitle: 'Cadastrar autoridade',
      addSubtitle: 'Crie uma autoridade com nome e descricao opcional.',
      viewTitle: 'Visualizar autoridade',
      viewSubtitle: 'Visualize e atualize as informacoes da autoridade.',
      loadingView: 'Carregando autoridade...',
      close: 'Fechar dialog',
      closeButton: 'Fechar',
      cancel: 'Cancelar',
      save: 'Salvar autoridade',
      update: 'Atualizar autoridade',
      deleteTitle: 'Excluir autoridade',
      deleteCancel: 'Nao',
      deleteConfirm: 'Sim, excluir',
    },

    form: {
      codeLabel: 'Codigo',
      codePlaceholder: 'AWS_INVOICE',
      nameLabel: 'Nome',
      namePlaceholder: 'Nome',
      scopeLabel: 'Escopo',
      scopePlaceholder: 'CREDENTIAL',
      descriptionLabel: 'Descricao',
      descriptionPlaceholder: 'Contexto opcional para essa autoridade',
    },

    access: {
      title: 'Uso do acesso',
      description: 'Onde esta authority esta aplicada agora.',
      loading: 'Carregando acessos...',
      emptyUsers: 'Nenhum usuario vinculado.',
      emptyCredentials: 'Nenhuma credencial de usuario vinculada.',
    },

    toast: {
      createdSummary: 'Autoridade criada',
      createdDetail: 'A autoridade foi criada com sucesso.',
      createErrorSummary: 'Erro ao criar autoridade',
      createErrorDetail: 'Nao foi possivel criar a autoridade. Verifique os campos e tente novamente.',
      listErrorSummary: 'Erro ao carregar autoridades',
      listErrorDetail: 'Nao foi possivel carregar as autoridades. Tente novamente em instantes.',
      viewErrorSummary: 'Erro ao visualizar autoridade',
      viewErrorDetail: 'Nao foi possivel carregar os detalhes da autoridade. Tente novamente em instantes.',
      updatedSummary: 'Autoridade atualizada',
      updatedDetail: 'A autoridade foi atualizada com sucesso.',
      updateErrorSummary: 'Erro ao atualizar autoridade',
      updateErrorDetail: 'Nao foi possivel atualizar a autoridade. Verifique os campos e tente novamente.',
      deleteConfirm: 'Excluir esta autoridade? Esta acao nao pode ser desfeita.',
      deletedSummary: 'Autoridade excluida',
      deletedDetail: 'A autoridade foi excluida com sucesso.',
      deleteErrorSummary: 'Erro ao excluir autoridade',
      deleteErrorDetail: 'Nao foi possivel excluir a autoridade. Tente novamente em instantes.',
      accessErrorSummary: 'Erro ao carregar acessos',
      accessErrorDetail: 'Nao foi possivel carregar os acessos. Tente novamente em instantes.',
    },
  },
};

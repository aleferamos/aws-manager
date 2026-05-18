import { AppLanguage } from '../../../../shared/config/languages.config';

export interface AppResourceQueryTranslation {
  title: string;
  subtitle: string;
  addButton: string;
  filters: {
    searchLabel: string;
    searchPlaceholder: string;
  };
  table: {
    code: string;
    label: string;
    type: string;
    path: string;
    active: string;
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
  types: {
    menu: string;
    page: string;
    action: string;
  };
  statuses: {
    active: string;
    inactive: string;
  };
  actions: {
    view: string;
  };
  dialog: {
    addTitle: string;
    addSubtitle: string;
    editTitle: string;
    editSubtitle: string;
    close: string;
    closeButton: string;
    cancel: string;
    save: string;
    update: string;
    loadingView: string;
  };
  form: {
    codeLabel: string;
    codePlaceholder: string;
    labelLabel: string;
    labelPlaceholder: string;
    typeLabel: string;
    typePlaceholder: string;
    pathLabel: string;
    pathPlaceholder: string;
    iconLabel: string;
    iconPlaceholder: string;
    orderLabel: string;
    orderPlaceholder: string;
    activeLabel: string;
    activePlaceholder: string;
    parentLabel: string;
    parentPlaceholder: string;
    authorityLabel: string;
    authorityPlaceholder: string;
  };
  toast: {
    createdSummary: string;
    createdDetail: string;
    createErrorSummary: string;
    createErrorDetail: string;
    updatedSummary: string;
    updatedDetail: string;
    updateErrorSummary: string;
    updateErrorDetail: string;
    listErrorSummary: string;
    listErrorDetail: string;
    viewErrorSummary: string;
    viewErrorDetail: string;
  };
}

export const appResourceQueryTranslations: Record<AppLanguage, AppResourceQueryTranslation> = {
  'en-US': {
    title: 'App Resources',
    subtitle: 'Manage menu, pages and actions controlled by the database.',
    addButton: 'Add resource',
    filters: {
      searchLabel: 'Search',
      searchPlaceholder: 'Search by code, label or path',
    },
    table: {
      code: 'Code',
      label: 'Label',
      type: 'Type',
      path: 'Path',
      active: 'Status',
      actions: 'Actions',
      loading: 'Loading resources...',
      emptyTitle: 'No resources found',
      emptyDescription: 'Create the first app resource to control navigation.',
      rowsPerPage: 'Rows per page',
      paginatorInfo: 'Showing {first}-{last} of {total}',
      firstPage: 'First page',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      lastPage: 'Last page',
    },
    types: {
      menu: 'Menu',
      page: 'Page',
      action: 'Action',
    },
    statuses: {
      active: 'Active',
      inactive: 'Inactive',
    },
    actions: {
      view: 'View',
    },
    dialog: {
      addTitle: 'Add resource',
      addSubtitle: 'Create a menu, page or action controlled by access rules.',
      editTitle: 'View resource',
      editSubtitle: 'View and update the resource information.',
      close: 'Close dialog',
      closeButton: 'Close',
      cancel: 'Cancel',
      save: 'Save resource',
      update: 'Update resource',
      loadingView: 'Loading resource...',
    },
    form: {
      codeLabel: 'Code',
      codePlaceholder: 'DASHBOARD_BILLING',
      labelLabel: 'Label',
      labelPlaceholder: 'Dashboard',
      typeLabel: 'Type',
      typePlaceholder: 'Select type',
      pathLabel: 'Path',
      pathPlaceholder: '/dashboard',
      iconLabel: 'Icon',
      iconPlaceholder: 'layout-dashboard',
      orderLabel: 'Order',
      orderPlaceholder: '10',
      activeLabel: 'Status',
      activePlaceholder: 'Select status',
      parentLabel: 'Parent',
      parentPlaceholder: 'No parent',
      authorityLabel: 'Required authority',
      authorityPlaceholder: 'No authority',
    },
    toast: {
      createdSummary: 'Resource created',
      createdDetail: 'The app resource was created successfully.',
      createErrorSummary: 'Create resource error',
      createErrorDetail: 'Unable to create the resource. Check the fields and try again.',
      updatedSummary: 'Resource updated',
      updatedDetail: 'The app resource was updated successfully.',
      updateErrorSummary: 'Update resource error',
      updateErrorDetail: 'Unable to update the resource. Check the fields and try again.',
      listErrorSummary: 'Load resources error',
      listErrorDetail: 'Unable to load resources. Try again in a moment.',
      viewErrorSummary: 'View resource error',
      viewErrorDetail: 'Unable to load the resource details. Try again in a moment.',
    },
  },
  'pt-BR': {
    title: 'Recursos do App',
    subtitle: 'Gerencie menus, paginas e acoes controlados pelo banco.',
    addButton: 'Cadastrar recurso',
    filters: {
      searchLabel: 'Busca',
      searchPlaceholder: 'Busque por codigo, label ou path',
    },
    table: {
      code: 'Codigo',
      label: 'Label',
      type: 'Tipo',
      path: 'Path',
      active: 'Status',
      actions: 'Acoes',
      loading: 'Carregando recursos...',
      emptyTitle: 'Nenhum recurso encontrado',
      emptyDescription: 'Cadastre o primeiro recurso para controlar a navegacao.',
      rowsPerPage: 'Linhas por pagina',
      paginatorInfo: 'Exibindo {first}-{last} de {total}',
      firstPage: 'Primeira pagina',
      previousPage: 'Pagina anterior',
      nextPage: 'Proxima pagina',
      lastPage: 'Ultima pagina',
    },
    types: {
      menu: 'Menu',
      page: 'Pagina',
      action: 'Acao',
    },
    statuses: {
      active: 'Ativo',
      inactive: 'Inativo',
    },
    actions: {
      view: 'Visualizar',
    },
    dialog: {
      addTitle: 'Cadastrar recurso',
      addSubtitle: 'Crie um menu, pagina ou acao controlado por regras de acesso.',
      editTitle: 'Visualizar recurso',
      editSubtitle: 'Visualize e atualize as informacoes do recurso.',
      close: 'Fechar dialog',
      closeButton: 'Fechar',
      cancel: 'Cancelar',
      save: 'Salvar recurso',
      update: 'Atualizar recurso',
      loadingView: 'Carregando recurso...',
    },
    form: {
      codeLabel: 'Codigo',
      codePlaceholder: 'DASHBOARD_BILLING',
      labelLabel: 'Label',
      labelPlaceholder: 'Dashboard',
      typeLabel: 'Tipo',
      typePlaceholder: 'Selecione o tipo',
      pathLabel: 'Path',
      pathPlaceholder: '/dashboard',
      iconLabel: 'Icone',
      iconPlaceholder: 'layout-dashboard',
      orderLabel: 'Ordem',
      orderPlaceholder: '10',
      activeLabel: 'Status',
      activePlaceholder: 'Selecione o status',
      parentLabel: 'Pai',
      parentPlaceholder: 'Sem pai',
      authorityLabel: 'Authority obrigatoria',
      authorityPlaceholder: 'Sem authority',
    },
    toast: {
      createdSummary: 'Recurso criado',
      createdDetail: 'O recurso do app foi criado com sucesso.',
      createErrorSummary: 'Erro ao criar recurso',
      createErrorDetail: 'Nao foi possivel criar o recurso. Verifique os campos e tente novamente.',
      updatedSummary: 'Recurso atualizado',
      updatedDetail: 'O recurso do app foi atualizado com sucesso.',
      updateErrorSummary: 'Erro ao atualizar recurso',
      updateErrorDetail: 'Nao foi possivel atualizar o recurso. Verifique os campos e tente novamente.',
      listErrorSummary: 'Erro ao carregar recursos',
      listErrorDetail: 'Nao foi possivel carregar os recursos. Tente novamente em instantes.',
      viewErrorSummary: 'Erro ao visualizar recurso',
      viewErrorDetail: 'Nao foi possivel carregar os detalhes do recurso. Tente novamente em instantes.',
    },
  },
};

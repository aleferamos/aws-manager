import { AppLanguage } from '../../../../shared/config/languages.config';

export interface CredentialQueryTranslation {
  title: string;
  subtitle: string;
  addButton: string;

  stats: {
    total: string;
    active: string;
  };

  filters: {
    searchLabel: string;
    searchPlaceholder: string;
    statusLabel: string;
    statusPlaceholder: string;
  };

  statuses: {
    all: string;
    active: string;
    inactive: string;
  };

  table: {
    name: string;
    status: string;
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
    nameLabel: string;
    namePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    accessKeyIdLabel: string;
    accessKeyIdPlaceholder: string;
    secretKeyIdLabel: string;
    secretKeyIdPlaceholder: string;
    statusLabel: string;
    statusPlaceholder: string;
  };

  access: {
    usersTitle: string;
    usersDescription: string;
    loading: string;
    selectUser: string;
    selectAuthority: string;
    add: string;
    remove: string;
    activate: string;
    deactivate: string;
    emptyUsers: string;
    emptyAuthorities: string;
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
    accessUpdatedSummary: string;
    accessUpdatedDetail: string;
    accessUpdateErrorSummary: string;
    accessUpdateErrorDetail: string;
  };
}

export const credentialQueryTranslations: Record<AppLanguage, CredentialQueryTranslation> = {
  'en-US': {
    title: 'Credentials',
    subtitle: 'Manage AWS access credentials used by the platform.',
    addButton: 'Add credential',

    stats: {
      total: 'Total credentials',
      active: 'Active credentials',
    },

    filters: {
      searchLabel: 'Search',
      searchPlaceholder: 'Search by name or key',
      statusLabel: 'Status',
      statusPlaceholder: 'Filter by status',
    },

    statuses: {
      all: 'All statuses',
      active: 'Active',
      inactive: 'Inactive',
    },

    table: {
      name: 'Name',
      status: 'Status',
      createdAt: 'Created at',
      actions: 'Actions',
      loading: 'Loading credentials...',
      emptyTitle: 'No credentials found',
      emptyDescription: 'Create the first credential to connect AWS resources.',
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
      addTitle: 'Add credential',
      addSubtitle: 'Register the AWS access key and secret key.',
      viewTitle: 'View credential',
      viewSubtitle: 'View and update the credential information.',
      loadingView: 'Loading credential...',
      close: 'Close dialog',
      closeButton: 'Close',
      cancel: 'Cancel',
      save: 'Save credential',
      update: 'Update credential',
      deleteTitle: 'Delete credential',
      deleteCancel: 'No',
      deleteConfirm: 'Yes, delete',
    },

    form: {
      nameLabel: 'Name',
      namePlaceholder: 'Production account',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Optional context for this credential',
      accessKeyIdLabel: 'Access key ID',
      accessKeyIdPlaceholder: 'Enter the access key ID',
      secretKeyIdLabel: 'Secret key ID',
      secretKeyIdPlaceholder: 'Enter the secret key ID',
      statusLabel: 'Status',
      statusPlaceholder: 'Select status',
    },

    access: {
      usersTitle: 'Linked users',
      usersDescription: 'Users that can access this credential and their scoped authorities.',
      loading: 'Loading access...',
      selectUser: 'Select user',
      selectAuthority: 'Select authority',
      add: 'Add',
      remove: 'Remove',
      activate: 'Activate',
      deactivate: 'Deactivate',
      emptyUsers: 'No users linked.',
      emptyAuthorities: 'No authorities linked.',
    },

    toast: {
      createdSummary: 'Credential created',
      createdDetail: 'The credential was created successfully.',
      createErrorSummary: 'Create credential error',
      createErrorDetail: 'Unable to create the credential. Check the fields and try again.',
      listErrorSummary: 'Load credentials error',
      listErrorDetail: 'Unable to load credentials. Try again in a moment.',
      viewErrorSummary: 'View credential error',
      viewErrorDetail: 'Unable to load the credential details. Try again in a moment.',
      updatedSummary: 'Credential updated',
      updatedDetail: 'The credential was updated successfully.',
      updateErrorSummary: 'Update credential error',
      updateErrorDetail: 'Unable to update the credential. Check the fields and try again.',
      deleteConfirm: 'Delete this credential? This action cannot be undone.',
      deletedSummary: 'Credential deleted',
      deletedDetail: 'The credential was deleted successfully.',
      deleteErrorSummary: 'Delete credential error',
      deleteErrorDetail: 'Unable to delete the credential. Try again in a moment.',
      accessErrorSummary: 'Load access error',
      accessErrorDetail: 'Unable to load access information. Try again in a moment.',
      accessUpdatedSummary: 'Access updated',
      accessUpdatedDetail: 'The access configuration was updated.',
      accessUpdateErrorSummary: 'Update access error',
      accessUpdateErrorDetail: 'Unable to update access. Try again in a moment.',
    },
  },

  'pt-BR': {
    title: 'Credenciais',
    subtitle: 'Gerencie as credenciais de acesso AWS utilizadas pela plataforma.',
    addButton: 'Cadastrar credencial',

    stats: {
      total: 'Total de credenciais',
      active: 'Credenciais ativas',
    },

    filters: {
      searchLabel: 'Busca',
      searchPlaceholder: 'Busque por nome ou chave',
      statusLabel: 'Status',
      statusPlaceholder: 'Filtrar por status',
    },

    statuses: {
      all: 'Todos os status',
      active: 'Ativa',
      inactive: 'Inativa',
    },

    table: {
      name: 'Nome',
      status: 'Status',
      createdAt: 'Criada em',
      actions: 'Acoes',
      loading: 'Carregando credenciais...',
      emptyTitle: 'Nenhuma credencial encontrada',
      emptyDescription: 'Cadastre a primeira credencial para conectar recursos AWS.',
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
      addTitle: 'Cadastrar credencial',
      addSubtitle: 'Informe a access key e a secret key.',
      viewTitle: 'Visualizar credencial',
      viewSubtitle: 'Visualize e atualize as informacoes da credencial.',
      loadingView: 'Carregando credencial...',
      close: 'Fechar dialog',
      closeButton: 'Fechar',
      cancel: 'Cancelar',
      save: 'Salvar credencial',
      update: 'Atualizar credencial',
      deleteTitle: 'Excluir credencial',
      deleteCancel: 'Nao',
      deleteConfirm: 'Sim, excluir',
    },

    form: {
      nameLabel: 'Nome',
      namePlaceholder: 'Conta de producao',
      descriptionLabel: 'Descricao',
      descriptionPlaceholder: 'Contexto opcional para essa credencial',
      accessKeyIdLabel: 'Access key ID',
      accessKeyIdPlaceholder: 'Digite a access key ID',
      secretKeyIdLabel: 'Secret key ID',
      secretKeyIdPlaceholder: 'Digite a secret key ID',
      statusLabel: 'Status',
      statusPlaceholder: 'Selecione o status',
    },

    access: {
      usersTitle: 'Usuarios vinculados',
      usersDescription: 'Usuarios que podem acessar esta credencial e suas authorities por escopo.',
      loading: 'Carregando acessos...',
      selectUser: 'Selecione o usuario',
      selectAuthority: 'Selecione a authority',
      add: 'Adicionar',
      remove: 'Remover',
      activate: 'Ativar',
      deactivate: 'Desativar',
      emptyUsers: 'Nenhum usuario vinculado.',
      emptyAuthorities: 'Nenhuma authority vinculada.',
    },

    toast: {
      createdSummary: 'Credencial criada',
      createdDetail: 'A credencial foi criada com sucesso.',
      createErrorSummary: 'Erro ao criar credencial',
      createErrorDetail: 'Nao foi possivel criar a credencial. Verifique os campos e tente novamente.',
      listErrorSummary: 'Erro ao carregar credenciais',
      listErrorDetail: 'Nao foi possivel carregar as credenciais. Tente novamente em instantes.',
      viewErrorSummary: 'Erro ao visualizar credencial',
      viewErrorDetail: 'Nao foi possivel carregar os detalhes da credencial. Tente novamente em instantes.',
      updatedSummary: 'Credencial atualizada',
      updatedDetail: 'A credencial foi atualizada com sucesso.',
      updateErrorSummary: 'Erro ao atualizar credencial',
      updateErrorDetail: 'Nao foi possivel atualizar a credencial. Verifique os campos e tente novamente.',
      deleteConfirm: 'Excluir esta credencial? Esta acao nao pode ser desfeita.',
      deletedSummary: 'Credencial excluida',
      deletedDetail: 'A credencial foi excluida com sucesso.',
      deleteErrorSummary: 'Erro ao excluir credencial',
      deleteErrorDetail: 'Nao foi possivel excluir a credencial. Tente novamente em instantes.',
      accessErrorSummary: 'Erro ao carregar acessos',
      accessErrorDetail: 'Nao foi possivel carregar os acessos. Tente novamente em instantes.',
      accessUpdatedSummary: 'Acesso atualizado',
      accessUpdatedDetail: 'A configuracao de acesso foi atualizada.',
      accessUpdateErrorSummary: 'Erro ao atualizar acesso',
      accessUpdateErrorDetail: 'Nao foi possivel atualizar o acesso. Tente novamente em instantes.',
    },
  },
};

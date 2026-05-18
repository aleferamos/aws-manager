import { AppLanguage } from '../../../shared/config/languages.config';

export interface S3QueryTranslation {
  eyebrow: string;
  title: string;
  subtitle: string;
  reload: string;
  create: string;
  close: string;
  emptyCredential: {
    title: string;
    description: string;
  };
  stats: {
    total: string;
    selectedRegion: string;
  };
  table: {
    name: string;
    region: string;
    creationDate: string;
    actions: string;
    loading: string;
    emptyTitle: string;
    emptyDescription: string;
    empty: string;
    delete: string;
  };
  objects: {
    title: string;
    subtitle: string;
    prefix: string;
    prefixPlaceholder: string;
    parentFolder: string;
    currentFolder: string;
    rootFolder: string;
    reload: string;
    upload: string;
    objectKey: string;
    objectKeyPlaceholder: string;
    file: string;
    chooseFile: string;
    browseFile: string;
    fileHelper: string;
    selectedCount: string;
    selectAll: string;
    downloadSelected: string;
    download: string;
    rename: string;
    deleteSelected: string;
    key: string;
    size: string;
    storageClass: string;
    lastModified: string;
    loading: string;
    emptyTitle: string;
    emptyDescription: string;
    rowsPerPage: string;
    showing: string;
    firstPage: string;
    previousPage: string;
    nextPage: string;
    lastPage: string;
  };
  renameDialog: {
    title: string;
    subtitle: string;
    objectKey: string;
    placeholder: string;
    helper: string;
    confirm: string;
  };
  createDialog: {
    title: string;
    subtitle: string;
    bucketType: string;
    generalPurpose: string;
    generalPurposeDescription: string;
    directory: string;
    directoryDescription: string;
    availabilityZoneId: string;
    availabilityZonePlaceholder: string;
    availabilityZoneHelper: string;
    unsupportedRegion: string;
    acknowledgement: string;
    bucketName: string;
    baseBucketName: string;
    bucketPlaceholder: string;
    directoryBucketPlaceholder: string;
    helper: string;
    directoryHelper: string;
    cancel: string;
    confirm: string;
  };
  confirmEmpty: {
    title: string;
    message: string;
    confirm: string;
  };
  confirmDelete: {
    title: string;
    message: string;
    confirm: string;
  };
  toast: {
    listErrorSummary: string;
    listErrorDetail: string;
    createSuccessSummary: string;
    createSuccessDetail: string;
    createErrorSummary: string;
    createErrorDetail: string;
    emptySuccessSummary: string;
    emptySuccessDetail: string;
    emptyErrorSummary: string;
    emptyErrorDetail: string;
    deleteSuccessSummary: string;
    deleteSuccessDetail: string;
    deleteErrorSummary: string;
    deleteErrorDetail: string;
    objectListErrorSummary: string;
    objectListErrorDetail: string;
    objectUploadSuccessSummary: string;
    objectUploadSuccessDetail: string;
    objectUploadErrorSummary: string;
    objectUploadErrorDetail: string;
    objectDeleteSuccessSummary: string;
    objectDeleteSuccessDetail: string;
    objectDeleteErrorSummary: string;
    objectDeleteErrorDetail: string;
    objectDownloadSuccessSummary: string;
    objectDownloadSuccessDetail: string;
    objectDownloadErrorSummary: string;
    objectDownloadErrorDetail: string;
    objectRenameSuccessSummary: string;
    objectRenameSuccessDetail: string;
    objectRenameErrorSummary: string;
    objectRenameErrorDetail: string;
  };
}

export const s3QueryTranslations: Record<AppLanguage, S3QueryTranslation> = {
  'en-US': {
    eyebrow: 'Storage',
    title: 'S3',
    subtitle: 'List, create, empty and delete buckets for the selected credential.',
    reload: 'Reload buckets',
    create: 'Create bucket',
    close: 'Close',
    emptyCredential: {
      title: 'No credential selected',
      description: 'Select a credential in the header to manage S3 buckets.',
    },
    stats: {
      total: 'Buckets',
      selectedRegion: 'Selected region',
    },
    table: {
      name: 'Bucket',
      region: 'Region',
      creationDate: 'Created at',
      actions: 'Actions',
      loading: 'Loading S3 buckets...',
      emptyTitle: 'No S3 buckets found',
      emptyDescription: 'Create a bucket or select another credential.',
      empty: 'Empty bucket',
      delete: 'Delete bucket',
    },
    objects: {
      title: 'Bucket objects',
      subtitle: 'List, upload, replace and delete objects in this bucket.',
      prefix: 'Prefix',
      prefixPlaceholder: 'folder/subfolder/',
      parentFolder: 'Go to parent folder',
      currentFolder: 'Current folder',
      rootFolder: 'Bucket root',
      reload: 'Reload objects',
      upload: 'Upload / replace',
      objectKey: 'Object key',
      objectKeyPlaceholder: 'folder/file.txt',
      file: 'File',
      chooseFile: 'Choose file',
      browseFile: 'Browse',
      fileHelper: 'Select the file that will be uploaded to S3.',
      selectedCount: '{count} selected',
      selectAll: 'Select all',
      downloadSelected: 'Download selected',
      download: 'Download',
      rename: 'Rename',
      deleteSelected: 'Delete selected',
      key: 'Object key',
      size: 'Size',
      storageClass: 'Storage class',
      lastModified: 'Last modified',
      loading: 'Loading objects...',
      emptyTitle: 'No objects found',
      emptyDescription: 'Upload a file or change the prefix.',
      rowsPerPage: 'Rows per page',
      showing: 'Showing {first}-{last} of {total}',
      firstPage: 'First page',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      lastPage: 'Last page',
    },
    renameDialog: {
      title: 'Rename object',
      subtitle: 'Change the object key. For folders, the prefix will be renamed.',
      objectKey: 'New object key',
      placeholder: 'folder/new-file.txt',
      helper: 'Use the full path you want to keep in S3.',
      confirm: 'Rename',
    },
    createDialog: {
      title: 'Create bucket',
      subtitle: 'The bucket will be created in the selected region.',
      bucketType: 'Bucket type',
      generalPurpose: 'General purpose',
      generalPurposeDescription:
        'Recommended for most use cases and access patterns.',
      directory: 'Directory',
      directoryDescription:
        'Low-latency bucket using S3 Express One Zone in a single Availability Zone.',
      availabilityZoneId: 'Availability Zone ID',
      availabilityZonePlaceholder: 'Choose Zone',
      availabilityZoneHelper:
        'Choose a supported S3 Express One Zone Availability Zone ID for the selected region.',
      unsupportedRegion:
        'Directory buckets are not supported in the selected region.',
      acknowledgement:
        'I acknowledge that data is stored in a single Availability Zone.',
      bucketName: 'Bucket name',
      baseBucketName: 'Base bucket name',
      bucketPlaceholder: 'company-app-files',
      directoryBucketPlaceholder: 'company-app-files',
      helper: 'Use lowercase letters, numbers, dots or hyphens.',
      directoryHelper:
        'AWS will create the full name as base-name--zone-id--x-s3.',
      cancel: 'Cancel',
      confirm: 'Create',
    },
    confirmEmpty: {
      title: 'Empty bucket',
      message: 'This removes objects and versions from the selected bucket.',
      confirm: 'Empty',
    },
    confirmDelete: {
      title: 'Delete bucket',
      message: 'Only empty buckets can be deleted.',
      confirm: 'Delete',
    },
    toast: {
      listErrorSummary: 'Load S3 error',
      listErrorDetail: 'Unable to load S3 buckets. Try again in a moment.',
      createSuccessSummary: 'Bucket created',
      createSuccessDetail: 'The bucket was created successfully.',
      createErrorSummary: 'Create bucket error',
      createErrorDetail: 'Unable to create the bucket.',
      emptySuccessSummary: 'Bucket emptied',
      emptySuccessDetail: 'The bucket was emptied successfully.',
      emptyErrorSummary: 'Empty bucket error',
      emptyErrorDetail: 'Unable to empty the bucket.',
      deleteSuccessSummary: 'Bucket deleted',
      deleteSuccessDetail: 'The bucket was deleted successfully.',
      deleteErrorSummary: 'Delete bucket error',
      deleteErrorDetail: 'Unable to delete the bucket.',
      objectListErrorSummary: 'Load objects error',
      objectListErrorDetail: 'Unable to load bucket objects.',
      objectUploadSuccessSummary: 'Object uploaded',
      objectUploadSuccessDetail: 'The object was uploaded successfully.',
      objectUploadErrorSummary: 'Upload object error',
      objectUploadErrorDetail: 'Unable to upload the object.',
      objectDeleteSuccessSummary: 'Objects deleted',
      objectDeleteSuccessDetail: 'Selected objects were deleted successfully.',
      objectDeleteErrorSummary: 'Delete objects error',
      objectDeleteErrorDetail: 'Unable to delete selected objects.',
      objectDownloadSuccessSummary: 'Download started',
      objectDownloadSuccessDetail: 'The selected objects were prepared for download.',
      objectDownloadErrorSummary: 'Download objects error',
      objectDownloadErrorDetail: 'Unable to download selected objects.',
      objectRenameSuccessSummary: 'Object renamed',
      objectRenameSuccessDetail: 'The object was renamed successfully.',
      objectRenameErrorSummary: 'Rename object error',
      objectRenameErrorDetail: 'Unable to rename the selected object.',
    },
  },
  'pt-BR': {
    eyebrow: 'Storage',
    title: 'S3',
    subtitle: 'Liste, crie, esvazie e exclua buckets da credencial selecionada.',
    reload: 'Recarregar buckets',
    create: 'Criar bucket',
    close: 'Fechar',
    emptyCredential: {
      title: 'Nenhuma credencial selecionada',
      description: 'Selecione uma credencial no cabecalho para gerenciar buckets S3.',
    },
    stats: {
      total: 'Buckets',
      selectedRegion: 'Regiao selecionada',
    },
    table: {
      name: 'Bucket',
      region: 'Regiao',
      creationDate: 'Criado em',
      actions: 'Acoes',
      loading: 'Carregando buckets S3...',
      emptyTitle: 'Nenhum bucket S3 encontrado',
      emptyDescription: 'Crie um bucket ou selecione outra credencial.',
      empty: 'Esvaziar bucket',
      delete: 'Excluir bucket',
    },
    objects: {
      title: 'Objetos do bucket',
      subtitle: 'Liste, envie, substitua e exclua objetos deste bucket.',
      prefix: 'Prefixo',
      prefixPlaceholder: 'pasta/subpasta/',
      parentFolder: 'Voltar para a pasta anterior',
      currentFolder: 'Pasta atual',
      rootFolder: 'Raiz do bucket',
      reload: 'Recarregar objetos',
      upload: 'Enviar / substituir',
      objectKey: 'Chave do objeto',
      objectKeyPlaceholder: 'pasta/arquivo.txt',
      file: 'Arquivo',
      chooseFile: 'Escolher arquivo',
      browseFile: 'Procurar',
      fileHelper: 'Selecione o arquivo que sera enviado para o S3.',
      selectedCount: '{count} selecionados',
      selectAll: 'Selecionar todos',
      downloadSelected: 'Baixar selecionados',
      download: 'Baixar',
      rename: 'Renomear',
      deleteSelected: 'Excluir selecionados',
      key: 'Chave do objeto',
      size: 'Tamanho',
      storageClass: 'Storage class',
      lastModified: 'Alterado em',
      loading: 'Carregando objetos...',
      emptyTitle: 'Nenhum objeto encontrado',
      emptyDescription: 'Envie um arquivo ou altere o prefixo.',
      rowsPerPage: 'Linhas por pagina',
      showing: 'Mostrando {first}-{last} de {total}',
      firstPage: 'Primeira pagina',
      previousPage: 'Pagina anterior',
      nextPage: 'Proxima pagina',
      lastPage: 'Ultima pagina',
    },
    renameDialog: {
      title: 'Renomear objeto',
      subtitle: 'Altere a chave do objeto. Para pastas, o prefixo sera renomeado.',
      objectKey: 'Nova chave do objeto',
      placeholder: 'pasta/novo-arquivo.txt',
      helper: 'Use o caminho completo que deseja manter no S3.',
      confirm: 'Renomear',
    },
    createDialog: {
      title: 'Criar bucket',
      subtitle: 'O bucket sera criado na regiao selecionada.',
      bucketType: 'Tipo do bucket',
      generalPurpose: 'General purpose',
      generalPurposeDescription:
        'Recomendado para a maioria dos casos de uso e padroes de acesso.',
      directory: 'Directory',
      directoryDescription:
        'Bucket de baixa latencia usando S3 Express One Zone em uma unica Availability Zone.',
      availabilityZoneId: 'ID da Availability Zone',
      availabilityZonePlaceholder: 'Escolha a Zone',
      availabilityZoneHelper:
        'Escolha um ID de Availability Zone com suporte ao S3 Express One Zone na regiao selecionada.',
      unsupportedRegion:
        'Directory buckets nao estao disponiveis na regiao selecionada.',
      acknowledgement:
        'Confirmo que os dados ficam armazenados em uma unica Availability Zone.',
      bucketName: 'Nome do bucket',
      baseBucketName: 'Nome base do bucket',
      bucketPlaceholder: 'empresa-arquivos-app',
      directoryBucketPlaceholder: 'empresa-arquivos-app',
      helper: 'Use letras minusculas, numeros, pontos ou hifens.',
      directoryHelper:
        'A AWS criara o nome final como nome-base--zone-id--x-s3.',
      cancel: 'Cancelar',
      confirm: 'Criar',
    },
    confirmEmpty: {
      title: 'Esvaziar bucket',
      message: 'Isso remove objetos e versoes do bucket selecionado.',
      confirm: 'Esvaziar',
    },
    confirmDelete: {
      title: 'Excluir bucket',
      message: 'Somente buckets vazios podem ser excluidos.',
      confirm: 'Excluir',
    },
    toast: {
      listErrorSummary: 'Erro ao carregar S3',
      listErrorDetail: 'Nao foi possivel carregar os buckets S3. Tente novamente.',
      createSuccessSummary: 'Bucket criado',
      createSuccessDetail: 'O bucket foi criado com sucesso.',
      createErrorSummary: 'Erro ao criar bucket',
      createErrorDetail: 'Nao foi possivel criar o bucket.',
      emptySuccessSummary: 'Bucket esvaziado',
      emptySuccessDetail: 'O bucket foi esvaziado com sucesso.',
      emptyErrorSummary: 'Erro ao esvaziar bucket',
      emptyErrorDetail: 'Nao foi possivel esvaziar o bucket.',
      deleteSuccessSummary: 'Bucket excluido',
      deleteSuccessDetail: 'O bucket foi excluido com sucesso.',
      deleteErrorSummary: 'Erro ao excluir bucket',
      deleteErrorDetail: 'Nao foi possivel excluir o bucket.',
      objectListErrorSummary: 'Erro ao carregar objetos',
      objectListErrorDetail: 'Nao foi possivel carregar os objetos do bucket.',
      objectUploadSuccessSummary: 'Objeto enviado',
      objectUploadSuccessDetail: 'O objeto foi enviado com sucesso.',
      objectUploadErrorSummary: 'Erro ao enviar objeto',
      objectUploadErrorDetail: 'Nao foi possivel enviar o objeto.',
      objectDeleteSuccessSummary: 'Objetos excluidos',
      objectDeleteSuccessDetail: 'Os objetos selecionados foram excluidos com sucesso.',
      objectDeleteErrorSummary: 'Erro ao excluir objetos',
      objectDeleteErrorDetail: 'Nao foi possivel excluir os objetos selecionados.',
      objectDownloadSuccessSummary: 'Download iniciado',
      objectDownloadSuccessDetail: 'Os objetos selecionados foram preparados para download.',
      objectDownloadErrorSummary: 'Erro ao baixar objetos',
      objectDownloadErrorDetail: 'Nao foi possivel baixar os objetos selecionados.',
      objectRenameSuccessSummary: 'Objeto renomeado',
      objectRenameSuccessDetail: 'O objeto foi renomeado com sucesso.',
      objectRenameErrorSummary: 'Erro ao renomear objeto',
      objectRenameErrorDetail: 'Nao foi possivel renomear o objeto selecionado.',
    },
  },
};

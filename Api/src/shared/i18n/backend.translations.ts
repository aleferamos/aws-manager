export type AppLanguage = 'en-US' | 'pt-BR' | 'es-ES';

export const backendTranslations = {
  'en-US': {
    auth: {
      loginSuccess: 'Login successful.',
      logoutSuccess: 'Logout successful.',
      invalidCredentials: 'Invalid login or password.',
      unauthenticated: 'User is not authenticated.',
      invalidToken: 'Invalid or expired token.',
      rootRequired: 'Root access is required.',
      userDisabled: 'User is disabled.',
    },

    user: {
      adminPasswordRequired: 'Administrator password is required.',
      adminPasswordCreated: 'Administrator password was created successfully.',
      adminAlreadyHasPassword: 'Administrator already has a password.',
      passwordMismatch: 'Passwords do not match.',
      emailAlreadyExists: 'A user with this email already exists.',
      invalidPasswordRedefinitionCode:
        'The password definition code is invalid.',
      expiredPasswordRedefinitionCode:
        'The password definition code is expired.',
      notFound: 'User was not found.',
    },

    credential: {
      notFound: 'Credential was not found.',
      inUse: 'Credential is being used and cannot be deleted.',
    },

    authority: {
      notFound: 'Authority was not found.',
      codeAlreadyExists: 'An authority with this code already exists.',
      inUse: 'Authority is being used and cannot be deleted.',
    },

    access: {
      userCredentialNotFound: 'User credential link was not found.',
      systemAuthorityRequired:
        'Only system authorities can be linked directly to a user.',
      credentialAuthorityRequired:
        'Only credential authorities can be linked to a user credential.',
    },

    billing: {
      authorityNotConfigured: 'Billing authority is not configured.',
      authorityRequired: 'Billing authority is required.',
      awsConnectionFailed: 'Could not connect to AWS Cost Explorer.',
      awsRequestFailed: 'AWS billing request failed with status {status}.',
      credentialAccessRequired:
        'Access to this credential is required to view billing.',
      credentialInactive: 'Credential is inactive.',
      invalidTimePeriod: 'Billing time period is invalid.',
    },

    ec2: {
      notFound: 'EC2 instance was not found.',
      authorityNotConfigured: 'EC2 list authority is not configured.',
      authorityRequired: 'EC2 list authority is required.',
      awsConnectionFailed: 'Could not connect to AWS EC2.',
      awsRequestFailed: 'AWS EC2 request failed with status {status}.',
      credentialAccessRequired:
        'Access to this credential is required to list EC2 instances.',
      credentialInactive: 'Credential is inactive.',
    },

    securityGroup: {
      notFound: 'Security group was not found.',
      authorityNotConfigured:
        'Security group list authority is not configured.',
      authorityRequired: 'Security group list authority is required.',
      addRuleAuthorityNotConfigured:
        'Security group add rule authority is not configured.',
      addRuleAuthorityRequired:
        'Security group add rule authority is required.',
      deleteRuleAuthorityNotConfigured:
        'Security group delete rule authority is not configured.',
      deleteRuleAuthorityRequired:
        'Security group delete rule authority is required.',
      awsConnectionFailed: 'Could not connect to AWS EC2.',
      awsRequestFailed:
        'AWS security group request failed with status {status}.',
      credentialAccessRequired:
        'Access to this credential is required to list security groups.',
      credentialInactive: 'Credential is inactive.',
      invalidInboundRule: 'Inbound rule is invalid.',
    },

    s3: {
      listAuthorityNotConfigured: 'S3 list authority is not configured.',
      listAuthorityRequired: 'S3 list authority is required.',
      createBucketAuthorityNotConfigured:
        'S3 create bucket authority is not configured.',
      createBucketAuthorityRequired: 'S3 create bucket authority is required.',
      deleteBucketAuthorityNotConfigured:
        'S3 delete bucket authority is not configured.',
      deleteBucketAuthorityRequired: 'S3 delete bucket authority is required.',
      emptyBucketAuthorityNotConfigured:
        'S3 empty bucket authority is not configured.',
      emptyBucketAuthorityRequired: 'S3 empty bucket authority is required.',
      objectListAuthorityNotConfigured:
        'S3 object list authority is not configured.',
      objectListAuthorityRequired: 'S3 object list authority is required.',
      objectPutAuthorityNotConfigured:
        'S3 object upload authority is not configured.',
      objectPutAuthorityRequired: 'S3 object upload authority is required.',
      objectDeleteAuthorityNotConfigured:
        'S3 object delete authority is not configured.',
      objectDeleteAuthorityRequired: 'S3 object delete authority is required.',
      objectDownloadAuthorityNotConfigured:
        'S3 object download authority is not configured.',
      objectDownloadAuthorityRequired:
        'S3 object download authority is required.',
      objectRenameAuthorityNotConfigured:
        'S3 object rename authority is not configured.',
      objectRenameAuthorityRequired: 'S3 object rename authority is required.',
      awsConnectionFailed: 'Could not connect to AWS S3.',
      awsRequestFailed: 'AWS S3 request failed with status {status}.',
      credentialAccessRequired:
        'Access to this credential is required to use S3.',
      credentialInactive: 'Credential is inactive.',
      invalidBucketName: 'Bucket name is invalid.',
      invalidObjectKey: 'Object key is invalid.',
      objectFileRequired: 'Object file is required.',
      noObjectsToDownload: 'There are no files to download.',
      invalidAvailabilityZoneId: 'Availability Zone ID is invalid.',
      directoryBucketAcknowledgementRequired:
        'Directory bucket single Availability Zone acknowledgement is required.',
    },

    validation: {
      invalidPayload: 'Invalid request data.',
      required: 'The field {property} is required.',
      string: 'The field {property} must be a text.',
      number: 'The field {property} must be a number.',
      boolean: 'The field {property} must be true or false.',
      email: 'The field {property} must be a valid email.',
      minLength: 'The field {property} must have at least {min} characters.',
      maxLength: 'The field {property} must have at most {max} characters.',
      min: 'The field {property} must be greater than or equal to {min}.',
      max: 'The field {property} must be less than or equal to {max}.',
      dateString: 'The field {property} must be a valid date.',
      unknown: 'The field {property} is invalid.',
    },
  },

  'pt-BR': {
    auth: {
      loginSuccess: 'Login realizado com sucesso.',
      logoutSuccess: 'Logout realizado com sucesso.',
      invalidCredentials: 'Login ou senha inválidos.',
      unauthenticated: 'Usuário não autenticado.',
      invalidToken: 'Token inválido ou expirado.',
      rootRequired: 'Acesso root é obrigatório.',
      userDisabled: 'Usuário desativado.',
    },

    user: {
      adminPasswordRequired: 'A senha do administrador é obrigatória.',
      adminPasswordCreated: 'A senha do administrador foi criada com sucesso.',
      adminAlreadyHasPassword: 'O administrador já possui senha.',
      passwordMismatch: 'As senhas não coincidem.',
      emailAlreadyExists: 'Já existe um usuário cadastrado com este e-mail.',
      invalidPasswordRedefinitionCode:
        'O código de definição de senha é inválido.',
      expiredPasswordRedefinitionCode:
        'O código de definição de senha está expirado.',
      notFound: 'Usuário não encontrado.',
    },

    credential: {
      notFound: 'Credencial não encontrada.',
      inUse: 'A credencial está em uso e não pode ser excluída.',
    },

    authority: {
      notFound: 'Permissão não encontrada.',
      codeAlreadyExists: 'Já existe uma permissão cadastrada com este código.',
      inUse: 'A permissão está em uso e não pode ser excluída.',
    },

    access: {
      userCredentialNotFound:
        'Vínculo entre usuário e credencial não encontrado.',
      systemAuthorityRequired:
        'Somente permissões de sistema podem ser vinculadas diretamente ao usuário.',
      credentialAuthorityRequired:
        'Somente permissões de credencial podem ser vinculadas a uma credencial do usuário.',
    },

    billing: {
      authorityNotConfigured: 'A permissão de fatura não está configurada.',
      authorityRequired: 'A permissão de fatura é obrigatória.',
      awsConnectionFailed: 'Não foi possível conectar ao AWS Cost Explorer.',
      awsRequestFailed:
        'A requisição de fatura da AWS falhou com status {status}.',
      credentialAccessRequired:
        'É necessário ter acesso a esta credencial para visualizar fatura.',
      credentialInactive: 'A credencial está inativa.',
      invalidTimePeriod: 'O período de fatura é inválido.',
    },

    ec2: {
      notFound: 'Instancia EC2 nao encontrada.',
      authorityNotConfigured:
        'A permissão de listagem de EC2 não está configurada.',
      authorityRequired: 'A permissão de listagem de EC2 é obrigatória.',
      awsConnectionFailed: 'Não foi possível conectar ao AWS EC2.',
      awsRequestFailed: 'A requisição da AWS EC2 falhou com status {status}.',
      credentialAccessRequired:
        'É necessário ter acesso a esta credencial para listar instâncias EC2.',
      credentialInactive: 'A credencial está inativa.',
    },

    securityGroup: {
      notFound: 'Security group nao encontrado.',
      authorityNotConfigured:
        'A permissão de listagem de security groups não está configurada.',
      authorityRequired:
        'A permissão de listagem de security groups é obrigatória.',
      addRuleAuthorityNotConfigured:
        'A permissao de adicionar regras de security group nao esta configurada.',
      addRuleAuthorityRequired:
        'A permissao de adicionar regras de security group e obrigatoria.',
      deleteRuleAuthorityNotConfigured:
        'A permissao de excluir regras de security group nao esta configurada.',
      deleteRuleAuthorityRequired:
        'A permissao de excluir regras de security group e obrigatoria.',
      awsConnectionFailed: 'Não foi possível conectar ao AWS EC2.',
      awsRequestFailed:
        'A requisição de security groups da AWS falhou com status {status}.',
      credentialAccessRequired:
        'É necessário ter acesso a esta credencial para listar security groups.',
      credentialInactive: 'A credencial está inativa.',
      invalidInboundRule: 'A regra inbound e invalida.',
    },

    s3: {
      listAuthorityNotConfigured:
        'A permissao de listagem de S3 nao esta configurada.',
      listAuthorityRequired: 'A permissao de listagem de S3 e obrigatoria.',
      createBucketAuthorityNotConfigured:
        'A permissao de criar bucket S3 nao esta configurada.',
      createBucketAuthorityRequired:
        'A permissao de criar bucket S3 e obrigatoria.',
      deleteBucketAuthorityNotConfigured:
        'A permissao de excluir bucket S3 nao esta configurada.',
      deleteBucketAuthorityRequired:
        'A permissao de excluir bucket S3 e obrigatoria.',
      emptyBucketAuthorityNotConfigured:
        'A permissao de esvaziar bucket S3 nao esta configurada.',
      emptyBucketAuthorityRequired:
        'A permissao de esvaziar bucket S3 e obrigatoria.',
      objectListAuthorityNotConfigured:
        'A permissao de listar objetos S3 nao esta configurada.',
      objectListAuthorityRequired:
        'A permissao de listar objetos S3 e obrigatoria.',
      objectPutAuthorityNotConfigured:
        'A permissao de enviar objetos S3 nao esta configurada.',
      objectPutAuthorityRequired:
        'A permissao de enviar objetos S3 e obrigatoria.',
      objectDeleteAuthorityNotConfigured:
        'A permissao de excluir objetos S3 nao esta configurada.',
      objectDeleteAuthorityRequired:
        'A permissao de excluir objetos S3 e obrigatoria.',
      objectDownloadAuthorityNotConfigured:
        'A permissao de baixar objetos S3 nao esta configurada.',
      objectDownloadAuthorityRequired:
        'A permissao de baixar objetos S3 e obrigatoria.',
      objectRenameAuthorityNotConfigured:
        'A permissao de renomear objetos S3 nao esta configurada.',
      objectRenameAuthorityRequired:
        'A permissao de renomear objetos S3 e obrigatoria.',
      awsConnectionFailed: 'Nao foi possivel conectar ao AWS S3.',
      awsRequestFailed: 'A requisicao da AWS S3 falhou com status {status}.',
      credentialAccessRequired:
        'E necessario ter acesso a esta credencial para usar S3.',
      credentialInactive: 'A credencial esta inativa.',
      invalidBucketName: 'O nome do bucket e invalido.',
      invalidObjectKey: 'A chave do objeto e invalida.',
      objectFileRequired: 'O arquivo do objeto e obrigatorio.',
      noObjectsToDownload: 'Nao ha arquivos para baixar.',
      invalidAvailabilityZoneId: 'O ID da Availability Zone e invalido.',
      directoryBucketAcknowledgementRequired:
        'E necessario confirmar que o directory bucket usa uma unica Availability Zone.',
    },

    validation: {
      invalidPayload: 'Dados da requisição inválidos.',
      required: 'O campo {property} é obrigatório.',
      string: 'O campo {property} deve ser um texto.',
      number: 'O campo {property} deve ser um número.',
      boolean: 'O campo {property} deve ser verdadeiro ou falso.',
      email: 'O campo {property} deve ser um e-mail válido.',
      minLength: 'O campo {property} deve ter no mínimo {min} caracteres.',
      maxLength: 'O campo {property} deve ter no máximo {max} caracteres.',
      min: 'O campo {property} deve ser maior ou igual a {min}.',
      max: 'O campo {property} deve ser menor ou igual a {max}.',
      dateString: 'O campo {property} deve ser uma data válida.',
      unknown: 'O campo {property} é inválido.',
    },
  },

  'es-ES': {
    auth: {
      loginSuccess: 'Inicio de sesión exitoso.',
      logoutSuccess: 'Sesión cerrada correctamente.',
      invalidCredentials: 'Usuario o contraseña inválidos.',
      unauthenticated: 'Usuario no autenticado.',
      invalidToken: 'Token inválido o expirado.',
      rootRequired: 'Se requiere acceso root.',
      userDisabled: 'Usuario desactivado.',
    },

    user: {
      adminPasswordRequired: 'La contraseña del administrador es obligatoria.',
      adminPasswordCreated:
        'La contraseña del administrador fue creada correctamente.',
      adminAlreadyHasPassword: 'El administrador ya tiene una contraseña.',
      passwordMismatch: 'Las contraseñas no coinciden.',
      emailAlreadyExists:
        'Ya existe un usuario registrado con este correo electrónico.',
      invalidPasswordRedefinitionCode:
        'El código de definición de contraseña no es válido.',
      expiredPasswordRedefinitionCode:
        'El código de definición de contraseña está vencido.',
      notFound: 'Usuario no encontrado.',
    },

    credential: {
      notFound: 'Credencial no encontrada.',
      inUse: 'La credencial está en uso y no se puede eliminar.',
    },

    authority: {
      notFound: 'Permiso no encontrado.',
      codeAlreadyExists: 'Ya existe un permiso registrado con este código.',
      inUse: 'El permiso está en uso y no se puede eliminar.',
    },

    access: {
      userCredentialNotFound:
        'Vínculo entre usuario y credencial no encontrado.',
      systemAuthorityRequired:
        'Solo los permisos de sistema pueden vincularse directamente al usuario.',
      credentialAuthorityRequired:
        'Solo los permisos de credencial pueden vincularse a una credencial del usuario.',
    },

    billing: {
      authorityNotConfigured: 'El permiso de facturación no está configurado.',
      authorityRequired: 'Se requiere permiso de facturación.',
      awsConnectionFailed: 'No fue posible conectar con AWS Cost Explorer.',
      awsRequestFailed:
        'La solicitud de facturación de AWS falló con estado {status}.',
      credentialAccessRequired:
        'Se requiere acceso a esta credencial para ver facturación.',
      credentialInactive: 'La credencial está inactiva.',
      invalidTimePeriod: 'El período de facturación no es válido.',
    },

    ec2: {
      notFound: 'Instancia EC2 no encontrada.',
      authorityNotConfigured:
        'El permiso de listado de EC2 no está configurado.',
      authorityRequired: 'Se requiere permiso de listado de EC2.',
      awsConnectionFailed: 'No fue posible conectar con AWS EC2.',
      awsRequestFailed: 'La solicitud de AWS EC2 falló con estado {status}.',
      credentialAccessRequired:
        'Se requiere acceso a esta credencial para listar instancias EC2.',
      credentialInactive: 'La credencial está inactiva.',
    },

    securityGroup: {
      notFound: 'Security group no encontrado.',
      authorityNotConfigured:
        'El permiso de listado de security groups no está configurado.',
      authorityRequired: 'Se requiere permiso de listado de security groups.',
      addRuleAuthorityNotConfigured:
        'El permiso para agregar reglas de security group no esta configurado.',
      addRuleAuthorityRequired:
        'Se requiere permiso para agregar reglas de security group.',
      deleteRuleAuthorityNotConfigured:
        'El permiso para eliminar reglas de security group no esta configurado.',
      deleteRuleAuthorityRequired:
        'Se requiere permiso para eliminar reglas de security group.',
      awsConnectionFailed: 'No fue posible conectar con AWS EC2.',
      awsRequestFailed:
        'La solicitud de security groups de AWS falló con estado {status}.',
      credentialAccessRequired:
        'Se requiere acceso a esta credencial para listar security groups.',
      credentialInactive: 'La credencial está inactiva.',
      invalidInboundRule: 'La regla inbound no es valida.',
    },

    s3: {
      listAuthorityNotConfigured:
        'El permiso de listado de S3 no esta configurado.',
      listAuthorityRequired: 'Se requiere permiso de listado de S3.',
      createBucketAuthorityNotConfigured:
        'El permiso para crear bucket S3 no esta configurado.',
      createBucketAuthorityRequired: 'Se requiere permiso para crear bucket S3.',
      deleteBucketAuthorityNotConfigured:
        'El permiso para eliminar bucket S3 no esta configurado.',
      deleteBucketAuthorityRequired:
        'Se requiere permiso para eliminar bucket S3.',
      emptyBucketAuthorityNotConfigured:
        'El permiso para vaciar bucket S3 no esta configurado.',
      emptyBucketAuthorityRequired: 'Se requiere permiso para vaciar bucket S3.',
      objectListAuthorityNotConfigured:
        'El permiso para listar objetos S3 no esta configurado.',
      objectListAuthorityRequired: 'Se requiere permiso para listar objetos S3.',
      objectPutAuthorityNotConfigured:
        'El permiso para enviar objetos S3 no esta configurado.',
      objectPutAuthorityRequired: 'Se requiere permiso para enviar objetos S3.',
      objectDeleteAuthorityNotConfigured:
        'El permiso para eliminar objetos S3 no esta configurado.',
      objectDeleteAuthorityRequired:
        'Se requiere permiso para eliminar objetos S3.',
      objectDownloadAuthorityNotConfigured:
        'El permiso para descargar objetos S3 no esta configurado.',
      objectDownloadAuthorityRequired:
        'Se requiere permiso para descargar objetos S3.',
      objectRenameAuthorityNotConfigured:
        'El permiso para renombrar objetos S3 no esta configurado.',
      objectRenameAuthorityRequired:
        'Se requiere permiso para renombrar objetos S3.',
      awsConnectionFailed: 'No fue posible conectar con AWS S3.',
      awsRequestFailed: 'La solicitud de AWS S3 fallo con estado {status}.',
      credentialAccessRequired:
        'Se requiere acceso a esta credencial para usar S3.',
      credentialInactive: 'La credencial esta inactiva.',
      invalidBucketName: 'El nombre del bucket no es valido.',
      invalidObjectKey: 'La clave del objeto no es valida.',
      objectFileRequired: 'El archivo del objeto es obligatorio.',
      noObjectsToDownload: 'No hay archivos para descargar.',
      invalidAvailabilityZoneId: 'El ID de la Availability Zone no es valido.',
      directoryBucketAcknowledgementRequired:
        'Es necesario confirmar que el directory bucket usa una unica Availability Zone.',
    },

    validation: {
      invalidPayload: 'Datos de la solicitud inválidos.',
      required: 'El campo {property} es obligatorio.',
      string: 'El campo {property} debe ser un texto.',
      number: 'El campo {property} debe ser un número.',
      boolean: 'El campo {property} debe ser verdadero o falso.',
      email: 'El campo {property} debe ser un correo electrónico válido.',
      minLength: 'El campo {property} debe tener al menos {min} caracteres.',
      maxLength: 'El campo {property} debe tener como máximo {max} caracteres.',
      min: 'El campo {property} debe ser mayor o igual a {min}.',
      max: 'El campo {property} debe ser menor o igual a {max}.',
      dateString: 'El campo {property} debe ser una fecha válida.',
      unknown: 'El campo {property} es inválido.',
    },
  },
} as const;

export type TranslationKey =
  | 'auth.loginSuccess'
  | 'auth.logoutSuccess'
  | 'auth.invalidCredentials'
  | 'auth.unauthenticated'
  | 'auth.invalidToken'
  | 'auth.rootRequired'
  | 'auth.userDisabled'
  | 'user.adminPasswordRequired'
  | 'user.adminPasswordCreated'
  | 'user.adminAlreadyHasPassword'
  | 'user.passwordMismatch'
  | 'user.emailAlreadyExists'
  | 'user.invalidPasswordRedefinitionCode'
  | 'user.expiredPasswordRedefinitionCode'
  | 'user.notFound'
  | 'credential.notFound'
  | 'credential.inUse'
  | 'authority.notFound'
  | 'authority.codeAlreadyExists'
  | 'authority.inUse'
  | 'access.userCredentialNotFound'
  | 'access.systemAuthorityRequired'
  | 'access.credentialAuthorityRequired'
  | 'billing.authorityNotConfigured'
  | 'billing.authorityRequired'
  | 'billing.awsConnectionFailed'
  | 'billing.awsRequestFailed'
  | 'billing.credentialAccessRequired'
  | 'billing.credentialInactive'
  | 'billing.invalidTimePeriod'
  | 'ec2.authorityNotConfigured'
  | 'ec2.authorityRequired'
  | 'ec2.awsConnectionFailed'
  | 'ec2.awsRequestFailed'
  | 'ec2.credentialAccessRequired'
  | 'ec2.credentialInactive'
  | 'ec2.notFound'
  | 'securityGroup.notFound'
  | 'securityGroup.authorityNotConfigured'
  | 'securityGroup.authorityRequired'
  | 'securityGroup.addRuleAuthorityNotConfigured'
  | 'securityGroup.addRuleAuthorityRequired'
  | 'securityGroup.deleteRuleAuthorityNotConfigured'
  | 'securityGroup.deleteRuleAuthorityRequired'
  | 'securityGroup.awsConnectionFailed'
  | 'securityGroup.awsRequestFailed'
  | 'securityGroup.credentialAccessRequired'
  | 'securityGroup.credentialInactive'
  | 'securityGroup.invalidInboundRule'
  | 's3.listAuthorityNotConfigured'
  | 's3.listAuthorityRequired'
  | 's3.createBucketAuthorityNotConfigured'
  | 's3.createBucketAuthorityRequired'
  | 's3.deleteBucketAuthorityNotConfigured'
  | 's3.deleteBucketAuthorityRequired'
  | 's3.emptyBucketAuthorityNotConfigured'
  | 's3.emptyBucketAuthorityRequired'
  | 's3.objectListAuthorityNotConfigured'
  | 's3.objectListAuthorityRequired'
  | 's3.objectPutAuthorityNotConfigured'
  | 's3.objectPutAuthorityRequired'
  | 's3.objectDeleteAuthorityNotConfigured'
  | 's3.objectDeleteAuthorityRequired'
  | 's3.objectDownloadAuthorityNotConfigured'
  | 's3.objectDownloadAuthorityRequired'
  | 's3.objectRenameAuthorityNotConfigured'
  | 's3.objectRenameAuthorityRequired'
  | 's3.awsConnectionFailed'
  | 's3.awsRequestFailed'
  | 's3.credentialAccessRequired'
  | 's3.credentialInactive'
  | 's3.invalidBucketName'
  | 's3.invalidObjectKey'
  | 's3.objectFileRequired'
  | 's3.noObjectsToDownload'
  | 's3.invalidAvailabilityZoneId'
  | 's3.directoryBucketAcknowledgementRequired'
  | 'validation.invalidPayload'
  | 'validation.required'
  | 'validation.string'
  | 'validation.number'
  | 'validation.boolean'
  | 'validation.email'
  | 'validation.minLength'
  | 'validation.maxLength'
  | 'validation.min'
  | 'validation.max'
  | 'validation.dateString'
  | 'validation.unknown';

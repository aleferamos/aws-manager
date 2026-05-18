import { AppLanguage } from '../../../shared/config/languages.config';

export interface Ec2QueryTranslation {
  title: string;
  subtitle: string;
  eyebrow: string;
  reload: string;
  close: string;

  stats: {
    total: string;
    running: string;
  };

  table: {
    name: string;
    instanceId: string;
    state: string;
    type: string;
    statusCheck: string;
    availabilityZone: string;
    publicIpv4: string;
    elasticIp: string;
    platform: string;
    loading: string;
    emptyTitle: string;
    emptyDescription: string;
  };

  detail: {
    titleFallback: string;
    subtitle: string;
    name: string;
    instanceId: string;
    imageId: string;
    imageName: string;
    state: string;
    instanceType: string;
    publicIpv4: string;
    privateIpv4: string;
    ipv6: string;
    publicDns: string;
    privateDns: string;
    vpcId: string;
    subnetId: string;
    instanceArn: string;
    launchTime: string;
    ownerId: string;
    keyName: string;
    iamRole: string;
    imdsv2: string;
    managed: string;
    credential: string;
    region: string;
    yes: string;
    no: string;
  };

  connect: {
    title: string;
    subtitle: string;
    instanceId: string;
    vpcId: string;
    securityGroups: string;
    iamRole: string;
    keyPair: string;
    publicDns: string;
    username: string;
    sshPort: string;
    sshPortOpen: string;
    sshPortClosed: string;
    sshPortUnknown: string;
    warning: string;
    permissionCommand: string;
    sshCommand: string;
    unavailable: string;
  };

  elasticIps: {
    title: string;
    publicIp: string;
    name: string;
    allocationId: string;
    associationId: string;
    loading: string;
    emptyTitle: string;
    emptyDescription: string;
  };

  securityGroups: {
    title: string;
    groupId: string;
    groupName: string;
    loading: string;
    emptyTitle: string;
    emptyDescription: string;
  };

  emptyCredential: {
    title: string;
    description: string;
  };

  toast: {
    listErrorSummary: string;
    listErrorDetail: string;
    viewErrorSummary: string;
    viewErrorDetail: string;
  };
}

export const ec2QueryTranslations: Record<AppLanguage, Ec2QueryTranslation> = {
  'en-US': {
    title: 'EC2',
    subtitle: 'View EC2 instances for the selected credential and region.',
    eyebrow: 'AWS Compute',
    reload: 'Reload EC2 instances',
    close: 'Close',

    stats: {
      total: 'Total instances',
      running: 'Running instances',
    },

    table: {
      name: 'Name',
      instanceId: 'Instance ID',
      state: 'State',
      type: 'Type',
      statusCheck: 'Status check',
      availabilityZone: 'AZ',
      publicIpv4: 'Public IPv4',
      elasticIp: 'Elastic IP',
      platform: 'Platform',
      loading: 'Loading EC2 instances...',
      emptyTitle: 'No EC2 instances found',
      emptyDescription: 'No instances were returned for the selected credential and region.',
    },

    detail: {
      titleFallback: 'EC2 instance',
      subtitle: 'Instance networking, security and metadata.',
      name: 'Name',
      instanceId: 'Instance ID',
      imageId: 'AMI ID',
      imageName: 'AMI name',
      state: 'State',
      instanceType: 'Instance type',
      publicIpv4: 'Public IPv4',
      privateIpv4: 'Private IPv4',
      ipv6: 'IPv6',
      publicDns: 'Public DNS',
      privateDns: 'Private DNS',
      vpcId: 'VPC ID',
      subnetId: 'Subnet ID',
      instanceArn: 'Instance ARN',
      launchTime: 'Launch time',
      ownerId: 'Owner',
      keyName: 'Key pair',
      iamRole: 'IAM role',
      imdsv2: 'IMDSv2',
      managed: 'Managed',
      credential: 'Credential',
      region: 'Region',
      yes: 'Yes',
      no: 'No',
    },

    connect: {
      title: 'Connect',
      subtitle: 'SSH connection data for this instance.',
      instanceId: 'Instance ID',
      vpcId: 'VPC ID',
      securityGroups: 'Security groups',
      iamRole: 'IAM role',
      keyPair: 'Key pair',
      publicDns: 'Public DNS',
      username: 'Username',
      sshPort: 'SSH port',
      sshPortOpen: 'Port 22 open',
      sshPortClosed: 'Port 22 not open',
      sshPortUnknown: 'Not checked',
      warning: 'Port 22 was not found in the associated security groups. You may need to allow SSH before connecting.',
      permissionCommand: 'Key permission command',
      sshCommand: 'SSH command',
      unavailable: 'Connection command unavailable. Check if the instance has public DNS or public IPv4 and a key pair.',
    },

    elasticIps: {
      title: 'Elastic IP addresses',
      publicIp: 'Public IP',
      name: 'Name',
      allocationId: 'Allocation ID',
      associationId: 'Association ID',
      loading: 'Loading elastic IPs...',
      emptyTitle: 'No elastic IPs',
      emptyDescription: 'No elastic IP address is associated with this instance.',
    },

    securityGroups: {
      title: 'Security groups',
      groupId: 'Group ID',
      groupName: 'Group name',
      loading: 'Loading security groups...',
      emptyTitle: 'No security groups',
      emptyDescription: 'No security groups were returned for this instance.',
    },

    emptyCredential: {
      title: 'No credential selected',
      description: 'Select a credential in the header to list EC2 instances.',
    },

    toast: {
      listErrorSummary: 'Load EC2 error',
      listErrorDetail: 'Unable to load EC2 instances. Try again in a moment.',
      viewErrorSummary: 'Load instance error',
      viewErrorDetail: 'Unable to load EC2 instance details. Try again in a moment.',
    },
  },

  'pt-BR': {
    title: 'EC2',
    subtitle: 'Visualize instancias EC2 da credencial e regiao selecionadas.',
    eyebrow: 'AWS Compute',
    reload: 'Recarregar instancias EC2',
    close: 'Fechar',

    stats: {
      total: 'Total de instancias',
      running: 'Instancias running',
    },

    table: {
      name: 'Nome',
      instanceId: 'Instance ID',
      state: 'Estado',
      type: 'Tipo',
      statusCheck: 'Status check',
      availabilityZone: 'AZ',
      publicIpv4: 'IPv4 publico',
      elasticIp: 'Elastic IP',
      platform: 'Plataforma',
      loading: 'Carregando instancias EC2...',
      emptyTitle: 'Nenhuma instancia EC2 encontrada',
      emptyDescription: 'Nenhuma instancia foi retornada para a credencial e regiao selecionadas.',
    },

    detail: {
      titleFallback: 'Instancia EC2',
      subtitle: 'Rede, seguranca e metadados da instancia.',
      name: 'Nome',
      instanceId: 'Instance ID',
      imageId: 'AMI ID',
      imageName: 'Nome da AMI',
      state: 'Estado',
      instanceType: 'Tipo',
      publicIpv4: 'IPv4 publico',
      privateIpv4: 'IPv4 privado',
      ipv6: 'IPv6',
      publicDns: 'DNS publico',
      privateDns: 'DNS privado',
      vpcId: 'VPC ID',
      subnetId: 'Subnet ID',
      instanceArn: 'Instance ARN',
      launchTime: 'Launch time',
      ownerId: 'Owner',
      keyName: 'Par de chaves',
      iamRole: 'IAM role',
      imdsv2: 'IMDSv2',
      managed: 'Managed',
      credential: 'Credencial',
      region: 'Regiao',
      yes: 'Sim',
      no: 'Nao',
    },

    connect: {
      title: 'Conectar',
      subtitle: 'Dados de conexao SSH desta instancia.',
      instanceId: 'Instance ID',
      vpcId: 'VPC ID',
      securityGroups: 'Security groups',
      iamRole: 'IAM role',
      keyPair: 'Par de chaves',
      publicDns: 'DNS publico',
      username: 'Usuario',
      sshPort: 'Porta SSH',
      sshPortOpen: 'Porta 22 aberta',
      sshPortClosed: 'Porta 22 nao aberta',
      sshPortUnknown: 'Nao verificado',
      warning: 'A porta 22 nao foi encontrada nos security groups associados. Talvez seja necessario liberar SSH antes de conectar.',
      permissionCommand: 'Comando de permissao da chave',
      sshCommand: 'Comando SSH',
      unavailable: 'Comando de conexao indisponivel. Verifique se a instancia possui DNS publico ou IPv4 publico e um par de chaves.',
    },

    elasticIps: {
      title: 'Elastic IPs',
      publicIp: 'Public IP',
      name: 'Nome',
      allocationId: 'Allocation ID',
      associationId: 'Association ID',
      loading: 'Carregando elastic IPs...',
      emptyTitle: 'Nenhum elastic IP',
      emptyDescription: 'Nenhum elastic IP esta associado a esta instancia.',
    },

    securityGroups: {
      title: 'Security groups',
      groupId: 'Group ID',
      groupName: 'Group name',
      loading: 'Carregando security groups...',
      emptyTitle: 'Nenhum security group',
      emptyDescription: 'Nenhum security group foi retornado para esta instancia.',
    },

    emptyCredential: {
      title: 'Nenhuma credencial selecionada',
      description: 'Selecione uma credencial no cabecalho para listar instancias EC2.',
    },

    toast: {
      listErrorSummary: 'Erro ao carregar EC2',
      listErrorDetail: 'Nao foi possivel carregar as instancias EC2. Tente novamente em instantes.',
      viewErrorSummary: 'Erro ao carregar instancia',
      viewErrorDetail: 'Nao foi possivel carregar os detalhes da instancia EC2. Tente novamente em instantes.',
    },
  },
};

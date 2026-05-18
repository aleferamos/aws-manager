import { AppLanguage } from '../../../shared/config/languages.config';

export interface SecurityGroupsQueryTranslation {
  title: string;
  subtitle: string;
  eyebrow: string;
  reload: string;
  close: string;

  actions: {
    view: string;
    delete: string;
  };

  stats: {
    total: string;
    inboundRules: string;
    outboundRules: string;
  };

  table: {
    name: string;
    groupId: string;
    groupName: string;
    description: string;
    vpcId: string;
    ownerId: string;
    inboundRuleCount: string;
    outboundRuleCount: string;
    loading: string;
    emptyTitle: string;
    emptyDescription: string;
  };

  detail: {
    titleFallback: string;
    subtitle: string;
    groupName: string;
    groupId: string;
    description: string;
    vpcId: string;
    ownerId: string;
    credential: string;
    region: string;
  };

  tabs: {
    inbound: string;
    outbound: string;
    tags: string;
  };

  rulesTable: {
    name: string;
    ruleId: string;
    ipVersion: string;
    type: string;
    protocol: string;
    portRange: string;
    source: string;
    destination: string;
    description: string;
    inboundTitle: string;
    outboundTitle: string;
    loading: string;
    emptyInboundTitle: string;
    emptyOutboundTitle: string;
    emptyRulesDescription: string;
  };

  ruleForm: {
    title: string;
    typeLabel: string;
    typePlaceholder: string;
    protocolLabel: string;
    protocolPlaceholder: string;
    fromPortLabel: string;
    toPortLabel: string;
    sourceLabel: string;
    sourceTypeLabel: string;
    sourceTypePlaceholder: string;
    sourcePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    add: string;
    invalidPorts: string;
  };

  deleteRuleDialog: {
    title: string;
    message: string;
    cancel: string;
    confirm: string;
  };

  tagsTable: {
    key: string;
    value: string;
    title: string;
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
    ruleCreatedSummary: string;
    ruleCreatedDetail: string;
    ruleCreateErrorSummary: string;
    ruleCreateErrorDetail: string;
    ruleDeletedSummary: string;
    ruleDeletedDetail: string;
    ruleDeleteErrorSummary: string;
    ruleDeleteErrorDetail: string;
    sourceIpErrorSummary: string;
    sourceIpErrorDetail: string;
  };
}

export const securityGroupsQueryTranslations: Record<AppLanguage, SecurityGroupsQueryTranslation> = {
  'en-US': {
    title: 'Security Groups',
    subtitle: 'View security groups for the selected credential and region.',
    eyebrow: 'AWS Network',
    reload: 'Reload security groups',
    close: 'Close',

    actions: {
      view: 'View',
      delete: 'Delete',
    },

    stats: {
      total: 'Total security groups',
      inboundRules: 'Inbound rules',
      outboundRules: 'Outbound rules',
    },

    table: {
      name: 'Name',
      groupId: 'Group ID',
      groupName: 'Group name',
      description: 'Description',
      vpcId: 'VPC ID',
      ownerId: 'Owner ID',
      inboundRuleCount: 'Inbound rules',
      outboundRuleCount: 'Outbound rules',
      loading: 'Loading security groups...',
      emptyTitle: 'No security groups found',
      emptyDescription: 'No security groups were returned for the selected credential and region.',
    },

    detail: {
      titleFallback: 'Security group',
      subtitle: 'Security group rules, tags and core metadata.',
      groupName: 'Security group name',
      groupId: 'Security group ID',
      description: 'Description',
      vpcId: 'VPC ID',
      ownerId: 'Owner',
      credential: 'Credential',
      region: 'Region',
    },

    tabs: {
      inbound: 'Inbound rules',
      outbound: 'Outbound rules',
      tags: 'Tags',
    },

    rulesTable: {
      name: 'Name',
      ruleId: 'Security group rule ID',
      ipVersion: 'IP version',
      type: 'Type',
      protocol: 'Protocol',
      portRange: 'Port range',
      source: 'Source',
      destination: 'Destination',
      description: 'Description',
      inboundTitle: 'Inbound rules',
      outboundTitle: 'Outbound rules',
      loading: 'Loading rules...',
      emptyInboundTitle: 'No inbound rules',
      emptyOutboundTitle: 'No outbound rules',
      emptyRulesDescription: 'No rules were returned for this security group.',
    },

    tagsTable: {
      key: 'Key',
      value: 'Value',
      title: 'Tags',
      loading: 'Loading tags...',
      emptyTitle: 'No tags',
      emptyDescription: 'No tags were returned for this security group.',
    },

    ruleForm: {
      title: 'Add inbound rule',
      typeLabel: 'Type',
      typePlaceholder: 'Select type',
      protocolLabel: 'Protocol',
      protocolPlaceholder: 'tcp',
      fromPortLabel: 'From port',
      toPortLabel: 'To port',
      sourceLabel: 'Source',
      sourceTypeLabel: 'Source type',
      sourceTypePlaceholder: 'Select source',
      sourcePlaceholder: '0.0.0.0/0',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Optional description',
      add: 'Add rule',
      invalidPorts: 'Fill valid from/to ports for this rule type.',
    },

    deleteRuleDialog: {
      title: 'Delete inbound rule',
      message: 'Delete this inbound rule? This action cannot be undone.',
      cancel: 'Cancel',
      confirm: 'Delete',
    },

    emptyCredential: {
      title: 'No credential selected',
      description: 'Select a credential in the header to list security groups.',
    },

    toast: {
      listErrorSummary: 'Load security groups error',
      listErrorDetail: 'Unable to load security groups. Try again in a moment.',
      ruleCreatedSummary: 'Rule added',
      ruleCreatedDetail: 'Inbound rule was added successfully.',
      ruleCreateErrorSummary: 'Add rule error',
      ruleCreateErrorDetail: 'Unable to add inbound rule. Try again in a moment.',
      ruleDeletedSummary: 'Rule deleted',
      ruleDeletedDetail: 'Inbound rule was deleted successfully.',
      ruleDeleteErrorSummary: 'Delete rule error',
      ruleDeleteErrorDetail: 'Unable to delete inbound rule. Try again in a moment.',
      sourceIpErrorSummary: 'IP lookup error',
      sourceIpErrorDetail: 'Unable to detect your public IP. Fill the source manually.',
    },
  },

  'pt-BR': {
    title: 'Security Groups',
    subtitle: 'Visualize security groups da credencial e regiao selecionadas.',
    eyebrow: 'AWS Network',
    reload: 'Recarregar security groups',
    close: 'Fechar',

    actions: {
      view: 'Visualizar',
      delete: 'Excluir',
    },

    stats: {
      total: 'Total de security groups',
      inboundRules: 'Regras inbound',
      outboundRules: 'Regras outbound',
    },

    table: {
      name: 'Nome',
      groupId: 'Group ID',
      groupName: 'Group name',
      description: 'Descricao',
      vpcId: 'VPC ID',
      ownerId: 'Owner ID',
      inboundRuleCount: 'Regras inbound',
      outboundRuleCount: 'Regras outbound',
      loading: 'Carregando security groups...',
      emptyTitle: 'Nenhum security group encontrado',
      emptyDescription: 'Nenhum security group foi retornado para a credencial e regiao selecionadas.',
    },

    detail: {
      titleFallback: 'Security group',
      subtitle: 'Regras, tags e metadados principais do security group.',
      groupName: 'Nome do security group',
      groupId: 'Security group ID',
      description: 'Descricao',
      vpcId: 'VPC ID',
      ownerId: 'Owner',
      credential: 'Credencial',
      region: 'Regiao',
    },

    tabs: {
      inbound: 'Inbound rules',
      outbound: 'Outbound rules',
      tags: 'Tags',
    },

    rulesTable: {
      name: 'Nome',
      ruleId: 'Security group rule ID',
      ipVersion: 'IP version',
      type: 'Tipo',
      protocol: 'Protocolo',
      portRange: 'Port range',
      source: 'Origem',
      destination: 'Destino',
      description: 'Descricao',
      inboundTitle: 'Inbound rules',
      outboundTitle: 'Outbound rules',
      loading: 'Carregando regras...',
      emptyInboundTitle: 'Nenhuma regra inbound',
      emptyOutboundTitle: 'Nenhuma regra outbound',
      emptyRulesDescription: 'Nenhuma regra foi retornada para este security group.',
    },

    tagsTable: {
      key: 'Chave',
      value: 'Valor',
      title: 'Tags',
      loading: 'Carregando tags...',
      emptyTitle: 'Nenhuma tag',
      emptyDescription: 'Nenhuma tag foi retornada para este security group.',
    },

    ruleForm: {
      title: 'Adicionar regra inbound',
      typeLabel: 'Tipo',
      typePlaceholder: 'Selecione o tipo',
      protocolLabel: 'Protocolo',
      protocolPlaceholder: 'tcp',
      fromPortLabel: 'Porta inicial',
      toPortLabel: 'Porta final',
      sourceLabel: 'Origem',
      sourceTypeLabel: 'Tipo de origem',
      sourceTypePlaceholder: 'Selecione a origem',
      sourcePlaceholder: '0.0.0.0/0',
      descriptionLabel: 'Descricao',
      descriptionPlaceholder: 'Descricao opcional',
      add: 'Adicionar regra',
      invalidPorts: 'Preencha portas inicial/final validas para este tipo de regra.',
    },

    deleteRuleDialog: {
      title: 'Excluir regra inbound',
      message: 'Excluir esta regra inbound? Esta acao nao podera ser desfeita.',
      cancel: 'Cancelar',
      confirm: 'Excluir',
    },

    emptyCredential: {
      title: 'Nenhuma credencial selecionada',
      description: 'Selecione uma credencial no cabecalho para listar security groups.',
    },

    toast: {
      listErrorSummary: 'Erro ao carregar security groups',
      listErrorDetail: 'Nao foi possivel carregar os security groups. Tente novamente em instantes.',
      ruleCreatedSummary: 'Regra adicionada',
      ruleCreatedDetail: 'Regra inbound adicionada com sucesso.',
      ruleCreateErrorSummary: 'Erro ao adicionar regra',
      ruleCreateErrorDetail: 'Nao foi possivel adicionar a regra inbound. Tente novamente em instantes.',
      ruleDeletedSummary: 'Regra excluida',
      ruleDeletedDetail: 'Regra inbound excluida com sucesso.',
      ruleDeleteErrorSummary: 'Erro ao excluir regra',
      ruleDeleteErrorDetail: 'Nao foi possivel excluir a regra inbound. Tente novamente em instantes.',
      sourceIpErrorSummary: 'Erro ao buscar IP',
      sourceIpErrorDetail: 'Nao foi possivel detectar seu IP publico. Preencha a origem manualmente.',
    },
  },
};

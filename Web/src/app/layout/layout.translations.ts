import { AppLanguage } from '../shared/config/languages.config';

export interface LayoutTranslation {
  brandTitle: string;
  brandSubtitle: string;

  topbarTitle: string;
  topbarSubtitle: string;
  languagePlaceholder: string;
  credentialPlaceholder: string;
  credentialSearchPlaceholder: string;
  regionPlaceholder: string;
  regionSearchPlaceholder: string;
  profileLabel: string;
  settingsLabel: string;
  logoutLabel: string;

  menu: {
    dashboard: string;
    ec2: string;
    ec2Instances: string;
    securityGroups: string;
    s3: string;
    adminArea: string;
    users: string;
    credentials: string;
    authorities: string;
    updateAvailable: string;
  };

  updateDialog: {
    title: string;
    subtitle: string;
    message: string;
    currentVersion: string;
    availableVersion: string;
    commandLabel: string;
    close: string;
  };
}

export const layoutTranslations: Record<AppLanguage, LayoutTranslation> = {
  'en-US': {
    brandTitle: 'AWS Manager',
    brandSubtitle: 'Control panel',

    topbarTitle: 'AWS Manager',
    topbarSubtitle: 'Cloud administration platform',
    languagePlaceholder: 'Language',
    credentialPlaceholder: 'Credential',
    credentialSearchPlaceholder: 'Search credential',
    regionPlaceholder: 'Region',
    regionSearchPlaceholder: 'Search region',
    profileLabel: 'Profile',
    settingsLabel: 'Settings',
    logoutLabel: 'Logout',

    menu: {
      dashboard: 'Dashboard',
      ec2: 'EC2',
      ec2Instances: 'Instances',
      securityGroups: 'Security Groups',
      s3: 'S3 Buckets',
      adminArea: 'Admin Area',
      users: 'Users',
      credentials: 'Credentials',
      authorities: 'Authorities',
      updateAvailable: 'Update available',
    },

    updateDialog: {
      title: 'Update available',
      subtitle: 'A newer AWS Manager version was found.',
      message: 'Run this command on your server to start the latest Docker image while keeping the database volume.',
      currentVersion: 'Installed version',
      availableVersion: 'Available version',
      commandLabel: 'Update command',
      close: 'Close',
    },
  },

  'pt-BR': {
    brandTitle: 'AWS Manager',
    brandSubtitle: 'Painel de controle',

    topbarTitle: 'AWS Manager',
    topbarSubtitle: 'Plataforma de administração em nuvem',
    languagePlaceholder: 'Idioma',
    credentialPlaceholder: 'Credencial',
    credentialSearchPlaceholder: 'Buscar credencial',
    regionPlaceholder: 'Regiao',
    regionSearchPlaceholder: 'Buscar regiao',
    profileLabel: 'Perfil',
    settingsLabel: 'Configuracao',
    logoutLabel: 'Sair',

    menu: {
      dashboard: 'Dashboard',
      ec2: 'EC2',
      ec2Instances: 'Instancias',
      securityGroups: 'Security Groups',
      s3: 'S3 Buckets',
      adminArea: 'Área administrativa',
      users: 'Usuários',
      credentials: 'Credenciais',
      authorities: 'Autoridades',
      updateAvailable: 'Atualizacao disponivel',
    },

    updateDialog: {
      title: 'Atualizacao disponivel',
      subtitle: 'Uma nova versao do AWS Manager foi encontrada.',
      message: 'Execute este comando no servidor para iniciar a imagem Docker latest mantendo o volume do banco.',
      currentVersion: 'Versao instalada',
      availableVersion: 'Versao disponivel',
      commandLabel: 'Comando de atualizacao',
      close: 'Fechar',
    },
  }
};

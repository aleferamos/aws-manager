import { AppLanguage } from '../../shared/config/languages.config';

export interface HomeTranslation {
  billing: {
    title: string;
    info: string;
    moreOptions: string;
    currentMonth: string;
    forecastedMonthEnd: string;
    forecastNote: string;
    savingsOpportunities: string;
    costTitle: string;
    chartCaption: string;
    loading: string;
    emptyUsage: string;
    billingLink: string;
  };
  emptyCredential: {
    title: string;
    description: string;
  };
  errors: {
    billingLoad: string;
  };
}

export const homeTranslations: Record<AppLanguage, HomeTranslation> = {
  'en-US': {
    billing: {
      title: 'Cost and usage',
      info: 'Info',
      moreOptions: 'More options',
      currentMonth: 'Current month',
      forecastedMonthEnd: 'Forecasted month end',
      forecastNote: 'Based on month-to-date usage',
      savingsOpportunities: 'Savings opportunities',
      costTitle: 'Cost ($)',
      chartCaption: 'Month (Year)',
      loading: 'Loading billing data...',
      emptyUsage: 'No billing usage was returned for this month.',
      billingLink: 'Go to Billing and Cost Management',
    },
    emptyCredential: {
      title: 'No credential selected',
      description: 'Select an AWS credential in the header to view billing and cost usage.',
    },
    errors: {
      billingLoad: 'Unable to load billing data.',
    },
  },

  'pt-BR': {
    billing: {
      title: 'Custos e uso',
      info: 'Info',
      moreOptions: 'Mais opcoes',
      currentMonth: 'Mes atual',
      forecastedMonthEnd: 'Previsao ate o fim do mes',
      forecastNote: 'Baseado no uso acumulado do mes',
      savingsOpportunities: 'Oportunidades de economia',
      costTitle: 'Custo ($)',
      chartCaption: 'Mes (Ano)',
      loading: 'Carregando dados de billing...',
      emptyUsage: 'Nenhum uso de billing foi retornado para este mes.',
      billingLink: 'Ir para Billing and Cost Management',
    },
    emptyCredential: {
      title: 'Nenhuma credencial selecionada',
      description: 'Selecione uma credencial AWS no cabecalho para visualizar custos e uso.',
    },
    errors: {
      billingLoad: 'Nao foi possivel carregar os dados de billing.',
    },
  },
};

const PLATFORM_DATE_LOCALE = 'pt-BR';

function parsePlatformDate(value: string): Date | null {
  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00`
    : value.includes('T')
      ? value
      : value.replace(' ', 'T');
  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatPlatformDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const date = parsePlatformDate(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat(PLATFORM_DATE_LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatPlatformShortDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const date = parsePlatformDate(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat(PLATFORM_DATE_LOCALE, {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

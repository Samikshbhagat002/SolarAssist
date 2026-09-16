import { useTranslation } from 'react-i18next';

export function useTranslatedText(namespace) {
  const { t, i18n } = useTranslation(namespace);
  return {
    t,
    language: i18n.resolvedLanguage || i18n.language,
    changeLanguage: (language) => i18n.changeLanguage(language),
  };
}

export function translateApiError(t, error) {
  const detail = error?.response?.data?.detail;
  if (!detail) return t('Errors.network');
  if (typeof detail === 'string' && detail.startsWith('i18n.')) {
    return t(detail.slice(5), { defaultValue: t('Errors.generic') });
  }
  return detail;
}

export function translateStatus(t, status) {
  return t(`ServiceRequests.statuses.${String(status || '').toLowerCase()}`, {
    defaultValue: status || '',
  });
}

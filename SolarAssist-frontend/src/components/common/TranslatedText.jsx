import { useTranslation } from 'react-i18next';

export default function TranslatedText({ i18nKey, values, as: Element = 'span', children }) {
  const { t } = useTranslation();
  return <Element>{t(i18nKey, { ...values, defaultValue: children || i18nKey })}</Element>;
}

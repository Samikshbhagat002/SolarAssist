import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ dark = false }) {
  const { i18n, t } = useTranslation();

  return (
    <label className={`flex items-center gap-2 text-xs font-semibold ${dark ? 'text-sky-100' : 'text-blue-700'}`}>
      <span>{t('language')}</span>
      <select
        value={i18n.resolvedLanguage || i18n.language}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
        className={`rounded-lg border px-2 py-1 outline-none ${dark ? 'bg-blue-900/50 border-blue-700 text-white' : 'bg-white border-sky-200 text-blue-800'}`}
        aria-label={t('language')}
      >
        <option value="en">{t('english')}</option>
        <option value="hi">{t('hindi')}</option>
        <option value="mr">{t('marathi')}</option>
      </select>
    </label>
  );
}

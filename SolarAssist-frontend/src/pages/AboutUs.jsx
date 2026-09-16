import { useTranslation } from 'react-i18next';

export default function AboutUs() {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-blue-900 mb-4">{t('about_page_title')}</h1>
      <p className="text-slate-600 mb-4">{t('about_intro')}</p>
      <p className="text-slate-600 mb-4">{t('about_dept')}</p>
      <div className="grid sm:grid-cols-2 gap-6 mt-10">
        <div className="bg-blue-50 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-1">{t('about_mission_title')}</h3>
          <p className="text-sm text-slate-600">{t('about_mission_desc')}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-1">{t('about_approach_title')}</h3>
          <p className="text-sm text-slate-600">{t('about_approach_desc')}</p>
        </div>
      </div>
    </div>
  );
}
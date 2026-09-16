import { useTranslation } from 'react-i18next';
import KPICard from '../../components/common/KPICard';

export default function RepairProviderDashboard() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-6">{t('repair_dashboard_title')}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label={t('profile_status_label')} value={t('status_approved')} />
        <KPICard label={t('open_requests_label')} value="6" />
        <KPICard label={t('in_progress_label')} value="3" />
        <KPICard label={t('resolved_label')} value="28" />
      </div>
    </div>
  );
}
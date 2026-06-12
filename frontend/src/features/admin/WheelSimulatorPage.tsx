import { DashboardLayout } from '../../shared/components/DashboardLayout';
import { WheelSimulatorFeature } from './WheelSimulatorFeature';

export function WheelSimulatorPage() {
  return (
    <DashboardLayout role="admin">
      <WheelSimulatorFeature />
    </DashboardLayout>
  );
}

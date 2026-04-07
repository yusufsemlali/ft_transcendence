import { EmptyPanel } from "../_components/empty-panel";

export function SettingsTab() {
  return (
    <EmptyPanel
      icon="settings"
      title="Organization Settings"
      subtitle="Configure your organization's profile, visibility, integrations, and danger zone."
      actionLabel="Open Settings"
    />
  );
}

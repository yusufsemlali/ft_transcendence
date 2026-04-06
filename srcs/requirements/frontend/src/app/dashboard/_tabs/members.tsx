import { EmptyPanel } from "../_components/empty-panel";

export function MembersTab() {
  return (
    <EmptyPanel
      icon="group"
      title="Team Roster"
      subtitle="Manage your organization's members, assign roles, and coordinate your staff."
      actionLabel="+ Invite Member"
    />
  );
}

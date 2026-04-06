"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/api";
import type { Organization } from "@ft-transcendence/contracts";
import { OrgPicker } from "./_components/org-picker";
import { Shell } from "./_components/shell";

export default function DashboardPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await api.organizations.getOrganizations();
        if (res.status === 200) {
          const data = res.body.data;
          setOrgs(data);
          if (data.length === 1) setSelectedOrg(data[0]);
        }
      } catch { }
      finally { setLoading(false); }
    };
    fetchOrgs();
  }, []);

  const handleOrgCreated = (org: Organization) => {
    setOrgs(prev => [...prev, org]);
    setSelectedOrg(org); // jump straight into the new org's dashboard
  };

  if (selectedOrg) {
    return <Shell org={selectedOrg} onBack={() => setSelectedOrg(null)} />;
  }

  return (
    <OrgPicker
      orgs={orgs}
      loading={loading}
      onSelect={setSelectedOrg}
      onOrgCreated={handleOrgCreated}
    />
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api/api";
import type { Organization } from "@ft-transcendence/contracts";
import { OrgPicker } from "./_components/org-picker";
import { Shell } from "./_components/shell";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlOrgId = searchParams.get("org");

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
          // Restore org from URL, or auto-select if only one
          if (urlOrgId) {
            const found = data.find((o: Organization) => o.id === urlOrgId);
            if (found) { setSelectedOrg(found); return; }
          }
          if (data.length === 1) selectOrg(data[0]);
        }
      } catch { }
      finally { setLoading(false); }
    };
    fetchOrgs();
  }, []);

  const selectOrg = (org: Organization) => {
    setSelectedOrg(org);
    const params = new URLSearchParams(searchParams.toString());
    params.set("org", org.id);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const handleBack = () => {
    setSelectedOrg(null);
    router.replace("/dashboard", { scroll: false });
  };

  const handleOrgCreated = (org: Organization) => {
    setOrgs(prev => [...prev, org]);
    selectOrg(org);
  };

  if (selectedOrg) {
    return <Shell org={selectedOrg} onBack={handleBack} />;
  }

  return (
    <OrgPicker
      orgs={orgs}
      loading={loading}
      onSelect={selectOrg}
      onOrgCreated={handleOrgCreated}
    />
  );
}

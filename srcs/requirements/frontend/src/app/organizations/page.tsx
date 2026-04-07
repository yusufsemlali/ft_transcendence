"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import api from "@/lib/api/api";
import { Organization } from "@ft-transcendence/contracts";

import { toast } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Page } from "@/components/layout/Page";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

/* ───────── Create Org Modal ───────── */
function CreateOrgModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    setCreating(true);
    try {
      const res = await api.organizations.createOrganization({
        body: { name: name.trim(), slug: slug.trim().toLowerCase(), description: description.trim() || undefined, visibility },
      });
      if (res.status === 201) {
        toast.success("Organization created!");
        onCreated();
        onClose();
      } else {
        const err = res.body as { message: string };
        toast.error(err.message);
      }
    } catch {
      toast.error("Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/10">
          <span className="text-sm font-mono font-bold uppercase tracking-widest">New Organization</span>
          <button onClick={onClose} className="p-1 rounded-sm hover:bg-muted/50">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Organization"
              className="input h-10 px-3 w-full border border-border/50 focus:border-primary/50 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="my-organization"
              className="input h-10 px-3 w-full border border-border/50 focus:border-primary/50 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this organization about?"
              rows={3}
              className="input px-3 py-2 w-full border border-border/50 focus:border-primary/50 text-sm font-mono resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Visibility</label>
            <div className="flex gap-2">
              {(["public", "private"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm transition-all flex-1 ${
                    visibility === v ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-2.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-primary text-primary-foreground hover:bg-primary/80 transition-all disabled:opacity-50"
          >
            {creating ? "creating..." : "create organization"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ───────── Org Card ───────── */
function OrgCard({ org }: { org: Organization }) {
  return (
    <a href={`/organizations/${org.id}`} className="block">
      <Card className="p-6 hover:border-primary/30 transition-all cursor-pointer group h-full">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-border/50">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} className="w-full h-full rounded-sm object-cover" />
            ) : (
              <span className="material-symbols-outlined text-primary text-xl">corporate_fare</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                {org.name}
              </span>
              <Badge variant={org.visibility === "public" ? "success" : "outline"}>
                {org.visibility}
              </Badge>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground/60 mb-2">/{org.slug}</div>
            {org.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{org.description}</p>
            )}
          </div>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mt-4">
          Created {new Date(org.createdAt).toLocaleDateString()}
        </div>
      </Card>
    </a>
  );
}

/* ───────── Main Page ───────── */
export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadOrgs = async () => {
    setLoading(true);
    try {
      const res = await api.organizations.getOrganizations();
      if (res.status === 200) {
        setOrgs(res.body.data);
      } else {
        const err = res.body as { message: string };
        toast.error(err.message);
      }
    } catch {
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrgs(); }, []);

  return (
    <Page>
      <Stack gap="xl">
        <Section
          title="organizations"
          icon="corporate_fare"
          actions={
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-primary text-primary-foreground hover:bg-primary/80 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              create
            </button>
          }
        >
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-12 h-12 rounded-sm" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : orgs.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                <span className="material-symbols-outlined text-6xl">domain_disabled</span>
                <span className="text-xs font-mono uppercase tracking-[0.4em]">
                  No organizations yet. Create one to get started.
                </span>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orgs.map((org) => (
                <OrgCard key={org.id} org={org} />
              ))}
            </div>
          )}
        </Section>
      </Stack>

      {showCreate && <CreateOrgModal onClose={() => setShowCreate(false)} onCreated={loadOrgs} />}
    </Page>
  );
}

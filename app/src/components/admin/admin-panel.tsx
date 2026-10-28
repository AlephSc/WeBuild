"use client";

// F10: Admin panel — 4 tab: Router AI, Users, Moderasi, Statistik + CSV
import { useCallback, useEffect, useState } from "react";
import { fetchWithCsrf } from "@/lib/fetch-with-csrf";

type ProviderCfg = { id: string; label: string; isEnabled: boolean; model: string; hasKey: boolean };
type UserRow = { id: string; name: string; email: string; role: string; plan: string; isActive: boolean; sitesCount: number; canUseAi: boolean; quotaUsed: number };
type SiteRow = { id: string; title: string; slug: string; owner: string; isPublished: boolean; version: number };
type Stats = { usersTotal: number; sitesTotal: number; publishRate: number; published: number; aiRequests: number; aiSuccessRate: number; tokensTotal: number; siteEvents: number };

export function AdminPanel() {
  const [tab, setTab] = useState<"router" | "users" | "moderasi" | "stats">("router");

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-wrap gap-2">
        {([["router", "🤖 Router AI"], ["users", "👥 Users"], ["moderasi", "🛡 Moderasi"], ["stats", "📊 Statistik"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`nb-btn text-sm ${tab === k ? "nb-btn-primary" : "nb-btn-ghost"}`}>
            {label}
          </button>
        ))}
      </nav>
      {tab === "router" && <RouterTab />}
      {tab === "users" && <UsersTab />}
      {tab === "moderasi" && <ModerasiTab />}
      {tab === "stats" && <StatsTab />}
    </div>
  );
}

// ===== TAB 1: ROUTER AI (config provider + kuota) =====
function RouterTab() {
  const [providers, setProviders] = useState<ProviderCfg[]>([]);
  const [quotas, setQuotas] = useState({ FREE: "10", PLUS: "50" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchWithCsrf("/api/admin/ai-config").then((r) => r.json()).then((d) => {
      if (d.ok) { setProviders(d.providers); setQuotas(d.quotas); }
    });
  }, []);

  const save = useCallback(async () => {
    setSaving(true); setMsg(null);
    const res = await fetchWithCsrf("/api/admin/ai-config", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providers, quotas }),
    });
    const d = await res.json();
    setMsg(d.ok ? "✔ Tersimpan — berlaku langsung, tanpa redeploy" : "✖ Gagal simpan");
    setSaving(false);
  }, [providers, quotas]);

  return (
    <div className="flex flex-col gap-4">
      <div className="nb-card">
        <h3 className="mb-3 font-bold">AI Providers (fallback order: atas → bawah)</h3>
        {providers.map((p, i) => (
          <div key={p.id} className="mb-3 flex flex-wrap items-center gap-3 rounded border-2 p-3" style={{ borderColor: "#1c3d52" }}>
            <span className="font-bold" style={{ fontFamily: "var(--font-heading)" }}>{p.label}</span>
            {!p.hasKey && <span className="nb-badge" style={{ color: "var(--accent-danger)" }}>no API key di env</span>}
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={p.isEnabled}
                onChange={(e) => setProviders(providers.map((x, j) => (j === i ? { ...x, isEnabled: e.target.checked } : x)))}
              />
              Aktif
            </label>
            <div className="nb-field" style={{ marginBottom: 0 }}>
              <label>Model</label>
              <input
                value={p.model}
                onChange={(e) => setProviders(providers.map((x, j) => (j === i ? { ...x, model: e.target.value } : x)))}
                style={{ width: 240 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="nb-card">
        <h3 className="mb-3 font-bold">Kuota AI per Plan (request/hari)</h3>
        <div className="flex flex-wrap gap-4">
          {(["FREE", "PLUS"] as const).map((plan) => (
            <div key={plan} className="nb-field">
              <label>{plan}</label>
              <input
                type="number" min={0} max={10000}
                value={quotas[plan]}
                onChange={(e) => setQuotas({ ...quotas, [plan]: e.target.value })}
                style={{ width: 120 }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="nb-btn nb-btn-mint" onClick={save} disabled={saving}>
          {saving ? "Menyimpan…" : "💾 Simpan Konfigurasi"}
        </button>
        {msg && <span className="text-sm" style={{ color: msg.startsWith("✔") ? "var(--accent-success)" : "var(--accent-danger)" }}>{msg}</span>}
      </div>
    </div>
  );
}

// ===== TAB 2: USERS =====
function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchWithCsrf("/api/admin/users").then((r) => r.json()).then((d) => d.ok && setUsers(d.users));
  }, []);
  useEffect(load, [load]);

  async function patch(userId: string, body: Record<string, unknown>) {
    const res = await fetchWithCsrf("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...body }),
    });
    const d = await res.json();
    setMsg(d.ok ? "✔ Diperbarui" : `✖ ${d.error}`);
    if (d.ok) load();
  }

  return (
    <div className="nb-card overflow-x-auto">
      {msg && <p className="mb-2 text-sm" style={{ color: "var(--accent-success)" }}>{msg}</p>}
      <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--ink)", textAlign: "left" }}>
            <th className="p-2">User</th><th>Plan</th><th>Site</th><th>Kuota AI</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid #143041" }}>
              <td className="p-2">
                <strong>{u.name}</strong><br />
                <span className="text-xs" style={{ color: "var(--muted)" }}>{u.email} · {u.role}</span>
              </td>
              <td>
                <select value={u.plan} onChange={(e) => patch(u.id, { plan: e.target.value })} className="nb-field" style={{ marginBottom: 0 }}>
                  <option>FREE</option><option>PLUS</option>
                </select>
              </td>
              <td>{u.sitesCount}</td>
              <td>{u.quotaUsed} hari ini</td>
              <td className="flex flex-wrap gap-1 p-2">
                <button className="nb-btn nb-btn-ghost text-xs" onClick={() => patch(u.id, { canUseAi: !u.canUseAi })} title="Toggle akses AI (403 instan saat dicabut)">
                  {u.canUseAi ? "🚫 Cabut AI" : "✅ Beri AI"}
                </button>
                <button className="nb-btn nb-btn-ghost text-xs" onClick={() => patch(u.id, { isActive: !u.isActive })}>
                  {u.isActive ? "⛔ Nonaktifkan" : "▶️ Aktifkan"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== TAB 3: MODERASI =====
function ModerasiTab() {
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchWithCsrf("/api/admin/sites").then((r) => r.json()).then((d) => d.ok && setSites(d.sites));
  }, []);
  useEffect(load, [load]);

  async function unpublish(id: string, slug: string) {
    if (!confirm(`Unpublish "${slug}"? Site jadi 404 segera.`)) return;
    const res = await fetchWithCsrf(`/api/admin/sites/${id}/unpublish`, { method: "POST" });
    const d = await res.json();
    setMsg(d.ok ? `✔ ${slug} di-unpublish` : `✖ ${d.error}`);
    if (d.ok) load();
  }

  return (
    <div className="nb-card overflow-x-auto">
      {msg && <p className="mb-2 text-sm" style={{ color: "var(--accent-success)" }}>{msg}</p>}
      <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--ink)", textAlign: "left" }}>
            <th className="p-2">Site</th><th>Owner</th><th>Status</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #143041" }}>
              <td className="p-2">
                <strong>{s.title}</strong><br />
                <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>/s/{s.slug}</span>
              </td>
              <td className="text-xs">{s.owner}</td>
              <td>
                <span className={`nb-badge ${s.isPublished ? "nb-badge-mint" : "nb-badge-yellow"}`}>
                  {s.isPublished ? "PUBLISHED" : "DRAFT"}
                </span>
              </td>
              <td className="flex gap-1 p-2">
                {s.isPublished && (
                  <a href={`/s/${s.slug}`} target="_blank" rel="noreferrer" className="nb-btn nb-btn-ghost text-xs">👁 Lihat</a>
                )}
                {s.isPublished && (
                  <button className="nb-btn text-xs" style={{ background: "var(--accent-danger)", color: "var(--fg)" }} onClick={() => unpublish(s.id, s.slug)}>
                    ⛔ Unpublish
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== TAB 4: STATISTIK + CSV =====
function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    fetchWithCsrf("/api/admin/stats").then((r) => r.json()).then((d) => d.ok && setStats(d.stats));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total Users", stats?.usersTotal],
          ["Total Sites", stats?.sitesTotal],
          ["Publish Rate", stats ? `${stats.publishRate}%` : undefined],
          ["AI Success", stats ? `${stats.aiSuccessRate}%` : undefined],
        ].map(([label, val]) => (
          <div key={String(label)} className="nb-card text-center">
            <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--accent-success)" }}>
              {val ?? "—"}
            </div>
            <div className="text-xs uppercase" style={{ color: "var(--muted)", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>
      <div className="nb-card">
        <h3 className="mb-2 font-bold">Detail</h3>
        <ul className="text-sm" style={{ color: "var(--muted)" }}>
          <li>Site ter-publish: <strong style={{ color: "var(--fg)" }}>{stats?.published ?? "—"}</strong></li>
          <li>Total request AI: <strong style={{ color: "var(--fg)" }}>{stats?.aiRequests ?? "—"}</strong></li>
          <li>Total tokens diproses: <strong style={{ color: "var(--fg)" }}>{stats?.tokensTotal?.toLocaleString("id-ID") ?? "—"}</strong></li>
          <li>Event situs (laporan & interaksi): <strong style={{ color: "var(--fg)" }}>{stats?.siteEvents ?? "—"}</strong></li>
        </ul>
      </div>
      <div className="nb-card">
        <h3 className="mb-3 font-bold">Export CSV</h3>
        <div className="flex flex-wrap gap-2">
          {([["sites", "Site"], ["users", "Users"], ["ai_usage", "Pemakaian AI"]] as const).map(([t, label]) => (
            <a key={t} href={`/api/admin/export?type=${t}`} className="nb-btn nb-btn-ghost text-sm">⬇ {label}</a>
          ))}
        </div>
      </div>
    </div>
  );
}

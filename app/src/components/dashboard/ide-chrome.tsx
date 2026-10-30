"use client";

// Bottom panel ala terminal IDE: tabs [MASALAH | LOG | RIWAYAT], collapsible.
// Data lokal (localStorage) — tanpa endpoint baru. Log/riwayat diisi event global.
import { useEffect, useState } from "react";

type Tab = "masalah" | "log" | "riwayat";
const LS_LOG = "wb.ide.log";
const LS_RIWAYAT = "wb.ide.riwayat";
const LS_OPEN = "wb.ide.bottomOpen";

export function pushIdeLog(msg: string) {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_LOG) ?? "[]") as Array<[number, string]>;
    arr.unshift([Date.now(), msg]);
    localStorage.setItem(LS_LOG, JSON.stringify(arr.slice(0, 50)));
    window.dispatchEvent(new Event("wb-ide-log"));
  } catch { /* storage penuh — abaikan */ }
}

export function pushIdeRiwayat(prompt: string) {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_RIWAYAT) ?? "[]") as Array<[number, string]>;
    arr.unshift([Date.now(), prompt]);
    localStorage.setItem(LS_RIWAYAT, JSON.stringify(arr.slice(0, 30)));
    window.dispatchEvent(new Event("wb-ide-log"));
  } catch { /* abaikan */ }
}

const fmt = (ts: number) =>
  new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function BottomPanel({ masalah, dbUp }: { masalah: string[]; dbUp: boolean | null }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("masalah");
  const [log, setLog] = useState<Array<[number, string]>>([]);
  const [riwayat, setRiwayat] = useState<Array<[number, string]>>([]);

  useEffect(() => {
    const load = () => {
      try {
        setLog(JSON.parse(localStorage.getItem(LS_LOG) ?? "[]"));
        setRiwayat(JSON.parse(localStorage.getItem(LS_RIWAYAT) ?? "[]"));
      } catch { /* abaikan */ }
    };
    setOpen(localStorage.getItem(LS_OPEN) === "1");
    load();
    window.addEventListener("wb-ide-log", load);
    return () => window.removeEventListener("wb-ide-log", load);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem(LS_OPEN, next ? "1" : "0");
  };

  const masalahCount = masalah.length;
  const tabs: Array<[Tab, string, number?]> = [
    ["masalah", "MASALAH", masalahCount],
    ["log", "LOG", log.length],
    ["riwayat", "RIWAYAT", riwayat.length],
  ];

  return (
    <section
      aria-label="Panel bawah"
      className="ide-bottom"
      style={{ borderTop: "2px solid var(--shadow-hard)", background: "var(--surface)" }}
    >
      <div className="flex items-center gap-2 px-3" style={{ height: 32, borderBottom: open ? "2px solid var(--shadow-hard)" : undefined }}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={open ? "Tutup panel bawah" : "Buka panel bawah"}
          className="ide-tab"
          style={{ height: 24, marginTop: 0, padding: "0 0.5rem", fontSize: 11 }}
        >
          {open ? "▾" : "▴"} PANEL
        </button>
        {tabs.map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            disabled={!open}
            onClick={() => setTab(id)}
            className="ide-tab"
            style={{
              height: 24, marginTop: 0, padding: "0 0.6rem", fontSize: 11,
              fontFamily: "var(--font-mono)", letterSpacing: "0.5px",
              opacity: open ? 1 : 0.5,
              ...(tab === id && open ? { background: "var(--surface2)", color: "var(--fg)", borderColor: "var(--shadow-hard)" } : {}),
            }}
          >
            {label}
            {count ? <span style={{ color: id === "masalah" && count > 0 ? "var(--accent-danger)" : "var(--accent-success)" }}>[{count}]</span> : null}
          </button>
        ))}
      </div>
      {open && (
        <div className="ide-bottom-body" style={{ height: 148, overflowY: "auto", padding: "0.5rem 0.75rem", fontFamily: "var(--font-mono)", fontSize: 11 }}>
          {tab === "masalah" && (
            masalah.length === 0 ? (
              <p style={{ color: "var(--accent-success)" }}>✔ Tidak ada masalah terdeteksi.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {masalah.map((m, i) => (
                  <li key={i} style={{ color: "var(--accent-danger)" }}>▲ {m}</li>
                ))}
              </ul>
            )
          )}
          {tab === "log" && (
            log.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>Belum ada aktivitas tercatat di sesi ini.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {log.map(([ts, m], i) => (
                  <li key={i}><span style={{ color: "var(--muted)" }}>{fmt(ts)}</span> {m}</li>
                ))}
              </ul>
            )
          )}
          {tab === "riwayat" && (
            riwayat.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>Belum ada prompt AI tercatat di browser ini.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {riwayat.map(([ts, m], i) => (
                  <li key={i}><span style={{ color: "var(--muted)" }}>{fmt(ts)}</span> {m.slice(0, 120)}</li>
                ))}
              </ul>
            )
          )}
          {dbUp === false && (
            <p style={{ color: "var(--accent-danger)", marginTop: 6 }}>▲ Database tidak merespons — coba muat ulang.</p>
          )}
        </div>
      )}
    </section>
  );
}

export function StatusBar({ dbUp, siteCount, planName, quota }: { dbUp: boolean | null; siteCount: number; planName: string; quota: string }) {
  return (
    <footer
      aria-label="Status bar"
      className="ide-statusbar"
      style={{
        height: 28, flexShrink: 0, borderTop: "2px solid var(--shadow-hard)", background: "var(--ink)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        padding: "0 0.75rem", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg)",
      }}
    >
      <span className="flex items-center gap-3">
        <span style={{ color: dbUp === null ? "var(--muted)" : dbUp ? "var(--accent-success)" : "var(--accent-danger)" }}>
          ● DB: {dbUp === null ? "…" : dbUp ? "up" : "down"}
        </span>
        <span style={{ color: "var(--muted)" }}>{siteCount} sites</span>
      </span>
      <span style={{ color: "var(--muted)" }} className="hidden sm:inline">⎇ main · next16</span>
      <span className="flex items-center gap-3">
        <span>plan: {planName}</span>
        <span style={{ color: "var(--muted)" }}>quota {quota}</span>
      </span>
    </footer>
  );
}

export function useDbHealth(): boolean | null {
  const [up, setUp] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/health")
      .then((r) => r.json())
      .then((d: { db?: string }) => { if (alive) setUp(d.db === "up"); })
      .catch(() => { if (alive) setUp(false); });
    return () => { alive = false; };
  }, []);
  return up;
}

// Frame client: memegang dbUp (fetch) lalu render bottom panel + statusbar.
export function IdeChromeClient({
  planName,
  siteCount,
  planLimit,
  masalah,
  children,
}: {
  planName: string;
  siteCount: number;
  planLimit: number;
  masalah: string[];
  children: React.ReactNode;
}) {
  const dbUp = useDbHealth();
  return (
    <div className="ide-shell ide-with-chrome">
      {children}
      <BottomPanel masalah={masalah} dbUp={dbUp} />
      <StatusBar dbUp={dbUp} siteCount={siteCount} planName={planName} quota={`${siteCount}/${planLimit}`} />
    </div>
  );
}

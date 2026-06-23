import React, { useState, useMemo, useEffect } from "react";

const SUPABASE_URL = "https://yykcometrwyssvkxhsub.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5a2NvbWV0cnd5c3N2a3hoc3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzc3MTUsImV4cCI6MjA5NzgxMzcxNX0.5nPDvYepnCvTjJHWYLYuwTJyosg4q9IuqPzPWixRRvc";

const api = async (path, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || "",
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const toDb = (l) => ({
  address: l.address,
  neighborhood: l.neighborhood,
  price: l.price ? Number(l.price) : null,
  beds: l.beds || null,
  baths: l.baths || null,
  sqft: l.sqft ? Number(l.sqft) : null,
  floor: l.floor ? Number(l.floor) : null,
  status: l.status,
  doorman: !!l.doorman,
  elevator: !!l.elevator,
  laundry: l.laundry,
  outdoor: l.outdoor,
  gym: !!l.gym,
  storage: !!l.storage,
  no_fee: !!l.noFee,
  available_date: l.availableDate,
  visit_date: l.visitDate,
  broker: l.broker,
  link: l.link,
  rating: l.rating ? Number(l.rating) : null,
  pros: l.pros,
  cons: l.cons,
  notes: l.notes,
  last_updated: new Date().toISOString().slice(0, 10),
});

const fromDb = (r) => ({
  id: r.id,
  address: r.address || "",
  neighborhood: r.neighborhood || "",
  price: r.price || "",
  beds: r.beds || "",
  baths: r.baths || "",
  sqft: r.sqft || "",
  floor: r.floor || "",
  status: r.status || "Watching",
  doorman: !!r.doorman,
  elevator: !!r.elevator,
  laundry: r.laundry || "",
  outdoor: r.outdoor || "",
  gym: !!r.gym,
  storage: !!r.storage,
  noFee: !!r.no_fee,
  availableDate: r.available_date || "",
  visitDate: r.visit_date || "",
  broker: r.broker || "",
  link: r.link || "",
  rating: r.rating || "",
  pros: r.pros || "",
  cons: r.cons || "",
  notes: r.notes || "",
  lastUpdated: r.last_updated || "",
});

const NEIGHBORHOODS = [
  "West Village", "East Village", "Tribeca", "SoHo", "NoHo", "Nolita",
  "Flatiron", "Gramercy", "Greenwich Village", "Battery Park City",
  "Financial District", "Upper West Side", "Williamsburg", "Greenpoint", "Chelsea",
];

const STATUS_ORDER = ["Watching", "Contacted", "Touring", "Toured", "Applied", "Approved", "Rejected", "Passed"];
const STATUS_COLORS = {
  Watching: "#6b7280",
  Contacted: "#3b82f6",
  Touring: "#f59e0b",
  Toured: "#8b5cf6",
  Applied: "#ec4899",
  Approved: "#10b981",
  Rejected: "#ef4444",
  Passed: "#374151",
};

const FIELDS = {
  address: { label: "Address", type: "text" },
  neighborhood: { label: "Neighborhood", type: "select", options: ["", ...NEIGHBORHOODS] },
  price: { label: "Rent ($/mo)", type: "nullable_number" },
  beds: { label: "Beds", type: "select", options: ["", "Studio", "1", "2"] },
  baths: { label: "Baths", type: "select", options: ["", "1", "2"] },
  sqft: { label: "Sq Ft", type: "nullable_number" },
  floor: { label: "Floor", type: "nullable_number" },
  status: { label: "Status", type: "select", options: STATUS_ORDER },
  doorman: { label: "Doorman", type: "boolean" },
  elevator: { label: "Elevator", type: "boolean" },
  laundry: { label: "Laundry", type: "select", options: ["", "In-unit", "In-building"] },
  outdoor: { label: "Outdoor Space", type: "select", options: ["", "None", "Private", "Shared"] },
  gym: { label: "Gym", type: "boolean" },
  storage: { label: "Storage", type: "boolean" },
  noFee: { label: "No Fee", type: "boolean" },
  availableDate: { label: "Available", type: "date" },
  visitDate: { label: "Visit Date", type: "date" },
  broker: { label: "Broker", type: "text" },
  link: { label: "Listing Link", type: "text" },
  rating: { label: "My Rating (1–5)", type: "star_rating" },
  pros: { label: "Pros", type: "textarea" },
  cons: { label: "Cons", type: "textarea" },
  notes: { label: "Notes", type: "textarea" },
};

const emptyListing = () => ({
  id: null,
  address: "", neighborhood: "", price: "", beds: "", baths: "",
  sqft: "", floor: "", status: "Watching", doorman: false, elevator: false,
  laundry: "", outdoor: "", gym: false, storage: false, noFee: false,
  availableDate: "", visitDate: "", broker: "", link: "", rating: "",
  pros: "", cons: "", notes: "", lastUpdated: "",
});

function ScrollPicker({ value, min, max, nullable, onChange }) {
  const items = nullable
    ? ["N/A", ...Array.from({ length: max - min + 1 }, (_, i) => String(min + i))]
    : ["", ...Array.from({ length: max - min + 1 }, (_, i) => String(min + i))];
  const itemH = 36;
  const ref = React.useRef(null);
  const ignoreScroll = React.useRef(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let idx = 0;
    if (value === "" || value === null || value === undefined || value === "N/A") {
      idx = nullable ? 0 : 0;
    } else {
      idx = items.indexOf(String(value));
      if (idx < 0) idx = 0;
    }
    ignoreScroll.current = true;
    el.scrollTop = idx * itemH;
    setTimeout(() => { ignoreScroll.current = false; }, 100);
  }, [value]);

  const handleScroll = () => {
    if (ignoreScroll.current) return;
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / itemH);
    const snapped = items[Math.min(idx, items.length - 1)];
    if (snapped === "N/A" || snapped === "") onChange("");
    else onChange(Number(snapped));
  };

  return (
    <div style={{ position: "relative", height: itemH * 3, width: 80 }}>
      {/* fade top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: itemH, background: "linear-gradient(#1f2937, transparent)", zIndex: 1, pointerEvents: "none", borderRadius: "6px 6px 0 0" }} />
      {/* selection highlight */}
      <div style={{ position: "absolute", top: itemH, left: 0, right: 0, height: itemH, border: "1px solid #f59e0b33", borderRadius: 4, background: "#f59e0b11", zIndex: 1, pointerEvents: "none" }} />
      {/* fade bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: itemH, background: "linear-gradient(transparent, #1f2937)", zIndex: 1, pointerEvents: "none", borderRadius: "0 0 6px 6px" }} />
      <div
        ref={ref}
        onScroll={handleScroll}
        style={{
          height: "100%", overflowY: "scroll", scrollSnapType: "y mandatory",
          scrollbarWidth: "none", msOverflowStyle: "none",
          background: "#1f2937", border: "1px solid #374151", borderRadius: 6,
          paddingTop: itemH, paddingBottom: itemH,
        }}
      >
        {items.map((v, i) => (
          <div key={i} onClick={() => {
            if (v === "N/A" || v === "") onChange("");
            else onChange(Number(v));
          }} style={{
            height: itemH, display: "flex", alignItems: "center", justifyContent: "center",
            scrollSnapAlign: "start", cursor: "pointer",
            color: (v === "N/A" || v === "") ? ((!value || value === "N/A") ? "#f59e0b" : "#4b5563") : (String(value) === v ? "#f59e0b" : "#d1d5db"),
            fontWeight: (String(value) === v && v !== "" && v !== "N/A") || ((!value || value === "N/A") && (v === "N/A" || v === "")) ? 700 : 400,
            fontSize: 14,
          }}>
            {v === "" ? "—" : v}
          </div>
        ))}
      </div>
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 200,
      background: type === "error" ? "#7f1d1d" : "#064e3b",
      color: type === "error" ? "#fca5a5" : "#6ee7b7",
      border: `1px solid ${type === "error" ? "#991b1b" : "#065f46"}`,
      borderRadius: 8, padding: "12px 18px", fontSize: 13, fontWeight: 500,
      boxShadow: "0 4px 24px #00000088",
    }}>{message}</div>
  );
}

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} onClick={() => onChange && onChange(n)}
          style={{ cursor: onChange ? "pointer" : "default", color: n <= value ? "#f59e0b" : "#374151", fontSize: 18 }}>★</span>
      ))}
    </div>
  );
}

function Badge({ value }) {
  const color = STATUS_COLORS[value] || "#6b7280";
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600,
      letterSpacing: "0.05em", whiteSpace: "nowrap",
    }}>{value}</span>
  );
}

function PipelineBar({ listings }) {
  const counts = {};
  STATUS_ORDER.forEach(s => { counts[s] = 0; });
  listings.forEach(l => { if (counts[l.status] !== undefined) counts[l.status]++; });
  const active = STATUS_ORDER.filter(s => !["Rejected", "Passed"].includes(s));
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {active.map(s => (
        <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: counts[s] > 0 ? STATUS_COLORS[s] + "33" : "#1f2937",
            border: `2px solid ${counts[s] > 0 ? STATUS_COLORS[s] : "#374151"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: counts[s] > 0 ? STATUS_COLORS[s] : "#4b5563", fontWeight: 700, fontSize: 18,
          }}>{counts[s]}</div>
          <span style={{ fontSize: 10, color: "#6b7280", textAlign: "center", maxWidth: 52 }}>{s}</span>
        </div>
      ))}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginLeft: 8 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "#1f2937", border: "2px solid #374151",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#6b7280", fontWeight: 700, fontSize: 18,
        }}>{(counts["Rejected"] || 0) + (counts["Passed"] || 0)}</div>
        <span style={{ fontSize: 10, color: "#6b7280", textAlign: "center", maxWidth: 52 }}>Closed</span>
      </div>
    </div>
  );
}

function Modal({ listing, onSave, onClose, onDelete, saving }) {
  const [form, setForm] = useState({ ...listing });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000cc", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#111827", border: "1px solid #1f2937", borderRadius: 12,
        width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", padding: 28,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ color: "#f9fafb", fontFamily: "Georgia, serif", fontSize: 20, margin: 0 }}>
            {listing.address || "New Listing"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 22 }}>✕</button>
        </div>

        {[
          { title: "Location & Basics", keys: ["address", "neighborhood", "status", "beds", "baths", "price", "floor", "sqft", "availableDate"] },
          { title: "Amenities", keys: ["doorman", "elevator", "laundry", "outdoor", "gym", "storage", "noFee"] },
          { title: "Listing Info", keys: ["broker", "link"] },
          { title: "My Take", keys: ["visitDate", "rating", "pros", "cons", "notes"] },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>
              {section.title}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {section.keys.map(k => {
                const f = FIELDS[k];
                const val = form[k];
                const inputStyle = {
                  background: "#1f2937", border: "1px solid #374151", borderRadius: 6,
                  color: "#f9fafb", padding: "6px 10px", fontSize: 13, width: "100%", boxSizing: "border-box",
                };
                const fullWidth = ["address", "outdoor", "laundry", "link", "pros", "cons", "notes", "rating", "broker", "visitDate", "noFee"].includes(k);
                return (
                  <div key={k} style={{ gridColumn: fullWidth ? "1 / -1" : "auto" }}>
                    <label style={{ display: "block", fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{f.label}</label>
                    {f.type === "boolean" ? (
                      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
                        <input type="checkbox" checked={!!val} onChange={e => set(k, e.target.checked)}
                          style={{ accentColor: "#f59e0b", width: 16, height: 16 }} />
                        <span style={{ color: "#d1d5db", fontSize: 13 }}>{val ? "Yes" : "No"}</span>
                      </label>
                    ) : f.type === "select" ? (
                      <select value={val} onChange={e => set(k, e.target.value)} style={inputStyle}>
                        {f.options.map(o => <option key={o} value={o}>{o === "" ? "— Select —" : o}</option>)}
                      </select>
                    ) : f.type === "textarea" ? (
                      <textarea value={val} onChange={e => set(k, e.target.value)}
                        rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                    ) : f.type === "scroll_picker" ? (
                      <ScrollPicker value={val} min={f.min} max={f.max} nullable={f.nullable} onChange={v => set(k, v)} />
                    ) : f.type === "star_rating" ? (
                      <div style={{ paddingTop: 4 }}><StarRating value={Number(val)} onChange={v => set(k, v)} /></div>
                    ) : f.type === "nullable_number" ? (
                      <input type="number" value={val === "N/A" ? "" : val} onChange={e => set(k, e.target.value)}
                        placeholder="—" style={inputStyle} />
                    ) : (
                      <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                        value={val} onChange={e => set(k, e.target.value)} style={inputStyle} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {listing.id ? (
            <button onClick={() => { if (confirm("Delete this listing?")) onDelete(form.id); }}
              style={{ background: "#7f1d1d", color: "#fca5a5", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>
              Delete
            </button>
          ) : <div />}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ background: "#1f2937", color: "#9ca3af", border: "1px solid #374151", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>
              Cancel
            </button>
            <button onClick={() => onSave(form)} disabled={saving}
              style={{ background: saving ? "#92400e" : "#f59e0b", color: "#1a1a1a", border: "none", borderRadius: 6, padding: "8px 20px", cursor: saving ? "default" : "pointer", fontSize: 13, fontWeight: 700 }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterNeighborhood, setFilterNeighborhood] = useState("All");
  const [sortBy, setSortBy] = useState("price");
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api("apartments?select=*&order=id.desc");
      setListings((data || []).map(fromDb));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  const save = async (form) => {
    setSaving(true);
    try {
      const payload = toDb(form);
      if (form.id) {
        await api(`apartments?id=eq.${form.id}`, {
          method: "PATCH", prefer: "return=minimal",
          body: JSON.stringify(payload),
        });
        setListings(ls => ls.map(l => l.id === form.id ? { ...form, lastUpdated: payload.last_updated } : l));
        showToast("Listing updated");
      } else {
        const result = await api("apartments?select=*", {
          method: "POST", prefer: "return=representation",
          body: JSON.stringify(payload),
        });
        setListings(ls => [fromDb(result[0]), ...ls]);
        showToast("Listing added");
      }
      setSelected(null);
    } catch (e) {
      showToast("Save failed: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    try {
      await api(`apartments?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
      setListings(ls => ls.filter(l => l.id !== id));
      setSelected(null);
      showToast("Listing deleted");
    } catch (e) {
      showToast("Delete failed: " + e.message, "error");
    }
  };

  const neighborhoods = useMemo(() => ["All", ...NEIGHBORHOODS], []);

  const filtered = useMemo(() => {
    let r = listings;
    if (filterStatus !== "All") r = r.filter(l => l.status === filterStatus);
    if (filterNeighborhood !== "All") r = r.filter(l => l.neighborhood === filterNeighborhood);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(l => (l.address + l.neighborhood + l.notes).toLowerCase().includes(q));
    }
    return [...r].sort((a, b) => {
      let av = a[sortBy] ?? "", bv = b[sortBy] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }, [listings, filterStatus, filterNeighborhood, search, sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const selectStyle = {
    background: "#1f2937", border: "1px solid #374151", borderRadius: 6,
    color: "#d1d5db", padding: "6px 10px", fontSize: 12, cursor: "pointer",
  };

  const colHeader = (label, col) => (
    <th onClick={() => toggleSort(col)} style={{ padding: "10px 12px", textAlign: "left", cursor: "pointer", userSelect: "none", color: sortBy === col ? "#f59e0b" : "#6b7280", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
      {label}{sortBy === col ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );

  const pricedListings = filtered.filter(l => l.price);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", color: "#f9fafb", fontFamily: "'Inter', system-ui, sans-serif", padding: "24px 20px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 400, margin: 0, color: "#f9fafb", letterSpacing: "-0.02em" }}>
              Colton & Skylar Apt Tracker
            </h1>
            <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>
              {listings.length} listings · {listings.filter(l => ["Applied", "Approved"].includes(l.status)).length} in motion
              {loading && " · syncing…"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={fetchListings} title="Refresh" style={{ background: "#1f2937", color: "#9ca3af", border: "1px solid #374151", borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontSize: 16 }}>
              ↻
            </button>
            <button onClick={() => setSelected(emptyListing())} style={{ background: "#f59e0b", color: "#1a1a1a", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
              + Add Listing
            </button>
          </div>
        </div>
      </div>

      <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.1em", marginBottom: 14, textTransform: "uppercase" }}>Pipeline</div>
        <PipelineBar listings={listings} />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <input placeholder="Search address, neighborhood, notes…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...selectStyle, flex: 1, minWidth: 200 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="All">All Statuses</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterNeighborhood} onChange={e => setFilterNeighborhood(e.target.value)} style={selectStyle}>
          {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#4b5563" }}>Loading from Supabase…</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ color: "#f87171", fontWeight: 600, marginBottom: 8 }}>Failed to load</div>
            <div style={{ color: "#6b7280", fontSize: 12, fontFamily: "monospace", background: "#1f2937", padding: 12, borderRadius: 6, maxWidth: 500, margin: "0 auto", wordBreak: "break-all" }}>{error}</div>
            <button onClick={fetchListings} style={{ marginTop: 16, background: "#1f2937", color: "#9ca3af", border: "1px solid #374151", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>Retry</button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1f2937" }}>
                {colHeader("Address", "address")}
                {colHeader("Neighborhood", "neighborhood")}
                {colHeader("Rent", "price")}
                {colHeader("Beds/Bath", "beds")}
                {colHeader("Sqft", "sqft")}
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#6b7280", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>Amenities</th>
                {colHeader("Available", "availableDate")}
                {colHeader("Status", "status")}
                {colHeader("Rating", "rating")}
                <th style={{ padding: "10px 12px", color: "#6b7280", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={l.id} onClick={() => setSelected(l)}
                  style={{ borderBottom: "1px solid #1a2235", cursor: "pointer", background: i % 2 === 0 ? "transparent" : "#0d1420" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1f2937"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "#0d1420"}
                >
                  <td style={{ padding: "12px 12px", fontSize: 13, color: "#e5e7eb", maxWidth: 180 }}>
                    <div style={{ fontWeight: 600 }}>{l.address}</div>
                    {l.noFee && <span style={{ fontSize: 10, color: "#10b981", fontWeight: 600 }}>NO FEE</span>}
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: "#9ca3af" }}>{l.neighborhood}</td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: "#f9fafb", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {l.price ? `$${Number(l.price).toLocaleString()}` : "—"}
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: "#9ca3af", whiteSpace: "nowrap" }}>
                    {l.beds === "Studio" ? "Studio" : l.beds ? `${l.beds}br` : "?"} / {l.baths || "?"}ba
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: "#9ca3af" }}>{l.sqft || "—"}</td>
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {l.doorman && <span title="Doorman" style={{ fontSize: 15 }}>🚪</span>}
                      {l.elevator && <span title="Elevator" style={{ fontSize: 15 }}>🛗</span>}
                      {l.gym && <span title="Gym" style={{ fontSize: 15 }}>🏋️</span>}
                      {(l.outdoor === "Private" || l.outdoor === "Shared") && <span title={`${l.outdoor} outdoor`} style={{ fontSize: 15 }}>🌿</span>}
                      {l.laundry === "In-unit" && <span title="In-unit laundry" style={{ fontSize: 15 }}>🫧</span>}
                      {l.laundry === "In-building" && <span title="In-building laundry" style={{ fontSize: 15 }}>👕</span>}
                      {l.storage && <span title="Storage" style={{ fontSize: 15 }}>📦</span>}
                    </div>
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>{l.availableDate || "—"}</td>
                  <td style={{ padding: "12px 12px" }}><Badge value={l.status} /></td>
                  <td style={{ padding: "12px 12px" }}>
                    {l.rating ? <StarRating value={Number(l.rating)} /> : <span style={{ color: "#4b5563", fontSize: 13 }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 12px" }} onClick={e => e.stopPropagation()}>
                    {l.link ? <a href={l.link} target="_blank" rel="noopener noreferrer" style={{ color: "#f59e0b", fontSize: 12, textDecoration: "none" }}>↗ View</a> : <span style={{ color: "#374151" }}>—</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#4b5563", fontSize: 14 }}>
                  No listings yet. Hit + Add Listing to get started.
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {pricedListings.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", gap: 24, color: "#6b7280", fontSize: 12, flexWrap: "wrap" }}>
          <span>Avg rent: <strong style={{ color: "#d1d5db" }}>${Math.round(pricedListings.reduce((s, l) => s + Number(l.price), 0) / pricedListings.length).toLocaleString()}</strong></span>
          <span>Range: <strong style={{ color: "#d1d5db" }}>${Math.min(...pricedListings.map(l => Number(l.price))).toLocaleString()} – ${Math.max(...pricedListings.map(l => Number(l.price))).toLocaleString()}</strong></span>
          <span>Showing {filtered.length} of {listings.length}</span>
        </div>
      )}

      {selected && <Modal listing={selected} onSave={save} onClose={() => setSelected(null)} onDelete={del} saving={saving} />}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
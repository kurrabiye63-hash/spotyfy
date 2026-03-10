export const statusColors = {
  aktif: { bg: "#d1fae5", text: "#065f46" },
  tükendi: { bg: "#fee2e2", text: "#991b1b" },
  "az stok": { bg: "#fef3c7", text: "#92400e" },
  kargoda: { bg: "#dbeafe", text: "#1e40af" },
  hazırlanıyor: { bg: "#fef3c7", text: "#92400e" },
  "teslim edildi": { bg: "#d1fae5", text: "#065f46" },
  pasif: { bg: "#f3f4f6", text: "#6b7280" },
  bitti: { bg: "#f3f4f6", text: "#6b7280" },
  taslak: { bg: "#fef9c3", text: "#a16207" },
  planlandı: { bg: "#dbeafe", text: "#1d4ed8" },
  gönderildi: { bg: "#dcfce7", text: "#15803d" },
  duraklatıldı: { bg: "#fee2e2", text: "#dc2626" },
};

export const StatusBadge = ({ status }) => {
  const c = statusColors[status] || { bg: "#f3f4f6", text: "#374151" };
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 600, letterSpacing: 0.3
    }}>{status}</span>
  );
};

export const StatCard = ({ icon, label, value, sub, color }) => (
  <div style={{
    background: "var(--bg-secondary)", borderRadius: 16, padding: "22px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)", flex: 1, minWidth: 160,
    borderTop: `4px solid ${color}`,
    transition: "var(--transition)"
  }}>
    <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Syne', sans-serif" }}>{value}</div>
    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 12, color: color, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
  </div>
);

export const MetricCard = ({ icon, label, value, sub, accent }) => (
  <div style={{ background: "var(--bg-secondary)", borderRadius: 14, padding: "20px 22px", flex: 1, minWidth: 150, border: "1px solid var(--border-color)", position: "relative", overflow: "hidden", transition: "var(--transition)" }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: accent, borderRadius: "0 14px 0 80px", opacity: 0.12 }} />
    <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>{value}</div>
    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 12, color: accent, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
  </div>
);

export const ProgressBar = ({ value, max, color }) => (
  <div style={{ height: 6, background: "#1f1f1f", borderRadius: 3, overflow: "hidden", flex: 1 }}>
    <div style={{ height: "100%", width: `${Math.min((value / max) * 100, 100)}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
  </div>
);

export const LoadingSpinner = ({ font = "'Syne', sans-serif" }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ border: '4px solid rgba(0,0,0,0.1)', borderTop: '4px solid #e8ff47', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
      <p style={{ fontFamily: font, fontSize: 18 }}>Veriler Yükleniyor...</p>
    </div>
  </div>
);

export const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1.5px solid var(--border-color)", fontSize: 14,
  outline: "none", boxSizing: "border-box", marginBottom: 10,
  background: "var(--bg-secondary)", color: "var(--text-primary)",
  transition: "var(--transition)"
};

export const btnPrimary = {
  background: "var(--text-primary)", color: "var(--bg-primary)", border: "none",
  padding: "10px 22px", borderRadius: 8, cursor: "pointer",
  fontSize: 14, fontWeight: 700, transition: "var(--transition)"
};

export const btnSecondary = {
  background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)",
  padding: "10px 18px", borderRadius: 8, cursor: "pointer",
  fontSize: 14, fontWeight: 600, marginRight: 8, transition: "var(--transition)"
};

export const btnGhost = {
  background: "transparent", color: "var(--text-secondary)",
  border: "1.5px solid var(--border-color)", padding: "9px 18px",
  borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
  transition: "var(--transition)"
};

export const selectStyle = { ...inputStyle, cursor: "pointer" };

export const platformColors = { Meta: "#1877f2", TikTok: "#010101", "E-posta": "#f59e0b", SMS: "#10b981" };
export const platformIcons = { Meta: "🔵", TikTok: "🎵", "E-posta": "📧", SMS: "💬" };

export const deleteBtn = {
  background: "none", border: "1px solid #fee2e2", borderRadius: 6,
  padding: "4px 10px", cursor: "pointer", fontSize: 12, color: "#dc2626"
};

export const editBtn = {
  background: "none", border: "1px solid var(--border-color)", borderRadius: 6,
  padding: "4px 10px", cursor: "pointer", fontSize: 12, color: "var(--text-secondary)"
};

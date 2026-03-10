import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useLogs } from "../context/LogContext";
import { StatusBadge, MetricCard, ProgressBar, LoadingSpinner, inputStyle, selectStyle, btnGhost, deleteBtn, platformColors, platformIcons } from "../components/ui";

const btnYellow = { background: "#e8ff47", color: "#000", border: "none", padding: "10px 22px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800, letterSpacing: 0.3 };

export default function MarketingPanel() {
  const { addLog } = useLogs();
  const [tab, setTab] = useState("overview");
  const [campaigns, setCampaigns] = useState([]);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showNewEmail, setShowNewEmail] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [newCampaign, setNewCampaign] = useState({ name: "", platform: "Meta", type: "Satış", budget: "", start: "", end: "" });
  const [newEmail, setNewEmail] = useState({ subject: "", type: "E-posta", date: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: cData } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      const { data: eData } = await supabase.from('outreach').select('*').order('created_at', { ascending: false });
      if (cData) setCampaigns(cData);
      if (eData) setEmails(eData);
      addLog("Marketing verileri güncellendi", "success");
    } catch (error) {
      console.error("Error fetching data:", error);
      addLog(`Marketing veri hatası: ${error.message}`, "error");
    } finally { setLoading(false); }
  };

  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConv = campaigns.reduce((s, c) => s + c.conversions, 0);
  const overallROAS = totalSpent > 0 ? (totalRevenue / totalSpent).toFixed(2) : "—";
  const activeCampaigns = campaigns.filter(c => c.impressions > 0);
  const avgCTR = activeCampaigns.length > 0 ? activeCampaigns.reduce((s, c) => s + (c.clicks / c.impressions) * 100, 0) / activeCampaigns.length : 0;

  const deleteCampaign = async (id) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (!error) { addLog("Kampanya silindi", "success"); fetchData(); }
    else addLog(`Kampanya silme hatası: ${error.message}`, "error");
  };

  const updateCampaign = async () => {
    if (!editingCampaign) return;
    const updates = { name: editingCampaign.name, platform: editingCampaign.platform, type: editingCampaign.type, budget: +editingCampaign.budget || 0, start: editingCampaign.start, end: editingCampaign.end, status: editingCampaign.status };
    const { error } = await supabase.from('campaigns').update(updates).eq('id', editingCampaign.id);
    if (!error) { addLog(`Kampanya güncellendi: ${updates.name}`, "success"); fetchData(); setEditingCampaign(null); }
    else addLog(`Kampanya güncelleme hatası: ${error.message}`, "error");
  };

  const deleteEmail = async (id) => {
    const { error } = await supabase.from('outreach').delete().eq('id', id);
    if (!error) { addLog("Outreach kaydı silindi", "success"); fetchData(); }
    else addLog(`Outreach silme hatası: ${error.message}`, "error");
  };

  const addCampaign = async () => {
    if (!newCampaign.name || !newCampaign.budget) return;
    const item = { ...newCampaign, budget: +newCampaign.budget, spent: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0, status: "taslak" };
    const { error } = await supabase.from('campaigns').insert([item]);
    if (!error) {
      addLog(`Yeni kampanya oluşturuldu: ${item.name}`, "success");
      fetchData(); setNewCampaign({ name: "", platform: "Meta", type: "Satış", budget: "", start: "", end: "" }); setShowNewCampaign(false);
    } else addLog(`Kampanya oluşturma hatası: ${error.message}`, "error");
  };

  const addEmail = async () => {
    if (!newEmail.subject) return;
    const item = { ...newEmail, sent: 0, opened: 0, clicked: 0, revenue: 0, status: "taslak" };
    const { error } = await supabase.from('outreach').insert([item]);
    if (!error) {
      addLog(`Yeni ${item.type} taslağı oluşturuldu: ${item.subject}`, "success");
      fetchData(); setNewEmail({ subject: "", type: "E-posta", date: "" }); setShowNewEmail(false);
    } else addLog(`Outreach oluşturma hatası: ${error.message}`, "error");
  };

  const tabs = [
    { key: "overview", label: "📊 Genel Bakış" },
    { key: "campaigns", label: "🎯 Kampanyalar" },
    { key: "email", label: "📧 E-posta & SMS" },
    { key: "roi", label: "💹 ROI Analizi" },
  ];

  const campaignFields = [
    { key: "name", label: "Kampanya Adı *", placeholder: "örn: Yaz Sezonu İndirimi" },
    { key: "budget", label: "Bütçe (₺) *", placeholder: "örn: 1500" },
    { key: "start", label: "Başlangıç Tarihi", placeholder: "örn: 15 Mar" },
    { key: "end", label: "Bitiş Tarihi", placeholder: "örn: 30 Mar" },
  ];

  const campaignSelects = [
    { key: "platform", label: "Platform", options: ["Meta", "TikTok"] },
    { key: "type", label: "Kampanya Türü", options: ["Satış", "Bilinirlik", "Dönüşüm", "Trafik"] },
  ];

  if (loading) return <LoadingSpinner font="'Bebas Neue', sans-serif" />;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", padding: "20px 0", color: "var(--text-primary)", transition: "var(--transition)" }}>
      <div style={{ borderBottom: "1px solid var(--border-color)", display: "flex", padding: "0 32px", overflowX: "auto", marginBottom: "20px" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "16px 20px", fontSize: 13,
            fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? "#e8ff47" : "var(--text-secondary)",
            borderBottom: tab === t.key ? "2px solid #e8ff47" : "2px solid transparent", whiteSpace: "nowrap", transition: "all 0.15s"
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1200 }} className="fade-up">
        {tab === "overview" && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 2, color: "#e8ff47", marginBottom: 4 }}>GENEL BAKIŞ</h2>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 24 }}>Tüm kanalların performansı</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
              <MetricCard icon="💸" label="Toplam Harcama" value={`₺${totalSpent.toLocaleString()}`} sub="Tüm kampanyalar" accent="#e8ff47" />
              <MetricCard icon="📈" label="Toplam Gelir" value={`₺${totalRevenue.toLocaleString()}`} sub={`ROAS: ${overallROAS}x`} accent="#60a5fa" />
              <MetricCard icon="🖱️" label="Toplam Tıklama" value={totalClicks.toLocaleString()} sub={`Ort. CTR: %${avgCTR.toFixed(1)}`} accent="#f472b6" />
              <MetricCard icon="✅" label="Dönüşüm" value={totalConv} sub={totalClicks > 0 ? `${((totalConv / totalClicks) * 100).toFixed(1)}% oran` : "—"} accent="#34d399" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div style={{ background: "#0f0f0f", borderRadius: 16, padding: 24, border: "1px solid #1a1a1a" }}>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 1.5, color: "#fff", marginBottom: 20 }}>PLATFORM HARCAMASI</h3>
                {["Meta", "TikTok"].map(platform => {
                  const pc = campaigns.filter(c => c.platform === platform);
                  const pSpent = pc.reduce((s, c) => s + c.spent, 0);
                  const pRev = pc.reduce((s, c) => s + c.revenue, 0);
                  return (
                    <div key={platform} style={{ marginBottom: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{platformIcons[platform]} {platform}</span>
                        <div style={{ fontSize: 12, color: "#888" }}>₺{pSpent.toLocaleString()} harcandı · <span style={{ color: "#34d399" }}>₺{pRev.toLocaleString()} gelir</span></div>
                      </div>
                      <ProgressBar value={pSpent} max={totalSpent || 1} color={platform === "Meta" ? "#1877f2" : "#e8ff47"} />
                    </div>
                  );
                })}
              </div>
              <div style={{ background: "var(--bg-secondary)", borderRadius: 16, padding: 24, border: "1px solid var(--border-color)" }}>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 1.5, color: "var(--text-primary)", marginBottom: 20 }}>AKTİF KAMPANYALAR</h3>
                {campaigns.filter(c => c.status === "aktif").map(c => (
                  <div key={c.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                      <span style={{ fontSize: 12, color: "#e8ff47", fontWeight: 700 }}>%{((c.spent / c.budget) * 100).toFixed(0)}</span>
                    </div>
                    <ProgressBar value={c.spent} max={c.budget} color="#e8ff47" />
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>₺{c.spent} / ₺{c.budget} · {c.platform}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "var(--bg-secondary)", borderRadius: 16, padding: 24, border: "1px solid var(--border-color)" }}>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 1.5, marginBottom: 16 }}>SON E-POSTA & SMS KAMPANYALARı</h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {emails.filter(e => e.status === "gönderildi").map(e => (
                  <div key={e.id} style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "14px 18px", flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11, color: platformColors[e.type] || "var(--text-secondary)", fontWeight: 700, marginBottom: 4 }}>{platformIcons[e.type]} {e.type}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "var(--text-primary)" }}>{e.subject}</div>
                    <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
                      <span style={{ color: "var(--text-secondary)" }}>📤 {e.sent.toLocaleString()}</span>
                      <span style={{ color: "#60a5fa" }}>👁 %{((e.opened / e.sent) * 100).toFixed(0)}</span>
                      <span style={{ color: "#34d399" }}>₺{e.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "campaigns" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 2, color: "#e8ff47", marginBottom: 4 }}>KAMPANYALAR</h2>
                <p style={{ color: "#555", fontSize: 13 }}>Meta & TikTok reklam kampanyaları</p>
              </div>
              <button style={btnYellow} onClick={() => setShowNewCampaign(true)}>+ Yeni Kampanya</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {campaigns.map(c => {
                const roas = c.spent > 0 ? (c.revenue / c.spent).toFixed(2) : "—";
                const budgetPct = c.budget > 0 ? (c.spent / c.budget) * 100 : 0;
                return (
                  <div key={c.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 16, padding: "20px 24px", borderLeft: `3px solid ${platformColors[c.platform] || "#333"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 18 }}>{platformIcons[c.platform]}</span>
                          <span style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</span>
                          <StatusBadge status={c.status} />
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.platform} · {c.type} · {c.start} – {c.end}</div>
                      </div>
                      <div style={{ display: "flex", gap: 20 }}>
                        {[
                          { label: "Harcama", value: `₺${c.spent.toLocaleString()}`, sub: `/ ₺${c.budget.toLocaleString()}` },
                          { label: "Tıklama", value: c.clicks.toLocaleString() },
                          { label: "Dönüşüm", value: c.conversions },
                          { label: "Gelir", value: `₺${c.revenue.toLocaleString()}`, highlight: true },
                          { label: "ROAS", value: `${roas}x`, highlight: true },
                        ].map(m => (
                          <div key={m.label} style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>{m.label}</div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: m.highlight ? "#e8ff47" : "var(--text-primary)" }}>{m.value}</div>
                            {m.sub && <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{m.sub}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Bütçe kullanımı %{budgetPct.toFixed(0)}</div>
                      <ProgressBar value={c.spent} max={c.budget || 1} color={platformColors[c.platform]} />
                      <button onClick={() => setEditingCampaign({ ...c })} style={{ ...btnGhost, padding: "5px 12px", fontSize: 12 }}>✏️</button>
                      <button onClick={() => deleteCampaign(c.id)} style={{ ...deleteBtn, borderRadius: 8 }}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {showNewCampaign && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 20, padding: 32, width: 440, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
                  <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: "#e8ff47", marginBottom: 20 }}>YENİ KAMPANYA</h3>
                  {campaignFields.map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4, letterSpacing: 0.5 }}>{f.label}</label>
                      <input placeholder={f.placeholder} value={newCampaign[f.key]} onChange={e => setNewCampaign({ ...newCampaign, [f.key]: e.target.value })} style={inputStyle} />
                    </div>
                  ))}
                  {campaignSelects.map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4, letterSpacing: 0.5 }}>{f.label}</label>
                      <select value={newCampaign[f.key]} onChange={e => setNewCampaign({ ...newCampaign, [f.key]: e.target.value })} style={selectStyle}>
                        {f.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button style={btnGhost} onClick={() => setShowNewCampaign(false)}>İptal</button>
                    <button style={{ ...btnYellow, flex: 1 }} onClick={addCampaign}>Kampanya Oluştur</button>
                  </div>
                </div>
              </div>
            )}

            {editingCampaign && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 20, padding: 32, width: 440, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
                  <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: "#e8ff47", marginBottom: 20 }}>KAMPANYA DÜZENLE</h3>
                  {campaignFields.map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4, letterSpacing: 0.5 }}>{f.label}</label>
                      <input placeholder={f.placeholder} value={editingCampaign[f.key]} onChange={e => setEditingCampaign({ ...editingCampaign, [f.key]: e.target.value })} style={inputStyle} />
                    </div>
                  ))}
                  {[...campaignSelects, { key: "status", label: "Durum", options: ["taslak", "aktif", "duraklatıldı", "bitti"] }].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4, letterSpacing: 0.5 }}>{f.label}</label>
                      <select value={editingCampaign[f.key]} onChange={e => setEditingCampaign({ ...editingCampaign, [f.key]: e.target.value })} style={selectStyle}>
                        {f.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button style={btnGhost} onClick={() => setEditingCampaign(null)}>İptal</button>
                    <button style={{ ...btnYellow, flex: 1 }} onClick={updateCampaign}>Güncelle</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "email" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 2, color: "#e8ff47", marginBottom: 4 }}>E-POSTA & SMS</h2>
                <p style={{ color: "#555", fontSize: 13 }}>Müşteri iletişim kampanyaları</p>
              </div>
              <button style={btnYellow} onClick={() => setShowNewEmail(true)}>+ Yeni Mesaj</button>
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
              {[
                { icon: "📤", label: "Toplam Gönderim", value: emails.reduce((s, e) => s + e.sent, 0).toLocaleString() },
                { icon: "👁", label: "Ort. Açılma Oranı", value: `%${(emails.filter(e => e.sent > 0).reduce((s, e) => s + (e.opened / e.sent) * 100, 0) / emails.filter(e => e.sent > 0).length || 0).toFixed(0)}` },
                { icon: "🖱️", label: "Ort. Tıklama Oranı", value: `%${(emails.filter(e => e.sent > 0).reduce((s, e) => s + (e.clicked / e.sent) * 100, 0) / emails.filter(e => e.sent > 0).length || 0).toFixed(0)}` },
                { icon: "💰", label: "E-posta Geliri", value: `₺${emails.reduce((s, e) => s + e.revenue, 0).toLocaleString()}` },
              ].map(m => (
                <div key={m.label} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 20px", flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{m.icon}</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "#e8ff47", letterSpacing: 1 }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {emails.map(e => (
                <div key={e.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", borderLeft: `3px solid ${platformColors[e.type] || "#333"}` }}>
                  <div style={{ fontSize: 24 }}>{platformIcons[e.type]}</div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3, color: "var(--text-primary)" }}>{e.subject}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{e.type} · {e.date}</div>
                  </div>
                  {e.sent > 0 ? (
                    <div style={{ display: "flex", gap: 20 }}>
                      {[
                        { label: "Gönderildi", value: e.sent.toLocaleString(), color: "var(--text-primary)" },
                        { label: "Açıldı", value: `%${((e.opened / e.sent) * 100).toFixed(0)}`, color: "#60a5fa" },
                        { label: "Tıklandı", value: `%${((e.clicked / e.sent) * 100).toFixed(0)}`, color: "#f472b6" },
                        { label: "Gelir", value: `₺${e.revenue.toLocaleString()}`, color: "#34d399" },
                      ].map(m => (
                        <div key={m.label} style={{ textAlign: "center" }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: m.color }}>{m.value}</div>
                          <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 1 }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                  ) : <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Henüz gönderilmedi</div>}
                  <StatusBadge status={e.status} />
                  <button onClick={() => deleteEmail(e.id)} style={{ ...deleteBtn, borderRadius: 8 }}>🗑️</button>
                </div>
              ))}
            </div>
            {showNewEmail && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 20, padding: 32, width: 420 }}>
                  <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: "#e8ff47", marginBottom: 20 }}>YENİ MESAJ</h3>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Konu / Mesaj *</label>
                  <input placeholder="örn: %20 İndirim — Sadece bugün!" value={newEmail.subject} onChange={e => setNewEmail({ ...newEmail, subject: e.target.value })} style={inputStyle} />
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Kanal</label>
                  <select value={newEmail.type} onChange={e => setNewEmail({ ...newEmail, type: e.target.value })} style={selectStyle}>
                    <option>E-posta</option><option>SMS</option>
                  </select>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Gönderim Tarihi</label>
                  <input placeholder="örn: 20 Mar" value={newEmail.date} onChange={e => setNewEmail({ ...newEmail, date: e.target.value })} style={inputStyle} />
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button style={btnGhost} onClick={() => setShowNewEmail(false)}>İptal</button>
                    <button style={{ ...btnYellow, flex: 1 }} onClick={addEmail}>Oluştur</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "roi" && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 2, color: "#e8ff47", marginBottom: 4 }}>ROI ANALİZİ</h2>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 24 }}>Kanal bazlı reklam getiri analizi</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
              {["Meta", "TikTok"].map(platform => {
                const pc = campaigns.filter(c => c.platform === platform && c.spent > 0);
                const spent = pc.reduce((s, c) => s + c.spent, 0);
                const rev = pc.reduce((s, c) => s + c.revenue, 0);
                const roas = spent > 0 ? (rev / spent).toFixed(2) : "—";
                const conv = pc.reduce((s, c) => s + c.conversions, 0);
                const cpa = conv > 0 ? (spent / conv).toFixed(0) : "—";
                return (
                  <div key={platform} style={{ background: "var(--bg-secondary)", border: `1px solid ${platformColors[platform]}33`, borderRadius: 16, padding: 24, flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: 20 }}>{platformIcons[platform]}</span>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 1.5, color: platformColors[platform] }}>{platform}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      {[
                        { label: "Harcama", value: `₺${spent.toLocaleString()}` },
                        { label: "Gelir", value: `₺${rev.toLocaleString()}`, highlight: true },
                        { label: "ROAS", value: `${roas}x`, highlight: true },
                        { label: "CPA (₺/dönüşüm)", value: `₺${cpa}` },
                      ].map(m => (
                        <div key={m.label} style={{ background: "var(--bg-primary)", borderRadius: 10, padding: "12px 14px" }}>
                          <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 4 }}>{m.label}</div>
                          <div style={{ fontWeight: 800, fontSize: 18, color: m.highlight ? "#e8ff47" : "var(--text-primary)" }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)" }}>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 1.5, color: "var(--text-primary)" }}>KAMPANYA PERFORMANS TABLOSU</h3>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  {["Kampanya", "Platform", "Harcama", "Gelir", "ROAS", "CTR", "Dönüşüm", "CPA"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{campaigns.filter(c => c.spent > 0).map(c => {
                  const roas = (c.revenue / c.spent).toFixed(2);
                  const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "—";
                  const cpa = c.conversions > 0 ? (c.spent / c.conversions).toFixed(0) : "—";
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-primary)" }}>{c.name}</td>
                      <td style={{ padding: "14px 16px" }}><span style={{ color: platformColors[c.platform], fontWeight: 600 }}>{platformIcons[c.platform]} {c.platform}</span></td>
                      <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>₺{c.spent.toLocaleString()}</td>
                      <td style={{ padding: "14px 16px", color: "#34d399", fontWeight: 700 }}>₺{c.revenue.toLocaleString()}</td>
                      <td style={{ padding: "14px 16px" }}><span style={{ color: +roas >= 3 ? "#e8ff47" : +roas >= 2 ? "#f59e0b" : "#f87171", fontWeight: 800, fontSize: 15 }}>{roas}x</span></td>
                      <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>%{ctr}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>{c.conversions}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>₺{cpa}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
            <div style={{ marginTop: 20, background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 1.5, marginBottom: 16, color: "#e8ff47" }}>💡 OPTİMİZASYON ÖNERİLERİ</h3>
              {[
                { icon: "🎯", tip: "ROAS 3x altındaki kampanyaları duraklatın veya hedef kitlesini daraltın." },
                { icon: "📊", tip: "TikTok kampanyalarında CTR daha yüksek — görsel içerik bütçesini artırın." },
                { icon: "🔁", tip: "Yeniden hedefleme kampanyası en düşük CPA'ya sahip — bütçeyi yükseltin." },
                { icon: "📧", tip: "E-posta açılma oranı %40 — segmentasyon ile artırılabilir." },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12, padding: "12px 16px", background: "var(--bg-primary)", borderRadius: 10 }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{t.tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

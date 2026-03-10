import { useState } from "react";

const mockProducts = [
  { id: 1, name: "Deri Cüzdan", supplier: "Tedarikçi A", cost: 85, price: 249, stock: 42, status: "aktif", orders: 18 },
  { id: 2, name: "Kablosuz Kulaklık", supplier: "Tedarikçi B", cost: 320, price: 799, stock: 15, status: "aktif", orders: 34 },
  { id: 3, name: "Ahşap Saat", supplier: "Tedarikçi A", cost: 210, price: 549, stock: 0, status: "tükendi", orders: 7 },
  { id: 4, name: "Seramik Bardak", supplier: "Tedarikçi C", cost: 45, price: 129, stock: 88, status: "aktif", orders: 52 },
  { id: 5, name: "Çanta (Hasır)", supplier: "Tedarikçi B", cost: 130, price: 349, stock: 5, status: "az stok", orders: 23 },
];

const mockOrders = [
  { id: "#1042", customer: "Ayşe K.", product: "Deri Cüzdan", date: "08 Mar", total: 249, status: "kargoda" },
  { id: "#1041", customer: "Mehmet T.", product: "Kablosuz Kulaklık", date: "08 Mar", total: 799, status: "hazırlanıyor" },
  { id: "#1040", customer: "Zeynep A.", product: "Seramik Bardak", date: "07 Mar", total: 258, status: "teslim edildi" },
  { id: "#1039", customer: "Can D.", product: "Çanta (Hasır)", date: "07 Mar", total: 349, status: "teslim edildi" },
  { id: "#1038", customer: "Elif S.", product: "Kablosuz Kulaklık", date: "06 Mar", total: 799, status: "teslim edildi" },
];

const mockSuppliers = [
  { id: 1, name: "Tedarikçi A", contact: "Ali Yılmaz", phone: "+90 532 111 2233", products: 12, rating: 4.8, status: "aktif" },
  { id: 2, name: "Tedarikçi B", contact: "Fatma Çelik", phone: "+90 542 333 4455", products: 8, rating: 4.5, status: "aktif" },
  { id: 3, name: "Tedarikçi C", contact: "Hasan Kaya", phone: "+90 555 666 7788", products: 5, rating: 3.9, status: "pasif" },
];

const statusColors = {
  aktif: { bg: "#d1fae5", text: "#065f46" },
  tükendi: { bg: "#fee2e2", text: "#991b1b" },
  "az stok": { bg: "#fef3c7", text: "#92400e" },
  kargoda: { bg: "#dbeafe", text: "#1e40af" },
  hazırlanıyor: { bg: "#fef3c7", text: "#92400e" },
  "teslim edildi": { bg: "#d1fae5", text: "#065f46" },
  pasif: { bg: "#f3f4f6", text: "#6b7280" },
};

const StatusBadge = ({ status }) => {
  const c = statusColors[status] || { bg: "#f3f4f6", text: "#374151" };
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 600, letterSpacing: 0.3
    }}>{status}</span>
  );
};

const StatCard = ({ icon, label, value, sub, color }) => (
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

export default function DropshippingPanel() {
  const [tab, setTab] = useState("dashboard");
  const [products, setProducts] = useState(mockProducts);
  const [suppliers] = useState(mockSuppliers);
  const [orders] = useState(mockOrders);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", supplier: "", cost: "", price: "", stock: "" });
  const [newSupplier, setNewSupplier] = useState({ name: "", contact: "", phone: "" });
  const [search, setSearch] = useState("");

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalProfit = products.reduce((s, p) => s + (p.price - p.cost) * p.orders, 0);
  const activeProducts = products.filter(p => p.status === "aktif").length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const addProduct = () => {
    if (!newProduct.name) return;
    setProducts([...products, {
      id: products.length + 1,
      name: newProduct.name,
      supplier: newProduct.supplier || "—",
      cost: +newProduct.cost || 0,
      price: +newProduct.price || 0,
      stock: +newProduct.stock || 0,
      status: +newProduct.stock > 5 ? "aktif" : +newProduct.stock > 0 ? "az stok" : "tükendi",
      orders: 0
    }]);
    setNewProduct({ name: "", supplier: "", cost: "", price: "", stock: "" });
    setShowAddProduct(false);
  };

  const tabs = [
    { key: "dashboard", label: "📊 Dashboard" },
    { key: "products", label: "📦 Ürünler" },
    { key: "orders", label: "🛒 Siparişler" },
    { key: "suppliers", label: "🏭 Tedarikçiler" },
    { key: "pricing", label: "💰 Fiyatlandırma" },
  ];

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1.5px solid var(--border-color)", fontSize: 14,
    outline: "none", boxSizing: "border-box", marginBottom: 10,
    background: "var(--bg-secondary)", color: "var(--text-primary)",
    transition: "var(--transition)"
  };

  const btnPrimary = {
    background: "var(--text-primary)", color: "var(--bg-primary)", border: "none",
    padding: "10px 22px", borderRadius: 8, cursor: "pointer",
    fontSize: 14, fontWeight: 700,
    transition: "var(--transition)"
  };

  const btnSecondary = {
    background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)",
    padding: "10px 18px", borderRadius: 8, cursor: "pointer",
    fontSize: 14, fontWeight: 600, marginRight: 8,
    transition: "var(--transition)"
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      padding: "20px 0",
    }}>
      <div style={{
        background: "var(--bg-secondary)", borderBottom: "1.5px solid var(--border-color)",
        display: "flex", gap: 0, padding: "0 32px", overflowX: "auto",
        marginBottom: "20px",
        transition: "var(--transition)"
      }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "16px 20px", fontSize: 14, fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? "var(--text-primary)" : "var(--text-secondary)",
            borderBottom: tab === t.key ? "2.5px solid var(--text-primary)" : "2.5px solid transparent",
            whiteSpace: "nowrap", transition: "all 0.15s"
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1200 }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Genel Bakış
            </h2>
            <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>Mağazanın anlık durumu</p>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
              <StatCard icon="💸" label="Toplam Gelir" value={`₺${totalRevenue.toLocaleString()}`} sub="Son 5 sipariş" color="#a3e635" />
              <StatCard icon="📈" label="Tahmini Kâr" value={`₺${totalProfit.toLocaleString()}`} sub="Tüm ürünler" color="#60a5fa" />
              <StatCard icon="📦" label="Aktif Ürün" value={activeProducts} sub={`${products.length} toplam`} color="#f59e0b" />
              <StatCard icon="🏭" label="Tedarikçi" value={suppliers.filter(s => s.status === "aktif").length} sub="Aktif" color="#a78bfa" />
            </div>

            {/* Son Siparişler */}
            <div style={{ background: "var(--bg-secondary)", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "var(--transition)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>Son Siparişler</h3>
                <button onClick={() => setTab("orders")} style={{ ...btnSecondary, padding: "6px 14px", fontSize: 13 }}>
                  Tümünü Gör →
                </button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                    {["Sipariş", "Müşteri", "Ürün", "Tutar", "Durum"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#9ca3af", fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 3).map(o => (
                    <tr key={o.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "12px 12px", fontWeight: 700, color: "var(--text-primary)" }}>{o.id}</td>
                      <td style={{ padding: "12px 12px", color: "var(--text-primary)" }}>{o.customer}</td>
                      <td style={{ padding: "12px 12px", color: "var(--text-secondary)" }}>{o.product}</td>
                      <td style={{ padding: "12px 12px", fontWeight: 700, color: "var(--text-primary)" }}>₺{o.total}</td>
                      <td style={{ padding: "12px 12px" }}><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stok Uyarıları */}
            {products.filter(p => p.stock <= 5).length > 0 && (
              <div style={{
                marginTop: 20, background: "var(--bg-secondary)", borderRadius: 16,
                padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "var(--transition)"
              }}>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 14, color: "var(--text-primary)" }}>
                  ⚠️ Stok Uyarıları
                </h3>
                {products.filter(p => p.stock <= 5).map(p => (
                  <div key={p.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", background: p.stock === 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
                    borderRadius: 10, marginBottom: 8, transition: "var(--transition)"
                  }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.name}</span>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{p.supplier}</span>
                      <StatusBadge status={p.status} />
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{p.stock} adet</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ÜRÜNLER */}
        {tab === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 4, color: "var(--text-primary)" }}>Ürünler</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{products.length} ürün listelendi</p>
              </div>
              <button style={btnPrimary} onClick={() => setShowAddProduct(true)}>+ Yeni Ürün</button>
            </div>

            <input
              placeholder="🔍 Ürün veya tedarikçi ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, maxWidth: 320, marginBottom: 16 }}
            />

            <div style={{ background: "var(--bg-secondary)", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "var(--transition)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "var(--bg-primary)", borderBottom: "1.5px solid var(--border-color)", transition: "var(--transition)" }}>
                    {["Ürün Adı", "Tedarikçi", "Maliyet", "Satış Fiyatı", "Kâr Marjı", "Stok", "Satış", "Durum"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const margin = (((p.price - p.cost) / p.price) * 100).toFixed(0);
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-primary)" }}>{p.name}</td>
                        <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>{p.supplier}</td>
                        <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>₺{p.cost}</td>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-primary)" }}>₺{p.price}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            background: +margin > 50 ? "#d1fae5" : +margin > 30 ? "#fef3c7" : "#fee2e2",
                            color: +margin > 50 ? "#065f46" : +margin > 30 ? "#92400e" : "#991b1b",
                            padding: "3px 8px", borderRadius: 20, fontWeight: 700, fontSize: 12
                          }}>%{margin}</span>
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: p.stock <= 5 ? 700 : 400, color: p.stock <= 5 ? "#dc2626" : "var(--text-primary)" }}>
                          {p.stock}
                        </td>
                        <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>{p.orders}</td>
                        <td style={{ padding: "14px 16px" }}><StatusBadge status={p.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal */}
            {showAddProduct && (
              <div style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999
              }}>
                <div style={{ background: "var(--bg-secondary)", borderRadius: 20, padding: 32, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", transition: "var(--transition)" }}>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, marginBottom: 20, color: "var(--text-primary)" }}>Yeni Ürün Ekle</h3>
                  {[
                    { key: "name", label: "Ürün Adı *", placeholder: "örn: Deri Cüzdan" },
                    { key: "supplier", label: "Tedarikçi", placeholder: "örn: Tedarikçi A" },
                    { key: "cost", label: "Maliyet Fiyatı (₺)", placeholder: "örn: 85" },
                    { key: "price", label: "Satış Fiyatı (₺)", placeholder: "örn: 249" },
                    { key: "stock", label: "Stok Adedi", placeholder: "örn: 50" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>{f.label}</label>
                      <input
                        placeholder={f.placeholder}
                        value={newProduct[f.key]}
                        onChange={e => setNewProduct({ ...newProduct, [f.key]: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                  {newProduct.cost && newProduct.price && (
                    <div style={{ background: "rgba(21, 128, 61, 0.1)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                      <span style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>
                        💰 Tahmini kâr marjı: %{((( +newProduct.price - +newProduct.cost) / +newProduct.price) * 100).toFixed(0)}
                        &nbsp;(₺{+newProduct.price - +newProduct.cost} / ürün)
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                    <button style={btnSecondary} onClick={() => setShowAddProduct(false)}>İptal</button>
                    <button style={btnPrimary} onClick={addProduct}>Ekle</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SİPARİŞLER */}
        {tab === "orders" && (
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 6, color: "var(--text-primary)" }}>Siparişler</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>{orders.length} sipariş</p>
            <div style={{ background: "var(--bg-secondary)", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "var(--transition)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "var(--bg-primary)", borderBottom: "1.5px solid var(--border-color)", transition: "var(--transition)" }}>
                    {["Sipariş No", "Müşteri", "Ürün", "Tarih", "Tutar", "Durum"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-primary)" }}>{o.id}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>{o.customer}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>{o.product}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>{o.date}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-primary)" }}>₺{o.total}</td>
                      <td style={{ padding: "14px 16px" }}><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TEDARİKÇİLER */}
        {tab === "suppliers" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Tedarikçiler</h2>
                <p style={{ color: "#6b7280", fontSize: 14 }}>{suppliers.length} tedarikçi kayıtlı</p>
              </div>
              <button style={btnPrimary} onClick={() => setShowAddSupplier(true)}>+ Yeni Tedarikçi</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {suppliers.map(s => (
                <div key={s.id} style={{
                  background: "var(--bg-secondary)", borderRadius: 16, padding: 24,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  borderLeft: `4px solid ${s.status === "aktif" ? "#a3e635" : "var(--border-color)"}`,
                  transition: "var(--transition)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 2, color: "var(--text-primary)" }}>{s.name}</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>{s.contact}</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 2 }}>
                    <div>📞 {s.phone}</div>
                    <div>📦 {s.products} ürün</div>
                    <div>⭐ {s.rating} / 5.0</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button style={{ ...btnSecondary, flex: 1, textAlign: "center" }}>Düzenle</button>
                    <button style={{ ...btnPrimary, flex: 1, textAlign: "center" }}>İletişim</button>
                  </div>
                </div>
              ))}
            </div>

            {showAddSupplier && (
              <div style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999
              }}>
                <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, marginBottom: 20 }}>Yeni Tedarikçi Ekle</h3>
                  {[
                    { key: "name", label: "Firma Adı *", placeholder: "örn: Tedarikçi D" },
                    { key: "contact", label: "İletişim Kişisi", placeholder: "örn: Ahmet Yılmaz" },
                    { key: "phone", label: "Telefon", placeholder: "+90 5xx xxx xxxx" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{f.label}</label>
                      <input
                        placeholder={f.placeholder}
                        value={newSupplier[f.key]}
                        onChange={e => setNewSupplier({ ...newSupplier, [f.key]: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                    <button style={btnSecondary} onClick={() => setShowAddSupplier(false)}>İptal</button>
                    <button style={btnPrimary} onClick={() => setShowAddSupplier(false)}>Ekle</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FİYATLANDIRMA */}
        {tab === "pricing" && (
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 6, color: "var(--text-primary)" }}>Fiyatlandırma Analizi</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>Ürün bazlı kâr marjı hesaplama</p>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
              {[
                { label: "En Yüksek Marjlı", product: [...products].sort((a, b) => (b.price - b.cost) / b.price - (a.price - a.cost) / a.price)[0] },
                { label: "En Çok Satan", product: [...products].sort((a, b) => b.orders - a.orders)[0] },
              ].map(({ label, product }) => (
                <div key={label} style={{
                  background: "var(--bg-secondary)", borderRadius: 16, padding: 20, flex: 1, minWidth: 220,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)", borderTop: "4px solid #a3e635", transition: "var(--transition)"
                }}>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, marginBottom: 8 }}>{label}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>{product.name}</div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
                    %{(((product.price - product.cost) / product.price) * 100).toFixed(0)} marj · ₺{product.price - product.cost} / ürün
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--bg-secondary)", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "var(--transition)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "var(--bg-primary)", borderBottom: "1.5px solid var(--border-color)", transition: "var(--transition)" }}>
                    {["Ürün", "Maliyet", "Fiyat", "Birim Kâr", "Marj", "Toplam Satış", "Toplam Kâr"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...products].sort((a, b) => (b.price - b.cost) / b.price - (a.price - a.cost) / a.price).map(p => {
                    const margin = (((p.price - p.cost) / p.price) * 100).toFixed(0);
                    const profit = p.price - p.cost;
                    const totalProfit = profit * p.orders;
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-primary)" }}>{p.name}</td>
                        <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>₺{p.cost}</td>
                        <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>₺{p.price}</td>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "#34d399" }}>₺{profit}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              height: 6, width: 80, background: "var(--bg-primary)", borderRadius: 3, overflow: "hidden"
                            }}>
                              <div style={{
                                height: "100%", width: `${margin}%`,
                                background: +margin > 50 ? "#a3e635" : +margin > 30 ? "#f59e0b" : "#f87171",
                                borderRadius: 3
                              }} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>%{margin}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>{p.orders} adet</td>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "#34d399" }}>₺{totalProfit.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

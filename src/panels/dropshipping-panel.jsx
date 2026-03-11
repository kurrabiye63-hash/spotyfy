import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useLogs } from "../context/LogContext";
import { StatusBadge, StatCard, LoadingSpinner, inputStyle, btnPrimary, btnSecondary, deleteBtn, editBtn } from "../components/ui";
import { fetchShopifyProducts, fetchShopifyOrders } from "../lib/shopify";
import { fetchTrendingProducts, getTrendCategories } from "../lib/trending";

export default function DropshippingPanel() {
  const { addLog } = useLogs();
  const [tab, setTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: "", supplier: "", cost: "", price: "", stock: "" });
  const [newSupplier, setNewSupplier] = useState({ name: "", contact: "", phone: "" });
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [trendCategory, setTrendCategory] = useState("all");
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendProgress, setTrendProgress] = useState({ done: 0, total: 0 });
  const [lastTrendUpdate, setLastTrendUpdate] = useState(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const syncIntervalRef = useRef(null);

  const trendCategories = getTrendCategories();
  const filteredTrends = trendCategory === "all" ? trendingProducts : trendingProducts.filter(p => p.category === trendCategory);

  // İlk yükleme
  useEffect(() => { fetchData(); loadTrending(); }, []);

  // Otomatik senkronizasyon (her 5 dakikada bir)
  useEffect(() => {
    if (autoSyncEnabled) {
      syncIntervalRef.current = setInterval(() => {
        loadTrending();
        addLog("Popüler ürünler otomatik güncellendi", "info");
      }, 5 * 60 * 1000); // 5 dakika
    }
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [autoSyncEnabled]);

  const loadTrending = async () => {
    try {
      setTrendLoading(true);
      setTrendProgress({ done: 0, total: 8 });
      const products = await fetchTrendingProducts((done, total) => {
        setTrendProgress({ done, total });
      });
      if (products.length > 0) {
        setTrendingProducts(products);
        setLastTrendUpdate(new Date());
        addLog(`${products.length} popüler ürün yüklendi (gerçek mağazalardan)`, "success");
      } else {
        addLog("Mağazalardan ürün çekilemedi, lütfen tekrar deneyin", "warning");
      }
    } catch (error) {
      addLog(`Trend yükleme hatası: ${error.message}`, "error");
    } finally {
      setTrendLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      const { data: sData } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
      if (pData) setProducts(pData);
      if (oData) setOrders(oData);
      if (sData) setSuppliers(sData);
      addLog("Veriler başarıyla yüklendi", "success");
    } catch (error) {
      console.error("Error fetching data:", error);
      addLog(`Veri çekme hatası: ${error.message}`, "error");
    } finally { setLoading(false); }
  };

  const syncWithShopify = async () => {
    try {
      setSyncing(true);
      addLog("Shopify ile senkronizasyon başlatıldı...", "info");
      
      const [sProducts, sOrders] = await Promise.all([
        fetchShopifyProducts(),
        fetchShopifyOrders()
      ]);

      // Handle products mapping from Shopify
      const mappedProducts = sProducts.map(p => ({
        id: p.id,
        name: p.title,
        supplier: p.vendor,
        cost: 0, // Shopify Admin API usually doesn't provide cost unless configured
        price: p.variants?.[0]?.price || 0,
        stock: p.variants?.[0]?.inventory_quantity || 0,
        status: p.status === 'active' ? 'aktif' : 'taslak',
        orders: 0 // This would need additional logic to sync with order data
      }));

      // Handle orders mapping from Shopify
      const mappedOrders = sOrders.map(o => ({
        id: o.name,
        customer: o.customer ? `${o.customer.first_name} ${o.customer.last_name}` : "Bilinmiyor",
        product: o.line_items?.[0]?.title || "Karma Sipariş",
        date: new Date(o.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
        total: o.total_price,
        status: o.fulfillment_status === 'fulfilled' ? 'teslim edildi' : 'hazırlanıyor'
      }));

      setProducts(mappedProducts);
      setOrders(mappedOrders);
      
      addLog(`${mappedProducts.length} ürün ve ${mappedOrders.length} sipariş Shopify'dan çekildi`, "success");
    } catch (error) {
      addLog(`Shopify senkronizasyon hatası: ${error.message}`, "error");
    } finally {
      setSyncing(false);
    }
  };

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalProfit = products.reduce((s, p) => s + (Number(p.price) - Number(p.cost)) * (p.orders || 0), 0);
  const activeProducts = products.filter(p => p.status === "aktif").length;
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.supplier && p.supplier.toLowerCase().includes(search.toLowerCase()))
  );

  const deleteProduct = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { addLog("Ürün silindi", "success"); fetchData(); }
    else addLog(`Ürün silme hatası: ${error.message}`, "error");
  };

  const deleteOrder = async (id) => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (!error) { addLog("Sipariş silindi", "success"); fetchData(); }
    else addLog(`Sipariş silme hatası: ${error.message}`, "error");
  };

  const deleteSupplier = async (id) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (!error) { addLog("Tedarikçi silindi", "success"); fetchData(); }
    else addLog(`Tedarikçi silme hatası: ${error.message}`, "error");
  };

  const addSupplier = async () => {
    if (!newSupplier.name) return;
    const item = { name: newSupplier.name, contact: newSupplier.contact || "—", phone: newSupplier.phone || "—", products: 0, rating: 0, status: "aktif" };
    const { error } = await supabase.from('suppliers').insert([item]);
    if (!error) {
      addLog(`Yeni tedarikçi eklendi: ${item.name}`, "success");
      fetchData(); setNewSupplier({ name: "", contact: "", phone: "" }); setShowAddSupplier(false);
    } else addLog(`Tedarikçi ekleme hatası: ${error.message}`, "error");
  };

  const updateProduct = async () => {
    if (!editingProduct) return;
    const stockNum = +editingProduct.stock || 0;
    const updates = { name: editingProduct.name, supplier: editingProduct.supplier, cost: +editingProduct.cost || 0, price: +editingProduct.price || 0, stock: stockNum, status: stockNum > 5 ? "aktif" : stockNum > 0 ? "az stok" : "tükendi" };
    const { error } = await supabase.from('products').update(updates).eq('id', editingProduct.id);
    if (!error) { addLog(`Ürün güncellendi: ${updates.name}`, "success"); fetchData(); setEditingProduct(null); }
    else addLog(`Ürün güncelleme hatası: ${error.message}`, "error");
  };

  const addProduct = async () => {
    if (!newProduct.name) return;
    const stockNum = +newProduct.stock || 0;
    const item = { name: newProduct.name, supplier: newProduct.supplier || "—", cost: +newProduct.cost || 0, price: +newProduct.price || 0, stock: stockNum, status: stockNum > 5 ? "aktif" : stockNum > 0 ? "az stok" : "tükendi", orders: 0 };
    const { error } = await supabase.from('products').insert([item]);
    if (!error) {
      addLog(`Yeni ürün eklendi: ${item.name}`, "success");
      fetchData(); setNewProduct({ name: "", supplier: "", cost: "", price: "", stock: "" }); setShowAddProduct(false);
    } else addLog(`Ürün ekleme hatası: ${error.message}`, "error");
  };

  const addTrendToProducts = async (trend) => {
    const stockNum = 50;
    const item = { name: trend.name, supplier: trend.supplier, cost: trend.cost, price: trend.price, stock: stockNum, status: "aktif", orders: 0 };
    const { error } = await supabase.from('products').insert([item]);
    if (!error) {
      addLog(`Trend ürün eklendi: ${item.name}`, "success");
      fetchData();
    } else addLog(`Ürün ekleme hatası: ${error.message}`, "error");
  };

  const tabs = [
    { key: "dashboard", label: "📊 Dashboard" },
    { key: "products", label: "📦 Ürünler" },
    { key: "trending", label: "🔥 Popüler Ürünler" },
    { key: "orders", label: "🛒 Siparişler" },
    { key: "suppliers", label: "🏭 Tedarikçiler" },
    { key: "pricing", label: "💰 Fiyatlandırma" },
  ];

  const productFields = [
    { key: "name", label: "Ürün Adı *", placeholder: "örn: Deri Cüzdan" },
    { key: "supplier", label: "Tedarikçi", placeholder: "örn: Tedarikçi A" },
    { key: "cost", label: "Maliyet Fiyatı (₺)", placeholder: "örn: 85" },
    { key: "price", label: "Satış Fiyatı (₺)", placeholder: "örn: 249" },
    { key: "stock", label: "Stok Adedi", placeholder: "örn: 50" },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", padding: "20px 0" }}>
      <div style={{ background: "var(--bg-secondary)", borderBottom: "1.5px solid var(--border-color)", display: "flex", gap: 0, padding: "0 32px", overflowX: "auto", marginBottom: "20px", transition: "var(--transition)" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "16px 20px", fontSize: 14,
            fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? "var(--text-primary)" : "var(--text-secondary)",
            borderBottom: tab === t.key ? "2.5px solid var(--text-primary)" : "2.5px solid transparent", whiteSpace: "nowrap", transition: "all 0.15s"
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1200 }}>
        {tab === "dashboard" && (
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Genel Bakış</h2>
            <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>Mağazanın anlık durumu</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
              <StatCard icon="💸" label="Toplam Gelir" value={`₺${totalRevenue.toLocaleString()}`} sub="Son 5 sipariş" color="#a3e635" />
              <StatCard icon="📈" label="Tahmini Kâr" value={`₺${totalProfit.toLocaleString()}`} sub="Tüm ürünler" color="#60a5fa" />
              <StatCard icon="📦" label="Aktif Ürün" value={activeProducts} sub={`${products.length} toplam`} color="#f59e0b" />
              <StatCard icon="🏭" label="Tedarikçi" value={suppliers.filter(s => s.status === "aktif").length} sub="Aktif" color="#a78bfa" />
            </div>
            <div style={{ background: "var(--bg-secondary)", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "var(--transition)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>Son Siparişler</h3>
                <button onClick={() => setTab("orders")} style={{ ...btnSecondary, padding: "6px 14px", fontSize: 13 }}>Tümünü Gör →</button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                  {["Sipariş", "Müşteri", "Ürün", "Tutar", "Durum"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#9ca3af", fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{orders.slice(0, 3).map(o => (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "12px 12px", fontWeight: 700, color: "var(--text-primary)" }}>{o.id}</td>
                    <td style={{ padding: "12px 12px", color: "var(--text-primary)" }}>{o.customer}</td>
                    <td style={{ padding: "12px 12px", color: "var(--text-secondary)" }}>{o.product}</td>
                    <td style={{ padding: "12px 12px", fontWeight: 700, color: "var(--text-primary)" }}>₺{o.total}</td>
                    <td style={{ padding: "12px 12px" }}><StatusBadge status={o.status} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {products.filter(p => p.stock <= 5).length > 0 && (
              <div style={{ marginTop: 20, background: "var(--bg-secondary)", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "var(--transition)" }}>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 14, color: "var(--text-primary)" }}>⚠️ Stok Uyarıları</h3>
                {products.filter(p => p.stock <= 5).map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: p.stock === 0 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", borderRadius: 10, marginBottom: 8 }}>
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

        {tab === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 4, color: "var(--text-primary)" }}>Ürünler</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{products.length} ürün listelendi</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  style={{ ...btnSecondary, background: "#95bf47", color: "white", border: "none" }} 
                  onClick={syncWithShopify}
                  disabled={syncing}
                >
                  {syncing ? "🔄 Senkronize Ediliyor..." : "🛒 Shopify'dan Çek"}
                </button>
                <button style={btnPrimary} onClick={() => setShowAddProduct(true)}>+ Yeni Ürün</button>
              </div>
            </div>
            <input placeholder="🔍 Ürün veya tedarikçi ara..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, maxWidth: 320, marginBottom: 16 }} />
            <div style={{ background: "var(--bg-secondary)", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "var(--transition)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ background: "var(--bg-primary)", borderBottom: "1.5px solid var(--border-color)" }}>
                  {["Ürün Adı", "Tedarikçi", "Maliyet", "Satış Fiyatı", "Kâr Marjı", "Stok", "Satış", "Durum", "İşlem"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{filteredProducts.map(p => {
                  const margin = (((p.price - p.cost) / p.price) * 100).toFixed(0);
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-primary)" }}>{p.name}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>{p.supplier}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>₺{p.cost}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-primary)" }}>₺{p.price}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: +margin > 50 ? "#d1fae5" : +margin > 30 ? "#fef3c7" : "#fee2e2", color: +margin > 50 ? "#065f46" : +margin > 30 ? "#92400e" : "#991b1b", padding: "3px 8px", borderRadius: 20, fontWeight: 700, fontSize: 12 }}>%{margin}</span>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: p.stock <= 5 ? 700 : 400, color: p.stock <= 5 ? "#dc2626" : "var(--text-primary)" }}>{p.stock}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>{p.orders}</td>
                      <td style={{ padding: "14px 16px" }}><StatusBadge status={p.status} /></td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setEditingProduct({ ...p })} style={editBtn}>✏️</button>
                          <button onClick={() => deleteProduct(p.id)} style={deleteBtn}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>

            {editingProduct && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
                <div style={{ background: "var(--bg-secondary)", borderRadius: 20, padding: 32, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, marginBottom: 20, color: "var(--text-primary)" }}>Ürün Düzenle</h3>
                  {productFields.map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>{f.label}</label>
                      <input placeholder={f.placeholder} value={editingProduct[f.key]} onChange={e => setEditingProduct({ ...editingProduct, [f.key]: e.target.value })} style={inputStyle} />
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                    <button style={btnSecondary} onClick={() => setEditingProduct(null)}>İptal</button>
                    <button style={btnPrimary} onClick={updateProduct}>Güncelle</button>
                  </div>
                </div>
              </div>
            )}

            {showAddProduct && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
                <div style={{ background: "var(--bg-secondary)", borderRadius: 20, padding: 32, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, marginBottom: 20, color: "var(--text-primary)" }}>Yeni Ürün Ekle</h3>
                  {productFields.map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>{f.label}</label>
                      <input placeholder={f.placeholder} value={newProduct[f.key]} onChange={e => setNewProduct({ ...newProduct, [f.key]: e.target.value })} style={inputStyle} />
                    </div>
                  ))}
                  {newProduct.cost && newProduct.price && (
                    <div style={{ background: "rgba(21,128,61,0.1)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                      <span style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>
                        💰 Tahmini kâr marjı: %{(((+newProduct.price - +newProduct.cost) / +newProduct.price) * 100).toFixed(0)}
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

        {tab === "trending" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 4, color: "var(--text-primary)" }}>🔥 Popüler Ürünler</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                  Diğer Shopify mağazalarından gerçek ürünler ·
                  {lastTrendUpdate && <span style={{ color: "#22c55e", fontWeight: 600 }}> Son: {lastTrendUpdate.toLocaleTimeString('tr-TR')}</span>}
                  {autoSyncEnabled && <span style={{ color: "#3b82f6", marginLeft: 8, fontSize: 12 }}>⏱ Her 5 dk güncellenir</span>}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input type="checkbox" checked={autoSyncEnabled} onChange={e => setAutoSyncEnabled(e.target.checked)} style={{ accentColor: "#22c55e" }} />
                  Otomatik
                </label>
                <button onClick={loadTrending} disabled={trendLoading} style={{ ...btnSecondary, background: "#95bf47", color: "white", border: "none" }}>
                  {trendLoading ? `🔄 ${trendProgress.done}/${trendProgress.total} mağaza...` : "🔄 Şimdi Yenile"}
                </button>
              </div>
            </div>

            {/* Yüklenme Barı */}
            {trendLoading && (
              <div style={{ marginBottom: 16, background: "var(--bg-secondary)", borderRadius: 8, overflow: "hidden", height: 6 }}>
                <div style={{ height: "100%", width: `${(trendProgress.done / (trendProgress.total || 1)) * 100}%`, background: "linear-gradient(90deg, #22c55e, #3b82f6)", borderRadius: 8, transition: "width 0.3s" }} />
              </div>
            )}

            {/* Kategori Filtreleri */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {trendCategories.map(c => (
                <button key={c.key} onClick={() => setTrendCategory(c.key)} style={{
                  padding: "8px 18px", borderRadius: 24, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, transition: "all 0.2s",
                  background: trendCategory === c.key ? "var(--text-primary)" : "var(--bg-secondary)",
                  color: trendCategory === c.key ? "var(--bg-primary)" : "var(--text-secondary)",
                  boxShadow: trendCategory === c.key ? "0 4px 12px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.06)",
                }}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>

            {/* İstatistik Barı */}
            <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
              <StatCard icon="🔥" label="Trend Ürün" value={filteredTrends.length} sub="Anlık" color="#ef4444" />
              <StatCard icon="💰" label="Ort. Kâr Marjı" value={`%${(filteredTrends.reduce((s, p) => s + ((p.price - p.cost) / p.price * 100), 0) / (filteredTrends.length || 1)).toFixed(0)}`} sub="Ortalama" color="#22c55e" />
              <StatCard icon="📦" label="Toplam Satış" value={filteredTrends.reduce((s, p) => s + p.orders, 0).toLocaleString()} sub="Global" color="#3b82f6" />
              <StatCard icon="⭐" label="En Yüksek Trend" value={filteredTrends.length > 0 ? Math.max(...filteredTrends.map(p => p.trend)) : 0} sub="Skor" color="#f59e0b" />
            </div>

            {/* Ürün Kartları */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {[...filteredTrends].sort((a, b) => b.trend - a.trend).map(p => {
                const margin = (((p.price - p.cost) / p.price) * 100).toFixed(0);
                return (
                  <div key={p.id} style={{
                    background: "var(--bg-secondary)", borderRadius: 16, padding: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "all 0.25s",
                    border: "1.5px solid var(--border-color)", position: "relative", overflow: "hidden"
                  }}>
                    {/* Trend Skoru Barı */}
                    <div style={{ position: "absolute", top: 0, left: 0, width: `${p.trend}%`, height: 3, background: `linear-gradient(90deg, #22c55e, ${p.trend > 90 ? '#ef4444' : '#f59e0b'})`, borderRadius: "16px 0 0 0" }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ fontSize: 36 }}>{p.image}</div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ background: p.trend >= 90 ? "#fef2f2" : p.trend >= 80 ? "#fefce8" : "#f0fdf4", color: p.trend >= 90 ? "#dc2626" : p.trend >= 80 ? "#ca8a04" : "#16a34a", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                          🔥 {p.trend}/100
                        </span>
                        <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{p.store}</span>
                      </div>
                    </div>

                    <h4 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 4, color: "var(--text-primary)" }}>{p.name}</h4>
                    <p style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 12 }}>{p.supplier} · {p.category}</p>

                    {/* Etiketler */}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
                      {p.tags.map(tag => (
                        <span key={tag} style={{
                          padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 600,
                          background: tag === "Çok Satan" ? "#dbeafe" : tag === "Trend" ? "#fce7f3" : tag === "Yüksek Marj" ? "#d1fae5" : tag === "Düşük Maliyet" ? "#fef3c7" : "#f3e8ff",
                          color: tag === "Çok Satan" ? "#1d4ed8" : tag === "Trend" ? "#be185d" : tag === "Yüksek Marj" ? "#065f46" : tag === "Düşük Maliyet" ? "#92400e" : "#6b21a8",
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Fiyat Bilgileri */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "10px 12px", background: "var(--bg-primary)", borderRadius: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Maliyet</div>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>₺{p.cost}</div>
                      </div>
                      <div style={{ color: "var(--text-secondary)", fontSize: 18 }}>→</div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Satış</div>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>₺{p.price}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Kâr</div>
                        <div style={{ fontWeight: 700, color: "#22c55e", fontSize: 14 }}>₺{p.price - p.cost}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Marj</div>
                        <div style={{ fontWeight: 700, color: +margin > 60 ? "#22c55e" : "#f59e0b", fontSize: 14 }}>%{margin}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>
                      <span>📦 {p.orders.toLocaleString()} global satış</span>
                    </div>

                    <button onClick={() => addTrendToProducts(p)} style={{
                      width: "100%", padding: "10px 0", borderRadius: 10, border: "none",
                      background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white",
                      fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s",
                    }}>
                      + Mağazama Ekle
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 6, color: "var(--text-primary)" }}>Siparişler</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>{orders.length} sipariş</p>
            <div style={{ background: "var(--bg-secondary)", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ background: "var(--bg-primary)", borderBottom: "1.5px solid var(--border-color)" }}>
                  {["Sipariş No", "Müşteri", "Ürün", "Tarih", "Tutar", "Durum", "İşlem"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-primary)" }}>{o.id}</td>
                    <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>{o.customer}</td>
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>{o.product}</td>
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>{o.date}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-primary)" }}>₺{o.total}</td>
                    <td style={{ padding: "14px 16px" }}><StatusBadge status={o.status} /></td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => deleteOrder(o.id)} style={deleteBtn}>🗑️</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

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
                <div key={s.id} style={{ background: "var(--bg-secondary)", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", borderLeft: `4px solid ${s.status === "aktif" ? "#a3e635" : "var(--border-color)"}` }}>
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
                    <button style={{ ...btnSecondary, flex: 1, textAlign: "center" }}>İletişim</button>
                    <button onClick={() => deleteSupplier(s.id)} style={{ ...deleteBtn, padding: "10px 18px", fontSize: 14, fontWeight: 600, borderRadius: 8 }}>Sil</button>
                  </div>
                </div>
              ))}
            </div>
            {showAddSupplier && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
                <div style={{ background: "var(--bg-secondary)", borderRadius: 20, padding: 32, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, marginBottom: 20, color: "var(--text-primary)" }}>Yeni Tedarikçi Ekle</h3>
                  {[
                    { key: "name", label: "Firma Adı *", placeholder: "örn: Tedarikçi D" },
                    { key: "contact", label: "İletişim Kişisi", placeholder: "örn: Ahmet Yılmaz" },
                    { key: "phone", label: "Telefon", placeholder: "+90 5xx xxx xxxx" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>{f.label}</label>
                      <input placeholder={f.placeholder} value={newSupplier[f.key]} onChange={e => setNewSupplier({ ...newSupplier, [f.key]: e.target.value })} style={inputStyle} />
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                    <button style={btnSecondary} onClick={() => setShowAddSupplier(false)}>İptal</button>
                    <button style={btnPrimary} onClick={addSupplier}>Ekle</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "pricing" && products.length > 0 && (
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 6, color: "var(--text-primary)" }}>Fiyatlandırma Analizi</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>Ürün bazlı kâr marjı hesaplama</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
              {[
                { label: "En Yüksek Marjlı", product: [...products].sort((a, b) => (b.price - b.cost) / b.price - (a.price - a.cost) / a.price)[0] },
                { label: "En Çok Satan", product: [...products].sort((a, b) => b.orders - a.orders)[0] },
              ].map(({ label, product }) => (
                <div key={label} style={{ background: "var(--bg-secondary)", borderRadius: 16, padding: 20, flex: 1, minWidth: 220, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", borderTop: "4px solid #a3e635" }}>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, marginBottom: 8 }}>{label}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>{product.name}</div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
                    %{(((product.price - product.cost) / product.price) * 100).toFixed(0)} marj · ₺{product.price - product.cost} / ürün
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "var(--bg-secondary)", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ background: "var(--bg-primary)", borderBottom: "1.5px solid var(--border-color)" }}>
                  {["Ürün", "Maliyet", "Fiyat", "Birim Kâr", "Marj", "Toplam Satış", "Toplam Kâr"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{[...products].sort((a, b) => (b.price - b.cost) / b.price - (a.price - a.cost) / a.price).map(p => {
                  const margin = (((p.price - p.cost) / p.price) * 100).toFixed(0);
                  const profit = p.price - p.cost;
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-primary)" }}>{p.name}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>₺{p.cost}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>₺{p.price}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#34d399" }}>₺{profit}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ height: 6, width: 80, background: "var(--bg-primary)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${margin}%`, background: +margin > 50 ? "#a3e635" : +margin > 30 ? "#f59e0b" : "#f87171", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>%{margin}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>{p.orders} adet</td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#34d399" }}>₺{(profit * p.orders).toLocaleString()}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

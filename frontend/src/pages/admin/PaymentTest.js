import React, { useState, useEffect, useRef } from "react";
import { api, formatApiErrorDetail, formatRupiah } from "@/lib/api";
import { QrCode, Check, X, ArrowClockwise, MagnifyingGlass } from "@phosphor-icons/react";

export default function PaymentTestPage() {
  const [amount, setAmount] = useState(1000);
  const [keterangan, setKeterangan] = useState("Test QRIS Integration");
  const [payment, setPayment] = useState(null);
  const [checkOrderId, setCheckOrderId] = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  const loadHistory = async () => {
    try {
      const { data } = await api.get("/admin/payments?limit=10");
      setHistory(data.items || []);
    } catch {}
  };

  useEffect(() => {
    loadHistory();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const createTest = async () => {
    setErr(""); setPayment(null); setLoading(true);
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    try {
      const { data } = await api.post("/payment/qris/test-create", { amount: parseInt(amount), keterangan });
      setPayment(data);
      pollRef.current = setInterval(async () => {
        try {
          const { data: status } = await api.get(`/payment/qris/check/${data.order_id}`);
          setPayment((prev) => prev ? { ...prev, status: status.local.status, callback_received: status.local.callback_received } : null);
          if (status.local.status !== "pending") {
            clearInterval(pollRef.current); pollRef.current = null;
            loadHistory();
          }
        } catch {}
      }, 5000);
      loadHistory();
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally { setLoading(false); }
  };

  const checkStatus = async () => {
    setErr(""); setCheckResult(null);
    if (!checkOrderId.trim()) { setErr("Order ID wajib diisi"); return; }
    try {
      const { data } = await api.get(`/payment/qris/check/${checkOrderId.trim()}`);
      setCheckResult(data);
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    }
  };

  return (
    <div className="space-y-6" data-testid="payment-test-page">
      <div>
        <div className="badge badge-gold mb-2">SUPERADMIN · TEST</div>
        <h1 className="section-title text-3xl">QRIS Payment Test</h1>
        <p className="text-[#A0AAB5] text-sm mt-1">Halaman test integrasi KlikQRIS. Tidak terhubung ke user/transaction real.</p>
      </div>

      {/* Create test invoice */}
      <div className="card-solid p-5">
        <div className="flex items-center gap-2 mb-4">
          <QrCode size={20} className="text-[#38BDF8]" weight="fill" />
          <div className="font-display font-bold text-lg">Buat Test Invoice</div>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="label-std">Amount (Rp)</label>
            <input type="number" className="input-std" value={amount} onChange={(e) => setAmount(e.target.value)} min={1000} />
          </div>
          <div className="md:col-span-2">
            <label className="label-std">Keterangan</label>
            <input className="input-std" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
          </div>
        </div>
        <button onClick={createTest} disabled={loading} className="btn-primary mt-4">
          {loading ? "Creating..." : "Buat QR Code"}
        </button>
      </div>

      {err && <div className="badge badge-red w-full justify-center !py-2">{err}</div>}

      {payment && (
        <div className="card-glass p-6">
          <div className="font-display font-bold text-lg mb-3">Test Invoice Created</div>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              {payment.qr_image ? (
                <img src={payment.qr_image} alt="QRIS" className="w-full max-w-xs rounded-xl border border-white/10" />
              ) : payment.qr_code_url ? (
                <img src={payment.qr_code_url} alt="QRIS" className="w-full max-w-xs rounded-xl border border-white/10" />
              ) : (
                <div className="aspect-square max-w-xs bg-[#0B0C10] rounded-xl flex items-center justify-center text-[#5a5a6a]">QR tidak tersedia</div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Order ID" value={payment.order_id} mono />
              <Row label="Amount" value={formatRupiah(payment.total_amount)} />
              <Row label="Expires" value={payment.expires_at} />
              <Row label="Status" value={<span className={`badge ${payment.status === "paid" ? "badge-green" : payment.status === "expired" ? "badge-red" : "badge-gold"}`}>{payment.status?.toUpperCase()}</span>} />
              <Row label="Callback Diterima" value={payment.callback_received ? <span className="badge badge-green"><Check size={10} className="inline mr-1" />YES</span> : <span className="badge badge-navy">Belum</span>} />
              <Row label="Signature" value={payment.signature} mono small />
              <div className="text-xs text-[#A0AAB5] mt-3">Polling status setiap 5 detik...</div>
            </div>
          </div>
        </div>
      )}

      {/* Manual status check */}
      <div className="card-solid p-5">
        <div className="flex items-center gap-2 mb-4">
          <MagnifyingGlass size={20} className="text-[#38BDF8]" />
          <div className="font-display font-bold text-lg">Cek Status Manual</div>
        </div>
        <div className="flex gap-2">
          <input className="input-std font-mono" value={checkOrderId} onChange={(e) => setCheckOrderId(e.target.value)} placeholder="Order ID (mis: TEST-XXXX)" />
          <button onClick={checkStatus} className="btn-outline whitespace-nowrap">Check</button>
        </div>
        {checkResult && (
          <div className="mt-4 grid md:grid-cols-2 gap-3 text-xs">
            <div className="card-solid p-3">
              <div className="font-bold text-[#38BDF8] mb-2">LOCAL DB</div>
              <pre className="text-[10px] text-[#A0AAB5] whitespace-pre-wrap">{JSON.stringify(checkResult.local, null, 2)}</pre>
            </div>
            <div className="card-solid p-3">
              <div className="font-bold text-[#10b981] mb-2">REMOTE (KlikQRIS)</div>
              <pre className="text-[10px] text-[#A0AAB5] whitespace-pre-wrap">{JSON.stringify(checkResult.remote, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Recent payments */}
      <div className="card-solid p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-display font-bold text-lg">Recent Payments</div>
          <button onClick={loadHistory} className="btn-ghost !text-xs"><ArrowClockwise size={12} className="inline mr-1" />Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-[#5a5a6a] border-b border-white/[0.06]">
                <th className="py-2">Order ID</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Test?</th>
                <th>Callback?</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {history.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.04]">
                  <td className="py-2 font-mono text-[#38BDF8]">{p.order_id}</td>
                  <td><span className={`badge ${p.status === "paid" ? "badge-green" : p.status === "expired" ? "badge-red" : "badge-gold"}`}>{p.status}</span></td>
                  <td>{formatRupiah(p.total_amount || p.amount)}</td>
                  <td>{p.is_test ? <span className="badge badge-blue">TEST</span> : "-"}</td>
                  <td>{p.callback_payload || (p.status === "paid" || p.status === "expired") ? <Check size={10} className="text-[#3FCA7C]" /> : "-"}</td>
                  <td className="text-[#5a5a6a]">{p.created_at ? new Date(p.created_at).toLocaleString("id-ID") : "-"}</td>
                </tr>
              ))}
              {history.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-[#5a5a6a]">Belum ada payment</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono, small }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[#A0AAB5] shrink-0">{label}</span>
      <span className={`text-right ${mono ? "font-mono" : ""} ${small ? "text-[10px]" : ""} break-all`}>{value || "-"}</span>
    </div>
  );
}

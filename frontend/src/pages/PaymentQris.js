import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api, formatApiErrorDetail, formatRupiah } from "@/lib/api";
import { Check, X, QrCode, CaretLeft, ArrowClockwise } from "@phosphor-icons/react";

export default function PaymentQrisPage() {
  const [sp] = useSearchParams();
  const txId = sp.get("tx");
  const [payment, setPayment] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!txId) { setErr("Transaction ID tidak ditemukan"); setLoading(false); return; }
    createOrFetch();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [txId]);

  const createOrFetch = async () => {
    setLoading(true); setErr("");
    try {
      // Try public endpoint first (for register flow), fallback to auth endpoint
      let data;
      try {
        const res = await api.post("/payment/qris/public-create", { transaction_id: txId });
        data = res.data;
      } catch (e) {
        if (e.response?.status === 401) {
          const res = await api.post("/payment/qris/create", { transaction_id: txId });
          data = res.data;
        } else throw e;
      }
      setPayment(data);
      if (data.status === "pending") startPolling(data.order_id);
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally { setLoading(false); }
  };

  const startPolling = (orderId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        let data;
        try {
          const res = await api.get(`/payment/qris/public-status/${orderId}`);
          data = res.data;
        } catch {
          const res = await api.get(`/payment/qris/status/${orderId}`);
          data = res.data;
        }
        setPayment((prev) => ({ ...prev, ...data }));
        if (data.status !== "pending") {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch {}
    }, 5000);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="spinner" /></div>;

  return (
    <div className="space-y-6" data-testid="payment-qris-page">
      <div>
        <Link to="/app/upgrade" className="text-xs text-[#A0AAB5] font-semibold hover:text-[#38BDF8] inline-flex items-center gap-1 transition">
          <CaretLeft size={12} /> Kembali
        </Link>
        <div className="flex items-center gap-2 mt-1 mb-1">
          <QrCode size={18} className="text-[#38BDF8]" weight="fill" />
          <div className="badge badge-gold">PEMBAYARAN QRIS</div>
        </div>
        <h1 className="section-title text-3xl">Scan & Bayar</h1>
      </div>

      {err && (
        <div className="card-solid p-5 border border-[#E50914]/40 text-center">
          <X size={32} className="text-[#E50914] mx-auto mb-2" />
          <div className="text-[#ff8aa0] font-bold">{err}</div>
          <button onClick={createOrFetch} className="btn-outline mt-3 !text-xs"><ArrowClockwise size={12} className="inline mr-1" />Coba Lagi</button>
        </div>
      )}

      {payment && payment.status === "pending" && (
        <div className="card-glass p-6 text-center max-w-md mx-auto">
          <div className="text-sm text-[#A0AAB5] mb-3">Scan QR code di bawah dengan e-wallet Anda</div>
          {payment.qr_image ? (
            <img src={payment.qr_image} alt="QRIS" className="mx-auto w-64 h-64 rounded-xl border border-white/10" />
          ) : payment.qr_code_url ? (
            <img src={payment.qr_code_url} alt="QRIS" className="mx-auto w-64 h-64 rounded-xl border border-white/10" />
          ) : (
            <div className="w-64 h-64 mx-auto bg-[#0B0C10] rounded-xl flex items-center justify-center text-[#5a5a6a]">QR tidak tersedia</div>
          )}
          <div className="mt-4 font-display font-black text-3xl text-[#38BDF8]">{formatRupiah(payment.total_amount)}</div>
          <div className="text-xs text-[#A0AAB5] mt-1">Total yang harus dibayar (termasuk kode unik)</div>
          {payment.expires_at && (
            <div className="text-xs text-[#f59e0b] mt-2">Berlaku sampai: {payment.expires_at}</div>
          )}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#A0AAB5]">
            <div className="spinner-xs" /> Menunggu pembayaran...
          </div>
        </div>
      )}

      {payment && payment.status === "paid" && (
        <div className="card-glass p-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#3FCA7C]/20 flex items-center justify-center mb-4">
            <Check size={32} weight="bold" className="text-[#3FCA7C]" />
          </div>
          <div className="font-display font-bold text-2xl text-white">Pembayaran Berhasil!</div>
          <div className="text-sm text-[#A0AAB5] mt-2">Paket Anda sudah aktif. Selamat berlatih!</div>
          <Link to="/app" className="btn-primary mt-4 inline-flex">Ke Dashboard</Link>
        </div>
      )}

      {payment && payment.status === "expired" && (
        <div className="card-glass p-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#E50914]/20 flex items-center justify-center mb-4">
            <X size={32} weight="bold" className="text-[#E50914]" />
          </div>
          <div className="font-display font-bold text-2xl text-white">Pembayaran Expired</div>
          <div className="text-sm text-[#A0AAB5] mt-2">Waktu pembayaran habis. Silakan buat ulang.</div>
          <Link to="/app/upgrade" className="btn-primary mt-4 inline-flex">Coba Lagi</Link>
        </div>
      )}
    </div>
  );
}

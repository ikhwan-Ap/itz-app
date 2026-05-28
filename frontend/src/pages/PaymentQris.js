import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api, formatApiErrorDetail, formatRupiah } from "@/lib/api";
import { Check, X, QrCode, CaretLeft, ArrowClockwise, Timer, ShieldCheck } from "@phosphor-icons/react";

export default function PaymentQrisPage() {
  const [sp] = useSearchParams();
  const txId = sp.get("tx");
  const [payment, setPayment] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const pollRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    if (!txId) { setErr("Transaction ID tidak ditemukan"); setLoading(false); return; }
    createOrFetch();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [txId]);

  const createOrFetch = async () => {
    setLoading(true); setErr("");
    try {
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
      if (data.status === "pending") {
        startPolling(data.order_id);
        startCountdown(data.expires_at);
      }
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
          clearInterval(pollRef.current); pollRef.current = null;
          if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
        }
      } catch {}
    }, 5000);
  };

  const startCountdown = (expiresAt) => {
    if (!expiresAt) return;
    const update = () => {
      const now = new Date();
      const exp = new Date(expiresAt.replace(" ", "T") + "+07:00");
      const diff = Math.max(0, Math.floor((exp - now) / 1000));
      setCountdown(diff);
      if (diff <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
    update();
    countdownRef.current = setInterval(update, 1000);
  };

  const formatTime = (s) => {
    if (s == null) return "--:--";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="spinner" />
      <p className="text-[#A0AAB5] text-sm">Menyiapkan pembayaran...</p>
    </div>
  );

  return (
    <div className="min-h-[calc(100dvh-160px)] flex flex-col items-center justify-center px-4 py-12" data-testid="payment-qris-page">
      <div className="w-full max-w-md">

        {err && (
          <div className="card-glass p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#E50914]/10 flex items-center justify-center mb-4">
              <X size={32} weight="bold" className="text-[#E50914]" />
            </div>
            <h2 className="font-display font-bold text-xl text-white mb-2">Gagal Memuat Pembayaran</h2>
            <p className="text-sm text-[#A0AAB5] mb-4">{err}</p>
            <button onClick={createOrFetch} className="btn-primary"><ArrowClockwise size={14} className="inline mr-2" />Coba Lagi</button>
          </div>
        )}

        {payment && payment.status === "pending" && (
          <div className="card-glass p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <QrCode size={24} weight="fill" className="text-[#38BDF8]" />
              <h2 className="font-display font-bold text-xl text-white">Pembayaran QRIS</h2>
            </div>

            <div className="bg-white rounded-2xl p-4 inline-block mb-6">
              {payment.qr_image ? (
                <img src={payment.qr_image} alt="QRIS" className="w-56 h-56 object-contain" />
              ) : payment.qr_code_url ? (
                <img src={payment.qr_code_url} alt="QRIS" className="w-56 h-56 object-contain" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-gray-400">QR tidak tersedia</div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="font-display font-black text-4xl text-[#38BDF8]">{formatRupiah(payment.total_amount)}</div>
              <p className="text-xs text-[#A0AAB5]">Bayar tepat nominal di atas (termasuk kode unik)</p>
            </div>

            <div className="flex items-center justify-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2 text-[#f59e0b]">
                <Timer size={16} weight="fill" />
                <span className="font-mono font-bold">{formatTime(countdown)}</span>
              </div>
              <div className="flex items-center gap-2 text-[#3FCA7C]">
                <ShieldCheck size={16} weight="fill" />
                <span>Aman & Terenkripsi</span>
              </div>
            </div>

            <div className="bg-[#0B0C10] rounded-xl p-4 text-left space-y-2 text-xs text-[#A0AAB5]">
              <p className="font-bold text-white text-sm mb-2">Cara Bayar:</p>
              <p>1. Buka aplikasi e-wallet (GoPay, OVO, DANA, ShopeePay, dll)</p>
              <p>2. Pilih menu <b className="text-white">Scan QR</b></p>
              <p>3. Scan QR code di atas</p>
              <p>4. Pastikan nominal sesuai: <b className="text-[#38BDF8]">{formatRupiah(payment.total_amount)}</b></p>
              <p>5. Konfirmasi pembayaran</p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#5a5a6a]">
              <div className="w-2 h-2 rounded-full bg-[#3FCA7C] animate-pulse" />
              Menunggu pembayaran...
            </div>
          </div>
        )}

        {payment && payment.status === "paid" && (
          <div className="card-glass p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#3FCA7C]/15 flex items-center justify-center mb-5">
              <Check size={40} weight="bold" className="text-[#3FCA7C]" />
            </div>
            <h2 className="font-display font-bold text-2xl text-white mb-2">Pembayaran Berhasil!</h2>
            <p className="text-sm text-[#A0AAB5] mb-6">Akun Anda sudah aktif. Selamat berlatih!</p>
            <Link to="/login" className="btn-primary inline-flex">Masuk ke Akun</Link>
          </div>
        )}

        {payment && payment.status === "expired" && (
          <div className="card-glass p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#f59e0b]/15 flex items-center justify-center mb-5">
              <Timer size={40} weight="bold" className="text-[#f59e0b]" />
            </div>
            <h2 className="font-display font-bold text-2xl text-white mb-2">Waktu Habis</h2>
            <p className="text-sm text-[#A0AAB5] mb-6">Pembayaran melewati batas waktu. Silakan daftar ulang.</p>
            <Link to="/register" className="btn-primary inline-flex">Daftar Ulang</Link>
          </div>
        )}

      </div>
    </div>
  );
}

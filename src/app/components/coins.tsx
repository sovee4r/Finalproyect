import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "../../lib/utils";
// ── Types ──
interface PendingPack {
  amount: number;
  price: string;
  icon: string;
  name: string;
}

type CardType = "visa" | "mc" | "amex" | "discover" | "";

const AD = { videoId: "dQw4w9WgXcQ", duration: 30 };

const CARD_TINTS: Record<string, string> = {
  visa: "linear-gradient(135deg,#1a1040,#0d1f3c,#001a30)",
  mc: "linear-gradient(135deg,#2a0d10,#1a0510,#200010)",
  amex: "linear-gradient(135deg,#001a20,#001530,#002020)",
  discover: "linear-gradient(135deg,#1a1000,#200e00,#1a0a00)",
};

const NET_LABELS: Record<string, string> = {
  visa: "VISA",
  mc: "MASTERCARD",
  amex: "AMEX",
  discover: "DISCOVER",
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function CoinsPage() {
  // ── Global state ──
  const [coins, setCoins] = useState(0);
  const [level] = useState(0);
  const [coinsPulse, setCoinsPulse] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string; show: boolean }>({ msg: "", type: "ok", show: false });

  // ── Ad state ──
  const [adViewsLeft, setAdViewsLeft] = useState(3);
  const [videoOpen, setVideoOpen] = useState(false);
  const [adFinished, setAdFinished] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [vidPct, setVidPct] = useState(0);

  // ── Payment state ──
  const [payOpen, setPayOpen] = useState(false);
  const [pendingPack, setPendingPack] = useState<PendingPack | null>(null);
  const [payPhase, setPayPhase] = useState<"form" | "processing" | "success">("form");

  // ── Card form state ──
  const [ccNum, setCcNum] = useState("");
  const [ccName, setCcName] = useState("");
  const [ccExp, setCcExp] = useState("");
  const [ccCvv, setCcCvv] = useState("");
  const [cardType, setCardType] = useState<CardType>("");
  const [cardBg, setCardBg] = useState("linear-gradient(135deg,#1a1040,#0d1f3c,#001a30)");
  const [cardNetLabel, setCardNetLabel] = useState("VISA");
  const [cardFlipped, setCardFlipped] = useState(false);

  // Hints & errors
  const [numHint, setNumHint] = useState({ text: "", err: false });
  const [nameHint, setNameHint] = useState({ text: "", err: false });
  const [expHint, setExpHint] = useState({ text: "", err: false });
  const [cvvHint, setCvvHint] = useState({ text: "", err: false });
  const [numErr, setNumErr] = useState(false);
  const [nameErr, setNameErr] = useState(false);
  const [expErr, setExpErr] = useState(false);
  const [cvvErr, setCvvErr] = useState(false);

  // ── Refs ──
  const ytPlayerRef = useRef<any>(null);
  const ytReadyRef = useRef(false);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── YouTube API ──
  useEffect(() => {
    if (!document.getElementById("yt-api-script")) {
      const script = document.createElement("script");
      script.id = "yt-api-script";
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
    window.onYouTubeIframeAPIReady = () => { ytReadyRef.current = true; };
  }, []);

  // ── Helpers ──
  const addCoins = useCallback((amount: number) => {
    setCoins((c) => c + amount);
    setCoinsPulse(true);
    setTimeout(() => setCoinsPulse(false), 400);
  }, []);

  const showToast = useCallback((msg: string, type = "ok") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type, show: true });
    toastTimerRef.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2800);
  }, []);

  // ── Ad logic ──
  const createPlayer = useCallback((videoId: string) => {
    if (ytPlayerRef.current) {
      try { ytPlayerRef.current.destroy(); } catch (_) {}
      ytPlayerRef.current = null;
    }
    const el = document.getElementById("yt-player");
    if (el) el.innerHTML = "";
    ytPlayerRef.current = new window.YT.Player("yt-player", {
      videoId,
      width: "100%",
      height: "100%",
      playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, showinfo: 0, fs: 0, iv_load_policy: 3, disablekb: 1 },
      events: {
        onReady: (e: any) => { e.target.playVideo(); startCountdown(); },
        onStateChange: (e: any) => { if (e.data === 0) finishAd(); },
        onError: () => { startCountdown(); },
      },
    });
  }, []); // eslint-disable-line

  const startCountdown = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    elapsedRef.current = 0;
    const total = AD.duration * 1000;
    countdownTimerRef.current = setInterval(() => {
      elapsedRef.current += 500;
      const pct = Math.min((elapsedRef.current / total) * 100, 100);
      setVidPct(pct);
      const rem = Math.ceil((total - elapsedRef.current) / 1000);
      setCountdown(Math.max(0, rem));
      if (elapsedRef.current >= total) {
        clearInterval(countdownTimerRef.current!);
        finishAd();
      }
    }, 500);
  }, []); // eslint-disable-line

  const finishAd = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setAdFinished(true);
    setVidPct(100);
    setCountdown(0);
    if (ytPlayerRef.current) try { ytPlayerRef.current.pauseVideo(); } catch (_) {}
  }, []);

  const openAd = useCallback(() => {
    if (adViewsLeft <= 0) return;
    elapsedRef.current = 0;
    setAdFinished(false);
    setVidPct(0);
    setCountdown(AD.duration);
    setVideoOpen(true);
    const launch = () => createPlayer(AD.videoId);
    if (ytReadyRef.current) { launch(); }
    else {
      const poll = setInterval(() => { if (ytReadyRef.current) { clearInterval(poll); launch(); } }, 200);
    }
  }, [adViewsLeft, createPlayer]);

  const closeVideo = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (ytPlayerRef.current) try { ytPlayerRef.current.stopVideo(); } catch (_) {}
    setVideoOpen(false);
    setTimeout(() => {
      if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch (_) {} ytPlayerRef.current = null; }
      const el = document.getElementById("yt-player");
      if (el) el.innerHTML = "";
    }, 400);
  }, []);

  const claimReward = useCallback(() => {
    setAdViewsLeft((v) => v - 1);
    addCoins(100);
    closeVideo();
    showToast("🪙 +100 MONEDAS AÑADIDAS", "ok");
  }, [addCoins, closeVideo, showToast]);

  // ── Payment logic ──
  const openPayment = useCallback((amount: number, price: string, icon: string, name: string) => {
    setPendingPack({ amount, price, icon, name });
    setPayPhase("form");
    setCcNum(""); setCcName(""); setCcExp(""); setCcCvv("");
    setNumHint({ text: "", err: false }); setNameHint({ text: "", err: false });
    setExpHint({ text: "", err: false }); setCvvHint({ text: "", err: false });
    setNumErr(false); setNameErr(false); setExpErr(false); setCvvErr(false);
    setCardType(""); setCardBg(CARD_TINTS.visa); setCardNetLabel("VISA");
    setCardFlipped(false);
    setPayOpen(true);
  }, []);

  const closePayment = useCallback(() => {
    setPayOpen(false);
    setCardFlipped(false);
  }, []);

  const detectCard = useCallback((num: string): CardType => {
    if (/^4/.test(num)) return "visa";
    if (/^5[1-5]|^2[2-7]/.test(num)) return "mc";
    if (/^3[47]/.test(num)) return "amex";
    if (/^6/.test(num)) return "discover";
    return "";
  }, []);

  // ── Card number input ──
  const handleNumChange = (raw: string) => {
    const v = raw.replace(/\D/g, "").slice(0, 16);
    const formatted = (v.match(/.{1,4}/g) || []).join(" ");
    setCcNum(formatted);
    const type = detectCard(v);
    setCardType(type);
    if (type) { setCardBg(CARD_TINTS[type]); setCardNetLabel(NET_LABELS[type]); }
    if (!v.length) { setNumHint({ text: "", err: false }); setNumErr(false); }
    else if (v.length < 16) { setNumHint({ text: "Ingresa los 16 dígitos", err: false }); setNumErr(false); }
    else { setNumHint({ text: "✓ Número válido", err: false }); setNumErr(false); }
    setCardFlipped(false);
  };

  // ── Card name input ──
  const handleNameChange = (raw: string) => {
    const val = raw.toUpperCase().replace(/[^A-Z\s]/g, "");
    setCcName(val);
    if (val.trim().split(/\s+/).length >= 2) { setNameHint({ text: "✓ Nombre válido", err: false }); setNameErr(false); }
    else if (val.length > 0) { setNameHint({ text: "Ingresa nombre y apellido", err: false }); setNameErr(false); }
    else { setNameHint({ text: "", err: false }); setNameErr(false); }
    setCardFlipped(false);
  };

  // ── Expiry input ──
  const handleExpChange = (raw: string) => {
    let v = raw.replace(/\D/g, "");
    if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2, 4);
    setCcExp(v);
    if (v.length === 5) {
      const [mm, yy] = v.split("/");
      const month = parseInt(mm, 10);
      const expDate = new Date(parseInt("20" + yy, 10), month, 1);
      if (month < 1 || month > 12) { setExpHint({ text: "Mes inválido", err: true }); setExpErr(true); }
      else if (expDate <= new Date()) { setExpHint({ text: "Tarjeta vencida", err: true }); setExpErr(true); }
      else { setExpHint({ text: "✓ Fecha válida", err: false }); setExpErr(false); }
    } else if (v.length > 0) { setExpHint({ text: "Formato MM/AA", err: false }); setExpErr(false); }
    else { setExpHint({ text: "", err: false }); setExpErr(false); }
    setCardFlipped(false);
  };

  // ── CVV input ──
  const handleCvvChange = (raw: string) => {
    const v = raw.replace(/\D/g, "").slice(0, 4);
    setCcCvv(v);
    if (v.length >= 3) { setCvvHint({ text: "✓ CVV válido", err: false }); setCvvErr(false); }
    else if (v.length > 0) { setCvvHint({ text: "3 o 4 dígitos", err: false }); setCvvErr(false); }
    else { setCvvHint({ text: "", err: false }); setCvvErr(false); }
  };

  // ── Validate ──
  const validateForm = () => {
    let valid = true;
    const num = ccNum.replace(/\s/g, "");
    if (num.length < 16) { setNumErr(true); setNumHint({ text: "Número de tarjeta requerido", err: true }); valid = false; }
    if (ccName.trim().split(/\s+/).length < 2 || ccName.length < 3) { setNameErr(true); setNameHint({ text: "Nombre completo requerido", err: true }); valid = false; }
    if (ccExp.length < 5) { setExpErr(true); setExpHint({ text: "Fecha de vencimiento requerida", err: true }); valid = false; }
    if (ccCvv.length < 3) { setCvvErr(true); setCvvHint({ text: "CVV requerido", err: true }); valid = false; }
    return valid;
  };

  const processPayment = () => {
    if (!validateForm() || !pendingPack) return;
    setCardFlipped(false);
    setPayPhase("processing");
    setTimeout(() => {
      setPayPhase("success");
      addCoins(pendingPack.amount);
      showToast(`🪙 +${pendingPack.amount.toLocaleString()} MONEDAS AÑADIDAS`, "ok");
      setTimeout(() => closePayment(), 2500);
    }, 2200);
  };

  // ── Derived display values ──
  const cardNumDisplay = (() => {
    const v = ccNum.replace(/\s/g, "");
    const filled = v + "•".repeat(Math.max(0, 16 - v.length));
    return (filled.match(/.{1,4}/g) || []).join(" ");
  })();

  const adDots = "●".repeat(adViewsLeft) + "○".repeat(3 - adViewsLeft);
  const adExhausted = adViewsLeft <= 0;

  // ── Input class helpers ──
  const inputCls = (err: boolean, val: string, validLen: number) => {
    const base = "field-input";
    if (err) return base + " error";
    if (val.replace(/\s/g, "").length >= validLen) return base + " valid";
    return base;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@400;600;700&display=swap');

        :root {
          --bg: #08091a;
          --panel: #0d1126;
          --panel2: #111830;
          --cyan: #00e5ff;
          --green: #00ff88;
          --pink: #ff2d78;
          --yellow: #ffe600;
          --text: #ddeeff;
          --muted: #4a5a7a;
        }
        * { margin:0; padding:0; box-sizing:border-box; }
        html,body { min-height:100vh; }
        body {
          background: var(--bg);
          font-family: 'Rajdhani', sans-serif;
          color: var(--text);
          background-image:
            radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,229,255,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 110%, rgba(0,255,136,0.05) 0%, transparent 60%);
        }
        body::after {
          content:''; position:fixed; inset:0;
          background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,229,255,0.012) 3px, rgba(0,229,255,0.012) 4px);
          pointer-events:none; z-index:9998;
        }
        .topbar {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 20px;
          background:rgba(13,17,38,0.96);
          border-bottom:1px solid rgba(0,229,255,0.15);
          position:sticky; top:0; z-index:100;
        }
        .back-btn {
          display:flex; align-items:center; gap:7px;
          padding:8px 13px;
          border:1.5px solid rgba(0,229,255,0.3); border-radius:8px;
          background:rgba(0,229,255,0.05);
          font-family:'Press Start 2P',monospace; font-size:8px;
          color:var(--cyan); cursor:pointer; transition:all 0.2s; letter-spacing:1px;
        }
        .back-btn:hover { border-color:var(--cyan); background:rgba(0,229,255,0.1); box-shadow:0 0 14px rgba(0,229,255,0.25); transform:translateX(-2px); }
        .logo { font-family:'Press Start 2P',monospace; font-size:13px; color:var(--green); text-shadow:0 0 8px var(--green),0 0 25px rgba(0,255,136,0.4); }
        .top-right { display:flex; align-items:center; gap:8px; }
        .top-level {
          display:flex; align-items:center; gap:6px; padding:7px 12px;
          border:1.5px solid var(--pink); border-radius:8px; background:rgba(255,45,120,0.06);
          font-family:'Press Start 2P',monospace; font-size:9px; color:var(--pink);
        }
        .top-coins {
          display:flex; align-items:center; gap:7px; padding:7px 13px;
          border:1.5px solid var(--yellow); border-radius:8px; background:rgba(255,230,0,0.06);
          font-family:'Press Start 2P',monospace; font-size:9px; color:var(--yellow);
          box-shadow:0 0 10px rgba(255,230,0,0.15); transition:all 0.3s;
        }
        .top-coins.pulse { box-shadow:0 0 25px rgba(255,230,0,0.6); transform:scale(1.08); }
        .page { max-width:480px; margin:0 auto; padding:28px 18px 60px; }
        .profile-card {
          background:var(--panel); border:1.5px solid var(--cyan); border-radius:20px;
          overflow:hidden; box-shadow:0 0 40px rgba(0,229,255,0.12),0 20px 60px rgba(0,0,0,0.5);
          margin-bottom:22px; position:relative;
        }
        .profile-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:3px;
          background:linear-gradient(90deg,transparent,var(--cyan),var(--green),transparent);
        }
        .card-top { padding:30px 24px 22px; text-align:center; border-bottom:1px solid rgba(0,229,255,0.1); position:relative; }
        .edit-btn {
          position:absolute; top:14px; right:14px;
          background:none; border:1px solid var(--muted); color:var(--muted);
          border-radius:6px; padding:5px 9px; font-size:13px; cursor:pointer; transition:all 0.2s;
        }
        .edit-btn:hover { border-color:var(--cyan); color:var(--cyan); }
        .avatar {
          width:90px; height:90px; border-radius:50%;
          border:2.5px solid var(--green); box-shadow:0 0 22px rgba(0,255,136,0.35);
          background:var(--bg); display:flex; align-items:center; justify-content:center;
          margin:0 auto 14px; position:relative;
        }
        .avatar svg { width:46px; height:46px; }
        .avatar-ring-pulse {
          position:absolute; inset:-7px; border-radius:50%;
          border:1px solid rgba(0,255,136,0.3);
          animation:ringPulse 2.5s ease-in-out infinite;
        }
        @keyframes ringPulse { 0%,100%{transform:scale(1);opacity:0.3;} 50%{transform:scale(1.06);opacity:0.7;} }
        .player-name { font-family:'Press Start 2P',monospace; font-size:12px; color:var(--text); margin-bottom:7px; }
        .player-level { font-family:'Press Start 2P',monospace; font-size:9px; color:var(--yellow); letter-spacing:2px; }
        .xp-wrap { padding:14px 22px; border-bottom:1px solid rgba(0,229,255,0.08); }
        .xp-row { display:flex; justify-content:space-between; margin-bottom:7px; }
        .xp-lbl { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:2px; font-weight:600; }
        .xp-val { font-family:'Press Start 2P',monospace; font-size:9px; color:var(--cyan); }
        .xp-track { height:11px; background:rgba(0,229,255,0.07); border-radius:6px; border:1px solid rgba(0,229,255,0.12); overflow:hidden; }
        .xp-fill { height:100%; width:0%; background:linear-gradient(90deg,#00b4d8,#00ff88); border-radius:6px; box-shadow:0 0 8px rgba(0,255,136,0.4); transition:width 1.2s cubic-bezier(.25,1,.5,1); }
        .stats-row { display:grid; grid-template-columns:repeat(3,1fr); border-bottom:1px solid rgba(0,229,255,0.08); }
        .stat-cell { padding:16px 10px; text-align:center; border-right:1px solid rgba(0,229,255,0.06); }
        .stat-cell:last-child { border-right:none; }
        .stat-num { font-family:'Press Start 2P',monospace; font-size:14px; margin-bottom:5px; transition:all 0.3s; }
        .stat-num.y { color:var(--yellow); } .stat-num.g { color:var(--green); } .stat-num.p { color:var(--pink); }
        .stat-lbl { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1.5px; font-weight:600; }
        .info-rows { padding:14px 18px 18px; }
        .info-row {
          display:flex; justify-content:space-between; align-items:center;
          background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.05);
          border-radius:8px; padding:11px 13px; margin-bottom:8px;
        }
        .info-row:last-child { margin-bottom:0; }
        .ir-label { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:1.5px; font-weight:600; }
        .ir-val { font-size:14px; font-weight:700; }
        .ir-val.c { color:var(--cyan); } .ir-val.pk { color:var(--pink); }
        .shop-card {
          background:var(--panel); border:1.5px solid var(--yellow); border-radius:20px;
          overflow:hidden; box-shadow:0 0 30px rgba(255,230,0,0.1); position:relative;
        }
        .shop-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:3px;
          background:linear-gradient(90deg,transparent,var(--yellow),var(--pink),transparent);
        }
        .shop-header { padding:16px 20px; border-bottom:1px solid rgba(255,230,0,0.1); display:flex; align-items:center; gap:10px; }
        .shop-title { font-family:'Press Start 2P',monospace; font-size:10px; color:var(--yellow); letter-spacing:1px; }
        .ad-pack {
          background:var(--panel2); border:1.5px solid rgba(0,255,136,0.25); border-radius:14px;
          padding:22px 16px; text-align:center; cursor:pointer; transition:all 0.2s; position:relative; overflow:hidden;
        }
        .ad-pack:hover:not(.used) { border-color:var(--green); box-shadow:0 0 22px rgba(0,255,136,0.25); transform:translateY(-2px); }
        .ad-pack.used { opacity:0.45; cursor:not-allowed; border-color:var(--muted); }
        .ad-icon { font-size:32px; margin-bottom:10px; }
        .ad-reward-amt { font-family:'Press Start 2P',monospace; font-size:10px; color:var(--yellow); margin-bottom:10px; }
        .ad-views-counter { font-family:'Press Start 2P',monospace; font-size:8px; color:var(--green); letter-spacing:2px; margin-bottom:12px; opacity:0.85; }
        .ad-pack.used .ad-views-counter { color:var(--muted); }
        .ad-badge {
          display:inline-block; padding:6px 18px; border-radius:6px;
          font-family:'Press Start 2P',monospace; font-size:8px; letter-spacing:0.5px;
          background:rgba(0,255,136,0.1); border:1px solid rgba(0,255,136,0.3); color:var(--green);
        }
        .ad-pack.used .ad-badge { background:rgba(74,90,122,0.2); border-color:var(--muted); color:var(--muted); }
        .shop-footer { padding:8px 16px 16px; text-align:center; font-size:11px; color:var(--muted); font-weight:600; letter-spacing:1.5px; }
        .pack-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:4px; }
        .buy-pack {
          background:var(--panel2); border:1.5px solid rgba(255,230,0,0.2); border-radius:14px;
          padding:18px 12px; text-align:center; cursor:pointer; transition:all 0.2s; position:relative;
        }
        .buy-pack:hover { border-color:var(--yellow); box-shadow:0 0 20px rgba(255,230,0,0.2); transform:translateY(-2px); }
        .buy-pack.best-buy { border-color:rgba(0,229,255,0.4); }
        .buy-pack.best-buy:hover { border-color:var(--cyan); box-shadow:0 0 20px rgba(0,229,255,0.25); }
        .best-tag {
          position:absolute; top:-1px; left:50%; transform:translateX(-50%);
          background:var(--cyan); color:#000;
          font-family:'Press Start 2P',monospace; font-size:6px; padding:3px 10px;
          border-radius:0 0 6px 6px; letter-spacing:1px;
        }
        .buy-icon { font-size:28px; margin-bottom:8px; margin-top:4px; }
        .buy-amt { font-family:'Press Start 2P',monospace; font-size:9px; color:var(--text); margin-bottom:6px; line-height:1.6; }
        .buy-price { font-family:'Press Start 2P',monospace; font-size:11px; color:var(--yellow); }

        /* VIDEO MODAL */
        .voverlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(6px);
          z-index:1000; display:flex; align-items:center; justify-content:center;
          opacity:0; pointer-events:none; transition:opacity 0.3s;
        }
        .voverlay.open { opacity:1; pointer-events:all; }
        .vmodal {
          background:var(--panel); border:1.5px solid var(--cyan); border-radius:20px;
          width:min(480px,95vw); overflow:hidden; box-shadow:0 0 60px rgba(0,229,255,0.25);
        }
        .vmodal-head {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 18px; border-bottom:1px solid rgba(0,229,255,0.12);
        }
        .vmodal-title { font-family:'Press Start 2P',monospace; font-size:9px; color:var(--cyan); }
        .vclose {
          background:none; border:1px solid var(--muted); color:var(--muted);
          width:28px; height:28px; border-radius:6px; cursor:pointer; font-size:13px;
          display:flex; align-items:center; justify-content:center; transition:all 0.2s;
        }
        .vclose:hover { border-color:var(--pink); color:var(--pink); }
        .vid-progress-wrap { position:relative; aspect-ratio:16/9; background:#000; }
        .vid-progress-wrap > #yt-player { width:100%; height:100%; }
        .skip-badge {
          position:absolute; top:10px; right:10px;
          background:rgba(0,0,0,0.75); border:1px solid rgba(255,255,255,0.15);
          border-radius:8px; padding:5px 10px;
          font-family:'Press Start 2P',monospace; font-size:8px; color:#fff;
          display:flex; align-items:center; gap:5px;
        }
        .vid-bar { height:5px; background:rgba(255,255,255,0.1); }
        .vid-bar-fill { height:100%; background:linear-gradient(90deg,var(--cyan),var(--green)); transition:width 0.5s linear; }
        .vmodal-foot { display:flex; align-items:center; justify-content:space-between; padding:16px 18px; }
        .reward-info { display:flex; align-items:center; gap:10px; }
        .reward-text { font-family:'Press Start 2P',monospace; font-size:8px; color:var(--yellow); line-height:2; }
        .claim-btn {
          padding:10px 20px; border-radius:10px; border:none;
          font-family:'Press Start 2P',monospace; font-size:8px; cursor:not-allowed;
          background:var(--panel2); color:var(--muted); letter-spacing:1px; transition:all 0.3s;
        }
        .claim-btn.ready {
          background:linear-gradient(135deg,var(--green),#00b860); color:#000; cursor:pointer;
          box-shadow:0 0 20px rgba(0,255,136,0.4);
        }
        .claim-btn.ready:hover { transform:scale(1.05); box-shadow:0 0 30px rgba(0,255,136,0.6); }

        /* PAYMENT MODAL */
        .pay-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px);
          z-index:1001; display:flex; align-items:center; justify-content:center; padding:16px;
          opacity:0; pointer-events:none; transition:opacity 0.3s;
        }
        .pay-overlay.open { opacity:1; pointer-events:all; }
        .pay-modal {
          background:var(--panel); border:1.5px solid var(--yellow); border-radius:20px;
          width:min(460px,100%); max-height:90vh; overflow-y:auto;
          box-shadow:0 0 60px rgba(255,230,0,0.2); position:relative;
        }
        .pay-head {
          display:flex; align-items:center; justify-content:space-between;
          padding:16px 20px; border-bottom:1px solid rgba(255,230,0,0.12);
          position:sticky; top:0; background:var(--panel); z-index:5;
        }
        .pay-title { font-family:'Press Start 2P',monospace; font-size:9px; color:var(--yellow); }
        .pay-close {
          background:none; border:1px solid var(--muted); color:var(--muted);
          width:28px; height:28px; border-radius:6px; cursor:pointer; font-size:13px;
          display:flex; align-items:center; justify-content:center; transition:all 0.2s;
        }
        .pay-close:hover { border-color:var(--pink); color:var(--pink); }
        .pay-summary {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 20px; background:rgba(255,230,0,0.04); border-bottom:1px solid rgba(255,230,0,0.1);
        }
        .pay-sum-left { display:flex; align-items:center; gap:12px; }
        .pay-sum-icon { font-size:28px; }
        .pay-sum-name { font-family:'Press Start 2P',monospace; font-size:9px; color:var(--yellow); line-height:1.8; }
        .pay-sum-sub { font-size:11px; color:var(--muted); font-weight:600; }
        .pay-sum-price { font-family:'Press Start 2P',monospace; font-size:14px; color:var(--green); }
        .card-visual-wrap { padding:18px 20px 12px; }
        .card-scene { width:100%; aspect-ratio:1.586; perspective:1000px; }
        .card-inner { width:100%; height:100%; position:relative; transform-style:preserve-3d; transition:transform 0.65s cubic-bezier(.4,0,.2,1); }
        .card-inner.flipped { transform:rotateY(180deg); }
        .card-face {
          position:absolute; inset:0; border-radius:14px; padding:20px; overflow:hidden;
          border:1px solid rgba(255,255,255,0.08);
          box-shadow:0 10px 40px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.06);
          backface-visibility:hidden; -webkit-backface-visibility:hidden; transition:background 0.4s;
        }
        .card-face::before {
          content:''; position:absolute; top:-40%; right:-20%; width:200px; height:200px; border-radius:50%;
          background:radial-gradient(circle,rgba(0,229,255,0.15) 0%,transparent 70%); pointer-events:none;
        }
        .card-back { transform:rotateY(180deg); display:flex; flex-direction:column; justify-content:flex-start; }
        .card-network { position:absolute; top:18px; right:18px; font-family:'Press Start 2P',monospace; font-size:7px; color:rgba(255,255,255,0.5); letter-spacing:2px; }
        .card-chip {
          width:38px; height:28px; border-radius:5px;
          background:linear-gradient(135deg,#c8a84b,#f0d060,#c8a84b); border:1px solid rgba(255,220,100,0.5);
          margin-bottom:14px; display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr 1fr;
          gap:2px; padding:4px; overflow:hidden;
        }
        .chip-line { background:rgba(0,0,0,0.3); border-radius:1px; }
        .chip-line.full { grid-column:1/-1; }
        .card-number-display {
          font-family:'Press Start 2P',monospace; font-size:clamp(10px,3vw,13px); letter-spacing:3px;
          color:rgba(255,255,255,0.9); margin-bottom:16px; text-shadow:0 1px 3px rgba(0,0,0,0.5); word-spacing:8px;
        }
        .card-bottom { display:flex; justify-content:space-between; align-items:flex-end; }
        .card-label { font-size:8px; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:2px; margin-bottom:3px; font-weight:600; }
        .card-holder-display { font-family:'Press Start 2P',monospace; font-size:7px; color:rgba(255,255,255,0.8); }
        .card-exp-display { font-family:'Press Start 2P',monospace; font-size:10px; color:rgba(255,255,255,0.8); text-align:right; }
        .card-magstripe { position:absolute; top:28px; left:0; right:0; height:44px; background:linear-gradient(180deg,#1a1a1a,#111,#1a1a1a); }
        .card-sig-area { position:absolute; top:88px; left:20px; right:20px; display:flex; align-items:stretch; gap:10px; height:38px; }
        .card-sig-lines { flex:1; background:#f5f5f0; border-radius:4px; display:flex; flex-direction:column; justify-content:space-around; padding:5px 8px; overflow:hidden; }
        .sig-line { height:2px; background:repeating-linear-gradient(90deg,#b0b8c0 0px,#b0b8c0 4px,transparent 4px,transparent 8px); }
        .card-cvv-box { background:#fff; border-radius:4px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4px 12px; min-width:52px; }
        .cvv-label { font-size:7px; color:#333; font-family:'Press Start 2P',monospace; margin-bottom:3px; }
        .card-cvv-display { font-family:'Press Start 2P',monospace; font-size:11px; color:#000; letter-spacing:3px; }
        .card-back-footer { position:absolute; bottom:14px; left:0; right:0; text-align:center; }
        .pay-form { padding:6px 20px 20px; }
        .field-group { margin-bottom:12px; }
        .field-label { display:block; font-family:'Press Start 2P',monospace; font-size:7px; color:var(--muted); letter-spacing:1.5px; margin-bottom:7px; text-transform:uppercase; }
        .field-input {
          width:100%; background:var(--panel2); border:1.5px solid rgba(255,255,255,0.08); border-radius:10px;
          padding:12px 14px; font-family:'Rajdhani',sans-serif; font-size:16px; font-weight:600;
          color:var(--text); outline:none; transition:all 0.2s; letter-spacing:1px;
        }
        .field-input::placeholder { color:var(--muted); font-size:14px; letter-spacing:0.5px; }
        .field-input:focus { border-color:var(--yellow); box-shadow:0 0 0 3px rgba(255,230,0,0.08); }
        .field-input.valid { border-color:var(--green); }
        .field-input.error { border-color:var(--pink); animation:shake 0.3s; }
        @keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-5px);} 75%{transform:translateX(5px);} }
        .field-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .field-hint { font-size:10px; color:var(--muted); margin-top:4px; font-weight:600; }
        .field-hint.err { color:var(--pink); }
        .card-types { display:flex; gap:6px; margin-bottom:14px; }
        .ctype { padding:5px 10px; border-radius:6px; font-family:'Press Start 2P',monospace; font-size:6px; border:1px solid rgba(255,255,255,0.1); color:var(--muted); background:var(--panel2); transition:all 0.2s; }
        .ctype.active { border-color:var(--yellow); color:var(--yellow); background:rgba(255,230,0,0.06); }
        .pay-btn {
          width:100%; padding:14px; border-radius:10px; border:none;
          font-family:'Press Start 2P',monospace; font-size:9px; cursor:pointer; letter-spacing:1.5px;
          background:linear-gradient(135deg,var(--yellow),#ffb700); color:#000;
          transition:all 0.2s; box-shadow:0 4px 20px rgba(255,230,0,0.3); margin-top:14px; position:relative; overflow:hidden;
        }
        .pay-btn:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(255,230,0,0.5); }
        .btn-shine {
          position:absolute; top:0; left:-100%; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
          transform:skewX(-20deg); animation:shine 2.5s infinite;
        }
        @keyframes shine { 0%{left:-100%;} 60%,100%{left:150%;} }
        .processing-wrap { display:none; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; gap:18px; }
        .processing-wrap.show { display:flex; }
        .success-wrap { display:none; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; gap:14px; }
        .success-wrap.show { display:flex; }
        .spinner { width:50px; height:50px; border:3px solid rgba(255,230,0,0.1); border-top-color:var(--yellow); border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg);} }
        .proc-text { font-family:'Press Start 2P',monospace; font-size:9px; color:var(--yellow); letter-spacing:1.5px; text-align:center; line-height:2; }
        .success-icon { font-size:52px; animation:popIn 0.5s cubic-bezier(.34,1.56,.64,1); }
        @keyframes popIn { 0%{transform:scale(0);} 100%{transform:scale(1);} }
        .success-title { font-family:'Press Start 2P',monospace; font-size:11px; color:var(--green); text-align:center; }
        .success-sub { font-family:'Press Start 2P',monospace; font-size:8px; color:var(--muted); text-align:center; line-height:2; }
        .success-coins { font-family:'Press Start 2P',monospace; font-size:16px; color:var(--yellow); text-shadow:0 0 15px rgba(255,230,0,0.5); }
        .secure-row { display:flex; align-items:center; justify-content:center; gap:8px; padding:0 20px 16px; font-family:'Press Start 2P',monospace; font-size:7px; color:var(--muted); letter-spacing:1px; }
        .toast {
          position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(80px);
          background:var(--panel2); border:1.5px solid rgba(0,255,136,0.3); border-radius:12px;
          padding:12px 22px; font-family:'Press Start 2P',monospace; font-size:9px; color:var(--green);
          z-index:9999; pointer-events:none; opacity:0; transition:all 0.3s; white-space:nowrap;
          box-shadow:0 8px 30px rgba(0,0,0,0.4);
        }
        .toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
      `}</style>

      {/* TOPBAR */}
      <div className="topbar">
        <button className="back-btn">◀ MENÚ</button>
        <div className="logo">SABERIX</div>
        <div className="top-right">
          <div className="top-level">⭐ LVL <span>{level}</span></div>
          <div className={`top-coins${coinsPulse ? " pulse" : ""}`}>🪙 <span>{coins.toLocaleString()}</span></div>
        </div>
      </div>

      {/* PAGE */}
      <div className="page">

        {/* PROFILE CARD */}
        <div className="profile-card">
          <div className="card-top">
            <button className="edit-btn">✏️</button>
            <div className="avatar">
              <div className="avatar-ring-pulse" />
              <svg viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="18" r="9" stroke="#00ff88" strokeWidth="2.5" />
                <path d="M7 46c0-9.389 7.611-17 17-17s17 7.611 17 17" stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="player-name">JUGADOR</div>
            <div className="player-level" style={{ marginTop: 6 }}>NIVEL <span>{level}</span></div>
          </div>
          <div className="xp-wrap">
            <div className="xp-row">
              <span className="xp-lbl">⚡ Experiencia</span>
              <span className="xp-val">0 / 1,000 XP</span>
            </div>
            <div className="xp-track"><div className="xp-fill" /></div>
          </div>
          <div className="stats-row">
            <div className="stat-cell"><div className="stat-num y">{coins.toLocaleString()}</div><div className="stat-lbl">Monedas</div></div>
            <div className="stat-cell"><div className="stat-num g">0</div><div className="stat-lbl">Victorias</div></div>
            <div className="stat-cell"><div className="stat-num p">0</div><div className="stat-lbl">Preguntas</div></div>
          </div>
          <div className="info-rows">
            <div className="info-row"><span className="ir-label">Skin Actual</span><span className="ir-val c">Predeterminado</span></div>
            <div className="info-row"><span className="ir-label">Accesorio</span><span className="ir-val pk">Ninguno</span></div>
            <div className="info-row"><span className="ir-label">Rango</span><span className="ir-val c">🌱 NOVATO</span></div>
          </div>
        </div>

        {/* COIN SHOP */}
        <div className="shop-card">
          <div className="shop-header">
            <span style={{ fontSize: 20 }}>🪙</span>
            <span className="shop-title">OBTENER MONEDAS</span>
          </div>

          {/* AD PACK */}
          <div style={{ padding: "16px 16px 0" }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 8, color: "var(--muted)", letterSpacing: 2, marginBottom: 12, textAlign: "center" }}>🎬 GRATIS — VER ANUNCIO</div>
            <div className={`ad-pack${adExhausted ? " used" : ""}`} onClick={adExhausted ? undefined : openAd} style={{ maxWidth: "100%", margin: "0 auto" }}>
              <div className="ad-icon">📺</div>
              <div className="ad-reward-amt">+100 🪙 por vista</div>
              <div className="ad-views-counter">{adExhausted ? "○○○  Sin vistas restantes" : `${adDots}  ${adViewsLeft} de 3 restantes`}</div>
              <div className="ad-badge">{adExhausted ? "✓ AGOTADO" : "VER AHORA"}</div>
            </div>
          </div>

          {/* BUY PACKS */}
          <div style={{ padding: "14px 16px 4px" }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 8, color: "var(--muted)", letterSpacing: 2, marginBottom: 12, textAlign: "center" }}>💳 COMPRAR CON TARJETA</div>
            <div className="pack-grid">
              <div className="buy-pack" onClick={() => openPayment(500, "$0.99", "💰", "Bolsa Pequeña")}><div className="buy-icon">💰</div><div className="buy-amt">500 🪙</div><div className="buy-price">$0.99</div></div>
              <div className="buy-pack best-buy" onClick={() => openPayment(1500, "$1.99", "💎", "Pack Gema")}><div className="best-tag">MEJOR</div><div className="buy-icon">💎</div><div className="buy-amt">1,500 🪙</div><div className="buy-price">$1.99</div></div>
              <div className="buy-pack" onClick={() => openPayment(3500, "$3.99", "👑", "Pack Corona")}><div className="buy-icon">👑</div><div className="buy-amt">3,500 🪙</div><div className="buy-price">$3.99</div></div>
              <div className="buy-pack" onClick={() => openPayment(10000, "$9.99", "🏆", "Pack Trofeo")}><div className="buy-icon">🏆</div><div className="buy-amt">10,000 🪙</div><div className="buy-price">$9.99</div></div>
            </div>
          </div>
          <div className="shop-footer">HAZ CLIC EN UN PACK PARA COMPRARLO</div>
        </div>
      </div>

      {/* VIDEO MODAL */}
      <div className={`voverlay${videoOpen ? " open" : ""}`}>
        <div className="vmodal">
          <div className="vmodal-head">
            <span className="vmodal-title">📺 ANUNCIO</span>
            <button className="vclose" onClick={closeVideo}>✕</button>
          </div>
          <div className="vid-progress-wrap">
            <div id="yt-player" style={{ width: "100%", height: "100%" }} />
            {!adFinished && (
              <div className="skip-badge" style={{ display: "flex" }}>⏳ <span>{countdown}</span>s</div>
            )}
            <div className="vid-bar"><div className="vid-bar-fill" style={{ width: `${vidPct}%` }} /></div>
          </div>
          <div className="vmodal-foot">
            <div className="reward-info">
              <span style={{ fontSize: 22 }}>🪙</span>
              <div className="reward-text">RECOMPENSA<br />+100 MONEDAS</div>
            </div>
            <button className={`claim-btn${adFinished ? " ready" : ""}`} onClick={adFinished ? claimReward : undefined}>RECLAMAR</button>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      <div className={`pay-overlay${payOpen ? " open" : ""}`}>
        <div className="pay-modal">
          <div className="pay-head">
            <span className="pay-title">💳 PAGO SEGURO</span>
            <button className="pay-close" onClick={closePayment}>✕</button>
          </div>
          {pendingPack && (
            <div className="pay-summary">
              <div className="pay-sum-left">
                <div className="pay-sum-icon">{pendingPack.icon}</div>
                <div>
                  <div className="pay-sum-name">{pendingPack.name.toUpperCase()}</div>
                  <div className="pay-sum-sub">{pendingPack.amount.toLocaleString()} 🪙</div>
                </div>
              </div>
              <div className="pay-sum-price">{pendingPack.price}</div>
            </div>
          )}

          {/* 3D FLIP CARD */}
          <div className="card-visual-wrap">
            <div className="card-scene">
              <div className={`card-inner${cardFlipped ? " flipped" : ""}`}>
                {/* FRONT */}
                <div className="card-face card-front" style={{ background: cardBg }}>
                  <div className="card-network">{cardNetLabel}</div>
                  <div className="card-chip">
                    <div className="chip-line full" /><div className="chip-line" /><div className="chip-line" /><div className="chip-line full" />
                  </div>
                  <div className="card-number-display">{cardNumDisplay}</div>
                  <div className="card-bottom">
                    <div><div className="card-label">Titular</div><div className="card-holder-display">{ccName || "NOMBRE APELLIDO"}</div></div>
                    <div><div className="card-label" style={{ textAlign: "right" }}>Vence</div><div className="card-exp-display">{ccExp || "MM/AA"}</div></div>
                  </div>
                </div>
                {/* BACK */}
                <div className="card-face card-back" style={{ background: cardBg }}>
                  <div className="card-network">{cardNetLabel}</div>
                  <div className="card-magstripe" />
                  <div className="card-sig-area">
                    <div className="card-sig-lines"><div className="sig-line" /><div className="sig-line" /><div className="sig-line" /></div>
                    <div className="card-cvv-box"><div className="cvv-label">CVV</div><div className="card-cvv-display">{ccCvv ? "•".repeat(ccCvv.length) : "•••"}</div></div>
                  </div>
                  <div className="card-back-footer"><span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "'Press Start 2P',monospace", letterSpacing: 1 }}>SABERIX CARD</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pay-form">
            <div className={`processing-wrap${payPhase === "processing" ? " show" : ""}`}>
              <div className="spinner" />
              <div className="proc-text">PROCESANDO<br />PAGO...</div>
            </div>
            <div className={`success-wrap${payPhase === "success" ? " show" : ""}`}>
              <div className="success-icon">✅</div>
              <div className="success-title">¡PAGO EXITOSO!</div>
              <div className="success-coins">+{pendingPack?.amount.toLocaleString()} 🪙</div>
              <div className="success-sub">MONEDAS AÑADIDAS<br />A TU CUENTA</div>
            </div>
            {payPhase === "form" && (
              <div>
                <div className="card-types">
                  {(["visa", "mc", "amex", "discover"] as CardType[]).map((t) => (
                    <div key={t} className={`ctype${cardType === t ? " active" : ""}`}>{t === "mc" ? "MC" : t === "discover" ? "DISC" : t.toUpperCase()}</div>
                  ))}
                </div>
                <div className="field-group">
                  <label className="field-label">Número de Tarjeta</label>
                  <input className={inputCls(numErr, ccNum.replace(/\s/g, ""), 16)} type="text" inputMode="numeric" maxLength={19} placeholder="0000 0000 0000 0000" value={ccNum} onChange={(e) => handleNumChange(e.target.value)} autoComplete="cc-number" />
                  {numHint.text && <div className={`field-hint${numHint.err ? " err" : ""}`}>{numHint.text}</div>}
                </div>
                <div className="field-group">
                  <label className="field-label">Nombre del Titular</label>
                  <input className={inputCls(nameErr, ccName, 5)} type="text" maxLength={26} placeholder="Como aparece en la tarjeta" value={ccName} onChange={(e) => handleNameChange(e.target.value)} autoComplete="cc-name" style={{ textTransform: "uppercase" }} />
                  {nameHint.text && <div className={`field-hint${nameHint.err ? " err" : ""}`}>{nameHint.text}</div>}
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label className="field-label">Vencimiento</label>
                    <input className={inputCls(expErr, ccExp, 5)} type="text" inputMode="numeric" maxLength={5} placeholder="MM/AA" value={ccExp} onChange={(e) => handleExpChange(e.target.value)} autoComplete="cc-exp" />
                    {expHint.text && <div className={`field-hint${expHint.err ? " err" : ""}`}>{expHint.text}</div>}
                  </div>
                  <div className="field-group">
                    <label className="field-label">CVV / CVC</label>
                    <input className={inputCls(cvvErr, ccCvv, 3)} type="text" inputMode="numeric" maxLength={4} placeholder="•••" value={ccCvv} onChange={(e) => handleCvvChange(e.target.value)} onFocus={() => setCardFlipped(true)} onBlur={() => setCardFlipped(false)} autoComplete="cc-csc" />
                    {cvvHint.text && <div className={`field-hint${cvvHint.err ? " err" : ""}`}>{cvvHint.text}</div>}
                  </div>
                </div>
                <button className="pay-btn" onClick={processPayment}>
                  <span className="btn-shine" />
                  PAGAR {pendingPack?.price}
                </button>
              </div>
            )}
          </div>
          <div className="secure-row"><span style={{ fontSize: 12 }}>🔒</span>PAGO 100% SEGURO · ENCRIPTADO SSL</div>
        </div>
      </div>

      {/* TOAST */}
      <div className={`toast${toast.show ? " show" : ""}`}>{toast.msg}</div>
    </>
  );
}

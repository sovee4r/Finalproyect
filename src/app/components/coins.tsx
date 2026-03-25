import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "../AuthContext";

interface PendingPack {
  amount: number;
  price: number;
  icon: string;
  name: string;
}

type CardType = "visa" | "mc" | "amex" | "discover" | "";

const PAYPAL_CLIENT_ID = "AefDQZ_hSWi6F_L1CmXXJnn9HuhFObsKI2d_fhNY03XtERCawyNG9QJC6Re21LXevSigXBfxPG43zV0W";

const CARD_TINTS: Record<string, string> = {
  visa:     "linear-gradient(135deg,#1a1040,#0d1f3c,#001a30)",
  mc:       "linear-gradient(135deg,#2a0d10,#1a0510,#200010)",
  amex:     "linear-gradient(135deg,#001a20,#001530,#002020)",
  discover: "linear-gradient(135deg,#1a1000,#200e00,#1a0a00)",
};

const NET_LABELS: Record<string, string> = {
  visa: "VISA", mc: "MASTERCARD", amex: "AMEX", discover: "DISCOVER",
};

const API = "http://localhost:3001";

export default function CoinsPage() {
  const { user } = useAuth();

  const [coins, setCoins]           = useState(0);
  const [coinsPulse, setCoinsPulse] = useState(false);
  const [toast, setToast]           = useState<{ msg: string; show: boolean }>({ msg: "", show: false });

  // Ad state
  const [adViewsLeft, setAdViewsLeft] = useState(3);
  const [videoOpen, setVideoOpen]     = useState(false);
  const [adFinished, setAdFinished]   = useState(false);
  const [countdown, setCountdown]     = useState(30);
  const [vidPct, setVidPct]           = useState(0);

  // Payment state
  const [payOpen, setPayOpen]         = useState(false);
  const [payMethod, setPayMethod]     = useState<"card" | "paypal">("card");
  const [pendingPack, setPendingPack] = useState<PendingPack | null>(null);
  const [payPhase, setPayPhase]       = useState<"form" | "processing" | "success">("form");
  const [ppRendered, setPpRendered]   = useState(false);

  // Card form
  const [ccNum, setCcNum]               = useState("");
  const [ccName, setCcName]             = useState("");
  const [ccExp, setCcExp]               = useState("");
  const [ccCvv, setCcCvv]               = useState("");
  const [cardType, setCardType]         = useState<CardType>("");
  const [cardBg, setCardBg]             = useState(CARD_TINTS.visa);
  const [cardNetLabel, setCardNetLabel] = useState("VISA");
  const [cardFlipped, setCardFlipped]   = useState(false);

  const [numHint,  setNumHint]  = useState({ text: "", err: false });
  const [nameHint, setNameHint] = useState({ text: "", err: false });
  const [expHint,  setExpHint]  = useState({ text: "", err: false });
  const [cvvHint,  setCvvHint]  = useState({ text: "", err: false });
  const [numErr,   setNumErr]   = useState(false);
  const [nameErr,  setNameErr]  = useState(false);
  const [expErr,   setExpErr]   = useState(false);
  const [cvvErr,   setCvvErr]   = useState(false);

  const ytPlayerRef       = useRef<any>(null);
  const ytReadyRef        = useRef(false);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef        = useRef(0);
  const toastTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ppContainerRef    = useRef<HTMLDivElement>(null);

  // Cargar monedas reales
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API}/api/experiencia/${user.id}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setCoins(d.monedas ?? d.total_correctas * 10); })
      .catch(() => {});
  }, [user]);

  // Cargar PayPal SDK (Live)
  useEffect(() => {
    if (document.getElementById("paypal-sdk")) return;
    const script = document.createElement("script");
    script.id  = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Renderizar botones PayPal cuando abre el modal
  useEffect(() => {
    if (!payOpen || payMethod !== "paypal" || !pendingPack || ppRendered) return;
    const tryRender = () => {
      const container = document.getElementById("paypal-button-container");
      if (!container || !(window as any).paypal) { setTimeout(tryRender, 300); return; }
      container.innerHTML = "";
      setPpRendered(true);
      (window as any).paypal.Buttons({
        style: { layout: "vertical", color: "blue", shape: "rect", label: "pay" },
        createOrder: (_data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{ amount: { value: pendingPack.price.toFixed(2) } }],
          });
        },
        onApprove: (_data: any, actions: any) => {
          return actions.order.capture().then(() => {
            setPayPhase("success");
            addCoins(pendingPack.amount);
            showToast(`🪙 +${pendingPack.amount.toLocaleString()} MONEDAS AÑADIDAS`);
            setTimeout(() => closePayment(), 2500);
          });
        },
        onError: () => {
          showToast("Error al procesar el pago con PayPal");
        },
      }).render("#paypal-button-container");
    };
    setTimeout(tryRender, 400);
  }, [payOpen, payMethod, pendingPack, ppRendered]);

  // YouTube API
  useEffect(() => {
    if (!document.getElementById("yt-api-script")) {
      const script = document.createElement("script");
      script.id  = "yt-api-script";
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
    window.onYouTubeIframeAPIReady = () => { ytReadyRef.current = true; };
  }, []);

  const addCoins = useCallback((amount: number) => {
    setCoins(c => c + amount);
    setCoinsPulse(true);
    setTimeout(() => setCoinsPulse(false), 400);
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2800);
  }, []);

  const finishAd = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setAdFinished(true); setVidPct(100); setCountdown(0);
    if (ytPlayerRef.current) try { ytPlayerRef.current.pauseVideo(); } catch (_) {}
  }, []);

  const startCountdown = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    elapsedRef.current = 0;
    const total = 30000;
    countdownTimerRef.current = setInterval(() => {
      elapsedRef.current += 500;
      setVidPct(Math.min((elapsedRef.current / total) * 100, 100));
      setCountdown(Math.max(0, Math.ceil((total - elapsedRef.current) / 1000)));
      if (elapsedRef.current >= total) { clearInterval(countdownTimerRef.current!); finishAd(); }
    }, 500);
  }, [finishAd]);

  const createPlayer = useCallback((videoId: string) => {
    if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch (_) {} ytPlayerRef.current = null; }
    const el = document.getElementById("yt-player");
    if (el) el.innerHTML = "";
    ytPlayerRef.current = new window.YT.Player("yt-player", {
      videoId, width: "100%", height: "100%",
      playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, fs: 0, iv_load_policy: 3, disablekb: 1 },
      events: {
        onReady:       (e: any) => { e.target.playVideo(); startCountdown(); },
        onStateChange: (e: any) => { if (e.data === 0) finishAd(); },
        onError:       () => { startCountdown(); },
      },
    });
  }, [startCountdown, finishAd]);

  const openAd = useCallback(() => {
    if (adViewsLeft <= 0) return;
    elapsedRef.current = 0;
    setAdFinished(false); setVidPct(0); setCountdown(30); setVideoOpen(true);
    const launch = () => createPlayer("dQw4w9WgXcQ");
    if (ytReadyRef.current) { launch(); }
    else { const poll = setInterval(() => { if (ytReadyRef.current) { clearInterval(poll); launch(); } }, 200); }
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
    setAdViewsLeft(v => v - 1);
    addCoins(500);
    closeVideo();
    showToast("🪙 +500 MONEDAS AÑADIDAS");
  }, [addCoins, closeVideo, showToast]);

  const openPayment = useCallback((amount: number, price: number, icon: string, name: string) => {
    setPendingPack({ amount, price, icon, name });
    setPayPhase("form"); setPayMethod("card"); setPpRendered(false);
    setCcNum(""); setCcName(""); setCcExp(""); setCcCvv("");
    setNumHint({ text: "", err: false }); setNameHint({ text: "", err: false });
    setExpHint({ text: "", err: false }); setCvvHint({ text: "", err: false });
    setNumErr(false); setNameErr(false); setExpErr(false); setCvvErr(false);
    setCardType(""); setCardBg(CARD_TINTS.visa); setCardNetLabel("VISA");
    setCardFlipped(false); setPayOpen(true);
  }, []);

  const closePayment = useCallback(() => {
    setPayOpen(false); setCardFlipped(false); setPpRendered(false);
  }, []);

  const detectCard = useCallback((num: string): CardType => {
    if (/^4/.test(num)) return "visa";
    if (/^5[1-5]|^2[2-7]/.test(num)) return "mc";
    if (/^3[47]/.test(num)) return "amex";
    if (/^6/.test(num)) return "discover";
    return "";
  }, []);

  const handleNumChange = (raw: string) => {
    const v = raw.replace(/\D/g, "").slice(0, 16);
    setCcNum((v.match(/.{1,4}/g) || []).join(" "));
    const type = detectCard(v);
    setCardType(type);
    if (type) { setCardBg(CARD_TINTS[type]); setCardNetLabel(NET_LABELS[type]); }
    if (!v.length) { setNumHint({ text: "", err: false }); setNumErr(false); }
    else if (v.length < 16) { setNumHint({ text: "Ingresa los 16 digitos", err: false }); setNumErr(false); }
    else { setNumHint({ text: "Numero valido", err: false }); setNumErr(false); }
    setCardFlipped(false);
  };

  const handleNameChange = (raw: string) => {
    const val = raw.toUpperCase().replace(/[^A-Z\s]/g, "");
    setCcName(val);
    if (val.trim().split(/\s+/).length >= 2) { setNameHint({ text: "Nombre valido", err: false }); setNameErr(false); }
    else if (val.length > 0) { setNameHint({ text: "Ingresa nombre y apellido", err: false }); setNameErr(false); }
    else { setNameHint({ text: "", err: false }); setNameErr(false); }
    setCardFlipped(false);
  };

  const handleExpChange = (raw: string) => {
    let v = raw.replace(/\D/g, "");
    if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2, 4);
    setCcExp(v);
    if (v.length === 5) {
      const [mm, yy] = v.split("/");
      const month = parseInt(mm, 10);
      const expDate = new Date(parseInt("20" + yy, 10), month, 1);
      if (month < 1 || month > 12) { setExpHint({ text: "Mes invalido", err: true }); setExpErr(true); }
      else if (expDate <= new Date()) { setExpHint({ text: "Tarjeta vencida", err: true }); setExpErr(true); }
      else { setExpHint({ text: "Fecha valida", err: false }); setExpErr(false); }
    } else if (v.length > 0) { setExpHint({ text: "Formato MM/AA", err: false }); setExpErr(false); }
    else { setExpHint({ text: "", err: false }); setExpErr(false); }
    setCardFlipped(false);
  };

  const handleCvvChange = (raw: string) => {
    const v = raw.replace(/\D/g, "").slice(0, 4);
    setCcCvv(v);
    if (v.length >= 3) { setCvvHint({ text: "CVV valido", err: false }); setCvvErr(false); }
    else if (v.length > 0) { setCvvHint({ text: "3 o 4 digitos", err: false }); setCvvErr(false); }
    else { setCvvHint({ text: "", err: false }); setCvvErr(false); }
  };

  const validateCard = () => {
    let valid = true;
    if (ccNum.replace(/\s/g, "").length < 16) { setNumErr(true); setNumHint({ text: "Numero requerido", err: true }); valid = false; }
    if (ccName.trim().split(/\s+/).length < 2 || ccName.length < 3) { setNameErr(true); setNameHint({ text: "Nombre completo requerido", err: true }); valid = false; }
    if (ccExp.length < 5) { setExpErr(true); setExpHint({ text: "Fecha requerida", err: true }); valid = false; }
    if (ccCvv.length < 3) { setCvvErr(true); setCvvHint({ text: "CVV requerido", err: true }); valid = false; }
    return valid;
  };

  const processCardPayment = () => {
    if (!validateCard() || !pendingPack) return;
    setCardFlipped(false);
    setPayPhase("processing");
    setTimeout(() => {
      setPayPhase("success");
      addCoins(pendingPack.amount);
      showToast(`🪙 +${pendingPack.amount.toLocaleString()} MONEDAS AÑADIDAS`);
      setTimeout(() => closePayment(), 2500);
    }, 2200);
  };

  const cardNumDisplay = (() => {
    const v = ccNum.replace(/\s/g, "");
    const filled = v + "•".repeat(Math.max(0, 16 - v.length));
    return (filled.match(/.{1,4}/g) || []).join(" ");
  })();

  const adDots      = "●".repeat(adViewsLeft) + "○".repeat(3 - adViewsLeft);
  const adExhausted = adViewsLeft <= 0;

  const inputCls = (err: boolean, val: string, validLen: number) => {
    if (err) return "field-input error";
    if (val.replace(/\s/g, "").length >= validLen) return "field-input valid";
    return "field-input";
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 pb-20">
      <style>{`
        .shop-card { background:#0d1126; border:1.5px solid #ffe600; border-radius:20px; overflow:hidden; box-shadow:0 0 30px rgba(255,230,0,0.1); position:relative; margin-bottom:20px; }
        .shop-card.green { border-color:#00ff88; box-shadow:0 0 30px rgba(0,255,136,0.1); }
        .shop-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,transparent,#ffe600,#ff2d78,transparent); }
        .shop-card.green::before { background:linear-gradient(90deg,transparent,#00ff88,#00e5ff,transparent); }
        .shop-header { padding:16px 20px; border-bottom:1px solid rgba(255,230,0,0.1); display:flex; align-items:center; gap:10px; }
        .shop-card.green .shop-header { border-bottom-color:rgba(0,255,136,0.1); }
        .shop-title { font-family:'Press Start 2P',monospace; font-size:10px; color:#ffe600; letter-spacing:1px; }
        .shop-card.green .shop-title { color:#00ff88; }
        .ad-pack { background:#111830; border:1.5px solid rgba(0,255,136,0.25); border-radius:14px; padding:22px 16px; text-align:center; cursor:pointer; transition:all 0.2s; }
        .ad-pack:hover:not(.used) { border-color:#00ff88; box-shadow:0 0 22px rgba(0,255,136,0.25); transform:translateY(-2px); }
        .ad-pack.used { opacity:0.45; cursor:not-allowed; border-color:#4a5a7a; }
        .ad-reward-amt { font-family:'Press Start 2P',monospace; font-size:10px; color:#ffe600; margin-bottom:10px; margin-top:8px; }
        .ad-views-counter { font-family:'Press Start 2P',monospace; font-size:8px; color:#00ff88; letter-spacing:2px; margin-bottom:12px; }
        .ad-pack.used .ad-views-counter { color:#4a5a7a; }
        .ad-badge { display:inline-block; padding:6px 18px; border-radius:6px; font-family:'Press Start 2P',monospace; font-size:8px; background:rgba(0,255,136,0.1); border:1px solid rgba(0,255,136,0.3); color:#00ff88; }
        .ad-pack.used .ad-badge { background:rgba(74,90,122,0.2); border-color:#4a5a7a; color:#4a5a7a; }
        .pack-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:4px; }
        .buy-pack { background:#111830; border:1.5px solid rgba(255,230,0,0.2); border-radius:14px; padding:18px 12px; text-align:center; cursor:pointer; transition:all 0.2s; position:relative; }
        .buy-pack:hover { border-color:#ffe600; box-shadow:0 0 20px rgba(255,230,0,0.2); transform:translateY(-2px); }
        .buy-pack.best-buy { border-color:rgba(0,229,255,0.4); }
        .buy-pack.best-buy:hover { border-color:#00e5ff; box-shadow:0 0 20px rgba(0,229,255,0.25); }
        .best-tag { position:absolute; top:-1px; left:50%; transform:translateX(-50%); background:#00e5ff; color:#000; font-family:'Press Start 2P',monospace; font-size:6px; padding:3px 10px; border-radius:0 0 6px 6px; letter-spacing:1px; }
        .buy-icon { font-size:28px; margin-bottom:8px; margin-top:4px; }
        .buy-amt { font-family:'Press Start 2P',monospace; font-size:9px; color:#ddeeff; margin-bottom:6px; line-height:1.6; }
        .buy-price { font-family:'Press Start 2P',monospace; font-size:11px; color:#ffe600; }
        .shop-footer { padding:8px 16px 16px; text-align:center; font-size:11px; color:#4a5a7a; font-weight:600; letter-spacing:1.5px; }
        .voverlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(6px); z-index:1000; display:flex; align-items:center; justify-content:center; opacity:0; pointer-events:none; transition:opacity 0.3s; }
        .voverlay.open { opacity:1; pointer-events:all; }
        .vmodal { background:#0d1126; border:1.5px solid #00e5ff; border-radius:20px; width:min(480px,95vw); overflow:hidden; box-shadow:0 0 60px rgba(0,229,255,0.25); }
        .vmodal-head { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid rgba(0,229,255,0.12); }
        .vmodal-title { font-family:'Press Start 2P',monospace; font-size:9px; color:#00e5ff; }
        .vclose { background:none; border:1px solid #4a5a7a; color:#4a5a7a; width:28px; height:28px; border-radius:6px; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
        .vclose:hover { border-color:#ff2d78; color:#ff2d78; }
        .vid-progress-wrap { position:relative; aspect-ratio:16/9; background:#000; }
        .skip-badge { position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.75); border:1px solid rgba(255,255,255,0.15); border-radius:8px; padding:5px 10px; font-family:'Press Start 2P',monospace; font-size:8px; color:#fff; display:flex; align-items:center; gap:5px; }
        .vid-bar { height:5px; background:rgba(255,255,255,0.1); }
        .vid-bar-fill { height:100%; background:linear-gradient(90deg,#00e5ff,#00ff88); transition:width 0.5s linear; }
        .vmodal-foot { display:flex; align-items:center; justify-content:space-between; padding:16px 18px; }
        .reward-text { font-family:'Press Start 2P',monospace; font-size:8px; color:#ffe600; line-height:2; }
        .claim-btn { padding:10px 20px; border-radius:10px; border:none; font-family:'Press Start 2P',monospace; font-size:8px; cursor:not-allowed; background:#111830; color:#4a5a7a; letter-spacing:1px; transition:all 0.3s; }
        .claim-btn.ready { background:linear-gradient(135deg,#00ff88,#00b860); color:#000; cursor:pointer; box-shadow:0 0 20px rgba(0,255,136,0.4); }
        .claim-btn.ready:hover { transform:scale(1.05); }
        .pay-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:1001; display:flex; align-items:center; justify-content:center; padding:16px; opacity:0; pointer-events:none; transition:opacity 0.3s; }
        .pay-overlay.open { opacity:1; pointer-events:all; }
        .pay-modal { background:#0d1126; border:1.5px solid #ffe600; border-radius:20px; width:min(460px,100%); max-height:90vh; overflow-y:auto; box-shadow:0 0 60px rgba(255,230,0,0.2); position:relative; scrollbar-width:none; }
        .pay-modal::-webkit-scrollbar { display:none; }
        .pay-head { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid rgba(255,230,0,0.12); position:sticky; top:0; background:#0d1126; z-index:5; }
        .pay-title { font-family:'Press Start 2P',monospace; font-size:9px; color:#ffe600; }
        .pay-close { background:none; border:1px solid #4a5a7a; color:#4a5a7a; width:28px; height:28px; border-radius:6px; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
        .pay-close:hover { border-color:#ff2d78; color:#ff2d78; }
        .pay-summary { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; background:rgba(255,230,0,0.04); border-bottom:1px solid rgba(255,230,0,0.1); }
        .pay-sum-left { display:flex; align-items:center; gap:12px; }
        .pay-sum-icon { font-size:28px; }
        .pay-sum-name { font-family:'Press Start 2P',monospace; font-size:9px; color:#ffe600; line-height:1.8; }
        .pay-sum-sub { font-size:11px; color:#4a5a7a; font-weight:600; }
        .pay-sum-price { font-family:'Press Start 2P',monospace; font-size:14px; color:#00ff88; }
        .method-tabs { display:flex; gap:8px; padding:16px 20px 0; }
        .method-tab { flex:1; padding:10px; border-radius:10px; border:1.5px solid rgba(255,255,255,0.08); background:#111830; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; font-family:'Press Start 2P',monospace; font-size:7px; color:#4a5a7a; }
        .method-tab.active { border-color:#ffe600; background:rgba(255,230,0,0.06); color:#ffe600; }
        .method-tab.paypal-tab.active { border-color:#009cde; background:rgba(0,156,222,0.06); }
        .card-visual-wrap { padding:18px 20px 12px; }
        .card-scene { width:100%; aspect-ratio:1.586; perspective:1000px; }
        .card-inner { width:100%; height:100%; position:relative; transform-style:preserve-3d; transition:transform 0.65s cubic-bezier(.4,0,.2,1); }
        .card-inner.flipped { transform:rotateY(180deg); }
        .card-face { position:absolute; inset:0; border-radius:14px; padding:20px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); box-shadow:0 10px 40px rgba(0,0,0,0.6); backface-visibility:hidden; -webkit-backface-visibility:hidden; transition:background 0.4s; }
        .card-back { transform:rotateY(180deg); }
        .card-network { position:absolute; top:18px; right:18px; font-family:'Press Start 2P',monospace; font-size:7px; color:rgba(255,255,255,0.5); letter-spacing:2px; }
        .card-chip { width:38px; height:28px; border-radius:5px; background:linear-gradient(135deg,#c8a84b,#f0d060,#c8a84b); border:1px solid rgba(255,220,100,0.5); margin-bottom:14px; display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr 1fr; gap:2px; padding:4px; overflow:hidden; }
        .chip-line { background:rgba(0,0,0,0.3); border-radius:1px; }
        .chip-line.full { grid-column:1/-1; }
        .card-number-display { font-family:'Press Start 2P',monospace; font-size:clamp(10px,3vw,13px); letter-spacing:3px; color:rgba(255,255,255,0.9); margin-bottom:16px; word-spacing:8px; }
        .card-bottom { display:flex; justify-content:space-between; align-items:flex-end; }
        .card-label { font-size:8px; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:2px; margin-bottom:3px; font-weight:600; }
        .card-holder-display { font-family:'Press Start 2P',monospace; font-size:7px; color:rgba(255,255,255,0.8); }
        .card-exp-display { font-family:'Press Start 2P',monospace; font-size:10px; color:rgba(255,255,255,0.8); text-align:right; }
        .card-magstripe { position:absolute; top:28px; left:0; right:0; height:44px; background:linear-gradient(180deg,#1a1a1a,#111,#1a1a1a); }
        .card-sig-area { position:absolute; top:88px; left:20px; right:20px; display:flex; align-items:stretch; gap:10px; height:38px; }
        .card-sig-lines { flex:1; background:#f5f5f0; border-radius:4px; display:flex; flex-direction:column; justify-content:space-around; padding:5px 8px; }
        .sig-line { height:2px; background:repeating-linear-gradient(90deg,#b0b8c0 0px,#b0b8c0 4px,transparent 4px,transparent 8px); }
        .card-cvv-box { background:#fff; border-radius:4px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4px 12px; min-width:52px; }
        .cvv-label { font-size:7px; color:#333; font-family:'Press Start 2P',monospace; margin-bottom:3px; }
        .card-cvv-display { font-family:'Press Start 2P',monospace; font-size:11px; color:#000; letter-spacing:3px; }
        .card-back-footer { position:absolute; bottom:14px; left:0; right:0; text-align:center; }
        .pay-form { padding:6px 20px 20px; }
        .field-group { margin-bottom:12px; }
        .field-label { display:block; font-family:'Press Start 2P',monospace; font-size:7px; color:#4a5a7a; letter-spacing:1.5px; margin-bottom:7px; text-transform:uppercase; }
        .field-input { width:100%; background:#111830; border:1.5px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px 14px; font-family:'Rajdhani',sans-serif; font-size:16px; font-weight:600; color:#ddeeff; outline:none; transition:all 0.2s; letter-spacing:1px; }
        .field-input::placeholder { color:#4a5a7a; font-size:14px; }
        .field-input:focus { border-color:#ffe600; box-shadow:0 0 0 3px rgba(255,230,0,0.08); }
        .field-input.valid { border-color:#00ff88; }
        .field-input.error { border-color:#ff2d78; animation:shake 0.3s; }
        @keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-5px);} 75%{transform:translateX(5px);} }
        .field-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .field-hint { font-size:10px; color:#4a5a7a; margin-top:4px; font-weight:600; }
        .field-hint.err { color:#ff2d78; }
        .card-types { display:flex; gap:6px; margin-bottom:14px; }
        .ctype { padding:5px 10px; border-radius:6px; font-family:'Press Start 2P',monospace; font-size:6px; border:1px solid rgba(255,255,255,0.1); color:#4a5a7a; background:#111830; transition:all 0.2s; }
        .ctype.active { border-color:#ffe600; color:#ffe600; background:rgba(255,230,0,0.06); }
        .pay-btn { width:100%; padding:14px; border-radius:10px; border:none; font-family:'Press Start 2P',monospace; font-size:9px; cursor:pointer; letter-spacing:1.5px; background:linear-gradient(135deg,#ffe600,#ffb700); color:#000; transition:all 0.2s; box-shadow:0 4px 20px rgba(255,230,0,0.3); margin-top:14px; position:relative; overflow:hidden; }
        .pay-btn:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(255,230,0,0.5); }
        .btn-shine { position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); transform:skewX(-20deg); animation:shine 2.5s infinite; }
        @keyframes shine { 0%{left:-100%;} 60%,100%{left:150%;} }
        .processing-wrap { display:none; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; gap:18px; }
        .processing-wrap.show { display:flex; }
        .success-wrap { display:none; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; gap:14px; }
        .success-wrap.show { display:flex; }
        .spinner { width:50px; height:50px; border:3px solid rgba(255,230,0,0.1); border-top-color:#ffe600; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg);} }
        .proc-text { font-family:'Press Start 2P',monospace; font-size:9px; color:#ffe600; letter-spacing:1.5px; text-align:center; line-height:2; }
        .success-icon { font-size:52px; animation:popIn 0.5s cubic-bezier(.34,1.56,.64,1); }
        @keyframes popIn { 0%{transform:scale(0);} 100%{transform:scale(1);} }
        .success-title { font-family:'Press Start 2P',monospace; font-size:11px; color:#00ff88; text-align:center; }
        .success-sub { font-family:'Press Start 2P',monospace; font-size:8px; color:#4a5a7a; text-align:center; line-height:2; }
        .success-coins { font-family:'Press Start 2P',monospace; font-size:16px; color:#ffe600; text-shadow:0 0 15px rgba(255,230,0,0.5); }
        .secure-row { display:flex; align-items:center; justify-content:center; gap:8px; padding:0 20px 16px; font-family:'Press Start 2P',monospace; font-size:7px; color:#4a5a7a; letter-spacing:1px; }
        .pp-container { padding:16px 20px 4px; }
        #paypal-button-container { min-height:50px; }
        .coins-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(80px); background:#111830; border:1.5px solid rgba(0,255,136,0.3); border-radius:12px; padding:12px 22px; font-family:'Press Start 2P',monospace; font-size:9px; color:#00ff88; z-index:9999; pointer-events:none; opacity:0; transition:all 0.3s; white-space:nowrap; box-shadow:0 8px 30px rgba(0,0,0,0.4); }
        .coins-toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
      `}</style>

      {/* TITULO */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🪙</span>
        <div>
          <h1 className="font-['Press_Start_2P'] text-[#ffd700] text-lg drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">MONEDAS</h1>
          {user && (
            <p className={`font-['Press_Start_2P'] text-[10px] mt-1 transition-all ${coinsPulse ? "text-[#00ff88]" : "text-[#ffd700]"}`}>
              Saldo: {coins.toLocaleString()} 🪙
            </p>
          )}
        </div>
      </div>

      {/* VER VIDEO */}
      <div className="shop-card green">
        <div className="shop-header">
          <span style={{ fontSize: 20 }}>🎬</span>
          <span className="shop-title">VER VIDEO — GRATIS</span>
        </div>
        <div style={{ padding: "16px" }}>
          <div className={`ad-pack${adExhausted ? " used" : ""}`} onClick={adExhausted ? undefined : openAd}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📺</div>
            <div className="ad-reward-amt">+500 🪙 por vista</div>
            <div className="ad-views-counter">{adExhausted ? "○○○  Sin vistas restantes" : `${adDots}  ${adViewsLeft} de 3 restantes`}</div>
            <div className="ad-badge">{adExhausted ? "✓ AGOTADO" : "VER AHORA"}</div>
          </div>
        </div>
      </div>

      {/* COMPRAR */}
      <div className="shop-card">
        <div className="shop-header">
          <span style={{ fontSize: 20 }}>💳</span>
          <span className="shop-title">COMPRAR MONEDAS</span>
        </div>
        <div style={{ padding: "16px 16px 4px" }}>
          <div className="pack-grid">
            <div className="buy-pack" onClick={() => openPayment(500, 0.99, "💰", "Bolsa Pequena")}>
              <div className="buy-icon">💰</div><div className="buy-amt">500 🪙</div><div className="buy-price">$0.99</div>
            </div>
            <div className="buy-pack best-buy" onClick={() => openPayment(1500, 1.99, "💎", "Pack Gema")}>
              <div className="best-tag">MEJOR</div><div className="buy-icon">💎</div><div className="buy-amt">1,500 🪙</div><div className="buy-price">$1.99</div>
            </div>
            <div className="buy-pack" onClick={() => openPayment(3500, 3.99, "👑", "Pack Corona")}>
              <div className="buy-icon">👑</div><div className="buy-amt">3,500 🪙</div><div className="buy-price">$3.99</div>
            </div>
            <div className="buy-pack" onClick={() => openPayment(10000, 9.99, "🏆", "Pack Trofeo")}>
              <div className="buy-icon">🏆</div><div className="buy-amt">10,000 🪙</div><div className="buy-price">$9.99</div>
            </div>
          </div>
        </div>
        <div className="shop-footer">HAZ CLIC EN UN PACK PARA COMPRARLO</div>
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
            {!adFinished && <div className="skip-badge">⏳ <span>{countdown}</span>s</div>}
            <div className="vid-bar"><div className="vid-bar-fill" style={{ width: `${vidPct}%` }} /></div>
          </div>
          <div className="vmodal-foot">
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 22 }}>🪙</span>
              <div className="reward-text">RECOMPENSA<br />+500 MONEDAS</div>
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
              <div className="pay-sum-price">${pendingPack.price.toFixed(2)}</div>
            </div>
          )}

          {payPhase === "form" && (
            <div className="method-tabs">
              <div className={`method-tab${payMethod === "card" ? " active" : ""}`} onClick={() => { setPayMethod("card"); setPpRendered(false); }}>
                💳 TARJETA
              </div>
              <div className={`method-tab paypal-tab${payMethod === "paypal" ? " active" : ""}`} onClick={() => { setPayMethod("paypal"); setPpRendered(false); }}>
                <span style={{ fontWeight: 900, fontFamily: "Arial", fontSize: 13, color: payMethod === "paypal" ? "#003087" : "#4a5a7a" }}>Pay</span>
                <span style={{ fontWeight: 900, fontFamily: "Arial", fontSize: 13, color: payMethod === "paypal" ? "#009cde" : "#4a5a7a" }}>Pal</span>
              </div>
            </div>
          )}

          {/* CARD VISUAL */}
          {payMethod === "card" && payPhase === "form" && (
            <div className="card-visual-wrap">
              <div className="card-scene">
                <div className={`card-inner${cardFlipped ? " flipped" : ""}`}>
                  <div className="card-face" style={{ background: cardBg }}>
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
                  <div className="card-face card-back" style={{ background: cardBg }}>
                    <div className="card-network">{cardNetLabel}</div>
                    <div className="card-magstripe" />
                    <div className="card-sig-area">
                      <div className="card-sig-lines"><div className="sig-line" /><div className="sig-line" /><div className="sig-line" /></div>
                      <div className="card-cvv-box"><div className="cvv-label">CVV</div><div className="card-cvv-display">{ccCvv ? "•".repeat(ccCvv.length) : "•••"}</div></div>
                    </div>
                    <div className="card-back-footer"><span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "'Press Start 2P',monospace" }}>SABERIX CARD</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pay-form">
            <div className={`processing-wrap${payPhase === "processing" ? " show" : ""}`}>
              <div className="spinner" />
              <div className="proc-text">PROCESANDO<br />PAGO...</div>
            </div>
            <div className={`success-wrap${payPhase === "success" ? " show" : ""}`}>
              <div className="success-icon">✅</div>
              <div className="success-title">PAGO EXITOSO</div>
              <div className="success-coins">+{pendingPack?.amount.toLocaleString()} 🪙</div>
              <div className="success-sub">MONEDAS AÑADIDAS<br />A TU CUENTA</div>
            </div>

            {payPhase === "form" && payMethod === "card" && (
              <div>
                <div className="card-types">
                  {(["visa", "mc", "amex", "discover"] as CardType[]).map(t => (
                    <div key={t} className={`ctype${cardType === t ? " active" : ""}`}>{t === "mc" ? "MC" : t === "discover" ? "DISC" : t.toUpperCase()}</div>
                  ))}
                </div>
                <div className="field-group">
                  <label className="field-label">Numero de Tarjeta</label>
                  <input className={inputCls(numErr, ccNum.replace(/\s/g,""), 16)} type="text" inputMode="numeric" maxLength={19} placeholder="0000 0000 0000 0000" value={ccNum} onChange={e => handleNumChange(e.target.value)} autoComplete="cc-number" />
                  {numHint.text && <div className={`field-hint${numHint.err ? " err" : ""}`}>{numHint.text}</div>}
                </div>
                <div className="field-group">
                  <label className="field-label">Nombre del Titular</label>
                  <input className={inputCls(nameErr, ccName, 5)} type="text" maxLength={26} placeholder="Como aparece en la tarjeta" value={ccName} onChange={e => handleNameChange(e.target.value)} autoComplete="cc-name" style={{ textTransform: "uppercase" }} />
                  {nameHint.text && <div className={`field-hint${nameHint.err ? " err" : ""}`}>{nameHint.text}</div>}
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label className="field-label">Vencimiento</label>
                    <input className={inputCls(expErr, ccExp, 5)} type="text" inputMode="numeric" maxLength={5} placeholder="MM/AA" value={ccExp} onChange={e => handleExpChange(e.target.value)} autoComplete="cc-exp" />
                    {expHint.text && <div className={`field-hint${expHint.err ? " err" : ""}`}>{expHint.text}</div>}
                  </div>
                  <div className="field-group">
                    <label className="field-label">CVV / CVC</label>
                    <input className={inputCls(cvvErr, ccCvv, 3)} type="text" inputMode="numeric" maxLength={4} placeholder="•••" value={ccCvv} onChange={e => handleCvvChange(e.target.value)} onFocus={() => setCardFlipped(true)} onBlur={() => setCardFlipped(false)} autoComplete="cc-csc" />
                    {cvvHint.text && <div className={`field-hint${cvvHint.err ? " err" : ""}`}>{cvvHint.text}</div>}
                  </div>
                </div>
                <button className="pay-btn" onClick={processCardPayment}>
                  <span className="btn-shine" />
                  PAGAR ${pendingPack?.price.toFixed(2)}
                </button>
              </div>
            )}

            {payPhase === "form" && payMethod === "paypal" && (
              <div className="pp-container" ref={ppContainerRef}>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#003087", fontFamily: "Arial" }}>Pay</span>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#009cde", fontFamily: "Arial" }}>Pal</span>
                </div>
                <div id="paypal-button-container" />
              </div>
            )}
          </div>

          <div className="secure-row">
            <span style={{ fontSize: 12 }}>🔒</span>PAGO 100% SEGURO · ENCRIPTADO SSL
          </div>
        </div>
      </div>

      <div className={`coins-toast${toast.show ? " show" : ""}`}>{toast.msg}</div>
    </div>
  );
}

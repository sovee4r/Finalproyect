import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Bell, Shield, LogOut, Monitor, Languages, Check, AlertTriangle } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

function cn(...c: any[]) { return c.filter(Boolean).join(" "); }

function ToggleOption({
  label, desc, storageKey, defaultChecked, onChange,
}: {
  label: string; desc: string; storageKey: string;
  defaultChecked?: boolean; onChange?: (v: boolean) => void;
}) {
  const [checked, setChecked] = useState(() => {
    const s = localStorage.getItem(`settings_${storageKey}`);
    return s !== null ? s === "true" : (defaultChecked ?? false);
  });
  const toggle = () => {
    const next = !checked;
    setChecked(next);
    localStorage.setItem(`settings_${storageKey}`, String(next));
    onChange?.(next);
  };
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <div className="text-sm font-bold text-gray-200">{label}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
      <button onClick={toggle}
        className={cn("w-12 h-6 rounded-full relative transition-colors duration-300",
          checked ? "bg-[#00ff88]" : "bg-gray-700")}>
        <div className={cn(
          "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md",
          checked ? "translate-x-6" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}

function AlertBox({ msg, type }: { msg: string; type: "error" | "success" }) {
  return (
    <div className={cn(
      "text-xs p-3 rounded-lg border flex items-center gap-2",
      type === "error"
        ? "bg-red-500/20 border-red-500/50 text-red-400"
        : "bg-green-500/20 border-green-500/50 text-green-400"
    )}>
      {type === "success" ? <Check size={13} /> : <AlertTriangle size={13} />}
      {msg}
    </div>
  );
}

export function Settings() {
  const { user, logout, login } = useAuth();
  const navigate                = useNavigate();
  const { t, i18n }             = useTranslation();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteConfirm,  setShowDeleteConfirm]  = useState(false);
  const [showEditProfile,    setShowEditProfile]    = useState(false);

  const [passwordData,    setPasswordData]    = useState({ actual: "", nueva: "", confirmar: "" });
  const [passwordError,   setPasswordError]   = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [savingPassword,  setSavingPassword]  = useState(false);

  const [profileData,    setProfileData]    = useState({ nombre: user?.nombre ?? "", bio: user?.bio ?? "", foto: user?.foto ?? "" });
  const [profileError,   setProfileError]   = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [savingProfile,  setSavingProfile]  = useState(false);

  const [deleteError,     setDeleteError]     = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [highContrast,    setHighContrast]    = useState(() => localStorage.getItem("settings_highContrast") === "true");
  const [reducedMotion,   setReducedMotion]   = useState(() => localStorage.getItem("settings_reducedMotion") === "true");

  useEffect(() => {
    if ("Notification" in window) setNotifPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (user) setProfileData({ nombre: user.nombre ?? "", bio: user.bio ?? "", foto: user.foto ?? "" });
  }, [user]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleLangChange = (lang: "es" | "en") => {
    localStorage.setItem("settings_lang", lang);
    i18n.changeLanguage(lang);
  };

  const handleHighContrast = (v: boolean) => {
    setHighContrast(v);
    localStorage.setItem("settings_highContrast", String(v));
    document.body.classList.toggle("high-contrast", v);
  };

  const handleReducedMotion = (v: boolean) => {
    setReducedMotion(v);
    localStorage.setItem("settings_reducedMotion", String(v));
    document.documentElement.style.setProperty("--animation-duration", v ? "0.01ms" : "");
  };

  const requestNotifications = async (val: boolean) => {
    if (!val) return;
    if ("Notification" in window && Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(""); setPasswordSuccess("");
    if (!passwordData.actual || !passwordData.nueva || !passwordData.confirmar) {
      setPasswordError(t("fillAllFields")); return;
    }
    if (passwordData.nueva !== passwordData.confirmar) {
      setPasswordError(t("passwordsNoMatch")); return;
    }
    if (passwordData.nueva.length < 6) {
      setPasswordError(t("min6Chars")); return;
    }
    setSavingPassword(true);
    try {
      const res  = await fetch("https://finalproyect-production-3837.up.railway.app/api/auth/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, passwordActual: passwordData.actual, passwordNueva: passwordData.nueva }),
      });
      const data = await res.json();
      if (!res.ok) { setPasswordError(data.error || t("serverError")); return; }
      setPasswordSuccess(t("passwordUpdated"));
      setPasswordData({ actual: "", nueva: "", confirmar: "" });
      setTimeout(() => { setShowChangePassword(false); setPasswordSuccess(""); }, 2500);
    } catch { setPasswordError(t("connectionError")); }
    finally   { setSavingPassword(false); }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileError(""); setProfileSuccess("");
    if (!profileData.nombre.trim()) { setProfileError(t("nameRequired")); return; }
    setSavingProfile(true);
    try {
      const res  = await fetch("https://finalproyect-production-3837.up.railway.app/api/auth/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, nombre: profileData.nombre.trim(), bio: profileData.bio, foto: profileData.foto || user.foto }),
      });
      const data = await res.json();
      if (!res.ok) { setProfileError(data.error || t("serverError")); return; }
      login(data.user);
      setProfileSuccess(t("profileUpdated"));
      setTimeout(() => { setShowEditProfile(false); setProfileSuccess(""); }, 2500);
    } catch { setProfileError(t("connectionError")); }
    finally   { setSavingProfile(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(""); setDeletingAccount(true);
    try {
      const res  = await fetch("https://finalproyect-production-3837.up.railway.app/api/auth/delete-account", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error || t("serverError")); return; }
      logout(); navigate("/");
    } catch { setDeleteError(t("connectionError")); }
    finally   { setDeletingAccount(false); }
  };

  const currentLang = i18n.language as "es" | "en";

  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      <div className="text-center mb-10">
        <h1 className="font-['Press_Start_2P'] text-white text-2xl md:text-3xl mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          {t("settings")}
        </h1>
        <p className="text-gray-400 text-xs">{t("settingsDesc")}</p>
      </div>

      <div className="space-y-6">

        {/* ══ IDIOMA ══ */}
        <SettingsSection title={t("language")} icon={<Languages size={18} />}>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-bold text-gray-200">{t("language")}</div>
              <div className="text-xs text-gray-500">{t("languageDesc")}</div>
            </div>
            <div className="flex gap-2">
              {(["es", "en"] as const).map(l => (
                <button key={l}
                  onClick={() => handleLangChange(l)}
                  className={cn("px-4 py-2 rounded-lg text-xs font-bold border transition-all",
                    currentLang === l
                      ? "bg-[#00d9ff]/20 text-[#00d9ff] border-[#00d9ff]/50"
                      : "bg-white/5 text-gray-400 border-white/10 hover:border-white/25")}>
                  {l === "es" ? "🇩🇴 Español" : "🇺🇸 English"}
                </button>
              ))}
            </div>
          </div>
        </SettingsSection>

        {/* ══ PANTALLA ══ */}
        <SettingsSection title={t("display")} icon={<Monitor size={18} />}>
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div className="text-sm font-bold text-gray-200">{t("highContrast")}</div>
              <div className="text-xs text-gray-500">{t("highContrastDesc")}</div>
            </div>
            <button onClick={() => handleHighContrast(!highContrast)}
              className={cn("w-12 h-6 rounded-full relative transition-colors duration-300",
                highContrast ? "bg-[#00ff88]" : "bg-gray-700")}>
              <div className={cn(
                "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md",
                highContrast ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div className="text-sm font-bold text-gray-200">{t("reducedMotion")}</div>
              <div className="text-xs text-gray-500">{t("reducedMotionDesc")}</div>
            </div>
            <button onClick={() => handleReducedMotion(!reducedMotion)}
              className={cn("w-12 h-6 rounded-full relative transition-colors duration-300",
                reducedMotion ? "bg-[#00ff88]" : "bg-gray-700")}>
              <div className={cn(
                "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md",
                reducedMotion ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>
          <ToggleOption label={t("gameStats")} desc={t("gameStatsDesc")} storageKey="showGameStats" defaultChecked={true} />
        </SettingsSection>

        {/* ══ NOTIFICACIONES ══ */}
        <SettingsSection title={t("notifications")} icon={<Bell size={18} />}>
          {notifPermission === "denied" && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs p-3 rounded-lg mb-2 flex items-center gap-2">
              <AlertTriangle size={13} />{t("notifBlocked")}
            </div>
          )}
          {notifPermission === "granted" && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs p-3 rounded-lg mb-2 flex items-center gap-2">
              <Check size={13} />{t("notifActive")}
            </div>
          )}
          <ToggleOption label={t("gameInvites")}    desc={t("gameInvitesDesc")}    storageKey="notifGameInvites"  defaultChecked={true} onChange={requestNotifications} />
          <ToggleOption label={t("newAchievements")} desc={t("newAchievementsDesc")} storageKey="notifAchievements" defaultChecked={true} onChange={requestNotifications} />
          <ToggleOption label={t("friendRequests")} desc={t("friendRequestsDesc")} storageKey="notifFriends"      defaultChecked={true} onChange={requestNotifications} />
          <ToggleOption label={t("newMessages")}    desc={t("newMessagesDesc")}    storageKey="notifMessages"     defaultChecked={true} onChange={requestNotifications} />
          <ToggleOption label={t("marketing")}      desc={t("marketingDesc")}      storageKey="notifMarketing" />
        </SettingsSection>

        {/* ══ CUENTA ══ */}
        <SettingsSection title={t("account")} icon={<Shield size={18} />}>
          {user && (
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                {user.foto
                  ? <img src={user.foto} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-[#00d9ff]" />
                  : <div className="w-10 h-10 rounded-full bg-[#1a1f35] border-2 border-[#00d9ff] flex items-center justify-center font-bold text-[#00d9ff] text-lg">
                      {user.nombre[0]?.toUpperCase()}
                    </div>
                }
                <div>
                  <div className="text-sm font-bold text-white">{user.nombre}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
              <button onClick={() => { setShowEditProfile(!showEditProfile); setProfileError(""); setProfileSuccess(""); }}
                className="px-4 py-2 bg-[#1a1f35] border border-white/10 rounded-lg text-xs text-white hover:bg-white/5 transition-colors">
                {showEditProfile ? t("cancel") : t("edit")}
              </button>
            </div>
          )}

          {showEditProfile && (
            <div className="py-4 border-b border-white/5 space-y-3">
              {profileError   && <AlertBox msg={profileError}   type="error"   />}
              {profileSuccess && <AlertBox msg={profileSuccess} type="success" />}
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block">{t("username")}</label>
                <input type="text" value={profileData.nombre} maxLength={50}
                  onChange={e => setProfileData({ ...profileData, nombre: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#00d9ff]/50 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block">{t("biography")}</label>
                <textarea value={profileData.bio} rows={3} maxLength={200}
                  onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder={t("bioPlaceholder")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#00d9ff]/50 transition-colors resize-none placeholder:text-gray-600" />
                <div className="text-right text-[10px] text-gray-600 mt-0.5">{profileData.bio?.length ?? 0}/200</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block">{t("photoUrl")}</label>
                <input type="url" value={profileData.foto}
                  onChange={e => setProfileData({ ...profileData, foto: e.target.value })}
                  placeholder={t("photoPlaceholder")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#00d9ff]/50 transition-colors placeholder:text-gray-600" />
                {profileData.foto && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={profileData.foto} alt="preview"
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                      onError={e => { e.currentTarget.style.display = "none"; }} />
                    <span className="text-xs text-gray-500">{t("preview")}</span>
                  </div>
                )}
              </div>
              <button onClick={handleSaveProfile} disabled={savingProfile}
                className="w-full py-3 rounded-lg font-bold text-sm text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#00d9ff,#0096ff)", boxShadow: "0 4px 16px rgba(0,217,255,0.3)" }}>
                {savingProfile
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("saving")}</>
                  : <><Check size={14} />{t("saveChanges")}</>}
              </button>
            </div>
          )}

          <div className="py-3 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-gray-200">{t("changePassword")}</div>
                <div className="text-xs text-gray-500">{t("changePasswordDesc")}</div>
              </div>
              <button onClick={() => { setShowChangePassword(!showChangePassword); setPasswordError(""); setPasswordSuccess(""); }}
                className="px-4 py-2 bg-[#1a1f35] border border-white/10 rounded-lg text-xs text-white hover:bg-white/5 transition-colors">
                {showChangePassword ? t("cancel") : t("edit")}
              </button>
            </div>
            {showChangePassword && (
              <div className="mt-4 space-y-3">
                {passwordError   && <AlertBox msg={passwordError}   type="error"   />}
                {passwordSuccess && <AlertBox msg={passwordSuccess} type="success" />}
                {[
                  { ph: t("currentPassword"), k: "actual"    as const },
                  { ph: t("newPassword"),     k: "nueva"     as const },
                  { ph: t("confirmPassword"), k: "confirmar" as const },
                ].map(f => (
                  <input key={f.k} type="password" placeholder={f.ph} value={passwordData[f.k]}
                    onChange={e => setPasswordData({ ...passwordData, [f.k]: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && handleChangePassword()}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#00d9ff]/50 transition-colors placeholder:text-gray-600" />
                ))}
                <button onClick={handleChangePassword} disabled={savingPassword}
                  className="w-full py-3 rounded-lg font-bold text-sm text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#00d9ff,#0096ff)" }}>
                  {savingPassword
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("saving")}</>
                    : t("savePassword")}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div className="text-sm font-bold text-gray-200">{t("logout")}</div>
              <div className="text-xs text-gray-500">{t("logoutDesc")}</div>
            </div>
            <button onClick={handleLogout}
              className="px-4 py-2 bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] rounded-lg text-xs hover:bg-[#ffd700]/20 transition-colors font-bold">
              {t("salir")}
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-bold text-[#ff1b8d]">{t("dangerZone")}</div>
              <div className="text-xs text-gray-500">{t("dangerZoneDesc")}</div>
            </div>
            <button onClick={() => { setShowDeleteConfirm(true); setDeleteError(""); }}
              className="px-4 py-2 bg-[#ff1b8d]/10 border border-[#ff1b8d]/30 text-[#ff1b8d] rounded-lg text-xs hover:bg-[#ff1b8d] hover:text-white transition-colors font-bold">
              {t("deleteAccount")}
            </button>
          </div>
        </SettingsSection>
      </div>

      <div className="mt-8 text-center">
        <button onClick={handleLogout}
          className="flex items-center gap-2 mx-auto text-gray-500 hover:text-[#ff1b8d] transition-colors text-xs font-bold">
          <LogOut size={16} /> {t("logout")}
        </button>
        <div className="mt-4 text-[10px] text-gray-600 font-mono">Saberix v1.0.5 (Build 2026.03.19)</div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0f1425] border-2 border-[#ff1b8d] rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(255,27,141,0.1)", border: "1.5px solid rgba(255,27,141,0.3)" }}>
              <AlertTriangle size={26} className="text-[#ff1b8d]" />
            </div>
            <h2 className="font-['Press_Start_2P'] text-[#ff1b8d] text-sm mb-4">{t("deleteTitle")}</h2>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">{t("deleteDesc")}</p>
            {deleteError && <div className="mb-4"><AlertBox msg={deleteError} type="error" /></div>}
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-colors">
                {t("cancel")}
              </button>
              <button onClick={handleDeleteAccount} disabled={deletingAccount}
                className="flex-1 py-3 bg-[#ff1b8d] text-white text-xs font-bold rounded-lg hover:bg-[#ff1b8d]/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {deletingAccount
                  ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("deleting")}</>
                  : t("deleteConfirm")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const SettingsSection = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
    className="bg-[#0f1425] border border-white/10 rounded-xl overflow-hidden">
    <div className="px-6 py-4 bg-[#1a1f35] border-b border-white/10 flex items-center gap-3">
      <div className="text-[#00d9ff]">{icon}</div>
      <h3 className="font-['Press_Start_2P'] text-xs text-white">{title}</h3>
    </div>
    <div className="p-6 space-y-2">{children}</div>
  </motion.div>
);

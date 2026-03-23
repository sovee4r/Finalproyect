import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../AuthContext";

export function GoogleCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get("user");
    const error = params.get("error");

    if (error || !userParam) {
      navigate("/login?error=google_failed");
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      login(user);
      navigate("/");
    } catch {
      navigate("/login?error=parse_failed");
    }
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse 120% 100% at 50% 0%, #040d1e 0%, #07091a 50%, #000 100%)" }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#00e5ff]/30 border-t-[#00e5ff] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#00e5ff] font-['Press_Start_2P'] text-xs">Iniciando sesión...</p>
      </div>
    </div>
  );
}

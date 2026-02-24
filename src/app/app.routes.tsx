import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { GamesHub } from "./components/GamesHub";
import { Games } from "./components/Games";
import { Avatar } from "./components/Avatar";
import { Friends } from "./components/Friends";
import { Profile } from "./components/Profile";
import { Settings } from "./components/Settings";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { Character } from "./components/Character";

function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
       <div className="font-['Press_Start_2P'] text-4xl text-[#ff1b8d] mb-4">404</div>
       <div className="font-['Press_Start_2P'] text-sm text-white">Página no encontrada</div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "games", Component: GamesHub },
      { path: "games/:subject", Component: Games },
      { path: "avatar", Component: Avatar },
      { path: "friends", Component: Friends },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
      { path: "character", Component: Character },
      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
]);

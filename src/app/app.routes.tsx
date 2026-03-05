import { createBrowserRouter } from "react-router";
import { Layout }       from "./components/Layout";
import { Home }         from "./components/Home";
import { Games }        from "./components/Games";
import { QuizLengua4 }  from "./components/QuizLengua4";
import { Avatar }       from "./components/Avatar";
import { Friends }      from "./components/Friends";
import { Profile }      from "./components/Profile";
import { Settings }     from "./components/Settings";
import { Help }         from "./components/Help";
import { Login }        from "./components/Login";
import { Register }     from "./components/Register";

function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
      <div className="font-['Press_Start_2P'] text-4xl text-[#ff1b8d] mb-4">404</div>
      <div className="font-['Press_Start_2P'] text-sm text-white">Pagina no encontrada</div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true,                   Component: Home        },
      // Quiz ANTES de games/:subject para evitar conflicto de rutas
      { path: "games/language/quiz/4", Component: QuizLengua4 },
      { path: "games",                 Component: Games       },
      { path: "games/:subject",        Component: Games       },
      { path: "avatar",                Component: Avatar      },
      { path: "friends",               Component: Friends     },
      { path: "profile",               Component: Profile     },
      { path: "settings",              Component: Settings    },
      { path: "help",                  Component: Help        },
      { path: "*",                     Component: NotFound    },
    ],
  },
  // Login y Register fuera del Layout (pantalla completa)
  { path: "/login",    Component: Login    },
  { path: "/register", Component: Register },
]);

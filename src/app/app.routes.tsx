import { createBrowserRouter } from "react-router";
import { Layout }             from "./components/Layout";
import { Home }               from "./components/Home";
import { Games }              from "./components/Games";
import { QuizLengua4 }        from "./components/QuizLengua4";
import { Avatar }             from "./components/Avatar";
import { Friends }            from "./components/Friends";
import { Profile }            from "./components/Profile";
import { Settings }           from "./components/Settings";
import { Help }               from "./components/Help";
import { Login }              from "./components/Login";
import { Register }           from "./components/Register";
import { GoogleCallback }     from "./components/GoogleCallback";
import { Chat }               from "./components/Chat";

// ── Lengua ──
import { AhorcadoLengua }     from "./components/games-lengua/AhorcadoLengua";
import { CompletaOracion }    from "./components/games-lengua/CompletaOracion";
import { SopaLetras }         from "./components/games-lengua/SopaLetras";
import { ConectaSinonimos }   from "./components/games-lengua/ConectaSinonimos";
import { Periodista }         from "./components/games-lengua/Periodista";

// ── Ciencias ──
import { CadenaAlimenticia }  from "./components/games-naturales/CadenaAlimenticia";
import { ClasificaAnimales }  from "./components/games-naturales/ClasificaAnimales";
import { ArmarCelula }        from "./components/games-naturales/ArmarCelula";
import { Laberinto }          from "./components/games-naturales/Laberinto";
import { QuizCiencias }       from "./components/games-naturales/QuizCiencias";

// ── Sociales ──
import { MemoriaSociales }    from "./components/games-sociales/MemoriaSociales";
import { LineaTiempo }        from "./components/games-sociales/LineaTiempo";
import { QuizSociales }       from "./components/games-sociales/QuizSociales";

// ── Matematicas ──
import { QuizMatematicas }    from "./components/games-matematicas/QuizMatematicas";
import { CarreraCohetes }     from "./components/games-matematicas/CarreraCohetes";
import { RanaNenufares }      from "./components/games-matematicas/RanaNenufares";
import { TetrisMatematico }   from "./components/games-matematicas/TetrisMatematico";

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
      { index: true,                              Component: Home              },
      { path: "games",                            Component: Games             },
      { path: "games/:subject",                   Component: Games             },
      { path: "avatar",                           Component: Avatar            },
      { path: "friends",                          Component: Friends           },
      { path: "profile",                          Component: Profile           },
      { path: "settings",                         Component: Settings          },
      { path: "help",                             Component: Help              },

      // ── Lengua ──
      { path: "games/language/quiz/4",            Component: QuizLengua4       },
      { path: "games/language/ahorcado",          Component: AhorcadoLengua    },
      { path: "games/language/completa",          Component: CompletaOracion   },
      { path: "games/language/sopa",              Component: SopaLetras        },
      { path: "games/language/conecta",           Component: ConectaSinonimos  },
      { path: "games/language/periodista",        Component: Periodista        },

      // ── Ciencias ──
      { path: "games/science/quiz",               Component: QuizCiencias      },
      { path: "games/science/cadena",             Component: CadenaAlimenticia },
      { path: "games/science/animales",           Component: ClasificaAnimales },
      { path: "games/science/celula",             Component: ArmarCelula       },
      { path: "games/laberinto",                  Component: Laberinto         },

      // ── Sociales ──
      { path: "games/social/quiz",                Component: QuizSociales      },
      { path: "games/social/memoria",             Component: MemoriaSociales   },
      { path: "games/social/linea",               Component: LineaTiempo       },

      // ── Matematicas ──
      { path: "games/math/quiz",                  Component: QuizMatematicas   },
      { path: "games/math/cohetes",               Component: CarreraCohetes    },
      { path: "games/math/rana",                  Component: RanaNenufares     },
      { path: "games/math/tetris",                Component: TetrisMatematico  },

      { path: "*",                                Component: NotFound          },
    ],
  },
  { path: "/login",                   Component: Login          },
  { path: "/register",                Component: Register       },
  { path: "/auth/google/callback",    Component: GoogleCallback },
  { path: "/chat",                    Component: Chat           },
]);

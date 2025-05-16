import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./Prev.jsx";
import { ClerkProvider } from "@clerk/clerk-react";
import { Layout } from "lucide-react";
import { dark, neobrutalism } from "@clerk/themes";
import { esES } from "@clerk/localizations";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider
      localization={{
        ...esES,
        signUp: {
          start: {
            title: "Crear cuenta",
            subtitle: "💣¡No tardes mucho, la bomba sigue caliente!🔥",
            actionText: "¿Seguro que no tienes cuenta?",
            actionLink: "Iniciar sesión",
          },
        },
        signIn: {
          start: {
            title: "Inicia sesión",
            subtitle: "💣¡No tardes mucho, la bomba sigue caliente!🔥",
            actionText: "¿No tienes cuenta todavía?",
            actionLink: "¡Créamela!",
          },
        },
      }}
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        layout: {
          logoImageUrl: "/images/text.png",
          unsafe_disableDevelopmentModeWarnings: true,
        },
        variables: { colorPrimary: "#ef3b2f", colorBackground: "#101828" },
        baseTheme: dark,
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>
);

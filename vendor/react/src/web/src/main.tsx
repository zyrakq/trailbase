import React from "react";
import ReactDOM from "react-dom/client";
import { OidcProvider } from "@axa-fr/react-oidc";
import { getOidcConfig } from "./auth.config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { I18nProvider } from "@/services/i18n";
import { BrowserRouter } from "react-router-dom";
import { ThemeSwitcherProvider } from "@/services/theme";

import { Content } from "@/ui";
import { Header } from "@/components/Header";
import { App } from "@/App";
import { Footer } from "@/components/Footer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <I18nProvider>
          <BrowserRouter>
            <OidcProvider configuration={getOidcConfig()}>
              <ThemeSwitcherProvider>
                <Content>
                  <Header />
                  <App />
                  <Footer />
                </Content>
              </ThemeSwitcherProvider>
            </OidcProvider>
          </BrowserRouter>
        </I18nProvider>
      </DndProvider>
      {import.meta.env.VITE_ENVIRONMENT_NAME === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  </React.StrictMode>
);

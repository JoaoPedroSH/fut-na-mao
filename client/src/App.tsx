import { Switch, Route, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Lobby from "@/pages/Lobby";
import Match from "@/pages/Match";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { api, buildUrl } from "@shared/routes";

function JoinHandler() {
  const [match, params] = useRoute("/join/:code");
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (match && params?.code) {
      const code = params.code.toUpperCase();
      fetch(buildUrl(api.sessions.get.path, { code }))
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            localStorage.setItem("game_session", data.id.toString());
            localStorage.setItem("game_session_code", data.code);
            localStorage.setItem("game_session_name", data.name);
            setLocation("/");
          } else {
            setLocation("/landing");
          }
        })
        .catch(() => setLocation("/landing"));
    }
  }, [match, params, setLocation]);

  return <div className="flex h-screen items-center justify-center">Entrando na pelada...</div>;
}

function Router() {
  return (
    <Switch>
      <Route path="/landing" component={Landing} />
      <Route path="/join/:code" component={JoinHandler} />
      <Route path="/" component={Lobby} />
      <Route path="/match" component={Match} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Search from "./pages/Search";
import Blacklist from "./pages/Blacklist";
import Sync from "./pages/Sync";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/upload"} component={Upload} />
      <Route path={"/search"} component={Search} />
      <Route path={"/blacklist"} component={Blacklist} />
      <Route path={"/sync"} component={Sync} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

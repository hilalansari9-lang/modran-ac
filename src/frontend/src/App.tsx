import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import ControlPanel from "./pages/ControlPanel";
import Dashboard from "./pages/Dashboard";

type View = { page: "dashboard" } | { page: "control"; unitId: bigint };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
});

export default function App() {
  const [view, setView] = useState<View>({ page: "dashboard" });

  const navigateTo = (unitId: bigint) => setView({ page: "control", unitId });
  const navigateToDashboard = () => setView({ page: "dashboard" });

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background noise-bg">
        {/* Ambient background gradient */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.72 0.16 200 / 0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, oklch(0.7 0.15 155 / 0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10">
          {view.page === "dashboard" ? (
            <Dashboard onSelectUnit={navigateTo} />
          ) : (
            <ControlPanel unitId={view.unitId} onBack={navigateToDashboard} />
          )}
        </div>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "oklch(0.2 0.016 255)",
            border: "1px solid oklch(0.3 0.018 255)",
            color: "oklch(0.95 0.008 240)",
          },
        }}
      />
    </QueryClientProvider>
  );
}

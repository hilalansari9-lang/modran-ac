import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Plus,
  Power,
  Snowflake,
  Thermometer,
  Wifi,
  WifiOff,
  Wind,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { ACUnit } from "../backend.d";
import { useAddUnit, useGetAllUnits } from "../hooks/useQueries";

interface DashboardProps {
  onSelectUnit: (id: bigint) => void;
}

const MODE_COLORS: Record<string, string> = {
  Cool: "text-[oklch(0.72_0.16_200)]",
  Heat: "text-[oklch(0.72_0.2_40)]",
  Fan: "text-[oklch(0.65_0.12_260)]",
  Dry: "text-[oklch(0.72_0.18_80)]",
  Auto: "text-[oklch(0.7_0.15_300)]",
};

const MODE_ICONS: Record<string, React.ReactNode> = {
  Cool: <Snowflake className="w-3 h-3" />,
  Heat: <Thermometer className="w-3 h-3" />,
  Fan: <Wind className="w-3 h-3" />,
  Dry: <Wind className="w-3 h-3" />,
  Auto: <Snowflake className="w-3 h-3" />,
};

function UnitCard({
  unit,
  index,
  onClick,
}: {
  unit: ACUnit;
  index: number;
  onClick: () => void;
}) {
  const isPowered = unit.power && unit.isOnline;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
      data-ocid={`unit.item.${index + 1}`}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left group relative rounded-2xl overflow-hidden transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:scale-[1.02] active:scale-[0.99]"
        style={{
          background: "oklch(0.18 0.014 255 / 0.9)",
          border: isPowered
            ? "1px solid oklch(0.72 0.16 200 / 0.35)"
            : "1px solid oklch(0.3 0.018 255 / 0.6)",
          boxShadow: isPowered
            ? "0 4px 32px oklch(0 0 0 / 0.4), 0 0 24px oklch(0.72 0.16 200 / 0.12)"
            : "0 4px 24px oklch(0 0 0 / 0.35)",
        }}
      >
        {/* Top glow when powered */}
        {isPowered && (
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.72 0.16 200 / 0.6), transparent)",
            }}
          />
        )}

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm tracking-wide text-muted-foreground uppercase mb-1 truncate">
                {unit.name}
              </p>
              <div className="flex items-center gap-2">
                {unit.isOnline ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[oklch(0.72_0.18_155)]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.72_0.18_155)] opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[oklch(0.72_0.18_155)]" />
                    </span>
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <WifiOff className="w-3 h-3" />
                    Offline
                  </span>
                )}
              </div>
            </div>
            <div
              className={`p-2 rounded-xl transition-all duration-300 ${
                isPowered
                  ? "bg-[oklch(0.72_0.16_200_/_0.15)] text-[oklch(0.72_0.16_200)]"
                  : "bg-muted/50 text-muted-foreground"
              }`}
            >
              <Power className="w-4 h-4" />
            </div>
          </div>

          {/* Temperature display */}
          <div className="flex items-end justify-between">
            <div>
              <div
                className={`font-mono text-4xl font-semibold leading-none tracking-tight transition-all duration-300 ${
                  isPowered
                    ? "text-[oklch(0.72_0.16_200)]"
                    : "text-muted-foreground"
                }`}
              >
                {Number(unit.temperature)}°
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">
                Celsius
              </div>
            </div>

            {/* Mode + Fan */}
            <div className="text-right">
              <div
                className={`flex items-center justify-end gap-1 text-sm font-medium mb-1 ${
                  isPowered
                    ? (MODE_COLORS[unit.mode] ?? "text-foreground")
                    : "text-muted-foreground"
                }`}
              >
                {isPowered && MODE_ICONS[unit.mode]}
                {unit.mode}
              </div>
              <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                <Wind className="w-3 h-3" />
                {unit.fanSpeed}
              </div>
            </div>
          </div>

          {/* Footer badges */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
            {unit.sleepMode && isPowered && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[oklch(0.65_0.12_260_/_0.2)] text-[oklch(0.65_0.12_260)] font-medium">
                Sleep
              </span>
            )}
            {unit.timerOffHours !== undefined &&
              unit.timerOffHours !== null &&
              Number(unit.timerOffHours) > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground font-medium">
                  Off in {Number(unit.timerOffHours)}h
                </span>
              )}
            {unit.timerOnHours !== undefined &&
              unit.timerOnHours !== null &&
              Number(unit.timerOnHours) > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground font-medium">
                  On in {Number(unit.timerOnHours)}h
                </span>
              )}
            {!unit.power && (
              <span className="text-xs text-muted-foreground font-medium">
                Standby
              </span>
            )}
          </div>
        </div>

        {/* Hover arrow indicator */}
        <div className="absolute bottom-4 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 7h12M7 1l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
    </motion.div>
  );
}

function AddUnitDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const addUnit = useAddUnit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addUnit.mutateAsync(name.trim());
      toast.success(`"${name.trim()}" added successfully`);
      setName("");
      onClose();
    } catch {
      toast.error("Failed to add unit. Please try again.");
    }
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="sm:max-w-md"
        style={{
          background: "oklch(0.18 0.014 255)",
          border: "1px solid oklch(0.3 0.018 255)",
        }}
        data-ocid="dashboard.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-semibold">
            Add New Unit
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Input
              placeholder="e.g. Living Room, Master Bedroom..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/50 border-border focus-visible:ring-ring/50"
              autoFocus
              data-ocid="dashboard.input"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              data-ocid="dashboard.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || addUnit.isPending}
              className="bg-primary/90 hover:bg-primary text-primary-foreground"
              data-ocid="dashboard.confirm_button"
            >
              {addUnit.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Unit"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard({ onSelectUnit }: DashboardProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { data: units, isLoading, isError } = useGetAllUnits();

  const onlineCount = units?.filter((u) => u.isOnline).length ?? 0;
  const poweredCount = units?.filter((u) => u.power && u.isOnline).length ?? 0;

  return (
    <div className="min-h-screen" data-ocid="dashboard.page">
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between"
        style={{
          background: "oklch(0.14 0.012 255 / 0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid oklch(0.3 0.018 255 / 0.4)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/assets/generated/modran-logo-transparent.dim_80x80.png"
              alt="Modran"
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-foreground">
              MODRAN
            </h1>
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground leading-none">
              Smart Climate Control
            </p>
          </div>
        </div>

        <Button
          onClick={() => setAddDialogOpen(true)}
          className="gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 transition-all"
          variant="ghost"
          data-ocid="dashboard.add_button"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Add Unit</span>
        </Button>
      </header>

      {/* Stats bar */}
      {units && units.length > 0 && (
        <div
          className="px-6 py-3 flex items-center gap-6 border-b"
          style={{ borderColor: "oklch(0.3 0.018 255 / 0.3)" }}
        >
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-[oklch(0.72_0.18_155)]" />
            <span className="text-xs text-muted-foreground">
              <span className="text-foreground font-semibold">
                {onlineCount}
              </span>
              /{units.length} online
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Power className="w-3.5 h-3.5 text-[oklch(0.72_0.16_200)]" />
            <span className="text-xs text-muted-foreground">
              <span className="text-foreground font-semibold">
                {poweredCount}
              </span>{" "}
              active
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="px-6 py-8 max-w-6xl mx-auto">
        {isLoading && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-ocid="dashboard.loading_state"
          >
            {["a", "b", "c"].map((k) => (
              <Skeleton
                key={k}
                className="h-48 rounded-2xl"
                style={{ background: "oklch(0.2 0.014 255)" }}
              />
            ))}
          </div>
        )}

        {isError && (
          <div
            className="text-center py-16 text-destructive"
            data-ocid="dashboard.error_state"
          >
            <p className="font-medium">Failed to load units</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check your connection and try again
            </p>
          </div>
        )}

        {!isLoading && !isError && units && units.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
            data-ocid="dashboard.empty_state"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: "oklch(0.18 0.014 255)",
                border: "1px solid oklch(0.3 0.018 255)",
              }}
            >
              <Snowflake className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              No units yet
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs mb-8">
              Add your first Modran AC unit to start controlling your climate
              from anywhere.
            </p>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="gap-2 bg-primary/90 hover:bg-primary text-primary-foreground"
              data-ocid="dashboard.add_button"
            >
              <Plus className="w-4 h-4" />
              Add Your First Unit
            </Button>
          </motion.div>
        )}
        {!isLoading && !isError && units && units.length > 0 && (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit, i) => (
                <UnitCard
                  key={unit.id.toString()}
                  unit={unit}
                  index={i}
                  onClick={() => onSelectUnit(unit.id)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      <footer
        className="px-6 py-6 text-center border-t"
        style={{ borderColor: "oklch(0.3 0.018 255 / 0.3)" }}
      >
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>

      <AddUnitDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />
    </div>
  );
}

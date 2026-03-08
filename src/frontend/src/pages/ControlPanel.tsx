import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Check,
  Loader2,
  Minus,
  Moon,
  Pencil,
  Plus,
  Power,
  Snowflake,
  Thermometer,
  Trash2,
  Wifi,
  WifiOff,
  Wind,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ACUnit } from "../backend.d";
import {
  useGetUnit,
  useRemoveUnit,
  useRenameUnit,
  useSetTimers,
  useToggleOnlineStatus,
  useUpdateUnit,
} from "../hooks/useQueries";

interface ControlPanelProps {
  unitId: bigint;
  onBack: () => void;
}

// ── Mode config ────────────────────────────────────────────
const MODES = [
  {
    id: "Cool",
    label: "Cool",
    icon: <Snowflake className="w-4 h-4" />,
    color: "oklch(0.72 0.16 200)",
  },
  {
    id: "Heat",
    label: "Heat",
    icon: <Thermometer className="w-4 h-4" />,
    color: "oklch(0.72 0.2 40)",
  },
  {
    id: "Fan",
    label: "Fan",
    icon: <Wind className="w-4 h-4" />,
    color: "oklch(0.65 0.12 260)",
  },
  {
    id: "Dry",
    label: "Dry",
    icon: <Wind className="w-4 h-4" />,
    color: "oklch(0.72 0.18 80)",
  },
  {
    id: "Auto",
    label: "Auto",
    icon: <Zap className="w-4 h-4" />,
    color: "oklch(0.7 0.15 300)",
  },
];

const FAN_SPEEDS = ["Low", "Medium", "High", "Turbo"];

// ── Temperature Arc SVG ────────────────────────────────────
function TempArc({
  temp,
  powered,
}: {
  temp: number;
  powered: boolean;
}) {
  const min = 16;
  const max = 30;
  const pct = (temp - min) / (max - min);
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 76;
  const startAngle = -220;
  const endAngle = 40;
  const totalAngle = endAngle - startAngle;
  const filledAngle = totalAngle * pct;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (angle: number) => {
    const x = cx + r * Math.cos(toRad(angle));
    const y = cy + r * Math.sin(toRad(angle));
    return { x, y };
  };

  const startPt = arcPath(startAngle);
  const endTrackPt = arcPath(endAngle);
  const endFillPt = arcPath(startAngle + filledAngle);

  const arcD = (from: number, to: number) => {
    const p1 = arcPath(from);
    const p2 = arcPath(to);
    const largeArc = Math.abs(to - from) > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
  };

  const trackColor = "oklch(0.26 0.016 255)";
  const fillColor = powered ? "oklch(0.72 0.16 200)" : "oklch(0.4 0.01 240)";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track */}
      <path
        d={arcD(startAngle, endAngle)}
        fill="none"
        stroke={trackColor}
        strokeWidth="6"
        strokeLinecap="round"
        opacity={0.6}
      />

      {/* Fill */}
      {pct > 0 && (
        <path
          d={arcD(startAngle, startAngle + filledAngle)}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          filter={powered ? "url(#glow)" : undefined}
        />
      )}

      {/* Tick marks */}
      {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((tick) => {
        const i = tick - min;
        const angle = startAngle + (i / (max - min)) * totalAngle;
        const inner = r - 14;
        const outer = r - 10;
        const p1 = {
          x: cx + inner * Math.cos(toRad(angle)),
          y: cy + inner * Math.sin(toRad(angle)),
        };
        const p2 = {
          x: cx + outer * Math.cos(toRad(angle)),
          y: cy + outer * Math.sin(toRad(angle)),
        };
        const isMajor = i % 5 === 0;
        return (
          <line
            key={tick}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={
              i <= Math.round(pct * (max - min)) && powered
                ? fillColor
                : "oklch(0.35 0.015 255)"
            }
            strokeWidth={isMajor ? 2 : 1}
            opacity={isMajor ? 0.8 : 0.4}
          />
        );
      })}

      {/* Dot at end of fill */}
      {powered && pct > 0 && (
        <circle
          cx={endFillPt.x}
          cy={endFillPt.y}
          r="5"
          fill={fillColor}
          filter="url(#glow)"
        />
      )}

      {/* Min/max labels */}
      <text
        x={startPt.x - 6}
        y={startPt.y + 4}
        fill="oklch(0.45 0.01 240)"
        fontSize="9"
        fontFamily="Geist Mono, monospace"
        textAnchor="middle"
      >
        16
      </text>
      <text
        x={endTrackPt.x + 6}
        y={endTrackPt.y + 4}
        fill="oklch(0.45 0.01 240)"
        fontSize="9"
        fontFamily="Geist Mono, monospace"
        textAnchor="middle"
      >
        30
      </text>
    </svg>
  );
}

// ── Main ControlPanel ──────────────────────────────────────
export default function ControlPanel({ unitId, onBack }: ControlPanelProps) {
  const { data: unit, isLoading, isError } = useGetUnit(unitId);
  const updateUnit = useUpdateUnit();
  const renameUnit = useRenameUnit();
  const removeUnit = useRemoveUnit();
  const setTimers = useSetTimers();
  const toggleOnline = useToggleOnlineStatus();

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Local timer values for controlled inputs
  const [timerOnValue, setTimerOnValue] = useState<string>("0");
  const [timerOffValue, setTimerOffValue] = useState<string>("0");

  useEffect(() => {
    if (unit) {
      setTimerOnValue(
        unit.timerOnHours !== undefined && unit.timerOnHours !== null
          ? Number(unit.timerOnHours).toString()
          : "0",
      );
      setTimerOffValue(
        unit.timerOffHours !== undefined && unit.timerOffHours !== null
          ? Number(unit.timerOffHours).toString()
          : "0",
      );
    }
  }, [unit]);

  const handleUpdate = useCallback(
    async (
      patch: Partial<
        Omit<ACUnit, "id" | "isOnline" | "timerOnHours" | "timerOffHours">
      >,
    ) => {
      if (!unit) return;
      try {
        await updateUnit.mutateAsync({
          id: unit.id,
          input: {
            temperature: patch.temperature ?? unit.temperature,
            mode: patch.mode ?? unit.mode,
            name: patch.name ?? unit.name,
            sleepMode: patch.sleepMode ?? unit.sleepMode,
            fanSpeed: patch.fanSpeed ?? unit.fanSpeed,
            power: patch.power ?? unit.power,
          },
        });
      } catch {
        toast.error("Failed to update unit. Please try again.");
      }
    },
    [unit, updateUnit],
  );

  const handleRename = async () => {
    if (!unit || !renameValue.trim()) return;
    try {
      await renameUnit.mutateAsync({ id: unit.id, name: renameValue.trim() });
      toast.success("Unit renamed");
      setIsRenaming(false);
    } catch {
      toast.error("Failed to rename unit");
    }
  };

  const handleDelete = async () => {
    if (!unit) return;
    try {
      await removeUnit.mutateAsync(unit.id);
      toast.success(`"${unit.name}" removed`);
      onBack();
    } catch {
      toast.error("Failed to remove unit");
    }
  };

  const handleTimerBlur = async () => {
    if (!unit) return;
    const on = Math.max(0, Math.min(12, Number.parseInt(timerOnValue) || 0));
    const off = Math.max(0, Math.min(12, Number.parseInt(timerOffValue) || 0));
    try {
      await setTimers.mutateAsync({
        id: unit.id,
        onHours: on > 0 ? BigInt(on) : null,
        offHours: off > 0 ? BigInt(off) : null,
      });
      toast.success("Timer updated");
    } catch {
      toast.error("Failed to set timers");
    }
  };

  const handleToggleOnline = async () => {
    if (!unit) return;
    try {
      await toggleOnline.mutateAsync(unit.id);
    } catch {
      toast.error("Failed to toggle online status");
    }
  };

  const disabled = !unit?.power || !unit?.isOnline;

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" data-ocid="control.loading_state">
        <div className="max-w-lg mx-auto">
          <Skeleton
            className="h-10 w-32 mb-8"
            style={{ background: "oklch(0.2 0.014 255)" }}
          />
          <Skeleton
            className="h-64 w-full rounded-2xl"
            style={{ background: "oklch(0.2 0.014 255)" }}
          />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Skeleton
              className="h-24 rounded-2xl"
              style={{ background: "oklch(0.2 0.014 255)" }}
            />
            <Skeleton
              className="h-24 rounded-2xl"
              style={{ background: "oklch(0.2 0.014 255)" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !unit) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 p-6"
        data-ocid="control.error_state"
      >
        <p className="text-destructive font-medium">Failed to load unit</p>
        <Button
          variant="ghost"
          onClick={onBack}
          data-ocid="control.back_button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  const isPowered = unit.power && unit.isOnline;

  return (
    <div className="min-h-screen" data-ocid="control.panel">
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 sm:px-6 py-4 flex items-center justify-between"
        style={{
          background: "oklch(0.14 0.012 255 / 0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid oklch(0.3 0.018 255 / 0.4)",
        }}
      >
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
          data-ocid="control.back_button"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Dashboard</span>
        </Button>

        <div className="flex items-center gap-2">
          {/* Online toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleOnline}
            disabled={toggleOnline.isPending}
            className={`gap-2 text-xs font-medium transition-all ${
              unit.isOnline
                ? "text-[oklch(0.72_0.18_155)] hover:text-[oklch(0.72_0.18_155)]"
                : "text-muted-foreground"
            }`}
          >
            {toggleOnline.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : unit.isOnline ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {unit.isOnline ? "Online" : "Offline"}
            </span>
          </Button>

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-muted-foreground hover:text-destructive transition-colors"
            data-ocid="control.delete_button"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-8 max-w-lg mx-auto space-y-5">
        {/* Unit name */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {isRenaming ? (
            <div className="flex items-center gap-2">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setIsRenaming(false);
                }}
                className="font-display text-2xl font-bold bg-muted/30 border-primary/40 focus-visible:ring-primary/40 h-auto py-2 px-3"
                autoFocus
                data-ocid="control.rename_input"
              />
              <Button
                size="icon"
                onClick={handleRename}
                disabled={renameUnit.isPending || !renameValue.trim()}
                className="shrink-0 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                variant="ghost"
                data-ocid="control.save_button"
              >
                {renameUnit.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              className="group flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={() => {
                setRenameValue(unit.name);
                setIsRenaming(true);
              }}
            >
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {unit.name}
              </h2>
              <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </motion.div>

        {/* Temperature + Power card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: "oklch(0.18 0.014 255)",
            border: isPowered
              ? "1px solid oklch(0.72 0.16 200 / 0.3)"
              : "1px solid oklch(0.3 0.018 255)",
            boxShadow: isPowered
              ? "0 8px 40px oklch(0 0 0 / 0.4), 0 0 30px oklch(0.72 0.16 200 / 0.1)"
              : "0 4px 24px oklch(0 0 0 / 0.35)",
          }}
        >
          {/* Top glow line */}
          {isPowered && (
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.72 0.16 200 / 0.7), transparent)",
              }}
            />
          )}

          <div className="flex items-center justify-center flex-col">
            {/* Arc + Temp display */}
            <div className="relative w-[200px] h-[200px]">
              <TempArc temp={Number(unit.temperature)} powered={isPowered} />

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  className={`font-mono text-6xl font-bold leading-none tracking-tighter transition-all duration-500 ${
                    isPowered
                      ? "text-[oklch(0.72_0.16_200)]"
                      : "text-muted-foreground"
                  }`}
                >
                  {Number(unit.temperature)}°
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-1 tracking-wider uppercase">
                  Celsius
                </div>
              </div>
            </div>

            {/* Temp controls */}
            <div className="flex items-center gap-4 mt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (Number(unit.temperature) > 16) {
                    handleUpdate({ temperature: unit.temperature - 1n });
                  }
                }}
                disabled={
                  disabled ||
                  Number(unit.temperature) <= 16 ||
                  updateUnit.isPending
                }
                className="w-10 h-10 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 disabled:opacity-30"
                data-ocid="control.temp_down_button"
              >
                <Minus className="w-4 h-4" />
              </Button>

              <div className="text-xs text-muted-foreground font-medium tracking-wider w-16 text-center">
                {disabled ? "OFF" : `${Number(unit.temperature)} °C`}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (Number(unit.temperature) < 30) {
                    handleUpdate({ temperature: unit.temperature + 1n });
                  }
                }}
                disabled={
                  disabled ||
                  Number(unit.temperature) >= 30 ||
                  updateUnit.isPending
                }
                className="w-10 h-10 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 disabled:opacity-30"
                data-ocid="control.temp_up_button"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Power button */}
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={() => handleUpdate({ power: !unit.power })}
              disabled={!unit.isOnline || updateUnit.isPending}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 ${
                isPowered
                  ? "bg-[oklch(0.72_0.16_200_/_0.2)] border-2 border-[oklch(0.72_0.16_200_/_0.6)] text-[oklch(0.72_0.16_200)] shadow-glow"
                  : "bg-muted/50 border-2 border-border text-muted-foreground"
              }`}
              data-ocid="control.power_toggle"
              aria-label={unit.power ? "Turn off" : "Turn on"}
            >
              {updateUnit.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Power className="w-6 h-6" />
              )}
              {isPowered && (
                <span className="absolute inset-0 rounded-full animate-pulse-ring border-2 border-[oklch(0.72_0.16_200_/_0.3)]" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Mode selector */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-2xl p-5"
          style={{
            background: "oklch(0.18 0.014 255)",
            border: "1px solid oklch(0.3 0.018 255)",
          }}
        >
          <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-4">
            Mode
          </p>
          <div
            className="grid grid-cols-5 gap-2"
            data-ocid="control.mode_select"
          >
            {MODES.map((mode) => {
              const isActive = unit.mode === mode.id;
              return (
                <button
                  type="button"
                  key={mode.id}
                  onClick={() => !disabled && handleUpdate({ mode: mode.id })}
                  disabled={disabled || updateUnit.isPending}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all duration-200 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    isActive && !disabled
                      ? "border-current"
                      : "border-border/50 hover:border-border bg-muted/20 hover:bg-muted/40"
                  }`}
                  style={
                    isActive && !disabled
                      ? {
                          background: `${mode.color.replace(")", " / 0.15)")}`,
                          color: mode.color,
                          borderColor: `${mode.color.replace(")", " / 0.5)")}`,
                        }
                      : {}
                  }
                >
                  <span
                    className={
                      isActive && !disabled ? "" : "text-muted-foreground"
                    }
                  >
                    {mode.icon}
                  </span>
                  <span className="text-[10px] font-semibold tracking-wide">
                    {mode.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Fan speed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="rounded-2xl p-5"
          style={{
            background: "oklch(0.18 0.014 255)",
            border: "1px solid oklch(0.3 0.018 255)",
          }}
        >
          <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-4">
            Fan Speed
          </p>
          <div
            className="grid grid-cols-4 gap-2"
            data-ocid="control.fan_select"
          >
            {FAN_SPEEDS.map((speed) => {
              const isActive = unit.fanSpeed === speed;
              const speedIdx = FAN_SPEEDS.indexOf(speed);
              const speedPct = (speedIdx + 1) / FAN_SPEEDS.length;

              return (
                <button
                  type="button"
                  key={speed}
                  onClick={() => !disabled && handleUpdate({ fanSpeed: speed })}
                  disabled={disabled || updateUnit.isPending}
                  className={`relative flex flex-col items-center gap-2 py-3 px-2 rounded-xl border transition-all duration-200 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring overflow-hidden ${
                    isActive && !disabled
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/50 hover:border-border bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {/* Speed bars */}
                  <div className="flex items-end gap-0.5 h-5">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-1.5 rounded-sm transition-all duration-200 ${
                          i <= speedIdx && isActive && !disabled
                            ? "bg-primary"
                            : i <= speedIdx
                              ? "bg-muted-foreground/50"
                              : "bg-muted-foreground/20"
                        }`}
                        style={{ height: `${(i + 1) * 5}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold tracking-wide">
                    {speed}
                  </span>
                  {isActive && !disabled && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{
                        background: "oklch(0.72 0.16 200 / 0.6)",
                        width: `${speedPct * 100}%`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Sleep mode + Toggles */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "oklch(0.18 0.014 255)",
            border: "1px solid oklch(0.3 0.018 255)",
          }}
        >
          {/* Sleep mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg transition-colors ${
                  unit.sleepMode && !disabled
                    ? "bg-[oklch(0.65_0.12_260_/_0.15)] text-[oklch(0.65_0.12_260)]"
                    : "bg-muted/50 text-muted-foreground"
                }`}
              >
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <Label
                  htmlFor="sleep-switch"
                  className={`text-sm font-medium cursor-pointer ${
                    disabled ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  Sleep Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Gradually adjusts temp for sleep comfort
                </p>
              </div>
            </div>
            <Switch
              id="sleep-switch"
              checked={unit.sleepMode}
              onCheckedChange={(checked) => {
                if (!disabled) handleUpdate({ sleepMode: checked });
              }}
              disabled={disabled || updateUnit.isPending}
              data-ocid="control.sleep_toggle"
            />
          </div>
        </motion.div>

        {/* Timers */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="rounded-2xl p-5"
          style={{
            background: "oklch(0.18 0.014 255)",
            border: "1px solid oklch(0.3 0.018 255)",
          }}
        >
          <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-4">
            Timers
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="timer-on"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Turn On After
              </Label>
              <div className="relative">
                <Input
                  id="timer-on"
                  type="number"
                  min="0"
                  max="12"
                  value={timerOnValue}
                  onChange={(e) => setTimerOnValue(e.target.value)}
                  onBlur={handleTimerBlur}
                  className="pr-8 bg-muted/30 border-border/60 focus-visible:ring-primary/40 font-mono"
                  placeholder="0"
                  data-ocid="control.timer_on_input"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  h
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                0 = disabled, max 12h
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="timer-off"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Turn Off After
              </Label>
              <div className="relative">
                <Input
                  id="timer-off"
                  type="number"
                  min="0"
                  max="12"
                  value={timerOffValue}
                  onChange={(e) => setTimerOffValue(e.target.value)}
                  onBlur={handleTimerBlur}
                  className="pr-8 bg-muted/30 border-border/60 focus-visible:ring-primary/40 font-mono"
                  placeholder="0"
                  data-ocid="control.timer_off_input"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  h
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                0 = disabled, max 12h
              </p>
            </div>
          </div>

          {setTimers.isPending && (
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving timers...
            </div>
          )}
        </motion.div>

        {/* Delete section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="pt-2 pb-8"
        >
          <Button
            variant="ghost"
            onClick={() => setDeleteDialogOpen(true)}
            className="w-full gap-2 text-destructive/70 hover:text-destructive hover:bg-destructive/10 border border-destructive/20 hover:border-destructive/40 rounded-xl h-11 transition-all"
            data-ocid="control.delete_button"
          >
            <Trash2 className="w-4 h-4" />
            Remove Unit
          </Button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer
        className="px-6 py-4 text-center border-t"
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          data-ocid="control.delete_dialog"
          style={{
            background: "oklch(0.18 0.014 255)",
            border: "1px solid oklch(0.3 0.018 255)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">
              Remove &ldquo;{unit.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this unit from your dashboard. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="control.cancel_button"
              className="bg-muted/50 border-border hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={removeUnit.isPending}
              data-ocid="control.confirm_button"
              className="bg-destructive/90 hover:bg-destructive text-destructive-foreground"
            >
              {removeUnit.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Unit"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

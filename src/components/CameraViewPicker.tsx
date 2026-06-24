import { useEffect, useMemo, useRef, useState } from "react";
import { getChipLabel } from "../data/chipLabels";

interface CameraViewPickerProps {
  value: string;
  onConfirm: (value: string) => void;
}

type Pose = {
  yaw: number;
  pitch: number;
};

const VIEW_POSES: Record<string, Pose> = {
  "front view": { yaw: 0, pitch: 6 },
  "rear view": { yaw: 180, pitch: 6 },
  "left profile view": { yaw: 90, pitch: 8 },
  "right profile view": { yaw: -90, pitch: 8 },
  "top view": { yaw: 0, pitch: 58 },
  "three-quarter front left view": { yaw: 34, pitch: 12 },
  "three-quarter front right view": { yaw: -34, pitch: 12 },
  "three-quarter rear left view": { yaw: 146, pitch: 12 },
  "three-quarter rear right view": { yaw: -146, pitch: 12 },
  "low-angle front view": { yaw: 0, pitch: -24 },
  "low-angle three-quarter left view": { yaw: 24, pitch: -22 },
  "low-angle three-quarter right view": { yaw: -24, pitch: -22 },
  "low-angle left profile view": { yaw: 90, pitch: -24 },
  "low-angle right profile view": { yaw: -90, pitch: -24 },
  "low-angle rear three-quarter left view": { yaw: 146, pitch: -24 },
  "low-angle rear three-quarter right view": { yaw: -146, pitch: -24 },
  "low-angle rear view": { yaw: 180, pitch: -24 },
  "high-angle front view": { yaw: 0, pitch: 22 },
  "high-angle three-quarter left view": { yaw: 24, pitch: 24 },
  "high-angle three-quarter right view": { yaw: -24, pitch: 24 },
  "high-angle left profile view": { yaw: 90, pitch: 24 },
  "high-angle right profile view": { yaw: -90, pitch: 24 },
  "high-angle rear three-quarter left view": { yaw: 146, pitch: 24 },
  "high-angle rear three-quarter right view": { yaw: -146, pitch: 24 },
  "high-angle rear view": { yaw: 180, pitch: 24 },
  "bird's-eye view": { yaw: 0, pitch: 52 },
  "overhead view": { yaw: 0, pitch: 72 },
  "flat lay": { yaw: 0, pitch: 78 },
  "isometric left view": { yaw: 42, pitch: 34 },
  "isometric right view": { yaw: -42, pitch: 34 },
  "rear isometric left view": { yaw: 138, pitch: 34 },
  "rear isometric right view": { yaw: -138, pitch: 34 },
  "macro close-up view": { yaw: 10, pitch: 10 },
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const VIEW_ENTRIES = Object.entries(VIEW_POSES);
const normalizeYaw = (yaw: number) => {
  let y = yaw % 360;
  if (y > 180) y -= 360;
  if (y <= -180) y += 360;
  return y;
};

const getPoseDistance = (left: Pose, right: Pose) => {
  const yawDelta = normalizeYaw(left.yaw - right.yaw);
  const yawDistance = yawDelta / 20;
  const pitchDistance = (left.pitch - right.pitch) / 16;
  return Math.hypot(yawDistance, pitchDistance);
};

const getViewFromPose = (pose: Pose) =>
  VIEW_ENTRIES.reduce(
    (closest, entry) => {
      const [view, targetPose] = entry;
      const distance = getPoseDistance(pose, targetPose);
      return distance < closest.distance ? { view, distance } : closest;
    },
    {
      view: "front view",
      distance: Number.POSITIVE_INFINITY,
    }
  ).view;

const getPoseForView = (value: string): Pose => VIEW_POSES[value] ?? VIEW_POSES["front view"];

export default function CameraViewPicker({ value, onConfirm }: CameraViewPickerProps) {
  const [pose, setPose] = useState<Pose>(() => getPoseForView(value));
  const draggingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!draggingRef.current) {
      setPose(getPoseForView(value));
    }
  }, [value]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current || !lastPointRef.current) return;

      const deltaX = event.clientX - lastPointRef.current.x;
      const deltaY = event.clientY - lastPointRef.current.y;
      lastPointRef.current = { x: event.clientX, y: event.clientY };

      setPose((current) => ({
        yaw: normalizeYaw(current.yaw + deltaX * 0.45),
        pitch: clamp(current.pitch + deltaY * 0.35, -40, 78),
      }));
    };

    const handlePointerUp = () => {
      draggingRef.current = false;
      lastPointRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const draftView = useMemo(() => getViewFromPose(pose), [pose]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-stone-800">Camera View</label>
        <span className="text-xs text-stone-400">{getChipLabel(draftView)}</span>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-black bg-black px-3 py-1.5 text-sm text-white">
            {getChipLabel(value || "front view")}
          </span>
        </div>
        <div
          role="presentation"
          onPointerDown={(event) => {
            draggingRef.current = true;
            lastPointRef.current = { x: event.clientX, y: event.clientY };
          }}
          className="relative aspect-[4/3] overflow-hidden rounded-xl border border-stone-200 bg-[#262626]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            backgroundPosition: "center center",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.14),transparent_42%)]" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-emerald-400/35" />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-rose-400/35" />

          <div className="absolute inset-0 flex items-center justify-center [perspective:1100px]">
            <div
              className="relative h-36 w-36 cursor-grab select-none [transform-style:preserve-3d] active:cursor-grabbing sm:h-40 sm:w-40"
              style={{
                transform: `rotateX(${-pose.pitch}deg) rotateY(${pose.yaw}deg)`,
              }}
            >
              <div className="absolute inset-0 border border-blue-400/30 bg-blue-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.3)] [transform:translateZ(72px)] sm:[transform:translateZ(80px)]">
                <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-black/10 bg-black/40 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-white/90">
                  FRONT
                </div>
              </div>
              <div className="absolute inset-0 border border-white/12 bg-white/20 [transform:rotateY(180deg)_translateZ(72px)] sm:[transform:rotateY(180deg)_translateZ(80px)]">
                <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-black/10 bg-black/35 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-white/85">
                  BACK
                </div>
              </div>
              <div className="absolute inset-0 border border-white/12 bg-white/16 [transform:rotateY(90deg)_translateZ(72px)] sm:[transform:rotateY(90deg)_translateZ(80px)]" />
              <div className="absolute inset-0 border border-white/12 bg-white/14 [transform:rotateY(-90deg)_translateZ(72px)] sm:[transform:rotateY(-90deg)_translateZ(80px)]" />
              <div className="absolute inset-0 border border-white/12 bg-white/24 [transform:rotateX(90deg)_translateZ(72px)] sm:[transform:rotateX(90deg)_translateZ(80px)]">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-black/35 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-white/85">
                  TOP
                </div>
              </div>
              <div className="absolute inset-0 border border-white/12 bg-white/8 [transform:rotateX(-90deg)_translateZ(72px)] sm:[transform:rotateX(-90deg)_translateZ(80px)]" />
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/30 px-2 py-1 text-[11px] text-white/70">
            drag to adjust
          </div>
        </div>
        <button
          type="button"
          onClick={() => onConfirm(draftView)}
          className="mt-3 w-full rounded-xl border border-stone-200 bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
        >
          입력하기
        </button>
      </div>
    </div>
  );
}

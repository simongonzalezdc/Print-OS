import { useMemo } from 'react';
import { useSceneStore } from '@/lib/scene/store';
import { SceneObject, ValidationIssue, MeshStats } from '@/types';
import { getPrinterProfile } from '@/lib/constants/printer-profiles';

const MIN_PART_GAP = 10; // mm

export function GuardrailHUD() {
  const objects = useSceneStore((state) => state.objects);
  const printerProfile = useSceneStore((state) => state.printerProfile) ?? getPrinterProfile('generic');

  const objectList = useMemo(() => Array.from(objects.values()), [objects]);

  const dfmIssues = objectList.flatMap(obj => obj.validation?.issues ?? []);
  const dfmStatus = resolveStatus(dfmIssues);
  const spacingStatus = computeSpacingStatus(objectList);
  const buildVolumeIssue = objectList.find((obj) =>
    obj.validation?.issues?.some(issue => issue.code === 'exceeds_build_volume')
  );

  return (
    <div className="glass-pro-base rounded-lg text-xxs text-white/80 px-3 py-2 space-y-1 min-w-[220px]">
      <GuardrailRow
        label="DFM"
        status={dfmStatus.status}
        message={dfmStatus.message || 'All checks passed'}
      />
      <GuardrailRow
        label="Build Volume"
        status={buildVolumeIssue ? 'error' : 'ok'}
        message={
          buildVolumeIssue
            ? `Exceeds ${printerProfile.buildVolume.x}×${printerProfile.buildVolume.y}×${printerProfile.buildVolume.z}mm`
            : `Fits ${printerProfile.name}`
        }
      />
      <GuardrailRow
        label="Part Spacing"
        status={spacingStatus.status}
        message={spacingStatus.message || `≥${MIN_PART_GAP}mm clearance`}
      />
    </div>
  );
}

function GuardrailRow({ label, status, message }: { label: string; status: StatusDot; message: string }) {
  const color = status === 'error' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${color} shadow-[0_0_6px_rgba(255,255,255,0.4)]`} />
      <span className="text-white/60 w-20">{label}</span>
      <span className="text-white/90 flex-1">{message}</span>
    </div>
  );
}

type StatusDot = 'ok' | 'warning' | 'error';

function resolveStatus(issues: ValidationIssue[]): { status: StatusDot; message?: string } {
  if (issues.length === 0) return { status: 'ok' };
  const error = issues.find((issue) => issue.severity === 'error');
  if (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }
  const warning = issues.find((issue) => issue.severity === 'warning');
  if (warning) {
    return {
      status: 'warning',
      message: warning.message,
    };
  }
  return { status: 'ok' };
}

function computeSpacingStatus(objects: SceneObject[]): { status: StatusDot; message?: string } {
  // Get stats from validation.stats or obj.stats (prefer validation)
  const stats = objects
    .map(obj => {
      const meshStats = obj.validation?.stats ?? obj.stats;
      return meshStats ? { id: obj.id, name: obj.name, stats: meshStats } : null;
    })
    .filter((item): item is { id: string; name: string; stats: MeshStats } => item !== null);

  for (let i = 0; i < stats.length; i++) {
    for (let j = i + 1; j < stats.length; j++) {
      const gap = measureAabbGap(stats[i]?.stats, stats[j]?.stats);
      if (gap < MIN_PART_GAP) {
        return {
          status: gap < MIN_PART_GAP / 2 ? 'error' : 'warning',
          message: `${stats[i]?.name} vs ${stats[j]?.name}: ${gap.toFixed(1)}mm gap`,
        };
      }
    }
  }

  return { status: 'ok' };
}

function measureAabbGap(a: MeshStats | undefined, b: MeshStats | undefined): number {
  if (!a || !b) return Infinity; // Can't measure gap without stats
  
  const aMin = a.boundingBox.min;
  const aMax = a.boundingBox.max;
  const bMin = b.boundingBox.min;
  const bMax = b.boundingBox.max;

  const dx = Math.max(0, Math.max(aMin[0] ?? 0, bMin[0] ?? 0) - Math.min(aMax[0] ?? 0, bMax[0] ?? 0));
  const dz = Math.max(0, Math.max(aMin[2] ?? 0, bMin[2] ?? 0) - Math.min(aMax[2] ?? 0, bMax[2] ?? 0));
  return Math.sqrt(dx * dx + dz * dz);
}


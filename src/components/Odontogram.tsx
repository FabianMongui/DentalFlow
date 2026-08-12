import React from 'react';

interface OdontogramProps {
  selectedTeeth: string[];
  onToggleTooth?: (tooth: string) => void;
  readOnly?: boolean;
}

interface ToothLayout {
  number: string;
  x: number;
  y: number;
  angle: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

const ellipsePoint = (cx: number, cy: number, rx: number, ry: number, angleDeg: number) => ({
  x: cx + rx * Math.cos(toRad(angleDeg)),
  y: cy - ry * Math.sin(toRad(angleDeg)),
});

/**
 * Samples `count` angles between startAngle and endAngle so the resulting points are
 * evenly spaced by arc length (not by angle) — otherwise teeth bunch up where the
 * ellipse curve is flattest and spread out where it's steepest.
 */
const evenArcAngles = (cx: number, cy: number, rx: number, ry: number, startAngle: number, endAngle: number, count: number) => {
  const steps = 1000;
  const cumulative: number[] = [0];
  let previous = ellipsePoint(cx, cy, rx, ry, startAngle);

  for (let i = 1; i <= steps; i += 1) {
    const angle = startAngle + ((endAngle - startAngle) * i) / steps;
    const point = ellipsePoint(cx, cy, rx, ry, angle);
    const segment = Math.hypot(point.x - previous.x, point.y - previous.y);
    cumulative.push(cumulative[i - 1] + segment);
    previous = point;
  }

  const totalLength = cumulative[cumulative.length - 1];
  const angles: number[] = [];

  for (let i = 0; i < count; i += 1) {
    const target = (totalLength * i) / (count - 1);
    let stepIndex = cumulative.findIndex((length) => length >= target);
    if (stepIndex === -1) stepIndex = steps;
    angles.push(startAngle + ((endAngle - startAngle) * stepIndex) / steps);
  }

  return angles;
};

const archLayout = (cx: number, cy: number, rx: number, ry: number, startAngle: number, endAngle: number, teeth: string[]): ToothLayout[] => {
  const angles = evenArcAngles(cx, cy, rx, ry, startAngle, endAngle, teeth.length);
  return teeth.map((number, index) => {
    const angle = angles[index];
    const point = ellipsePoint(cx, cy, rx, ry, angle);
    return { number, x: point.x, y: point.y, angle };
  });
};

// Single continuous sweep per arch (left molars -> midline -> right molars) so spacing stays even across the whole row.
const ARCH_CX = 100;
const ARCH_CY = 58;
const ARCH_RX = 88;
const ARCH_RY = 42;

const UPPER_TEETH = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
const LOWER_TEETH = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];

const UPPER_LAYOUT = archLayout(ARCH_CX, ARCH_CY, ARCH_RX, ARCH_RY, 200, -20, UPPER_TEETH);
const LOWER_LAYOUT = archLayout(ARCH_CX, ARCH_CY, ARCH_RX, ARCH_RY, 160, 380, LOWER_TEETH);

const TOOTH_WIDTH = 15;
const TOOTH_HEIGHT = 18;

// A simplified tooth silhouette: rounded crown on top, tapering to a rounded root tip.
const toothPath = (w: number, h: number) => {
  const hw = w / 2;
  const hh = h / 2;
  const rootHalf = w * 0.22;
  return `M ${-hw + 3} ${-hh}
    L ${hw - 3} ${-hh}
    Q ${hw} ${-hh} ${hw} ${-hh + 3}
    L ${hw * 0.65} ${hh - 5}
    Q ${hw * 0.5} ${hh} ${rootHalf} ${hh}
    Q ${-rootHalf} ${hh} ${-hw * 0.5} ${hh - 5}
    L ${-hw} ${-hh + 3}
    Q ${-hw} ${-hh} ${-hw + 3} ${-hh}
    Z`;
};

const TOOTH_PATH = toothPath(TOOTH_WIDTH, TOOTH_HEIGHT);

const ToothShape = ({
  tooth,
  selected,
  readOnly,
  onToggle,
  flip,
}: {
  tooth: ToothLayout;
  selected: boolean;
  readOnly?: boolean;
  onToggle?: (tooth: string) => void;
  flip?: boolean;
}) => {
  const handleActivate = () => {
    if (readOnly || !onToggle) return;
    onToggle(tooth.number);
  };

  const handleKeyDown = (event: React.KeyboardEvent<SVGGElement>) => {
    if (readOnly) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <g
      transform={`translate(${tooth.x}, ${tooth.y}) scale(1, ${flip ? -1 : 1})`}
      role={readOnly ? undefined : 'button'}
      tabIndex={readOnly ? undefined : 0}
      aria-pressed={readOnly ? undefined : selected}
      aria-label={`Diente ${tooth.number}`}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={readOnly ? '' : 'cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'}
    >
      <path
        d={TOOTH_PATH}
        className={`transition-colors ${
          selected
            ? 'fill-primary stroke-primary'
            : 'fill-white stroke-slate-300 hover:stroke-primary'
        }`}
        strokeWidth={1}
      />
      <text
        y={flip ? -1 : 1}
        textAnchor="middle"
        dominantBaseline="central"
        transform={`scale(1, ${flip ? -1 : 1})`}
        className={`text-[6px] font-bold select-none pointer-events-none ${selected ? 'fill-white' : 'fill-slate-600'}`}
      >
        {tooth.number}
      </text>
    </g>
  );
};

const ArchSvg = ({
  teeth,
  selectedTeeth,
  onToggleTooth,
  readOnly,
  flip,
}: {
  teeth: ToothLayout[];
  selectedTeeth: string[];
  onToggleTooth?: (tooth: string) => void;
  readOnly?: boolean;
  flip?: boolean;
}) => (
  <svg viewBox="0 0 200 118" className="w-full h-auto" role="group">
    {teeth.map((tooth) => (
      <ToothShape
        key={tooth.number}
        tooth={tooth}
        selected={selectedTeeth.includes(tooth.number)}
        onToggle={onToggleTooth}
        readOnly={readOnly}
        flip={flip}
      />
    ))}
  </svg>
);

export const Odontogram = ({ selectedTeeth, onToggleTooth, readOnly = false }: OdontogramProps) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Arcada superior</p>
          <ArchSvg teeth={UPPER_LAYOUT} selectedTeeth={selectedTeeth} onToggleTooth={onToggleTooth} readOnly={readOnly} flip />
          <div className="flex justify-between px-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Derecho</span>
            <span>Izquierdo</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Arcada inferior</p>
          <ArchSvg teeth={LOWER_LAYOUT} selectedTeeth={selectedTeeth} onToggleTooth={onToggleTooth} readOnly={readOnly} />
          <div className="flex justify-between px-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Derecho</span>
            <span>Izquierdo</span>
          </div>
        </div>
      </div>

      {!readOnly && (
        <p className="text-xs text-slate-400 text-center">
          {selectedTeeth.length === 0 ? 'Ningún diente seleccionado.' : `${selectedTeeth.length} diente(s) seleccionado(s): ${[...selectedTeeth].sort().join(', ')}`}
        </p>
      )}
    </div>
  );
};

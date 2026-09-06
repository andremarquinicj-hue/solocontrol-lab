import { MASTER_SIEVES, TRACK_BANDS } from "@/lib/granulometry";
import type { GranulometryCalculation, TrackBand } from "@/types";

const W = 880;
const H = 430;
const M = { left: 72, right: 62, top: 48, bottom: 58 };
const xMin = 4;
const xMax = 100;

function xPos(x: number) {
  const a = Math.log10(xMin);
  const b = Math.log10(xMax);
  return M.left + ((Math.log10(x) - a) / (b - a)) * (W - M.left - M.right);
}

function yPos(y: number) {
  return M.top + ((100 - y) / 100) * (H - M.top - M.bottom);
}

function polyline(points: Array<{x:number;y:number}>) {
  return points.map((p) => `${xPos(p.x).toFixed(2)},${yPos(p.y).toFixed(2)}`).join(" ");
}

export function GranulometryChart({ band, calculation }: { band: TrackBand; calculation: GranulometryCalculation }) {
  const defs = TRACK_BANDS[band].sieves;
  const obtained = calculation.rows
    .filter((r) => r.passingPct !== null)
    .map((r) => ({ x: r.mm, y: r.passingPct as number }))
    .sort((a,b)=>a.x-b.x);

  const lower = defs
    .map((r) => ({ x: r.mm, y: 100-r.maxRetainedAccum }))
    .sort((a,b)=>a.x-b.x);
  const upper = defs
    .map((r) => ({ x: r.mm, y: 100-r.minRetainedAccum }))
    .sort((a,b)=>a.x-b.x);

  const xGrid = [4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100];
  const yGrid = Array.from({length:21},(_,i)=>i*5);
  const bottomLabels = [4,10,20,40,100];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="Curva granulométrica">
      <rect x={M.left} y={M.top} width={W-M.left-M.right} height={H-M.top-M.bottom} fill="#fff" stroke="#222" strokeWidth="1" />

      {yGrid.map((v) => (
        <line key={`y${v}`} x1={M.left} x2={W-M.right} y1={yPos(v)} y2={yPos(v)} stroke={v%10===0?"#555":"#c9c9c9"} strokeWidth={v%10===0?0.8:0.4} />
      ))}
      {xGrid.map((v) => (
        <line key={`x${v}`} x1={xPos(v)} x2={xPos(v)} y1={M.top} y2={H-M.bottom} stroke={v===10||v===100?"#555":"#b8b8b8"} strokeWidth={v===10||v===100?0.8:0.45} />
      ))}

      {MASTER_SIEVES.map((s) => (
        <g key={s.mm}>
          <line x1={xPos(s.mm)} x2={xPos(s.mm)} y1={M.top} y2={H-M.bottom} stroke="#333" strokeDasharray="4 3" strokeWidth="1" />
          <text x={xPos(s.mm)} y={M.top-11} fontSize="12" textAnchor="middle" fontWeight="700">{s.label}</text>
        </g>
      ))}

      {Array.from({length:11},(_,i)=>i*10).map((v)=>(
        <g key={`yl${v}`}>
          <text x={M.left-10} y={yPos(v)+4} fontSize="11" textAnchor="end">{v}</text>
          <text x={W-M.right+10} y={yPos(v)+4} fontSize="11" textAnchor="start">{100-v}</text>
        </g>
      ))}
      {bottomLabels.map((v)=><text key={v} x={xPos(v)} y={H-M.bottom+22} fontSize="11" textAnchor="middle">{v}</text>)}

      <text x={M.left-48} y={(M.top+H-M.bottom)/2} fontSize="13" fontWeight="700" textAnchor="middle" transform={`rotate(-90 ${M.left-48} ${(M.top+H-M.bottom)/2})`}>Porcentagem que passa (%)</text>
      <text x={W-M.right+45} y={(M.top+H-M.bottom)/2} fontSize="13" fontWeight="700" textAnchor="middle" transform={`rotate(90 ${W-M.right+45} ${(M.top+H-M.bottom)/2})`}>Porcentagem retida (%)</text>
      <text x={(M.left+W-M.right)/2} y={H-15} fontSize="13" fontWeight="700" textAnchor="middle">Diâmetro das partículas (mm)</text>
      <text x={M.left+3} y={M.top-29} fontSize="11" fontWeight="700">Peneiras</text>

      <polyline points={polyline(lower)} fill="none" stroke="#e04747" strokeWidth="1.8" />
      <polyline points={polyline(upper)} fill="none" stroke="#e04747" strokeWidth="1.8" />
      <polyline points={polyline(obtained)} fill="none" stroke="#123f80" strokeWidth="2.2" />
      {obtained.map((p)=><circle key={`${p.x}-${p.y}`} cx={xPos(p.x)} cy={yPos(p.y)} r="3.2" fill="#123f80" />)}
    </svg>
  );
}

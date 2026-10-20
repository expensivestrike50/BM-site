import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Boxes, FlaskConical, Gauge, Maximize2, Target } from 'lucide-react';
import { defaultTargets, feedstockById, feedstocks, planExperiments, priorities, productById, products, recommend, stages, type IngredientId, type Prediction, type StageId, type Targets } from '@/lib/platform-model';
import type { PlatformScene } from './platform-scene';
import './platform-lab.css';

const stageIcons = { targets: Target, mix: Boxes, experiments: FlaskConical, results: Gauge } as const;
const pct = (v: number) => `${Math.round(v * 100)}%`;
const STREAM_IDS: Record<IngredientId, string> = { cement: 'S1', scm: 'S2', sand: 'S3', coarse: 'S4', rca: 'S5', water: 'S6', admixture: 'S7' };
const kg = (v: number) => (v < 20 ? v.toFixed(1) : Math.round(v).toLocaleString());
const change = (now: number, base: number) => { const d = (now - base) / base; return `${d <= 0 ? '−' : '+'}${Math.abs(Math.round(d * 100))}%`; };

export function PlatformLab() {
  const [targets, setTargets] = useState<Targets>(() => defaultTargets());
  const [stage, setStage] = useState<StageId>('targets');
  const [overview, setOverview] = useState(false);
  const [trial, setTrial] = useState(0);
  const [ingredient, setIngredient] = useState<IngredientId | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const rec = useMemo(() => recommend(targets), [targets]);
  const plan = useMemo(() => planExperiments(targets, rec.best), [targets, rec]);
  const trialIndex = Math.min(trial, plan.selected.length - 1);
  const canvasHost = useRef<HTMLDivElement>(null);
  const labelHost = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const scene = useRef<PlatformScene | null>(null);

  useEffect(() => {
    let disposed = false, observer: IntersectionObserver | undefined, onVisibility: (() => void) | undefined;
    import('./platform-scene').then(({ PlatformScene }) => {
      if (disposed || !canvasHost.current || !labelHost.current || !frame.current) return;
      try {
        scene.current = new PlatformScene(canvasHost.current, labelHost.current, {
          onStage: id => { setStage(id); setOverview(false); },
          onTrial: i => { setTrial(i); setStage(s => (s === 'experiments' || s === 'results' ? s : 'experiments')); setOverview(false); },
          onIngredient: id => { setIngredient(id); setStage('mix'); setOverview(false); },
        });
      } catch { setFailed(true); return; }
      setReady(true);
      let inView = false;
      const sync = () => scene.current?.setActive(inView && !document.hidden);
      observer = new IntersectionObserver(([entry]) => { inView = !!entry?.isIntersecting; sync(); }, { threshold: 0.05 });
      observer.observe(frame.current);
      onVisibility = sync;
      document.addEventListener('visibilitychange', onVisibility);
    }).catch(() => setFailed(true));
    return () => {
      disposed = true;
      observer?.disconnect();
      if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => {
    if (ready) scene.current?.setState({ stage, overview, targets, rec, plan, trial: trialIndex, ingredient });
  }, [ready, stage, overview, targets, rec, plan, trialIndex, ingredient]);

  const go = (id: StageId) => { setStage(id); setOverview(false); };
  const stageIndex = stages.findIndex(s => s.id === stage);
  const next = stages[stageIndex + 1];
  const selected = plan.selected[trialIndex]!;
  const summaries: Record<StageId, string> = {
    targets: `${productById(targets.product).short} · ${targets.strength} MPa`,
    mix: `w/b ${rec.best.design.wb.toFixed(2)} · ${pct(rec.best.design.scm)} ${feedstockById(targets.feedstock).name.replace(/ \(.*\)/, '').toLowerCase()}`,
    experiments: `${plan.selected.length} of ${plan.candidates.length} batches`,
    results: `${selected.id} · ${pct(selected.prediction.passProbability)} pass`,
  };

  return <div className="platform-lab" id="platform-lab">
    <div className={`pl-frame${failed ? ' is-fallback' : ''}`} ref={frame}>
      <div className="pl-canvas" ref={canvasHost} role="img" aria-label={`3D view of the ${stages[stageIndex]?.name.toLowerCase()} stage. ${summaries[stage]}.`}/>
      <div className="pl-labels" ref={labelHost}/>
      {failed && <p className="pl-fallback">The 3D view needs WebGL, which this browser has turned off. Every prediction is still available in the panel.</p>}
      {!failed && <div className="pl-view-controls">
        <Flowsheet stage={stage} overview={overview} onStage={go}/>
        <button type="button" className={overview ? 'is-on' : ''} aria-pressed={overview} onClick={() => setOverview(o => !o)}><Maximize2 size={15}/>Plant overview</button>
      </div>}
      {!failed && <p className="pl-hint" aria-hidden="true">Drag to orbit · scroll to zoom · click equipment, trials and plant areas</p>}

      <nav className="pl-pipeline" aria-label="Platform stages">
        {stages.map((s, i) => { const Icon = stageIcons[s.id]; return <button type="button" key={s.id} className={`pl-step${s.id === stage && !overview ? ' is-on' : ''}${i < stageIndex ? ' is-done' : ''}`} aria-current={s.id === stage ? 'step' : undefined} onClick={() => go(s.id)}>
          <span className="pl-step-icon"><Icon size={17}/></span>
          <span className="pl-step-text"><small>0{i + 1} · {s.short}</small><b>{summaries[s.id]}</b></span>
        </button>; })}
      </nav>

      <aside className="pl-panel" aria-live="polite">
        <header className="pl-panel-head"><span>0{stageIndex + 1}</span><div><h4>{stages[stageIndex]?.name}</h4><p>{stages[stageIndex]?.blurb}</p></div></header>
        <div className="pl-panel-body">
          {stage === 'targets' && <TargetsForm targets={targets} onChange={setTargets}/>}
          {stage === 'mix' && <MixPanel targets={targets} rec={rec} ingredient={ingredient} onIngredient={setIngredient}/>}
          {stage === 'experiments' && <ExperimentsPanel plan={plan} trial={trialIndex} onTrial={setTrial} feedstock={feedstockById(targets.feedstock).name}/>}
          {stage === 'results' && <ResultsPanel targets={targets} plan={plan} trial={trialIndex} onTrial={setTrial} baseline={rec.baseline}/>}
        </div>
        <footer className="pl-panel-foot">
          {stageIndex > 0 ? <button type="button" className="pl-ghost" onClick={() => go(stages[stageIndex - 1]!.id)}><ArrowLeft size={15}/>Back</button> : <span/>}
          {next ? <button type="button" className="pl-primary" onClick={() => go(next.id)}>{next.id === 'mix' ? 'Predict mix design' : next.id === 'experiments' ? 'Design experiments' : 'Predict properties'}<ArrowRight size={15}/></button>
            : <button type="button" className="pl-primary" onClick={() => go('targets')}>Adjust targets<ArrowLeft size={15}/></button>}
          <p className="pl-fine">Illustrative model built on published concrete relationships. Real recommendations are calibrated to your feedstock and plant data.</p>
        </footer>
      </aside>
    </div>
  </div>;
}

// Process-flow minimap in the style of a flowsheet: unit-operation blocks joined by numbered streams.
const FLOW_BLOCKS: { id: string; name: string; stage: StageId; x: number; y: number; w: number; h: number }[] = [
  { id: 'SILO-101', name: 'Cement', stage: 'mix', x: 6, y: 6, w: 62, h: 17 },
  { id: 'SILO-102', name: 'Binder', stage: 'mix', x: 6, y: 27, w: 62, h: 17 },
  { id: 'BIN-201', name: 'Aggregates', stage: 'mix', x: 6, y: 48, w: 62, h: 17 },
  { id: 'TK-301', name: 'Water', stage: 'mix', x: 6, y: 69, w: 62, h: 17 },
  { id: 'TK-302', name: 'Admixture', stage: 'mix', x: 6, y: 90, w: 62, h: 17 },
  { id: 'MIX-401', name: 'Mixer', stage: 'mix', x: 100, y: 40, w: 56, h: 32 },
  { id: 'FORM-501', name: 'Forming', stage: 'targets', x: 188, y: 14, w: 60, h: 26 },
  { id: 'LAB-601', name: 'Trial lab', stage: 'experiments', x: 188, y: 76, w: 60, h: 26 },
  { id: 'CURE-701', name: 'Curing', stage: 'results', x: 276, y: 14, w: 60, h: 26 },
  { id: 'QC-801', name: 'Testing', stage: 'results', x: 276, y: 76, w: 60, h: 26 },
];
const FLOW_STREAMS: { id: string; d: string; lx: number; ly: number }[] = [
  ...[0, 1, 2, 3, 4].map(i => { const y = 14.5 + i * 21, yy = 46 + i * 5; return { id: `S${i === 2 ? '3–5' : i < 2 ? i + 1 : i + 3}`, d: `M68 ${y}H84V${yy}H100`, lx: 76, ly: y - 2 }; }),
  { id: 'S8', d: 'M156 50H172V27H188', lx: 164, ly: 24 },
  { id: 'S11', d: 'M156 62H172V89H188', lx: 164, ly: 100 },
  { id: 'S9', d: 'M248 27H276', lx: 262, ly: 24 },
  { id: 'S12', d: 'M248 89H276', lx: 262, ly: 86 },
  { id: 'S10', d: 'M306 40V76', lx: 312, ly: 61 },
];

function Flowsheet({ stage, overview, onStage }: { stage: StageId; overview: boolean; onStage: (id: StageId) => void }) {
  return <svg className="pl-flowsheet" viewBox="0 0 342 112" aria-hidden="true">
    <defs><marker id="pl-arrow" viewBox="0 0 6 6" refX="5.5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L6 3L0 6Z"/></marker></defs>
    {FLOW_STREAMS.map(s => <g key={s.id} className="pl-fs-stream"><path d={s.d} markerEnd="url(#pl-arrow)"/><text x={s.lx} y={s.ly} textAnchor="middle">{s.id}</text></g>)}
    {FLOW_BLOCKS.map(b => <g key={b.id} className={`pl-fs-block${!overview && b.stage === stage ? ' is-on' : ''}`} onClick={() => onStage(b.stage)}>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="2"/>
      <text x={b.x + b.w / 2} y={b.y + b.h / 2 - (b.h > 20 ? 3 : 1)} textAnchor="middle" className="pl-fs-id">{b.id}</text>
      <text x={b.x + b.w / 2} y={b.y + b.h / 2 + (b.h > 20 ? 8 : 6)} textAnchor="middle">{b.name}</text>
    </g>)}
  </svg>;
}

function Range({ label, value, unit, min, max, step, onChange, format }: { label: string; value: number; unit: string; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return <label className="pl-range">
    <span><span>{label}</span><b>{format ? format(value) : `${value} ${unit}`}</b></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ '--pl-fill': `${((value - min) / (max - min)) * 100}%` } as CSSProperties}/>
  </label>;
}

function TargetsForm({ targets: t, onChange }: { targets: Targets; onChange: (t: Targets) => void }) {
  const p = productById(t.product);
  const set = (patch: Partial<Targets>) => onChange({ ...t, ...patch });
  return <>
    <fieldset className="pl-field"><legend>Product</legend><div className="pl-segment pl-segment--4">
      {products.map(x => <button type="button" key={x.id} aria-pressed={x.id === t.product} onClick={() => onChange({ ...defaultTargets(x.id), feedstock: t.feedstock, recycledAggregate: t.recycledAggregate, priority: t.priority })}>{x.short}</button>)}
    </div><p className="pl-help">{p.note}</p></fieldset>
    <Range label="28-day compressive strength" value={t.strength} unit="MPa" min={p.strength[0]} max={p.strength[1]} step={1} onChange={v => set({ strength: v })}/>
    <Range label="Workability" value={t.slump} unit="mm" min={p.slump[0]} max={p.slump[1]} step={5} onChange={v => set({ slump: v })} format={v => (v ? `${v} mm slump` : 'Zero slump')}/>
    <Range label="Embodied carbon cap" value={t.carbon} unit="" min={100} max={450} step={5} onChange={v => set({ carbon: v })} format={v => `≤ ${v} kg CO₂e/m³`}/>
    <Range label="Material cost cap" value={t.cost} unit="" min={70} max={200} step={1} onChange={v => set({ cost: v })} format={v => `≤ $${v}/m³`}/>
    <fieldset className="pl-field"><legend>Waste-derived binder</legend><div className="pl-chips">
      {feedstocks.map(f => <button type="button" key={f.id} aria-pressed={f.id === t.feedstock} onClick={() => set({ feedstock: f.id })}><i style={{ background: f.color }}/><span><b>{f.name}</b><small>{f.source}</small></span></button>)}
    </div></fieldset>
    <label className="pl-check"><input type="checkbox" checked={t.recycledAggregate} onChange={e => set({ recycledAggregate: e.target.checked })}/><span>Allow recycled concrete aggregate</span></label>
    <fieldset className="pl-field"><legend>Optimize for</legend><div className="pl-segment">
      {priorities.map(x => <button type="button" key={x.id} aria-pressed={x.id === t.priority} onClick={() => set({ priority: x.id })}>{x.name}</button>)}
    </div></fieldset>
  </>;
}

function MixPanel({ targets, rec, ingredient, onIngredient }: { targets: Targets; rec: ReturnType<typeof recommend>; ingredient: IngredientId | null; onIngredient: (id: IngredientId) => void }) {
  const b = rec.best, max = Math.max(...b.ingredients.map(i => i.kg));
  const binder = b.ingredients.filter(i => i.id === 'cement' || i.id === 'scm').reduce((s, i) => s + i.kg, 0);
  return <>
    {!rec.feasible && <div className="pl-alert"><b>Targets conflict</b>{rec.issues.map(i => <p key={i}>{i}</p>)}<p>Showing the closest mix. Relax a cap or change the binder.</p></div>}
    <div className="pl-stats">
      <div><b>{b.design.wb.toFixed(2)}</b><span>water / binder</span></div>
      <div><b>{Math.round(binder)}</b><span>kg binder</span></div>
      <div><b>{pct(b.design.scm)}</b><span>cement replaced</span></div>
      <div><b>{pct(b.design.rca)}</b><span>recycled coarse</span></div>
    </div>
    <p className="pl-table-head"><span>Stream</span><span>kg/m³</span></p>
    <ul className="pl-ingredients" aria-label="Mix proportions per cubic metre, by feed stream">
      {b.ingredients.map(i => <li key={i.id}><button type="button" aria-pressed={ingredient === i.id} onClick={() => onIngredient(i.id)}>
        <i style={{ background: i.color }}/><span><small>{STREAM_IDS[i.id]}</small>{i.name}</span><b>{i.kg < 0.05 ? '—' : `${kg(i.kg)} kg`}</b>
        <em><u style={{ width: `${Math.max(i.kg > 0.05 ? 2 : 0, (i.kg / max) * 100)}%`, background: i.color }}/></em>
      </button></li>)}
    </ul>
    <Compare label="Embodied carbon" now={b.carbon} base={rec.baseline.carbon} unit="kg CO₂e/m³" cap={targets.carbon}/>
    <Compare label="Material cost" now={b.cost} base={rec.baseline.cost} unit="$/m³" cap={targets.cost} money/>
    <p className="pl-help">Compared with a straight portland-cement mix at the same strength. {Math.round(b.wasteKg)} kg of waste-derived material used per m³.</p>
  </>;
}

function Compare({ label, now, base, unit, cap, money }: { label: string; now: number; base: number; unit: string; cap: number; money?: boolean }) {
  const top = Math.max(now, base, cap) * 1.05, f = (v: number) => (money ? `$${Math.round(v)}` : Math.round(v).toString());
  return <div className="pl-compare">
    <div><span>{label}</span><b className={now <= base ? 'is-good' : 'is-bad'}>{change(now, base)}</b></div>
    <svg viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0" y="1" width={(base / top) * 100} height="5" rx="1.5" className="pl-bar-base"/>
      <rect x="0" y="8" width={(now / top) * 100} height="5" rx="1.5" className="pl-bar-now"/>
      <line x1={(cap / top) * 100} x2={(cap / top) * 100} y1="0" y2="14" className="pl-bar-cap"/>
    </svg>
    <p><span>Predicted {f(now)} {unit.replace('$', '')}</span><span>OPC mix {f(base)}</span><span>Cap {f(cap)}</span></p>
  </div>;
}

function ExperimentsPanel({ plan, trial, onTrial, feedstock }: { plan: ReturnType<typeof planExperiments>; trial: number; onTrial: (i: number) => void; feedstock: string }) {
  const short = feedstock.replace(/ \(.*\)/, '');
  return <>
    <div className="pl-stats pl-stats--2">
      <div><b>{plan.selected.length}</b><span>trial batches to run</span></div>
      <div><b>{plan.candidates.length}</b><span>in a full factorial grid</span></div>
    </div>
    <p className="pl-help">Each point in the cube is a candidate batch: water/binder ratio, {short.toLowerCase()} and recycled aggregate. The six highlighted batches bracket the predicted optimum so one round of testing confirms it or shows which way to move.</p>
    <ol className="pl-trials">
      {plan.selected.map((tr, i) => { const d = tr.prediction.design; return <li key={tr.id}><button type="button" aria-pressed={i === trial} onClick={() => onTrial(i)}>
        <b>{tr.id}</b>
        <span><strong>{tr.role}</strong><small>w/b {d.wb.toFixed(2)} · {pct(d.scm)} {short.toLowerCase()} · {pct(d.rca)} RCA</small></span>
        <Pass p={tr.prediction.passProbability}/>
      </button></li>; })}
    </ol>
  </>;
}

function Pass({ p }: { p: number }) {
  return <span className={`pl-pass ${p >= 0.8 ? 'is-good' : p >= 0.5 ? 'is-mid' : 'is-bad'}`} title="Predicted chance of meeting the strength target">{pct(p)}</span>;
}

function ResultsPanel({ targets, plan, trial, onTrial, baseline }: { targets: Targets; plan: ReturnType<typeof planExperiments>; trial: number; onTrial: (i: number) => void; baseline: Prediction }) {
  const tr = plan.selected[trial]!, p = tr.prediction;
  const early = p.gain.find(g => g.day === 1)!;
  return <>
    <div className="pl-segment pl-segment--trials" role="group" aria-label="Trial batch">
      {plan.selected.map((x, i) => <button type="button" key={x.id} aria-pressed={i === trial} onClick={() => onTrial(i)}>{x.id}</button>)}
    </div>
    <p className="pl-trial-role">{tr.role}</p>
    <GainChart plan={plan} trial={trial} target={targets.strength}/>
    <div className="pl-stats">
      <div><b>{p.strength.toFixed(0)}<small> ±{p.sigma.toFixed(0)}</small></b><span>MPa at 28 days</span></div>
      <div><b>{early.mpa.toFixed(0)}</b><span>MPa at 1 day</span></div>
      <div><b>{Math.round(p.carbon)}</b><span>kg CO₂e/m³ ({change(p.carbon, baseline.carbon)})</span></div>
      <div><b>${Math.round(p.cost)}</b><span>per m³</span></div>
    </div>
    <div className="pl-pass-row"><span>Chance of meeting {targets.strength} MPa</span><Pass p={p.passProbability}/></div>
  </>;
}

function GainChart({ plan, trial, target }: { plan: ReturnType<typeof planExperiments>; trial: number; target: number }) {
  const W = 300, H = 150, pad = { l: 30, r: 10, t: 10, b: 22 };
  const days = [1, 3, 7, 14, 28, 56, 90];
  const top = Math.ceil(Math.max(target * 1.2, ...plan.selected.flatMap(t => t.prediction.gain.map(g => g.mpa))) / 10) * 10;
  const x = (d: number) => pad.l + (Math.log(d) / Math.log(90)) * (W - pad.l - pad.r);
  const y = (v: number) => H - pad.b - (v / top) * (H - pad.t - pad.b);
  const path = (g: { day: number; mpa: number }[]) => g.map((q, i) => `${i ? 'L' : 'M'}${x(q.day).toFixed(1)},${y(q.mpa).toFixed(1)}`).join('');
  const sel = plan.selected[trial]!.prediction;
  return <figure className="pl-chart">
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Predicted strength gain for ${plan.selected[trial]!.id}: ${sel.gain.map(g => `${g.mpa.toFixed(0)} MPa at ${g.day} days`).join(', ')}.`}>
      {[0, top / 2, top].map(v => <g key={v}><line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="pl-grid"/><text x={pad.l - 6} y={y(v) + 4} textAnchor="end">{v}</text></g>)}
      {days.map(d => <text key={d} x={x(d)} y={H - 6} textAnchor="middle">{d}d</text>)}
      <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} className="pl-target"/>
      <text x={W - pad.r} y={y(target) - 5} textAnchor="end" className="pl-target-text">Target {target} MPa</text>
      <line x1={x(28)} x2={x(28)} y1={pad.t} y2={H - pad.b} className="pl-grid"/>
      {plan.selected.map((t, i) => i !== trial && <path key={t.id} d={path(t.prediction.gain)} className="pl-line-other"/>)}
      <path d={`${path(sel.gain.map(g => ({ day: g.day, mpa: g.mpa + sel.sigma })))}L${[...sel.gain].reverse().map(g => `${x(g.day).toFixed(1)},${y(Math.max(0, g.mpa - sel.sigma)).toFixed(1)}`).join('L')}Z`} className="pl-band"/>
      <path d={path(sel.gain)} className="pl-line"/>
      {sel.gain.map(g => <circle key={g.day} cx={x(g.day)} cy={y(g.mpa)} r={g.day === 28 ? 4 : 2.5} className="pl-dot"/>)}
    </svg>
    <figcaption>Predicted strength gain, MPa by age (log scale). Shaded band is ±1σ.</figcaption>
  </figure>;
}

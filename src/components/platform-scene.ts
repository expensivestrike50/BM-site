// Imperative three.js scene for the interactive platform: a concrete products
// plant laid out like a process flowsheet (unit-operation blocks joined by
// numbered streams). The React component loads this module on the client only
// and pushes state into it with setState.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { feedstockById, type ExperimentPlan, type IngredientId, type ProductId, type Recommendation, type StageId, type Targets } from '@/lib/platform-model';

export type SceneState = { stage: StageId; overview: boolean; targets: Targets; rec: Recommendation; plan: ExperimentPlan; trial: number; ingredient: IngredientId | null };
export type SceneEvents = { onStage: (id: StageId) => void; onTrial: (index: number) => void; onIngredient: (id: IngredientId) => void };

const BRAND = 0x2121d8, TEAL = 0x008081, AMBER = 0xe3a33b;
const STAGES: StageId[] = ['targets', 'mix', 'experiments', 'results'];

// Plant layout, metres. Material flows along +x: storage & batching -> mixing ->
// forming -> R&D lab -> curing & quality control.
const TOWER = new THREE.Vector3(-20, 0, 0);
const MIXER_Y = 5.9, WH_Y = 11.2;
const CEMENT_WH = new THREE.Vector3(-21.2, WH_Y + 0.7, -1.1), AGG_WH = new THREE.Vector3(-18.8, WH_Y + 0.6, 1.2);
const LIQUID_WH = new THREE.Vector3(-18.6, WH_Y, -1.6);
const SILOS: { id: IngredientId; x: number; z: number }[] = [{ id: 'cement', x: -29.5, z: -8 }, { id: 'scm', x: -25, z: -9.5 }];
const BINS: { id: IngredientId; x: number }[] = [{ id: 'sand', x: -41 }, { id: 'coarse', x: -36.5 }, { id: 'rca', x: -32 }];
const BIN_Z = 6.5, BELT_Y = 1.25, BELT_END = new THREE.Vector3(-29, BELT_Y, BIN_Z);
const WATER = new THREE.Vector3(-35, 0, -3), ADMIX = new THREE.Vector3(-31, 0, -2.6);
const TABLE_X = -1.5, PRODUCT = new THREE.Vector3(6.5, 0.32, 3.2);
const LAB = new THREE.Vector3(22, 0, 0), CUBE = 4.2, CUBE_C = new THREE.Vector3(22.5, 6.4, -2.2);
const QC = new THREE.Vector3(42, 0, 2.6), CURE = new THREE.Vector3(37, 0, -6.5), PRESS_X = 46.6;
const BENCH_TOP = 0.95, BAR_BASE = 0.85, BAR_TARGET = 1.8;
const AREAS: Record<StageId, { x0: number; x1: number; z0: number; z1: number }> = {
  mix: { x0: -45, x1: -13, z0: -13, z1: 10 },
  targets: { x0: -10, x1: 12, z0: -9, z1: 9 },
  experiments: { x0: 15, x1: 30, z0: -8, z1: 7 },
  results: { x0: 32, x1: 50, z0: -11, z1: 7 },
};
const VIEWS: Record<StageId | 'overview', { target: [number, number, number]; offset: [number, number, number] }> = {
  mix: { target: [-28, 6, 0], offset: [11, 16, 36] },
  targets: { target: [5, 2.2, 2.5], offset: [9, 10, 22] },
  experiments: { target: [22.5, 3.4, 0], offset: [5, 9, 22] },
  results: { target: [42, 1.8, 0.5], offset: [3, 6.5, 15] },
  overview: { target: [2, 0, -3], offset: [0, 62, 96] },
};
const PARTICLES = 300;

type Zone = StageId | 'overview';
type Label = { el: HTMLDivElement; anchor: THREE.Object3D; zones: Zone[]; visible: boolean };
type Stream = { id: string; ingredient: IngredientId; path: Path; label: Label };

const passColor = (p: number) => new THREE.Color(AMBER).lerp(new THREE.Color(TEAL), Math.min(1, Math.max(0, (p - 0.3) / 0.6)));
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

class Path {
  cum: number[] = [0];
  constructor(public pts: THREE.Vector3[]) { for (let i = 1; i < pts.length; i++) this.cum.push(this.cum[i - 1]! + pts[i]!.distanceTo(pts[i - 1]!)); }
  get length() { return this.cum[this.cum.length - 1]!; }
  at(u: number, out: THREE.Vector3) {
    const d = u * this.length;
    let i = 1;
    while (i < this.pts.length - 1 && this.cum[i]! < d) i++;
    const s = this.cum[i]! - this.cum[i - 1]!, t = s ? (d - this.cum[i - 1]!) / s : 0;
    return out.copy(this.pts[i - 1]!).lerp(this.pts[i]!, Math.min(1, Math.max(0, t)));
  }
}

function canvasTexture(draw: (g: CanvasRenderingContext2D, size: number) => void, size = 256, repeat = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function speckle(g: CanvasRenderingContext2D, size: number, base: string, n: number) {
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < n; i++) {
    const v = 150 + Math.floor(rnd() * 105), r = rnd() < 0.08 ? 1.5 + rnd() * 2.5 : 0.4 + rnd() * 0.9;
    g.fillStyle = `rgba(${v},${v},${v},0.9)`;
    g.beginPath(); g.arc(rnd() * size, rnd() * size, r, 0, Math.PI * 2); g.fill();
  }
}

export class PlatformScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(36, 1, 0.1, 600);
  private controls: OrbitControls;
  private clock = new THREE.Clock();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private labels: Label[] = [];
  private pickables: THREE.Object3D[] = [];
  private camGoal = { pos: new THREE.Vector3(), target: new THREE.Vector3(), active: true };
  private reduced: boolean;
  private running = false;
  private state: SceneState | null = null;
  private resize: ResizeObserver;
  private downAt: [number, number] | null = null;
  private time = 0;

  private concreteTex = canvasTexture((g, s) => speckle(g, s, '#d9d9d9', 2600));
  private M = {
    steel: new THREE.MeshStandardMaterial({ color: 0x3b4c63, roughness: 0.55, metalness: 0.45 }),
    galv: new THREE.MeshStandardMaterial({ color: 0xb9bec7, roughness: 0.4, metalness: 0.75 }),
    grating: new THREE.MeshStandardMaterial({ color: 0x9aa1ad, roughness: 0.6, metalness: 0.6, transparent: true, opacity: 0.82 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xf2b705, roughness: 0.5, metalness: 0.2 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf1f3f6, roughness: 0.38, metalness: 0.25 }),
    blue: new THREE.MeshStandardMaterial({ color: BRAND, roughness: 0.45, metalness: 0.25 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xdfe3ea, roughness: 0.15, metalness: 0.95 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.5, metalness: 0.3 }),
    water: new THREE.MeshStandardMaterial({ color: 0x2f86d6, roughness: 0.4, metalness: 0.3 }),
    admix: new THREE.MeshStandardMaterial({ color: 0x7a5cd6, roughness: 0.4, metalness: 0.3 }),
    bench: new THREE.MeshStandardMaterial({ color: 0xf4f5f7, roughness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xcfe6f2, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false }),
    holo: new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }),
    screen: new THREE.MeshBasicMaterial({ color: 0x1a2b6b }),
    wood: new THREE.MeshStandardMaterial({ color: 0x9a7650, roughness: 0.9 }),
  };
  private concrete = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.92, map: this.concreteTex });
  private fresh = new THREE.MeshStandardMaterial({ color: 0x8e9298, roughness: 0.55, map: this.concreteTex });

  private areas = new Map<StageId, THREE.MeshBasicMaterial>();
  private product = new THREE.Group();
  private productKey = '';
  private targetLabels: Label[] = [];
  private streams: Stream[] = [];
  private gauges = new Map<IngredientId, { mat: THREE.MeshStandardMaterial; fill: THREE.Mesh; level: number; goal: number; shells: THREE.Mesh[] }>();
  private heaps = new Map<IngredientId, THREE.Mesh>();
  private particles: THREE.InstancedMesh;
  private particleData: { stream: number; t: number; speed: number }[] = [];
  private mixerLabel: Label;
  private shafts: THREE.Object3D[] = [];
  private bucket = new THREE.Group();
  private bucketFill = new THREE.Mesh();
  private crane = new THREE.Group();
  private trolley = new THREE.Group();
  private belts: THREE.Mesh[] = [];
  private steam: { mesh: THREE.Mesh; t: number; x: number; z: number }[] = [];
  private cube = new THREE.Group();
  private points: { mesh: THREE.Mesh; halo: THREE.Mesh | null; label: Label | null; selectedIndex: number }[] = [];
  private axisLabels: Label[] = [];
  private molds: { top: THREE.Mesh; mat: THREE.MeshStandardMaterial; label: Label; group: THREE.Group }[] = [];
  private specimens: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; bar: THREE.Mesh; barMat: THREE.MeshBasicMaterial; height: number; goal: number; label: Label }[] = [];
  private pressSpecimen = new THREE.Mesh();
  private pressPiston = new THREE.Group();
  private pressLabel: Label;
  private targetLabel: Label;

  constructor(private host: HTMLElement, private labelHost: HTMLElement, private events: SceneEvents) {
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    host.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 140;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.addEventListener('start', () => { this.camGoal.active = false; });

    this.targetLabel = this.label('pl-label pl-label--target', this.anchor(v3(QC.x - 3.9, BENCH_TOP + BAR_BASE + BAR_TARGET, QC.z)), ['results']);
    this.pressLabel = this.label('pl-label pl-label--center', this.anchor(v3(PRESS_X, 3.9, QC.z)), ['results']);
    this.mixerLabel = this.label('pl-label pl-label--center', this.anchor(v3(TOWER.x, MIXER_Y + 1.7, TOWER.z + 1.6)), ['mix']);
    this.buildSite();
    this.buildStorage();
    this.buildTower();
    this.buildForming();
    this.buildLab();
    this.buildQC();
    this.particles = this.buildParticles();

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onDown);
    el.addEventListener('pointerup', this.onUp);
    el.addEventListener('pointermove', this.onMove);
    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(host);
    this.fit();
  }

  /* ---------------- public API ---------------- */
  setState(s: SceneState) {
    const prev = this.state;
    this.state = s;
    this.updateProduct(s);
    this.updateMix(s);
    if (!prev || prev.plan !== s.plan) this.buildCube(s);
    this.updateTrials(s);
    this.updateResults(s);
    this.areas.forEach((m, id) => { m.opacity = !s.overview && id === s.stage ? 0.1 : 0.035; });
    if (!prev || prev.stage !== s.stage || prev.overview !== s.overview) this.aim(s, !prev);
    if (!this.running) this.render(0);
  }

  setActive(on: boolean) {
    if (on === this.running) return;
    this.running = on;
    this.renderer.setAnimationLoop(on ? () => this.render(Math.min(this.clock.getDelta(), 0.05)) : null);
    if (on) this.clock.getDelta();
  }

  dispose() {
    this.setActive(false);
    this.resize.disconnect();
    this.controls.dispose();
    this.scene.traverse(o => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach(x => { (x as THREE.MeshStandardMaterial).map?.dispose(); x.dispose(); });
    });
    this.concreteTex.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labels.forEach(l => l.el.remove());
  }

  /* ---------------- geometry helpers ---------------- */
  private box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = this.scene) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  private cyl(rt: number, rb: number, h: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = this.scene, seg = 28, open = false) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  // a round member between two points: legs, braces, pipes, screw conveyors
  private strut(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material, parent: THREE.Object3D = this.scene, seg = 10) {
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(v3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = true;
    parent.add(m);
    return m;
  }
  private pipe(pts: THREE.Vector3[], r: number, mat: THREE.Material) {
    for (let i = 1; i < pts.length; i++) this.strut(pts[i - 1]!, pts[i]!, r, mat);
    for (const p of pts.slice(1, -1)) { const s = new THREE.Mesh(new THREE.SphereGeometry(r * 1.25, 12, 8), mat); s.position.copy(p); this.scene.add(s); }
  }
  private belt(a: THREE.Vector3, b: THREE.Vector3, width: number) {
    const g = new THREE.Group(), len = a.distanceTo(b), d = b.clone().sub(a);
    g.position.copy(a).add(b).multiplyScalar(0.5);
    g.rotation.order = 'YZX';
    g.rotation.y = -Math.atan2(d.z, d.x);
    g.rotation.z = Math.atan2(d.y, Math.hypot(d.x, d.z));
    const beltMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, map: canvasTexture((c, s) => { c.fillStyle = '#2b2e33'; c.fillRect(0, 0, s, s); c.fillStyle = '#3a3e45'; for (let i = 0; i < s; i += 32) c.fillRect(i, 0, 6, s); }, 64) });
    beltMat.map!.repeat.set(len / 1.2, 1);
    const top = this.box(len, 0.06, width, beltMat, 0, 0.05, 0, g);
    this.belts.push(top);
    for (const side of [-1, 1]) this.box(len, 0.22, 0.06, this.M.steel, 0, -0.05, side * (width / 2 + 0.05), g);
    for (let x = -len / 2 + 0.4; x < len / 2; x += 1.1) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, width, 10), this.M.galv);
      r.rotation.x = Math.PI / 2;
      r.position.set(x, -0.04, 0);
      g.add(r);
    }
    this.scene.add(g);
    // drive motor at the head end, legs every few metres
    const motor = this.cyl(0.18, 0.18, 0.5, this.M.blue, b.x, b.y - 0.1, b.z + width / 2 + 0.35);
    motor.rotation.x = Math.PI / 2;
    for (let u = 0.08; u < 1; u += 4 / len) {
      const p = a.clone().lerp(b, u);
      if (p.y < 0.6) continue;
      for (const side of [-1, 1]) {
        const off = v3(0, 0, side * width / 2).applyAxisAngle(v3(0, 1, 0), g.rotation.y);
        this.strut(v3(p.x + off.x, 0, p.z + off.z), v3(p.x + off.x, p.y - 0.1, p.z + off.z), 0.05, this.M.galv);
      }
    }
  }
  private rail(a: THREE.Vector3, b: THREE.Vector3, h = 1.05) {
    // yellow handrail with posts every metre
    const len = a.distanceTo(b);
    this.strut(v3(a.x, a.y + h, a.z), v3(b.x, b.y + h, b.z), 0.03, this.M.yellow, this.scene, 6);
    this.strut(v3(a.x, a.y + h / 2, a.z), v3(b.x, b.y + h / 2, b.z), 0.025, this.M.yellow, this.scene, 6);
    for (let u = 0; u <= 1.0001; u += 1 / Math.max(1, Math.round(len))) { const p = a.clone().lerp(b, u); this.strut(p, v3(p.x, p.y + h, p.z), 0.03, this.M.yellow, this.scene, 6); }
  }
  private ladder(x: number, z: number, y0: number, y1: number) {
    for (const s of [-1, 1]) this.strut(v3(x, y0, z + 0.25 * s), v3(x, y1, z + 0.25 * s), 0.03, this.M.galv, this.scene, 6);
    for (let y = y0 + 0.3; y < y1; y += 0.35) this.strut(v3(x, y, z - 0.25), v3(x, y, z + 0.25), 0.018, this.M.galv, this.scene, 5);
  }
  private tag(block: string, name: string, at: THREE.Vector3, zones: Zone[]) {
    const l = this.label('pl-label pl-label--block', this.anchor(at), zones);
    setLabel(l, block, name);
    return l;
  }

  /* ---------------- site ---------------- */
  private buildSite() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0xffffff, 0xc4c8d2, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 2.3);
    sun.position.set(-30, 60, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 40, bottom: -40, near: 1, far: 200 });
    sun.shadow.bias = -0.0003;
    s.add(sun);

    const slab = canvasTexture((g, n) => {
      speckle(g, n, '#d2d4d8', 900);
      g.strokeStyle = 'rgba(80,86,96,0.22)'; g.lineWidth = 2; g.strokeRect(0, 0, n, n);
    }, 256, 20);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, map: slab }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    s.add(floor);

    // painted walkway lines and area outlines; the areas are clickable to move between stages
    for (const z of [-11.5, 11.5]) this.box(98, 0.02, 0.18, this.M.yellow, 2, 0.01, z);
    for (const id of STAGES) {
      const a = AREAS[id], w = a.x1 - a.x0, d = a.z1 - a.z0;
      const mat = new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, opacity: 0.04, depthWrite: false });
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(a.x0 + w / 2, 0.015, a.z0 + d / 2);
      pad.userData = { kind: 'zone', id };
      s.add(pad);
      this.pickables.push(pad);
      this.areas.set(id, mat);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, d)), new THREE.LineBasicMaterial({ color: BRAND, transparent: true, opacity: 0.45 }));
      edge.rotation.x = -Math.PI / 2;
      edge.position.copy(pad.position).setY(0.02);
      s.add(edge);
    }

    // back wall frame of the production hall; the front is left open so the plant stays visible
    const wall = canvasTexture((g, n) => { g.fillStyle = '#e3e6eb'; g.fillRect(0, 0, n, n); g.fillStyle = 'rgba(70,80,96,0.10)'; for (let i = 0; i < n; i += 16) g.fillRect(i, 0, 6, n); }, 128);
    wall.repeat.set(30, 1);
    this.box(98, 7, 0.15, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, map: wall }), 2, 3.5, -14.2);
    for (let x = -46; x <= 50; x += 8) { this.box(0.4, 9, 0.4, this.M.steel, x, 4.5, -13.9); this.box(0.3, 0.5, 4, this.M.steel, x, 8.8, -12.1); }
    this.box(96.4, 0.4, 0.3, this.M.steel, 2, 9.1, -13.9);
  }

  /* ---------------- storage, batching ---------------- */
  private buildStorage() {
    for (const si of SILOS) {
      const { x, z } = si, g = new THREE.Group();
      for (const [lx, lz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) {
        this.strut(v3(x + lx * 1.15, 0, z + lz * 1.15), v3(x + lx * 1.05, 5.6, z + lz * 1.05), 0.11, this.M.galv);
        this.box(0.6, 0.12, 0.6, this.M.dark, x + lx * 1.15, 0.06, z + lz * 1.15);
      }
      for (const [a, b] of [[[1, 1], [-1, 1]], [[1, -1], [-1, -1]], [[1, 1], [1, -1]], [[-1, 1], [-1, -1]]] as const) {
        this.strut(v3(x + a[0] * 1.12, 0.8, z + a[1] * 1.12), v3(x + b[0] * 1.08, 4.6, z + b[1] * 1.08), 0.04, this.M.galv);
        this.strut(v3(x + b[0] * 1.12, 0.8, z + b[1] * 1.12), v3(x + a[0] * 1.08, 4.6, z + a[1] * 1.08), 0.04, this.M.galv);
      }
      const shellMat = this.M.white.clone();
      const shells = [
        this.cyl(1.5, 0.28, 2.2, shellMat, x, 4.5, z, g, 36),
        this.cyl(1.5, 1.5, 7.4, shellMat, x, 9.3, z, g, 36),
        this.cyl(0.25, 1.55, 0.7, shellMat, x, 13.35, z, g, 36),
      ];
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.06, 6, 40), this.M.galv);
      ring.rotation.x = Math.PI / 2; ring.position.set(x, 5.6, z); g.add(ring);
      for (let y = 7; y < 13; y += 2) { const r = ring.clone(); r.position.y = y; g.add(r); }
      this.box(0.7, 0.6, 0.7, this.M.galv, x + 0.4, 13.9, z, g); // dust filter
      const rail = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.03, 4, 40), this.M.yellow);
      rail.rotation.x = Math.PI / 2; rail.position.set(x, 14.6, z); g.add(rail);
      this.box(0.45, 0.4, 0.45, this.M.blue, x, 3.2, z, g); // rotary valve
      // level gauge strip on the front of the shell: fill height follows the batch quantity
      const gaugeMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.6 });
      this.box(0.3, 6.2, 0.06, this.M.dark, x, 9.3, z + 1.52, g);
      const fillGeo = new THREE.BoxGeometry(0.22, 1, 0.07);
      fillGeo.translate(0, 0.5, 0);
      const fill = new THREE.Mesh(fillGeo, gaugeMat);
      fill.position.set(x, 6.25, z + 1.54);
      g.add(fill);
      this.scene.add(g);
      this.ladder(x - 1.62, z, 0.4, 14.4);
      shells.forEach(m => { m.userData = { kind: 'ingredient', id: si.id }; this.pickables.push(m); });
      this.gauges.set(si.id, { mat: gaugeMat, fill, level: 0.01, goal: 0.01, shells });

      // inclined screw conveyor from the silo outlet up to the cement weigh hopper
      const a = v3(x, 3.0, z + 0.2), b = si.id === 'cement' ? CEMENT_WH.clone().add(v3(-0.3, 0.5, -0.2)) : CEMENT_WH.clone().add(v3(0.3, 0.5, -0.3));
      this.strut(a, b, 0.2, this.M.galv, this.scene, 16);
      const dir = b.clone().sub(a).normalize();
      for (let u = 0.1; u < 1; u += 0.12) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.06, 16), this.M.galv); f.position.copy(a).lerp(b, u); f.quaternion.setFromUnitVectors(v3(0, 1, 0), dir); this.scene.add(f); }
      this.box(0.5, 0.4, 0.4, this.M.blue, b.x, b.y + 0.3, b.z);
      this.addStream(si.id === 'cement' ? 'S1' : 'S2', si.id, [a, b]);
    }
    this.tag('SILO-101', 'Cement silo', v3(SILOS[0]!.x, 15.4, SILOS[0]!.z), ['mix', 'overview']);
    this.tag('SILO-102', 'Binder silo', v3(SILOS[1]!.x, 15.4, SILOS[1]!.z), ['mix']);

    // aggregate bins feeding a collecting belt and an inclined belt to the tower
    const binMat = new THREE.MeshStandardMaterial({ color: 0x5f7a8a, roughness: 0.6, metalness: 0.4, side: THREE.DoubleSide });
    for (const bi of BINS) {
      const x = bi.x, z = BIN_Z;
      for (const [lx, lz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) this.box(0.2, 3.4, 0.2, this.M.steel, x + lx * 1.3, 1.7, z + lz * 1.3);
      this.box(2.9, 0.18, 0.18, this.M.steel, x, 3.3, z + 1.3); this.box(2.9, 0.18, 0.18, this.M.steel, x, 3.3, z - 1.3);
      const hopper = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 0.4, 1.9, 4, 1, true), binMat);
      hopper.rotation.y = Math.PI / 4; hopper.position.set(x, 4.3, z); hopper.castShadow = true;
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.05, 1.7, 4, 1, true), binMat);
      upper.rotation.y = Math.PI / 4; upper.position.set(x, 6.1, z); upper.castShadow = true;
      const heapMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 1, map: this.concreteTex });
      const heap = new THREE.Mesh(new THREE.ConeGeometry(1.42, 1.1, 4), heapMat);
      heap.rotation.y = Math.PI / 4; heap.position.set(x, 6.4, z);
      this.scene.add(hopper, upper, heap);
      this.box(0.5, 0.3, 0.5, this.M.yellow, x, 3.1, z); // gate
      [hopper, upper, heap].forEach(m => { m.userData = { kind: 'ingredient', id: bi.id }; this.pickables.push(m); });
      this.heaps.set(bi.id, heap);
      this.addStream(bi.id === 'sand' ? 'S3' : bi.id === 'coarse' ? 'S4' : 'S5', bi.id, [v3(x, 2.9, z), v3(x, BELT_Y + 0.15, z), BELT_END.clone().setY(BELT_Y + 0.15), AGG_WH.clone().add(v3(-0.4, 0.9, 0))]);
    }
    this.belt(v3(-43, BELT_Y, BIN_Z), BELT_END, 0.9);
    this.belt(BELT_END.clone().add(v3(-0.4, 0, 0)), AGG_WH.clone().add(v3(-0.6, 0.6, 0)), 0.9);
    this.tag('BIN-201', 'Aggregate bins', v3(-36.5, 8.2, BIN_Z), ['mix', 'overview']);

    // water tank with pump, and admixture totes with a dosing pump
    const w = WATER;
    const tank = this.cyl(1.3, 1.3, 3.6, new THREE.MeshStandardMaterial({ color: 0xe6edf4, roughness: 0.4, metalness: 0.3 }), w.x, 2.0, w.z, this.scene, 32);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.3, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.M.white);
    dome.scale.y = 0.3; dome.position.set(w.x, 3.8, w.z); this.scene.add(dome);
    this.cyl(1.32, 1.32, 0.35, this.M.water, w.x, 3.2, w.z);
    this.cyl(1.4, 1.4, 0.2, this.M.dark, w.x, 0.1, w.z);
    tank.userData = { kind: 'ingredient', id: 'water' };
    this.pickables.push(tank);
    const pumpX = w.x + 2.2;
    this.box(1.1, 0.2, 0.6, this.M.dark, pumpX, 0.1, w.z);
    const motor = this.cyl(0.24, 0.24, 0.6, this.M.water, pumpX - 0.2, 0.5, w.z); motor.rotation.z = Math.PI / 2;
    const volute = this.cyl(0.3, 0.3, 0.25, this.M.galv, pumpX + 0.3, 0.5, w.z); volute.rotation.x = Math.PI / 2;
    const wPath = [v3(w.x + 1.3, 0.5, w.z), v3(pumpX + 0.3, 0.5, w.z), v3(pumpX + 0.3, 0.5, w.z + 0.9), v3(-23.4, 0.5, w.z + 0.9), v3(-23.4, WH_Y, w.z + 0.9), v3(LIQUID_WH.x, WH_Y, w.z + 0.9), LIQUID_WH.clone().add(v3(0, 0.3, 0))];
    this.pipe(wPath, 0.09, this.M.water);
    this.addStream('S6', 'water', wPath);
    this.tag('TK-301', 'Water tank', v3(w.x, 5.0, w.z), ['mix']);

    for (const dx of [0, 1.35]) {
      const x = ADMIX.x + dx, z = ADMIX.z;
      this.box(1.2, 0.15, 1.0, this.M.dark, x, 0.08, z);
      const tote = this.box(1.05, 1.0, 0.85, new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.3, transparent: true, opacity: 0.7 }), x, 0.7, z);
      this.box(1.0, 0.55, 0.8, this.M.admix, x, 0.47, z);
      const cage = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.12, 1.08, 0.92, 3, 3, 3)), new THREE.LineBasicMaterial({ color: 0x9aa1ad }));
      cage.position.set(x, 0.7, z);
      this.scene.add(cage);
      tote.userData = { kind: 'ingredient', id: 'admixture' };
      this.pickables.push(tote);
    }
    this.box(0.4, 0.5, 0.35, this.M.admix, ADMIX.x + 2.4, 0.25, ADMIX.z);
    const aPath = [v3(ADMIX.x + 2.4, 0.5, ADMIX.z), v3(ADMIX.x + 2.4, 0.5, ADMIX.z + 1.2), v3(-23.0, 0.5, ADMIX.z + 1.2), v3(-23.0, WH_Y - 0.3, ADMIX.z + 1.2), v3(LIQUID_WH.x - 0.5, WH_Y - 0.3, ADMIX.z + 1.2), LIQUID_WH.clone().add(v3(-0.5, 0, 0.6))];
    this.pipe(aPath, 0.06, this.M.admix);
    this.addStream('S7', 'admixture', aPath);
    this.tag('TK-302', 'Admixture dosing', v3(ADMIX.x + 0.7, 2.4, ADMIX.z), ['mix']);
  }

  /* ---------------- batching tower with twin-shaft mixer ---------------- */
  private buildTower() {
    const { x, z } = TOWER;
    for (const [lx, lz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) this.box(0.32, 13.4, 0.32, this.M.steel, x + lx * 3, 6.7, z + lz * 3);
    for (const y of [5, 10.4]) {
      this.box(6.4, 0.12, 6.4, this.M.grating, x, y, z);
      for (const s of [-1, 1]) { this.box(6.3, 0.35, 0.22, this.M.steel, x, y - 0.25, z + s * 3); this.box(0.22, 0.35, 6.3, this.M.steel, x + s * 3, y - 0.25, z); }
      this.rail(v3(x - 3, y, z - 3), v3(x + 3, y, z - 3));
      this.rail(v3(x - 3, y, z + 3), v3(x + 3, y, z + 3));
      this.rail(v3(x - 3, y, z - 3), v3(x - 3, y, z + 3));
    }
    this.box(6.4, 0.3, 6.4, this.M.steel, x, 13.5, z); // roof
    for (const s of [-1, 1]) { this.strut(v3(x + 3, 0.3, z + s * 3), v3(x + 3, 4.8, z - s * 3), 0.06, this.M.steel); this.strut(v3(x - 3, 5.3, z + s * 3), v3(x - 3, 10.2, z - s * 3), 0.06, this.M.steel); }
    // stairs up the east side
    const s0 = v3(x + 3.9, 0, z - 2.6), s1 = v3(x + 3.9, 5, z + 2.6);
    for (const dx of [-0.5, 0.5]) this.strut(s0.clone().add(v3(dx, 0, 0)), s1.clone().add(v3(dx, 0, 0)), 0.06, this.M.steel);
    for (let u = 0.04; u < 1; u += 0.06) { const p = s0.clone().lerp(s1, u); this.box(1.0, 0.05, 0.28, this.M.grating, p.x, p.y, p.z); }
    this.rail(s0.clone().add(v3(0.5, 0, 0)), s1.clone().add(v3(0.5, 0, 0)));

    // twin-shaft mixer on the lower deck
    const mixer = new THREE.Group();
    mixer.position.set(x, MIXER_Y, z);
    const trough = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 3.2, 32, 1, false, Math.PI / 2, Math.PI), this.M.blue);
    trough.rotation.z = Math.PI / 2; trough.position.y = 0.15; trough.castShadow = true;
    for (const dz of [-0.62, 0.62]) { const t = trough.clone(); t.position.z = dz; mixer.add(t); }
    this.box(3.3, 0.9, 2.5, this.M.blue, 0, 0.6, 0, mixer);
    this.box(3.4, 0.14, 2.6, this.M.dark, 0, 1.12, 0, mixer); // cover
    this.box(0.6, 0.35, 0.6, this.M.galv, -0.6, 1.36, -0.4, mixer); // inlets
    this.box(0.5, 0.35, 0.5, this.M.galv, 0.7, 1.36, 0.4, mixer);
    for (const dz of [-0.62, 0.62]) {
      const shaft = new THREE.Group();
      shaft.position.set(0, 0.2, dz);
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 10), this.M.chrome);
      axle.rotation.z = Math.PI / 2; shaft.add(axle);
      mixer.add(shaft);
      this.shafts.push(shaft);
      this.box(0.7, 0.7, 0.55, this.M.dark, 1.95, 0.2, dz, mixer); // gearbox
      const mot = this.cyl(0.3, 0.3, 0.9, this.M.galv, 2.75, 0.2, dz, mixer);
      mot.rotation.z = Math.PI / 2;
    }
    const chute = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.35, 1.3, 4, 1, true), new THREE.MeshStandardMaterial({ color: 0x8b95a5, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }));
    chute.rotation.y = Math.PI / 4; chute.position.set(0, -0.6, 0);
    mixer.add(chute);
    this.scene.add(mixer);
    this.tag('MIX-401', 'Twin-shaft mixer', v3(x - 2.4, MIXER_Y + 1.9, z - 1.6), ['mix', 'overview']);

    // weigh hoppers on the upper deck
    this.cyl(0.85, 0.85, 1.1, this.M.white, CEMENT_WH.x, CEMENT_WH.y, CEMENT_WH.z);
    this.cyl(0.85, 0.2, 0.9, this.M.white, CEMENT_WH.x, CEMENT_WH.y - 1.0, CEMENT_WH.z);
    const agg = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 0.35, 1.6, 4), new THREE.MeshStandardMaterial({ color: 0x5f7a8a, roughness: 0.6, metalness: 0.4 }));
    agg.rotation.y = Math.PI / 4; agg.position.copy(AGG_WH); agg.castShadow = true;
    this.scene.add(agg);
    this.cyl(0.35, 0.35, 0.7, this.M.water, LIQUID_WH.x, LIQUID_WH.y, LIQUID_WH.z);
    this.cyl(0.25, 0.25, 0.5, this.M.admix, LIQUID_WH.x - 0.5, LIQUID_WH.y - 0.2, LIQUID_WH.z + 0.6);
    for (const p of [CEMENT_WH, AGG_WH]) this.strut(p.clone().add(v3(0, -1.2, 0)), v3(p.x, MIXER_Y + 1.3, p.z), 0.14, this.M.galv);
    this.tag('WH-402', 'Weigh hoppers', v3(TOWER.x, WH_Y + 2.2, TOWER.z), ['mix']);

    // concrete bucket that shuttles on a rail from under the mixer to the casting table
    const railEnd = TABLE_X - 4.6;
    for (const dz of [-0.55, 0.55]) this.box(railEnd - x + 1.6, 0.12, 0.12, this.M.galv, (x + railEnd) / 2, 0.06, z + dz);
    this.box(1.5, 0.4, 1.4, this.M.yellow, 0, 0.45, 0, this.bucket);
    for (const [wx, wz] of [[0.55, 0.62], [-0.55, 0.62], [0.55, -0.62], [-0.55, -0.62]] as const) { const wh = this.cyl(0.16, 0.16, 0.12, this.M.dark, wx, 0.18, wz, this.bucket, 14); wh.rotation.x = Math.PI / 2; }
    const pivot = new THREE.Group(); pivot.name = 'pivot'; pivot.position.set(0.6, 0.8, 0);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.45, 1.3, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x8b95a5, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }));
    b.position.set(-0.6, 0.65, 0); b.castShadow = true;
    this.bucketFill = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.05, 24), this.fresh);
    this.bucketFill.position.set(-0.6, 1.1, 0);
    pivot.add(b, this.bucketFill);
    this.bucket.add(pivot);
    this.bucket.position.set(x, 0, z);
    this.scene.add(this.bucket);
  }

  /* ---------------- forming: casting table, gantry crane, product ---------------- */
  private buildForming() {
    const tx = TABLE_X;
    this.box(8.5, 0.35, 3.4, this.M.steel, tx, 0.95, 0);
    for (const dx of [-3.8, 0, 3.8]) for (const dz of [-1.4, 1.4]) this.box(0.25, 0.8, 0.25, this.M.dark, tx + dx, 0.4, dz);
    this.box(8.5, 0.12, 0.12, this.M.galv, tx, 1.25, -1.65); this.box(8.5, 0.12, 0.12, this.M.galv, tx, 1.25, 1.65);
    this.box(7.6, 0.18, 2.9, this.fresh, tx, 1.22, 0); // fresh concrete in the mould
    for (const dx of [-3.4, 3.4]) this.box(0.1, 0.35, 3.1, this.M.yellow, tx + dx, 1.3, 0); // stop-ends
    this.tag('FORM-501', 'Casting & forming', v3(tx - 2.5, 2.6, -1.6), ['targets', 'overview']);

    // gantry crane on floor rails
    for (const z of [-7.2, 7.2]) this.box(20, 0.12, 0.25, this.M.galv, 1, 0.06, z);
    for (const z of [-7.2, 7.2]) {
      for (const dx of [-1.4, 1.4]) this.strut(v3(dx, 0.5, z), v3(0, 8.6, z), 0.16, this.M.yellow, this.crane, 12);
      this.box(3.4, 0.5, 0.6, this.M.yellow, 0, 0.35, z, this.crane);
    }
    this.box(0.8, 0.9, 15, this.M.yellow, 0, 8.9, 0, this.crane);
    this.box(1.3, 0.7, 1.3, this.M.dark, 0, 9.65, 0, this.trolley);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4.4, 6), this.M.dark);
    cable.position.y = 7.2; this.trolley.add(cable);
    this.box(0.5, 0.6, 0.35, this.M.yellow, 0, 4.8, 0, this.trolley);
    this.crane.add(this.trolley);
    this.crane.position.set(TABLE_X, 0, 0);
    this.scene.add(this.crane);

    // finished product on a steel pallet
    this.box(4.8, 0.14, 3.2, this.M.dark, PRODUCT.x, 0.18, PRODUCT.z);
    for (const dz of [-1.2, 1.2]) this.box(4.6, 0.18, 0.3, this.M.wood, PRODUCT.x, 0.05, PRODUCT.z + dz);
    this.product.position.copy(PRODUCT);
    this.scene.add(this.product);
    const anchors: [number, number, number][] = [[-3.8, 4.8, 0], [3.8, 4.8, 0], [-3.9, 1.6, 2.4], [3.9, 1.6, 2.4]];
    this.targetLabels = anchors.map(a => this.label('pl-label pl-label--target-prop', this.anchor(PRODUCT.clone().add(v3(...a))), ['targets']));
    this.tag('PROD-502', 'Finished product', v3(PRODUCT.x, 5.8, PRODUCT.z - 1), ['overview']);
  }

  /* ---------------- R&D lab: trial batches and design space ---------------- */
  private buildLab() {
    const { x, z } = LAB;
    const pan = new THREE.Group();
    pan.position.set(x - 4.5, 0, z - 1.5);
    this.box(1.3, 0.8, 1.3, this.M.dark, 0, 0.4, 0, pan);
    this.cyl(0.75, 0.6, 0.7, this.M.galv, 0, 1.15, 0, pan, 28, true);
    this.cyl(0.62, 0.62, 0.05, this.fresh, 0, 1.25, 0, pan);
    this.strut(v3(0.7, 0.8, 0), v3(0.7, 2.4, 0), 0.08, this.M.blue, pan);
    this.box(0.4, 0.5, 0.5, this.M.blue, 0.4, 2.45, 0, pan);
    this.scene.add(pan);
    this.tag('LAB-601', 'Trial batch mixer', v3(x - 4.5, 3.2, z - 1.5), ['experiments', 'overview']);

    // bench for the six cylinder moulds, one per trial
    this.box(7.2, 0.08, 1.6, this.M.dark, x + 0.6, 0.95, z + 2.6);
    this.box(7, 0.86, 1.4, this.M.bench, x + 0.6, 0.47, z + 2.6);
    // workstation running the design-of-experiments model
    this.box(1.6, 0.06, 0.8, this.M.bench, x + 5.6, 0.75, z - 2.5);
    for (const dx of [-0.7, 0.7]) this.box(0.06, 0.75, 0.7, this.M.dark, x + 5.6 + dx, 0.38, z - 2.5);
    this.box(0.9, 0.55, 0.05, this.M.dark, x + 5.6, 1.15, z - 2.75);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.47), this.M.screen);
    screen.position.set(x + 5.6, 1.15, z - 2.72); this.scene.add(screen);

    // design space projected above the lab
    this.cube.position.copy(CUBE_C);
    this.scene.add(this.cube);
    this.cyl(0.9, 1.1, 0.25, this.M.dark, CUBE_C.x, 0.12, CUBE_C.z);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(CUBE * 0.55, 0.9, CUBE_C.y - CUBE / 2 - 0.2, 32, 1, true), new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set(CUBE_C.x, (CUBE_C.y - CUBE / 2) / 2 + 0.1, CUBE_C.z);
    this.scene.add(beam);
  }

  /* ---------------- curing chamber, QC lab, compression press ---------------- */
  private buildQC() {
    const c = CURE;
    const wall = new THREE.MeshStandardMaterial({ color: 0xe9ebef, roughness: 0.8 });
    this.box(8, 4.4, 0.25, wall, c.x, 2.2, c.z - 2.6);
    for (const dx of [-4, 4]) this.box(0.25, 4.4, 5.4, wall, c.x + dx, 2.2, c.z);
    this.box(8.4, 0.3, 5.6, wall, c.x, 4.5, c.z);
    this.box(8, 0.8, 0.3, this.M.dark, c.x, 4.05, c.z + 2.65); // roller door, open
    for (const dx of [-2.6, 0, 2.6]) {
      for (const y of [0.9, 2.0, 3.1]) {
        this.box(2.2, 0.06, 4.2, this.M.galv, c.x + dx, y, c.z - 0.2);
        for (let k = -1.5; k <= 1.5; k += 0.75) this.box(0.5, 0.35, 0.5, this.concrete, c.x + dx, y + 0.2, c.z + k);
      }
      for (const dz of [-2.2, 1.8]) this.box(0.08, 3.6, 0.08, this.M.galv, c.x + dx, 1.8, c.z + dz);
    }
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
      const sx = c.x - 3 + (i % 5) * 1.5, sz = c.z + 2.4;
      m.position.set(sx, 3.8, sz);
      this.scene.add(m);
      this.steam.push({ mesh: m, t: i / 10, x: sx, z: sz });
    }
    this.tag('CURE-701', 'Steam curing chamber', v3(c.x, 5.4, c.z), ['results', 'overview']);

    // QC bench with test specimens and an analytics overlay of predicted strength
    const q = QC;
    this.box(7.6, 0.08, 1.7, this.M.dark, q.x, BENCH_TOP, q.z);
    this.box(7.4, BENCH_TOP - 0.05, 1.5, this.M.bench, q.x, (BENCH_TOP - 0.05) / 2, q.z);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 1.8), this.M.holo);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(q.x, BENCH_TOP + BAR_BASE + BAR_TARGET, q.z);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(7.8, 1.8)), new THREE.LineBasicMaterial({ color: BRAND, transparent: true, opacity: 0.7 }));
    edge.rotation.x = -Math.PI / 2; edge.position.copy(plane.position);
    this.scene.add(plane, edge);
    this.tag('QC-801', 'Quality control lab', v3(q.x - 1.5, BENCH_TOP + 0.6, q.z - 1.4), ['overview']);

    // compression testing machine: base with hydraulic ram, two columns, crosshead, guard, console
    const px = PRESS_X, pz = q.z;
    this.box(1.3, 1.0, 1.1, this.M.steel, px, 0.5, pz);
    for (const dx of [-0.48, 0.48]) this.cyl(0.08, 0.08, 2.6, this.M.chrome, px + dx, 2.3, pz, this.scene, 16);
    this.box(1.3, 0.45, 0.9, this.M.steel, px, 3.65, pz);
    this.cyl(0.3, 0.3, 0.12, this.M.chrome, px, 2.95, pz); // upper platen
    this.cyl(0.12, 0.12, 0.42, this.M.chrome, px, 3.22, pz);
    this.cyl(0.32, 0.32, 0.5, this.M.chrome, 0, -0.15, 0, this.pressPiston);
    this.cyl(0.34, 0.34, 0.08, this.M.dark, 0, 0.12, 0, this.pressPiston);
    this.pressPiston.position.set(px, 1.05, pz);
    this.scene.add(this.pressPiston);
    const specGeo = new THREE.CylinderGeometry(0.17, 0.17, 1, 28);
    specGeo.translate(0, 0.5, 0);
    this.pressSpecimen = new THREE.Mesh(specGeo, this.concrete);
    this.pressSpecimen.castShadow = true;
    this.scene.add(this.pressSpecimen);
    this.box(1.32, 1.7, 0.03, this.M.glass, px, 2.2, pz + 0.55);
    this.box(0.7, 1.4, 0.6, this.M.white, px + 1.3, 0.7, pz);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), this.M.screen);
    scr.position.set(px + 1.3, 1.15, pz + 0.31); this.scene.add(scr);
    this.cyl(0.12, 0.12, 0.2, this.M.yellow, px + 1.3, 1.5, pz);
    this.tag('UTM-802', 'Compression testing machine', v3(px + 1.6, 4.4, pz - 0.6), ['overview']);
  }

  private buildParticles() {
    const m = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshStandardMaterial({ roughness: 0.6 }), PARTICLES);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < PARTICLES; i++) { this.particleData.push({ stream: 0, t: (i * 0.618) % 1, speed: 0.5 + ((i * 37) % 17) / 30 }); m.setColorAt(i, new THREE.Color(0xffffff)); }
    m.frustumCulled = false;
    this.scene.add(m);
    return m;
  }

  private addStream(id: string, ingredient: IngredientId, pts: THREE.Vector3[]) {
    const path = new Path(pts);
    const at = id === 'S3' || id === 'S4' || id === 'S5' ? pts[0]!.clone().add(v3(0, -0.6, 1.9)) : path.at(id === 'S1' ? 0.3 : id === 'S2' ? 0.62 : 0.5, new THREE.Vector3()).add(v3(0, 0.5, 0));
    const label = this.label('pl-label pl-label--stream', this.anchor(at), ['mix']);
    this.streams.push({ id, ingredient, path, label });
  }

  /* ---------------- per-state updates ---------------- */
  private updateProduct(s: SceneState) {
    const best = s.rec.best, fs = feedstockById(s.targets.feedstock);
    const col = new THREE.Color(0xb7bbc2).lerp(new THREE.Color(fs.color), Math.min(0.7, best.design.scm * 1.1)).lerp(new THREE.Color(0xc3b29b), best.design.rca * 0.35);
    this.concrete.color.copy(col);
    this.fresh.color.copy(col).multiplyScalar(0.78);
    if (this.productKey !== s.targets.product) {
      this.productKey = s.targets.product;
      this.product.clear();
      this.product.add(buildProduct(s.targets.product, this.concrete));
    }
    const t = s.targets;
    const rows = [
      ['28-day strength', `${t.strength} MPa`],
      ['Workability', t.slump ? `${t.slump} mm slump` : 'Zero slump'],
      ['Carbon cap', `≤ ${t.carbon} kg CO₂e/m³`],
      ['Cost cap', `≤ $${t.cost}/m³`],
    ];
    this.targetLabels.forEach((l, i) => setLabel(l, rows[i]![0]!, rows[i]![1]!));
  }

  private updateMix(s: SceneState) {
    const ing = s.rec.best.ingredients;
    const kgOf = (id: IngredientId) => ing.find(x => x.id === id)!;
    for (const [id, g] of this.gauges) {
      const i = kgOf(id), on = s.ingredient === id;
      g.goal = i.kg <= 0.05 ? 0.01 : 0.2 + 5.8 * Math.min(1, i.kg / 600);
      g.mat.color.set(i.color);
      g.shells.forEach(m => (m.material as THREE.MeshStandardMaterial).emissive.set(on ? 0x14146e : 0x000000));
    }
    for (const [id, heap] of this.heaps) {
      const i = kgOf(id), mat = heap.material as THREE.MeshStandardMaterial;
      mat.color.set(i.color);
      mat.emissive.set(s.ingredient === id ? 0x14146e : 0x000000);
      heap.scale.y = i.kg <= 0.05 ? 0.05 : 0.4 + 0.8 * Math.min(1, i.kg / 900);
    }
    for (const st of this.streams) {
      const i = kgOf(st.ingredient);
      setLabel(st.label, `${st.id} · ${SHORT[st.ingredient] ?? i.name}`, i.kg < 0.05 ? 'No flow' : `${i.kg < 20 ? i.kg.toFixed(1) : Math.round(i.kg)} kg/m³`, s.ingredient === st.ingredient);
    }
    // share the particles between streams in proportion to mass
    const weights = this.streams.map(st => { const kg = kgOf(st.ingredient).kg; return kg > 0.05 ? Math.max(kg, 80) * (st.path.length / 15) : 0; });
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    let acc = 0, k = 0;
    const cum = weights.map(w => (acc += w / sum));
    for (let i = 0; i < PARTICLES; i++) {
      const u = (i + 0.5) / PARTICLES;
      while (k < cum.length - 1 && u > cum[k]!) k++;
      this.particleData[i]!.stream = k;
      this.particles.setColorAt(i, new THREE.Color(kgOf(this.streams[k]!.ingredient).color));
    }
    if (this.particles.instanceColor) this.particles.instanceColor.needsUpdate = true;
    const total = ing.reduce((a, i) => a + i.kg, 0);
    setLabel(this.mixerLabel, `S8 · Fresh concrete · w/b ${s.rec.best.design.wb.toFixed(2)}`, `${Math.round(total).toLocaleString()} kg/m³`);
  }

  private buildCube(s: SceneState) {
    this.cube.clear();
    const old = new Set<Label>([...this.points.flatMap(p => (p.label ? [p.label] : [])), ...this.axisLabels, ...this.molds.map(m => m.label), ...this.specimens.map(c => c.label)]);
    old.forEach(l => l.el.remove());
    this.labels = this.labels.filter(l => !old.has(l));
    this.pickables = this.pickables.filter(o => o.userData['kind'] !== 'trial');
    this.points = [];
    this.molds.forEach(m => this.scene.remove(m.group));
    this.specimens.forEach(c => this.scene.remove(c.mesh, c.bar));

    const h = CUBE / 2;
    this.cube.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE, CUBE, CUBE)), new THREE.LineBasicMaterial({ color: BRAND, transparent: true, opacity: 0.6 })));
    this.cube.add(new THREE.Mesh(new THREE.BoxGeometry(CUBE, CUBE, CUBE), new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, opacity: 0.04, depthWrite: false, side: THREE.BackSide })));
    const gridPts: number[] = [];
    for (const v of [-h, 0, h]) for (const w of [-h, 0, h]) gridPts.push(-h, v, w, h, v, w, v, -h, w, v, h, w, v, w, -h, v, w, h);
    this.cube.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3)), new THREE.LineBasicMaterial({ color: 0x8f96ad, transparent: true, opacity: 0.2 })));

    const small = new THREE.SphereGeometry(0.15, 18, 12), big = new THREE.SphereGeometry(0.3, 26, 18), haloGeo = new THREE.RingGeometry(0.4, 0.49, 40);
    s.plan.candidates.forEach(c => {
      const sel = c.selected;
      const mat = new THREE.MeshStandardMaterial({ color: passColor(c.prediction.passProbability), roughness: 0.35, transparent: !sel, opacity: sel ? 1 : 0.5 });
      const mesh = new THREE.Mesh(sel ? big : small, mat);
      mesh.position.set(c.level[0] * h, c.level[1] * h, c.level[2] * h);
      const selectedIndex = sel ? s.plan.selected.indexOf(c) : -1;
      mesh.userData = sel ? { kind: 'trial', index: selectedIndex } : {};
      this.cube.add(mesh);
      let halo: THREE.Mesh | null = null, label: Label | null = null;
      if (sel) {
        halo = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
        halo.position.copy(mesh.position);
        this.cube.add(halo);
        this.pickables.push(mesh);
        label = this.label('pl-label pl-label--trial', this.anchorIn(mesh, v3(0, 0.5, 0)), ['experiments']);
        label.el.textContent = c.id;
      }
      this.points.push({ mesh, halo, label, selectedIndex });
    });
    const o = this.points.find(p => p.selectedIndex === 0)!.mesh.position, linkPts: number[] = [];
    s.plan.selected.slice(1).forEach((_, i) => { const p = this.points.find(q => q.selectedIndex === i + 1)!.mesh.position; linkPts.push(o.x, o.y, o.z, p.x, p.y, p.z); });
    const links = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(linkPts, 3)), new THREE.LineDashedMaterial({ color: BRAND, dashSize: 0.16, gapSize: 0.12, transparent: true, opacity: 0.7 }));
    links.computeLineDistances();
    this.cube.add(links);

    const fs = feedstockById(s.targets.feedstock);
    const uniq = (f: (d: { wb: number; scm: number; rca: number }) => number) => [...new Set(s.plan.candidates.map(c => f(c.prediction.design)))].sort((a, b) => a - b);
    const range = (v: number[], f: (x: number) => string) => (v.length > 1 ? `${f(v[0]!)} – ${f(v[v.length - 1]!)}` : `held at ${f(v[0]!)}`);
    const pctf = (x: number) => `${Math.round(x * 100)}%`;
    const axes: [string, string, THREE.Vector3][] = [
      ['w/b ratio', range(uniq(d => d.wb), x => x.toFixed(2)), v3(0, -h - 0.45, h + 0.3)],
      [fs.name, range(uniq(d => d.scm), pctf), v3(-h - 0.5, 0, h + 0.3)],
      ['Recycled aggregate', range(uniq(d => d.rca), pctf), v3(h + 0.5, -h - 0.35, 0)],
    ];
    this.axisLabels = axes.map(([a, b, p]) => { const l = this.label('pl-label pl-label--axis', this.anchorIn(this.cube, p), ['experiments']); setLabel(l, a, b); return l; });

    // one steel mould per selected trial on the lab bench, one test specimen per trial on the QC bench
    const n = s.plan.selected.length;
    this.molds = s.plan.selected.map((tr, i) => {
      const g = new THREE.Group();
      g.position.set(LAB.x - 2.2 + (i * 5.6) / Math.max(1, n - 1), BENCH_TOP + 0.04, LAB.z + 2.6);
      this.cyl(0.2, 0.2, 0.42, this.M.dark, 0, 0.21, 0, g, 24, true);
      this.cyl(0.25, 0.25, 0.04, this.M.dark, 0, 0.02, 0, g, 24);
      const mat = new THREE.MeshStandardMaterial({ color: 0x8e9298, roughness: 0.55, map: this.concreteTex });
      const top = this.cyl(0.19, 0.19, 0.38, mat, 0, 0.2, 0, g, 24);
      top.userData = { kind: 'trial', index: i };
      this.pickables.push(top);
      this.scene.add(g);
      const label = this.label('pl-label pl-label--cyl', this.anchorIn(g, v3(0, 0.6, 0)), ['experiments']);
      setLabel(label, tr.id, `${Math.round(tr.prediction.passProbability * 100)}%`);
      return { top, mat, label, group: g };
    });
    this.specimens = s.plan.selected.map((_, i) => {
      const x = QC.x - 3.2 + (i * 5.6) / Math.max(1, n - 1);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, map: this.concreteTex });
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.6, 26), mat);
      mesh.position.set(x, BENCH_TOP + 0.34, QC.z);
      mesh.castShadow = true;
      mesh.userData = { kind: 'trial', index: i };
      this.scene.add(mesh);
      this.pickables.push(mesh);
      const barGeo = new THREE.BoxGeometry(0.3, 1, 0.3);
      barGeo.translate(0, 0.5, 0);
      const barMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.35, depthWrite: false });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(x, BENCH_TOP + BAR_BASE, QC.z);
      bar.scale.y = 0.01;
      bar.userData = { kind: 'trial', index: i };
      this.scene.add(bar);
      this.pickables.push(bar);
      const top = new THREE.Object3D(); top.position.y = 1; bar.add(top);
      return { mesh, mat, bar, barMat, height: 0.01, goal: 0.01, label: this.label('pl-label pl-label--cyl', top, ['results']) };
    });
  }

  private updateTrials(s: SceneState) {
    this.points.forEach(p => {
      if (p.selectedIndex < 0) return;
      const on = p.selectedIndex === s.trial, m = p.mesh.material as THREE.MeshStandardMaterial;
      m.emissive.set(on ? BRAND : 0x000000);
      m.emissiveIntensity = on ? 0.45 : 0;
      p.label?.el.classList.toggle('is-on', on);
    });
    this.molds.forEach((m, i) => {
      const on = i === s.trial;
      m.mat.color.copy(this.fresh.color);
      m.mat.emissive.set(on ? BRAND : 0x000000);
      m.mat.emissiveIntensity = on ? 0.35 : 0;
      m.label.el.classList.toggle('is-on', on);
    });
  }

  private updateResults(s: SceneState) {
    s.plan.selected.forEach((tr, i) => {
      const c = this.specimens[i]!, p = tr.prediction, on = i === s.trial;
      c.goal = Math.max(0.15, Math.min(3.6, (BAR_TARGET * p.strength) / s.targets.strength));
      c.barMat.color.copy(passColor(p.passProbability));
      c.barMat.opacity = on ? 0.7 : 0.32;
      c.mat.color.copy(this.concrete.color);
      c.mat.emissive.set(on ? BRAND : 0x000000);
      c.mat.emissiveIntensity = on ? 0.3 : 0;
      c.mesh.visible = !on; // the selected specimen is in the press
      setLabel(c.label, tr.id, `${p.strength.toFixed(0)} MPa`, on);
    });
    const sel = s.plan.selected[s.trial];
    if (sel) setLabel(this.pressLabel, `UTM-802 · ${sel.id} under load`, `${sel.prediction.strength.toFixed(1)} MPa predicted`);
    setLabel(this.targetLabel, 'Target', `${s.targets.strength} MPa`);
  }

  /* ---------------- camera ---------------- */
  private aim(s: SceneState, instant: boolean) {
    const w = this.host.clientWidth, h = Math.max(1, this.host.clientHeight), wide = w / h;
    const far = wide < 0.9 ? 1.5 : wide < 1.3 ? 1.2 : 1;
    const view = VIEWS[s.overview ? 'overview' : s.stage];
    const off = v3(...view.offset).multiplyScalar(far);
    // the floating panel covers the left of the frame on wide screens, so aim left of the subject
    const shift = w > 860 ? -off.length() * (s.overview ? 0.05 : 0.14) * Math.min(1.3, 1.7 / wide) : 0;
    this.camGoal.target.set(view.target[0] + shift, view.target[1], view.target[2]);
    this.camGoal.pos.copy(this.camGoal.target).add(off);
    this.camGoal.active = true;
    if (instant || this.reduced) {
      this.camera.position.copy(this.camGoal.pos);
      this.controls.target.copy(this.camGoal.target);
      this.controls.update();
    }
  }

  private fit() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.state) this.aim(this.state, true);
    if (!this.running) this.render(0);
  }

  /* ---------------- frame ---------------- */
  private render(dt: number) {
    const s = this.state, motion = !this.reduced;
    if (motion) this.time += dt;
    const t = this.time;
    if (this.camGoal.active) {
      const k = this.reduced ? 1 : 1 - Math.pow(0.03, dt);
      this.camera.position.lerp(this.camGoal.pos, k);
      this.controls.target.lerp(this.camGoal.target, k);
      if (this.camera.position.distanceTo(this.camGoal.pos) < 0.02) this.camGoal.active = false;
    }
    this.controls.update();
    const settle = (cur: number, goal: number) => (this.reduced || dt === 0 ? goal : cur + (goal - cur) * (1 - Math.pow(0.004, dt)));

    for (const g of this.gauges.values()) { g.level = settle(g.level, g.goal); g.fill.scale.y = g.level; }
    this.shafts.forEach((sh, i) => { sh.rotation.x = (i ? -1 : 1) * t * 3; });
    this.belts.forEach(b => { const m = b.material as THREE.MeshStandardMaterial; if (m.map) m.map.offset.x = -t * 0.6; });

    // stream particles
    const m = new THREE.Matrix4(), q = new THREE.Vector3();
    for (let i = 0; i < PARTICLES; i++) {
      const d = this.particleData[i]!, st = this.streams[d.stream]!;
      if (motion) d.t = (d.t + (dt * d.speed * 2.4) / st.path.length) % 1;
      st.path.at(d.t, q);
      const sc = Math.min(1, d.t * 12, (1 - d.t) * 12);
      m.makeScale(sc, sc, sc).setPosition(q);
      this.particles.setMatrixAt(i, m);
    }
    this.particles.instanceMatrix.needsUpdate = true;

    // bucket cycle: fill under the mixer, travel, tip into the mould, return
    const cyc = (t % 12) / 12, x0 = TOWER.x, x1 = TABLE_X - 4.6;
    let bx = x0, tip = 0, fill = 1;
    if (cyc < 0.25) fill = cyc / 0.25;
    else if (cyc < 0.5) bx = x0 + (x1 - x0) * easeInOut((cyc - 0.25) / 0.25);
    else if (cyc < 0.68) { bx = x1; const u = (cyc - 0.5) / 0.18; tip = Math.sin(Math.PI * u) * 1.1; fill = 1 - Math.min(1, u * 1.6); }
    else { bx = x1 + (x0 - x1) * easeInOut((cyc - 0.68) / 0.32); fill = 0; }
    this.bucket.position.x = bx;
    const pivot = this.bucket.getObjectByName('pivot');
    if (pivot) pivot.rotation.z = -tip;
    this.bucketFill.visible = fill > 0.02;
    this.bucketFill.position.y = 0.2 + 0.85 * fill;

    // gantry crane drifts along its rails, trolley along the girder
    this.crane.position.x = TABLE_X + Math.sin(t * 0.18) * 2.5;
    this.trolley.position.z = Math.sin(t * 0.31) * 4.5;

    for (const p of this.steam) {
      if (motion) p.t = (p.t + dt * 0.12) % 1;
      p.mesh.position.set(p.x + Math.sin(p.t * 6 + p.x) * 0.3, 3.9 + p.t * 3, p.z + p.t * 0.6);
      p.mesh.scale.setScalar(0.4 + p.t * 1.4);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.35 * Math.sin(Math.PI * p.t);
    }

    if (motion) this.cube.rotation.y += dt * 0.15;
    for (const p of this.points) {
      if (!p.halo) continue;
      p.halo.quaternion.copy(this.cube.quaternion).invert().multiply(this.camera.quaternion);
      const on = s && p.selectedIndex === s.trial;
      (p.halo.material as THREE.MeshBasicMaterial).opacity = on ? 0.55 + 0.35 * Math.sin(t * 4) : 0.18;
      p.halo.scale.setScalar(on ? 1.15 + 0.12 * Math.sin(t * 4) : 1);
    }

    this.specimens.forEach(c => { c.height = settle(c.height, c.goal); c.bar.scale.y = c.height; });
    // the selected specimen sits in the press; the ram rises and loads it
    const load = motion ? 0.5 - 0.5 * Math.cos(t * 1.4) : 1;
    const pistonY = 1.05 + 0.25 * load;
    this.pressPiston.position.y = pistonY;
    this.pressSpecimen.position.set(PRESS_X, pistonY + 0.16, QC.z);
    this.pressSpecimen.scale.set(1, 0.6, 1);
    this.pressSpecimen.material = this.specimens[s?.trial ?? 0]?.mat ?? this.concrete;

    this.renderer.render(this.scene, this.camera);
    this.placeLabels(s);
  }

  private placeLabels(s: SceneState | null) {
    const w = this.host.clientWidth, h = this.host.clientHeight, v = new THREE.Vector3();
    const zone: Zone | null = s ? (s.overview ? 'overview' : s.stage) : null;
    for (const l of this.labels) {
      if (zone && l.zones.includes(zone)) {
        l.anchor.getWorldPosition(v);
        v.project(this.camera);
        const inside = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
        if (inside) l.el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -100%)`;
        if (inside !== l.visible) { l.visible = inside; l.el.classList.toggle('is-visible', inside); }
      } else if (l.visible) { l.visible = false; l.el.classList.remove('is-visible'); }
    }
  }

  /* ---------------- picking ---------------- */
  private onDown = (e: PointerEvent) => { this.downAt = [e.clientX, e.clientY]; };
  private onUp = (e: PointerEvent) => {
    const d = this.downAt;
    this.downAt = null;
    if (!d || Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 6) return;
    const hit = this.pick(e);
    if (!hit) return;
    const u = hit.userData;
    if (u['kind'] === 'trial') this.events.onTrial(u['index'] as number);
    else if (u['kind'] === 'ingredient') this.events.onIngredient(u['id'] as IngredientId);
    else if (u['kind'] === 'zone' && this.state && (u['id'] !== this.state.stage || this.state.overview)) this.events.onStage(u['id'] as StageId);
  };
  private onMove = (e: PointerEvent) => {
    if (this.downAt) return;
    const hit = this.pick(e), k = hit?.userData['kind'];
    this.renderer.domElement.style.cursor = k === 'trial' || k === 'ingredient' || (k === 'zone' && (hit!.userData['id'] !== this.state?.stage || this.state?.overview)) ? 'pointer' : 'grab';
  };
  private pick(e: PointerEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, false);
    return (hits.find(h => h.object.userData['kind'] !== 'zone') ?? hits[0])?.object ?? null;
  }

  /* ---------------- labels ---------------- */
  private label(className: string, anchor: THREE.Object3D, zones: Zone[]) {
    const el = document.createElement('div');
    el.className = className;
    el.setAttribute('aria-hidden', 'true');
    this.labelHost.appendChild(el);
    const l: Label = { el, anchor, zones, visible: false };
    this.labels.push(l);
    return l;
  }
  private anchor(p: THREE.Vector3) { const o = new THREE.Object3D(); o.position.copy(p); this.scene.add(o); return o; }
  private anchorIn(parent: THREE.Object3D, p: THREE.Vector3) { const o = new THREE.Object3D(); o.position.copy(p); parent.add(o); return o; }
}

const SHORT: Partial<Record<IngredientId, string>> = { cement: 'Cement', scm: 'Binder', water: 'Water', admixture: 'Admixture', sand: 'Sand', coarse: 'Coarse agg.', rca: 'Recycled agg.' };
const easeInOut = (u: number) => u * u * (3 - 2 * u);

function setLabel(l: Label, title: string, value: string, on = false) {
  if (l.el.dataset['title'] !== title || l.el.dataset['value'] !== value) {
    l.el.dataset['title'] = title;
    l.el.dataset['value'] = value;
    l.el.replaceChildren(Object.assign(document.createElement('span'), { textContent: title }), Object.assign(document.createElement('b'), { textContent: value }));
  }
  l.el.classList.toggle('is-on', on);
}

function buildProduct(id: ProductId, mat: THREE.Material) {
  const g = new THREE.Group();
  const box = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
  };
  if (id === 'precast') {
    // wall panel with a window opening, standing in an A-frame stillage
    const W = 4.4, H = 3.2, T = 0.3, ow = 1.4, oh = 1.1, oy = 2.0;
    box((W - ow) / 2, H, T, -(W + ow) / 4, H / 2 + 0.3, 0);
    box((W - ow) / 2, H, T, (W + ow) / 4, H / 2 + 0.3, 0);
    box(ow, oy - oh / 2, T, 0, (oy - oh / 2) / 2 + 0.3, 0);
    box(ow, H - oy - oh / 2, T, 0, 0.3 + H - (H - oy - oh / 2) / 2, 0);
    const steel = new THREE.MeshStandardMaterial({ color: 0x3b4c63, roughness: 0.5, metalness: 0.4 });
    for (const dx of [-1.8, 1.8]) for (const dz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.12), steel);
      leg.position.set(dx, 1.15, dz * 0.55); leg.rotation.x = -dz * 0.38; leg.castShadow = true; g.add(leg);
    }
    const sill = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.3, 0.6), steel); sill.position.y = 0.15; g.add(sill);
  } else if (id === 'masonry') {
    // pallet of hollow two-core blocks in running bond
    const L = 0.8, Hh = 0.4, D = 0.4, t = 0.07;
    const block = (x: number, y: number, z: number) => {
      box(L, Hh, t, x, y, z + D / 2 - t / 2);
      box(L, Hh, t, x, y, z - D / 2 + t / 2);
      for (const ex of [-L / 2 + t / 2, 0, L / 2 - t / 2]) box(t, Hh, D - 2 * t, x + ex, y, z);
    };
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) for (let k = 0; k < 4; k++) block(-1.7 + c * 0.84 + (r % 2 ? 0.1 : 0), Hh / 2 + r * 0.42, -1.2 + k * 0.42);
  } else if (id === 'paver') {
    // cubed pallet of pavers, plus a laid sample in herringbone
    for (let r = 0; r < 6; r++) for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) box(0.34, 0.13, 0.22, -1.6 + i * 0.36, 0.07 + r * 0.14, -0.9 + j * 0.24);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { const m = box(0.34, 0.1, 0.17, 0.9 + i * 0.3, 0.05, -0.6 + j * 0.36); m.rotation.y = (i + j) % 2 ? Math.PI / 4 : -Math.PI / 4; }
  } else {
    // ready-mix: a cast column and slab corner as the structural element
    box(2.6, 0.5, 2.6, 0, 0.25, 0);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3.2, 40), mat);
    col.position.y = 2.1; col.castShadow = true; g.add(col);
    box(3.8, 0.32, 3.0, 0, 3.86, 0);
  }
  return g;
}

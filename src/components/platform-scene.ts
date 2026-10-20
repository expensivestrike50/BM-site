// Imperative three.js scene for the interactive platform. The React component
// loads this module on the client only and pushes state into it with setState.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { feedstockById, type ExperimentPlan, type IngredientId, type ProductId, type Recommendation, type StageId, type Targets } from '@/lib/platform-model';

export type SceneState = { stage: StageId; overview: boolean; targets: Targets; rec: Recommendation; plan: ExperimentPlan; trial: number; ingredient: IngredientId | null };
export type SceneEvents = { onStage: (id: StageId) => void; onTrial: (index: number) => void; onIngredient: (id: IngredientId) => void };

const BRAND = 0x2121d8, TEAL = 0x008081, AQUA = 0x9be9e1, AMBER = 0xe3a33b;
const ZONES: Record<StageId, number> = { targets: -27, mix: -9, experiments: 9, results: 27 };
const ZONE_ORDER: StageId[] = ['targets', 'mix', 'experiments', 'results'];
const CUBE = 5, CUBE_Y = 4.4, BENCH_Y = 0.95, TARGET_H = 2.4;
const PARTICLES = 160;
const SILO_NAMES: Partial<Record<IngredientId, string>> = { cement: 'Cement', admixture: 'Admixture', coarse: 'Coarse agg.', rca: 'Recycled agg.' };

type Label = { el: HTMLDivElement; anchor: THREE.Object3D; zone: StageId | null; visible: boolean };
type Silo = { id: IngredientId; group: THREE.Group; fill: THREE.Mesh; fillMat: THREE.MeshStandardMaterial; shell: THREE.Mesh; level: number; goal: number; label: Label; mouth: THREE.Vector3 };

const passColor = (p: number) => new THREE.Color(AMBER).lerp(new THREE.Color(TEAL), Math.min(1, Math.max(0, (p - 0.3) / 0.6)));

function concreteTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#d9d9d9';
  g.fillRect(0, 0, 256, 256);
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 2600; i++) {
    const v = 150 + Math.floor(rnd() * 105), r = rnd() < 0.08 ? 1.5 + rnd() * 2.5 : 0.4 + rnd() * 0.9;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.beginPath(); g.arc(rnd() * 256, rnd() * 256, r, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class PlatformScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
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
  private texture = concreteTexture();

  private pads = new Map<StageId, { ring: THREE.Mesh; mat: THREE.MeshStandardMaterial }>();
  private flow: THREE.InstancedMesh;
  private product = new THREE.Group();
  private productKey = '';
  private concrete = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.92, map: this.texture });
  private targetLabels: Label[] = [];
  private silos: Silo[] = [];
  private drum = new THREE.Group();
  private particles: THREE.InstancedMesh;
  private particleData: { silo: number; t: number; speed: number }[] = [];
  private mixLabel: Label;
  private cube = new THREE.Group();
  private points: { mesh: THREE.Mesh; halo: THREE.Mesh | null; label: Label | null; selectedIndex: number }[] = [];
  private links: THREE.LineSegments | null = null;
  private axisLabels: Label[] = [];
  private cylinders: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; height: number; goal: number; label: Label }[] = [];
  private press = new THREE.Group();
  private platen = new THREE.Mesh();
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
    this.controls.enablePan = false;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 80;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.addEventListener('start', () => { this.camGoal.active = false; });

    this.targetLabel = this.label('pl-label pl-label--target', new THREE.Object3D(), 'results');
    this.buildWorld();
    this.flow = this.buildFlow();
    this.particles = this.buildParticles();
    this.mixLabel = this.label('pl-label pl-label--center', this.drum, 'mix', new THREE.Vector3(0, 2.4, 0));

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
    this.updateCube(s);
    this.updateResults(s, !prev || prev.plan !== s.plan);
    this.pads.forEach((p, id) => { p.mat.emissiveIntensity = id === s.stage ? 0.9 : 0.15; p.mat.opacity = id === s.stage ? 1 : 0.45; });
    if (!prev || prev.stage !== s.stage || prev.overview !== s.overview || !this.running) this.aim(s, !prev);
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
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach(x => x.dispose());
    });
    this.texture.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labels.forEach(l => l.el.remove());
  }

  /* ---------------- world ---------------- */
  private buildWorld() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0xffffff, 0xc9ccd6, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-18, 34, 22);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 20, bottom: -20, near: 1, far: 100 });
    sun.shadow.bias = -0.0004;
    s.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 120), new THREE.ShadowMaterial({ opacity: 0.12 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    s.add(ground);
    const grid = new THREE.GridHelper(120, 60, 0xe3e5ec, 0xe3e5ec);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.55;
    grid.position.y = 0.001;
    s.add(grid);

    const walk = new THREE.Mesh(new THREE.BoxGeometry(56, 0.12, 2.2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
    walk.position.y = 0.06;
    walk.receiveShadow = true;
    s.add(walk);

    for (const id of ZONE_ORDER) {
      const x = ZONES[id];
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(7.4, 7.6, 0.36, 72), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 }));
      pad.position.set(x, 0.18, 0);
      pad.receiveShadow = true;
      pad.userData = { kind: 'zone', id };
      s.add(pad);
      this.pickables.push(pad);
      const mat = new THREE.MeshStandardMaterial({ color: BRAND, emissive: BRAND, emissiveIntensity: 0.2, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.07, 8, 120), mat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.37, 0);
      s.add(ring);
      this.pads.set(id, { ring, mat });
    }

    // stage 1: product turntable
    const table = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.3, 64), new THREE.MeshStandardMaterial({ color: 0xeef0f5, roughness: 0.4, metalness: 0.1 }));
    table.position.set(ZONES.targets, 0.51, 0);
    table.receiveShadow = true;
    s.add(table);
    this.product.position.set(ZONES.targets, 0.66, 0);
    s.add(this.product);
    const anchors: [number, number, number][] = [[-4.4, 4.6, 0], [4.4, 4.6, 0], [-4.6, 1.6, 2.6], [4.6, 1.6, 2.6]];
    this.targetLabels = anchors.map(a => this.label('pl-label pl-label--target-prop', this.anchorAt(ZONES.targets + a[0], a[1], a[2]), 'targets'));

    this.buildMix();
    this.cube.position.set(ZONES.experiments, CUBE_Y, 0);
    s.add(this.cube);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 1.2, 48), new THREE.MeshStandardMaterial({ color: 0xeef0f5, roughness: 0.4 }));
    plinth.position.set(ZONES.experiments, 0.96, 0);
    plinth.castShadow = true;
    s.add(plinth);
    this.buildBench();
  }

  private buildFlow() {
    // chevrons that travel along the walkway from stage to stage
    const g = new THREE.ConeGeometry(0.32, 0.7, 3);
    g.rotateZ(-Math.PI / 2);
    const m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: BRAND, emissive: BRAND, emissiveIntensity: 0.4 }), 36);
    this.scene.add(m);
    return m;
  }

  private buildMix() {
    const x0 = ZONES.mix;
    const shellMat = () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.2, depthWrite: false });
    const steel = new THREE.MeshStandardMaterial({ color: 0xc4c8d2, roughness: 0.35, metalness: 0.6 });
    const ids: IngredientId[] = ['cement', 'scm', 'water', 'admixture', 'sand', 'coarse', 'rca'];
    ids.forEach((id, i) => {
      const a = -1.15 + (i / (ids.length - 1)) * 2.3, r = 5.1;
      const group = new THREE.Group();
      group.position.set(x0 + Math.sin(a) * r, 0.36, -Math.cos(a) * r + 1.4);
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 4, 40, 1, true), shellMat());
      shell.position.y = 3.4;
      shell.userData = { kind: 'ingredient', id };
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.76, 0.5, 40), steel);
      cap.position.y = 5.65;
      const hopper = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.9, 40), steel);
      hopper.rotation.x = Math.PI;
      hopper.position.y = 0.95;
      const fillGeo = new THREE.CylinderGeometry(0.64, 0.64, 1, 40);
      fillGeo.translate(0, 0.5, 0);
      const fillMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.85, map: this.texture });
      const fill = new THREE.Mesh(fillGeo, fillMat);
      fill.position.y = 1.42;
      fill.scale.y = 0.01;
      fill.userData = { kind: 'ingredient', id };
      fill.castShadow = true;
      group.add(shell, cap, hopper, fill);
      for (const [lx, lz] of [[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]] as const) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8), steel);
        leg.position.set(lx, 0.7, lz);
        leg.castShadow = true;
        group.add(leg);
      }
      this.scene.add(group);
      this.pickables.push(shell, fill);
      const mouth = new THREE.Vector3(group.position.x, 0.8, group.position.z);
      this.silos.push({ id, group, fill, fillMat, shell, level: 0.01, goal: 0.01, mouth, label: this.label('pl-label pl-label--silo', this.anchorAt(group.position.x, i % 2 ? 7.2 : 6.3, group.position.z), 'mix') });
    });

    // mixer drum on a frame
    this.drum.position.set(x0, 2.1, 3.1);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.1, 2.4, 48), new THREE.MeshStandardMaterial({ color: BRAND, roughness: 0.4, metalness: 0.2 }));
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.07, 8, 48), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    stripe.rotation.y = Math.PI / 2;
    const fins = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const f = new THREE.Mesh(new THREE.TorusGeometry(0.8 + k * 0.13, 0.05, 6, 40, Math.PI * 0.6), new THREE.MeshStandardMaterial({ color: AQUA }));
      f.rotation.set(0, Math.PI / 2, (k * Math.PI * 2) / 3);
      f.position.x = -0.6 + k * 0.6;
      fins.add(f);
    }
    const spinner = new THREE.Group();
    spinner.add(body, stripe, fins);
    spinner.name = 'spinner';
    this.drum.add(spinner);
    this.drum.rotation.y = -0.35;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.2, 1.6), new THREE.MeshStandardMaterial({ color: 0xdfe2ea, roughness: 0.5 }));
    frame.position.set(x0, 0.96, 3.1);
    frame.rotation.y = -0.35;
    frame.castShadow = true;
    this.scene.add(this.drum, frame);
  }

  private buildParticles() {
    const m = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ roughness: 0.6 }), PARTICLES);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < PARTICLES; i++) { this.particleData.push({ silo: 0, t: i / PARTICLES, speed: 0.35 + ((i * 37) % 17) / 40 }); m.setColorAt(i, new THREE.Color(0xffffff)); }
    this.scene.add(m);
    return m;
  }

  private buildBench() {
    const x0 = ZONES.results;
    const bench = new THREE.Mesh(new THREE.BoxGeometry(10, 0.6, 3), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
    bench.position.set(x0, BENCH_Y - 0.3 + 0.36, 0.4);
    bench.castShadow = bench.receiveShadow = true;
    const top = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.08, 3.2), new THREE.MeshStandardMaterial({ color: 0x2a2f3d, roughness: 0.4 }));
    top.position.set(x0, BENCH_Y + 0.36 + 0.04, 0.4);
    top.receiveShadow = true;
    this.scene.add(bench, top);

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(10.6, 3.4), new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }));
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(x0, this.benchTop() + TARGET_H, 0.4);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(10.6, 3.4)), new THREE.LineBasicMaterial({ color: BRAND, transparent: true, opacity: 0.7 }));
    edge.rotation.x = -Math.PI / 2;
    edge.position.copy(plane.position);
    this.scene.add(plane, edge);
    this.targetLabel.anchor.position.set(x0 - 5.6, this.benchTop() + TARGET_H, 0.4);
    this.scene.add(this.targetLabel.anchor);

    const steel = new THREE.MeshStandardMaterial({ color: 0x3a4152, roughness: 0.35, metalness: 0.7 });
    for (const dx of [-0.85, 0.85]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.6, 12), steel);
      post.position.set(dx, 2.8, -0.6);
      post.castShadow = true;
      this.press.add(post);
    }
    const head = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.45, 1.3), new THREE.MeshStandardMaterial({ color: BRAND, roughness: 0.4 }));
    head.position.set(0, 5.6, -0.15);
    head.castShadow = true;
    this.platen = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.14, 32), steel);
    this.platen.castShadow = true;
    const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1, 12), steel);
    ram.name = 'ram';
    this.press.add(head, this.platen, ram);
    this.press.position.set(x0, this.benchTop(), 0.4);
    this.scene.add(this.press);
  }

  private benchTop() { return BENCH_Y + 0.44; }

  /* ---------------- per-state updates ---------------- */
  private updateProduct(s: SceneState) {
    const best = s.rec.best;
    const fs = feedstockById(s.targets.feedstock);
    const col = new THREE.Color(0xb7bbc2).lerp(new THREE.Color(fs.color), Math.min(0.7, best.design.scm * 1.1)).lerp(new THREE.Color(0xc3b29b), best.design.rca * 0.35);
    this.concrete.color.copy(col);
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
    const total = ing.reduce((a, i) => a + i.kg, 0);
    for (const silo of this.silos) {
      const i = ing.find(x => x.id === silo.id)!;
      silo.goal = i.kg <= 0.05 ? 0.01 : 0.12 + 3.8 * Math.pow(i.kg / 1150, 0.6);
      silo.fillMat.color.set(i.color);
      silo.fillMat.map = silo.id === 'water' || silo.id === 'admixture' ? null : this.texture;
      silo.fillMat.transparent = silo.id === 'water' || silo.id === 'admixture';
      silo.fillMat.opacity = silo.fillMat.transparent ? 0.85 : 1;
      silo.fillMat.needsUpdate = true;
      const on = s.ingredient === silo.id;
      silo.fillMat.emissive.set(on ? BRAND : 0x000000);
      silo.fillMat.emissiveIntensity = on ? 0.35 : 0;
      setLabel(silo.label, SILO_NAMES[silo.id] ?? i.name, i.kg < 0.05 ? 'Not used' : `${i.kg < 20 ? i.kg.toFixed(1) : Math.round(i.kg)} kg`, on);
    }
    // share the particle stream between silos in proportion to mass
    const weights = this.silos.map(si => { const kg = ing.find(x => x.id === si.id)!.kg; return kg > 0.05 ? Math.max(kg, 60) : 0; });
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    let acc = 0, k = 0;
    const cum = weights.map(w => (acc += w / sum));
    for (let i = 0; i < PARTICLES; i++) {
      const u = (i + 0.5) / PARTICLES;
      while (k < cum.length - 1 && u > cum[k]!) k++;
      this.particleData[i]!.silo = k;
      this.particles.setColorAt(i, new THREE.Color(ing.find(x => x.id === this.silos[k]!.id)!.color));
    }
    if (this.particles.instanceColor) this.particles.instanceColor.needsUpdate = true;
    setLabel(this.mixLabel, `w/b ${s.rec.best.design.wb.toFixed(2)}`, `${Math.round(total).toLocaleString()} kg/m³`);
  }

  private buildCube(s: SceneState) {
    this.cube.clear();
    this.points.forEach(p => { p.label?.el.remove(); });
    this.labels = this.labels.filter(l => !this.points.some(p => p.label === l) && !this.axisLabels.includes(l));
    this.axisLabels.forEach(l => l.el.remove());
    this.pickables = this.pickables.filter(o => o.userData['kind'] !== 'trial');
    this.points = [];

    const h = CUBE / 2;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE, CUBE, CUBE)), new THREE.LineBasicMaterial({ color: BRAND, transparent: true, opacity: 0.55 }));
    this.cube.add(edges);
    const gridPts: number[] = [];
    for (const v of [-h, 0, h]) for (const w of [-h, 0, h]) {
      gridPts.push(-h, v, w, h, v, w, v, -h, w, v, h, w, v, w, -h, v, w, h);
    }
    const grid = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3)), new THREE.LineBasicMaterial({ color: 0x8f96ad, transparent: true, opacity: 0.18 }));
    this.cube.add(grid);

    const small = new THREE.SphereGeometry(0.17, 20, 14), big = new THREE.SphereGeometry(0.34, 28, 20), haloGeo = new THREE.RingGeometry(0.46, 0.56, 40);
    s.plan.candidates.forEach(c => {
      const sel = c.selected;
      const mat = new THREE.MeshStandardMaterial({ color: passColor(c.prediction.passProbability), roughness: 0.35, transparent: !sel, opacity: sel ? 1 : 0.5 });
      const mesh = new THREE.Mesh(sel ? big : small, mat);
      mesh.position.set(c.level[0] * h, c.level[1] * h, c.level[2] * h);
      mesh.castShadow = sel;
      const selectedIndex = sel ? s.plan.selected.indexOf(c) : -1;
      mesh.userData = sel ? { kind: 'trial', index: selectedIndex } : {};
      this.cube.add(mesh);
      let halo: THREE.Mesh | null = null, label: Label | null = null;
      if (sel) {
        halo = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false }));
        halo.position.copy(mesh.position);
        this.cube.add(halo);
        this.pickables.push(mesh);
        label = this.label('pl-label pl-label--trial', mesh, 'experiments', new THREE.Vector3(0, 0.55, 0));
        label.el.textContent = c.id;
      }
      this.points.push({ mesh, halo, label, selectedIndex });
    });

    const sel = s.plan.selected, o = this.points.find(p => p.selectedIndex === 0)!.mesh.position;
    const linkPts: number[] = [];
    sel.slice(1).forEach((_, i) => { const p = this.points.find(q => q.selectedIndex === i + 1)!.mesh.position; linkPts.push(o.x, o.y, o.z, p.x, p.y, p.z); });
    this.links = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(linkPts, 3)), new THREE.LineDashedMaterial({ color: BRAND, dashSize: 0.18, gapSize: 0.14, transparent: true, opacity: 0.7 }));
    this.links.computeLineDistances();
    this.cube.add(this.links);

    const fs = feedstockById(s.targets.feedstock);
    const wbs = [...new Set(s.plan.candidates.map(c => c.prediction.design.wb))].sort();
    const scms = [...new Set(s.plan.candidates.map(c => c.prediction.design.scm))].sort();
    const rcas = [...new Set(s.plan.candidates.map(c => c.prediction.design.rca))].sort();
    const range = (v: number[], f: (x: number) => string) => (v.length > 1 ? `${f(v[0]!)} – ${f(v[v.length - 1]!)}` : `held at ${f(v[0]!)}`);
    const pctf = (x: number) => `${Math.round(x * 100)}%`;
    const axes: [string, string, THREE.Vector3][] = [
      ['w/b ratio', range(wbs, x => x.toFixed(2)), new THREE.Vector3(0, -h - 0.5, h + 0.4)],
      [fs.name, range(scms, pctf), new THREE.Vector3(-h - 0.6, 0, h + 0.4)],
      ['Recycled aggregate', range(rcas, pctf), new THREE.Vector3(h + 0.6, -h - 0.4, 0)],
    ];
    this.axisLabels = axes.map(([a, b, p]) => {
      const l = this.label('pl-label pl-label--axis', this.anchorIn(this.cube, p), 'experiments');
      setLabel(l, a, b);
      return l;
    });
  }

  private updateCube(s: SceneState) {
    this.points.forEach(p => {
      if (p.selectedIndex < 0) return;
      const on = p.selectedIndex === s.trial;
      (p.mesh.material as THREE.MeshStandardMaterial).emissive.set(on ? BRAND : 0x000000);
      (p.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 0.45 : 0;
      p.label?.el.classList.toggle('is-on', on);
    });
  }

  private updateResults(s: SceneState, rebuild: boolean) {
    const sel = s.plan.selected, x0 = ZONES.results;
    if (rebuild) {
      this.cylinders.forEach(c => { c.mesh.parent?.remove(c.mesh); c.mesh.geometry.dispose(); c.mat.dispose(); c.label.el.remove(); });
      this.labels = this.labels.filter(l => !this.cylinders.some(c => c.label === l));
      this.pickables = this.pickables.filter(o => o.userData['kind'] !== 'cyl');
      this.cylinders = sel.map((_, i) => {
        const g = new THREE.CylinderGeometry(0.3, 0.3, 1, 36);
        g.translate(0, 0.5, 0);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, map: this.texture });
        const mesh = new THREE.Mesh(g, mat);
        mesh.castShadow = true;
        mesh.position.set(x0 - 3.9 + (i * 7.8) / Math.max(1, sel.length - 1), this.benchTop(), 0.4);
        mesh.scale.y = 0.01;
        mesh.userData = { kind: 'cyl', index: i };
        this.scene.add(mesh);
        this.pickables.push(mesh);
        const top = new THREE.Object3D();
        top.position.y = 1;
        mesh.add(top);
        return { mesh, mat, height: 0.01, goal: 0.01, label: this.label('pl-label pl-label--cyl', top, 'results') };
      });
    }
    sel.forEach((tr, i) => {
      const c = this.cylinders[i]!, p = tr.prediction;
      c.goal = Math.max(0.3, Math.min(4.6, (TARGET_H * p.strength) / s.targets.strength));
      c.mat.color.copy(passColor(p.passProbability)).lerp(new THREE.Color(0xffffff), 0.25);
      const on = i === s.trial;
      c.mat.emissive.set(on ? BRAND : 0x000000);
      c.mat.emissiveIntensity = on ? 0.25 : 0;
      setLabel(c.label, tr.id, `${p.strength.toFixed(0)} MPa`, on);
    });
    setLabel(this.targetLabel, 'Target', `${s.targets.strength} MPa`);
  }

  /* ---------------- camera ---------------- */
  private aim(s: SceneState, instant: boolean) {
    const wide = this.host.clientWidth / Math.max(1, this.host.clientHeight);
    const far = wide < 0.9 ? 1.4 : wide < 1.4 ? 1.2 : 1;
    // the floating panel covers the left of the frame on desktop, so look left of centre
    const panel = this.host.clientWidth > 860;
    if (s.overview) {
      const shift = panel ? -7 : 0;
      this.camGoal.pos.set(shift, 46 * far, 74 * far);
      this.camGoal.target.set(shift, 1, 0);
    } else {
      const x = ZONES[s.stage];
      const y = s.stage === 'experiments' ? CUBE_Y - 0.4 : 2.6;
      const zoom = { targets: 1.45, mix: 1.45, experiments: 1.45, results: 1.25 }[s.stage] * far;
      const shift = panel ? -3.4 * zoom * Math.min(1.25, 1.6 / wide) : 0;
      this.camGoal.target.set(x + shift, y, 0.6);
      this.camGoal.pos.set(x + shift + 3.5 * zoom, y + 6 * zoom, 15.5 * zoom);
    }
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
    const s = this.state;
    const t = this.clock.elapsedTime;
    const motion = !this.reduced;
    if (this.camGoal.active) {
      const k = this.reduced ? 1 : 1 - Math.pow(0.02, dt);
      this.camera.position.lerp(this.camGoal.pos, k);
      this.controls.target.lerp(this.camGoal.target, k);
      if (this.camera.position.distanceTo(this.camGoal.pos) < 0.02) this.camGoal.active = false;
    }
    this.controls.update();

    const settle = (cur: number, goal: number) => (this.reduced || dt === 0 ? goal : cur + (goal - cur) * (1 - Math.pow(0.004, dt)));
    if (motion) this.product.rotation.y += dt * 0.25;
    for (const silo of this.silos) { silo.level = settle(silo.level, silo.goal); silo.fill.scale.y = silo.level; }
    const spinner = this.drum.getObjectByName('spinner');
    if (spinner && motion) spinner.rotation.x += dt * 1.6;

    // particles: silo mouth -> arc -> drum mouth
    const m = new THREE.Matrix4(), q = new THREE.Vector3(), mouth = new THREE.Vector3(ZONES.mix - 1.05, 2.2, 2.7);
    for (let i = 0; i < PARTICLES; i++) {
      const d = this.particleData[i]!;
      if (motion) d.t = (d.t + dt * d.speed * 0.45) % 1;
      const a = this.silos[d.silo]!.mouth, u = d.t;
      const ctrl = new THREE.Vector3((a.x + mouth.x) / 2, 3.6, (a.z + mouth.z) / 2);
      q.set(0, 0, 0).addScaledVector(a, (1 - u) * (1 - u)).addScaledVector(ctrl, 2 * u * (1 - u)).addScaledVector(mouth, u * u);
      const sc = Math.sin(Math.PI * u) * 0.9 + 0.2;
      m.makeScale(sc, sc, sc).setPosition(q);
      this.particles.setMatrixAt(i, m);
    }
    this.particles.instanceMatrix.needsUpdate = true;

    // flow chevrons along the walkway
    for (let i = 0; i < 36; i++) {
      const u = ((i / 36) + (motion ? t * 0.03 : 0)) % 1, x = -27 + u * 54;
      const near = Math.min(...ZONE_ORDER.map(z => Math.abs(x - ZONES[z])));
      const sc = near < 7.6 ? 0 : Math.min(1, (near - 7.6) / 1.2);
      m.makeScale(sc, sc, sc).setPosition(x, 0.3, 0);
      this.flow.setMatrixAt(i, m);
    }
    this.flow.instanceMatrix.needsUpdate = true;

    if (motion && !(s?.stage === 'experiments' && !s.overview && this.dragging())) this.cube.rotation.y += dt * 0.18;
    for (const p of this.points) {
      if (!p.halo) continue;
      p.halo.quaternion.copy(this.cube.quaternion).invert().multiply(this.camera.quaternion);
      const on = s && p.selectedIndex === s.trial;
      (p.halo.material as THREE.MeshBasicMaterial).opacity = on ? 0.55 + 0.35 * Math.sin(t * 4) : 0.18;
      p.halo.scale.setScalar(on ? 1.15 + 0.12 * Math.sin(t * 4) : 1);
    }

    this.cylinders.forEach(c => { c.height = settle(c.height, c.goal); c.mesh.scale.y = c.height; });
    if (s && this.cylinders[s.trial]) {
      const c = this.cylinders[s.trial]!;
      this.press.position.x = settle(this.press.position.x, c.mesh.position.x);
      const topY = c.height + 0.07 + (motion ? 0.12 + 0.12 * Math.sin(t * 2.2) : 0.1);
      this.platen.position.set(0, topY, 0);
      const ram = this.press.getObjectByName('ram') as THREE.Mesh;
      const len = 5.4 - topY;
      ram.scale.y = Math.max(0.01, len);
      ram.position.set(0, topY + len / 2, 0);
    }

    this.renderer.render(this.scene, this.camera);
    this.placeLabels(s);
  }

  private dragging() { return !this.camGoal.active && this.downAt !== null; }

  private placeLabels(s: SceneState | null) {
    const w = this.host.clientWidth, h = this.host.clientHeight, v = new THREE.Vector3();
    for (const l of this.labels) {
      const show = !!s && (s.overview ? false : l.zone === s.stage);
      if (show) {
        l.anchor.getWorldPosition(v);
        v.project(this.camera);
        const inside = v.z < 1 && Math.abs(v.x) < 1.15 && Math.abs(v.y) < 1.15;
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
    if (u['kind'] === 'trial' || u['kind'] === 'cyl') this.events.onTrial(u['index'] as number);
    else if (u['kind'] === 'ingredient') this.events.onIngredient(u['id'] as IngredientId);
    else if (u['kind'] === 'zone' && this.state && (u['id'] !== this.state.stage || this.state.overview)) this.events.onStage(u['id'] as StageId);
  };
  private onMove = (e: PointerEvent) => {
    if (this.downAt) return;
    const hit = this.pick(e);
    const k = hit?.userData['kind'];
    this.renderer.domElement.style.cursor = k === 'trial' || k === 'cyl' || k === 'ingredient' || (k === 'zone' && (hit!.userData['id'] !== this.state?.stage || this.state?.overview)) ? 'pointer' : 'grab';
  };
  private pick(e: PointerEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, false);
    const specific = hits.find(h => h.object.userData['kind'] !== 'zone');
    return (specific ?? hits[0])?.object ?? null;
  }

  /* ---------------- helpers ---------------- */
  private label(className: string, anchor: THREE.Object3D, zone: StageId | null, offset?: THREE.Vector3) {
    let a = anchor;
    if (offset) { a = new THREE.Object3D(); a.position.copy(offset); anchor.add(a); }
    const el = document.createElement('div');
    el.className = className;
    el.setAttribute('aria-hidden', 'true');
    this.labelHost.appendChild(el);
    const l: Label = { el, anchor: a, zone, visible: false };
    this.labels.push(l);
    return l;
  }
  private anchorAt(x: number, y: number, z: number) { const o = new THREE.Object3D(); o.position.set(x, y, z); this.scene.add(o); return o; }
  private anchorIn(parent: THREE.Object3D, p: THREE.Vector3) { const o = new THREE.Object3D(); o.position.copy(p); parent.add(o); return o; }
}

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
    // wall panel with a window opening, standing on two lifting blocks
    const W = 5.6, H = 3.8, T = 0.38, ow = 1.7, oh = 1.3, oy = 2.3;
    box((W - ow) / 2, H, T, -(W + ow) / 4, H / 2 + 0.3, 0);
    box((W - ow) / 2, H, T, (W + ow) / 4, H / 2 + 0.3, 0);
    box(ow, oy - oh / 2, T, 0, (oy - oh / 2) / 2 + 0.3, 0);
    box(ow, H - oy - oh / 2, T, 0, 0.3 + H - (H - oy - oh / 2) / 2, 0);
    box(0.7, 0.3, 1.2, -1.8, 0.15, 0);
    box(0.7, 0.3, 1.2, 1.8, 0.15, 0);
  } else if (id === 'masonry') {
    // hollow two-core blocks in running bond
    const L = 1.6, Hh = 0.8, D = 0.8, t = 0.14;
    const block = (x: number, y: number) => {
      box(L, Hh, t, x, y, D / 2 - t / 2);
      box(L, Hh, t, x, y, -D / 2 + t / 2);
      for (const ex of [-L / 2 + t / 2, 0, L / 2 - t / 2]) box(t, Hh, D - 2 * t, x + ex, y, 0);
    };
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      const off = r % 2 ? L / 2 : 0;
      if (r % 2 && c === 2) continue;
      block(-L + c * (L + 0.04) + off, Hh / 2 + r * (Hh + 0.04));
    }
  } else if (id === 'paver') {
    // herringbone-style field of pavers with one lifted out
    const n = 6, s = 0.82;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const lifted = i === 3 && j === 2;
      const m = box(s - 0.06, 0.32, (s - 0.06) / (j % 2 ? 2.05 : 1), (i - (n - 1) / 2) * s, lifted ? 1.6 : 0.16, (j - (n - 1) / 2) * s * 0.75);
      if (lifted) m.rotation.set(0.5, 0.4, 0.2);
    }
  } else {
    // footing, column and a slab corner
    box(3, 0.6, 3, 0, 0.3, 0);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 3.6, 40), mat);
    col.position.y = 2.4;
    col.castShadow = true;
    g.add(col);
    box(4.6, 0.36, 3.6, 0, 4.38, 0);
  }
  return g;
}

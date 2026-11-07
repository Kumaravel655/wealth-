// The tour's model: five rooms built from boxes, an illustration rather than a survey of a real office.
// Geometry comes from route.js so the walls the camera avoids are the walls on screen. Everything is
// static, so sunlight is baked into one shadow-map pass and a frame is drawn only when the camera moves.
import {
  BoxGeometry, CanvasTexture, CatmullRomCurve3, CircleGeometry, Color, CylinderGeometry,
  DirectionalLight, Group, HemisphereLight, IcosahedronGeometry, InstancedMesh, MathUtils, Matrix4, Mesh,
  MeshBasicMaterial, MeshLambertMaterial, NeutralToneMapping, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, RepeatWrapping,
  Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three';
import { DOOR, EYE, FURNITURE, H, KEYS, OUTER, PARTITIONS, WALL } from './route.js';
import { AGM_DEFAULT, decorate, fmtDate, localISO, statusText, withAgm } from '../calendar/data.js';

const INK = '#102A56';
const lambert = (color, extra) => new MeshLambertMaterial({ color, ...extra });
const M = {
  wall: lambert('#F4F6FA'),
  ceiling: new MeshBasicMaterial({ color: '#E4E9F1' }),
  navy: lambert('#2A4A82'),
  trim: lambert(INK),
  teak: lambert('#8A5A36'),
  desk: lambert('#B98A5E'),
  fabric: lambert('#3A5F99'),
  metal: lambert('#7F8FA8'),
  dark: lambert('#1C2740'),
  paper: lambert('#FBFBF7'),
  card: lambert('#E8D9BE'),
  pot: lambert('#DCE5F2'),
  leaf: lambert('#3F7D5C', { flatShading: true }),
};

const canvasTexture = (w, h, draw) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

function plankTexture() {
  // A stable sequence, so every visitor (and every poster) sees the same floor.
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const t = canvasTexture(1024, 1024, (g, w, h) => {
    const rows = 14, ph = h / rows;
    for (let r = 0; r < rows; r += 1) {
      let x = -rnd() * 200;
      while (x < w) {
        const len = 260 + rnd() * 260, l = 43 + rnd() * 5;
        g.fillStyle = `hsl(${24 + rnd() * 5} 38% ${l}%)`;
        g.fillRect(x, r * ph, len, ph);
        g.fillStyle = 'rgb(30 16 8 / .5)';
        g.fillRect(x, r * ph, 2, ph);
        x += len;
      }
      g.fillStyle = 'rgb(30 16 8 / .5)';
      g.fillRect(0, r * ph, w, 2);
    }
  });
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(3.2, 10);
  return t;
}

const signTexture = (n, name) => canvasTexture(800, 150, (g, w, h) => {
  g.fillStyle = INK; g.fillRect(0, 0, w, h);
  g.fillStyle = '#7CB2FF'; g.font = '800 58px Manrope, Arial'; g.textBaseline = 'middle';
  g.fillText(n, 40, h / 2 + 3);
  g.fillStyle = '#F5F8FF'; g.font = '700 58px Manrope, Arial';
  g.fillText(name, 150, h / 2 + 3);
});

const plaqueTexture = (text) => canvasTexture(420, 96, (g, w, h) => {
  g.fillStyle = '#F5F8FF'; g.fillRect(0, 0, w, h);
  g.fillStyle = INK; g.font = '800 46px Manrope, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 3);
});

const skyTexture = () => canvasTexture(16, 256, (g, w, h) => {
  const s = g.createLinearGradient(0, 0, 0, h);
  s.addColorStop(0, '#CFE3FF'); s.addColorStop(0.7, '#F4F9FF'); s.addColorStop(1, '#FFF4E4');
  g.fillStyle = s; g.fillRect(0, 0, w, h);
});

// Paired columns with a tick on each row: the shape of a reconciliation, with no client figures.
const reconTexture = (title) => canvasTexture(640, 400, (g, w, h) => {
  g.fillStyle = '#0E1D3D'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#F5F8FF'; g.font = '700 30px Manrope, Arial'; g.fillText(title, 32, 52);
  for (let r = 0; r < 7; r += 1) {
    const y = 88 + r * 42;
    g.fillStyle = r % 2 ? '#2A4A85' : '#35598F'; g.fillRect(32, y, 230, 22); g.fillRect(286, y, 230, 22);
    g.strokeStyle = '#34D399'; g.lineWidth = 5; g.beginPath();
    g.moveTo(544, y + 11); g.lineTo(556, y + 21); g.lineTo(580, y); g.stroke();
  }
});

const videoTexture = () => canvasTexture(800, 450, (g, w, h) => {
  g.fillStyle = '#0E1D3D'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#F5F8FF'; g.font = '700 38px Manrope, Arial'; g.fillText('Video hearing', 40, 70);
  g.fillStyle = '#C3D2EC'; g.font = '500 26px Manrope, Arial'; g.fillText('Where the law allows', 40, 112);
  [40, 416].forEach((x) => {
    g.fillStyle = '#1B3B78'; g.fillRect(x, 150, 344, 256);
    g.fillStyle = '#35598F';
    g.beginPath(); g.arc(x + 172, 250, 46, 0, 7); g.fill();
    g.beginPath(); g.ellipse(x + 172, 370, 86, 66, 0, Math.PI, 0); g.fill();
  });
});

// The one live object in the model: the real next due dates from the compliance calendar.
function boardTexture() {
  const today = localISO();
  const rows = decorate(withAgm(AGM_DEFAULT), today)
    .filter((r) => r.left >= 0)
    .sort((a, b) => a.d.localeCompare(b.d))
    .slice(0, 5);
  return canvasTexture(1536, 652, (g, w, h) => {
    g.fillStyle = '#0B1F42'; g.fillRect(0, 0, w, h);
    g.textBaseline = 'middle';
    g.fillStyle = '#F5F8FF'; g.font = '800 54px Manrope, Arial'; g.fillText('Next due dates', 56, 66);
    g.fillStyle = '#C3D2EC'; g.font = '500 30px Manrope, Arial'; g.textAlign = 'right';
    g.fillText(fmtDate(today, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), w - 56, 68);
    g.textAlign = 'left';
    rows.forEach((r, i) => {
      const y = 170 + i * 100;
      g.fillStyle = 'rgb(255 255 255 / .1)'; g.fillRect(56, y + 46, w - 112, 2);
      g.fillStyle = r.left <= 3 ? '#FDA29B' : '#7CB2FF'; g.font = '800 40px Manrope, Arial';
      g.fillText(fmtDate(r.d, { day: 'numeric', month: 'short' }), 56, y);
      g.fillStyle = '#F5F8FF'; g.font = '600 38px Manrope, Arial';
      g.fillText(r.n.length > 42 ? `${r.n.slice(0, 41)}…` : r.n, 260, y);
      g.fillStyle = '#C3D2EC'; g.font = '500 32px Manrope, Arial'; g.textAlign = 'right';
      g.fillText(statusText(r.left), w - 56, y);
      g.textAlign = 'left';
    });
  });
}

function build(scene, labels) {
  const box = (w, h, d, x, y, z, mat, parent = scene, shade = true) => {
    const m = new Mesh(new BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = shade; m.receiveShadow = shade;
    parent.add(m);
    return m;
  };
  const plane = (w, h, x, y, z, ry, map, basic = true) => {
    const m = new Mesh(new PlaneGeometry(w, h), basic ? new MeshBasicMaterial({ map, toneMapped: false }) : lambert('#fff', { map }));
    m.position.set(x, y, z); m.rotation.y = ry;
    scene.add(m);
    return m;
  };

  // Floor, ceiling, right and end walls, back wall.
  const length = OUTER.back - OUTER.end, midZ = (OUTER.back + OUTER.end) / 2;
  const floor = new Mesh(new PlaneGeometry(OUTER.x * 2, length), lambert('#fff', { map: plankTexture() }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, midZ); floor.receiveShadow = true;
  scene.add(floor);
  box(OUTER.x * 2, 0.1, length, 0, H, midZ, M.ceiling, scene, false);
  box(WALL, H, length, OUTER.x + WALL / 2, 0, midZ, M.wall);
  box(0.03, 1, length, OUTER.x - 0.015, 0, midZ, M.navy);
  box(OUTER.x * 2, H, WALL, 0, 0, OUTER.back + WALL / 2, M.wall);
  box(OUTER.x * 2, H, WALL, 0, 0, OUTER.end - WALL / 2, M.wall);
  box(0.03, 0.1, length, -OUTER.x + 0.015, 0, midZ, M.trim, scene, false);
  [0, -5.75, -11.25, -16.75, -22.25].forEach((z) => [-1.2, 1.2].forEach((x) => box(2, 0.02, 0.5, x, H - 0.02, z, new MeshBasicMaterial({ color: '#FFFFFF' }), scene, false)));

  // Left wall, cut for windows so the sun falls on the floor in their shape. The hearing room has none: its wall holds the screen.
  const WIN = 2.6, SILL = 0.9, HEAD = 2.5, WALL_X = -OUTER.x - WALL / 2;
  const sky = skyTexture();
  let z = OUTER.back;
  const pier = (from, to) => box(WALL, H, from - to, WALL_X, 0, (from + to) / 2, M.wall);
  [0, -5.75, -11.25, -22.25].forEach((c) => {
    pier(z, c + WIN / 2);
    box(WALL, SILL, WIN, WALL_X, 0, c, M.wall);
    box(WALL, H - HEAD, WIN, WALL_X, HEAD, c, M.wall);
    plane(WIN, HEAD - SILL, WALL_X - 0.05, (SILL + HEAD) / 2, c, Math.PI / 2, sky);
    [-WIN / 6, WIN / 6].forEach((o) => box(0.05, HEAD - SILL, 0.05, WALL_X, SILL, c + o, M.trim));
    box(0.05, 0.05, WIN, WALL_X, 1.75, c, M.trim);
    z = c - WIN / 2;
  });
  pier(z, OUTER.end);

  // Partitions: wall either side of the door, a lintel, a navy frame and a sign naming the next room.
  PARTITIONS.forEach((p, i) => {
    const left = p.x - DOOR.w / 2 + OUTER.x, right = OUTER.x - p.x - DOOR.w / 2;
    box(left, H, WALL, -OUTER.x + left / 2, 0, p.z, M.wall);
    box(right, H, WALL, OUTER.x - right / 2, 0, p.z, M.wall);
    box(DOOR.w, H - DOOR.h, WALL, p.x, DOOR.h, p.z, M.wall);
    box(left, 1, 0.03, -OUTER.x + left / 2, 0, p.z + WALL / 2 + 0.015, M.navy);
    box(right, 1, 0.03, OUTER.x - right / 2, 0, p.z + WALL / 2 + 0.015, M.navy);
    [-1, 1].forEach((s) => box(0.06, DOOR.h, WALL + 0.06, p.x + s * (DOOR.w / 2 + 0.03), 0, p.z, M.trim));
    box(DOOR.w + 0.12, 0.06, WALL + 0.06, p.x, DOOR.h, p.z, M.trim);
    plane(1.6, 0.3, p.x, 2.62, p.z + WALL / 2 + 0.01, 0, signTexture(`0${i + 2}`, labels[i + 1]));
  });

  const contactShadow = (() => {
    const map = canvasTexture(128, 128, (g, w) => {
      const s = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      s.addColorStop(0, 'rgb(10 14 30 / .55)'); s.addColorStop(1, 'rgb(10 14 30 / 0)');
      g.fillStyle = s; g.fillRect(0, 0, w, w);
    });
    const mat = new MeshBasicMaterial({ map, transparent: true, depthWrite: false });
    return (x, cz, w, d) => {
      const m = new Mesh(new PlaneGeometry(w, d), mat);
      m.rotation.x = -Math.PI / 2; m.position.set(x, 0.014, cz);
      scene.add(m);
    };
  })();

  const chair = (x, cz, ry) => {
    const g = new Group();
    box(0.46, 0.08, 0.46, 0, 0.44, 0, M.fabric, g);
    box(0.46, 0.52, 0.06, 0, 0.52, -0.2, M.fabric, g);
    const leg = new Mesh(new CylinderGeometry(0.03, 0.03, 0.42, 8), M.metal);
    leg.position.y = 0.23; g.add(leg);
    const foot = new Mesh(new CylinderGeometry(0.2, 0.22, 0.03, 20), M.metal);
    foot.position.y = 0.02; g.add(foot);
    g.position.set(x, 0, cz); g.rotation.y = ry;
    scene.add(g);
    contactShadow(x, cz, 0.9, 0.9);
  };
  const table = (w, d, x, cz, h = 0.74) => {
    box(w, 0.05, d, x, h - 0.05, cz, M.desk);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(0.06, h - 0.05, 0.06, x + a * (w / 2 - 0.08), 0, cz + b * (d / 2 - 0.08), M.dark));
    contactShadow(x, cz, w + 0.8, d + 0.8);
  };
  const papers = (x, y, cz, count, ry = 0, mat = M.paper) => {
    const s = box(0.3, 0.004 * count + 0.01, 0.42, x, y, cz, mat);
    s.rotation.y = ry;
  };
  const folder = (x, y, cz, ry, mat) => { const f = box(0.34, 0.03, 0.46, x, y, cz, mat); f.rotation.y = ry; };
  const laptop = (x, y, cz, ry) => {
    const g = new Group();
    box(0.34, 0.015, 0.24, 0, 0, 0, M.metal, g);
    const lid = box(0.34, 0.012, 0.24, 0, 0, 0, M.dark, g);
    lid.position.set(0, 0.11, -0.16); lid.rotation.x = 1.25;
    g.position.set(x, y, cz); g.rotation.y = ry;
    scene.add(g);
  };
  const monitor = (x, y, cz, map) => {
    box(0.06, 0.42, 0.72, x + 0.04, y + 0.14, cz, M.dark);
    box(0.05, 0.14, 0.05, x + 0.05, y, cz, M.dark);
    box(0.2, 0.012, 0.28, x + 0.05, y, cz, M.dark);
    plane(0.68, 0.39, x, y + 0.35, cz, -Math.PI / 2, map);
  };

  // 01 Consultation room: a round table with the engagement letter out, and two client chairs.
  const rug = new Mesh(new CircleGeometry(1.7, 40), M.navy);
  rug.rotation.x = -Math.PI / 2; rug.position.set(-2.4, 0.01, -1.2); rug.receiveShadow = true;
  scene.add(rug);
  const top = new Mesh(new CylinderGeometry(0.8, 0.8, 0.05, 40), M.desk);
  top.position.set(-2.4, 0.72, -1.2); top.castShadow = true; scene.add(top);
  const stem = new Mesh(new CylinderGeometry(0.06, 0.06, 0.7, 12), M.dark);
  stem.position.set(-2.4, 0.35, -1.2); stem.castShadow = true; scene.add(stem);
  chair(-1.55, -0.65, -2.2);
  chair(-1.7, -1.95, -0.7);
  chair(-3.2, -0.45, 2.5);
  papers(-2.45, 0.745, -1.1, 3, 0.25);
  folder(-2.75, 0.745, -1.45, -0.3, M.navy);
  box(0.42, 0.8, 2.6, 4.2, 0, 0.5, M.desk);
  folder(4.2, 0.8, 0.5, 0, M.navy); folder(4.2, 0.83, 0.5, 0.1, M.card);
  const pot = new Mesh(new CylinderGeometry(0.24, 0.18, 0.46, 16), M.pot);
  pot.position.set(3.9, 0.23, -2.2); pot.castShadow = true; scene.add(pot);
  [[0, 0.8, 0, 0.42], [0.16, 1.15, 0.08, 0.3], [-0.14, 1.2, -0.08, 0.28]].forEach(([dx, y, dz, r]) => {
    const l = new Mesh(new IcosahedronGeometry(r, 1), M.leaf);
    l.position.set(3.9 + dx, y, -2.2 + dz); l.castShadow = true; scene.add(l);
  });

  // 02 Records room: three bays of labelled files and a sorting table.
  const ZS = -3.4, BAY = 1.55, BAYS = 3, SHELF_Y = [0.1, 0.56, 1.02, 1.48, 1.94];
  for (let b = 0; b <= BAYS; b += 1) box(0.72, 2.46, 0.05, 4.06, 0, ZS - b * BAY, M.teak);
  SHELF_Y.concat(2.42).forEach((y) => box(0.72, 0.03, BAYS * BAY, 4.06, y, ZS - (BAYS * BAY) / 2, M.teak));
  ['GST', 'TDS & TCS', 'Income tax'].forEach((t, i) => plane(0.84, 0.2, 3.69, 2.32, ZS - (i + 0.5) * BAY, -Math.PI / 2, plaqueTexture(t)));

  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const slots = [];
  for (let b = 0; b < BAYS; b += 1) {
    SHELF_Y.forEach((y) => {
      let fz = ZS - b * BAY - 0.08;
      const stop = fz - BAY + 0.16 - rnd() * 0.3;
      while (fz > stop) { slots.push([y + 0.03, fz]); fz -= 0.078; }
    });
  }
  const FILES = ['#1B3B78', '#27508F', '#175CD3', '#102A56', '#E8D9BE', '#3B82F6'].map((c) => new Color(c));
  const spines = new InstancedMesh(new BoxGeometry(0.5, 0.36, 0.07), lambert('#fff'), slots.length);
  const tags = new InstancedMesh(new BoxGeometry(0.004, 0.09, 0.05), new MeshBasicMaterial({ color: '#F5F8FF' }), slots.length);
  const at = new Matrix4();
  slots.forEach(([y, fz], i) => {
    spines.setMatrixAt(i, at.makeTranslation(4.0, y + 0.18, fz));
    spines.setColorAt(i, FILES[Math.floor(rnd() * FILES.length)]);
    tags.setMatrixAt(i, at.makeTranslation(3.748, y + 0.24, fz));
  });
  spines.frustumCulled = false; tags.frustumCulled = false;
  scene.add(spines, tags);
  table(1.5, 1.9, -3.25, -5.3);
  [[-3.5, -5.7, 8], [-3.05, -5.25, 12], [-3.45, -4.85, 5]].forEach(([x, cz, n]) => papers(x, 0.74, cz, n, rnd() - 0.5));
  folder(-2.95, 0.74, -5.8, 0.2, M.card);

  // 03 Review desk: paired screens and the papers they are checked against.
  table(1.9, 3.1, 3.45, -11);
  monitor(3.5, 0.74, -10.35, reconTexture('Purchases vs GSTR-2B'));
  monitor(3.5, 0.74, -11.65, reconTexture('Form 26AS vs books'));
  papers(2.85, 0.74, -10.35, 4, 0.1); papers(2.85, 0.74, -11.65, 7, -0.12); folder(2.9, 0.74, -11, 0, M.navy);
  chair(2.0, -10.3, Math.PI / 2 + 3.14); chair(2.0, -11.8, Math.PI / 2 + 3.14);
  box(0.4, 0.8, 2.4, -4.2, 0, -10.8, M.desk);

  // 04 Hearing room: the file on the table, the reply under review, the screen for a video hearing.
  table(1.2, 2.4, -3.2, -16.3);
  chair(-2, -15.7, -Math.PI / 2); chair(-2, -16.9, -Math.PI / 2);
  laptop(-3.05, 0.74, -16.75, Math.PI / 2);
  papers(-3.2, 0.74, -15.8, 9, 0.08); folder(-3.3, 0.74, -16.25, 1.5, M.navy);
  box(0.05, 1.3, 2.3, -OUTER.x + 0.04, 1.05, -16.3, M.dark);
  plane(2.2, 1.24, -OUTER.x + 0.075, 1.7, -16.3, Math.PI / 2, videoTexture());
  plane(0.42, 0.1, -3.05, 0.86, -16.3, Math.PI / 2, plaqueTexture('Principal review'), false);

  // 05 Due-date wall: a low console and the board, with today's real dates.
  const [cx1, , cx2] = FURNITURE.at(-1);
  box(cx2 - cx1, 0.8, 0.5, (cx1 + cx2) / 2, 0, -24.6, M.desk);
  papers(-1.2, 0.8, -24.6, 5, 0.15); folder(1.2, 0.8, -24.6, 0.1, M.navy);
  box(4.14, 1.84, 0.06, 0, 0.98, OUTER.end + 0.03, M.trim);
  plane(4, 1.7, 0, 1.9, OUTER.end + 0.07, 0, boardTexture());
}

export async function createTour(canvas, labels) {
  await Promise.all(['800 58px Manrope', '500 30px Manrope'].map((f) => document.fonts.load(f))).catch(() => {});

  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const scene = new Scene();
  scene.background = new Color('#0B1F42');
  scene.add(new HemisphereLight('#F7F9FF', '#E6DBCE', 3));
  const sun = new DirectionalLight('#FFF1DC', 1.5);
  sun.position.set(-16, 13, -6);
  sun.target.position.set(0, 0, -11);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 16, bottom: -16, near: 1, far: 50 });
  scene.add(sun, sun.target);
  build(scene, labels);

  const camera = new PerspectiveCamera(50, 1.5, 0.08, 45);
  const pos = new CatmullRomCurve3(KEYS.map((k) => new Vector3(k.p[0], EYE, k.p[1])), false, 'centripetal');
  const look = new CatmullRomCurve3(KEYS.map((k) => new Vector3(...k.l)), false, 'centripetal');
  const last = KEYS.length - 1, target = new Vector3();
  let aspect = 1.5;

  return {
    // The only place the camera is written. u is the route coordinate, a key index; the offsets are a small look-around.
    pose(u, yaw = 0, pitch = 0) {
      const t = MathUtils.clamp(u / last, 0, 1);
      pos.getPoint(t, camera.position);
      camera.lookAt(look.getPoint(t, target));
      camera.rotateY(yaw); camera.rotateX(pitch);
      const i = Math.min(Math.floor(u), last - 1);
      const fov = MathUtils.lerp(KEYS[i].f, KEYS[i + 1].f, u - i);
      // Narrow stages keep the room's width in frame rather than cropping it to a slot.
      const wide = 2 * Math.atan(Math.tan(MathUtils.degToRad(fov / 2)) * Math.max(1, 1.5 / aspect));
      camera.fov = Math.min(MathUtils.radToDeg(wide), 76);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    },
    resize(w, h) {
      renderer.setSize(w, h, false);
      aspect = w / h;
    },
    render() { renderer.render(scene, camera); },
  };
}

import * as THREE from "../node_modules/three/build/three.module.js";

const TRACKS = [
  {
    id: "coastal",
    name: "Coastal Rush",
    subtitle: "Cliff roads, fast sweepers, and a long beachside finish.",
    meta: ["4.2 km", "Fast", "Wide"],
    roadWidth: 28,
    aiPace: 43,
    playerMax: 57,
    palette: {
      sky: 0x9ed8e6,
      fog: 0xaed9dc,
      ground: 0x2f7047,
      shoulder: 0xd7b36c,
      road: 0x23292b,
      line: 0xf5d463,
      rail: 0xee5d3a,
      accent: 0x38d4c4,
    },
    art:
      "radial-gradient(circle at 25% 15%, rgba(255,239,174,.8), rgba(255,239,174,0) 32%), linear-gradient(135deg, #227e70 0%, #2869a5 46%, #d98f55 100%)",
    points: [
      [0, 0, 0],
      [34, 2, 130],
      [-74, 7, 282],
      [-28, 11, 430],
      [118, 8, 590],
      [186, 5, 760],
      [58, 7, 914],
      [-86, 4, 1066],
      [-18, 2, 1222],
      [116, 0, 1360],
    ],
    scenery: "coastal",
  },
  {
    id: "metro",
    name: "Neon Terminal",
    subtitle: "A late-night sprint through switchbacks and city lights.",
    meta: ["3.8 km", "Technical", "Tight"],
    roadWidth: 23,
    aiPace: 39,
    playerMax: 54,
    palette: {
      sky: 0x1f3340,
      fog: 0x1d2a31,
      ground: 0x202425,
      shoulder: 0x394044,
      road: 0x171b1d,
      line: 0x38d4c4,
      rail: 0xf16a38,
      accent: 0xec2e55,
    },
    art:
      "radial-gradient(circle at 80% 15%, rgba(236,46,85,.8), rgba(236,46,85,0) 30%), radial-gradient(circle at 18% 70%, rgba(56,212,196,.7), rgba(56,212,196,0) 34%), linear-gradient(135deg, #11191d 0%, #394044 55%, #8e3636 100%)",
    points: [
      [0, 0, 0],
      [-58, 1, 96],
      [68, 1, 210],
      [148, 2, 330],
      [18, 2, 452],
      [-132, 2, 568],
      [-84, 1, 712],
      [92, 2, 836],
      [140, 0, 1002],
      [18, 0, 1146],
      [-96, 0, 1288],
    ],
    scenery: "metro",
  },
  {
    id: "alpine",
    name: "Alpine Breaker",
    subtitle: "Mountain grades, narrow bridges, and downhill speed.",
    meta: ["4.6 km", "Climb", "Sharp"],
    roadWidth: 24,
    aiPace: 40,
    playerMax: 55,
    palette: {
      sky: 0xc8e4ef,
      fog: 0xb8cdd5,
      ground: 0x48613d,
      shoulder: 0x8d8a73,
      road: 0x252a2c,
      line: 0xfff3bb,
      rail: 0x65a67c,
      accent: 0xf7cf43,
    },
    art:
      "radial-gradient(circle at 40% 12%, rgba(255,255,255,.85), rgba(255,255,255,0) 26%), linear-gradient(135deg, #4b7041 0%, #81977d 45%, #4d5454 100%)",
    points: [
      [0, 0, 0],
      [46, 10, 118],
      [-54, 24, 260],
      [-142, 42, 404],
      [-22, 58, 540],
      [120, 74, 680],
      [72, 70, 828],
      [-108, 54, 962],
      [-44, 34, 1110],
      [90, 16, 1270],
      [30, 2, 1438],
    ],
    scenery: "alpine",
  },
];

const RIVAL_NAMES = ["Vega", "Orion", "Rook", "Nova", "Kestrel"];
const RIVAL_COLORS = [0xec2e55, 0x38d4c4, 0xf7cf43, 0x65a67c, 0xf16a38];
const LANES = [-8, 8, -3.6, 3.6, 0];
const GROUND_Y = -0.18;
const CAR_RIDE_HEIGHT = 0.55;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const smoothstep = (edge0, edge1, value) => ease(clamp((value - edge0) / (edge1 - edge0), 0, 1));

const canvas = document.querySelector("#gameCanvas");
const miniMap = document.querySelector("#miniMap");
const mapCtx = miniMap.getContext("2d");
const trackOverlay = document.querySelector("#trackOverlay");
const trackCards = document.querySelector("#trackCards");
const countdownEl = document.querySelector("#countdown");
const resultPanel = document.querySelector("#resultPanel");
const resultTitle = document.querySelector("#resultTitle");
const resultStats = document.querySelector("#resultStats");
const restartButton = document.querySelector("#restartButton");
const changeTrackButton = document.querySelector("#changeTrackButton");
const menuButton = document.querySelector("#menuButton");
const readouts = {
  trackName: document.querySelector("#trackName"),
  position: document.querySelector("#positionReadout"),
  speed: document.querySelector("#speedReadout"),
  time: document.querySelector("#timeReadout"),
  progress: document.querySelector("#progressReadout"),
  progressMeter: document.querySelector("#progressMeter"),
  nitro: document.querySelector("#nitroReadout"),
  nitroMeter: document.querySelector("#nitroMeter"),
  leaderboard: document.querySelector("#leaderboard"),
};

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(64, window.innerWidth / window.innerHeight, 0.1, 2600);
const clock = new THREE.Clock();

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x353b2f, 2.3);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xfff1c7, 3.1);
sun.position.set(-180, 260, 120);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 700;
sun.shadow.camera.left = -280;
sun.shadow.camera.right = 280;
sun.shadow.camera.top = 280;
sun.shadow.camera.bottom = -280;
scene.add(sun);

let trackGroup = new THREE.Group();
let actorGroup = new THREE.Group();
scene.add(trackGroup, actorGroup);

const player = {
  name: "YOU",
  mesh: createCar(0xf5d463, 0x11161a, true),
  position: new THREE.Vector3(),
  heading: 0,
  speed: 0,
  progress: 0,
  nitro: 1,
  offroad: false,
  finished: false,
  finishTime: null,
  steer: 0,
  roadY: 0,
};
scene.add(player.mesh);

const state = {
  mode: "menu",
  selectedTrack: TRACKS[0],
  runtime: null,
  rivals: [],
  elapsed: 0,
  countdown: 0,
  goFlash: 0,
  previewDistance: 0,
  cameraShake: 0,
  lastHudText: "",
};

const keys = new Set();
const touch = {
  left: false,
  right: false,
  gas: false,
  brake: false,
  boost: false,
};

init();

function init() {
  buildTrackCards();
  loadTrack(TRACKS[0].id);
  bindInput();
  window.addEventListener("resize", onResize);
  requestAnimationFrame(tick);
}

function buildTrackCards() {
  trackCards.innerHTML = "";

  for (const track of TRACKS) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "track-card";
    card.style.setProperty("--track-art", track.art);
    card.setAttribute("aria-label", `Start ${track.name}`);

    const title = document.createElement("h2");
    title.textContent = track.name;

    const copy = document.createElement("p");
    copy.textContent = track.subtitle;

    const meta = document.createElement("div");
    meta.className = "track-meta";
    for (const item of track.meta) {
      const chip = document.createElement("span");
      chip.textContent = item;
      meta.appendChild(chip);
    }

    card.append(title, copy, meta);
    card.addEventListener("click", () => startRace(track.id));
    trackCards.appendChild(card);
  }
}

function bindInput() {
  window.addEventListener("keydown", (event) => {
    keys.add(event.code);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === "KeyR") {
      startRace(state.selectedTrack.id);
    }
    if (event.code === "Escape") {
      openTrackMenu();
    }
    if (event.code === "Enter" && state.mode === "menu") {
      startRace(state.selectedTrack.id);
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });

  document.querySelectorAll("[data-control]").forEach((button) => {
    const control = button.dataset.control;
    const set = (value) => {
      touch[control] = value;
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      set(true);
    });
    button.addEventListener("pointerup", (event) => {
      event.preventDefault();
      set(false);
    });
    button.addEventListener("pointercancel", () => set(false));
    button.addEventListener("pointerleave", () => set(false));
  });

  restartButton.addEventListener("click", () => startRace(state.selectedTrack.id));
  changeTrackButton.addEventListener("click", openTrackMenu);
  menuButton.addEventListener("click", openTrackMenu);
}

function openTrackMenu() {
  state.mode = "menu";
  state.goFlash = 0;
  countdownEl.textContent = "";
  resultPanel.classList.add("hidden");
  trackOverlay.classList.remove("hidden");
}

function startRace(trackId) {
  const needsLoad = !state.runtime || state.selectedTrack.id !== trackId;
  if (needsLoad) {
    loadTrack(trackId);
  }

  resetActors();
  state.mode = "countdown";
  state.elapsed = 0;
  state.countdown = 3.15;
  state.goFlash = 0;
  resultPanel.classList.add("hidden");
  trackOverlay.classList.add("hidden");
  countdownEl.textContent = "3";
}

function loadTrack(trackId) {
  const track = TRACKS.find((item) => item.id === trackId) ?? TRACKS[0];
  state.selectedTrack = track;
  readouts.trackName.textContent = track.name;

  disposeGroup(trackGroup);
  disposeGroup(actorGroup);
  scene.remove(trackGroup, actorGroup);
  trackGroup = new THREE.Group();
  actorGroup = new THREE.Group();
  scene.add(trackGroup, actorGroup);

  scene.background = new THREE.Color(track.palette.sky);
  scene.fog = new THREE.Fog(track.palette.fog, 360, 1550);

  state.runtime = createTrack(track);
  trackGroup.add(state.runtime.group);
  createRivals(track);
  resetActors();
}

function createTrack(track) {
  const points = track.points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.38);
  curve.arcLengthDivisions = 1800;
  curve.updateArcLengths();

  const length = curve.getLength();
  const sampleCount = Math.max(320, Math.round(length / 3.2));
  const samples = [];

  const runtime = {
    track,
    curve,
    length,
    samples,
    obstacles: [],
    group: new THREE.Group(),
    roadWidth: track.roadWidth,
    playLimit: Math.max(78, track.roadWidth / 2 + 58),
    bounds: {
      minX: Infinity,
      maxX: -Infinity,
      minZ: Infinity,
      maxZ: -Infinity,
    },
    frameAt(distance, laneOffset = 0) {
      const clamped = clamp(distance, 0, length);
      const u = clamp(clamped / length, 0, 1);
      const point = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();
      const normal = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
      const extra = distance - clamped;
      const position = point.clone().addScaledVector(tangent, extra).addScaledVector(normal, laneOffset);
      return {
        position,
        center: point,
        tangent,
        normal,
        heading: Math.atan2(tangent.x, tangent.z),
      };
    },
    nearest(position) {
      let bestDistanceSq = Infinity;
      let best = null;

      for (let i = 0; i < samples.length - 1; i += 1) {
        const a = samples[i];
        const b = samples[i + 1];
        const ax = a.position.x;
        const az = a.position.z;
        const bx = b.position.x;
        const bz = b.position.z;
        const abx = bx - ax;
        const abz = bz - az;
        const apx = position.x - ax;
        const apz = position.z - az;
        const abSq = abx * abx + abz * abz || 1;
        const segmentT = clamp((apx * abx + apz * abz) / abSq, 0, 1);
        const px = ax + abx * segmentT;
        const pz = az + abz * segmentT;
        const dx = position.x - px;
        const dz = position.z - pz;
        const distanceSq = dx * dx + dz * dz;

        if (distanceSq < bestDistanceSq) {
          const progress = lerp(a.distance, b.distance, segmentT);
          const frame = runtime.frameAt(progress);
          const center = new THREE.Vector3(px, lerp(a.position.y, b.position.y, segmentT), pz);
          const signedDistance = (position.x - center.x) * frame.normal.x + (position.z - center.z) * frame.normal.z;
          bestDistanceSq = distanceSq;
          best = {
            progress,
            center,
            normal: frame.normal,
            tangent: frame.tangent,
            heading: frame.heading,
            signedDistance,
            distanceToCenter: Math.sqrt(distanceSq),
          };
        }
      }

      return best;
    },
    curvatureAt(distance) {
      const a = runtime.frameAt(distance).tangent;
      const b = runtime.frameAt(distance + 42).tangent;
      return a.angleTo(b);
    },
    heightAt(nearest) {
      const roadFloor = nearest.center.y + CAR_RIDE_HEIGHT;
      const terrainFloor = GROUND_Y + CAR_RIDE_HEIGHT;
      const roadBlend = 1 - smoothstep(runtime.roadWidth / 2 + 5, runtime.roadWidth / 2 + 26, nearest.distanceToCenter);
      return lerp(terrainFloor, roadFloor, roadBlend);
    },
  };

  for (let i = 0; i <= sampleCount; i += 1) {
    const distance = (i / sampleCount) * length;
    const frame = runtime.frameAt(distance);
    samples.push({
      distance,
      position: frame.center.clone(),
      tangent: frame.tangent,
      normal: frame.normal,
    });
    runtime.bounds.minX = Math.min(runtime.bounds.minX, frame.center.x);
    runtime.bounds.maxX = Math.max(runtime.bounds.maxX, frame.center.x);
    runtime.bounds.minZ = Math.min(runtime.bounds.minZ, frame.center.z);
    runtime.bounds.maxZ = Math.max(runtime.bounds.maxZ, frame.center.z);
  }

  runtime.group.add(createTerrain(runtime));
  runtime.group.add(createStrip(runtime, track.roadWidth + 12, track.palette.shoulder, -0.035));
  runtime.group.add(createStrip(runtime, track.roadWidth, track.palette.road, 0.015));
  runtime.group.add(createRoadDetails(runtime));
  runtime.group.add(createTrackScenery(runtime));

  return runtime;
}

function createTerrain(runtime) {
  const { track } = runtime;
  const width = Math.max(1700, runtime.bounds.maxX - runtime.bounds.minX + 1200);
  const depth = Math.max(2100, runtime.bounds.maxZ - runtime.bounds.minZ + 1000);
  const centerX = (runtime.bounds.minX + runtime.bounds.maxX) / 2;
  const centerZ = (runtime.bounds.minZ + runtime.bounds.maxZ) / 2;

  const group = new THREE.Group();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth, 1, 1),
    new THREE.MeshStandardMaterial({
      color: track.palette.ground,
      roughness: 0.95,
      metalness: 0,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(centerX, GROUND_Y, centerZ);
  ground.receiveShadow = true;
  group.add(ground);

  if (track.scenery === "coastal") {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(900, depth * 1.2, 1, 1),
      new THREE.MeshStandardMaterial({
        color: 0x2577a5,
        roughness: 0.24,
        metalness: 0.05,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(runtime.bounds.minX - 420, -0.11, centerZ);
    group.add(water);
  }

  return group;
}

function createStrip(runtime, width, color, yOffset) {
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (const sample of runtime.samples) {
    const left = sample.position.clone().addScaledVector(sample.normal, -width / 2);
    const right = sample.position.clone().addScaledVector(sample.normal, width / 2);
    vertices.push(left.x, left.y + yOffset, left.z, right.x, right.y + yOffset, right.z);
    normals.push(0, 1, 0, 0, 1, 0);
    uvs.push(0, sample.distance / 30, 1, sample.distance / 30);
  }

  for (let i = 0; i < runtime.samples.length - 1; i += 1) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.02,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function createRoadDetails(runtime) {
  const group = new THREE.Group();
  const track = runtime.track;
  const dashMaterial = new THREE.MeshStandardMaterial({
    color: track.palette.line,
    roughness: 0.5,
    metalness: 0.05,
    emissive: new THREE.Color(track.palette.line).multiplyScalar(0.08),
  });
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: track.palette.rail,
    roughness: 0.6,
    metalness: 0.08,
  });

  const centerDash = new THREE.BoxGeometry(0.42, 0.06, 8.5);
  const edgeBlock = new THREE.BoxGeometry(1.1, 0.5, 8.8);

  for (let distance = 18; distance < runtime.length - 18; distance += 24) {
    const frame = runtime.frameAt(distance);
    const dash = new THREE.Mesh(centerDash, dashMaterial);
    dash.position.copy(frame.position);
    dash.position.y += 0.09;
    dash.rotation.y = frame.heading;
    group.add(dash);

    if (Math.floor(distance / 24) % 2 === 0) {
      for (const side of [-1, 1]) {
        const edge = new THREE.Mesh(edgeBlock, edgeMaterial);
        const edgeFrame = runtime.frameAt(distance, side * (track.roadWidth / 2 + 1.2));
        edge.position.copy(edgeFrame.position);
        edge.position.y += 0.18;
        edge.rotation.y = edgeFrame.heading;
        edge.castShadow = true;
        group.add(edge);
      }
    }
  }

  group.add(createStartFinish(runtime, 0, "START"));
  group.add(createStartFinish(runtime, runtime.length, "FINISH"));
  group.add(createBoundaryMarkers(runtime));

  return group;
}

function createBoundaryMarkers(runtime) {
  const group = new THREE.Group();
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: runtime.track.palette.accent,
    roughness: 0.38,
    metalness: 0.12,
    emissive: new THREE.Color(runtime.track.palette.accent).multiplyScalar(0.26),
  });
  const capMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4f7ef,
    roughness: 0.5,
    metalness: 0.06,
    emissive: new THREE.Color(0xf4f7ef).multiplyScalar(0.08),
  });
  const markerGeo = new THREE.ConeGeometry(0.9, 2.4, 4);
  const capGeo = new THREE.BoxGeometry(1.15, 0.18, 1.15);

  for (let distance = 12; distance < runtime.length - 12; distance += 52) {
    for (const side of [-1, 1]) {
      const frame = runtime.frameAt(distance, side * runtime.playLimit);
      const marker = new THREE.Mesh(markerGeo, markerMaterial);
      marker.position.set(frame.position.x, GROUND_Y + 1.2, frame.position.z);
      marker.rotation.y = frame.heading + Math.PI / 4;
      marker.castShadow = true;
      group.add(marker);

      const cap = new THREE.Mesh(capGeo, capMaterial);
      cap.position.set(frame.position.x, GROUND_Y + 2.45, frame.position.z);
      cap.rotation.y = frame.heading + Math.PI / 4;
      group.add(cap);
    }
  }

  return group;
}

function createStartFinish(runtime, distance, label) {
  const group = new THREE.Group();
  const frame = runtime.frameAt(distance);
  const width = runtime.track.roadWidth;
  const accent = new THREE.MeshStandardMaterial({
    color: runtime.track.palette.accent,
    roughness: 0.45,
    metalness: 0.18,
    emissive: new THREE.Color(runtime.track.palette.accent).multiplyScalar(0.14),
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x101417, roughness: 0.68 });
  const light = new THREE.MeshStandardMaterial({ color: 0xf5f2df, roughness: 0.55 });
  const postGeo = new THREE.BoxGeometry(0.9, 8, 0.9);
  const beamGeo = new THREE.BoxGeometry(width + 8, 1.1, 1.1);

  if (label === "FINISH") {
    for (const side of [-1, 1]) {
      const postFrame = runtime.frameAt(distance, side * (width / 2 + 3));
      const post = new THREE.Mesh(postGeo, accent);
      post.position.copy(postFrame.position);
      post.position.y += 4;
      post.rotation.y = frame.heading;
      post.castShadow = true;
      group.add(post);
    }

    const beam = new THREE.Mesh(beamGeo, accent);
    beam.position.copy(frame.position);
    beam.position.y += 8;
    beam.rotation.y = frame.heading;
    beam.castShadow = true;
    group.add(beam);
  }

  const segments = 10;
  for (let i = 0; i < segments; i += 1) {
    const lane = -width / 2 + (i + 0.5) * (width / segments);
    const tileFrame = runtime.frameAt(distance, lane);
    const tile = new THREE.Mesh(
      new THREE.BoxGeometry(width / segments, 0.08, 3.5),
      i % 2 === 0 ? light : dark,
    );
    tile.position.copy(tileFrame.position);
    tile.position.y += 0.12;
    tile.rotation.y = frame.heading;
    group.add(tile);
  }

  if (label === "FINISH") {
    const sign = createSign(label, runtime.track.palette.accent);
    sign.position.copy(frame.position);
    sign.position.y += 10.4;
    sign.rotation.y = frame.heading + Math.PI;
    group.add(sign);
  }

  return group;
}

function createSign(text, color) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 128;
  const ctx = textureCanvas.getContext("2d");
  ctx.fillStyle = "#101417";
  ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
  ctx.strokeStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, textureCanvas.width - 16, textureCanvas.height - 16);
  ctx.fillStyle = "#fff7db";
  ctx.font = "900 62px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, textureCanvas.width / 2, textureCanvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(12, 3), material);
}

function createTrackScenery(runtime) {
  const group = new THREE.Group();
  const { track } = runtime;
  const rand = seeded(track.id);

  const addObject = (object, distance, offset, clearance = track.roadWidth / 2 + 8) => {
    const side = Math.sign(offset || 1);
    let finalOffset = offset;
    let frame = runtime.frameAt(distance, finalOffset);

    for (let attempt = 0; attempt < 6 && !isClearFromTrack(runtime, frame.position, clearance); attempt += 1) {
      finalOffset += side * (clearance + 18);
      frame = runtime.frameAt(distance, finalOffset);
    }

    object.position.set(frame.position.x, GROUND_Y, frame.position.z);
    object.rotation.y = frame.heading + (rand() - 0.5) * 1.2;
    group.add(object);

    if (object.userData.collision) {
      runtime.obstacles.push({
        x: object.position.x,
        z: object.position.z,
        radius: object.userData.collision.radius,
        height: object.userData.collision.height,
      });
    }
  };

  const objectCount = track.scenery === "metro" ? 78 : 88;
  for (let i = 0; i < objectCount; i += 1) {
    const distance = 40 + (i / objectCount) * (runtime.length - 80);
    const side = i % 2 === 0 ? -1 : 1;
    let object;
    let offset;
    let clearance;

    if (track.scenery === "metro") {
      object = createTower(10 + rand() * 12, 18 + rand() * 52, track.palette.accent, rand);
      offset = side * (runtime.playLimit + 36 + rand() * 120);
      clearance = track.roadWidth / 2 + 28;
    } else if (track.scenery === "coastal") {
      object = i % 3 === 0 ? createPalm(rand) : createRock(2 + rand() * 4, 0xd7b36c, rand);
      offset = side * (track.roadWidth / 2 + 24 + rand() * Math.max(12, runtime.playLimit - track.roadWidth / 2 - 42));
      clearance = track.roadWidth / 2 + 10;
    } else {
      object = i % 4 === 0 ? createRock(4 + rand() * 8, 0x72766d, rand) : createPine(rand);
      offset = side * (track.roadWidth / 2 + 26 + rand() * Math.max(12, runtime.playLimit - track.roadWidth / 2 - 44));
      clearance = track.roadWidth / 2 + 12;
    }

    addObject(object, distance, offset, clearance);
  }

  if (track.scenery !== "metro") {
    const mountainMaterial = new THREE.MeshStandardMaterial({
      color: track.scenery === "alpine" ? 0x7c8178 : 0x6b745d,
      roughness: 0.96,
    });
    const snowMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f3e8, roughness: 0.9 });
    for (let i = 0; i < 16; i += 1) {
      const distance = (i / 16) * runtime.length;
      const side = i % 2 === 0 ? -1 : 1;
      const height = 60 + rand() * 130;
      const radius = 58 + rand() * 80;
      let offset = side * (runtime.playLimit + radius + 230 + rand() * 260);
      let frame = runtime.frameAt(distance, offset);
      const clearance = radius + track.roadWidth / 2 + 70;

      for (let attempt = 0; attempt < 5 && !isClearFromTrack(runtime, frame.position, clearance); attempt += 1) {
        offset += side * (clearance + 60);
        frame = runtime.frameAt(distance, offset);
      }

      const mountain = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 6), mountainMaterial);
      mountain.position.set(frame.position.x, height / 2 - 8, frame.position.z);
      mountain.rotation.y = rand() * Math.PI;
      mountain.castShadow = true;
      group.add(mountain);

      if (track.scenery === "alpine") {
        const cap = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.32, height * 0.22, 6), snowMaterial);
        cap.position.copy(mountain.position);
        cap.position.y += height * 0.39;
        cap.rotation.y = mountain.rotation.y;
        group.add(cap);
      }
    }
  }

  return group;
}

function isClearFromTrack(runtime, position, clearance) {
  const clearanceSq = clearance * clearance;
  for (let i = 0; i < runtime.samples.length; i += 5) {
    const sample = runtime.samples[i];
    const dx = position.x - sample.position.x;
    const dz = position.z - sample.position.z;
    if (dx * dx + dz * dz < clearanceSq) {
      return false;
    }
  }
  return true;
}

function createPalm(rand) {
  const group = new THREE.Group();
  group.userData.collision = { radius: 1.8, height: 8.4 };
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a5833, roughness: 0.85 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f8a55, roughness: 0.7 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 7, 7), trunkMat);
  trunk.position.y = 3.5;
  trunk.rotation.z = (rand() - 0.5) * 0.22;
  trunk.castShadow = true;
  group.add(trunk);

  for (let i = 0; i < 5; i += 1) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.75, 4.4, 4), leafMat);
    leaf.position.y = 7.2;
    leaf.rotation.z = Math.PI / 2;
    leaf.rotation.y = (i / 5) * Math.PI * 2;
    leaf.castShadow = true;
    group.add(leaf);
  }

  return group;
}

function createPine(rand) {
  const group = new THREE.Group();
  group.userData.collision = { radius: 2.3, height: 9.4 };
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6a4b32, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x244d35, roughness: 0.75 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.2, 7), trunkMat);
  trunk.position.y = 1.6;
  trunk.castShadow = true;
  group.add(trunk);

  const height = 4 + rand() * 4;
  for (let i = 0; i < 3; i += 1) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.5 - i * 0.55, height, 8), leafMat);
    cone.position.y = 3 + i * 1.45;
    cone.castShadow = true;
    group.add(cone);
  }

  return group;
}

function createRock(size, color, rand) {
  const group = new THREE.Group();
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(size, 0),
    new THREE.MeshStandardMaterial({ color, roughness: 0.98 }),
  );
  rock.scale.set(1.2 + rand() * 1.5, 0.45 + rand() * 0.5, 0.8 + rand() * 1.2);
  rock.position.y = size * 0.35;
  rock.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
  rock.castShadow = true;
  group.add(rock);
  group.userData.collision = { radius: size * 1.7, height: size * 1.2 };
  return group;
}

function createTower(width, height, accentColor, rand) {
  const group = new THREE.Group();
  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x2a3033,
    roughness: 0.62,
    metalness: 0.18,
  });
  const lightMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.42,
    emissive: new THREE.Color(accentColor).multiplyScalar(0.35),
  });
  const tower = new THREE.Mesh(new THREE.BoxGeometry(width, height, width * (0.7 + rand() * 0.7)), buildingMat);
  tower.position.y = height / 2;
  tower.castShadow = true;
  tower.receiveShadow = true;
  group.add(tower);

  for (let y = 5; y < height - 4; y += 7) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, 0.32, width * 0.82), lightMat);
    stripe.position.set(0, y, width * 0.36);
    group.add(stripe);
  }

  return group;
}

function createRivals(track) {
  state.rivals = RIVAL_NAMES.map((name, index) => {
    const mesh = createCar(RIVAL_COLORS[index], 0x101417, false);
    actorGroup.add(mesh);
    return {
      name,
      mesh,
      lane: LANES[index],
      phase: index * 1.71,
      speed: 0,
      progress: 0,
      basePace: track.aiPace + (index - 2) * 0.8,
      finished: false,
      finishTime: null,
    };
  });
}

function resetActors() {
  const runtime = state.runtime;
  if (!runtime) return;

  const startFrame = runtime.frameAt(-16, 0);
  player.position.copy(startFrame.position);
  player.position.y += CAR_RIDE_HEIGHT;
  player.heading = startFrame.heading;
  player.speed = 0;
  player.progress = 0;
  player.nitro = 1;
  player.offroad = false;
  player.finished = false;
  player.finishTime = null;
  player.steer = 0;
  player.roadY = startFrame.position.y;
  updateCarMesh(player.mesh, player.position, player.heading, 0, 0, true);

  for (const [index, rival] of state.rivals.entries()) {
    rival.speed = 0;
    rival.progress = -4 - index * 10;
    rival.finished = false;
    rival.finishTime = null;
    const frame = runtime.frameAt(rival.progress, rival.lane);
    frame.position.y += CAR_RIDE_HEIGHT - 0.07;
    updateCarMesh(rival.mesh, frame.position, frame.heading, 0, 0, false);
  }
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.045);
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

function update(dt) {
  if (!state.runtime) return;

  if (state.mode === "countdown") {
    state.countdown -= dt;
    if (state.countdown > 0) {
      countdownEl.textContent = String(Math.ceil(state.countdown));
    } else {
      state.mode = "running";
      state.goFlash = 0.72;
      countdownEl.textContent = "GO";
    }
  } else if (state.mode === "running") {
    state.elapsed += dt;
    updatePlayer(dt);
    updateRivals(dt);
    resolveCarTraffic(dt);
    checkFinish();
  }

  if (state.goFlash > 0) {
    state.goFlash -= dt;
    if (state.goFlash <= 0) countdownEl.textContent = "";
  }

  state.cameraShake = Math.max(0, state.cameraShake - dt * 2.5);
  updateCamera(dt);
  updateHud();
  drawMiniMap();
}

function getControls() {
  const steer =
    (keys.has("KeyD") || keys.has("ArrowRight") || touch.right ? 1 : 0) -
    (keys.has("KeyA") || keys.has("ArrowLeft") || touch.left ? 1 : 0);
  const gas = keys.has("KeyW") || keys.has("ArrowUp") || touch.gas;
  const brake = keys.has("KeyS") || keys.has("ArrowDown") || touch.brake;
  const boost = keys.has("ShiftLeft") || keys.has("ShiftRight") || keys.has("Space") || touch.boost;
  return { steer, gas, brake, boost };
}

function updatePlayer(dt) {
  const runtime = state.runtime;
  const controls = getControls();
  player.steer = lerp(player.steer, controls.steer, clamp(dt * 10, 0, 1));

  const nearestBefore = runtime.nearest(player.position);
  player.offroad = nearestBefore.distanceToCenter > runtime.roadWidth / 2;
  const offroadDrag = player.offroad ? 1.55 : 1;
  const maxSpeed = (player.offroad ? 34 : state.selectedTrack.playerMax) + (controls.boost && player.nitro > 0.02 ? 10 : 0);

  if (controls.gas) {
    player.speed += (player.offroad ? 24 : 34) * dt;
  } else {
    player.speed -= player.speed * 0.52 * dt;
  }

  if (controls.brake) {
    player.speed -= (player.speed > 2 ? 48 : 18) * dt;
  }

  if (controls.boost && player.nitro > 0.02 && player.speed > 12) {
    player.speed += 28 * dt;
    player.nitro = Math.max(0, player.nitro - 0.34 * dt);
    state.cameraShake = Math.min(1, state.cameraShake + dt * 1.8);
  } else {
    const recharge = player.offroad ? 0.04 : 0.11;
    player.nitro = Math.min(1, player.nitro + recharge * dt);
  }

  player.speed -= Math.sign(player.speed) * Math.min(Math.abs(player.speed), 7.6 * offroadDrag * dt);
  player.speed = clamp(player.speed, -12, maxSpeed);

  const speedRatio = clamp(Math.abs(player.speed) / Math.max(state.selectedTrack.playerMax, 1), 0, 1);
  const steerRate = 0.9 + speedRatio * 1.45;
  player.heading += player.steer * steerRate * dt * (player.speed >= 0 ? 1 : -0.5);

  const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
  player.position.addScaledVector(forward, player.speed * dt);

  let nearest = runtime.nearest(player.position);
  const roadLimit = runtime.playLimit;
  if (nearest.distanceToCenter > roadLimit) {
    const side = Math.sign(nearest.signedDistance || 1);
    const overrun = nearest.distanceToCenter - roadLimit;
    const limited = nearest.center.clone().addScaledVector(nearest.normal, side * roadLimit);
    const correction = clamp(dt * (1.1 + overrun * 0.025), 0, 0.56);
    player.position.x = lerp(player.position.x, limited.x, correction);
    player.position.z = lerp(player.position.z, limited.z, correction);
    player.speed *= 1 - clamp(dt * (0.42 + overrun * 0.018), 0, 0.45);
    nearest = runtime.nearest(player.position);
  }

  player.roadY = nearest.center.y;
  player.position.y = lerp(player.position.y, runtime.heightAt(nearest), clamp(dt * (player.offroad ? 7.5 : 12), 0, 1));

  if (resolveObstacleCollisions(runtime)) {
    nearest = runtime.nearest(player.position);
    player.position.y = lerp(player.position.y, runtime.heightAt(nearest), clamp(dt * 10, 0, 1));
  }

  player.progress = Math.max(player.progress, nearest.progress);

  const roll = -player.steer * clamp(Math.abs(player.speed) / 48, 0, 1) * 0.11;
  const pitch = controls.boost && player.nitro > 0 ? -0.035 : 0;
  updateCarMesh(player.mesh, player.position, player.heading, roll, pitch, true, player.speed, dt);
}

function updateRivals(dt) {
  const runtime = state.runtime;
  for (const rival of state.rivals) {
    if (!rival.finished) {
      const curve = runtime.curvatureAt(rival.progress + 60);
      const cornerSlowdown = clamp(curve * 2.8, 0, 0.36);
      const deterministicPulse = Math.sin(state.elapsed * 1.2 + rival.phase) * 1.6;
      const chase = player.progress - rival.progress > 75 ? 2.4 : 0;
      const target = rival.basePace * (1 - cornerSlowdown) + deterministicPulse + chase;
      rival.speed += (target - rival.speed) * clamp(dt * 0.82, 0, 1);
      rival.progress += rival.speed * dt;

      if (rival.progress >= runtime.length) {
        rival.finished = true;
        rival.finishTime = state.elapsed;
      }
    } else {
      rival.speed = Math.max(10, rival.speed * (1 - dt * 0.6));
      rival.progress += rival.speed * dt * 0.35;
    }

    const laneDrift = Math.sin(rival.progress * 0.015 + rival.phase) * 0.8;
    const frame = runtime.frameAt(rival.progress, rival.lane + laneDrift);
    frame.position.y += CAR_RIDE_HEIGHT - 0.05;
    const roll = Math.sin(rival.progress * 0.03 + rival.phase) * 0.035;
    updateCarMesh(rival.mesh, frame.position, frame.heading, roll, 0, false, rival.speed, dt);
  }
}

function resolveCarTraffic(dt) {
  for (const rival of state.rivals) {
    if (rival.finished) continue;
    const dx = player.position.x - rival.mesh.position.x;
    const dz = player.position.z - rival.mesh.position.z;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq > 0.01 && distanceSq < 13) {
      const distance = Math.sqrt(distanceSq);
      const push = (3.6 - distance) * 0.5;
      player.position.x += (dx / distance) * push * dt * 12;
      player.position.z += (dz / distance) * push * dt * 12;
      player.speed *= 0.985;
      rival.speed *= 0.992;
    }
  }
}

function resolveObstacleCollisions(runtime) {
  let collided = false;
  const carBaseY = player.position.y - CAR_RIDE_HEIGHT;

  for (const obstacle of runtime.obstacles) {
    if (carBaseY > GROUND_Y + obstacle.height + 0.9) continue;

    const dx = player.position.x - obstacle.x;
    const dz = player.position.z - obstacle.z;
    const minDistance = obstacle.radius + 1.45;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq >= minDistance * minDistance) continue;

    const distance = Math.sqrt(distanceSq);
    const push = minDistance - distance;
    const nx = distance > 0.01 ? dx / distance : Math.sin(player.heading + Math.PI / 2);
    const nz = distance > 0.01 ? dz / distance : Math.cos(player.heading + Math.PI / 2);
    player.position.x += nx * push;
    player.position.z += nz * push;
    player.speed *= 0.68;
    collided = true;
  }

  return collided;
}

function checkFinish() {
  if (!player.finished && player.progress >= state.runtime.length - 1) {
    player.finished = true;
    player.finishTime = state.elapsed;
    state.mode = "finished";
    showResults();
  }
}

function showResults() {
  const racers = getRaceOrder(true);
  const place = racers.findIndex((racer) => racer.name === player.name) + 1;
  resultTitle.textContent = place === 1 ? "Victory" : `P${place} Finish`;
  resultStats.innerHTML = "";

  const lines = [
    ["Track", state.selectedTrack.name],
    ["Place", `${place} / ${racers.length}`],
    ["Time", formatTime(player.finishTime ?? state.elapsed)],
    ["Top Speed", `${Math.round(Math.max(0, player.speed) * 3.6)} km/h`],
  ];

  for (const [label, value] of lines) {
    const row = document.createElement("div");
    row.className = "result-line";
    const left = document.createElement("span");
    left.textContent = label;
    const right = document.createElement("strong");
    right.textContent = value;
    row.append(left, right);
    resultStats.appendChild(row);
  }

  resultPanel.classList.remove("hidden");
}

function updateCamera(dt) {
  const runtime = state.runtime;
  if (!runtime) return;

  if (state.mode === "menu") {
    state.previewDistance = (state.previewDistance + dt * 44) % runtime.length;
    const frame = runtime.frameAt(state.previewDistance, Math.sin(state.previewDistance * 0.006) * 18);
    const target = frame.position.clone().addScaledVector(frame.tangent, 36);
    target.y += 4;
    const cameraGoal = frame.position
      .clone()
      .addScaledVector(frame.tangent, -28)
      .addScaledVector(frame.normal, 34)
      .add(new THREE.Vector3(0, 22, 0));
    camera.position.lerp(cameraGoal, clamp(dt * 1.7, 0, 1));
    camera.lookAt(target);
    return;
  }

  const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
  const side = new THREE.Vector3(forward.z, 0, -forward.x);
  const chaseDistance = 15 + clamp(player.speed / 5, 0, 9);
  const height = 7 + clamp(player.speed / 18, 0, 4);
  const shake = state.cameraShake * 0.45;
  const cameraGoal = player.position
    .clone()
    .addScaledVector(forward, -chaseDistance)
    .addScaledVector(side, Math.sin(performance.now() * 0.041) * shake)
    .add(new THREE.Vector3(0, height + Math.cos(performance.now() * 0.037) * shake, 0));
  const lookTarget = player.position.clone().addScaledVector(forward, 18 + player.speed * 0.15);
  lookTarget.y += 2.4;

  camera.position.lerp(cameraGoal, clamp(dt * 5.8, 0, 1));
  camera.lookAt(lookTarget);
}

function updateHud() {
  const runtime = state.runtime;
  if (!runtime) return;

  const racers = getRaceOrder();
  const place = racers.findIndex((racer) => racer.name === player.name) + 1;
  const progressPct = clamp(player.progress / runtime.length, 0, 1);
  const nitroPct = Math.round(player.nitro * 100);

  readouts.position.textContent = state.mode === "menu" ? "--" : `${place}/${racers.length}`;
  readouts.speed.textContent = String(Math.round(Math.max(0, player.speed) * 3.6));
  readouts.time.textContent = formatTime(state.elapsed);
  readouts.progress.textContent = `${Math.round(progressPct * 100)}%`;
  readouts.progressMeter.style.width = `${progressPct * 100}%`;
  readouts.nitro.textContent = `${nitroPct}%`;
  readouts.nitroMeter.style.width = `${nitroPct}%`;

  const hudRows = racers
    .map((racer, index) => {
      const isPlayer = racer.name === player.name;
      const pct = Math.round(clamp(racer.progress / runtime.length, 0, 1) * 100);
      return `<div class="leader-row ${isPlayer ? "player" : ""}"><span>${index + 1}</span><span>${racer.name}</span><strong>${pct}%</strong></div>`;
    })
    .join("");

  if (hudRows !== state.lastHudText) {
    readouts.leaderboard.innerHTML = hudRows;
    state.lastHudText = hudRows;
  }
}

function getRaceOrder(includeFinishedTimes = false) {
  const racers = [
    {
      name: player.name,
      progress: player.finished ? state.runtime.length : player.progress,
      finishTime: player.finishTime,
    },
    ...state.rivals.map((rival) => ({
      name: rival.name,
      progress: rival.finished ? state.runtime.length : rival.progress,
      finishTime: rival.finishTime,
    })),
  ];

  racers.sort((a, b) => {
    if (includeFinishedTimes && a.finishTime != null && b.finishTime != null) {
      return a.finishTime - b.finishTime;
    }
    if (a.finishTime != null && b.finishTime == null) return -1;
    if (a.finishTime == null && b.finishTime != null) return 1;
    return b.progress - a.progress;
  });
  return racers;
}

function drawMiniMap() {
  const runtime = state.runtime;
  if (!runtime) return;

  const width = miniMap.width;
  const height = miniMap.height;
  mapCtx.clearRect(0, 0, width, height);
  mapCtx.fillStyle = "rgba(7, 10, 12, 0.74)";
  mapCtx.fillRect(0, 0, width, height);

  const pad = 15;
  const rangeX = Math.max(1, runtime.bounds.maxX - runtime.bounds.minX);
  const rangeZ = Math.max(1, runtime.bounds.maxZ - runtime.bounds.minZ);
  const scale = Math.min((width - pad * 2) / rangeX, (height - pad * 2) / rangeZ);
  const offsetX = (width - rangeX * scale) / 2;
  const offsetY = (height - rangeZ * scale) / 2;
  const project = (position) => ({
    x: offsetX + (position.x - runtime.bounds.minX) * scale,
    y: offsetY + (position.z - runtime.bounds.minZ) * scale,
  });

  mapCtx.lineCap = "round";
  mapCtx.lineJoin = "round";
  mapCtx.lineWidth = 7;
  mapCtx.strokeStyle = "rgba(255,255,255,0.18)";
  mapCtx.beginPath();
  runtime.samples.forEach((sample, index) => {
    const point = project(sample.position);
    if (index === 0) mapCtx.moveTo(point.x, point.y);
    else mapCtx.lineTo(point.x, point.y);
  });
  mapCtx.stroke();

  mapCtx.lineWidth = 3;
  mapCtx.strokeStyle = "#f6d35b";
  mapCtx.beginPath();
  runtime.samples.forEach((sample, index) => {
    const point = project(sample.position);
    if (index === 0) mapCtx.moveTo(point.x, point.y);
    else mapCtx.lineTo(point.x, point.y);
  });
  mapCtx.stroke();

  drawMapDot(project(runtime.frameAt(runtime.length).position), "#f4f7ef", 4);
  for (const rival of state.rivals) {
    drawMapDot(project(runtime.frameAt(rival.progress, rival.lane).position), "#ec2e55", 3);
  }
  drawMapDot(project(player.position), "#38d4c4", 4.5);
}

function drawMapDot(point, color, radius) {
  mapCtx.beginPath();
  mapCtx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  mapCtx.fillStyle = color;
  mapCtx.fill();
  mapCtx.strokeStyle = "rgba(0,0,0,0.5)";
  mapCtx.lineWidth = 1;
  mapCtx.stroke();
}

function createCar(color, accent, isPlayer) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.28,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.58,
    metalness: 0.2,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1a2830,
    roughness: 0.15,
    metalness: 0.04,
    transparent: true,
    opacity: 0.78,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x090b0d,
    roughness: 0.8,
    metalness: 0.02,
  });
  const lightMat = new THREE.MeshStandardMaterial({
    color: isPlayer ? 0x38d4c4 : 0xfff0a0,
    emissive: new THREE.Color(isPlayer ? 0x38d4c4 : 0xfff0a0).multiplyScalar(0.7),
    roughness: 0.28,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.62, 4.55), bodyMat);
  body.position.y = 0.72;
  body.castShadow = true;
  group.add(body);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.35, 1.4), bodyMat);
  nose.position.set(0, 0.87, 1.62);
  nose.castShadow = true;
  group.add(nose);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.66, 1.45), glassMat);
  cabin.position.set(0, 1.28, -0.34);
  cabin.castShadow = true;
  group.add(cabin);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.16, 0.48), trimMat);
  wing.position.set(0, 1.18, -2.18);
  wing.castShadow = true;
  group.add(wing);

  const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.12, 0.35), trimMat);
  splitter.position.set(0, 0.42, 2.48);
  splitter.castShadow = true;
  group.add(splitter);

  const headlightGeo = new THREE.BoxGeometry(0.36, 0.14, 0.08);
  for (const x of [-0.68, 0.68]) {
    const light = new THREE.Mesh(headlightGeo, lightMat);
    light.position.set(x, 0.82, 2.34);
    group.add(light);
  }

  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.44, 18);
  const wheels = [];
  for (const x of [-1.18, 1.18]) {
    for (const z of [-1.55, 1.48]) {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(x, 0.42, z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      wheels.push(wheel);
      group.add(wheel);
    }
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(2.15, 28),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.04;
  group.add(shadow);

  group.userData.wheels = wheels;
  return group;
}

function updateCarMesh(mesh, position, heading, roll, pitch, isPlayer, speed = 0, dt = 0) {
  mesh.position.copy(position);
  mesh.rotation.set(pitch, heading, roll, "YXZ");

  const wheels = mesh.userData.wheels ?? [];
  const wheelSpin = speed * dt * 2.8;
  for (const wheel of wheels) {
    wheel.rotation.x += wheelSpin;
  }

  if (isPlayer) {
    const scale = 1 + clamp(Math.abs(speed) / 80, 0, 0.08);
    mesh.scale.set(1, 1, scale);
  }
}

function formatTime(value) {
  const safe = Math.max(0, value || 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe - minutes * 60;
  return minutes > 0 ? `${minutes}:${seconds.toFixed(2).padStart(5, "0")}` : seconds.toFixed(2);
}

function seeded(seedText) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function disposeGroup(group) {
  group.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry?.dispose();
    if (Array.isArray(object.material)) {
      object.material.forEach((material) => material.dispose?.());
    } else {
      object.material?.dispose?.();
    }
  });
  group.clear();
}

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

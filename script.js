const revealItems = document.querySelectorAll("[data-reveal]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => revealObserver.observe(item));

document.querySelectorAll("[data-tilt]").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (reduceMotion) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateX(${y * -7}deg) rotateY(${x * 9}deg) translateY(-2px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

async function bootThreeScene() {
  const canvas = document.querySelector("#webgl-stage");
  if (!canvas || reduceMotion) return;

  const THREE = await import("./assets/three.module.min.js");
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07090b, 0.042);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setClearColor(0x07090b, 1);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 1.2, 8.8);

  const root = new THREE.Group();
  scene.add(root);

  const hemi = new THREE.HemisphereLight(0xeffff8, 0x071017, 1.4);
  scene.add(hemi);

  const key = new THREE.PointLight(0x27d3a2, 12, 22);
  key.position.set(3.4, 3.8, 4);
  scene.add(key);

  const rim = new THREE.PointLight(0xd5a85b, 8, 20);
  rim.position.set(-4.6, 2.4, 2.2);
  scene.add(rim);

  const blue = new THREE.PointLight(0x51a9ff, 6, 20);
  blue.position.set(2.8, -1.8, 5.2);
  scene.add(blue);

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x10202a,
    metalness: 0.4,
    roughness: 0.24,
    transmission: 0.16,
    thickness: 0.7,
    transparent: true,
    opacity: 0.7,
    clearcoat: 0.85,
    clearcoatRoughness: 0.15,
  });

  const greenMat = new THREE.MeshStandardMaterial({
    color: 0x27d3a2,
    metalness: 0.45,
    roughness: 0.28,
    emissive: 0x092c24,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd5a85b,
    metalness: 0.55,
    roughness: 0.22,
    emissive: 0x2a1806,
  });

  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x51a9ff,
    metalness: 0.45,
    roughness: 0.25,
    emissive: 0x07182a,
  });

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.06, 2), glass);
  root.add(core);

  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.38, 1),
    new THREE.MeshBasicMaterial({ color: 0xd5a85b, wireframe: true, transparent: true, opacity: 0.34 })
  );
  root.add(wire);

  const torus = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.012, 12, 180), greenMat);
  torus.rotation.x = Math.PI / 2.6;
  root.add(torus);

  const torusTwo = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.01, 12, 180), blueMat);
  torusTwo.rotation.y = Math.PI / 2.8;
  root.add(torusTwo);

  const slabGeo = new THREE.BoxGeometry(1.72, 0.82, 0.08);
  const labels = [
    ["FASTAPI", greenMat, [-2.7, 0.9, 0]],
    ["REACT", blueMat, [2.65, 0.15, -0.25]],
    ["CSV EXPORT", goldMat, [-1.3, -1.55, 0.4]],
    ["AUTOMATION", greenMat, [2.1, -1.42, 0.2]],
  ];

  const slabs = labels.map(([label, material, position]) => {
    const group = new THREE.Group();
    group.position.set(...position);

    const mesh = new THREE.Mesh(slabGeo, glass.clone());
    mesh.material.opacity = 0.52;
    group.add(mesh);

    const edge = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.88, 0.018), material);
    edge.position.z = -0.06;
    edge.scale.set(1, 1, 0.2);
    group.add(edge);

    const texture = makeLabelTexture(THREE, label);
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.38, 0.3),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true })
    );
    labelMesh.position.z = 0.06;
    group.add(labelMesh);

    root.add(group);
    return group;
  });

  const lineMat = new THREE.LineBasicMaterial({ color: 0x27d3a2, transparent: true, opacity: 0.46 });
  labels.forEach(([, , position]) => {
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(...position)];
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMat);
    root.add(line);
  });

  const particles = new THREE.BufferGeometry();
  const particleCount = 850;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    const radius = 4.2 + Math.random() * 5.4;
    const angle = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 5.8;
    positions[i * 3 + 2] = Math.sin(angle) * radius - 1.6;
  }
  particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particleMesh = new THREE.Points(
    particles,
    new THREE.PointsMaterial({ color: 0xbfeee5, size: 0.018, transparent: true, opacity: 0.68 })
  );
  scene.add(particleMesh);

  const mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", (event) => {
    mouse.x = (event.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const { clientWidth, clientHeight } = canvas;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    root.position.x = clientWidth < 860 ? 0.9 : 1.55;
    root.position.y = clientWidth < 860 ? -0.18 : 0.08;
    root.scale.setScalar(clientWidth < 620 ? 0.78 : clientWidth < 960 ? 0.92 : 1);
  }

  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  function animate() {
    const t = clock.getElapsedTime();
    core.rotation.set(t * 0.22, t * 0.32, t * 0.16);
    wire.rotation.set(-t * 0.12, t * 0.18, t * 0.22);
    torus.rotation.z = t * 0.18;
    torusTwo.rotation.x = Math.PI / 2.8 + Math.sin(t * 0.45) * 0.18;
    particleMesh.rotation.y = t * 0.024;
    root.rotation.y += (mouse.x * 0.16 - root.rotation.y) * 0.035;
    root.rotation.x += (mouse.y * -0.08 - root.rotation.x) * 0.035;

    slabs.forEach((slab, index) => {
      slab.rotation.y = Math.sin(t * 0.9 + index) * 0.18;
      slab.rotation.x = Math.cos(t * 0.7 + index) * 0.08;
      slab.position.y += Math.sin(t * 1.4 + index) * 0.0009;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}

function makeLabelTexture(THREE, text) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(246, 243, 236, 0.96)";
  ctx.font = "900 42px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

bootThreeScene().catch((error) => {
  console.warn("3D scene unavailable", error);
});

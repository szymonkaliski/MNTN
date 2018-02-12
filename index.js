const THREE = require("three");
const OrbitControls = require("three-orbitcontrols");
const SimplexNoise = require("simplex-noise");

const simplex = new SimplexNoise();

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);

camera.position.z = 2;

// scene
const scene = new THREE.Scene();

// lights
const ambientLight = new THREE.AmbientLight(0x777777);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 100, 0);
scene.add(pointLight);

// mesh
const planeWidth = 4;
const planeHeight = 4;
const planeSteps = 200;
const geometry = new THREE.PlaneGeometry(
  planeWidth,
  planeHeight,
  planeSteps,
  planeSteps
);

const nMod = 1.9

geometry.vertices.forEach(v => {
  const n = Math.abs(simplex.noise2D(v.x / planeWidth * nMod, v.y / planeHeight * nMod));

  const mx = Math.sin(Math.PI * (v.x / planeWidth + 0.5));
  const my = Math.sin(Math.PI * (v.y / planeHeight + 0.5));

  v.z += n * 0.9 * Math.max(Math.min(mx, my), 0);
});

geometry.computeBoundingSphere();
geometry.computeVertexNormals();
geometry.computeFaceNormals();

const material = new THREE.MeshStandardMaterial({
  color: 0x222222,
  emissive: 0x010101,
  roughness: 0.7,
  metalness: 0.2
});
const mesh = new THREE.Mesh(geometry, material);

mesh.rotation.x = -Math.PI / 2 * 0.8;

scene.add(mesh);

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0x000000);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.style.margin = 0;
document.body.appendChild(renderer.domElement);

// orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = false;
controls.enableZoom = true;

// loop
const loop = () => {
  requestAnimationFrame(loop);
  renderer.render(scene, camera);
};

loop();

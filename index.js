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

camera.position.z = 1;

// scene
const scene = new THREE.Scene();

// lights
const ambientLight = new THREE.AmbientLight(0x777777);
scene.add(ambientLight);

// mesh
const geometry = new THREE.PlaneGeometry(2, 2, 100, 100);
const material = new THREE.MeshStandardMaterial();
const mesh = new THREE.Mesh(geometry, material);

console.log(geometry.vertices);

geometry.vertices.forEach(v => {
  const n = Math.abs(simplex.noise2D(v.x, v.y));

  const mx = Math.sin(Math.PI * (v.x + 0.5));
  const my = Math.sin(Math.PI * (v.y + 0.5));

  v.z += (n * 0.9) * Math.max(Math.min(mx, my), 0);
});

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

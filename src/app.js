import * as THREE from "../build/three.module.js";
//import * as THREE from  "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js"

import { PointerLockControls } from "../jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "../jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "../jsm/loaders/DRACOLoader.js";

let camera, scene, renderer, controls;

const objects = [];

let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

const loadingElem = document.querySelector("#loading");
const progressBarElem = loadingElem.querySelector(".progressbar");
const instructionsElem = document.querySelector("#instructions");

init();

function init() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.y = 10;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(0xffffff, 0, 750);

  const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 10, 0.75);
  scene.add(light);

  const ambientlight = new THREE.AmbientLight(0x6688cc);
  scene.add(ambientlight);

  const fillLight1 = new THREE.DirectionalLight(0xff9999, 0.5);
  fillLight1.position.set(-1, 10, 2);
  scene.add(fillLight1);

  const fillLight2 = new THREE.DirectionalLight(0x8888ff, 0.2);
  fillLight2.position.set(0, -1, 0);
  scene.add(fillLight2);

  const directionalLight = new THREE.DirectionalLight(0xffffaa, 1.2);
  directionalLight.position.set(-5, 25, -1);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.near = 0.01;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.radius = 4;
  directionalLight.shadow.bias = -0.00006;
  scene.add(directionalLight);

  controls = new PointerLockControls(camera, document.body);

  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");

  instructions.addEventListener("click", function () {
    controls.lock();
  });

  controls.addEventListener("lock", function () {
    instructions.style.display = "none";
    blocker.style.display = "none";
  });

  controls.addEventListener("unlock", function () {
    blocker.style.display = "block";
    instructions.style.display = "";
  });

  scene.add(controls.getObject());

  const onKeyDown = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = true;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = true;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = true;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = true;
        break;

      case "Space":
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = false;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = false;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = false;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    10
  );

  // floor

  let floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
  floorGeometry.rotateX(-Math.PI / 2);

  // vertex displacement

  let position = floorGeometry.attributes.position;

  for (let i = 0, l = position.count; i < l; i++) {
    vertex.fromBufferAttribute(position, i);

    vertex.x += Math.random() * 20 - 10;
    vertex.y += Math.random() * 2;
    vertex.z += Math.random() * 20 - 10;

    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

  position = floorGeometry.attributes.position;
  const colorsFloor = [];

  for (let i = 0, l = position.count; i < l; i++) {
    color.setHSL(Math.random() * 0.5 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
    colorsFloor.push(color.r, color.g, color.b);
  }

  floorGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colorsFloor, 3)
  );

  const floorMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
  });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  scene.add(floor);

  // objects
  loadingManager();

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();

  if (controls.isLocked === true) {
    raycaster.ray.origin.copy(controls.getObject().position);
    //raycaster.ray.origin.x -= 0;
    raycaster.ray.origin.y -= 10;
    //raycaster.ray.origin.z -= 10;

    raycaster.setFromCamera(new THREE.Vector2(), camera);

    const intersections = raycaster.intersectObjects(objects, true);

    const onObject = intersections.length > 0;

    console.log(intersections.length);

    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    if (onObject === true) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
      //do something
      let modelName = intersections[0].object.name;
      console.log(modelName);
    }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    controls.getObject().position.y += velocity.y * delta; // new behavior

    if (controls.getObject().position.y < 10) {
      velocity.y = 0;
      controls.getObject().position.y = 10;

      canJump = true;
    }
  }

  prevTime = time;

  renderer.render(scene, camera);
}

function loadingManager() {
  var manager = new THREE.LoadingManager();

  manager.onStart = function (item, loaded, total) {
    console.log("Loading started");
    instructionsElem.style.display = "none";
  };

  manager.onLoad = function () {
    console.log("Loading complete");
    loadingElem.style.display = "none";
    instructionsElem.style.display = "flex";
    animate();
  };

  manager.onProgress = function (item, loaded, total) {
    console.log(item, loaded, total);
    console.log("Loaded:", Math.round((loaded / total) * 100, 2) + "%");
    const progress = loaded / total;
    progressBarElem.style.transform = `scaleX(${progress})`;
  };

  manager.onError = function (url) {
    console.log("Error loading");
  };

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/js/libs/draco/");

  const loader = new GLTFLoader(manager);
  loader.setDRACOLoader(dracoLoader);
  loader.setPath("./models/gltf/");

  //林安琪
  loader.load("Necklace_AnchiLin.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.geometry.center(); // center here
        child.name = "Necklace_AnchiLin";
        child.userData = { URL: "https://raxal-mu.glitch.me/" };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(1, 1, 1); // scale here
    model.position.set(80, 10, -80); // position here
    scene.add(model);
  });

  //武子揚
  loader.load("Macy_Playboy_scene.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.name = "Macy_Playboy_scene";
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(40, 40, 40); // scale here
    model.position.set(-180, -3, -180); // position here
    scene.add(model);
  });
  loader.load("Macy_Laying_pose.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.name = "Macy_Laying_pose";
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(0.2, 0.2, 0.2); // scale here
    model.position.set(-180, 1, -130); // position here
    model.rotation.set(0, 180, 0); // position here
    scene.add(model);
  });
  //市原悅子
  loader.load("GhostPayer.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.name = "GhostPayer";
        child.userData = { URL: "https://festdt.36q.space/" };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(0.5, 0.5, 0.5); // scale here
    model.position.set(0, 0, -200); // position here
    model.rotation.set(0, 0, 0); // position here
    scene.add(model);
  });
  //花形槙
  loader.load("aseptickiss.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.name = "aseptickiss";
        child.userData = {
          URL: "https://object-storage.tyo1.conoha.io/v1/nc_df3bdbc45bc04950b558834f5728517a/unityroom_production/game/23352/webgl/play.html",
        };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(0.5, 0.5, 0.5); // scale here
    model.position.set(-100, -100, -200); // position here
    model.rotation.set(0, 0, 0); // position here
    scene.add(model);
  });
  //藤倉麻子
  loader.load("all_11.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.name = "all_11";
        child.userData = { URL: "" };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(1, 1, 1); // scale here
    model.position.set(-230, 20, -400); // position here
    model.rotation.set(0, 80, 0); // position here
    scene.add(model);
  });
  //sid&gery
  loader.load("linda.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.name = "linda";
        child.userData = {
          URL: "https://sidngerigmailcom.itch.io/amysgame",
        };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(1, 1, 1); // scale here
    model.position.set(100, 0, -500); // position here
    model.rotation.set(0, 150, 0); // position here
    scene.add(model);
  });
  //翁陳禹彤
  loader.load("blackdoorInside.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.name = "blackdoorInside";
        child.userData = { URL: "http://www.realm-of-ember.space/" };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(6, 6, 6); // scale here
    model.position.set(-70, 0, -400); // position here
    model.rotation.set(0, 180, 0); // position here
    scene.add(model);
  });
}
//NAXS

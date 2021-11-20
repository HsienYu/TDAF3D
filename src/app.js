import * as THREE from "../build/three.module.js";
//import * as THREE from  "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js"

import { PointerLockControls } from "../jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "../jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "../jsm/loaders/DRACOLoader.js";

let camera, scene, renderer, controls;

const objects = [];

let raycaster;
var crosshairClone;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let rcState = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

const mouse = new THREE.Vector2();

const loadingElem = document.querySelector("#loading");
const progressBarElem = loadingElem.querySelector(".progressbar");
const instructionsElem = document.querySelector("#instructions");

const indicatorElem = document.querySelector("#indicator");

init();

function init() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.y = 10;

  addCrosshair(camera);

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
    200
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
  createGeometry();
  loadingManager();

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights = true;

  document.body.appendChild(renderer.domElement);
  

  //

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("mousemove", onMouseMove, false);
  window.addEventListener("click", onClick);
  window.addEventListener("mousedown", onMouseDown);
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
    //raycaster.ray.origin.y -= 10;
    //raycaster.ray.origin.z -= 10;

    raycaster.setFromCamera(mouse, camera);

    const intersections = raycaster.intersectObjects(objects, true);

    const onObject = intersections.length > 0;

    // console.log(intersections.length);

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
    }else if (rcState === true && onObject === false) {
      indicatorElem.style.visibility = "hidden";
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

function onClick(event) {
  //console.log(event.which);
  doRaycasterCross(event.which);
}

function onMouseDown(event){
  //console.log(event.which);
  doRaycasterCross(event.which);
}

function onMouseMove(event) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function doRaycasterCross(which) {
  // console.log('doCaster');
  // update the picking ray with the camera and mouse position
  //console.log(crosshairClone);
  let crossVector = new THREE.Vector2(crosshairClone.x, crosshairClone.y);
  let raycasterCross = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    200
  );
  raycasterCross.setFromCamera(crossVector, camera);
  // calculate objects intersecting the picking ray
  //const intersects = raycaster.intersectObjects(scene.children);
  const intersects = raycasterCross.intersectObjects(objects);
  indicatorElem.style.visibility = "hidden";
  const intersectCondition = intersects.length > 0;
  if (controls.isLocked === true) {
    if (which === 1){
      if (intersectCondition) {
        openLink(intersects[0].object);
      }
    }
    else if (which === 3){
      if (intersectCondition) {
        console.log("right click")
        showDetail(intersects[0].object);
      }
    }
  }
}

function addCrosshair(camera) {
  // crosshair
  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  // size
  const crosshairSizeX = 0.05,
    crosshairSizeY = 0.05;
  const geometry = new THREE.BufferGeometry();
  const pointsArray = new Array();
  pointsArray.push(new THREE.Vector3(0, crosshairSizeY, 0));
  pointsArray.push(new THREE.Vector3(0, -crosshairSizeY, 0));
  pointsArray.push(new THREE.Vector3(0, 0, 0));
  pointsArray.push(new THREE.Vector3(crosshairSizeX, 0, 0));
  pointsArray.push(new THREE.Vector3(-crosshairSizeX, 0, 0));
  geometry.setFromPoints(pointsArray);
  const crosshair = new THREE.Line(geometry, material);
  const crosshairPercentX = 50;
  const crosshairPercentY = 50;
  const crosshairPositionX = (crosshairPercentX / 100) * 2 - 1;
  const crosshairPositionY = (crosshairPercentY / 100) * 2 - 1;
  crosshair.position.x = crosshairPositionX * camera.aspect;
  crosshair.position.y = crosshairPositionY;
  crosshair.position.z = -3;
  crosshairClone = crosshair.position.clone();
  camera.add(crosshair);
}

async function showDetail(obj) {
  //console.log(obj, onObject);
  if(controls.isLocked === true){
    if (rcState) {
      indicatorElem.style.visibility = "hidden";
      rcState = false;
    }else{
      indicatorElem.style.visibility = "visible";
      //indicatorElem.innerHTML = obj.page;
      let url = obj.page.URL;
      indicatorElem.innerHTML = await (await fetch(url)).text();
      rcState = true;
    }
  }
}

function openLink(obj) {
  let url = obj.userData.URL;
  if (typeof url !== "undefined") {
    window.open(url, "_blank");
  }
}

function createGeometry() {
  const geometry = new THREE.BoxGeometry(16, 9, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xd6dee2 });
  const box_11 = new THREE.Mesh(geometry, material);
  box_11.name = "all_11_video";
  box_11.position.set(-250, 30, -400);
  box_11.scale.set(6, 6, 2);
  scene.add(box_11);

  const geometry2 = new THREE.BoxGeometry(16, 9, 1);
  const material2 = new THREE.MeshBasicMaterial({ color: 0xd6dee2 });
  const box_19 = new THREE.Mesh(geometry2, material2);
  box_19.name = "all_11_video";
  box_19.position.set(-450, 30, -200);
  box_19.rotation.set(0, 40, 0);
  box_19.scale.set(6, 6, 2);
  scene.add(box_19);

  const geometry3 = new THREE.BoxGeometry(16, 9, 1);
  const material3 = new THREE.MeshBasicMaterial({ color: 0xd6dee2 });
  const box_08 = new THREE.Mesh(geometry3, material3);
  box_08.name = "all_11_video";
  box_08.position.set(-350, 30, -100);
  box_08.rotation.set(0, 80, 0);
  box_08.scale.set(6, 6, 2);
  scene.add(box_08);
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
        child.material.metalness = 0;
        child.name = "Necklace_AnchiLin";
        child.userData = { URL: "https://raxal-mu.glitch.me/" };
        child.page = { URL: "pages/AnchiLin.html" };        
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
        child.material.metalness = 0.5;
        child.material.roughness = 0.0;
        child.material.envMap = scene.background;
        child.name = "Macy_Playboy_scene";
        child.page = { URL: "pages/playboy.html" };
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
        child.material.metalness = 0;
        //child.geometry.center(); // center here
        child.name = "Macy_Laying_pose";
        child.page = { URL: "pages/playboy.html" };
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
        child.material.metalness = 0.5;
        child.material.roughness = 0.0;
        child.material.envMap = scene.background;
        child.name = "GhostPayer";
        child.userData = { URL: "https://festdt.36q.space/" };
        child.page = { URL: "pages/Etsuko.html" };
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
        child.material.metalness = 0;
        child.name = "aseptickiss";
        child.userData = {
          URL: "https://object-storage.tyo1.conoha.io/v1/nc_df3bdbc45bc04950b558834f5728517a/unityroom_production/game/23352/webgl/play.html",
        };
        child.page = { URL: "pages/Aseptickiss.html" };
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
        child.material.metalness = 0.5;
        child.material.roughness = 0.0;
        child.material.envMap = scene.background;
        child.name = "all_11";
        //child.userData = { URL: "" };
        child.page = { URL: "pages/Asako.html" };
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
        child.material.metalness = 0.5;
        child.name = "linda";
        child.userData = {
          URL: "https://sidngerigmailcom.itch.io/amysgame",
        };
        child.page = { URL: "pages/Amy.html" };
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
        child.material.metalness = 0.5;
        child.material.roughness = 0.0;
        child.material.envMap = scene.background;
        child.name = "blackdoorInside";
        child.userData = { URL: "http://www.realm-of-ember.space/" };
        child.page = { URL: "pages/Realm.html" };
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
  //吳柏瑤
  loader.load("wuscene_21.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.name = "wuscene_21";
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
    model.position.set(-300, 20, 100); // position here
    model.rotation.set(0, 340, 0); // position here
    scene.add(model);
  });
}

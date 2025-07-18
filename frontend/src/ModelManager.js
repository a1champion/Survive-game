import * as THREE from 'three';

class ModelManager {
  constructor(scene) {
    this.scene = scene;
    this.models = {};
    this.materials = {};
    this.init();
  }

  init() {
    // Create materials
    this.materials = {
      wood: new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
      stone: new THREE.MeshLambertMaterial({ color: 0x696969 }),
      metal: new THREE.MeshLambertMaterial({ color: 0x708090 }),
      leaves: new THREE.MeshLambertMaterial({ color: 0x228B22 }),
      bark: new THREE.MeshLambertMaterial({ color: 0x654321 }),
      fire: new THREE.MeshLambertMaterial({ color: 0xFF4500 }),
      worker: new THREE.MeshLambertMaterial({ color: 0x4169E1 }),
      skin: new THREE.MeshLambertMaterial({ color: 0xFFDBAC }),
      ground: new THREE.MeshLambertMaterial({ color: 0xF5F5DC })
    };
  }

  createWorkerStation(position) {
    const group = new THREE.Group();
    
    // Main building
    const buildingGeometry = new THREE.BoxGeometry(2, 1.5, 2);
    const building = new THREE.Mesh(buildingGeometry, this.materials.wood);
    building.position.set(0, 0.75, 0);
    building.castShadow = true;
    group.add(building);
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(1.5, 0.8, 4);
    const roof = new THREE.Mesh(roofGeometry, this.materials.stone);
    roof.position.set(0, 1.9, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);
    
    // Sign
    const signGeometry = new THREE.PlaneGeometry(0.8, 0.4);
    const signMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFACD });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, 1.2, 1.1);
    group.add(sign);
    
    group.position.set(position.x, 0, position.z);
    this.scene.add(group);
    return group;
  }

  createLumberjackArea(position) {
    const group = new THREE.Group();
    
    // Tree stump
    const stumpGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.4, 8);
    const stump = new THREE.Mesh(stumpGeometry, this.materials.bark);
    stump.position.set(0, 0.2, 0);
    stump.castShadow = true;
    group.add(stump);
    
    // Axe in stump
    const axeHandleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    const axeHandle = new THREE.Mesh(axeHandleGeometry, this.materials.wood);
    axeHandle.position.set(0, 0.5, 0);
    axeHandle.rotation.z = Math.PI / 6;
    group.add(axeHandle);
    
    const axeBladeGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const axeBlade = new THREE.Mesh(axeBladeGeometry, this.materials.metal);
    axeBlade.position.set(0.15, 0.8, 0);
    axeBlade.rotation.z = Math.PI / 6;
    group.add(axeBlade);
    
    // Wood pile
    for (let i = 0; i < 3; i++) {
      const logGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
      const log = new THREE.Mesh(logGeometry, this.materials.bark);
      log.position.set(0.5, 0.15, i * 0.3 - 0.3);
      log.rotation.z = Math.PI / 2;
      log.castShadow = true;
      group.add(log);
    }
    
    group.position.set(position.x, 0, position.z);
    this.scene.add(group);
    return group;
  }

  createCampfire(position) {
    const group = new THREE.Group();
    
    // Fire pit base
    const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 8);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.1, 0);
    group.add(base);
    
    // Logs around fire
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const logGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
      const log = new THREE.Mesh(logGeometry, this.materials.bark);
      log.position.set(Math.cos(angle) * 0.4, 0.1, Math.sin(angle) * 0.4);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = angle;
      log.castShadow = true;
      group.add(log);
    }
    
    // Fire
    const fireGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
    const fire = new THREE.Mesh(fireGeometry, this.materials.fire);
    fire.position.set(0, 0.6, 0);
    fire.castShadow = true;
    group.add(fire);
    
    // Sparks/embers
    const sparksGeometry = new THREE.SphereGeometry(0.02, 4, 4);
    const sparksMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    for (let i = 0; i < 8; i++) {
      const spark = new THREE.Mesh(sparksGeometry, sparksMaterial);
      spark.position.set(
        (Math.random() - 0.5) * 0.6,
        Math.random() * 0.5 + 0.5,
        (Math.random() - 0.5) * 0.6
      );
      group.add(spark);
    }
    
    group.position.set(position.x, 0, position.z);
    this.scene.add(group);
    return group;
  }

  createTree(position) {
    const group = new THREE.Group();
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.25, 2, 8);
    const trunk = new THREE.Mesh(trunkGeometry, this.materials.bark);
    trunk.position.set(0, 1, 0);
    trunk.castShadow = true;
    group.add(trunk);
    
    // Leaves (multiple layers)
    for (let i = 0; i < 3; i++) {
      const leavesGeometry = new THREE.ConeGeometry(0.8 - i * 0.2, 1.2, 8);
      const leaves = new THREE.Mesh(leavesGeometry, this.materials.leaves);
      leaves.position.set(0, 2.5 + i * 0.5, 0);
      leaves.castShadow = true;
      group.add(leaves);
    }
    
    group.position.set(position.x, 0, position.z);
    this.scene.add(group);
    return group;
  }

  createWorker(position) {
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8);
    const body = new THREE.Mesh(bodyGeometry, this.materials.worker);
    body.position.set(0, 0.4, 0);
    body.castShadow = true;
    group.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const head = new THREE.Mesh(headGeometry, this.materials.skin);
    head.position.set(0, 0.9, 0);
    head.castShadow = true;
    group.add(head);
    
    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
    const leftArm = new THREE.Mesh(armGeometry, this.materials.skin);
    leftArm.position.set(-0.3, 0.4, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, this.materials.skin);
    rightArm.position.set(0.3, 0.4, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    group.add(rightArm);
    
    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8);
    const leftLeg = new THREE.Mesh(legGeometry, this.materials.worker);
    leftLeg.position.set(-0.1, 0.2, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, this.materials.worker);
    rightLeg.position.set(0.1, 0.2, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    
    group.position.set(position.x, 0, position.z);
    this.scene.add(group);
    return group;
  }

  createStorage(position) {
    const group = new THREE.Group();
    
    // Main storage building
    const storageGeometry = new THREE.BoxGeometry(1.5, 1.8, 1.5);
    const storage = new THREE.Mesh(storageGeometry, this.materials.wood);
    storage.position.set(0, 0.9, 0);
    storage.castShadow = true;
    group.add(storage);
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(1.2, 0.6, 4);
    const roof = new THREE.Mesh(roofGeometry, this.materials.stone);
    roof.position.set(0, 2.1, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);
    
    // Barrels
    for (let i = 0; i < 3; i++) {
      const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8);
      const barrel = new THREE.Mesh(barrelGeometry, this.materials.wood);
      barrel.position.set(0.4, 0.2, i * 0.3 - 0.3);
      barrel.castShadow = true;
      group.add(barrel);
    }
    
    group.position.set(position.x, 0, position.z);
    this.scene.add(group);
    return group;
  }

  removeModel(model) {
    if (model && model.parent) {
      model.parent.remove(model);
    }
  }
}

export default ModelManager;
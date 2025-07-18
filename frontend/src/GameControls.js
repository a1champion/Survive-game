import * as THREE from 'three';

class GameControls {
  constructor(camera, renderer, gameLogic, modelManager) {
    this.camera = camera;
    this.renderer = renderer;
    this.gameLogic = gameLogic;
    this.modelManager = modelManager;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isDragging = false;
    this.dragStart = new THREE.Vector2();
    this.selectedObject = null;
    this.buildMode = null;
    this.ground = null;
    
    this.init();
  }

  init() {
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.renderer.domElement.addEventListener('wheel', this.onWheel.bind(this));
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setGround(ground) {
    this.ground = ground;
  }

  setBuildMode(buildingType) {
    this.buildMode = buildingType;
    this.renderer.domElement.style.cursor = buildingType ? 'crosshair' : 'default';
  }

  onMouseDown(event) {
    event.preventDefault();
    
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.dragStart.copy(this.mouse);
    this.isDragging = false;
    
    if (event.button === 0) { // Left click
      this.handleLeftClick();
    } else if (event.button === 2) { // Right click
      this.handleRightClick();
    }
  }

  onMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Check if we're dragging
    if (!this.isDragging) {
      const dragDistance = this.mouse.distanceTo(this.dragStart);
      if (dragDistance > 0.02) {
        this.isDragging = true;
      }
    }
    
    if (this.isDragging) {
      this.handleDrag();
    }
    
    // Show build preview
    if (this.buildMode && this.ground) {
      this.showBuildPreview();
    }
  }

  onMouseUp(event) {
    if (this.isDragging) {
      this.isDragging = false;
      return;
    }
    
    // Handle click actions
    if (event.button === 0 && this.buildMode) {
      this.handleBuildClick();
    } else if (event.button === 0) {
      this.handleSelection();
    }
  }

  onWheel(event) {
    event.preventDefault();
    
    const zoomSpeed = 0.1;
    const scale = event.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
    
    this.camera.position.multiplyScalar(scale);
    this.camera.position.y = Math.max(3, Math.min(20, this.camera.position.y));
  }

  handleLeftClick() {
    // Will be handled in onMouseUp if not dragging
  }

  handleRightClick() {
    // Cancel build mode or deselect
    if (this.buildMode) {
      this.setBuildMode(null);
    } else {
      this.selectedObject = null;
    }
  }

  handleDrag() {
    // Camera rotation around center
    const deltaX = this.mouse.x - this.dragStart.x;
    const deltaY = this.mouse.y - this.dragStart.y;
    
    // Rotate camera around origin
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(this.camera.position);
    
    spherical.theta -= deltaX * 2;
    spherical.phi += deltaY * 2;
    
    // Limit phi
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
    
    this.camera.position.setFromSpherical(spherical);
    this.camera.lookAt(0, 0, 0);
    
    this.dragStart.copy(this.mouse);
  }

  handleBuildClick() {
    if (!this.buildMode || !this.ground) return;
    
    const position = this.getGroundPosition();
    if (position && this.gameLogic.canBuild(this.buildMode)) {
      const building = this.gameLogic.buildStructure(this.buildMode, position);
      if (building) {
        this.createBuildingModel(building);
        this.setBuildMode(null);
      }
    }
  }

  handleSelection() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.modelManager.scene.children, true);
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      // Find the top-level group
      let parent = object;
      while (parent.parent && parent.parent !== this.modelManager.scene) {
        parent = parent.parent;
      }
      this.selectedObject = parent;
    } else {
      this.selectedObject = null;
    }
  }

  getGroundPosition() {
    if (!this.ground) return null;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.ground);
    
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  }

  showBuildPreview() {
    // This would show a preview of the building to be placed
    // For now, we'll just change the cursor
    this.renderer.domElement.style.cursor = this.gameLogic.canBuild(this.buildMode) ? 'crosshair' : 'not-allowed';
  }

  createBuildingModel(building) {
    let model;
    switch (building.type) {
      case 'worker':
        model = this.modelManager.createWorkerStation(building.position);
        break;
      case 'lumberjack':
        model = this.modelManager.createLumberjackArea(building.position);
        break;
      case 'storage':
        model = this.modelManager.createStorage(building.position);
        break;
      case 'campfire':
        model = this.modelManager.createCampfire(building.position);
        break;
    }
    
    if (model) {
      model.userData = { buildingId: building.id, type: 'building' };
    }
    
    return model;
  }

  update() {
    // Update any animations or continuous interactions
  }
}

export default GameControls;
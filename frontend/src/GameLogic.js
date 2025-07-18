import * as THREE from 'three';

class GameLogic {
  constructor() {
    this.gameState = {
      resources: {
        wood: 0,
        food: 0,
        workers: 1
      },
      buildings: [],
      workers: [
        {
          id: 1,
          type: 'idle',
          position: { x: -1, z: -1 },
          target: null,
          assignment: null
        }
      ],
      selectedWorker: null,
      selectedBuilding: null
    };
    
    this.buildingTypes = {
      worker: {
        name: 'Worker Station',
        cost: { wood: 5 },
        description: 'Assign workers to gather resources',
        capacity: 3
      },
      lumberjack: {
        name: 'Lumberjack Area',
        cost: { wood: 3 },
        description: 'Gather wood from trees',
        capacity: 2
      },
      storage: {
        name: 'Storage',
        cost: { wood: 8 },
        description: 'Store more resources',
        capacity: 1
      },
      campfire: {
        name: 'Campfire',
        cost: { wood: 2 },
        description: 'Keep warm and cook food',
        capacity: 1
      }
    };
  }

  canBuild(buildingType) {
    const building = this.buildingTypes[buildingType];
    if (!building) return false;
    
    for (const [resource, amount] of Object.entries(building.cost)) {
      if (this.gameState.resources[resource] < amount) {
        return false;
      }
    }
    return true;
  }

  buildStructure(buildingType, position) {
    if (!this.canBuild(buildingType)) return false;
    
    const building = this.buildingTypes[buildingType];
    
    // Deduct resources
    for (const [resource, amount] of Object.entries(building.cost)) {
      this.gameState.resources[resource] -= amount;
    }
    
    // Add building
    const newBuilding = {
      id: Date.now(),
      type: buildingType,
      position,
      workers: [],
      ...building
    };
    
    this.gameState.buildings.push(newBuilding);
    return newBuilding;
  }

  assignWorker(workerId, buildingId) {
    const worker = this.gameState.workers.find(w => w.id === workerId);
    const building = this.gameState.buildings.find(b => b.id === buildingId);
    
    if (!worker || !building) return false;
    if (building.workers.length >= building.capacity) return false;
    
    // Remove worker from previous assignment
    if (worker.assignment) {
      const oldBuilding = this.gameState.buildings.find(b => b.id === worker.assignment);
      if (oldBuilding) {
        oldBuilding.workers = oldBuilding.workers.filter(w => w !== workerId);
      }
    }
    
    // Assign to new building
    worker.assignment = buildingId;
    building.workers.push(workerId);
    worker.target = building.position;
    
    return true;
  }

  gatherResource(resourceType, amount = 1) {
    this.gameState.resources[resourceType] += amount;
  }

  update() {
    // Update worker positions and resource generation
    this.gameState.workers.forEach(worker => {
      if (worker.target) {
        // Move worker towards target
        const dx = worker.target.x - worker.position.x;
        const dz = worker.target.z - worker.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance > 0.1) {
          const speed = 0.02;
          worker.position.x += (dx / distance) * speed;
          worker.position.z += (dz / distance) * speed;
        }
      }
      
      // Generate resources based on assignment
      if (worker.assignment) {
        const building = this.gameState.buildings.find(b => b.id === worker.assignment);
        if (building) {
          const chance = 0.01; // 1% chance per frame
          if (Math.random() < chance) {
            switch (building.type) {
              case 'lumberjack':
                this.gatherResource('wood', 1);
                break;
              case 'worker':
                this.gatherResource('food', 1);
                break;
            }
          }
        }
      }
    });
  }

  getState() {
    return { ...this.gameState };
  }
}

export default GameLogic;
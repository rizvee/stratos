// js/config.js
const GameConfig = {
    TICKS_PER_SECOND: 10,
    INITIAL_ENERGY: 100,
    INITIAL_FOOD: 100,
    INITIAL_REPUTATION: 0,
    ROOFTOP_COMMUNE: 'zone-rooftop-commune',
    VERTICAL_FARM: 'zone-vertical-farm',
    UNDERGROUND_TRANSIT: 'zone-underground-transit',
    CYBER_ALLEY: 'zone-cyber-alley', // Added for completeness
    DRONE_PORT: 'zone-drone-port',     // Added
    LEGACY_CORE: 'zone-legacy-core',    // Added
    FACTIONS: {
        HARMONISTS: 'Harmonists',
        STREAMLINE: 'Streamline',
        NULL: 'Null'
    },
    ALL_ITEMS: [
        { id: 'eco_lamp', name: 'Eco Lamp', quantity: 1, type: 'furniture', svg: 'https://www.svgrepo.com/show/474979/lamp.svg', w:15, d:15, h:25},
        { id: 'hydro_plant_small', name: 'Small Hydroponic Plant', quantity: 2, type: 'plant', svg: 'https://www.svgrepo.com/show/508788/plant-pot-619.svg', w:20, d:20, h:20},
        { id: 'data_terminal', name: 'Data Terminal', quantity: 1, type: 'tech', svg: 'https://www.svgrepo.com/show/309428/terminal.svg', w:25, d:15, h:20},
        { id: 'basic_bed', name: 'Basic Bed', type: 'furniture', svg: 'https://www.svgrepo.com/show/291776/bed-bedroom.svg', w:40, d:25, h:15},
    ],
    ZONE_DATA: {
        'zone-rooftop-commune': { entryPoint: { x: 80, y: 80, z: 0 } },
        'zone-vertical-farm': { entryPoint: { x: 50, y: 250, z: 0 } },
        'zone-underground-transit': { entryPoint: { x: 70, y: 250, z: 0 } },
        'zone-cyber-alley': { entryPoint: { x: 30, y: 350, z: 0 } },
        'zone-drone-port': { entryPoint: {x: 50, y: 50, z:0 } },
        'zone-legacy-core': { entryPoint: {x:50, y:50, z:0 } }
    }
    // ... more configs
};
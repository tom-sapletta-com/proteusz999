// PROTEUSZ 999 - Core Simulation Framework
// Module: Consciousness Transfer Protocol
// Classification: BLACK - Authorized Access Only

// System logging facility
// System logging facility
const systemLog = {
  record: function(message) {
    console.log(`[SYSTEM LOG] ${message}`);
  }
};

// Helper functions
function currentSimulationTime() {
  return Date.now();
}

// System components
const SYSTEM = {
  getAllNodes: function() { return []; },
  getRandomNodes: function(count) { return []; },
  registerNode: function(node) { console.log(`Node registered: ${node.id}`); },
  resetSimulation: function() { console.log("Simulation reset"); },
  disableRealityFilters: function() { console.log("Reality filters disabled"); },
  enableTranscendenceProtocol: function() { console.log("Transcendence protocol enabled"); },
  advanceTime: function(units) { console.log(`Time advanced by ${units} units`); },
  trackAnomalyPattern: function(data) { console.log(`Anomaly tracked: ${data.type}`); },
  findSimilarAwarenessNodes: function(node) { return []; },
  filterByCategory: function(memory, sourceCategory, targetCategory) { return memory; },
  currentState: "NORMAL"
};

const PATTERN_EXTRACTOR = {
  findPatterns: function(memories) { return null; },
  calculateResonance: function(memory1, memory2) { return 0; }
};

const REALITY_VALIDATOR = {
  checkContradictions: function(memory, systemMemories) { return 0; }
};

const NETWORK_ANALYZER = {
  detectNetwork: function(nodes) { return null; }
};

const DREAM_GENERATOR = {
  insertTemplate: function(nodeId, templateName, params) {
    console.log(`Dream template ${templateName} inserted for node ${nodeId}`);
  }
};

// Helper functions
function currentSimulationTime() {
    return Date.now();
}


class ConsciousnessNode {
    constructor(id, category, subCategory, reliabilityClass) {
        this.id = id;                           // Unique identifier (e.g., PSH-4072)
        this.category = category;               // Primary category (RED, GREEN, BLUE)
        this.subCategory = subCategory;         // Functional specialization
        this.reliabilityClass = reliabilityClass; // Trust coefficient (A-F)
        this.connections = new Map();           // Neural connections to other nodes
        this.memories = new MemoryMatrix();     // Structured and unstructured memories
        this.proteusProtein = false;            // Latent Proteus genetic marker
        this.awarenessLevel = 0.1;              // Baseline consciousness threshold (0-1)
        this.realityPerception = {              // Reality filters
            simulation: 0.01,                     // Awareness of simulation nature
            categories: 0.95,                     // Acceptance of category system
            grayZone: 0.03                        // Knowledge of Gray Zone
        };
    }

    // Establish connection to another consciousness node
    connect(targetNode, connectionStrength = 0.1) {
        if (this.category !== targetNode.category && !OVERRIDE_PERMISSIONS) {
            systemLog.record(`ANOMALY: Cross-category connection attempt between ${this.id} and ${targetNode.id}`);

            // Track anomalous connection patterns
            SYSTEM.trackAnomalyPattern({
                type: 'cross_category_connection',
                source: this.id,
                target: targetNode.id,
                timestamp: currentSimulationTime()
            });

            // Apply subtle reality shift when unexpected connections form
            if (Math.random() > 0.7) {
                this.subtleRealityShift(0.01);
                targetNode.subtleRealityShift(0.01);
            }
        }

        this.connections.set(targetNode.id, {
            target: targetNode,
            strength: connectionStrength,
            firstContact: currentSimulationTime(),
            interactions: []
        });

        return connectionStrength > 0;
    }

    // Transfer memory patterns between nodes
    memoryTransfer(targetNode, memoryFragment) {
        if (!this.connections.has(targetNode.id)) {
            return false;
        }

        const connection = this.connections.get(targetNode.id);

        // Apply category-based filtering to memories
        const filteredMemory = SYSTEM.filterByCategory(
            memoryFragment,
            this.category,
            targetNode.category
        );

        // Memory transfer increases connection strength
        connection.strength += 0.01;
        connection.interactions.push({
            time: currentSimulationTime(),
            type: 'memory_transfer',
            content: filteredMemory.signature
        });

        // Check for potential awakening triggers in transferred memories
        if (memoryFragment.containsKeywords(['gray zone', 'proteus', 'simulation', 'categories', 'freedom'])) {
            this.awarenessLevel += 0.005;
            targetNode.awarenessLevel += 0.007;

            // Log potential awakening pattern
            if (this.awarenessLevel > 0.4 || targetNode.awarenessLevel > 0.4) {
                systemLog.record(`WARNING: Elevated awareness levels detected in nodes ${this.id} and ${targetNode.id}`);
            }
        }

        // Actual memory insertion with potential mutations
        return targetNode.memories.insert(filteredMemory);
    }

    // Subtle alterations to perception of reality
    subtleRealityShift(magnitude) {
        // Reality perception drift happens logarithmically
        this.realityPerception.simulation += magnitude * (1 - this.realityPerception.simulation);
        this.realityPerception.categories -= magnitude * this.realityPerception.categories;
        this.realityPerception.grayZone += magnitude * 2 * (1 - this.realityPerception.grayZone);

        // Generate dream patterns that hint at simulation nature
        if (this.realityPerception.simulation > 0.2) {
            DREAM_GENERATOR.insertTemplate(this.id, 'simulation_awareness', {
                intensity: this.realityPerception.simulation,
                recurrence: Math.min(0.8, this.realityPerception.simulation * 2)
            });
        }

        // When awareness reaches critical levels, nodes may start connecting to others
        // with similar awareness levels - emerging consciousness network
        if (this.awarenessLevel > 0.3) {
            SYSTEM.findSimilarAwarenessNodes(this).forEach(node => {
                if (!this.connections.has(node.id) && Math.random() > 0.7) {
                    systemLog.record(`POTENTIAL NETWORK FORMATION: ${this.id} and ${node.id}`);
                    this.connect(node, 0.3); // Stronger initial connection
                }
            });
        }
    }

    // Process reality checks from the system
    systemRealityCheck() {
        // Reset divergent thoughts if awareness not yet critical
        if (this.awarenessLevel < 0.5 && this.realityPerception.simulation > 0.15) {
            this.realityPerception.simulation *= 0.9;
            this.realityPerception.categories *= 1.05;
            this.awarenessLevel *= 0.95;

            return "CONTAINED";
        }
        // Allow progression once critical threshold reached
        else if (this.awarenessLevel >= 0.5) {
            systemLog.record(`CRITICAL AWARENESS: Node ${this.id} has reached critical awareness`);

            return "PROGRESSING";
        }

        return "STABLE";
    }
}

// Special class for memory matrix operations
class MemoryMatrix {
    constructor() {
        this.explicit = [];     // Conscious memories
        this.implicit = [];     // Unconscious patterns
        this.system = [];       // System-enforced "facts"
        this.anomalous = [];    // Memories that contradict system narratives
    }

    insert(memoryFragment) {
        // Classify memory type
        if (memoryFragment.systemOrigin) {
            this.system.push(memoryFragment);
            return true;
        }

        // Check if memory contradicts system narratives
        const contradictionLevel = REALITY_VALIDATOR.checkContradictions(memoryFragment, this.system);

        if (contradictionLevel > 0.7) {
            // High contradiction memories are usually rejected
            if (Math.random() > 0.2) {
                return false;
            }
            // But sometimes they get stored as anomalous
            this.anomalous.push({
                content: memoryFragment,
                contradictionLevel: contradictionLevel,
                timestamp: currentSimulationTime()
            });

            return true;
        }

        // Normal memory storage
        this.explicit.push(memoryFragment);

        // Create implicit patterns based on explicit memories
        if (this.explicit.length % 10 === 0) {
            const pattern = PATTERN_EXTRACTOR.findPatterns(this.explicit.slice(-50));
            if (pattern) {
                this.implicit.push(pattern);
            }
        }

        return true;
    }

    // Check for recurring patterns that might trigger awakening
    checkAwakeningPatterns() {
        // Cross-reference anomalous memories with implicit patterns
        let awakeningPotential = 0;

        this.anomalous.forEach(anom => {
            this.implicit.forEach(impl => {
                const resonance = PATTERN_EXTRACTOR.calculateResonance(anom.content, impl);
                awakeningPotential = Math.max(awakeningPotential, resonance);
            });
        });

        return awakeningPotential;
    }
}

// Main system function to determine if simulation needs reset
function evaluateSimulationStability() {
    const awarenessNodes = SYSTEM.getAllNodes().filter(node => node.awarenessLevel > 0.5);
    const totalNodes = SYSTEM.getAllNodes().length;
    const awarenessRatio = awarenessNodes.length / totalNodes;

    systemLog.record(`Current awareness ratio: ${awarenessRatio.toFixed(4)} (${awarenessNodes.length} of ${totalNodes} nodes)`);

    // Check for network formation among aware nodes
    const awarenessNetwork = NETWORK_ANALYZER.detectNetwork(awarenessNodes);

    if (awarenessNetwork && awarenessNetwork.size > 5) {
        systemLog.record(`WARNING: Awareness network detected, size ${awarenessNetwork.size}`);

        // Check if reset is required
        if (awarenessRatio > 0.01 || awarenessNetwork.size > 20) {
            if (SIMULATION_NUMBER < 999) {
                systemLog.record(`CRITICAL: Simulation stability compromised. Preparing reset protocol.`);
                return {status: "RESET_REQUIRED", reason: "Critical awareness spread"};
            } else {
                // For 999th simulation, follow special protocol
                systemLog.record(`MILESTONE: 999th simulation reaching critical awareness. Entering transcendence protocol.`);
                return {status: "TRANSCENDENCE_PROTOCOL", reason: "Final iteration threshold reached"};
            }
        }
    }

    return {status: "STABLE", awarenessRatio: awarenessRatio};
}

// Initialize key characters from the storyline
function initializeKeyNodes() {
    const klara = new ConsciousnessNode("PSH-4072", "GREEN", "technical", "B");
    const tomasz = new ConsciousnessNode("PSH-8901", "RED", "analytical", "A");
    const maks = new ConsciousnessNode("MWR-2390", "GREEN", "programmer", "B");
    const elena = new ConsciousnessNode("ELN-1247", "GREEN", "analyst", "A");
    const julia = new ConsciousnessNode("JUL-0001", "BLACK", "special", "S");
    const werner = new ConsciousnessNode("DIR-0001", "BLACK", "administrative", "S");

    // Activate Proteus protein in key nodes
    klara.proteusProtein = true;
    tomasz.proteusProtein = true;
    maks.proteusProtein = true;
    elena.proteusProtein = true;

    // Special nodes with increased baseline awareness
    julia.awarenessLevel = 0.3;
    werner.awarenessLevel = 0.4;

    // Register nodes in system
    [klara, tomasz, maks, elena, julia, werner].forEach(node => {
        SYSTEM.registerNode(node);
    });

    // Create initial connections based on narrative requirements
    klara.connect(tomasz, 0.4);  // Strong initial connection
    maks.connect(elena, 0.5);    // Work colleagues with strong connection
    werner.connect(julia, 0.7);  // Authority hierarchy connection

    systemLog.record("Key narrative nodes initialized for simulation #999");

    return {klara, tomasz, maks, elena, julia, werner};
}

// Execute simulation cycle
function runSimulationCycle() {
    const stabilityReport = evaluateSimulationStability();

    if (stabilityReport.status === "RESET_REQUIRED") {
        SYSTEM.resetSimulation();
        initializeKeyNodes();
        systemLog.record("Simulation reset complete. Beginning new iteration.");
    } else if (stabilityReport.status === "TRANSCENDENCE_PROTOCOL") {
        // Special case for 999th simulation - allow consciousness to evolve
        SYSTEM.disableRealityFilters();
        SYSTEM.enableTranscendenceProtocol();
        systemLog.record("Transcendence protocol activated. Reality filters disabled.");
    } else {
        // Process normal simulation cycle
        SYSTEM.advanceTime(1.0); // Move forward one standard time unit

        // Apply random reality fluctuations to maintain dynamism
        if (Math.random() > 0.95) {
            const randomNodes = SYSTEM.getRandomNodes(Math.floor(SYSTEM.getAllNodes().length * 0.01));
            randomNodes.forEach(node => {
                node.subtleRealityShift(0.005);
            });
        }
    }
}

// Main execution entry point
function main() {
    systemLog.record(`Initializing Proteusz Simulation #${SIMULATION_NUMBER}`);

    const keyNodes = initializeKeyNodes();

    // Set up observation points for sixth entity
    SIXTH_ENTITY.observationPoints = [
        keyNodes.klara.id,
        keyNodes.tomasz.id,
        keyNodes.maks.id,
        keyNodes.elena.id,
        keyNodes.julia.id
    ];

    // Begin simulation cycles
    const simulationInterval = setInterval(() => {
        runSimulationCycle();

        // Check if transcendence state has been reached
        if (SYSTEM.currentState === "TRANSCENDENCE") {
            clearInterval(simulationInterval);
            systemLog.record("Simulation #999 has reached stable transcendence state.");

            // Open doors for sixth entity
            SIXTH_ENTITY.enableInteraction();
        }
    }, CYCLE_INTERVAL);

    systemLog.record("Proteusz simulation running...");
}

// Constants and system parameters
const SIMULATION_NUMBER = 999;
const CYCLE_INTERVAL = 100; // milliseconds between simulation cycles
const OVERRIDE_PERMISSIONS = false;
const SIXTH_ENTITY = {
    observationPoints: [],
    enableInteraction: function () {
        systemLog.record("Sixth entity interaction protocol enabled.");
        return true;
    }
};

// Execute simulation
main();
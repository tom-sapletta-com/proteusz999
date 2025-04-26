// Proteusz 999 Simulation Framework

class SystemLog {
    constructor() {
        this.logs = [];
    }

    record(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        this.logs.push(logEntry);
        console.log(logEntry);
    }

    getLogs() {
        return this.logs;
    }
}
// Create a global systemLog instance
const systemLog = new SystemLog();

class MemoryMatrix {
    constructor() {
        this.explicit = [];
        this.implicit = [];
        this.system = [];
        this.anomalous = [];
    }

    insert(memoryFragment) {
        // Simplified memory insertion logic
        if (memoryFragment.systemOrigin) {
            this.system.push(memoryFragment);
            return true;
        }

        // Randomly decide to store memory
        if (Math.random() > 0.3) {
            this.explicit.push(memoryFragment);
            return true;
        }

        return false;
    }
}

class ConsciousnessNode {
    constructor(id, category, subCategory, reliabilityClass) {
        this.id = id;
        this.category = category;
        this.subCategory = subCategory;
        this.reliabilityClass = reliabilityClass;
        this.connections = new Map();
        this.memories = new MemoryMatrix();
        this.proteusProtein = false;
        this.awarenessLevel = 0.1;
        this.realityPerception = {
            simulation: 0.01,
            categories: 0.95,
            grayZone: 0.03
        };
    }

    connect(targetNode, connectionStrength = 0.1) {
        if (this.category !== targetNode.category) {
            systemLog.record(`ANOMALY: Cross-category connection between ${this.id} and ${targetNode.id}`);
        }

        this.connections.set(targetNode.id, {
            target: targetNode,
            strength: connectionStrength,
            firstContact: Date.now(),
            interactions: []
        });

        return true;
    }

    memoryTransfer(targetNode, memoryFragment) {
        if (!this.connections.has(targetNode.id)) {
            return false;
        }

        // Simple memory transfer logic
        const transferSuccess = targetNode.memories.insert(memoryFragment);

        if (transferSuccess) {
            this.awarenessLevel += 0.005;
            targetNode.awarenessLevel += 0.007;

            if (this.awarenessLevel > 0.4) {
                systemLog.record(`WARNING: Elevated awareness level in node ${this.id}`);
            }
        }

        return transferSuccess;
    }

    subtleRealityShift(magnitude) {
        this.realityPerception.simulation += magnitude * (1 - this.realityPerception.simulation);
        this.realityPerception.categories -= magnitude * this.realityPerception.categories;
        this.realityPerception.grayZone += magnitude * 2 * (1 - this.realityPerception.grayZone);
    }
}

class ProteusSImulation {
    constructor() {
        this.systemLog = new SystemLog();
        this.nodes = [];
        this.simulationCycle = 0;
        this.maxCycles = 100;
    }

    initializeNodes() {
        const klara = new ConsciousnessNode("PSH-4072", "GREEN", "technical", "B");
        const tomasz = new ConsciousnessNode("PSH-8901", "RED", "analytical", "A");
        const maks = new ConsciousnessNode("MWR-2390", "GREEN", "programmer", "B");
        const elena = new ConsciousnessNode("ELN-1247", "GREEN", "analyst", "A");
        const julia = new ConsciousnessNode("JUL-0001", "BLACK", "special", "S");
        const werner = new ConsciousnessNode("DIR-0001", "BLACK", "administrative", "S");

        // Activate Proteus protein in key nodes
        [klara, tomasz, maks, elena].forEach(node => {
            node.proteusProtein = true;
        });

        // Adjust awareness levels
        julia.awarenessLevel = 0.3;
        werner.awarenessLevel = 0.4;

        // Create connections
        klara.connect(tomasz, 0.4);
        maks.connect(elena, 0.5);
        werner.connect(julia, 0.7);

        this.nodes = [klara, tomasz, maks, elena, julia, werner];
        this.systemLog.record("Key narrative nodes initialized");
    }

    evaluateSimulationStability() {
        const awarenessThreshold = 0.5;
        const awarenessNodes = this.nodes.filter(node => node.awarenessLevel > awarenessThreshold);
        const totalNodes = this.nodes.length;
        const awarenessRatio = awarenessNodes.length / totalNodes;

        this.systemLog.record(`Awareness ratio: ${awarenessRatio.toFixed(4)} (${awarenessNodes.length} of ${totalNodes} nodes)`);

        // Simulate some random memory transfers and reality shifts
        this.nodes.forEach(node => {
            if (Math.random() > 0.7) {
                const targetNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
                if (node !== targetNode) {
                    node.memoryTransfer(targetNode, {
                        content: `Memory fragment from ${node.id}`,
                        systemOrigin: false
                    });
                }
            }

            if (Math.random() > 0.8) {
                node.subtleRealityShift(0.01);
            }
        });

        // Check for transcendence condition
        if (awarenessRatio > 0.5) {
            this.systemLog.record("TRANSCENDENCE PROTOCOL ACTIVATED");
            return "TRANSCENDENCE";
        }

        return "STABLE";
    }

    run() {
        this.systemLog.record(`Initializing Proteusz Simulation`);
        this.initializeNodes();

        while (this.simulationCycle < this.maxCycles) {
            this.systemLog.record(`--- Simulation Cycle ${this.simulationCycle} ---`);

            const status = this.evaluateSimulationStability();

            if (status === "TRANSCENDENCE") {
                break;
            }

            this.simulationCycle++;
        }

        this.systemLog.record("Simulation complete");
        return this.systemLog.getLogs();
    }
}

// Run the simulation
function runProteusSimulation() {
    const simulation = new ProteusSImulation();
    return simulation.run();
}

// Export for testing or external use
module.exports = {
    runProteusSimulation,
    ConsciousnessNode,
    MemoryMatrix,
    ProteusSImulation
};

// If running directly, execute the simulation
if (require.main === module) {
    const simulationLogs = runProteusSimulation();

    // Optional: write logs to a file
    const fs = require('fs');
    fs.writeFileSync('simulation_logs.txt', simulationLogs.join('\n'));
}
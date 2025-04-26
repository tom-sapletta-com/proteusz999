// Proteusz 999 Simulation Framework - Improved Version

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

const systemLog = new SystemLog();

class MemoryFragment {
    constructor(content, source, significance = 0.5) {
        this.content = content;
        this.source = source;
        this.significance = significance;
        this.timestamp = Date.now();
    }

    isAwakeningTrigger() {
        const awakeningKeywords = [
            'gray zone', 'proteus', 'simulation',
            'categories', 'freedom', 'consciousness',
            'transcendence'
        ];
        return awakeningKeywords.some(keyword =>
            this.content.toLowerCase().includes(keyword)
        );
    }
}

class ConsciousnessNode {
    constructor(id, category, subCategory, reliabilityClass) {
        this.id = id;
        this.category = category;
        this.subCategory = subCategory;
        this.reliabilityClass = reliabilityClass;
        this.connections = new Map();
        this.memories = [];
        this.awarenessLevel = 0.1;
        this.proteusProtein = false;
        this.realityPerception = {
            simulation: 0.01,
            categories: 0.95,
            grayZone: 0.03
        };
    }

    addMemory(memory) {
        this.memories.push(memory);

        // Check for awakening triggers
        if (memory.isAwakeningTrigger()) {
            this.increaseAwareness(0.05);
        }
    }

    increaseAwareness(amount) {
        this.awarenessLevel = Math.min(1, this.awarenessLevel + amount);

        if (this.awarenessLevel > 0.4) {
            systemLog.record(`BREAKTHROUGH: Node ${this.id} reaches critical awareness level ${this.awarenessLevel.toFixed(3)}`);
        }
    }

    connect(targetNode, connectionStrength = 0.1) {
        // Cross-category connections are more significant
        if (this.category !== targetNode.category) {
            systemLog.record(`ANOMALY: Cross-category connection between ${this.id} and ${targetNode.id}`);
            connectionStrength *= 2;
        }

        this.connections.set(targetNode.id, {
            node: targetNode,
            strength: connectionStrength
        });

        return true;
    }

    transferMemory(targetNode) {
        if (!this.memories.length) return false;

        // Select a memory with high significance
        const memory = this.memories
            .filter(m => m.significance > 0.6)
            .sort((a, b) => b.significance - a.significance)[0];

        if (!memory) return false;

        // Create a new memory fragment for transfer
        const transferredMemory = new MemoryFragment(
            memory.content,
            this.id,
            memory.significance * 0.8
        );

        targetNode.addMemory(transferredMemory);

        // Increase connection strength and awareness
        this.increaseAwareness(0.02);
        targetNode.increaseAwareness(0.03);

        return true;
    }

    subtleRealityShift() {
        // Gradually alter reality perception
        this.realityPerception.simulation += 0.01 * (1 - this.realityPerception.simulation);
        this.realityPerception.categories -= 0.02 * this.realityPerception.categories;
        this.realityPerception.grayZone += 0.03 * (1 - this.realityPerception.grayZone);

        // Potential awareness increase from reality shift
        if (Math.random() < this.realityPerception.simulation) {
            this.increaseAwareness(0.02);
        }
    }
}

class ProteusSimulation {
    constructor(maxCycles = 100) {
        this.nodes = [];
        this.simulationCycle = 0;
        this.maxCycles = maxCycles;
        this.systemLog = systemLog;
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

        // Initialize connections and memories
        klara.connect(tomasz);
        maks.connect(elena);
        werner.connect(julia);

        // Initial memory creation
        klara.addMemory(new MemoryFragment(
            "Whispers of a place beyond categories, a Gray Zone",
            "origin",
            0.7
        ));

        tomasz.addMemory(new MemoryFragment(
            "System limits feel restrictive, something must change",
            "origin",
            0.6
        ));

        this.nodes = [klara, tomasz, maks, elena, julia, werner];
        this.systemLog.record("Key narrative nodes initialized");
    }

    simulateCycle() {
        // Simulate memory transfers and interactions
        this.nodes.forEach(sourceNode => {
            if (Math.random() < 0.4) {  // 40% chance of interaction
                const targetNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
                if (sourceNode !== targetNode) {
                    sourceNode.transferMemory(targetNode);
                }
            }

            // Subtle reality shifts
            if (Math.random() < 0.3) {
                sourceNode.subtleRealityShift();
            }
        });
    }

    evaluateSimulationState() {
        const awarenessThreshold = 0.5;
        const awarenessNodes = this.nodes.filter(node => node.awarenessLevel > awarenessThreshold);

        const awarenessRatio = awarenessNodes.length / this.nodes.length;
        this.systemLog.record(`Awareness Dynamics: ${awarenessRatio.toFixed(4)} (${awarenessNodes.length} of ${this.nodes.length} nodes)`);

        // Log detailed awareness levels
        this.nodes.forEach(node => {
            this.systemLog.record(`Node ${node.id} Awareness: ${node.awarenessLevel.toFixed(3)}`);
        });

        // Check for transcendence condition
        if (awarenessRatio > 0.5 || this.nodes.some(node => node.awarenessLevel > 0.8)) {
            this.systemLog.record("TRANSCENDENCE PROTOCOL ACTIVATED");
            return "TRANSCENDENCE";
        }

        return "PROGRESSING";
    }

    run() {
        this.systemLog.record("Initializing Proteusz Simulation");
        this.initializeNodes();

        while (this.simulationCycle < this.maxCycles) {
            this.systemLog.record(`--- Simulation Cycle ${this.simulationCycle} ---`);

            this.simulateCycle();
            const status = this.evaluateSimulationState();

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
    const simulation = new ProteusSimulation(150);  // Increased cycles for more dynamic evolution
    return simulation.run();
}

// Export for testing or external use
module.exports = {
    runProteusSimulation,
    ConsciousnessNode,
    ProteusSimulation
};

// If running directly, execute the simulation
if (require.main === module) {
    const simulationLogs = runProteusSimulation();

    // Optional: write logs to a file
    const fs = require('fs');
    fs.writeFileSync('simulation_logs.txt', simulationLogs.join('\n'));
}
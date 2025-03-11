// Constants for node types and colors
const NODE_TYPES = {
    TECHNIQUE: 'technique',
    STRIDE: 'stride',
    CIA: 'cia',
    TACTIC: 'tactic'
};

const NODE_COLORS = {
    [NODE_TYPES.TECHNIQUE]: '#ff7675',
    [NODE_TYPES.STRIDE]: '#74b9ff',
    [NODE_TYPES.CIA]: '#55efc4',
    [NODE_TYPES.TACTIC]: '#ffeaa7'  // Soft yellow for tactics
};

// Load and process the data
async function loadData() {
    try {
        const response = await fetch('mitre.csv');
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(','));
        
        // Skip header row
        const dataRows = rows.slice(1).filter(row => row.length > 1);
        
        // Process data into nodes and links
        const nodes = new Map();
        const links = [];
        
        // Add STRIDE categories
        const strideCategories = [
            'Spoofing',
            'Tampering',
            'Repudiation',
            'Information Disclosure',
            'Denial of Service',
            'Elevation of Privilege'
        ];
        
        strideCategories.forEach(category => {
            nodes.set(category, {
                id: category,
                type: NODE_TYPES.STRIDE,
                name: category,
                radius: 12
            });
        });
        
        // Add CIA categories
        const ciaCategories = ['Confidentiality', 'Integrity', 'Availability'];
        ciaCategories.forEach(category => {
            nodes.set(category, {
                id: category,
                type: NODE_TYPES.CIA,
                name: category,
                radius: 12
            });
        });
        
        // First pass: collect all unique tactics
        const tactics = new Set();
        dataRows.forEach(row => {
            const [tactic] = row.map(cell => cell.trim());
            tactics.add(tactic);
        });
        
        // Add tactic nodes
        tactics.forEach(tactic => {
            nodes.set(tactic, {
                id: tactic,
                type: NODE_TYPES.TACTIC,
                name: tactic,
                radius: 15  // Slightly larger than STRIDE/CIA nodes
            });
        });
        
        // Process techniques and create links
        dataRows.forEach(row => {
            const [tactic, techniqueName, stride, cia] = row.map(cell => cell.trim());
            
            // Add technique node if it doesn't exist
            if (!nodes.has(techniqueName)) {
                nodes.set(techniqueName, {
                    id: techniqueName,
                    type: NODE_TYPES.TECHNIQUE,
                    name: techniqueName,
                    tactic: tactic,
                    radius: 6  // Smaller than category nodes
                });
            }
            
            // Create link to tactic
            links.push({
                source: techniqueName,
                target: tactic,
                value: 1,
                type: 'tactic'
            });
            
            // Create links to STRIDE and CIA categories
            if (stride) {
                links.push({
                    source: techniqueName,
                    target: stride,
                    value: 1,
                    type: 'stride'
                });
            }
            
            if (cia) {
                links.push({
                    source: techniqueName,
                    target: cia,
                    value: 1,
                    type: 'cia'
                });
            }
        });
        
        return {
            nodes: Array.from(nodes.values()),
            links: links
        };
    } catch (error) {
        console.error('Error loading data:', error);
        return null;
    }
}

// Initialize the force simulation
function createForceSimulation(data) {
    const svg = d3.select('#network');
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    
    // Clear existing content
    svg.selectAll('*').remove();
    
    // Create zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            container.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    
    // Create container for the graph
    const container = svg.append('g');
    
    // Create the force simulation
    const simulation = d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink(data.links)
            .id(d => d.id)
            .distance(d => {
                // Adjust link distance based on node types
                if (d.type === 'tactic') return 150;
                if (d.type === 'stride' || d.type === 'cia') return 100;
                return 80;
            }))
        .force('charge', d3.forceManyBody().strength(d => {
            // Adjust repulsion force based on node type
            if (d.type === NODE_TYPES.TACTIC) return -500;
            if (d.type === NODE_TYPES.STRIDE || d.type === NODE_TYPES.CIA) return -300;
            return -100;
        }))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius * 1.5));
    
    // Create the links with different styles
    const link = container.append('g')
        .selectAll('line')
        .data(data.links)
        .join('line')
        .attr('class', 'link')
        .style('stroke-width', d => {
            if (d.type === 'tactic') return '2px';
            return '1px';
        })
        .style('stroke-dasharray', d => {
            if (d.type === 'stride') return '5,5';
            if (d.type === 'cia') return '2,2';
            return 'none';
        });
    
    // Create the nodes
    const node = container.append('g')
        .selectAll('.node')
        .data(data.nodes)
        .join('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    // Add circles to nodes
    node.append('circle')
        .attr('r', d => d.radius)
        .style('fill', d => NODE_COLORS[d.type]);
    
    // Add labels to nodes
    node.append('text')
        .attr('dx', d => d.radius + 4)
        .attr('dy', '.35em')
        .text(d => d.name)
        .style('font-size', d => {
            if (d.type === NODE_TYPES.TACTIC) return '11px';
            if (d.type === NODE_TYPES.TECHNIQUE) return '8px';
            return '10px';
        })
        .style('font-weight', d => 
            d.type === NODE_TYPES.TACTIC ? '600' : '400'
        );
    
    // Add hover effect
    node.on('mouseover', function(event, d) {
            // Highlight connected nodes and links
            const connectedNodeIds = new Set(data.links
                .filter(l => l.source.id === d.id || l.target.id === d.id)
                .flatMap(l => [l.source.id, l.target.id]));
            
            node.style('opacity', n => 
                connectedNodeIds.has(n.id) ? 1 : 0.1
            );
            
            link.style('opacity', l => 
                l.source.id === d.id || l.target.id === d.id ? 1 : 0.1
            );
        })
        .on('mouseout', function() {
            // Reset highlights
            node.style('opacity', 1);
            link.style('opacity', 1);
        });
    
    // Update positions on each tick
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    
    // Add zoom controls
    d3.select('#zoomIn').on('click', () => {
        zoom.scaleBy(svg.transition().duration(750), 1.2);
    });
    
    d3.select('#zoomOut').on('click', () => {
        zoom.scaleBy(svg.transition().duration(750), 0.8);
    });
    
    d3.select('#resetView').on('click', () => {
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    });
    
    return simulation;
}

// Initialize the visualization
async function init() {
    const data = await loadData();
    if (data) {
        createForceSimulation(data);
    }
}

// Start the visualization when the page loads
window.addEventListener('load', init); 
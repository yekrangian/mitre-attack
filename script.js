// Function to fetch and parse CSV data
async function loadMitreData() {
    try {
        const response = await fetch('mitre.csv');
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(','));
        
        // Skip header row
        const dataRows = rows.slice(1).filter(row => row.length > 1);
        
        // Process the data into our required format
        const tacticsMap = new Map();
        
        dataRows.forEach(row => {
            const [tactic, techniqueId, techniqueName, subTechniqueCount] = row.map(cell => cell.trim());
            
            if (!tacticsMap.has(tactic)) {
                tacticsMap.set(tactic, {
                    techniques: [],
                    count: 0
                });
            }
            
            const tacticData = tacticsMap.get(tactic);
            tacticData.techniques.push({
                id: techniqueId,
                name: techniqueName,
                subTechniqueCount: subTechniqueCount || ''
            });
            tacticData.count++;
        });
        
        return Array.from(tacticsMap.entries()).map(([name, data]) => ({
            name,
            count: `${data.count} techniques`,
            techniques: data.techniques
        }));
    } catch (error) {
        console.error('Error loading MITRE data:', error);
        return null;
    }
}

// DOM Elements
const matrixContainer = document.querySelector('.matrix-container');
const toggleButton = document.getElementById('toggleSubTechniques');
const layoutSelect = document.getElementById('layoutSelect');

let showSubTechniques = false;

// Initialize the matrix
async function initializeMatrix() {
    const container = document.querySelector('.matrix-container');
    container.innerHTML = '<div class="loading">Loading ATT&CK Matrix data...</div>';
    
    const tactics = await loadMitreData();
    if (!tactics) {
        container.innerHTML = '<div class="error">Error loading ATT&CK Matrix data</div>';
        return;
    }
    
    container.innerHTML = '';
    tactics.forEach(tactic => {
        container.appendChild(createTacticColumn(tactic));
    });
}

// Create a column for each tactic
function createTacticColumn(tactic) {
    const column = document.createElement('div');
    column.className = 'tactic-column';
    
    const header = document.createElement('div');
    header.className = 'tactic-header';
    
    const name = document.createElement('div');
    name.className = 'tactic-name';
    name.textContent = tactic.name;
    
    const count = document.createElement('div');
    count.className = 'tactic-count';
    count.textContent = tactic.count;
    
    header.appendChild(name);
    header.appendChild(count);
    column.appendChild(header);
    
    tactic.techniques.forEach(technique => {
        column.appendChild(createTechniqueElement(technique));
    });
    
    return column;
}

// Create an element for each technique
function createTechniqueElement(technique) {
    const element = document.createElement('div');
    element.className = 'technique';
    
    const id = document.createElement('div');
    id.className = 'technique-id';
    id.textContent = technique.id;
    
    const name = document.createElement('div');
    name.className = 'technique-name';
    name.textContent = technique.name;
    
    if (technique.subTechniqueCount) {
        name.textContent += ` ${technique.subTechniqueCount}`;
    }
    
    element.appendChild(id);
    element.appendChild(name);
    
    element.addEventListener('click', () => {
        element.classList.toggle('selected');
    });
    
    return element;
}

// Event Listeners
toggleButton.addEventListener('click', () => {
    showSubTechniques = !showSubTechniques;
    toggleButton.textContent = showSubTechniques ? 'Hide Sub-techniques' : 'Show Sub-techniques';
    // Update matrix display based on sub-techniques visibility
});

layoutSelect.addEventListener('change', (e) => {
    const layout = e.target.value;
    matrixContainer.className = `matrix-container layout-${layout}`;
});

// Initialize the matrix when the page loads
document.addEventListener('DOMContentLoaded', initializeMatrix);

// Handle control buttons
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function() {
        if (this.textContent.includes('layout')) {
            document.querySelectorAll('.btn').forEach(b => {
                if (b.textContent.includes('layout')) {
                    b.classList.remove('active');
                }
            });
        } else if (this.textContent.includes('sub-techniques')) {
            document.querySelectorAll('.btn').forEach(b => {
                if (b.textContent.includes('sub-techniques')) {
                    b.classList.remove('active');
                }
            });
        }
        this.classList.add('active');
    });
});

// Add dropdown functionality
document.querySelectorAll('.dropdown').forEach(dropdown => {
    dropdown.addEventListener('click', (e) => {
        e.preventDefault();
        // Add dropdown menu functionality here
    });
});

// Add search functionality
const searchInput = document.querySelector('.search input');
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    // Add search functionality here
}); 
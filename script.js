// Theme toggle functionality
function initializeTheme() {
    const themeToggle = document.querySelector('.theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDarkScheme.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // Toggle theme
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
    
    // Listen for system theme changes
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTheme);

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
            const [tactic, techniqueName, stride, cia] = row.map(cell => cell.trim());
            
            if (!tacticsMap.has(tactic)) {
                tacticsMap.set(tactic, {
                    name: tactic,
                    techniques: [],
                    count: 0
                });
            }
            
            const tacticData = tacticsMap.get(tactic);
            tacticData.techniques.push({
                id: `T${(tacticData.count + 1).toString().padStart(4, '0')}`,
                name: techniqueName,
                stride: stride || '',
                cia: cia || ''
            });
            tacticData.count++;
        });
        
        // Convert map to array and format the data
        return Array.from(tacticsMap.values()).map(tactic => ({
            name: tactic.name,
            count: `${tactic.count} techniques`,
            techniques: tactic.techniques
        }));
    } catch (error) {
        console.error('Error loading MITRE data:', error);
        return null;
    }
}

// Function to create the matrix
async function createMatrix() {
    const container = document.querySelector('.matrix-container');
    container.innerHTML = '<div class="loading">Loading ATT&CK Matrix data...</div>';
    
    const tactics = await loadMitreData();
    if (!tactics) {
        container.innerHTML = '<div class="error">Error loading ATT&CK Matrix data</div>';
        return;
    }
    
    container.innerHTML = '';
    tactics.forEach(tactic => {
        const column = document.createElement('div');
        column.className = 'tactic-column';
        
        // Use the new header creation function
        const header = createTacticHeader(tactic);
        
        // Add techniques
        const techniquesList = document.createElement('div');
        techniquesList.className = 'techniques-list';
        
        tactic.techniques.forEach(technique => {
            const techniqueElement = document.createElement('div');
            techniqueElement.className = 'technique';
            techniqueElement.innerHTML = `
                <div class="technique-content">
                    <div class="technique-name">${technique.name}</div>
                    <div class="tags-container">
                        <div class="tags-row">
                            ${technique.stride ? `<div class="stride-tag" data-category="${technique.stride}">${technique.stride}</div>` : ''}
                        </div>
                        <div class="tags-row">
                            ${technique.cia ? `<div class="cia-tag" data-category="${technique.cia}">${technique.cia}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
            techniquesList.appendChild(techniqueElement);
        });
        
        column.appendChild(header);
        column.appendChild(techniquesList);
        container.appendChild(column);
    });
}

// Initialize the matrix when the page loads
document.addEventListener('DOMContentLoaded', createMatrix);

const STRIDE_CATEGORIES = [
    'Spoofing',
    'Tampering',
    'Repudiation',
    'Information Disclosure',
    'Denial of Service',
    'Elevation of Privilege'
];

const CIA_CATEGORIES = [
    'Confidentiality',
    'Integrity',
    'Availability'
];

function filterTechniques() {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase().trim();
    const strideFilter = document.querySelector('#strideFilter').value.toLowerCase().trim();
    const ciaFilter = document.querySelector('#ciaFilter').value.toLowerCase().trim();
    
    document.querySelectorAll('.technique').forEach(technique => {
        const techniqueName = technique.querySelector('.technique-name').textContent.toLowerCase();
        const techniqueStride = technique.querySelector('.stride-tag')?.dataset.category.toLowerCase() || '';
        const techniqueCia = technique.querySelector('.cia-tag')?.dataset.category.toLowerCase() || '';
        
        const matchesSearch = !searchTerm || techniqueName.includes(searchTerm);
        const matchesStride = !strideFilter || techniqueStride.includes(strideFilter);
        const matchesCia = !ciaFilter || techniqueCia.includes(ciaFilter);
        
        technique.style.display = matchesSearch && matchesStride && matchesCia ? 'flex' : 'none';
        technique.style.opacity = matchesSearch && matchesStride && matchesCia ? '1' : '0';
    });
    
    // Update tactic counts
    document.querySelectorAll('.tactic-column').forEach(column => {
        const visibleTechniques = column.querySelectorAll('.technique[style*="display: flex"]').length;
        column.querySelector('.tactic-count').textContent = `${visibleTechniques} techniques`;
    });
}

// Initialize searches when the page loads
document.addEventListener('DOMContentLoaded', () => {
    createMatrix();
    
    // Add event listeners for all search inputs
    document.querySelector('.search-input').addEventListener('input', filterTechniques);
    document.querySelector('#strideFilter').addEventListener('input', filterTechniques);
    document.querySelector('#ciaFilter').addEventListener('input', filterTechniques);
});

// Add transition for smooth filtering
const style = document.createElement('style');
style.textContent = `
    .technique {
        transition: opacity 0.2s ease-in-out;
    }
`;
document.head.appendChild(style);

// Initialize STRIDE search
function initializeStrideSearch() {
    const strideInput = document.getElementById('strideFilter');
    const strideTagsContainer = document.querySelector('.stride-tags');
    const strideSearch = document.querySelector('.stride-search');
    const selectedTags = new Set();

    strideSearch.addEventListener('click', () => {
        strideInput.focus();
    });

    function addStrideTag(category) {
        if (!selectedTags.has(category)) {
            const tag = document.createElement('div');
            tag.className = 'stride-tag';
            tag.setAttribute('data-category', category);
            tag.textContent = category;
            tag.addEventListener('click', () => {
                tag.remove();
                selectedTags.delete(category);
                filterTechniques();
            });
            strideTagsContainer.appendChild(tag);
            selectedTags.add(category);
        }
        strideInput.value = '';
    }

    strideInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        const match = STRIDE_CATEGORIES.find(cat => 
            cat.toLowerCase().startsWith(value.toLowerCase())
        );
        if (value && match && e.inputType !== 'deleteContentBackward') {
            addStrideTag(match);
            filterTechniques();
        }
    });

    strideInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !strideInput.value) {
            const tags = strideTagsContainer.querySelectorAll('.stride-tag');
            if (tags.length) {
                const lastTag = tags[tags.length - 1];
                selectedTags.delete(lastTag.getAttribute('data-category'));
                lastTag.remove();
                filterTechniques();
            }
        }
    });
}

// Initialize CIA search
function initializeCiaSearch() {
    const ciaInput = document.getElementById('ciaFilter');
    const ciaTagsContainer = document.querySelector('.cia-tags');
    const ciaSearch = document.querySelector('.cia-search');
    const selectedTags = new Set();

    ciaSearch.addEventListener('click', () => {
        ciaInput.focus();
    });

    function addCiaTag(category) {
        if (!selectedTags.has(category)) {
            const tag = document.createElement('div');
            tag.className = 'cia-tag';
            tag.setAttribute('data-category', category);
            tag.textContent = category;
            tag.addEventListener('click', () => {
                tag.remove();
                selectedTags.delete(category);
                filterTechniques();
            });
            ciaTagsContainer.appendChild(tag);
            selectedTags.add(category);
        }
        ciaInput.value = '';
    }

    ciaInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        const match = CIA_CATEGORIES.find(cat => 
            cat.toLowerCase().startsWith(value.toLowerCase())
        );
        if (value && match && e.inputType !== 'deleteContentBackward') {
            addCiaTag(match);
            filterTechniques();
        }
    });

    ciaInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !ciaInput.value) {
            const tags = ciaTagsContainer.querySelectorAll('.cia-tag');
            if (tags.length) {
                const lastTag = tags[tags.length - 1];
                selectedTags.delete(lastTag.getAttribute('data-category'));
                lastTag.remove();
                filterTechniques();
            }
        }
    });
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
    
    const name = document.createElement('div');
    name.className = 'technique-name';
    name.textContent = technique.name;
    
    element.appendChild(name);
    
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

// Create tactic header with STRIDE chart
function createTacticHeader(tactic) {
    const header = document.createElement('div');
    header.className = 'tactic-header';
    
    // Create STRIDE chart container
    const strideChartContainer = document.createElement('div');
    strideChartContainer.className = 'stride-chart-container';
    
    // Create STRIDE chart
    const strideChart = document.createElement('div');
    strideChart.className = 'stride-chart';
    
    // Calculate STRIDE distribution
    const strideCounts = {};
    STRIDE_CATEGORIES.forEach(category => {
        strideCounts[category] = tactic.techniques.filter(t => t.stride === category).length;
    });
    
    const maxStrideCount = Math.max(...Object.values(strideCounts));
    
    // Create bars for each STRIDE category
    STRIDE_CATEGORIES.forEach(category => {
        const bar = document.createElement('div');
        bar.className = 'stride-bar';
        bar.setAttribute('data-category', category);
        
        const fill = document.createElement('div');
        fill.className = 'stride-bar-fill';
        const percentage = maxStrideCount > 0 ? (strideCounts[category] / maxStrideCount) * 100 : 0;
        fill.style.height = `${percentage}%`;
        
        bar.appendChild(fill);
        strideChart.appendChild(bar);
    });
    
    strideChartContainer.appendChild(strideChart);
    
    // Create CIA chart container
    const ciaChartContainer = document.createElement('div');
    ciaChartContainer.className = 'cia-chart-container';
    
    // Create CIA chart
    const ciaChart = document.createElement('div');
    ciaChart.className = 'cia-chart';
    
    // Calculate CIA distribution
    const ciaCounts = {};
    CIA_CATEGORIES.forEach(category => {
        ciaCounts[category] = tactic.techniques.filter(t => t.cia === category).length;
    });
    
    const maxCiaCount = Math.max(...Object.values(ciaCounts));
    
    // Create bars for each CIA category
    CIA_CATEGORIES.forEach(category => {
        const bar = document.createElement('div');
        bar.className = 'cia-bar';
        bar.setAttribute('data-category', category);
        
        const fill = document.createElement('div');
        fill.className = 'cia-bar-fill';
        const percentage = maxCiaCount > 0 ? (ciaCounts[category] / maxCiaCount) * 100 : 0;
        fill.style.height = `${percentage}%`;
        
        bar.appendChild(fill);
        ciaChart.appendChild(bar);
    });
    
    ciaChartContainer.appendChild(ciaChart);
    
    // Add name and count
    const name = document.createElement('div');
    name.className = 'tactic-name';
    name.textContent = tactic.name;
    
    const count = document.createElement('div');
    count.className = 'tactic-count';
    count.textContent = tactic.count;
    
    header.appendChild(strideChartContainer);
    header.appendChild(ciaChartContainer);
    header.appendChild(name);
    header.appendChild(count);
    
    return header;
} 
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

// SID persistence functionality
function initializeSidPersistence() {
    const sidInput = document.getElementById('userSid');
    
    // Load saved SID from localStorage
    const savedSid = localStorage.getItem('userSid');
    if (savedSid) {
        sidInput.value = savedSid;
    }
    
    // Save SID to localStorage when user types
    sidInput.addEventListener('input', () => {
        localStorage.setItem('userSid', sidInput.value);
    });
}

// Initialize SID persistence when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSidPersistence);

// Function to fetch and parse CSV data (robust for quoted/multiline fields)
async function loadMitreData() {
    try {
        const rows = await d3.csv('mitre.csv');
        const dataRows = rows.filter(r => (r.Tactic || '').trim() && (r.TechniqueName || '').trim());

        const tacticsMap = new Map();

        dataRows.forEach(r => {
            const tactic = (r.Tactic || '').trim();
            const techniqueName = (r.TechniqueName || '').trim();
            const stride = (r.STRIDE || '').trim();
            const cia = (r.CIA || '').trim();
            const description = (r.TechniqueDescription || '').trim();
            const tags = (r.Tags || '')
                .split(',')
                .map(t => t.trim())
                .filter(Boolean);

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
                stride: stride,
                cia: cia,
                description: description,
                tags: tags
            });
            tacticData.count++;
        });

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

// Feedback collection system
let feedbackData = [];

// API base URL
const API_BASE = 'http://localhost:8000/api';

// Load feedback from server on page load
async function loadFeedbackFromServer() {
    try {
        const response = await fetch(`${API_BASE}/feedback`);
        if (response.ok) {
            const data = await response.json();
            feedbackData = data.feedback || [];
            console.log('Loaded feedback from server:', feedbackData.length, 'entries');
            updateDownloadButtonText();
        } else {
            console.error('Error loading feedback from server:', response.status);
        }
    } catch (error) {
        console.error('Error loading feedback from server:', error);
        feedbackData = [];
    }
}

// Submit feedback to server
async function submitFeedbackToServer(feedback, sid = "") {
    try {
        const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                technique: feedback.technique,
                stride: feedback.stride,
                cia: feedback.cia,
                feedback_type: feedback.type,
                sid: sid,
                comment: feedback.comment || ""
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Feedback submitted to server:', result);
            return true;
        } else {
            console.error('Error submitting feedback to server:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Error submitting feedback to server:', error);
        return false;
    }
}

// Generate unique ID for feedback
function generateFeedbackId() {
    return 'fb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Download feedback as CSV
async function downloadFeedbackCSV() {
    try {
        console.log('Attempting to download feedback CSV...');
        
        // First, get the feedback data from the API
        const response = await fetch(`${API_BASE}/feedback`);
        console.log('API response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            const feedback = data.feedback || [];
            console.log('Retrieved feedback data:', feedback.length, 'entries');
            
            if (feedback.length === 0) {
                showFeedbackMessage('No feedback to download.', 'error');
                return;
            }
            
            // Create CSV content
            const headers = ['ID', 'Technique', 'STRIDE', 'CIA', 'Feedback Type', 'SID', 'Comment', 'Timestamp'];
            const csvContent = [
                headers.join(','),
                ...feedback.map(f => [
                    f.ID || f.id,
                    `"${f.Technique || f.technique}"`,
                    f.STRIDE || f.stride,
                    f.CIA || f.cia,
                    f['Feedback Type'] || f.feedback_type,
                    f.SID || f.sid || '',
                    `"${f.Comment || f.comment || ''}"`,
                    f.Timestamp || f.timestamp
                ].join(','))
            ].join('\n');
            
            console.log('Generated CSV content length:', csvContent.length);
            
            // Create and download the blob
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'feedback.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showFeedbackMessage(`Downloaded feedback CSV! (${feedback.length} entries)`, 'success');
        } else {
            console.error('API request failed with status:', response.status);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            showFeedbackMessage(`Download failed: ${response.status}`, 'error');
        }
    } catch (error) {
        console.error('Error downloading feedback:', error);
        showFeedbackMessage(`Download error: ${error.message}`, 'error');
    }
}

// Clear all feedback data
async function clearAllFeedback() {
    if (confirm('Are you sure you want to clear all feedback data? This cannot be undone.')) {
        try {
            const response = await fetch(`${API_BASE}/feedback`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                feedbackData = [];
                updateDownloadButtonText();
                showFeedbackMessage('All feedback cleared!', 'success');
            } else {
                showFeedbackMessage('Error clearing feedback.', 'error');
            }
        } catch (error) {
            console.error('Error clearing feedback:', error);
            showFeedbackMessage('Error clearing feedback.', 'error');
        }
    }
}

// Handle thumbs up feedback
async function handleThumbsUp(techniqueName, stride, cia) {
    // Get SID from main page
    const userSid = document.getElementById('userSid').value.trim();
    
    if (!userSid) {
        showFeedbackMessage('Please enter your SID in the header before submitting feedback.', 'error');
        return;
    }
    
    // Submit feedback directly without modal
    const feedback = {
        id: generateFeedbackId(),
        technique: techniqueName,
        stride: stride,
        cia: cia,
        type: 'thumbs_up',
        timestamp: new Date().toISOString()
    };
    
    const success = await submitFeedbackToServer(feedback, userSid);
    if (success) {
        feedbackData.push(feedback);
        console.log('Feedback collected:', feedback);
        console.log('Total feedback count:', feedbackData.length);
        showFeedbackMessage('Feedback submitted successfully!', 'success');
        updateDownloadButtonText();
    }
}

// Handle thumbs down feedback
function handleThumbsDown(techniqueName) {
    // Get SID from main page
    const userSid = document.getElementById('userSid').value.trim();
    
    if (!userSid) {
        showFeedbackMessage('Please enter your SID in the header before submitting feedback.', 'error');
        return;
    }
    
    // Show modal for thumbs down to select correct classifications
    showFeedbackModal(techniqueName, 'thumbs_down');
}

// Show feedback modal for thumbs down only (SID is now on main page)
function showFeedbackModal(techniqueName, feedbackType, existingStride = '', existingCia = '') {
    // Remove existing modal if any
    const existingModal = document.querySelector('.feedback-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalTitle = 'Provide Correct Classification';
    const modalDescription = `Please select the correct STRIDE and CIA classifications for: <strong>${techniqueName}</strong>`;
    
    const modal = document.createElement('div');
    modal.className = 'feedback-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <h3>${modalTitle}</h3>
                <p>${modalDescription}</p>
                
                <div class="modal-form">
                    <div class="form-group">
                        <label for="modal-stride">STRIDE Category:</label>
                        <select id="modal-stride" required>
                            <option value="">Select STRIDE category...</option>
                            ${STRIDE_CATEGORIES.map(cat => `<option value="${cat}" ${cat === existingStride ? 'selected' : ''}>${cat}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="modal-cia">CIA Category:</label>
                        <select id="modal-cia" required>
                            <option value="">Select CIA category...</option>
                            ${CIA_CATEGORIES.map(cat => `<option value="${cat}" ${cat === existingCia ? 'selected' : ''}>${cat}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="modal-comment">Comment (Optional):</label>
                        <textarea id="modal-comment" placeholder="Please provide additional context for your feedback..." rows="3"></textarea>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn-cancel" onclick="closeFeedbackModal()">Cancel</button>
                    <button class="btn-save" onclick="saveFeedback('${techniqueName}', '${feedbackType}', '${existingStride}', '${existingCia}')">Save Feedback</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close feedback modal
function closeFeedbackModal() {
    const modal = document.querySelector('.feedback-modal');
    if (modal) {
        modal.remove();
    }
}

// Save feedback from modal (SID now comes from main page)
async function saveFeedback(techniqueName, feedbackType, existingStride = '', existingCia = '') {
    // Get SID from main page
    const userSid = document.getElementById('userSid').value.trim();
    
    if (!userSid) {
        showFeedbackMessage('Please enter your SID in the header before submitting feedback.', 'error');
        return;
    }
    
    // Get selected values for thumbs down
    const strideSelect = document.getElementById('modal-stride');
    const ciaSelect = document.getElementById('modal-cia');
    const commentTextarea = document.getElementById('modal-comment');
    
    const selectedStride = strideSelect.value;
    const selectedCia = ciaSelect.value;
    const comment = commentTextarea.value.trim();
    
    if (!selectedStride || !selectedCia) {
        showFeedbackMessage('Please select both STRIDE and CIA categories.', 'error');
        return;
    }
    
    const feedback = {
        id: generateFeedbackId(),
        technique: techniqueName,
        stride: selectedStride,
        cia: selectedCia,
        type: feedbackType,
        comment: comment,
        timestamp: new Date().toISOString()
    };
    
    const success = await submitFeedbackToServer(feedback, userSid);
    if (success) {
        feedbackData.push(feedback);
        console.log('Feedback collected:', feedback);
        console.log('Total feedback count:', feedbackData.length);
        updateDownloadButtonText();
        closeFeedbackModal();
        showFeedbackMessage(`Feedback submitted successfully! (Total: ${feedbackData.length})`, 'success');
    } else {
        showFeedbackMessage('Error submitting feedback. Please try again.', 'error');
    }
}

// Show feedback message
function showFeedbackMessage(message, type) {
    // Remove existing message if any
    const existingMessage = document.querySelector('.feedback-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `feedback-message feedback-${type}`;
    messageElement.textContent = message;
    
    document.body.appendChild(messageElement);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 3000);
}

// Show Technique Description modal
function showTechniqueDescription(techniqueName) {
    // Find technique across all tactics (data already rendered, so rebuild quick index)
    // Safer approach: refetch lightweight mapping from current DOM dataset if available.
    // Here, we re-use loadMitreData and search in-memory.
    loadMitreData().then(tactics => {
        if (!tactics) return;
        let found = null;
        for (const t of tactics) {
            const match = t.techniques.find(tech => tech.name === techniqueName);
            if (match) { found = match; break; }
        }
        const description = (found && found.description) ? found.description : 'No description available.';
        const tags = (found && Array.isArray(found.tags)) ? found.tags : [];

        const existing = document.querySelector('.technique-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'technique-modal';
        const tagBadges = tags.map((t) => `<span class=\"generic-tag ${tagToClassName(t)}\">${escapeHtml(t)}</span>`).join(' ');
        modal.innerHTML = `
            <div class="modal-overlay" onclick="closeTechniqueModal()"></div>
            <div class="modal-content">
                <h3>${techniqueName}</h3>
                <div class="technique-description">${escapeHtml(description).replace(/\n/g,'<br>')}</div>
                ${tags.length ? `<div class="tags-row" style="margin-top:8px;">${tagBadges}</div>` : ''}
                <div class="modal-actions">
                    <button class="btn-cancel" onclick="closeTechniqueModal()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    });
}

function closeTechniqueModal() {
    const m = document.querySelector('.technique-modal');
    if (m) m.remove();
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function tagToClassName(tag) {
    const slug = String(tag)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    return `tag-${slug}`;
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
            // annotate for fast filtering
            techniqueElement.setAttribute('data-tags', (technique.tags || []).map(t => t.toLowerCase()).join('|'));
            techniqueElement.setAttribute('data-stride', (technique.stride || '').toLowerCase());
            techniqueElement.setAttribute('data-cia', (technique.cia || '').toLowerCase());
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
                    <div class="feedback-buttons">
                        <button class="feedback-btn thumbs-up" title="Agree with classification" onclick="handleThumbsUp('${technique.name}', '${technique.stride || ''}', '${technique.cia || ''}')">
                            👍
                        </button>
                        <button class="feedback-btn thumbs-down" title="Disagree with classification" onclick="handleThumbsDown('${technique.name}')">
                            👎
                        </button>
                        <button class="feedback-btn info" title="Show technique description" onclick="showTechniqueDescription('${technique.name}')">ℹ️</button>
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
    'Availability',
    'Authorization',
    'Authenticity',
    'Non-Repudiation'
];

function filterTechniques() {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase().trim();
    const strideFilter = '';
    const ciaFilter = '';
    
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
    
    // Add event listeners for search input
    document.querySelector('.search-input').addEventListener('input', filterTechniques);

    initializeSidebarFilters();

    const collapseHandle = document.getElementById('sidebarCollapseHandle');
    if (collapseHandle) {
        collapseHandle.addEventListener('click', () => {
            const layout = document.querySelector('.content-layout');
            const collapsed = layout.classList.toggle('sidebar-collapsed');
            collapseHandle.textContent = collapsed ? '›' : '‹';
        });
    }

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            // Technique modal
            closeTechniqueModal();
            // Feedback modal
            if (typeof closeFeedbackModal === 'function') {
                closeFeedbackModal();
            }
        }
    });
});

// Add transition for smooth filtering
const style = document.createElement('style');
style.textContent = `
    .technique {
        transition: opacity 0.2s ease-in-out;
    }
`;
document.head.appendChild(style);

// Sidebar Filters
const TAG_GROUPS = {
  Enterprise: ['PRE','Windows','macOS','Linux','Cloud','Network Devices','Containers','ESXi'],
  Mobile: ['Android','iOS'],
  ICS: []
};

function initializeSidebarFilters() {
  // Build Enterprise section
  const entRoot = document.getElementById('sidebar-enterprise');
  if (entRoot) {
    const ul = document.createElement('ul');
    ul.className = 'sidebar-list';
    TAG_GROUPS.Enterprise.forEach(tag => {
      const li = document.createElement('li');
      li.className = 'sidebar-item';
      li.setAttribute('data-filter-tag', tag);
      li.innerHTML = `<span class="generic-tag ${tagToClassName(tag)}">${tag}</span>`;
      li.addEventListener('click', () => toggleSidebarSelection(li, 'tag'));
      ul.appendChild(li);
    });
    entRoot.appendChild(ul);
  }

  // Build Mobile section
  const mobRoot = document.getElementById('sidebar-mobile');
  if (mobRoot) {
    const ul = document.createElement('ul');
    ul.className = 'sidebar-list';
    TAG_GROUPS.Mobile.forEach(tag => {
      const li = document.createElement('li');
      li.className = 'sidebar-item';
      li.setAttribute('data-filter-tag', tag);
      li.innerHTML = `<span class="generic-tag ${tagToClassName(tag)}">${tag}</span>`;
      li.addEventListener('click', () => toggleSidebarSelection(li, 'tag'));
      ul.appendChild(li);
    });
    mobRoot.appendChild(ul);
  }

  // Build ICS section (single toggle item)
  const icsRoot = document.getElementById('sidebar-ics');
  if (icsRoot) {
    const ul = document.createElement('ul');
    ul.className = 'sidebar-list';
    const li = document.createElement('li');
    const tag = 'ICS';
    li.className = 'sidebar-item';
    li.setAttribute('data-filter-tag', tag);
    li.innerHTML = `<span class="generic-tag ${tagToClassName(tag)}">${tag}</span>`;
    li.addEventListener('click', () => toggleSidebarSelection(li, 'tag'));
    ul.appendChild(li);
    icsRoot.appendChild(ul);
  }

  // Build STRIDE section
  const strideRoot = document.getElementById('sidebar-stride');
  if (strideRoot) {
    const ul = document.createElement('ul');
    ul.className = 'sidebar-list';
    STRIDE_CATEGORIES.forEach(cat => {
      const li = document.createElement('li');
      li.className = 'sidebar-item';
      li.setAttribute('data-filter-stride', cat);
      li.innerHTML = `<span class="stride-tag" data-category="${cat}">${cat}</span>`;
      li.addEventListener('click', () => toggleSidebarSelection(li, 'stride'));
      ul.appendChild(li);
    });
    strideRoot.appendChild(ul);
  }

  // Build CIA section
  const ciaRoot = document.getElementById('sidebar-cia');
  if (ciaRoot) {
    const ul = document.createElement('ul');
    ul.className = 'sidebar-list';
    CIA_CATEGORIES.forEach(cat => {
      const li = document.createElement('li');
      li.className = 'sidebar-item';
      li.setAttribute('data-filter-cia', cat);
      li.innerHTML = `<span class="cia-tag" data-category="${cat}">${cat}</span>`;
      li.addEventListener('click', () => toggleSidebarSelection(li, 'cia'));
      ul.appendChild(li);
    });
    ciaRoot.appendChild(ul);
  }

  // Wire collapsible behavior
  document.querySelectorAll('.sidebar-group-title').forEach(title => {
    title.addEventListener('click', () => {
      const group = title.closest('.sidebar-group');
      group.classList.toggle('collapsed');
    });
  });

  // Collapse all groups by default on load
  document.querySelectorAll('.sidebar-group').forEach(group => {
    group.classList.add('collapsed');
  });
}

const activeSidebar = { tags: new Set(), stride: new Set(), cia: new Set() };

function toggleSidebarSelection(li, type) {
  const isActive = li.classList.toggle('active');
  const value = li.textContent.trim();
  const set = type === 'tag' ? activeSidebar.tags : type === 'stride' ? activeSidebar.stride : activeSidebar.cia;
  if (isActive) set.add(value); else set.delete(value);
  applySidebarFilters();
}

function applySidebarFilters() {
  // If nothing selected, do nothing special and let existing filters work
  const hasAny = activeSidebar.tags.size || activeSidebar.stride.size || activeSidebar.cia.size;
  const techniqueCards = document.querySelectorAll('.technique');
  if (!hasAny) {
    // restore all
    techniqueCards.forEach(card => {
      card.style.display = 'flex';
      card.style.opacity = '1';
    });
    // update counts
    document.querySelectorAll('.tactic-column').forEach(column => {
      const visibleTechniques = column.querySelectorAll('.technique[style*="display: flex"]').length;
      column.querySelector('.tactic-count').textContent = `${visibleTechniques} techniques`;
    });
    return;
  }

  // Filter using data attributes on cards to avoid name mismatches
  document.querySelectorAll('.technique').forEach(card => {
    const cardTags = (card.getAttribute('data-tags') || '').split('|').filter(Boolean);
    const cardStride = (card.getAttribute('data-stride') || '').trim();
    const cardCia = (card.getAttribute('data-cia') || '').trim();

    let ok = true;
    if (activeSidebar.tags.size) {
      const loweredSet = new Set(cardTags.map(t => t.toLowerCase()));
      const selectedLower = [...activeSidebar.tags].map(t => String(t).toLowerCase());
      // Require ALL selected tags to be present (AND semantics)
      ok = selectedLower.every(t => loweredSet.has(t));
    }
    if (ok && activeSidebar.stride.size) {
      ok = [...activeSidebar.stride].some(s => cardStride === String(s).toLowerCase());
    }
    if (ok && activeSidebar.cia.size) {
      ok = [...activeSidebar.cia].some(c => cardCia === String(c).toLowerCase());
    }

    card.style.display = ok ? 'flex' : 'none';
    card.style.opacity = ok ? '1' : '0';
  });

  // Update tactic counts
  document.querySelectorAll('.tactic-column').forEach(column => {
    const visibleTechniques = column.querySelectorAll('.technique[style*="display: flex"]').length;
    column.querySelector('.tactic-count').textContent = `${visibleTechniques} techniques`;
  });
}

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

// Add Download Feedback button to the UI on page load
function addDownloadFeedbackButton() {
    let header = document.querySelector('header');
    if (!header) return;
    let existingBtn = document.getElementById('download-feedback-btn');
    if (existingBtn) return;
    
    // Create button container
    const btnContainer = document.createElement('div');
    btnContainer.className = 'feedback-controls';
    
    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.id = 'download-feedback-btn';
    downloadBtn.className = 'btn-download-feedback';
    downloadBtn.textContent = 'Download Feedback (0)';
    downloadBtn.onclick = downloadFeedbackCSV;
    
    // Clear button
    const clearBtn = document.createElement('button');
    clearBtn.id = 'clear-feedback-btn';
    clearBtn.className = 'btn-clear-feedback';
    clearBtn.textContent = 'Clear Feedback';
    clearBtn.onclick = clearAllFeedback;
    
    btnContainer.appendChild(downloadBtn);
    btnContainer.appendChild(clearBtn);
    header.appendChild(btnContainer);
}

// Update download button text with current feedback count
function updateDownloadButtonText() {
    const btn = document.getElementById('download-feedback-btn');
    if (btn) {
        btn.textContent = `Download Feedback (${feedbackData.length})`;
    }
}

// Initialize feedback system
document.addEventListener('DOMContentLoaded', () => {
    loadFeedbackFromServer(); // Load existing feedback from server
    addDownloadFeedbackButton();
}); 
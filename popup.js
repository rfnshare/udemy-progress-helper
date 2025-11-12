// popup.js
// Handles popup UI for Udemy Progress Helper

const $ = sel => document.querySelector(sel);

// Helper to send message to active tab
async function sendToActiveTab(msg) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab found');
    return chrome.tabs.sendMessage(tab.id, msg);
}

// Refresh the section list from the Udemy page
async function refreshSections() {
    const list = $('#sectionsList');
    list.textContent = 'Loading...';
    try {
        const resp = await sendToActiveTab({ action: 'getSections' });
        if (!resp || !resp.sections) throw new Error('No sections returned');
        list.innerHTML = '';
        resp.sections.forEach(s => {
            const div = document.createElement('div');
            div.className = 'section-row';
            const label = document.createElement('label');
            label.style.flex = '1';
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.dataset.section = s.index;
            label.appendChild(chk);
            label.appendChild(
                document.createTextNode(` Section ${s.number}: ${s.title} (${s.count})`)
            );
            div.appendChild(label);
            list.appendChild(div);
        });
        if (resp.sections.length === 0)
            list.textContent = 'No sections found on this page.';
    } catch (err) {
        list.textContent = 'Error: ' + err.message;
    }
}

// Run spec input directly
async function runSpec(spec) {
    try {
        await sendToActiveTab({ action: 'tickSpec', spec });
        saveLastSpec(spec);
        window.close();
    } catch (err) {
        console.error(err);
        alert('Error: ' + err.message);
    }
}

// Run based on selected checkboxes
async function runSelected() {
    const selected = Array.from(
        document.querySelectorAll('#sectionsList input[type=checkbox]:checked')
    ).map(cb => Number(cb.dataset.section) + 1);
    if (!selected.length) {
        alert('Select at least one section');
        return;
    }
    const spec = selected.join(',');
    await runSpec(spec);
}

// Save & load last used spec
function saveLastSpec(spec) {
    chrome.storage.local.set({ lastSpec: spec });
}
function loadLastSpec() {
    chrome.storage.local.get(['lastSpec'], data => {
        if (data.lastSpec) $('#spec').value = data.lastSpec;
    });
}

// Event listeners
document.getElementById('runSpec').addEventListener('click', () => {
    const spec = $('#spec').value.trim();
    if (!spec) return alert('Enter a spec');
    runSpec(spec);
});

document.getElementById('refreshSections').addEventListener('click', refreshSections);
document.getElementById('selectAllSections').addEventListener('click', () => {
    document
        .querySelectorAll('#sectionsList input[type=checkbox]')
        .forEach(cb => (cb.checked = true));
});
document.getElementById('runSelected').addEventListener('click', runSelected);
document.getElementById('saveSpec').addEventListener('click', () => {
    const spec = $('#spec').value.trim();
    if (!spec) return alert('Nothing to save');
    saveLastSpec(spec);
    alert('Saved');
});

// Initialize popup
loadLastSpec();
refreshSections();

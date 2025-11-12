// content.js
// Runs inside Udemy course pages. Handles messages from popup/background and performs DOM actions.
// Debug: open DevTools on the course page (Console) to see logs.

console.log('Udemy Progress Helper: content.js loaded');

// Build lightweight section metadata for the popup UI
function getSectionsMeta() {
    try {
        const panels = Array.from(document.querySelectorAll('[data-purpose^="section-panel-"], [data-purpose="section-panel"]'));
        const sections = panels.map((p, idx) => {
            const headingEl = p.querySelector('[data-purpose="section-heading"], .section--section-heading--gDf8W, h3, button');
            const headingText = headingEl ? headingEl.textContent.trim().replace(/\s+/g, ' ') : `Section ${idx + 1}`;
            const cbs = Array.from(p.querySelectorAll('input[data-purpose="progress-toggle-button"], input.ud-real-toggle-input, input[type="checkbox"]'));
            return {
                index: idx,
                number: idx + 1,
                title: headingText,
                count: cbs.length
            };
        });
        return sections;
    } catch (err) {
        console.error('getSectionsMeta error', err);
        return [];
    }
}

// Core: parse spec and mark checkboxes
async function tickSectionsInternal(spec, opts = {}) {
    const delay = typeof opts.delay === 'number' ? opts.delay : 200;
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function parseSpecs(raw) {
        raw = String(raw || '').trim();
        if (!raw) return [];
        // split by semicolon top-level; allow commas in section item lists
        const topTokens = raw.split(/[;]+/).map(t => t.trim()).filter(Boolean);
        const results = [];
        for (const tok0 of topTokens) {
            // If token looks like "1,2,3" treat as separate section tokens
            if (/^\d+(,\d+)+$/.test(tok0)) {
                tok0.split(',').map(x => x.trim()).forEach(x => results.push(x));
                continue;
            }
            // section range "1-3"
            if (/^\d+\-\d+$/.test(tok0)) {
                const [a,b] = tok0.split('-').map(Number);
                for (let i = a; i <= b; i++) results.push(String(i));
                continue;
            }
            results.push(tok0);
        }

        // Now convert tokens into objects { section: N, items: [..] | null }
        return results.map(tok => {
            const m = tok.match(/^(\d+)\s*:\s*(.+)$/);
            if (m) {
                const sec = Number(m[1]);
                const parts = m[2].split(',').map(p => p.trim()).filter(Boolean);
                const items = [];
                for (const p of parts) {
                    if (/^\d+\-\d+$/.test(p)) {
                        const [x,y] = p.split('-').map(Number);
                        for (let z = x; z <= y; z++) items.push(z);
                    } else if (/^\d+$/.test(p)) {
                        items.push(Number(p));
                    }
                }
                return { section: sec, items };
            }
            if (/^\d+$/.test(tok)) return { section: Number(tok), items: null };
            return null;
        }).filter(Boolean);
    }

    const specs = parseSpecs(spec);
    if (!specs.length) {
        console.warn('tickSectionsInternal: no valid specs parsed from', spec);
        return { clicked: 0, message: 'no specs parsed' };
    }

    const panels = Array.from(document.querySelectorAll('[data-purpose^="section-panel-"], [data-purpose="section-panel"]'));

    function findPanelByNumber(n) {
        // prefer index-based mapping
        if (panels[n - 1]) return panels[n - 1];
        // fallback: search heading text "Section N"
        for (const p of panels) {
            const heading = p.querySelector('[data-purpose="section-heading"], .section--section-heading--gDf8W, h3, button');
            if (heading && heading.textContent && heading.textContent.match(new RegExp(`\\bSection\\s*${n}\\b`, 'i'))) return p;
        }
        return null;
    }

    function clickableFromCheckbox(cb) {
        if (!cb) return null;
        const label = cb.closest('label');
        if (label) return label;
        const popper = cb.closest('[id^="popper-trigger"], .popper-module--popper--mM5Ie');
        if (popper) return popper;
        return cb;
    }

    let totalClicked = 0;

    for (const s of specs) {
        const panel = findPanelByNumber(s.section);
        if (!panel) {
            console.warn(`tickSections: section ${s.section} not found`);
            continue;
        }

        const cbs = Array.from(panel.querySelectorAll('input[data-purpose="progress-toggle-button"], input.ud-real-toggle-input, input[type="checkbox"]'));
        if (!cbs.length) {
            console.warn(`tickSections: no checkboxes in section ${s.section}`);
            continue;
        }

        let targets;
        if (!s.items || s.items.length === 0) {
            targets = cbs.map((_, i) => i); // all indices
        } else {
            targets = s.items.map(num => num - 1).filter(idx => idx >= 0 && idx < cbs.length);
            if (!targets.length) {
                console.warn(`tickSections: no valid item indices for section ${s.section}. available 1..${cbs.length}`);
                continue;
            }
        }

        for (const idx of targets) {
            const cb = cbs[idx];
            if (!cb) continue;
            const clickable = clickableFromCheckbox(cb) || cb;
            try {
                // enable input if disabled (so event handlers might run)
                if (cb.disabled) cb.disabled = false;

                // prefer native click on visible label/trigger
                if (typeof clickable.click === 'function') {
                    clickable.click();
                } else {
                    clickable.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                    clickable.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                    clickable.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                }

                // ensure the input is checked and fire change event
                cb.checked = true;
                cb.dispatchEvent(new Event('change', { bubbles: true }));

                totalClicked++;
            } catch (err) {
                console.warn('tickSections: failed for checkbox', cb, err);
            }
            // small delay to mimic human interaction & avoid spamming handlers
            await sleep(delay);
        }
    }

    console.log(`tickSections completed - attempted clicks: ${totalClicked}`);
    return { clicked: totalClicked };
}

// Message handler from popup/background
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    try {
        if (!msg || !msg.action) {
            // ignore
            return;
        }
        console.log('content.js received message', msg);
        if (msg.action === 'getSections') {
            const sections = getSectionsMeta();
            sendResponse({ sections });
            return true; // synchronous response is fine here
        }
        if (msg.action === 'tickSpec') {
            // async: return true and call sendResponse later
            tickSectionsInternal(msg.spec || '', { delay: msg.delay || 200 })
                .then(result => sendResponse(result))
                .catch(err => {
                    console.error('tickSpec error', err);
                    sendResponse({ error: err.message || String(err) });
                });
            return true; // indicates async response
        }
    } catch (err) {
        console.error('content.js onMessage handler error', err);
    }
});

// expose some helpers for manual debugging in Console
window.__udemyProgressHelper = {
    getSectionsMeta,
    tickSectionsInternal
};

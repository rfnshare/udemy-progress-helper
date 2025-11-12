// background.js - service worker (Manifest V3)
// Listens for keyboard command and sends message to content script

console.log('Udemy Progress Helper: background service worker loaded');

chrome.commands.onCommand.addListener(async (command) => {
    console.log('background: command received', command);
    if (command === 'mark-all-sections') {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.id) {
                console.warn('background: no active tab found');
                return;
            }
            // send a broad spec to mark all sections (1-9999 as a simple hack)
            chrome.tabs.sendMessage(tab.id, { action: 'tickSpec', spec: '1-9999', delay: 250 }, (resp) => {
                if (chrome.runtime.lastError) {
                    console.warn('background: sendMessage error', chrome.runtime.lastError.message);
                } else {
                    console.log('background: mark-all-sections response', resp);
                }
            });
        } catch (err) {
            console.error('background: error handling command', err);
        }
    }
});

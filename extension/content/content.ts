/**
 * ContextSwitch - Content Script (Manifest V3)
 * Layer 1 Foundation: Minimal listener and document context identifier
 */

console.log('[ContextSwitch] Content script initialized on:', window.location.hostname);

// Listener for context queries from sidepanel/background
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request?.type === 'CS_GET_PAGE_CONTEXT') {
    sendResponse({
      title: document.title,
      url: window.location.href,
      hostname: window.location.hostname,
      timestamp: Date.now(),
    });
    return true;
  }
  return false;
});

export {};

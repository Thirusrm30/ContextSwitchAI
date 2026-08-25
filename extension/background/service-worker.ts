/**
 * ContextSwitch - Background Service Worker (Manifest V3)
 * Layer 1 Foundation: Side panel lifecycle and extension action handlers
 */

// Enable side panel to open on action toolbar button click
if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: Error) => {
      console.warn('[ContextSwitch] Failed to set side panel behavior:', error);
    });
}

// Extension installation lifecycle
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[ContextSwitch] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Initialize default storage structure for sessions and configuration
    chrome.storage.local.set({
      cs_version: '1.0.0',
      cs_initialized_at: new Date().toISOString(),
      cs_privacy_mode: 'local_only',
      cs_auto_detect_switch: true,
    });
  }
});

// Communication listener for Side Panel and Content Scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'CS_GET_STATUS') {
    sendResponse({ status: 'active', version: '1.0.0', ready: true });
    return true;
  }

  if (message?.type === 'CS_PING') {
    sendResponse({ pong: true, timestamp: Date.now() });
    return true;
  }

  return false;
});

export {};

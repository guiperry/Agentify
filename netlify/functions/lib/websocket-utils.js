/**
 * Simplified WebSocket Utils for Netlify Functions
 * Uses Server-Sent Events instead of WebSocket for serverless compatibility
 */

/**
 * Send compilation update via Server-Sent Events
 * In serverless environment, we'll log the update and rely on client polling
 */
async function sendCompilationUpdate(type, progress, message) {
  // Log the update for debugging
  console.log(`[${type}] ${progress}% - ${message}`);
  
  // In a real implementation, this would send to an SSE endpoint
  // For now, we'll just log and let the client poll for status
  return Promise.resolve();
}

/**
 * Send SSE message (placeholder for serverless environment)
 */
async function sendSSEMessage(type, data) {
  console.log(`[SSE] ${type}:`, data);
  return Promise.resolve();
}

/**
 * Broadcast message (placeholder for serverless environment)
 */
async function broadcastMessage(message) {
  console.log('[Broadcast]:', message);
  return Promise.resolve();
}

module.exports = {
  sendCompilationUpdate,
  sendSSEMessage,
  broadcastMessage
};

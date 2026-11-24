// =========================================================================
// VORTEX SPEED TITANIUM PRO // NOVA 2.0: CONVERSATION MANAGER
// Multi-Turn Context, Anaphora Resolution & Entity Reference Tracking
// Session Isolation with Automatic TTL Pruning
// =========================================================================

class ConversationManager {
  constructor() {
    this.sessions = new Map();
    this.sessionTtlMs = 30 * 60 * 1000; // 30 minutes
    this.maxTurnsPerSession = 25;

    // Prune stale sessions every 10 minutes
    setInterval(() => this.pruneStaleSessions(), 10 * 60 * 1000);
  }

  getSession(sessionId = 'default') {
    const id = sessionId || 'default';
    let session = this.sessions.get(id);

    if (!session) {
      session = {
        id,
        created: Date.now(),
        lastActivity: Date.now(),
        turns: [],
        context: {
          lastIntent: null,
          lastTopic: null,
          lastDiagnosis: null,
          lastBottleneck: null,
          lastSpeedTests: null,
          lastReferencedDevices: null,
          lastActionsRecommended: [],
          pendingAction: null
        }
      };
      this.sessions.set(id, session);
    } else {
      session.lastActivity = Date.now();
    }

    return session;
  }

  recordTurn(sessionId, userQuery, novaResponse, intent, extractedEntities = {}) {
    const session = this.getSession(sessionId);

    const turn = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      userQuery,
      intent,
      extractedEntities,
      summary: novaResponse.summary,
      diagnosis: novaResponse.diagnosis,
      recommendedActions: novaResponse.recommendedActions || []
    };

    session.turns.push(turn);
    if (session.turns.length > this.maxTurnsPerSession) {
      session.turns.shift();
    }

    // Update ongoing contextual anchors
    session.context.lastIntent = intent;
    if (novaResponse.topic) session.context.lastTopic = novaResponse.topic;
    if (novaResponse.diagnosis) session.context.lastDiagnosis = novaResponse.diagnosis;
    if (novaResponse.bottleneck) session.context.lastBottleneck = novaResponse.bottleneck;
    if (novaResponse.speedTestsSummary) session.context.lastSpeedTests = novaResponse.speedTestsSummary;
    if (novaResponse.devicesSummary) session.context.lastReferencedDevices = novaResponse.devicesSummary;
    if (novaResponse.recommendedActions) session.context.lastActionsRecommended = novaResponse.recommendedActions;

    return turn;
  }

  setPendingAction(sessionId, actionDef) {
    const session = this.getSession(sessionId);
    session.context.pendingAction = actionDef;
  }

  getPendingAction(sessionId) {
    const session = this.getSession(sessionId);
    return session.context.pendingAction;
  }

  clearPendingAction(sessionId) {
    const session = this.getSession(sessionId);
    session.context.pendingAction = null;
  }

  getHistory(sessionId) {
    const session = this.getSession(sessionId);
    return session.turns;
  }

  clearSession(sessionId) {
    this.sessions.delete(sessionId || 'default');
  }

  pruneStaleSessions() {
    const now = Date.now();
    for (const [id, s] of this.sessions.entries()) {
      if (now - s.lastActivity > this.sessionTtlMs) {
        this.sessions.delete(id);
      }
    }
  }
}

module.exports = new ConversationManager();

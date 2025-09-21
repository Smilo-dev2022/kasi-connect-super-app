export type Incident = {
  id: string
  groupId: string
  createdAtMs: number
  acknowledgedAtMs?: number
  resolvedAtMs?: number
}

export type SlaBreach = {
  incidentId: string
  type: 'ack' | 'resolve'
  thresholdMs: number
  actualMs: number
}

export type SlaConfig = {
  ackThresholdMs: number
  resolveThresholdMs: number
}

export function checkSla(incident: Incident, nowMs: number, cfg: SlaConfig): SlaBreach[] {
  const breaches: SlaBreach[] = []
  const ageMs = nowMs - incident.createdAtMs

  if (!incident.acknowledgedAtMs && ageMs > cfg.ackThresholdMs) {
    breaches.push({ incidentId: incident.id, type: 'ack', thresholdMs: cfg.ackThresholdMs, actualMs: ageMs })
  }

  if (!incident.resolvedAtMs && ageMs > cfg.resolveThresholdMs) {
    breaches.push({ incidentId: incident.id, type: 'resolve', thresholdMs: cfg.resolveThresholdMs, actualMs: ageMs })
  }

  return breaches
}


// Append-only event log + in-process subscribe (core API decision #19/#20).
// Backs .agent/history/execution-log.jsonl. Real, minimal.

import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { EventEmitter } from "node:events";

// Canonical observability taxonomy (§100).
export type EngineEventType =
  | "project.created"
  | "graph.generated"
  | "node.ready"
  | "node.started"
  | "agent.started"
  | "tool.called"
  | "artifact.created"
  | "test.completed"
  | "evaluation.completed"
  | "decision.made"
  | "failure.detected"
  | "repair.started"
  | "repair.completed"
  | "node.completed"
  | "approval.requested"
  | "approval.granted"
  | "approval.rejected"
  | "deployment.started"
  | "deployment.completed"
  | "escalation"
  | "error";

export interface EngineEvent {
  ts: string;
  type: EngineEventType;
  runId?: string;
  data?: Record<string, unknown>;
}

export class EventLog {
  #emitter = new EventEmitter();
  #logPath: string;

  constructor(logPath: string) {
    this.#logPath = logPath;
  }

  async emit(event: Omit<EngineEvent, "ts">): Promise<void> {
    const full: EngineEvent = { ts: new Date().toISOString(), ...event };
    await mkdir(dirname(this.#logPath), { recursive: true });
    await appendFile(this.#logPath, JSON.stringify(full) + "\n", "utf8");
    this.#emitter.emit("event", full);
  }

  /** Returns an unsubscribe function. */
  subscribe(listener: (event: EngineEvent) => void): () => void {
    this.#emitter.on("event", listener);
    return () => this.#emitter.off("event", listener);
  }
}

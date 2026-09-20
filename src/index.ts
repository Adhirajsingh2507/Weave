// Public core API — the one stable surface all frontends (CLI/MCP/HTTP/in-process) call.

export { Engine } from "./core/api.js";
export type { EngineOptions, EngineDeps } from "./core/api.js";
export { compileBrief } from "./core/compiler.js";
export type { BriefInput } from "./core/compiler.js";
export { buildExecGraph, implNodes } from "./core/plan.js";
export { ingestRepo, inferMappings } from "./core/ingest/sweep.js";
export type { IngestResult, MappingResult } from "./core/ingest/sweep.js";
export { parseFile, languageOf } from "./core/ingest/parse.js";
export type { FileFacts } from "./core/ingest/parse.js";
export { CommandDeployer, FakeDeployer } from "./core/deploy.js";
export type { Deployer, DeployResult } from "./core/deploy.js";
export { createMcpServer, startMcpServer } from "./mcp/server.js";
export * from "./core/types.js";
export { EventLog } from "./core/events/index.js";
export type { EngineEvent, EngineEventType } from "./core/events/index.js";
export { DesignIRSchema } from "./core/ir/schema.js";
export type { DesignIR } from "./core/ir/schema.js";
export { DECISION_CATALOG, UnimplementedDecision } from "./core/decision/index.js";
export type {
  Decision,
  DecisionName,
  DecisionRequest,
  DecisionResult,
} from "./core/decision/index.js";
export {
  resolveEscalation,
  providerFor,
  DEFAULT_THRESHOLDS,
  DEFAULT_PROVIDERS,
  ThresholdPolicySchema,
  ProviderPolicySchema,
} from "./core/policy/index.js";
export type {
  EscalationPath,
  ProviderId,
  ThresholdPolicy,
  ProviderPolicy,
} from "./core/policy/index.js";
export { ClaudeCodeExecutor, GitHarness } from "./core/runtime.js";
export type {
  ContextPack,
  ExecInput,
  ExecResult,
  NodeExecutor,
} from "./core/runtime.js";
export { ClaudeDecision, FakeDecision } from "./core/decision/providers.js";
export { DecisionRunner } from "./core/decision/runner.js";
export type { DecisionOutcome, DecisionRunnerOptions } from "./core/decision/runner.js";
export { runNode } from "./core/loop.js";
export type { LoopNode, NodeLoopResult, RunNodeOptions, VerifyResult, Verifier } from "./core/loop.js";
export { DeterministicVerifier, DEFAULT_CHECKS } from "./core/verify.js";
export type { Check, DeterministicVerifierOptions } from "./core/verify.js";
export { PlaywrightBrowserWorker, FakeBrowserWorker } from "./core/browser.js";
export type { BrowserWorker, BrowserResult } from "./core/browser.js";
export { visualQA } from "./core/visual.js";
export type {
  VisualQAOptions,
  VisualResult,
  VisualCriterion,
  VisionExtractor,
  VisionReinspector,
} from "./core/visual.js";
export type {
  Edge,
  EdgeKind,
  ExecNode,
  ExecNodeKind,
  ExecNodeStatus,
  KgNode,
  KgNodeKind,
  MappingProvenance,
} from "./core/graph/types.js";
export { projectIR, computeGaps } from "./core/graph/project.js";
export type { DesignGraph, Gaps } from "./core/graph/project.js";
export { GraphStore } from "./core/store/graph-store.js";
export type { MappingFilter, NodeQuery } from "./core/store/graph-store.js";

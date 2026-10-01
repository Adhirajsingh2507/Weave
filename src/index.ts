// Public core API — the one stable surface all frontends (CLI/MCP/HTTP/in-process) call.

export { Engine, adapterDeps, subscriptionLoggedIn, DENY_PATHS } from "./core/api.js";
export { detectSandbox, wrapCommand, sandboxArgs, globToRegExp, HOME_SECRETS } from "./core/sandbox.js";
export type { SandboxInfo, SandboxPolicy } from "./core/sandbox.js";
export { EgressProxy, hostAllowed, DEFAULT_ALLOW_HOSTS } from "./core/egress.js";
export type { EgressRecord } from "./core/egress.js";
export { classifyChanges, stagedChanges } from "./core/risk.js";
export type { RiskFinding, Change } from "./core/risk.js";
export { buildLiveContext } from "./core/packs/context.js";
export type { EngineOptions, EngineDeps } from "./core/api.js";
export { compileBrief } from "./core/compiler.js";
export type { BriefInput } from "./core/compiler.js";
export { buildExecGraph, implNodes, pageLayout, readyNodes, isOwned, componentOwns } from "./core/plan.js";
export type { PageLayout } from "./core/plan.js";
export { ingestRepo, inferMappings } from "./core/ingest/sweep.js";
export type { IngestResult, MappingResult } from "./core/ingest/sweep.js";
export { parseFile, languageOf } from "./core/ingest/parse.js";
export type { FileFacts } from "./core/ingest/parse.js";
export { mintCriteria, packsFor, reqForPack, REQ_BASE, REQ_STYLE } from "./core/criteria.js";
export { listPacks, loadPack, runPack, runPacks, DEFAULT_PACKS, PACK_DIR } from "./core/packs/load.js";
export { buildSiteContext } from "./core/packs/context.js";
export { RUNNERS } from "./core/packs/runners.js";
export type { Pack, PackItem, CheckOutcome, CheckStatus, RunnerId, Applicability } from "./core/packs/types.js";
export type { SiteContext } from "./core/packs/context.js";
export type { CriteriaResult, CriterionRunner } from "./core/criteria.js";
export { buildReport, renderReport } from "./core/report.js";
export { renderExplorer } from "./core/explorer.js";
export type { RunReport, RequirementReport, CriterionReport } from "./core/report.js";
export { runMetrics, projectMetrics, MANDATORY_GATES, latestStatus, criterionStatuses } from "./core/metrics.js";
export type { RunMetrics, ProjectMetrics, CriterionStatus } from "./core/metrics.js";
export { loadBaseChecks } from "./core/design/style.js";
export { TemplateScaffolder, CommandScaffolder, assembleFragments } from "./core/scaffold.js";
export type { Scaffolder, ScaffoldInput, ScaffoldResult, AssemblyResult } from "./core/scaffold.js";
export { loadStyle, listStyles, styleBrief, styleTokensCss, parseFrontmatter, suggestStyles, GUIDE_DIR } from "./core/design/style.js";
export type { StyleGuide, StyleCheck, StyleSuggestion } from "./core/design/style.js";
export { compileMultimodal, readUrl, uncertain, ClaudeVisionInterpreter, RecordedVisionInterpreter, VisionFactsSchema, ENUM_FIELDS } from "./core/intake.js";
export type { MultimodalInput, VisionFacts, VisionInterpreter } from "./core/intake.js";
export {
  acquireAsset,
  measureAsset,
  glbGeometry,
  budgetFor,
  overBudget,
  describeMeasure,
  svgMinifier,
  CommandOptimizer,
  defaultOptimizers,
  DEFAULT_BUDGETS,
} from "./core/assets.js";
export type { AssetMeasure, AssetBudget, AssetOptimizer, AssetType, Acquired } from "./core/assets.js";
export { renderBenchmark, runBenchmark, summarise as summariseBenchmark, serve as serveSite, DEFAULT_SCORERS } from "./core/benchmark.js";
export type { Arm, Scorer, Metric, BenchResult, BenchRun, MetricSummary } from "./core/benchmark.js";
export { scrubbedEnv, weaveMode, ISOLATED_CLAUDE_ARGS } from "./core/runtime.js";
export { CommandDeployer, FakeDeployer, VercelDeployer } from "./core/deploy.js";
export type { Deployer, DeployResult, DeployContext } from "./core/deploy.js";
export { createMcpServer, startMcpServer } from "./mcp/server.js";
export * from "./core/types.js";
export { EventLog } from "./core/events/index.js";
export type { EngineEvent, EngineEventType } from "./core/events/index.js";
export { DesignIRSchema } from "./core/ir/schema.js";
export type { DesignIR } from "./core/ir/schema.js";
export { DECISION_CATALOG, DECISION_MODEL, ModelUnavailableError, UnimplementedDecision } from "./core/decision/index.js";
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
export { ClaudeCodeExecutor, GitHarness, nativeDenyRules } from "./core/runtime.js";
export type {
  ContextPack,
  ExecInput,
  ExecResult,
  ExecutorCapabilities,
  NodeExecutor,
} from "./core/runtime.js";
export { ClaudeDecision, FakeDecision } from "./core/decision/providers.js";
export { ClaudeCodeDecision, ClaudeCodeVisionInterpreter, ClaudeCodeVisionExtractor, claudeJson } from "./core/subscription.js";
export { doctor, renderDoctor } from "./core/doctor.js";
export { TmuxClaudeExecutor, tmuxAvailable, transcriptUsage, AGENT_TOOLS } from "./core/tmux.js";
export { DecisionRunner } from "./core/decision/runner.js";
export type { DecisionOutcome, DecisionRunnerOptions } from "./core/decision/runner.js";
export { runNode } from "./core/loop.js";
export type { LoopNode, NodeLoopResult, RunNodeOptions, VerifyResult, Verifier, EvidenceRecord, AttemptOutcome } from "./core/loop.js";
export { DeterministicVerifier, DEFAULT_CHECKS } from "./core/verify.js";
export type { Check, DeterministicVerifierOptions } from "./core/verify.js";
export { PlaywrightBrowserWorker, ChromeBrowserWorker, FakeBrowserWorker } from "./core/browser.js";
export type { BrowserWorker, BrowserResult } from "./core/browser.js";
export { visualQA, ClaudeVisionExtractor, PageFactsSchema } from "./core/visual.js";
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
export type { MappingFilter, NodeQuery, EvidenceInput, EvidenceRow, AttemptRow } from "./core/store/graph-store.js";

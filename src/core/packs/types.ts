// Policy packs: the weave_changes lists turned into things that are both told to the agent
// and checked on the built site.
//
// Every item is a requirement *and* a check. An item that cannot be evaluated says so —
// `not-applicable` when the project has no such surface, `unavailable` when the runner does
// not exist yet, `human` when no machine can decide it. None of those is a pass.

export type RunnerId =
  | "file-exists"
  | "file-absent"
  | "html-assert"
  | "text-scan"
  | "dep-audit"
  | "file-size"
  | "http-header" // response headers of the deployed site — evaluated post-deploy (V2.4)
  | "browser" // needs the browser worker — unavailable until V2.7
  | "human";

export type Applicability =
  | "always"
  | "hasHtml"
  | "hasForms"
  | "hasAuth"
  | "hasPayments"
  | "hasDatabase"
  | "hasServer"
  | "hasImages"
  | "hasDependencies"
  | "hasStyles"
  | "hasScripts"
  | "hasDeployConfig";

export type ItemSeverity = "blocking" | "advisory";

export interface PackItem {
  id: string;
  /** Told to the agent, in the context pack, before it builds anything. */
  requirement: string;
  runner: RunnerId;
  /** Runner-specific arguments; shape is documented per runner. */
  args?: Record<string, unknown>;
  /** All conditions must hold, or the item is not-applicable with its reason recorded. */
  appliesWhen?: Applicability[];
  severity: ItemSeverity;
  /** Where in v2-inputs.md this came from, so the provenance survives. */
  source?: string;
}

export interface Pack {
  name: string;
  title: string;
  summary: string;
  source: string;
  items: PackItem[];
}

export type CheckStatus = "pass" | "fail" | "not-applicable" | "unavailable" | "human";

export interface CheckOutcome {
  itemId: string;
  status: CheckStatus;
  detail: string;
  severity: ItemSeverity;
  artifactPath?: string;
}

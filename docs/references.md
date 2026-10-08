# References — prior art behind the ideas Weave uses

> Compiled 2026-10-08. **These are not sources Weave was built from.** The repo cited no research
> papers before this file; this is the published work that stands behind each idea, found
> afterwards by search. Read it as prior art and further reading, not as a claim of derivation.

## What was and was not verified

- **Verified:** every paper below resolves on arXiv or by DOI with the title shown; most were also
  matched on first author and year (OpenAlex / arXiv lookup).
- **Title only:** SPOQ, *Before the Tool Call* and *Policies on Paths* were checked without authors.
  The first author of Progent was not confirmed.
- **Google Scholar:** the Scholar search returned nothing, so coverage comes from arXiv, OpenAlex
  and web search. Older work that is not on arXiv is probably under-represented.
- **Patents:** found through web search over Google Patents, not a structured classification
  search. Claims were **not** read (the pages were truncated before the claims). Treat the patent
  table as leads, not as a freedom-to-operate check.
- Not cited in the repo but credited in `autonomous-engineering-universal-context.md`: a study guide
  to *Designing Machine Learning Systems* (a book) and unnamed "supplied graph material".

## 1. A separate checker, not the creator judging itself

Weave: node-loop verification, whole-site checks.

| Paper | Why it matters here |
|---|---|
| Kambhampati et al. 2024, *LLMs Can't Plan, But Can Help Planning in LLM-Modulo Frameworks* — [arXiv:2402.01817](https://arxiv.org/abs/2402.01817) | The model proposes and external verifiers decide; the closest statement of "agents execute, Weave verifies". |
| Stechly et al. 2024, *On the Self-Verification Limitations of Large Language Models on Reasoning and Planning Tasks* — [arXiv:2402.08115](https://arxiv.org/abs/2402.08115) | Evidence that self-critique does not work and an external checker does. |
| Huang et al. 2023, *Large Language Models Cannot Self-Correct Reasoning Yet* — [arXiv:2310.01798](https://arxiv.org/abs/2310.01798) | The same finding from another group. |
| Panickssery et al. 2024, *LLM Evaluators Recognize and Favor Their Own Generations* — [arXiv:2404.13076](https://arxiv.org/abs/2404.13076) | Why the judge should not be the creator. |
| Huang et al. 2023, *AgentCoder: Multi-Agent-based Code Generation with Iterative Testing and Optimisation* — [arXiv:2312.13010](https://arxiv.org/abs/2312.13010) | Separate programmer, test-designer and test-executor agents. |
| Chen et al. 2022, *CodeT: Code Generation with Generated Tests* — [arXiv:2207.10397](https://arxiv.org/abs/2207.10397) | Checking generated code with independently generated tests. |
| Madaan et al. 2023, *Self-Refine: Iterative Refinement with Self-Feedback* — [arXiv:2303.17651](https://arxiv.org/abs/2303.17651) | The retry-with-feedback loop. |
| Shinn et al. 2023, *Reflexion: Language Agents with Verbal Reinforcement Learning* — [arXiv:2303.11366](https://arxiv.org/abs/2303.11366) | Retry using feedback from a failed attempt. |
| Du et al. 2023, *Improving Factuality and Reasoning in Language Models through Multiagent Debate* — [arXiv:2305.14325](https://arxiv.org/abs/2305.14325) | More than one model checking an answer. |
| Zheng et al. 2023, *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena* — [arXiv:2306.05685](https://arxiv.org/abs/2306.05685) | Limits of model judges; supports preferring deterministic checks. |
| Rhodes 2026, *Not Self-Decidable: LLMs Cannot Draw the Boundary of What an Agent Verifier Can Check* — [arXiv:2610.04699](https://arxiv.org/abs/2610.04699) | The split between rules a fixed check can settle and rules needing a judge, which is Weave's criterion typing. |
| Kwok et al. 2026, *LLM-as-a-Verifier: A General-Purpose Verification Framework* — [arXiv:2607.05391](https://arxiv.org/abs/2607.05391) | Verification as its own layer for agentic tasks. |

## 2. Spec-driven generation and traceability

Weave: knowledge graph, criteria linked to evidence.

| Paper | Why it matters here |
|---|---|
| Hong et al. 2023, *MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework* — [arXiv:2308.00352](https://arxiv.org/abs/2308.00352) | Requirements → design → code with structured artifacts between roles. |
| Qian et al. 2023, *ChatDev: Communicative Agents for Software Development* — [arXiv:2307.07924](https://arxiv.org/abs/2307.07924) | A staged software process run by role agents. |
| Lahiri et al. 2022, *Interactive Code Generation via Test-Driven User-Intent Formalization* — [arXiv:2208.05950](https://arxiv.org/abs/2208.05950) | Turning intent into checkable criteria before generating. |
| Endres et al. 2023, *Can Large Language Models Transform Natural Language Intent into Formal Method Postconditions?* — [arXiv:2310.01831](https://arxiv.org/abs/2310.01831) | Natural-language requirements into machine-checkable conditions. |
| Mathews & Nagappan 2024, *Test-Driven Development for Code Generation* — [arXiv:2402.13521](https://arxiv.org/abs/2402.13521) | Acceptance tests first improve generated code. |
| Sun et al. 2023, *Clover: Closed-Loop Verifiable Code Generation* — [arXiv:2310.17807](https://arxiv.org/abs/2310.17807) | Consistency checks between spec, code and docs. |
| Ullrich et al. 2025, *From Requirements to Code: Understanding Developer Practices in LLM-Assisted Software Engineering* — [arXiv:2507.07548](https://arxiv.org/abs/2507.07548) | Requirements must be decomposed before agents can use them. |
| Gotel & Finkelstein 1994, *An Analysis of the Requirements Traceability Problem* — [doi:10.1109/ICRE.1994.292398](https://doi.org/10.1109/ICRE.1994.292398) | The classic source for requirement-to-evidence links. |

## 3. Human approval at decision boundaries

Weave: the gate.

| Paper | Why it matters here |
|---|---|
| Takerngsaksiri et al. 2024, *Human-In-the-Loop Software Development Agents* (HULA, Atlassian) — [arXiv:2411.12924](https://arxiv.org/abs/2411.12924) | Deployed coding agents with human approval of plan and code. |
| Pasuksmit et al. 2025, *Human-In-The-Loop Software Development Agents: Challenges and Future Directions* — [arXiv:2506.11009](https://arxiv.org/abs/2506.11009) | What evaluating such a system cost in practice. |
| Mozannar et al. 2025, *Magentic-UI: Towards Human-in-the-loop Agentic Systems* — [arXiv:2507.22358](https://arxiv.org/abs/2507.22358) | Action guards and approval for risky agent actions. |
| Feng et al. 2025, *Levels of Autonomy for AI Agents* — [arXiv:2506.12469](https://arxiv.org/abs/2506.12469) | Autonomy as a design choice with the user as approver. |
| Horvitz 1999, *Principles of Mixed-Initiative User Interfaces* — [doi:10.1145/302979.303030](https://doi.org/10.1145/302979.303030) | Ask or act based on confidence and the cost of error. |
| Parasuraman, Sheridan & Wickens 2000, *A Model for Types and Levels of Human Interaction with Automation* — [doi:10.1109/3468.844354](https://doi.org/10.1109/3468.844354) | The levels-of-automation model. |
| Mozannar & Sontag 2020, *Consistent Estimators for Learning to Defer to an Expert* — [arXiv:2006.01862](https://arxiv.org/abs/2006.01862) | Deferring to a human when the model should not decide. |
| Geifman & El-Yaniv 2017, *Selective Classification for Deep Neural Networks* — [arXiv:1705.08500](https://arxiv.org/abs/1705.08500) | Abstaining below a confidence threshold. |

## 4. Risk rules and runtime policy enforcement

Weave: risk check, policy packs.

| Paper | Why it matters here |
|---|---|
| Wang et al. 2025, *AgentSpec: Customizable Runtime Enforcement for Safe and Reliable LLM Agents* — [arXiv:2503.18666](https://arxiv.org/abs/2503.18666) | A rule language with triggers, predicates and enforcement, including asking the user. |
| Xiang et al. 2024, *GuardAgent: Safeguard LLM Agents by a Guard Agent via Knowledge-Enabled Reasoning* — [arXiv:2406.09187](https://arxiv.org/abs/2406.09187) | A guard agent checking another agent against rules. |
| Schneider 2000, *Enforceable Security Policies* — [doi:10.1145/353323.353382](https://doi.org/10.1145/353323.353382) | Theory of what a runtime monitor can enforce. |
| Greenblatt et al. 2023, *AI Control: Improving Safety Despite Intentional Subversion* — [arXiv:2312.06942](https://arxiv.org/abs/2312.06942) | Trusted monitoring and auditing of an untrusted model's code. |
| Srinivasan 2026, *A Methodology for Selecting and Composing Runtime Architecture Patterns for Production LLM Agents* — [arXiv:2605.20173](https://arxiv.org/abs/2605.20173) | Proposer / verifier / commit / reject boundary, with supervisor-plus-gate and human-in-the-loop patterns. |
| Koch 2026, *From Governance Norms to Enforceable Controls: A Layered Translation Method for Runtime Guardrails in Agentic AI* — [arXiv:2604.05229](https://arxiv.org/abs/2604.05229) | Mapping governance standards to runtime guardrails, escalation and audit. |
| Li et al. 2026, *VIGIL: Runtime Enforcement of Behavioral Specifications in AI Agent Skills* — [arXiv:2606.26524](https://arxiv.org/abs/2606.26524) | Checking an agent's execution trace against written policies. |
| *Before the Tool Call: Deterministic Pre-Action Authorization for Autonomous AI Agents* 2026 — [arXiv:2603.20953](https://arxiv.org/abs/2603.20953) | Policy check before each action, with an audit record. |
| *Runtime Governance for AI Agents: Policies on Paths* 2026 — [arXiv:2603.16586](https://arxiv.org/abs/2603.16586) | Policies over sequences of agent actions. |

## 5. Sandboxing and isolation

Weave: bubblewrap, isolated `claude` runs.

| Paper | Why it matters here |
|---|---|
| Saltzer & Schroeder 1975, *The Protection of Information in Computer Systems* — [doi:10.1109/PROC.1975.9939](https://doi.org/10.1109/PROC.1975.9939) | Least privilege and fail-safe defaults. |
| Greshake et al. 2023, *Not What You've Signed Up For: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection* — [arXiv:2302.12173](https://arxiv.org/abs/2302.12173) | The threat that makes isolation necessary. |
| Beurer-Kellner et al. 2025, *Design Patterns for Securing LLM Agents against Prompt Injections* — [arXiv:2506.08837](https://arxiv.org/abs/2506.08837) | Architecture-level isolation patterns. |
| Debenedetti et al. 2025, *Defeating Prompt Injections by Design* (CaMeL) — [arXiv:2503.18813](https://arxiv.org/abs/2503.18813) | Capability-based control around the model. |
| Wu et al. 2024, *IsolateGPT: An Execution Isolation Architecture for LLM-Based Agentic Systems* — [arXiv:2403.04960](https://arxiv.org/abs/2403.04960) | Execution isolation between agent components. |
| Kim et al. 2025, *Prompt Flow Integrity to Prevent Privilege Escalation in LLM Agents* — [arXiv:2503.15547](https://arxiv.org/abs/2503.15547) | Agent isolation and privilege-escalation guardrails. |
| *Progent: Securing AI Agents with Privilege Control* 2025 — [arXiv:2504.11703](https://arxiv.org/abs/2504.11703) | Programmable privilege control over tool calls. |
| Yang et al. 2024, *SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering* — [arXiv:2405.15793](https://arxiv.org/abs/2405.15793) | A coding agent run inside a sandboxed environment. |
| Wang et al. 2024, *OpenHands: An Open Platform for AI Software Developers as Generalist Agents* — [arXiv:2407.16741](https://arxiv.org/abs/2407.16741) | Sandboxed runtime for coding agents. |
| Ruan et al. 2023, *Identifying the Risks of LM Agents with an LM-Emulated Sandbox* — [arXiv:2309.15817](https://arxiv.org/abs/2309.15817) | Risk assessment of agent actions. |

## 6. Work as a graph of jobs

Weave: execution graph, parallel agents.

| Paper | Why it matters here |
|---|---|
| Kim et al. 2023, *An LLM Compiler for Parallel Function Calling* — [arXiv:2312.04511](https://arxiv.org/abs/2312.04511) | Plan as a DAG, run independent tasks in parallel. |
| *SPOQ: Specialist Orchestrated Queuing for Multi-Agent Software Engineering* 2026 — [arXiv:2606.03115](https://arxiv.org/abs/2606.03115) | Dependency-graph dispatch with validation gates before and after execution; the closest single match to Weave. |
| Besta et al. 2023, *Graph of Thoughts: Solving Elaborate Problems with Large Language Models* — [arXiv:2308.09687](https://arxiv.org/abs/2308.09687) | Reasoning steps as a graph. |
| Zhuge et al. 2024, *Language Agents as Optimizable Graphs* — [arXiv:2402.16823](https://arxiv.org/abs/2402.16823) | Agent systems as computational graphs. |
| Zhang et al. 2024, *AFlow: Automating Agentic Workflow Generation* — [arXiv:2410.10762](https://arxiv.org/abs/2410.10762) | Workflows as graphs of model-calling nodes. |
| Qian et al. 2024, *Scaling Large Language Model-based Multi-Agent Collaboration* — [arXiv:2406.07155](https://arxiv.org/abs/2406.07155) | Agents organised as a directed acyclic graph. |
| Wu et al. 2023, *AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation* — [arXiv:2308.08155](https://arxiv.org/abs/2308.08155) | The reference multi-agent framework. |
| Cemri et al. 2025, *Why Do Multi-Agent LLM Systems Fail?* — [arXiv:2503.13657](https://arxiv.org/abs/2503.13657) | Failure taxonomy; verification gaps are a major category. |

## 7. Typed decisions with confidence

Weave: the decision layer.

| Paper | Why it matters here |
|---|---|
| Xiong et al. 2023, *Can LLMs Express Their Uncertainty? An Empirical Evaluation of Confidence Elicitation in LLMs* — [arXiv:2306.13063](https://arxiv.org/abs/2306.13063) | Verbalized confidence is overconfident. |
| Tian et al. 2023, *Just Ask for Calibration* — [arXiv:2305.14975](https://arxiv.org/abs/2305.14975) | How to elicit better-calibrated confidence. |
| Kadavath et al. 2022, *Language Models (Mostly) Know What They Know* — [arXiv:2207.05221](https://arxiv.org/abs/2207.05221) | How far a model's own confidence can be trusted. |
| Guo et al. 2017, *On Calibration of Modern Neural Networks* — [arXiv:1706.04599](https://arxiv.org/abs/1706.04599) | The standard reference on calibration. |
| Willard & Louf 2023, *Efficient Guided Generation for Large Language Models* — [arXiv:2307.09702](https://arxiv.org/abs/2307.09702) | Constraining output to a schema, the basis of typed decisions. |

## 8. Evidence, audit and honest measurement

Weave: records, the benchmark.

| Paper | Why it matters here |
|---|---|
| Chan et al. 2024, *Visibility into AI Agents* — [arXiv:2401.13138](https://arxiv.org/abs/2401.13138) | Activity logging and monitoring as governance. |
| Chan et al. 2025, *Infrastructure for AI Agents* — [arXiv:2501.10114](https://arxiv.org/abs/2501.10114) | Shared systems for attributing and overseeing agent actions. |
| Jimenez et al. 2023, *SWE-bench: Can Language Models Resolve Real-World GitHub Issues?* — [arXiv:2310.06770](https://arxiv.org/abs/2310.06770) | Scoring agents by executable checks, not model judgment. |
| Si et al. 2024, *Design2Code: Benchmarking Multimodal Code Generation for Automated Front-End Engineering* — [arXiv:2403.03163](https://arxiv.org/abs/2403.03163) | Benchmark for generated web front ends. |
| Becker et al. 2025, *Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity* — [arXiv:2507.09089](https://arxiv.org/abs/2507.09089) | A measured result that went against expectation, like Weave's own benchmark. |

## Patents

None of these matches Weave's full combination. Claims were not read; see the note at the top.

| Patent | Assignee | What it covers |
|---|---|---|
| [US12061880B2](https://patents.google.com/patent/US12061880B2/en), *Systems and methods for generating code using language models trained on computer code* (priority 2022, granted 2024) | OpenAI | Code generation with samples executed in a sandbox. No human approval. |
| [US12254334B2](https://patents.google.com/patent/US12254334B2/en), *Bootstrapping dynamic orchestration workflow* (priority 2022, granted 2025) | IBM | An execution dependency graph that generates and sequences an agent per subtask. |
| [US12412138B1](https://patents.google.com/patent/US12412138B1/en), *Agentic orchestration* (priority 2024, granted 2025) | UiPath | Orchestrated agents with human sign-off steps, governance policies and execution logs. |
| [US12346713B1](https://patents.google.com/patent/US12346713B1/en), *Unified artificial intelligence agent, robotic process automation robot, and agentic orchestration process development applications* (priority 2024, granted 2025) | UiPath | Agents that escalate to a human and suspend until the step is done. |
| [US12061970B1](https://patents.google.com/patent/US12061970B1/en), *Systems and methods of large language model driven orchestration of task-specific machine learning software agents* (priority 2023, granted 2024) | Broadridge | An orchestrating model plus a compliance agent that checks other agents' output against a ruleset. |

Leads surfaced but not opened: US12204323 (generated code tested in a virtual machine against
validation criteria) and CN122018889A (verifying model-generated code against user intent).

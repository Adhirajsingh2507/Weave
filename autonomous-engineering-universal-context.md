# UNIVERSAL CONTEXT — AUTONOMOUS ENGINEERING / DESIGN-TO-CODE SYSTEM

> This document is the canonical context package for starting the project with Codex, Claude Code, OpenHands, or another capable coding agent.
>
> It consolidates the ideas, architecture, terminology, principles, constraints, and unresolved decisions developed in the conversation so far.
>
> **Important:** This is a product/system-design context, not a claim that every component described here must be implemented immediately. The purpose is to give a coding agent the complete mental model before implementation begins.

---

# 0. Executive Context

We are designing a **general autonomous engineering platform**, initially focused on building and evolving websites/web applications from human design intent, but deliberately architected so the underlying engine can later support broader software projects.

The original idea was:

- The human provides ideas, design names, plans, references, screenshots, websites, 3D objects, assets, requirements, and other inputs.
- The system uses **loop engineering** and **graph engineering** to transform those inputs into a working product.
- A coding agent performs the actual implementation.
- The system itself manages planning, graph topology, state, context, tools, permissions, verification, visual QA, retries, repair, approvals, evidence, and history.

The refined idea is substantially broader:

> **Build an autonomous engineering system in which humans define intent, constraints, and acceptance criteria; a persistent project knowledge model represents what the project is; an execution graph determines how work is allowed to flow; agent harnesses provide bounded execution environments; local loops drive implementation and repair; independent evaluators provide evidence; and persistent state, observability, versioning, and feedback allow the system to operate throughout the lifetime of the project.**

The system is NOT intended to be merely:

- a prompt wrapper around Claude Code,
- a giant autonomous agent with one enormous context window,
- a static workflow diagram,
- a simple website generator,
- or a collection of agents spawned without structure.

It is intended to be an **engineering control plane + execution system**.

---

# 1. The Core Mental Model

The system has five foundational concepts:

```text
Prompt Engineering
    = better instructions

Context Engineering
    = better information available to the model

Harness Engineering
    = better execution environment, tools, permissions, context management,
      isolation, persistence, and controls around an agent

Loop Engineering
    = better local execution through repeated
      discover → act → verify → record → retry/repair cycles

Graph Engineering
    = better coordination between multiple tasks/agents,
      with explicit dependencies, state, artifacts, branches,
      approvals, parallelism, recovery, and change history
```

These are complementary, not replacements for one another.

A graph does not replace loops.

A loop does not replace a graph.

A harness is not merely a prompt.

The fundamental relationship is:

```text
                EXECUTION GRAPH
                      │
         ┌────────────┼─────────────┐
         │            │             │
       Node A       Node B        Node C
         │            │             │
       Loop         Loop          Loop
         │            │             │
      Agent        Agent         Agent
         │            │             │
      Harness      Harness       Harness
```

The **graph controls topology**.

The **node owns a bounded task**.

The **loop controls local execution quality**.

The **harness controls the environment in which the agent operates**.

The **state/evidence system records what actually happened**.

---

# 2. Important Source Concepts Incorporated Into This Design

The project design was informed by two main bodies of material supplied by the user.

## 2.1 Graph / Loop / Harness Engineering material

The supplied material describes the evolution from prompt engineering → loop engineering → graph engineering and emphasizes:

- loops are iterative processes where AI produces a deliverable, evaluates it, identifies problems, fixes them, and evaluates again;
- graph engineering concerns the topology between tasks/processes;
- graphs make dependencies, parallelism, failure recovery, state, artifacts, permissions, observations, evaluations, and history explicit;
- important graph nodes may still contain loops;
- graph engineering is valuable for cross-domain work, multiple agents, parallel execution, approvals, audits, and recovery;
- not every task should be converted into a graph;
- graph complexity should be justified by actual workflow complexity;
- intermediate outputs/evidence should be persisted rather than disappearing into model context;
- separate evaluators/checkers are valuable because a creator should not always be the sole judge of its own work;
- human approval should occur at meaningful decision boundaries rather than after every tiny action.

The supplied graph material characterizes a graph as jobs connected by arrows, with state representing what the system knows so far, and emphasizes designing the work around the AI rather than allowing everything to live in one giant chat.

## 2.2 Designing Machine Learning Systems material

The supplied study guide contributes broader production-system engineering principles:

- reliability
- scalability
- maintainability
- adaptability
- iterative rather than strictly linear lifecycle design
- explicit baselines
- experiment tracking/versioning
- independent evaluation
- observability
- production monitoring
- drift detection
- reproducibility
- infrastructure standardization
- containers
- schedulers/orchestrators
- model/platform-style persistent stores
- graceful failure
- human-centered system design
- responsible AI integrated throughout the lifecycle.

These ideas should influence the engineering architecture even when the immediate application is web/software engineering rather than model training.

---

# 3. The Product Vision

The platform should eventually allow a user to say something like:

> Build a futuristic AI robotics website.
>
> Visual direction: dark industrial, cinematic, minimal, high contrast.
> Use this reference website as inspiration.
> Use this Figma design.
> Use this 3D robot `.glb`.
> Pages: Home, Products, Research, About.
> Stack: Next.js + TypeScript + Tailwind.
> The hero should contain a large 3D robot and interactive scroll motion.
> The site must be mobile-first.
> Use these brand colors and this logo.
> Keep performance high.
> Deploy to Vercel after approval.

The platform should NOT simply send this giant request to an agent.

Instead it should:

```text
User Input
    ↓
Input / Intent Interpretation
    ↓
Design + Requirement Compilation
    ↓
Project Knowledge Model
    ↓
Execution Graph Generation
    ↓
Bounded Agent Execution
    ↓
Testing / Browser QA / Visual QA
    ↓
Evidence
    ↓
Quality Gate
    ├── PASS → continue
    └── FAIL → diagnose → repair → verify
    ↓
Human Gate(s) where required
    ↓
Release / Deployment
    ↓
Post-release observation
    ↓
New tasks / maintenance graph
```

---

# 4. Universal Architectural Principle

The most important rule:

> **The system should ask "What workflow will reliably produce the requested artifact?" rather than "What prompt should I send to the coding agent?"**

The coding agent is a worker.

The system is the engineering control plane.

---

# 5. Four Major Persistent Layers

The architecture should be thought of as four persistent layers.

```text
┌────────────────────────────────────────────────────┐
│ 1. PROJECT KNOWLEDGE MODEL / KNOWLEDGE GRAPH      │
│                                                    │
│ What the project IS                                │
│ Requirements, designs, pages, components, assets, │
│ APIs, constraints, decisions, tests, evidence...  │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│ 2. EXECUTION GRAPH                                │
│                                                    │
│ How work is ALLOWED TO MOVE                       │
│ Dependencies, branches, parallel work, gates,     │
│ retries, recovery, escalations                     │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│ 3. AGENT / HARNESS RUNTIME                        │
│                                                    │
│ How a worker actually executes a node              │
│ Context, tools, permissions, sandbox, model,       │
│ workspace, state snapshots, timeouts               │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│ 4. EVIDENCE / QUALITY / OBSERVABILITY SYSTEM      │
│                                                    │
│ What actually happened and whether it passed       │
│ Tests, screenshots, logs, traces, metrics, diffs,  │
│ evaluations, approvals, failures                    │
└────────────────────────────────────────────────────┘
```

---

# 6. Knowledge Graph vs Execution Graph

This distinction is fundamental.

## 6.1 Project Knowledge Graph

The knowledge graph represents **relationships inside the project**.

Example:

```text
Project
  ├── contains → Home
  ├── contains → Products
  └── contains → Research

Home
  ├── contains → Hero
  ├── contains → Features
  └── contains → CTA

Hero
  ├── uses → Robot.glb
  ├── follows → Brand/Typography
  ├── constrained_by → MobilePerformance
  ├── implemented_by → components/Hero.tsx
  └── verified_by → HeroVisualCheck
```

The knowledge graph is not merely a JSON blob. It should represent entities and relationships explicitly enough to answer questions such as:

- What uses this asset?
- Which requirements affect this component?
- Which tests verify this requirement?
- Which design decision caused this architecture choice?
- Which code files implement this component?
- Which changes are downstream of this API?
- What breaks if this dependency changes?
- Which agent produced this artifact?
- Which evidence supports this decision?

## 6.2 Execution Graph

The execution graph represents **work movement**.

Example:

```text
Analyze Repository
      ↓
Extract Requirements
      ↓
Compile Design
      ↓
Create Architecture
      ↓
    ┌─┴────────────┐
    ▼              ▼
Build UI       Build 3D
    │              │
    └──────┬───────┘
           ▼
      Integration
           ↓
        Code QA
           ↓
       Browser QA
           ↓
       Visual QA
           ↓
      Quality Gate
       /       \
    PASS       FAIL
     │           │
     ▼           ▼
  Continue    Diagnose
                 ↓
               Repair
                 ↓
             Re-verify
```

The execution graph can be dynamically generated or revised, but it must remain explicit and inspectable.

---

# 7. Design Is a Domain, Not a Separate Fundamental Graph

Earlier brainstorming considered a separate "Design Graph."

The refined architecture should instead make design a major domain within the project knowledge model.

For example:

```text
PROJECT
│
├── BRAND
│   ├── Logo
│   ├── Colors
│   ├── Typography
│   ├── Voice
│   └── Visual Language
│
├── EXPERIENCE
│   ├── Home
│   ├── Products
│   ├── Research
│   └── About
│
├── COMPONENTS
│   ├── Navbar
│   ├── Hero
│   ├── ProductCard
│   ├── FeatureGrid
│   └── Footer
│
├── ASSETS
│   ├── logo.svg
│   ├── hero.glb
│   ├── product.webp
│   └── demo.mp4
│
├── INTERACTIONS
│   ├── hover
│   ├── scroll
│   ├── page transitions
│   └── 3D interaction
│
├── TECHNICAL
│   ├── framework
│   ├── styling
│   ├── backend
│   ├── database
│   └── deployment
│
└── CONSTRAINTS
    ├── mobile
    ├── accessibility
    ├── performance
    ├── SEO
    └── security
```

---

# 8. Design / Requirement Compiler

The system should support multimodal project intake.

Potential inputs:

- natural-language ideas
- rough requirements
- screenshots
- reference websites
- videos
- Figma
- design files
- brand guides
- logos
- SVGs
- images
- fonts
- PDFs
- 3D objects (`.glb`, `.gltf`, potentially others)
- videos
- existing code repositories
- asset folders
- existing architecture documentation
- APIs
- database schemas
- examples of preferred components
- design names / aesthetic labels
- constraints
- non-functional requirements

These inputs are passed into a **Design / Requirement Compiler**.

```text
Raw Inputs
    ↓
Interpretation
    ↓
Normalization
    ↓
Conflict Resolution
    ↓
Requirement Objects
    ↓
Design Objects
    ↓
Constraint Objects
    ↓
Acceptance Criteria
    ↓
Project Knowledge Model
```

The compiler should not be allowed to silently lose important information.

Every significant input should either:

- become structured knowledge,
- become a reference,
- become an asset,
- become a constraint,
- or be marked as unresolved/ambiguous.

---

# 9. Design IR (Intermediate Representation)

A structured Design IR should exist between raw user input and code generation.

Conceptually:

```json
{
  "project": {
    "name": "",
    "summary": "",
    "type": ""
  },

  "brand": {
    "colors": {},
    "typography": {},
    "logo": {},
    "tone": "",
    "visualLanguage": {}
  },

  "pages": [],

  "components": [],

  "layouts": [],

  "interactions": [],

  "animations": [],

  "assets": [],

  "responsiveRules": [],

  "technicalConstraints": [],

  "accessibilityRequirements": [],

  "performanceRequirements": [],

  "seoRequirements": [],

  "securityRequirements": [],

  "acceptanceCriteria": [],

  "references": []
}
```

The Design IR is not necessarily the database itself. It is a normalized representation that downstream graph planning and agents can consume.

---

# 10. Reference Website Handling

If a user supplies a website as inspiration, the system should distinguish:

- inspiration
- explicit requirements
- reusable assets
- structural patterns
- visual characteristics
- interaction patterns
- actual user-owned material
- material that should not simply be copied.

The system should extract characteristics such as:

```text
layout characteristics
typography hierarchy
spacing system
visual density
motion philosophy
interaction patterns
navigation patterns
color relationships
composition
image treatment
3D treatment
```

The system should NOT blindly turn:

> "Take inspiration from this"

into:

> "Duplicate this website exactly."

A reference should become a structured design/reference object.

---

# 11. Conflict Resolution Rules

Potential conflicts include:

- user prompt vs screenshot
- screenshot vs Figma
- Figma vs existing repository
- design input vs existing architecture
- user preference vs performance constraints
- reference site vs ownership/licensing constraints
- 3D asset vs mobile performance budget

Do not silently resolve major conflicts.

Recommended conceptual hierarchy:

```text
Explicit current user instruction
        ↓
Explicit project requirements / approved decisions
        ↓
Formal design specification
        ↓
Approved Figma/design artifact
        ↓
Other reference materials
        ↓
Existing implementation
        ↓
Agent inference
```

However, this hierarchy is still a product decision and must remain configurable.

When a lower-level artifact conflicts with a higher-priority requirement, the system should create a **conflict record** rather than silently changing requirements.

---

# 12. User Authority Principle

The user should remain the authority over product intent.

The AI may:

- warn,
- analyze,
- propose alternatives,
- identify risks,
- estimate impact,
- recommend a safer implementation.

The AI should not silently override an explicit product requirement.

Example:

User:

> Use a 15 MB 3D asset in the hero.

System:

> This exceeds the mobile performance budget. Recommended approach: optimize the mesh + texture and provide a mobile fallback.

If the user intentionally accepts the tradeoff, that should become an explicit project decision.

---

# 13. Acceptance Criteria

Every substantial node should have explicit acceptance criteria.

Example:

```yaml
hero:
  required:
    - headline
    - CTA
    - 3d_robot
    - scroll_transition

  behavior:
    cta_clickable: true
    model_interactive: true
    mobile_fallback: true

  visual:
    theme: dark
    typography_scale: large
    composition: asymmetric

  acceptance:
    - hero_visible
    - CTA_action_works
    - model_renders
    - animation_runs
    - no_console_errors
    - mobile_layout_valid
    - performance_budget_met
```

The definition of "done" must be externalized.

An agent saying "done" is not evidence.

---

# 14. Graph Node Contract

A graph node should be a structured execution object.

Example:

```yaml
node:
  id: build_hero
  type: implementation

  purpose:
    Build the homepage hero.

  inputs:
    - design.hero
    - brand.tokens
    - assets.hero_model
    - project.architecture
    - relevant.existing_components

  outputs:
    - source_changes
    - tests
    - evidence

  dependencies:
    - architecture.complete
    - design.hero.approved

  tools:
    - filesystem
    - terminal
    - browser
    - git

  permissions:
    read:
      - src/**
      - public/**
      - design/**
    write:
      - src/components/Hero.*
      - tests/hero.*
    deny:
      - .env
      - production_secrets

  acceptance:
    - functional_tests_pass
    - visual_check_pass
    - mobile_check_pass

  retry:
    max_attempts: 4

  timeout:
    minutes: 30

  escalation:
    after_attempts: 4

  artifacts:
    required:
      - diff
      - test_results
      - screenshot
```

---

# 15. Node Types

The initial engine should support a small vocabulary.

Possible node types:

```text
input
planning
research
analysis
design
architecture
implementation
asset_processing
integration
test
browser_test
visual_evaluation
review
approval
repair
deployment
monitoring
rollback
human_gate
```

Avoid creating a new node type for every variation.

Node behavior should be composable.

---

# 16. The Loop Protocol

Each important execution node may run an internal loop.

Canonical loop:

```text
DISCOVER
   ↓
UNDERSTAND CURRENT STATE
   ↓
PLAN LOCAL ACTION
   ↓
EXECUTE
   ↓
OBSERVE RESULT
   ↓
VALIDATE
   ↓
RECORD EVIDENCE
   ↓
DECIDE
 ┌─┴─────────────┐
 │               │
PASS            FAIL
 │               │
 ▼               ▼
DONE          DIAGNOSE
                  ↓
               REPAIR
                  ↓
                RETRY
```

The loop should have:

- trigger condition
- state access
- allowed tools
- validator(s)
- retry strategy
- stopping condition
- maximum attempts
- escalation strategy
- evidence recording.

---

# 17. Loop States

Recommended conceptual states:

```text
PENDING
READY
RUNNING
WAITING
VERIFYING
PASSED
FAILED
RETRYING
BLOCKED
ESCALATED
APPROVAL_REQUIRED
CANCELLED
ROLLED_BACK
```

Do not use vague "done" flags.

Distinguish:

- implemented
- tested
- verified
- approved
- deployed.

---

# 18. Agent Harness

The harness is the runtime wrapper around an agent.

It controls:

```text
Model
Context
Workspace
Tools
Permissions
Environment
Memory
Time
Retries
Checkpoints
Observability
Network access
Secrets
Artifact capture
```

An agent should receive a **Context Pack** rather than the entire project indiscriminately.

Example:

```yaml
context_pack:
  task:
    id: build_hero

  goal:
    Build hero according to approved design requirements.

  relevant_entities:
    - home
    - hero
    - hero.glb

  relevant_files:
    - app/page.tsx
    - components/Hero.tsx
    - styles/globals.css

  design_rules:
    - dark_theme
    - large_typography
    - cinematic_spacing

  constraints:
    - mobile_required
    - performance_required
    - accessibility_required

  previous_failures:
    - hero_overflow_768px

  tools:
    - terminal
    - filesystem
    - browser
    - git

  permissions:
    write:
      - components/**
    deny:
      - .env
      - credentials
      - production
```

---

# 19. Coding Agent Abstraction

The system should not depend permanently on one coding agent.

Preferred architecture:

```text
Agent Runtime
      │
      ├── Claude Code Adapter
      ├── Codex Adapter
      ├── OpenHands Adapter
      └── Future Agent Adapter
```

The execution graph should ask for capabilities rather than hard-coding one vendor.

Conceptual interface:

```typescript
interface CodingAgent {
  inspect(request: InspectionRequest): Promise<InspectionResult>;
  execute(task: AgentTask): Promise<AgentResult>;
  runTests(request: TestRequest): Promise<TestResult>;
  getDiff(): Promise<DiffResult>;
  checkpoint(): Promise<CheckpointResult>;
  rollback(checkpointId: string): Promise<RollbackResult>;
}
```

The exact interface can be adapted after selecting the first runtime.

---

# 20. Agent Specialization

Do not create many agents merely to create many agents.

Use specialized agents where specialization gives:

- distinct permissions,
- distinct context,
- distinct expertise,
- independent verification,
- parallelism,
- meaningful isolation.

Potential roles:

```text
Planner
Architect
Designer
Frontend Engineer
Backend Engineer
3D Engineer
Animation Engineer
Asset Engineer
QA Engineer
Browser QA
Visual QA
Security Reviewer
Performance Reviewer
Release Engineer
```

But the first version may work better with fewer roles.

Potential V1:

```text
Planner
Implementation Agent
QA / Test Agent
Visual QA Agent
Release Agent
```

The graph should determine where role specialization is actually valuable.

---

# 21. Design Agent vs Coding Agent

The system should separate design interpretation from implementation.

Design layer:

```text
What should this look/feel/behave like?
```

Implementation layer:

```text
How should this be implemented in the selected stack?
```

This prevents every coding agent from inventing its own interpretation of the design.

---

# 22. Independent Evaluation

Never rely exclusively on the implementation agent to evaluate its own work.

Quality architecture:

```text
Implementation
      ↓
┌─────┼──────────────┐
│     │              │
▼     ▼              ▼
Code  Browser       Visual
QA    QA             QA
      │              │
      └──────┬───────┘
             ▼
       Quality Gate
```

Potential checkers:

### Deterministic

- TypeScript compile
- lint
- unit tests
- integration tests
- end-to-end tests
- broken links
- schema validation
- accessibility rules
- bundle size
- build success
- dependency checks
- secret detection
- browser console errors

### Model-assisted

- visual similarity
- design compliance
- UX consistency
- animation quality
- aesthetic consistency
- requirement completeness
- semantic correctness.

Use deterministic tests whenever the criterion can be made deterministic.

---

# 23. Visual QA

Visual QA is a first-class subsystem because the target product is design-heavy.

Workflow:

```text
Launch
  ↓
Open route
  ↓
Capture screenshot(s)
  ↓
Capture responsive viewports
  ↓
Compare against design/reference/specification
  ↓
Identify defects
  ↓
Generate structured failures
```

Possible evidence:

```text
desktop screenshot
tablet screenshot
mobile screenshot
animation frame
DOM snapshot
browser trace
console log
computed layout
performance metrics
```

A visual failure should look like:

```yaml
failure:
  type: visual_mismatch
  severity: high
  component: hero

  expected:
    hero_height: 780px

  observed:
    hero_height: 620px

  evidence:
    - screenshot
    - browser_trace

  likely_causes:
    - incorrect viewport calculation
    - conflicting container rule

  repair_targets:
    - build_hero
    - responsive_layout
```

---

# 24. 3D Asset System

3D objects must be first-class assets.

Asset registry example:

```yaml
asset:
  id: robot_model
  type: 3d_model
  format: glb
  source: user

  metadata:
    dimensions: {}
    polygon_count: {}
    texture_count: {}
    file_size_mb: {}

  intended_use:
    - home.hero

  constraints:
    desktop_enabled: true
    mobile_fallback_required: true
    max_transfer_mb: 8
```

Graph relationship:

```text
robot_model
   ├── used_by → Home.Hero
   ├── optimized_by → AssetOptimizationNode
   ├── rendered_by → WebGLImplementation
   ├── tested_by → VisualQA
   └── constrained_by → MobilePerformance
```

Potential asset pipeline:

```text
Inspect
  ↓
Optimize
  ↓
Compress
  ↓
Generate LOD/fallback if needed
  ↓
Integrate
  ↓
Performance test
  ↓
Visual test
```

---

# 25. Asset Registry

Every important asset should have metadata.

Possible asset types:

```text
image
video
3d_model
font
svg
icon
audio
document
dataset
api_spec
design_file
reference
```

Each asset should track:

- source
- ownership/status
- format
- size
- usage
- dependencies
- transformations
- outputs
- permissions
- constraints
- related requirements.

---

# 26. Failure Handling

The system should distinguish:

```text
Failure
  ↓
Classification
  ↓
Root Cause
  ↓
Affected Node(s)
  ↓
Repair Strategy
  ↓
Re-execute
```

Failure classes may include:

```text
syntax
build
test
runtime
visual
performance
accessibility
security
dependency
environment
asset
architecture
requirement_conflict
agent_failure
timeout
permission
external_service
```

A failure should carry:

```text
type
severity
node
attempt
evidence
probable cause
affected entities
repair strategy
escalation policy
```

---

# 27. Recovery / Rollback

The system must be recoverable.

A node should be able to:

- retry
- retry with another strategy
- retry with another agent
- rollback
- branch
- escalate
- request human input.

Potential recovery graph:

```text
FAIL
  ↓
Classify
  ↓
Retry same strategy?
  ├── yes → retry
  └── no
       ↓
Alternate strategy
       ↓
Still fails?
  ├── no → continue
  └── yes
       ↓
Escalate / Human Gate
```

---

# 28. Persistent State

The system cannot rely on agent context as permanent memory.

Persistent state should include:

```text
project state
graph state
node state
agent run state
artifact registry
requirements
design decisions
approvals
test results
visual evidence
failure history
change history
execution history
environment state
```

Conceptual state:

```json
{
  "projectId": "",
  "graphVersion": "",
  "status": "",
  "activeNodes": [],
  "completedNodes": [],
  "failedNodes": [],
  "blockedNodes": [],
  "approvals": [],
  "artifacts": [],
  "evidence": [],
  "decisions": [],
  "executions": []
}
```

---

# 29. Artifact Model

Artifacts should be first-class.

Potential artifacts:

```text
requirement spec
design spec
architecture doc
component map
asset manifest
source code
patch/diff
tests
test results
screenshots
browser traces
visual reports
performance reports
security reports
deployment manifests
release notes
decision records
failure reports
```

An artifact should be linked to:

- creator
- node
- execution
- graph version
- input artifacts
- approval state
- timestamp/version.

---

# 30. Evidence Model

Every significant claim should have evidence.

Example:

```text
Node: BuildHero

Claim:
"Hero meets mobile requirement."

Evidence:
- mobile E2E test
- mobile screenshot
- layout assertions
- performance result

Status:
verified
```

Evidence should make the system auditable.

---

# 31. Change History

Every meaningful state transition should be recorded.

Examples:

```text
graph created
graph revised
requirement added
requirement changed
design approved
node started
node completed
artifact created
artifact modified
test passed
test failed
visual failure detected
repair executed
human approval granted
human rejection
deployment started
deployment completed
rollback performed
```

---

# 32. Graph Versioning

Graphs themselves should be versioned.

Example:

```text
Graph v1
  initial build

Graph v2
  added 3D optimization stage

Graph v3
  added mobile performance gate

Graph v4
  changed release approval policy
```

Execution records should link to the graph version that produced them.

---

# 33. Reproducibility

The system should be capable of answering:

> Why did version X look like this?

and:

> Can I reproduce the execution that produced it?

Store:

```text
graph version
design version
requirements version
agent/runtime version
model/provider
tool versions
environment version
code commit
input artifacts
configuration
evaluation criteria
execution history
```

This is inspired by the experiment tracking/versioning principles from production ML systems.

---

# 34. Baselines and Experiments

The platform should support explicit comparisons.

Example:

```text
Baseline:
Current website

Candidate:
Agent-generated website

Compare:
- build reliability
- visual similarity
- accessibility
- performance
- bundle size
- test pass rate
- runtime errors
```

Potential experiment object:

```yaml
experiment:
  id: hero_design_003

  hypothesis:
    "Reduced 3D scale improves mobile performance without
     violating visual composition."

  inputs:
    - design.v5
    - robot_model.optimized

  strategy:
    - reduced_model_scale

  metrics:
    visual_score:
    mobile_lcp:
    bundle_size:
    runtime_errors:

  artifacts:
    - screenshot
    - report

  outcome:
    status: passed
```

---

# 35. Quality Gates

A graph should not advance merely because a node finished.

Example:

```text
Implementation
      ↓
Code QA
      ↓
Browser QA
      ↓
Visual QA
      ↓
Performance QA
      ↓
Accessibility QA
      ↓
Quality Gate
```

The gate can require:

```text
all required tests pass
AND
visual thresholds pass
AND
no critical runtime errors
AND
performance budget passes
AND
required approval present
```

---

# 36. Human Gates

Human approvals should be explicit graph nodes.

Examples:

```text
Design Approval
Architecture Approval
Dependency Approval
Security Approval
Database Migration Approval
Production Release Approval
```

Example:

```text
QA
 ↓
HUMAN_GATE
 ├── approve → Release
 └── reject → Repair
```

Human intervention should happen at high-value decisions, not after every file write.

---

# 37. Permission Model

Every node should have explicit permissions.

Potential dimensions:

```text
filesystem read
filesystem write
network
git
deployment
secrets
database
external APIs
browser
package management
cloud infrastructure
```

Example:

```yaml
permissions:
  filesystem:
    read:
      - src/**
      - public/**
    write:
      - src/components/**
  network:
    allowed: false
  secrets:
    allowed: false
  deployment:
    allowed: false
```

Higher-risk actions should require explicit policy or a human gate.

---

# 38. Environment Model

The execution environment must be controlled.

Initial options:

```text
local workspace
Docker sandbox
remote VM
cloud worker
```

Long-term, the platform may support multiple execution backends.

The graph should not care where the node is executed.

It should request capabilities.

---

# 39. Concurrency

The graph should support parallel work when dependencies allow it.

Example:

```text
Architecture
     │
     ├── Build UI ──────┐
     ├── Process 3D ────┼──→ Integration
     └── Build API ─────┘
```

But do not parallelize tasks merely because parallelism is possible.

Parallelism is valuable when:

- work is independent,
- outputs are compatible,
- shared state conflicts are manageable,
- the time savings justify complexity.

---

# 40. Dependency Model

Every edge should express meaning.

Possible edge types:

```text
depends_on
produces_for
blocks
requires_approval
can_parallelize_with
retries_into
repairs
invalidates
triggers
observes
verified_by
```

The graph should eventually be able to answer:

- What must happen before X?
- What can run concurrently?
- Which nodes are blocked?
- What does this failure invalidate?
- Where should the workflow return after this failure?

---

# 41. Dynamic Graph Mutation

The execution graph should not necessarily be completely static.

Example:

Initial plan:

```text
Home
 ↓
Products
 ↓
About
```

During planning the system discovers:

> Home requires a complex 3D scene.

Graph expands:

```text
Home
 ├── 3D asset analysis
 ├── optimization
 ├── WebGL implementation
 ├── mobile fallback
 └── performance test
```

Similarly, if authentication is discovered:

```text
Auth
 ↓
Database
 ↓
API
 ↓
Security Review
 ↓
Integration
```

The graph can therefore be **adaptive**.

However, graph mutation itself must be observable and versioned.

---

# 42. Graph Size Control

The platform must avoid "graph everything."

Graph engineering is justified when the task involves meaningful:

- dependencies
- parallelism
- handoffs
- approvals
- cross-domain work
- long execution
- audits
- recovery
- statefulness.

Simple tasks can remain simple.

Example:

```text
Rename a component
```

does not require 25 nodes.

Example:

```text
Rebuild an entire SaaS
  +
migrate database
  +
update frontend
  +
maintain API compatibility
  +
security review
  +
production migration
```

does.

---

# 43. State vs Prompt

Do not encode critical project state only in prompts.

Bad:

```text
Here is a huge prompt containing everything we've done.
```

Better:

```text
State Store
+
Knowledge Graph
+
Artifacts
+
Context Pack
+
Task-specific prompt
```

The agent should dynamically receive the minimum relevant context.

---

# 44. Context Assembly

Context should be assembled per node.

Conceptual process:

```text
Node
 ↓
Find relevant entities
 ↓
Find relevant files
 ↓
Find relevant artifacts
 ↓
Find relevant decisions
 ↓
Find relevant failures
 ↓
Find relevant constraints
 ↓
Create Context Pack
 ↓
Run Agent
```

This prevents context bloat.

---

# 45. Personal Engineering Memory

A future subsystem can remember user/project preferences.

Examples:

```text
preferred stacks
preferred component libraries
coding conventions
design tendencies
typography preferences
animation preferences
performance thresholds
preferred agents
preferred deployment providers
common failure patterns
successful strategies
common architectural choices
```

This should be separate from sensitive user data and should have explicit controls.

---

# 46. Learning from Historical Executions

The platform can improve over time.

Example:

```text
100 projects
   ↓
collect failures
   ↓
find recurring failure patterns
   ↓
update policy/library
   ↓
new project
   ↓
better initial graph
```

This is not initially "train a model."

It can begin as:

- rule learning
- failure pattern extraction
- strategy statistics
- graph-template refinement
- evaluator calibration
- engineering policy updates.

---

# 47. Environment / Dependency Drift

The platform should eventually detect changes such as:

```text
framework version changed
package API changed
browser behavior changed
API changed
deployment environment changed
performance degraded
design system changed
```

Potential future health model:

```text
Project Health
├── dependency drift
├── API drift
├── design drift
├── test drift
├── performance drift
├── infrastructure drift
└── requirement drift
```

Detection can trigger new graph tasks.

---

# 48. Production Lifecycle

The platform should eventually continue after first deployment.

```text
BUILD
 ↓
TEST
 ↓
REVIEW
 ↓
DEPLOY
 ↓
OBSERVE
 ↓
DETECT
 ↓
CREATE TASK
 ↓
EXECUTION GRAPH
 ↓
REPAIR
 ↓
TEST
 ↓
DEPLOY
```

This turns the product from a generator into a continuous engineering system.

---

# 49. Monitoring / Observability

The platform should have first-class observability.

Capture:

```text
graph execution logs
node state transitions
agent tool calls
duration
token/cost metrics where available
failure types
retries
test results
browser traces
screenshots
diffs
approvals
deployment state
runtime health
```

Potential dashboards:

```text
Project Overview
Graph Overview
Active Agents
Node Status
Failures
Costs
Performance
Visual QA
Deployment
History
```

---

# 50. Cost Awareness

Because autonomous loops can become expensive, the graph/harness should support:

```text
max attempts
max duration
max model budget
max concurrency
escalation
cheap model for simple nodes
expensive model for difficult nodes
```

Possible policy:

```text
simple validation → deterministic tool
simple coding → lower-cost agent/model
complex planning → stronger model
high-risk review → independent strong evaluator
```

This is an architectural concern, not merely an optimization.

---

# 51. Agent Selection

The graph should eventually choose an agent based on task requirements.

Example:

```text
Node:
3D Optimization

Required capabilities:
- shell
- Blender/3D tooling
- browser
- performance inspection

Candidate agents:
A: lacks 3D capability
B: capable
C: capable

Choose B or C.
```

This can later become a capability registry.

---

# 52. Capability Registry

Each tool/agent/runtime can advertise capabilities.

Example:

```yaml
agent:
  id: claude_code
  capabilities:
    - shell
    - filesystem
    - git
    - browser
    - code_generation

agent:
  id: specialized_3d_agent
  capabilities:
    - 3d
    - blender
    - shell
    - filesystem
```

A graph node declares required capabilities.

The runtime resolves an appropriate executor.

---

# 53. Tool Registry

Tools should be abstracted similarly.

Potential tool classes:

```text
filesystem
terminal
git
github
browser
screenshot
database
cloud
deployment
package_manager
3d_processing
image_processing
Figma
MCP
documentation
search
```

The node should request tools rather than directly importing vendor-specific APIs.

---

# 54. MCP / External Integrations

The platform may eventually use MCP-like connectors for specialized capabilities.

Examples:

```text
GitHub
Figma
Vercel
Cloud providers
Databases
Documentation
Browser
Design tools
Issue trackers
Slack
```

However, external tool connections must respect:

- permission scopes
- secrets management
- audit logging
- least privilege
- rate limits.

---

# 55. Repository-Level Integration

The system should work with Git as a core primitive.

Possible lifecycle:

```text
Create branch
 ↓
Execute node
 ↓
Tests
 ↓
Diff
 ↓
Evidence
 ↓
Commit
 ↓
Next graph stage
```

For risky work:

```text
feature branch
 ↓
validation
 ↓
review
 ↓
merge
```

Deployment should generally be downstream of verified code rather than directly after agent execution.

---

# 56. Git as an Evidence Source

Git metadata can help answer:

- What changed?
- Which node caused it?
- Which agent created it?
- Which graph version was active?
- What tests passed before commit?
- What was deployed?

Use Git as one evidence source, not the entire state model.

---

# 57. Project File Structure

A conceptual project control directory:

```text
.agent-system/
│
├── project/
│   ├── requirements/
│   ├── design/
│   ├── architecture/
│   └── constraints/
│
├── knowledge/
│   ├── graph.json
│   ├── entities/
│   └── relationships/
│
├── execution/
│   ├── graph.yaml
│   ├── nodes/
│   ├── policies/
│   └── versions/
│
├── agents/
│   ├── roles/
│   ├── prompts/
│   ├── adapters/
│   └── capabilities/
│
├── harness/
│   ├── environments/
│   ├── permissions/
│   ├── context/
│   └── policies/
│
├── state/
│   ├── current.json
│   ├── checkpoints/
│   └── runs/
│
├── artifacts/
│
├── evidence/
│   ├── screenshots/
│   ├── tests/
│   ├── traces/
│   └── evaluations/
│
├── experiments/
│
├── decisions/
│
├── history/
│
└── telemetry/
```

This is conceptual, not a command to immediately create the entire structure.

---

# 58. Repository Architecture for the Platform Itself

The platform itself may eventually be structured like:

```text
autonomous-engineering/
│
├── apps/
│   ├── web/
│   ├── dashboard/
│   └── cli/
│
├── packages/
│   ├── core/
│   ├── graph/
│   ├── knowledge/
│   ├── execution/
│   ├── harness/
│   ├── agents/
│   ├── evaluators/
│   ├── artifacts/
│   ├── state/
│   ├── telemetry/
│   ├── policy/
│   └── integrations/
│
├── workers/
│   ├── graph-worker/
│   ├── agent-worker/
│   └── evaluator-worker/
│
├── schemas/
│
├── examples/
│
├── tests/
│
└── docs/
```

Technology choices are intentionally not locked yet.

---

# 59. Initial Technical Direction

No final technology stack has been committed.

Potential categories to evaluate:

### Orchestration
- custom graph runtime
- durable workflow engine
- graph/agent framework
- code-centric orchestration

### State
- relational database
- document store
- graph database for project relationships
- object storage for artifacts

### Execution
- local subprocess
- Docker
- remote workers
- cloud sandboxes

### Browser automation
- Playwright-like system
- browser inspection protocols
- screenshot tooling

### Agent integration
- Codex
- Claude Code
- OpenHands
- future adapters

### Frontend
- likely modern web app framework
- graph visualization library
- project dashboard

Do not lock infrastructure before defining the minimum end-to-end workflow.

---

# 60. V1 Philosophy

Do not build the entire future platform immediately.

The V1 objective is to prove this loop:

```text
USER INPUT
   ↓
DESIGN / REQUIREMENT COMPILER
   ↓
EXECUTION GRAPH
   ↓
CODING AGENT
   ↓
BROWSER
   ↓
TESTS
   ↓
VISUAL QA
   ↓
REPAIR LOOP
   ↓
PASS
```

Persist enough state/evidence so that a new agent can continue.

That is the core proof.

---

# 61. Recommended V1 Scope

V1 should likely support:

```text
Input:
- text
- screenshots/images
- URLs
- existing repo
- assets
- basic 3D asset reference

Project type:
- websites
- web applications

Stack:
- one or two explicitly supported stacks initially

Agents:
- planner
- implementation agent
- QA/evaluator
- visual evaluator

Runtime:
- local or Docker-based execution

Validation:
- build
- tests
- browser
- screenshot
- visual evaluation

State:
- project
- graph
- node
- evidence
- history

Human gates:
- design approval
- release approval

Deployment:
- optional / gated
```

---

# 62. First End-to-End Example

User:

> Build a robotics company landing page using Next.js.

Inputs:

```text
requirements.txt
robot.glb
logo.svg
reference.png
reference-url
```

Compiler outputs:

```text
Project
Brand
Home
Hero
Features
CTA
3D Asset
Design Tokens
Responsive Rules
Acceptance Criteria
```

Planner creates:

```text
analyze repository
       ↓
compile design
       ↓
architecture
       ↓
build layout
       ↓
build hero
       ↓
integrate 3D
       ↓
responsive pass
       ↓
tests
       ↓
browser QA
       ↓
visual QA
       ↓
release gate
```

Each implementation step internally loops.

Example:

```text
Hero Node
  ↓
inspect
  ↓
plan
  ↓
edit
  ↓
run
  ↓
screenshot
  ↓
evaluate
  ↓
repair if needed
```

Then:

```text
3D Node
  ↓
inspect model
  ↓
optimize
  ↓
integrate
  ↓
test
  ↓
mobile test
  ↓
visual test
```

Then:

```text
Integration
  ↓
all tests
  ↓
visual QA
  ↓
performance
  ↓
human release gate
```

---

# 63. Important: Do Not Optimize Only for "Works"

The platform should optimize across several dimensions:

```text
Correctness
Visual quality
Maintainability
Performance
Accessibility
Security
Reliability
Reproducibility
Cost
Speed
```

A website that technically renders but is:

- visually wrong,
- inaccessible,
- broken on mobile,
- full of console errors,
- unmaintainable,
- or excessively slow

should not be considered successful.

---

# 64. Quality Vector

Instead of a single opaque quality score, the system should maintain a quality vector.

Example:

```yaml
quality:
  functionality: pass
  visual: pass
  accessibility: warning
  performance: pass
  security: pass
  maintainability: warning
  test_coverage: pass
```

Avoid collapsing everything into one number too early.

A single score can hide important failures.

---

# 65. Requirement Traceability

Every important requirement should be traceable:

```text
Requirement
   ↓
Design decision
   ↓
Graph node
   ↓
Code artifact
   ↓
Test
   ↓
Evidence
   ↓
Approval
```

Example:

```text
REQ-HERO-001
    ↓
Design-HERO-003
    ↓
Node-BUILD-HERO
    ↓
components/Hero.tsx
    ↓
hero.spec.ts
    ↓
mobile-screenshot.png
    ↓
visual-eval-17
    ↓
approved
```

This may become one of the strongest differentiators of the platform.

---

# 66. Architecture Traceability

Similarly:

```text
Architecture Decision
    ↓
Reason
    ↓
Affected nodes
    ↓
Implementation
    ↓
Tests
    ↓
Decision status
```

The system should be able to explain architectural changes.

---

# 67. Decision Records

Use lightweight decision records.

Example:

```yaml
decision:
  id: ADR-021
  question:
    "Should the 3D model be rendered on mobile?"

  context:
    "Model is 9MB and impacts performance."

  options:
    - render
    - optimize
    - fallback

  chosen:
    "optimized + fallback"

  rationale:
    "Preserves visual intent while satisfying performance target."

  approved_by:
    - human

  affected:
    - Hero
    - AssetPipeline
    - MobileQA
```

---

# 68. Human-Friendly Visualization

Eventually the user should see:

```text
             PROJECT
                │
      ┌─────────┼─────────┐
      ▼         ▼         ▼
   DESIGN     CODE       ASSETS
      │         │         │
      └────┬────┴────┬────┘
           ▼         ▼
          QA       REVIEW
           └────┬────┘
                ▼
              RELEASE
```

Selecting a node should show:

- objective
- dependencies
- inputs
- outputs
- agent
- tools
- current state
- attempts
- logs
- artifacts
- failures
- evidence
- approvals
- downstream impact.

---

# 69. Visual Graph Editing

A visual graph editor is desirable eventually.

The user may:

- create nodes
- connect nodes
- add dependencies
- edit acceptance criteria
- set permissions
- choose agent capabilities
- add human gates
- set retry limits
- inspect execution
- replay historical runs.

But graph editing should be optional.

The user should also be able to describe the desired workflow naturally and let the system compile it into a graph.

---

# 70. Natural-Language Graph Editing

Example:

> "After visual QA, if the score is below the threshold, send the task back to the hero implementation node. If the same issue happens three times, ask me."

The system should compile:

```text
Visual QA
   ↓
threshold?
 ├── pass → next
 └── fail → Hero
              ↓
        attempt count ≥ 3?
          ├── no → Hero
          └── yes → Human Gate
```

This is a natural extension of the project.

---

# 71. Graph Compilation

Ultimately:

```text
Human intent
   ↓
Compiler
   ↓
Graph specification
   ↓
Graph validation
   ↓
Executable graph
```

Before execution, the system should validate:

```text
cycles
unreachable nodes
missing dependencies
invalid permissions
missing evaluators
missing outputs
dead ends
conflicting requirements
approval gaps
```

---

# 72. Graph Static Analysis

Potential checks:

```text
No node without purpose
No orphan node
No impossible dependency
No invalid edge
No missing output required downstream
No permission escalation without gate
No release path without quality gate
No irreversible destructive step without approval
No infinite retry loop
```

This should happen before execution where possible.

---

# 73. Retry Safety

Loops must not accidentally become infinite.

Every loop should have:

```text
max iterations
max time
max cost
stop condition
escalation condition
```

If a node fails repeatedly for the same reason, do not blindly retry.

Escalate or change strategy.

---

# 74. Strategy Diversity

A repair loop should be able to change strategy.

Bad:

```text
attempt 1 → same action
attempt 2 → same action
attempt 3 → same action
```

Better:

```text
attempt 1:
modify CSS

attempt 2:
change component structure

attempt 3:
inspect parent layout

attempt 4:
escalate
```

The system should record attempted strategies to avoid repeating unproductive behavior.

---

# 75. Failure Memory

For each failure:

```text
signature
first occurrence
occurrences
affected files
strategies attempted
strategies successful
strategies failed
final resolution
```

This gives the system reusable knowledge.

---

# 76. Evaluation Independence

The evaluator should ideally receive:

```text
requirements
acceptance criteria
observed artifact
```

rather than the implementation agent's self-justification.

This reduces evaluation contamination.

---

# 77. Browser QA

Browser QA should validate:

```text
navigation
buttons
links
forms
menus
modals
responsive layout
keyboard navigation
runtime behavior
console errors
network errors
```

This is distinct from visual QA.

---

# 78. Accessibility

Accessibility should be integrated into graph gates.

Potential checks:

```text
semantic HTML
keyboard navigation
focus state
ARIA
contrast
alt text
screen-reader expectations
reduced-motion support
```

Do not leave accessibility to a final optional checklist.

---

# 79. Performance

Performance should be treated as a budget.

Potential budgets:

```text
JS bundle
initial page weight
LCP
CLS
interaction latency
3D transfer size
image transfer size
number of requests
runtime CPU/GPU load
```

A graph node should be allowed to fail because it exceeds a performance budget even when functionality is correct.

---

# 80. Security

Security should be a graph concern.

Potential checks:

```text
secrets
dependencies
unsafe shell commands
exposed credentials
auth boundaries
API authorization
injection risks
unsafe generated code
deployment permissions
```

High-risk operations require stronger isolation and/or approval.

---

# 81. Deployment

Deployment should be a graph stage, not a side effect of "finished coding."

Example:

```text
Implementation
   ↓
QA
   ↓
Visual QA
   ↓
Security
   ↓
Performance
   ↓
Human Gate
   ↓
Deployment
   ↓
Smoke Test
```

If deployment fails:

```text
Deployment
   ↓
Smoke Test
   ↓
Failure
   ↓
Rollback OR repair
```

---

# 82. Post-Deployment Monitoring

After release:

```text
runtime errors
performance
availability
user feedback
broken routes
external API failures
```

can create new graph work.

---

# 83. Continuous Engineering

Long term:

```text
PROJECT CREATION
      ↓
IMPLEMENTATION
      ↓
RELEASE
      ↓
MONITOR
      ↓
CHANGE REQUEST
      ↓
GRAPH UPDATE
      ↓
IMPLEMENT
      ↓
VERIFY
      ↓
RELEASE
```

Therefore the project is not "generated once."

It is continuously engineered.

---

# 84. Core Design Principles

1. **Graph controls topology.**
2. **Loop controls local execution quality.**
3. **Harness controls agent environment.**
4. **Knowledge model controls project truth.**
5. **Evidence controls claims of completion.**
6. **Human controls product intent and high-risk decisions.**
7. **Deterministic tools are preferred when available.**
8. **Agents should receive task-specific context.**
9. **Every meaningful state transition should be observable.**
10. **Everything important should be versioned.**
11. **Failure should produce structured evidence.**
12. **Retry behavior must be bounded and strategic.**
13. **Parallelism should be intentional, not decorative.**
14. **Do not graph simple work unnecessarily.**
15. **Do not create specialized agents without a reason.**
16. **Do not let the implementation agent be its own only evaluator.**
17. **Do not silently override explicit user requirements.**
18. **Prefer graceful degradation and recoverability over brittle automation.**
19. **Design, implementation, testing, and deployment must be traceable.**
20. **The system should evolve from evidence, not from arbitrary complexity.**

---

# 85. Non-Goals

The system is not initially:

- a general AGI
- an infinite agent swarm
- a magic "build anything" prompt
- a visual graph tool with no execution semantics
- a replacement for Git
- a replacement for all software infrastructure
- a requirement to use graph databases for everything
- a requirement to use dozens of agents
- a requirement to make everything autonomous.

The goal is reliable engineering automation.

---

# 86. Open Product Questions

These decisions should be explicitly answered before the architecture is considered final.

## 86.1 Scope

Should the first version support:

A. websites only
B. websites + web apps
C. general software projects from the beginning

Recommended starting point:
**B**, while keeping the core engine domain-agnostic.

## 86.2 Greenfield vs existing

Should the system be capable of:

- creating new repositories
- understanding existing repositories
- modifying existing repositories
- migrating existing systems

Recommended:
**all four eventually; creation + modification in V1.**

## 86.3 Agent autonomy

Options:

A. approval before every meaningful change
B. approval before execution of each node
C. autonomous execution with gates for risky/irreversible work
D. fully autonomous

Recommended:
**C.**

## 86.4 Coding agent independence

Should Codex/Claude Code/OpenHands/etc. be interchangeable?

Recommended:
**yes.**

## 86.5 Graph UI

Should the user have:

- visual graph editing
- natural language graph editing
- both

Recommended:
**both eventually; natural language first if necessary.**

## 86.6 Input modalities

Should input support:

- text
- image
- screenshot
- URL
- Figma
- PDF
- video
- 3D assets
- repository
- asset folder

Recommended:
**yes, eventually. Start with the simplest useful subset.**

## 86.7 User authority

Should explicit user instructions override AI optimization?

Recommended:
**yes, unless prohibited by security/safety constraints.**

The system can warn and recommend alternatives, but must not silently replace the requirement.

## 86.8 Deployment

Should production deployment require a human gate?

Recommended:
**yes by default.**

## 86.9 Technology lock-in

Should graph/state/harness abstractions avoid vendor lock-in?

Recommended:
**yes.**

## 86.10 Graph storage

Do not decide yet whether the knowledge model needs a graph database.

Start with the conceptual graph model and choose storage based on real query patterns.

---

# 87. Important Edge Cases Still Requiring Decisions

These are areas the coding agent should not invent policy for without a product decision.

### Conflicting design inputs

Screenshot says one thing, Figma says another, user prompt says another.

Need a priority rule.

### Existing code conflicts with design

Should existing architecture be preserved, migrated, or replaced?

### Agent discovers architectural improvements

Should the agent be allowed to change architecture automatically?

Recommended:
- local improvements within policy: yes
- major architecture changes: graph revision + approval.

### Very large 3D assets

Should the system optimize automatically, ask for permission, or allow original assets regardless of performance?

### External reference websites

How aggressively should visual/structural patterns be extracted?

### Cost runaway

What are the global cost and time budgets?

### Long-running tasks

Should the runtime pause/resume after hours or days?

### Agent failure

What happens if a provider becomes unavailable halfway through a graph?

### External API changes

Does the system auto-adapt or create a maintenance task?

### Database migrations

Always gated or sometimes autonomous?

### Destructive commands

What classes require mandatory approval?

### Secrets

Which agents can ever access credentials?

### Parallel agents modifying the same files

Should the system:
- serialize,
- isolate branches/worktrees,
- merge automatically,
- or ask for resolution?

### Visual evaluation thresholds

How much mismatch is acceptable?

### Requirement evolution mid-project

Does a requirement change:
- invalidate only downstream nodes,
- restart the current phase,
- or trigger a new graph version?

### User disagreement with evaluator

Can the user override visual/quality gates?

Recommended:
yes, with the override explicitly recorded as a project decision.

---

# 88. Recommended Policy for Requirement Changes

A requirement change should produce:

```text
Requirement Change
      ↓
Impact Analysis
      ↓
Affected Entities
      ↓
Affected Nodes
      ↓
Invalidated Artifacts
      ↓
New Graph Version
      ↓
Re-execution
```

Example:

```text
User changes:
"dark theme" → "light theme"

Affected:
brand
tokens
hero
navigation
components
visual tests

Not necessarily affected:
backend
database
API
```

The system should avoid rebuilding unrelated work.

---

# 89. Recommended Policy for Agent Disagreement

An agent can propose:

```text
Architecture Change Proposal
```

instead of silently changing architecture.

Proposal includes:

```text
current
proposed
reason
benefits
risks
affected nodes
affected artifacts
estimated migration
```

The graph can then branch:

```text
current
  ↓
proposal
  ↓
human gate
 ├── approve → new architecture
 └── reject → current architecture
```

---

# 90. Recommended Policy for Shared File Conflicts

When concurrent nodes modify the same files:

Prefer:

```text
isolated worktrees / branches
         ↓
merge evaluation
         ↓
conflict resolution
```

rather than allowing two agents to edit the same working tree blindly.

A future merge node can evaluate:

- textual conflicts
- semantic conflicts
- test failures
- design regressions.

---

# 91. Recommended V1 Technical Strategy

Do not begin with a massive distributed architecture.

First prove the core mechanics in one controlled runtime.

Potential sequence:

### Phase 0 — Specification

Build:
- schemas
- state model
- graph model
- node contract
- evidence contract.

### Phase 1 — Local Executor

Implement:

```text
graph
 ↓
node
 ↓
agent
 ↓
tool
 ↓
state
```

### Phase 2 — Verification

Add:

```text
tests
browser
screenshots
evaluation
```

### Phase 3 — Repair

Add:

```text
failure
 ↓
diagnose
 ↓
repair
 ↓
retry
```

### Phase 4 — Knowledge Model

Add persistent project relationships.

### Phase 5 — UI

Add:
- graph visualization
- state dashboard
- artifact browser
- agent run viewer.

### Phase 6 — Multiple agent runtimes

Add adapters.

### Phase 7 — Deployment / monitoring

Add continuous lifecycle.

---

# 92. First Coding Milestone

The first meaningful milestone is NOT a polished dashboard.

It is:

> **Given a project repository and a structured request, the system can create a graph, execute a coding node through a harness, run tests, capture evidence, detect failure, perform a repair loop, and persist the result.**

Example:

```text
Request:
"Add a responsive hero section."

System:
1. create task node
2. inspect repo
3. inspect design context
4. create context pack
5. invoke coding agent
6. run tests
7. launch browser
8. capture screenshot
9. evaluate
10. repair if needed
11. save state/evidence
12. mark node verified
```

If this works reliably, the foundation exists.

---

# 93. The First Demo

Use a deliberately constrained website project.

Inputs:

```text
existing Next.js repository
reference screenshot
logo
small 3D asset
simple design instructions
```

Target:

```text
Home page
Hero
Feature section
CTA
Responsive mobile
```

Graph:

```text
Analyze
 ↓
Design
 ↓
Architecture
 ↓
Hero
 ↓
Features
 ↓
3D
 ↓
Integration
 ↓
Test
 ↓
Browser QA
 ↓
Visual QA
 ↓
Release Gate
```

Demonstrate:

- graph visualization
- agent execution
- a failure
- automatic repair
- final evidence
- change history.

That demo will prove the concept better than a hundred slides.

---

# 94. What Not to Build First

Do not start with:

- multi-cloud orchestration
- dozens of agents
- custom model training
- advanced graph database infrastructure
- global distributed worker scheduling
- autonomous production deployment
- huge visual graph editor
- sophisticated long-term learning
- every possible integration.

First prove reliable local execution.

---

# 95. Suggested Initial Data Contracts

The first schema set should probably include:

```text
Project
Requirement
DesignSpec
Asset
Entity
Relationship
Graph
Node
Edge
Execution
ContextPack
Agent
Capability
Tool
Permission
Artifact
Evidence
Test
Evaluation
Failure
Repair
Decision
Approval
Deployment
Environment
Experiment
```

These can initially be implemented as typed schemas.

---

# 96. Suggested Core API Boundaries

Conceptual internal interfaces:

```text
ProjectService
KnowledgeService
GraphService
ExecutionService
AgentService
HarnessService
ArtifactService
EvaluationService
PolicyService
StateService
TelemetryService
DeploymentService
```

Avoid tightly coupling every service to one model provider.

---

# 97. Project State Machine

At the project level:

```text
DRAFT
  ↓
PLANNING
  ↓
EXECUTING
  ↓
VERIFYING
  ↓
AWAITING_APPROVAL
  ↓
RELEASED
  ↓
MONITORING
  ↓
MAINTENANCE
  ↓
ARCHIVED
```

A project can return to:

```text
PLANNING
EXECUTING
VERIFYING
```

when requirements change or production evidence creates new work.

---

# 98. Node State Machine

```text
PENDING
 ↓
READY
 ↓
RUNNING
 ↓
VERIFYING
 ├── PASS → COMPLETE
 └── FAIL → RETRY
                ↓
             BLOCKED
                ↓
             ESCALATED
```

Add cancellation/rollback paths.

---

# 99. Execution Record

An execution should capture:

```yaml
execution:
  id:
  graph_version:
  node_id:
  started_at:
  ended_at:
  agent:
  model:
  environment:
  inputs:
  outputs:
  tools_used:
  state_changes:
  artifacts:
  tests:
  evaluations:
  failures:
  retries:
  final_status:
```

---

# 100. Observability Events

Example event types:

```text
project.created
graph.generated
graph.validated
node.ready
node.started
agent.started
tool.called
artifact.created
test.started
test.completed
evaluation.started
evaluation.completed
failure.detected
repair.started
repair.completed
node.completed
approval.requested
approval.granted
approval.rejected
deployment.started
deployment.completed
rollback.started
rollback.completed
```

---

# 101. Security Principles

At minimum:

- least privilege
- sandboxed execution
- no default production credentials
- explicit network policy
- explicit file write scope
- audit logs
- secret isolation
- approval for destructive operations
- protected system files
- protected deployment operations.

---

# 102. Cost and Resource Principles

The system must prevent an agent loop from running indefinitely.

Global controls:

```text
max project budget
max node budget
max retries
max runtime
max concurrency
max artifact size
max screenshot count
```

Potential escalation:

```text
cheap execution
 ↓
retry
 ↓
stronger agent
 ↓
human gate
```

---

# 103. Maintainability Principle

Every generated project should remain understandable to humans.

The system should prefer:

- standard patterns
- readable code
- explicit architecture
- tests
- documentation
- meaningful component names
- small diffs
- traceable changes.

The goal is not merely "AI can produce code."

The goal is "AI can produce code humans can maintain."

---

# 104. Adaptability Principle

The platform should accommodate:

```text
new models
new agents
new tools
new frameworks
new browser versions
new deployment providers
new evaluation techniques
new design formats
```

through adapters and capability interfaces rather than hard-coded assumptions.

---

# 105. Technology-Neutrality

The architectural contracts should be more stable than any selected technology.

For example:

```text
Agent
```

is a contract.

Whether the worker is:

- Codex
- Claude Code
- OpenHands
- a custom agent

is an implementation detail.

Likewise:

```text
Execution Backend
```

could be:

- local process
- Docker
- cloud worker

without changing the graph semantics.

---

# 106. Naming

Potential project names are intentionally undecided.

Possible conceptual names:

- Autonomous Engineering Engine
- Design-to-Code Engine
- Graph Engineering Engine
- Agent Engineering Fabric
- Autonomous Software Factory
- Engineering Graph
- Project Intelligence Engine
- Adaptive Engineering Runtime.

Do not rename the project in code without a deliberate decision.

---

# 107. Core Philosophy

The system should behave more like a small engineering organization than like a single chat.

Conceptually:

```text
Human
  │
  ▼
Product / Intent
  │
  ▼
Planner
  │
  ├── Designer
  ├── Architect
  ├── Engineers
  ├── QA
  ├── Visual QA
  ├── Security
  └── Release
         │
         ▼
      Evidence
         │
         ▼
      Human Gate
```

But these "roles" should be implemented only where they materially improve execution.

---

# 108. Most Important Invariant

> **No important transition should happen without a reason, a state change, and—where applicable—evidence.**

For example:

Do not say:

```text
Hero complete
```

Say:

```text
Hero implemented
Hero tests passed
Hero browser check passed
Hero mobile check passed
Hero visual evaluation passed
Hero performance check passed
Hero evidence stored
Hero node approved
```

This is the mindset the platform should enforce.

---

# 109. Second Most Important Invariant

> **Never make the model's memory the system's source of truth.**

The source of truth is:

```text
Project Knowledge
+
Persistent State
+
Artifacts
+
Evidence
+
Graph History
```

The model is a worker interacting with those systems.

---

# 110. Third Most Important Invariant

> **Do not confuse autonomy with lack of control.**

A highly autonomous system should actually have:

- stronger state
- stronger boundaries
- stronger evaluation
- stronger recovery
- stronger auditability.

---

# 111. Fourth Most Important Invariant

> **Complexity must be earned.**

Use:

- simple loop for simple work
- graph for cross-domain work
- multiple agents only when specialization/parallelism/isolation justifies them
- durable state when execution is long-lived
- human gates where consequences are high.

---

# 112. Immediate Next Step for the Coding Agent

The coding agent should NOT immediately begin implementing every idea in this document.

Instead, its first job should be:

### Step 1 — Inspect this context.

### Step 2 — Convert it into an implementation-oriented technical specification.

### Step 3 — Identify contradictions or missing decisions.

### Step 4 — Propose the smallest V1 architecture that proves the core loop.

### Step 5 — Create schemas/interfaces before large implementation.

### Step 6 — Build one end-to-end vertical slice.

The first vertical slice should demonstrate:

```text
Request
 ↓
Requirement normalization
 ↓
Graph generation
 ↓
Node execution
 ↓
Agent harness
 ↓
Code change
 ↓
Test
 ↓
Browser check
 ↓
Visual evidence
 ↓
Failure / Repair
 ↓
Pass
 ↓
Persist state
```

Only after that should the system expand.

---

# 113. Instructions for the Coding Agent Reading This File

You are working on an autonomous engineering platform.

Do not treat this as a loose brainstorm.

Treat it as a **design context** with explicit principles and some unresolved product decisions.

Before writing large amounts of code:

1. Read the full context.
2. Identify which requirements are firm principles and which are still options.
3. Do not invent policy where this document says a decision is unresolved.
4. Favor a minimal end-to-end implementation over speculative infrastructure.
5. Keep abstractions clean enough to support multiple agent runtimes.
6. Preserve graph/state/evidence semantics even if V1 is local.
7. Prefer deterministic checks over LLM judgment where possible.
8. Persist execution state.
9. Make failures observable and recoverable.
10. Keep all major changes reviewable and traceable.

The system should eventually support autonomous software creation, but reliability and inspectability take priority over maximal autonomy in V1.

---

# 114. Suggested First Agent Tasks

The coding agent can break the work into these tasks:

```text
TASK 1
Define domain schemas.

TASK 2
Define graph model.

TASK 3
Define node/edge contracts.

TASK 4
Define execution state machine.

TASK 5
Define ContextPack.

TASK 6
Define Agent adapter interface.

TASK 7
Implement local harness.

TASK 8
Implement simple graph executor.

TASK 9
Implement deterministic evaluator.

TASK 10
Implement browser evaluator.

TASK 11
Implement evidence storage.

TASK 12
Implement retry/repair.

TASK 13
Run first end-to-end example.

TASK 14
Add graph visualization.

TASK 15
Only then expand to multiple agents.
```

---

# 115. Definition of V1 Success

V1 is successful when a user can provide:

```text
"Modify this repository to implement this design requirement."
```

and the system can autonomously:

```text
understand the repository
→ understand the requirement
→ construct a small graph
→ execute a node through a harness
→ modify code
→ run tests
→ run browser checks
→ capture evidence
→ detect a defect
→ repair it
→ revalidate
→ persist the run
→ clearly report the outcome
```

with a human only involved at explicitly configured gates.

---

# 116. Definition of V2 Success

V2 should add:

```text
multimodal design compiler
persistent project knowledge graph
visual graph UI
multiple agent runtimes
parallel execution
asset pipeline
3D pipeline
richer evaluators
deployment
```

---

# 117. Definition of V3 Success

V3 should become:

```text
continuous software engineering system
```

with:

```text
project memory
drift detection
automatic maintenance
production monitoring
adaptive graph generation
strategy learning
agent selection
cost optimization
```

---

# 118. Long-Term Vision

The ultimate platform could make this possible:

```text
User:
"Build this product."

System:

1. Understand product intent.
2. Analyze references and constraints.
3. Construct a project knowledge model.
4. Compile an execution graph.
5. Select appropriate workers.
6. Create isolated execution environments.
7. Build in parallel where safe.
8. Validate continuously.
9. Capture visual/functional evidence.
10. Repair failures automatically.
11. Ask for human approval at important decision boundaries.
12. Deploy.
13. Observe production.
14. Detect drift.
15. Create maintenance work.
16. Re-run the engineering graph.
17. Keep the project maintainable for humans.
```

That is the system we are designing.

---

# 119. Final Conceptual Diagram

```text
                               HUMAN
                                 │
                                 │ intent / requirements
                                 ▼
                     ┌───────────────────────┐
                     │ DESIGN / INTENT       │
                     │ COMPILER              │
                     └───────────┬───────────┘
                                 │
                                 ▼
              ┌─────────────────────────────────────┐
              │     PROJECT KNOWLEDGE MODEL         │
              │                                     │
              │ requirements                        │
              │ design                              │
              │ pages/components                     │
              │ assets                              │
              │ architecture                        │
              │ constraints                         │
              │ decisions                           │
              │ tests/evidence                      │
              └──────────────────┬──────────────────┘
                                 │
                                 ▼
                      ┌────────────────────┐
                      │ GRAPH COMPILER     │
                      └─────────┬──────────┘
                                │
                                ▼
                  ┌─────────────────────────┐
                  │ EXECUTION GRAPH         │
                  └────────────┬────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
          Planning         Implementation    Asset/3D
             Node               Node            Node
              │                │                │
              │           ┌────┴────┐           │
              │           │  LOOP   │           │
              │           │         │           │
              │           │discover │           │
              │           │execute  │           │
              │           │verify   │           │
              │           │record   │           │
              │           │repair   │           │
              │           └────┬────┘           │
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                     ┌──────────────────┐
                     │ QUALITY SYSTEM   │
                     ├──────────────────┤
                     │ Code QA          │
                     │ Browser QA       │
                     │ Visual QA        │
                     │ Performance      │
                     │ Accessibility    │
                     │ Security         │
                     └────────┬─────────┘
                              │
                         evidence
                              │
                              ▼
                    ┌────────────────────┐
                    │ QUALITY / POLICY   │
                    │ GATE               │
                    └────────┬───────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
                PASS                    FAIL
                 │                       │
                 ▼                       ▼
             NEXT NODE               DIAGNOSE
                                         │
                                         ▼
                                       REPAIR
                                         │
                                         └────────────┐
                                                      │
                                                      ▼
                                                 RE-VERIFY

                              ↓
                      HUMAN GATE (where needed)
                              ↓
                          DEPLOYMENT
                              ↓
                        OBSERVABILITY
                              ↓
                       DRIFT / NEW INPUT
                              ↓
                    NEW ENGINEERING GRAPH
```

---

# 120. Canonical One-Sentence Definition

**This project is a graph-driven autonomous engineering platform that turns human intent into continuously validated software by combining a persistent project knowledge model, explicit execution graphs, bounded agent loops, controlled agent harnesses, independent evaluation, evidence, human gates, and long-lived project state.**

---

# 121. Working Assumptions for V1

Unless the project owner explicitly changes them, use these as provisional defaults:

```text
Scope:
websites + web apps first

Repositories:
new + existing repositories

Autonomy:
autonomous with explicit gates for risky/irreversible operations

Agent providers:
adapter-based, not hard-coded

Input:
multimodal over time

Design:
first-class structured input

Graph:
generated automatically and inspectable

Graph UI:
future, not required for the first vertical slice

State:
persistent from day one

Evidence:
persistent from day one

Browser testing:
required for frontend tasks

Visual QA:
required for design-heavy frontend tasks

3D:
first-class but implemented incrementally

Deployment:
gated

Production access:
restricted

Security:
least privilege

Retries:
bounded

Failures:
structured and auditable

Simple tasks:
simple execution; do not over-graph
```

These are defaults, not immutable requirements.

---

# 122. Questions the Product Owner Should Answer Before Large-Scale Implementation

These are the main remaining decisions:

1. Should V1 be websites + web apps only, or include arbitrary software domains from day one?
2. Which exact coding agent should be the first runtime target: Codex, Claude Code, OpenHands, or an abstraction with one first adapter?
3. Local-only first, Docker, or remote/cloud execution from V1?
4. What is the desired default autonomy level?
5. What actions always require human approval?
6. What is the source-priority hierarchy for conflicting design inputs?
7. Should architectural changes always require approval?
8. What is the initial budget/time limit for autonomous graph execution?
9. Which stack should the first demo support?
10. What is the first design-to-code demo project?
11. How much visual fidelity is required for V1?
12. Should the knowledge model be stored relationally first, graph database first, or remain storage-agnostic until usage patterns are observed?
13. Which external integrations are mandatory for V1?
14. What is the initial definition of "high-risk" actions?
15. Should user overrides be able to bypass quality gates, and how should those overrides be recorded?
16. Should the system learn personal engineering/design preferences across projects?
17. How much production monitoring is expected in the first public version?
18. How should costs be exposed to the user?
19. Should agents work in isolated worktrees by default?
20. What should happen when multiple graph branches modify the same artifact?

Do not block V1 on all twenty questions. Resolve only the choices that materially affect the first implementation, while making the rest configurable.

---

# 123. Final Instruction to the Coding Agent

Start with architecture, contracts, schemas, and one end-to-end vertical slice.

Do not build a giant multi-agent platform immediately.

Do not assume the model is the system.

Do not assume prompts are state.

Do not assume "code generated" means "done."

The target is:

**reliable autonomous engineering with explicit state, topology, bounded loops, evidence, recovery, and human control.**

When choosing between a clever architecture and a simpler architecture that can be observed, tested, recovered, and extended, prefer the latter.


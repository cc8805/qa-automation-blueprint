# Agentic QA Automation Blueprint 🤖 Playwright + Google Antigravity / Claude Code

A standalone, multi-project **agentic test automation blueprint** built with **Playwright**, **TypeScript**, and **Google Antigravity**. 

Unlike traditional static test suites, this repository treats AI agents as autonomous engineers. It implements a **5-stage state-machine pipeline** with progressive context disclosure, Model Context Protocol (MCP) tool integration, sacred assertion guardrails (anti-bug-masking), and an executive KPI reporting dashboard.

---

## 🏗️ Architecture & 5-Stage Pipeline

```mermaid
graph TD
    S1["1. Synthesize Spec & Design"] --> S2["2. Explore Live App & Plan"]
    S2 --> S3["3. Pre-Flight Audit & Generate Code"]
    S3 --> S4["4. Execute & Report"]
    S4 -->|Failures Detected| S5["5. Triage & Heal (Max 2 Strikes)"]
    S5 -->|Re-run Suite| S4
    S4 -->|All Passed / Bug Filed| DONE([Green KPI Dashboard])

Replace the **Repository Structure**, **Local Setup Guide**, and **Executive KPI Reporting** sections in your `README.md` with this updated block. It includes `scripts/run-pipeline.mjs` in the file tree and showcases your 4 new `npm` shortcuts alongside the stateless handoff architecture:

```markdown
## 📂 Repository Structure

```text
qa-automation-template/
├── AGENTS.md                          # Root AI orchestrator & handoff contracts
├── playwright.config.ts               # Multi-reporter config (HTML, JSON, Traces)
├── package.json                       # CLI shortcuts for test, reports, and pipeline
├── .env.example                       # Environment variables template
├── scripts/
│   └── run-pipeline.mjs               # Stateless 5-stage CLI orchestrator runner
├── .agents/
│   ├── mcp_config.json                # Local Playwright MCP & Remote OAuth (Jira/Figma)
│   ├── rules/                         # Guardrails (sacred assertions & coding standards)
│   └── skills/                        # 5 modular agent SOPs (Stages 1 to 5)
├── specs/                             # Feature requirement Markdown files
├── tests/
│   ├── auth.setup.ts                  # Global auth state setup (.auth/user.json)
│   ├── pages/                         # Page Object Models (POM)
│   └── e2e/                           # Test specification files
└── reports/                           # Ephemeral HTML traces, JSON handoffs, and KPI dashboard

```

---

## 🚀 Local Setup & Execution Guide

Follow these steps to set up and run this blueprint locally using **VS Code**, **Google Antigravity**, or **Claude Code**.

### Prerequisites

* **Node.js** (v18 or newer)
* **VS Code** with the **Playwright Test for VS Code** extension
* **Google Antigravity** or **Claude Code** CLI installed for AI agent orchestration

### Step 1: Clone and Install Dependencies

```bash
git clone [https://github.com/cc8805/qa-automation-blueprint.git](https://github.com/cc8805/qa-automation-blueprint.git)
cd qa-automation-blueprint
npm install
npx playwright install chromium

```

### Step 2: Configure Environment Variables

Copy the example environment file and set your target web application URL:

```bash
cp .env.example .env

```

Open `.env` in your editor and configure your target URL:

```ini
BASE_URL=[https://demo.playwright.dev/todomvc](https://demo.playwright.dev/todomvc)

```

### Step 3: Run the Pipeline or Test Suite (`npm` Shortcuts)

| Command | Description |
| --- | --- |
| `npm run pipeline -- todo-management` | **Full 5-Stage Stateless Pipeline:** Spawns isolated agent sessions sequentially for `specs/todo-management.md`, passing state via JSON handoff contracts (`reports/handoffs/`). |
| `npm test` | **Run Playwright Suite:** Executes all existing E2E specs headlessly and outputs raw JSON/HTML trace data. |
| `npm run report:kpi` | **Generate KPI Dashboard:** Parses the latest test run and builds `reports/metrics-summary.md` and `reports/kpi-dashboard.html`. |
| `npm run report:html` | **Open Trace Viewer:** Launches the interactive Playwright HTML report with time-travel DOM snapshots. |

*(Tip: To run the automated CLI pipeline with Google Antigravity instead of Claude Code, set `AGENT_CLI=antigravity` before running `npm run pipeline`).*

---

## 📊 Executive KPI Reporting & Dashboard

Every test execution automatically generates:

1. **Interactive HTML Dashboard:** Time-travel traces and failure screenshots via `npm run report:html`.
2. **Executive KPI Dashboard (`reports/kpi-dashboard.html`):** Built via `npm run report:kpi`, providing a standalone dark-mode executive UI tracking Pass Rate trend charts across runs, slowest test bottlenecks, and AI self-healing audit ledgers.



#!/usr/bin/env node
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 1. Parse CLI arguments (default feature: 'todo-management')
const feature = process.argv[2] || 'todo-management';
const cliEngine = process.env.AGENT_CLI || 'claude'; // 'claude' or 'antigravity'
const handoffsDir = path.resolve('reports/handoffs');

// Ensure handoffs directory exists and clear stale handoffs for a clean run
fs.mkdirSync(handoffsDir, { recursive: true });
for (let i = 1; i <= 5; i++) {
    const file = path.join(handoffsDir, `stage-${i}-handoff.json`);
    if (fs.existsSync(file)) fs.unlinkSync(file);
}

/**
 * Spawns a completely isolated CLI agent session with zero prior context.
 */
function runIsolatedStage(stageLabel, promptText) {
    console.log(`\n==================================================================`);
    console.log(`🚀 [PIPELINE] STARTING ${stageLabel} (Isolated Session)`);
    console.log(`==================================================================\n`);

    const cleanPrompt = promptText.trim().replace(/\s+/g, ' ');

    // Configure arguments based on your chosen CLI engine
    const args =
        cliEngine === 'antigravity'
            ? ['run', cleanPrompt]
            : ['-p', cleanPrompt, '--dangerously-skip-permissions'];

    const result = spawnSync(cliEngine, args, {
        stdio: 'inherit',
        shell: true,
        env: process.env,
    });

    if (result.status !== 0) {
        console.error(`\n❌ [ERROR] ${stageLabel} exited with code ${result.status}. Halting pipeline.`);
        process.exit(result.status || 1);
    }
}

/**
 * Reads and validates the JSON handoff artifact produced by a stage.
 */
function readHandoff(stageNum) {
    const filePath = path.join(handoffsDir, `stage-${stageNum}-handoff.json`);
    if (!fs.existsSync(filePath)) {
        console.error(`\n❌ [ERROR] Missing handoff file: ${filePath}`);
        console.error(`Ensure Stage ${stageNum} completed its mandatory exit step.`);
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// ============================================================================
// PIPELINE EXECUTION STATE MACHINE
// ============================================================================

console.log(`\n🎯 Target Feature: ${feature}`);
console.log(`🤖 Agent CLI Engine: ${cliEngine}`);

// --- STAGE 1: Synthesize Spec & Design ---
runIsolatedStage(
    'STAGE 1: Synthesize Spec & Design',
    `Execute Skill 1-synthesize-spec-and-design for feature '${feature}'. Read specs/${feature}.md, adapt gracefully to missing Jira/Figma sources as defined in AGENTS.md, generate reports/plans/${feature}-truth-matrix.md, and write reports/handoffs/stage-1-handoff.json.`
);
const h1 = readHandoff(1);
console.log(`✅ Stage 1 Handoff Verified -> ${h1.truthMatrixPath}`);

// --- STAGE 2: Explore Live App & Plan Cases ---
runIsolatedStage(
    'STAGE 2: Explore Live App & Plan Cases',
    `Execute Skill 2-explore-and-plan-cases for feature '${feature}'. Context from Stage 1 handoff: ${JSON.stringify(h1)}. Inspect BASE_URL via Playwright MCP, generate reports/plans/${feature}-test-plan.md, and write reports/handoffs/stage-2-handoff.json.`
);
const h2 = readHandoff(2);
console.log(`✅ Stage 2 Handoff Verified -> ${h2.testPlanPath}`);

// --- STAGE 3: Pre-Flight Audit & Generate Code ---
runIsolatedStage(
    'STAGE 3: Audit & Generate Tests',
    `Execute Skill 3-generate-tests for feature '${feature}'. Context from Stage 2 handoff: ${JSON.stringify(h2)}. Audit ${h2.testPlanPath} against ${h1.truthMatrixPath}, generate Page Object and E2E spec files, and write reports/handoffs/stage-3-handoff.json.`
);
const h3 = readHandoff(3);
console.log(`✅ Stage 3 Handoff Verified -> Generated ${h3.specFilePath}`);

// --- STAGE 4 & STAGE 5: Execute, Report & Self-Heal Feedback Loop ---
const MAX_HEAL_STRIKES = 2;
let strike = 0;

while (true) {
    runIsolatedStage(
        `STAGE 4: Execute & Report (Run #${strike + 1})`,
        `Execute Skill 4-execute-and-report for feature '${feature}'. Context from Stage 3 handoff: ${JSON.stringify(h3)}. Run npx playwright test and parse-metrics.mjs, inspect reports/metrics-summary.md, and write reports/handoffs/stage-4-handoff.json.`
    );
    const h4 = readHandoff(4);
    console.log(`📊 Stage 4 Metrics -> Pass Rate: ${h4.passRate}% | Failed: ${h4.failedCount}`);

    if (!h4.needsHealing || h4.failedCount === 0) {
        console.log(`\n🎉 [PIPELINE COMPLETE] All tests passing or triaged! See ${h4.dashboardPath}`);
        break;
    }

    if (strike >= MAX_HEAL_STRIKES) {
        console.warn(`\n⚠️ [2-STRIKE CAP REACHED] Stopping self-heal loop after ${strike} attempts.`);
        break;
    }

    strike++;
    runIsolatedStage(
        `STAGE 5: Triage & Heal (Strike #${strike} of ${MAX_HEAL_STRIKES})`,
        `Execute Skill 5-triage-and-heal for feature '${feature}' (Strike ${strike}). Context from Stage 4 handoff: ${JSON.stringify(h4)} and Truth Matrix: ${h1.truthMatrixPath}. Diagnose failures, heal locator drift or file a bug report in reports/bugs/, log via --log-heal, and write reports/handoffs/stage-5-handoff.json.`
    );
    const h5 = readHandoff(5);
    console.log(`🔧 Stage 5 Action -> ${h5.actionTaken} on ${h5.targetSpec}`);

    if (!h5.rerunRequired) {
        console.log(`\n🛑 Stage 5 indicated no re-run required. Exiting loop.`);
        break;
    }
}
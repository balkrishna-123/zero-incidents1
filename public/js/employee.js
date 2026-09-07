import { icon } from "./icons.js";
import {
  esc,
  modal,
  moduleMeta,
  progressBadge,
  empty,
  formatDate,
} from "./ui.js";
import { settingsPage } from "./admin.js";

function showModule(module) {
  modal({
    title: module.title,
    subtitle: "Your learning overview",
    className: "wide",
    content: `${module.trainer ? `<div class="module-modal-guide"><img src="${esc(module.trainer.imageUrl)}" alt="${esc(module.trainer.nickname)}"><p><strong>${esc(module.trainer.nickname)}, your safety guide</strong><br>${esc(module.trainer.introduction)}</p></div>` : `<div class="info-callout mb-24">${icon("trainer", 17)}<span>Your administrator has not assigned an active virtual trainer to this module yet.</span></div>`}<h3 style="font-size:13px">What you’ll learn</h3><ul class="learning-list">${module.objectives.map((o) => `<li>${icon("checkCircle", 15)}<span>${esc(o)}</span></li>`).join("")}</ul><h3 style="font-size:13px">Before you begin</h3><ul class="learning-list">${module.rules.map((r) => `<li>${icon("shield", 15)}<span>${esc(r)}</span></li>`).join("")}</ul><div class="info-callout blue-callout">${icon("info", 17)}<span><strong>Preview only — assessments are not available yet.</strong><br>Phase 2 will add interactive 360° activities and quizzes with a 20-second question timer. You’ll need at least 70/100 in every module. These introductory notes do not replace site-specific safety training or authorisation.</span></div>`,
    footer:
      '<button class="btn btn-secondary" data-close-modal>Back to training hub</button><button class="btn btn-primary" disabled>Assessment available in Phase 2</button>',
  });
}
function moduleCards(data) {
  return data.modules
    .map((m) => {
      const meta = moduleMeta[m.key];
      const progress = data.progress.modules.find((p) => p.key === m.key);
      return `<article class="module-card"><span class="module-icon ${meta.color}">${icon(meta.icon, 23)}</span><span class="badge ${progress.status === "passed" ? "green" : progress.status === "retake" ? "amber" : "gray"}">${progress.score === null ? (m.assessmentAvailable ? (data.activeTraining?.[m.key] ? "In progress" : "Training available") : "Overview available") : `${progress.score}/100 · ${progress.classification}`}</span><h3>${esc(m.title)}</h3><p>${esc(m.description)}</p><div class="module-card-meta"><span>${m.trainer ? `Guide: ${esc(m.trainer.nickname)}` : "Guide not assigned"}</span><span>70% to pass</span></div><button class="btn ${meta.color}" data-module="${m.key}">${m.assessmentAvailable ? (data.activeTraining?.[m.key] ? "Continue training" : progress.source === "assessment" ? "Open module" : "Start training") : "View module overview"} ${icon("arrow", 14)}</button></article>`;
    })
    .join("");
}
function hub(ctx, data) {
  const trainer = data.modules.find((m) => m.trainer)?.trainer;
  const p = data.progress;
  return {
    title: "Training hub",
    html: `<div class="page-heading"><div><div class="page-eyebrow">YOUR SAFETY JOURNEY</div><h1>Welcome, ${esc(ctx.state.user.firstName)}.</h1><p>A little learning. A lasting difference.</p></div><span class="badge green">${icon("shield", 12)}Account secured</span></div><section class="employee-welcome"><div><div class="eyebrow" style="color:var(--red);font-size:8px;margin-bottom:10px">LET’S MAKE SAFETY SECOND NATURE</div><h2>Your safer start<br>begins right here.</h2><p>Build the awareness to spot hazards, make confident decisions, and look out for the people around you.</p><div class="journey-facts"><span>${icon("book", 14)}3 core modules</span><span>${icon("award", 14)}70% in every module</span></div></div>${trainer ? `<div class="welcome-guide"><img src="${esc(trainer.imageUrl)}" alt="${esc(trainer.nickname)}, your virtual trainer"><div class="guide-speech"><strong>${esc(trainer.nickname)} · YOUR SAFETY GUIDE</strong>${esc(trainer.introduction)}</div></div>` : ""}</section><div class="section-title"><h2>Your training modules</h2><span>Learn at your own pace</span></div><section class="module-grid" aria-label="Safety training modules">${moduleCards(data)}</section><section class="panel learning-progress-card"><div class="progress-ring" style="--value:${p.percent}"><span>${p.percent}%</span></div><div><h3>${p.passed === 3 ? "All three modules passed." : "Every safe decision is a step forward."}</h3><p>${p.passed} of 3 modules passed. ${p.passed === 3 ? "You meet the score requirement for certification." : "Pass every module to meet the certification requirement."}</p></div><a href="#/employee/progress" class="btn btn-secondary">View my progress ${icon("arrow", 14)}</a></section><div class="scope-note mt-24">${icon("info", 16)}<span><strong>Two modules are ready to play.</strong> Complete Manual Handling and Working at Height with 3D activities and timed quizzes. Hazard Perception and the final certificate flow are coming next.${p.hasDemoScores ? " This account includes clearly labelled sample scores." : ""}</span></div>`,
    mount(root) {
      root.querySelectorAll("[data-module]").forEach(
        (b) =>
          (b.onclick = () => {
            const module = data.modules.find((m) => m.key === b.dataset.module);
            if (module.assessmentAvailable)
              ctx.navigate(`/employee/module/${module.key}`);
            else showModule(module);
          }),
      );
    },
  };
}
function progress(ctx, data) {
  const p = data.progress;
  return {
    title: "My progress",
    html: `<div class="page-heading"><div><h1>Small steps. Safer habits.</h1><p>Your progress across the three required safety modules.</p></div>${progressBadge(p.status)}</div><section class="panel learning-progress-card" style="margin:0 0 24px"><div class="progress-ring" style="--value:${p.percent}"><span>${p.percent}%</span></div><div><h3>${p.passed} of 3 modules passed</h3><p>${p.overallScore === null ? "Your overall score will appear once all three modules are assessed." : `Overall score: ${p.overallScore} / 100. Every individual module still needs at least 70.`}</p></div></section>${p.hasDemoScores ? `<div class="scope-note">${icon("info", 16)}<span><strong>Sample progress.</strong> These demonstration scores illustrate the reporting interface. They are not evidence of completed safety training.</span></div>` : ""}<section class="panel"><header class="panel-head"><div><h2>Module-by-module progress</h2><p>Your next safe decision starts with awareness.</p></div>${icon("chart", 18)}</header><div class="panel-body"><div class="detail-modules">${p.modules.map((m) => `<div class="detail-module"><span class="module-small-icon">${icon(moduleMeta[m.key].icon)}</span><div><strong>${moduleMeta[m.key].short}</strong><small>${m.score === null ? "No assessment yet" : `${m.attempts} attempt${m.attempts === 1 ? "" : "s"} · ${formatDate(m.assessedAt)}`}</small></div><span style="margin-left:auto" class="score ${m.score === null ? "none" : m.score >= 85 ? "excellent" : m.score >= 70 ? "pass" : "fail"}">${m.score === null ? "—" : `${m.score}<small>/100</small>`}</span><span class="badge ${m.score === null ? "gray" : m.score >= 70 ? "green" : "amber"}">${m.classification}</span></div>`).join("")}</div><div class="info-callout mt-24">${icon("award", 17)}<span>Certificate eligibility requires <strong>70/100 or higher in all three modules</strong>. Below 70 means a retake. Manual Handling and Working at Height assessments are available now. Hazard Perception and final certificates are coming next.</span></div></div></section><div class="progress-legend"><span><i></i>Excellent · 85–100</span><span><i class="blue"></i>Pass · 70–84</span><span><i class="amber"></i>Retake · below 70</span></div>`,
    mount() {},
  };
}
function certificates(ctx, data) {
  return {
    title: "Certificates",
    html: `<div class="page-heading"><div><h1>A milestone worth earning.</h1><p>Build your knowledge. Complete your safety journey.</p></div></div><section class="panel certificate-placeholder"><div class="certificate-icon">${icon("award", 35)}</div><span class="badge gray mb-24">CERTIFICATE GENERATION · PHASE 2</span><h2>${data.progress.eligible ? "You meet the score requirement." : "Your certificate is ahead of you."}</h2><p>${data.progress.eligible ? "All three module scores are at least 70/100. Certificate generation has not been implemented in this phase." : "Pass Manual Handling, Working at Height and Hazard Perception with at least 70/100 in each to become eligible."}</p><div class="progress-ring" style="--value:${data.progress.percent};margin:0 auto 23px"><span>${data.progress.passed}/3</span></div>${data.progress.hasDemoScores ? "<p>Sample results do not count as real training evidence. No certificate is issued from this demo.</p>" : ""}<a href="#/employee/hub" class="btn btn-primary">Back to training hub ${icon("arrow", 15)}</a></section>`,
    mount() {},
  };
}
export async function employeePage(route, ctx) {
  const routeName = route.split("?")[0];
  const attemptId = new URLSearchParams(route.split("?")[1] || "").get(
    "attempt",
  );
  if (routeName === "/employee/module/manual-handling") {
    const { manualHandlingPage } = await import("./manual-handling.js");
    return manualHandlingPage(ctx, attemptId);
  }
  if (routeName === "/employee/module/working-at-height") {
    const { workingAtHeightPage } = await import("./working-at-height.js");
    return workingAtHeightPage(ctx, attemptId);
  }
  if (route === "/employee/settings") return settingsPage(ctx);
  const data = await ctx.api.get("/me/training");
  if (route === "/employee/hub") return hub(ctx, data);
  if (route === "/employee/progress") return progress(ctx, data);
  if (route === "/employee/certificates") return certificates(ctx, data);
  return {
    title: "Page not found",
    html: `${empty("That page isn’t here", "Choose a page from the navigation to continue.", "help")}<div style="text-align:center"><a class="btn btn-primary" href="#/employee/hub">Back to training hub</a></div>`,
  };
}

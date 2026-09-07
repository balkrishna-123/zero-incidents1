import { icon } from "./icons.js";
import { moduleMeta } from "./ui.js";
import { manualPrimer } from "./module-readings.js";

const heightPrimer = `<section class="training-primer panel"><header class="panel-head"><div><h2>Plan before anyone leaves the ground</h2><p>Understand the hierarchy before choosing equipment.</p></div>${icon("book", 20)}</header><div class="primer-content"><p><strong>Working at height</strong> includes places where a person could fall and be injured if precautions were absent. Even a short fall can matter. The task must be assessed, planned, supervised and carried out with suitable competence and equipment.</p><div class="tile-grid height-hierarchy"><article><span>1</span><h3>Avoid height</h3><p>First consider a suitable ground-level method. Check the task and surroundings; reaching equipment is not automatically suitable for every job.</p></article><article><span>2</span><h3>Prevent falls</h3><p>If height cannot be avoided, use a safe place of work or suitable equipment. Consider protection for everyone, such as guardrails, before personal systems.</p></article><article><span>3</span><h3>Minimise consequences</h3><p>If a fall risk remains, plan measures to reduce the distance and consequences. Specialist fall-protection systems require competent selection, training and rescue arrangements.</p></article></div><div class="height-stop-note">${icon("shield", 19)}<div><strong>Stop and ask when something is not right.</strong><p>Do not use defective access equipment, climb storage racking, or stand on an ordinary pallet on forklift forks. A short job, hard hat or confidence alone does not make an unsafe setup acceptable.</p></div></div><details class="training-reading"><summary>What should be checked before the task starts?</summary><p>Check the work method, safe access, equipment condition and suitability, edge protection, fragile surfaces such as rooflights, possible falling objects, the people below, and emergency arrangements. Never assume an unassessed roof or rooflight can support a person. Damaged equipment must not be used; tell the person in charge and follow the site’s removal-from-service procedure.</p><p>Ladders are not automatically forbidden, but their suitability must follow a risk assessment. Short duration alone is not a reason to choose one. Follow manufacturer instructions and the required competence and supervision arrangements.</p><p>This simulation is a planning exercise. It does not teach climbing, harness fitting, anchorage design or rescue techniques, and it does not authorise anyone to undertake work at height.</p></details></div></section>`;

export const MODULE_VIEWS = {
  "manual-handling": {
    number: "01",
    icon: moduleMeta["manual-handling"].icon,
    primer: manualPrimer,
    missionTitle: "Make a safer move.",
    mission:
      "Prepare a shipment of parts for dispatch. Your five decisions will make this warehouse move safer.",
    scope:
      "The app does not set a universal lifting weight or authorise equipment use.",
    studyHint: "Use the TILE guide below before deciding.",
    loadScene: () =>
      import("./manual-scene.js").then((m) => m.createManualScene),
  },
  "working-at-height": {
    number: "02",
    icon: moduleMeta["working-at-height"].icon,
    primer: heightPrimer,
    missionTitle: "A safer plan. Before the climb.",
    briefNote:
      "Planning exercise only — follow your site’s assessed procedures and authorisation requirements.",
    mission:
      "Prepare this maintenance area without putting anyone at risk. Inspect five checkpoints and decide what must happen before work can begin.",
    scope:
      "This is a planning simulation, not practical competence training or permission to climb, use access equipment or carry out a rescue.",
    studyHint:
      "Use the avoid → prevent → minimise guide below before deciding.",
    loadScene: () =>
      import("./height-scene.js").then((m) => m.createHeightScene),
  },
};

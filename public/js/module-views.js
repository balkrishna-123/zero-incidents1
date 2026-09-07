import { icon } from "./icons.js";
import { moduleMeta } from "./ui.js";
import { manualPrimer } from "./module-readings.js";

const heightPrimer = `<section class="training-primer panel"><header class="panel-head"><div><h2>Plan before anyone leaves the ground</h2><p>Understand the hierarchy before choosing equipment.</p></div>${icon("book", 20)}</header><div class="primer-content"><p><strong>Working at height</strong> includes places where a person could fall and be injured if precautions were absent. Even a short fall can matter. The task must be assessed, planned, supervised and carried out with suitable competence and equipment.</p><div class="tile-grid height-hierarchy"><article><span>1</span><h3>Avoid height</h3><p>First consider a suitable ground-level method. Check the task and surroundings; reaching equipment is not automatically suitable for every job.</p></article><article><span>2</span><h3>Prevent falls</h3><p>If height cannot be avoided, use a safe place of work or suitable equipment. Consider protection for everyone, such as guardrails, before personal systems.</p></article><article><span>3</span><h3>Minimise consequences</h3><p>If a fall risk remains, plan measures to reduce the distance and consequences. Specialist fall-protection systems require competent selection, training and rescue arrangements.</p></article></div><div class="height-stop-note">${icon("shield", 19)}<div><strong>Stop and ask when something is not right.</strong><p>Do not use defective access equipment, climb storage racking, or stand on an ordinary pallet on forklift forks. A short job, hard hat or confidence alone does not make an unsafe setup acceptable.</p></div></div><details class="training-reading"><summary>What should be checked before the task starts?</summary><p>Check the work method, safe access, equipment condition and suitability, edge protection, fragile surfaces such as rooflights, possible falling objects, the people below, and emergency arrangements. Never assume an unassessed roof or rooflight can support a person. Damaged equipment must not be used; tell the person in charge and follow the site’s removal-from-service procedure.</p><p>Ladders are not automatically forbidden, but their suitability must follow a risk assessment. Short duration alone is not a reason to choose one. Follow manufacturer instructions and the required competence and supervision arrangements.</p><p>This simulation is a planning exercise. It does not teach climbing, harness fitting, anchorage design or rescue techniques, and it does not authorise anyone to undertake work at height.</p></details></div></section>`;

const hazardPrimer = `<section class="training-primer panel"><header class="panel-head"><div><h2>A systematic safety walk</h2><p>Look at the condition, the possible harm and the people exposed.</p></div>${icon("eye", 20)}</header><div class="primer-content"><p><strong>Hazard perception</strong> means noticing conditions that could cause harm and deciding how to respond safely. A colour or an object name is not enough: a clear safety station and an unstable stored load call for different judgements.</p><div class="tile-grid hazard-primer-grid"><article><span>1</span><h3>Observe</h3><p>Look around, including routes, storage, equipment and people. Inspecting any area in this exercise is free and untimed.</p></article><article><span>2</span><h3>Identify the risk</h3><p>Decide whether a hazard is represented. Consider who could slip, trip, be struck, contact damaged equipment or lose an escape route.</p></article><article><span>3</span><h3>Choose a control</h3><p>Keep people clear and use the agreed procedure. Do not climb toward an unstable load, touch a damaged lead or operate equipment you are not trained to use.</p></article></div><div class="hunt-reporting-note">${icon("shield", 18)}<div><strong>In real work, report uncertainty.</strong><p>The exercise deducts two marks for an incorrect flag on a clearly safe comparison area. That is a scoring rule for this illustration only. Always raise genuine or uncertain concerns at work; never hide a risk to protect a score.</p></div></div><details class="training-reading"><summary>How are the 70 activity marks calculated?</summary><p>Each of the five hazards offers 7 identification marks and 7 control-response marks: 35 + 35 = 70. The first decision counts. An incorrect flag on one of the three safe comparison areas deducts 2 marks once, with the activity score never below zero.</p><p>Review all eight areas and respond to all five hazards before the quiz. A wrong identification is explained so you can still learn and choose a control, but it does not regain the lost identification marks. The quiz adds up to 30 marks, and 70/100 passes this module.</p></details><details class="training-reading"><summary>What does the scene demonstrate?</summary><p>Represented risks include contamination on a walking route, pedestrian–vehicle conflict, an unstable load, a damaged trailing lead and a blocked escape route. The other three areas show clearly described comparison conditions, not a guarantee about a real site.</p><p>Visual changes illustrate example controls. A cordon or tag is not proof that a load, substance, vehicle or electrical circuit is safe. Follow your employer’s assessment, reporting, isolation and emergency procedures, with competent help where required.</p></details></div></section>`;
export const MODULE_VIEWS = {
  "hazard-perception": {
    number: "03",
    icon: moduleMeta["hazard-perception"].icon,
    primer: hazardPrimer,
    missionTitle: "Notice it. Make it safer.",
    mission:
      "Explore eight warehouse areas in any order. Identify five hazards, recognise three safe comparison areas and choose safer responses.",
    briefNote:
      "This is a learning exercise. Inspect freely and always report uncertain risks in real work.",
    scope:
      "The simulation does not approve a workplace or authorise repairs, vehicle operation or electrical work.",
    studyHint:
      "Observe the condition, consider possible harm, then choose a suitable control.",
    loadScene: () =>
      import("./hazard-scene.js").then((m) => m.createHazardScene),
  },
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

// Original warehouse examples. Observations are free to inspect; grading keys stay here.
const choices = (a) => a.map((text, i) => ({ id: `choice-${i + 1}`, text }));
const task = (
  id,
  objectId,
  title,
  prompt,
  options,
  correct,
  explanation,
  reference,
) => ({
  id,
  objectId,
  title,
  prompt,
  options: choices(options),
  correctId: `choice-${correct + 1}`,
  explanation,
  reference,
});
const question = (id, prompt, options, correct, explanation, reference) => ({
  id,
  prompt,
  options: choices(options),
  correctId: `choice-${correct + 1}`,
  explanation,
  reference,
});
export const HAZARD_COURSE = {
  key: "hazard-perception",
  version: "hazard-2026-v1",
  title: "Hazard Perception",
  zone: "Warehouse safety walk",
  color: "amber",
  type: "hunt",
  subtitle: "Look closer. Make the safer call.",
  description:
    "Inspect eight warehouse areas in any order. Distinguish five hazards from three safe comparison areas, then choose a safer response for each hazard.",
  objectives: [
    "Observe conditions rather than guessing from colours or labels.",
    "Identify who could be harmed and choose a suitable control.",
    "Report unsafe or uncertain conditions without putting yourself at risk.",
  ],
  instructions: [
    "Inspect all eight areas in any order. Looking around and inspecting are free and untimed.",
    "Classify each area once. Five areas contain hazards; three are safe comparison areas in this illustration.",
    "For each hazard: 7 marks for the first correct identification, plus 7 for the first correct control response.",
    "An incorrect hazard flag on a clearly safe comparison area costs 2 activity marks once. In real work, report uncertain risks: do not let this exercise discourage reporting.",
    "Review all eight areas and respond to all five hazards before the five-question quiz. Each question has 20 seconds and is worth 6 marks.",
  ],
  references: ["warehouse", "traffic", "trips", "electrical", "fire"],
  objects: [
    {
      id: "area-a",
      label: "Aisle floor",
      kind: "floor",
      position: [-4.3, 0, -5.0],
    },
    {
      id: "area-g",
      label: "Pallet bay",
      kind: "pallet",
      position: [4.0, 0, -9],
    },
    {
      id: "area-b",
      label: "Vehicle crossing",
      kind: "vehicle",
      position: [5.0, 0, -5.6],
    },
    {
      id: "area-h",
      label: "Marked walkway",
      kind: "walkway",
      position: [1.05, 0, -9.0],
    },
    {
      id: "area-c",
      label: "High storage",
      kind: "storage",
      position: [5.7, 0, 3.1],
    },
    {
      id: "area-f",
      label: "Safety station",
      kind: "station",
      position: [-6.7, 0, -0.5],
    },
    {
      id: "area-d",
      label: "Powered workbench",
      kind: "electrical",
      position: [0.9, 0, 6.8],
    },
    {
      id: "area-e",
      label: "Emergency exit",
      kind: "exit",
      position: [-5.2, 0, 4.5],
    },
  ],
  // These are deliberately not part of courseOverview(). Only the selected observation
  // is returned on inspection; correctness and explanations follow classification.
  areas: {
    "area-a": {
      observation:
        "An oily-looking spill extends across a walking area. No restriction keeps people away from it.",
      feedback:
        "The contamination creates a slip risk. Keep people clear and use the appropriate reporting and cleanup procedure; do not handle an unknown substance without the required precautions.",
      reference: "warehouse",
    },
    "area-b": {
      observation:
        "A pedestrian approach leads into a forklift operating area without effective separation.",
      feedback:
        "Pedestrians and workplace vehicles can collide. Plan separation and designated, controlled crossings rather than relying on visibility, a horn or a high-visibility vest alone.",
      reference: "traffic",
    },
    "area-c": {
      observation:
        "A high stored load is leaning and overhangs its support. A person could enter the area below.",
      feedback:
        "This load could fall onto someone. Keep clear, restrict access and arrange a trained response. Do not climb the racking or try to catch or push back the load.",
      reference: "warehouse",
    },
    "area-d": {
      observation:
        "The lead from the workbench crosses a walking route and has visible damage to its insulation. Its electrical condition has not been confirmed.",
      feedback:
        "The damaged lead presents an electrical concern and a trip obstruction. Keep clear, stop its use through the site’s safe procedure and refer it for competent attention. Do not touch damaged parts or attempt an improvised repair.",
      reference: "electrical",
    },
    "area-e": {
      observation:
        "Empty packaging and cartons obstruct the approach to the marked emergency exit.",
      feedback:
        "Escape routes must be available. Arrange safe removal of the obstruction and keep the exit route clear; do not wait for an alarm before dealing with it.",
      reference: "fire",
    },
    "area-f": {
      observation:
        "The safety station is accessible. Nothing blocks the equipment or the approach in this illustration.",
      feedback:
        "No hazard is represented at this comparison area. Red equipment is not automatically a hazard. Keep safety equipment accessible and continue normal site checks.",
      reference: "fire",
    },
    "area-g": {
      observation:
        "The low pallet load is centred within its marked storage bay. No overhang or blocked walking route is shown here.",
      feedback:
        "No hazard is represented by this low, stable arrangement. In a real workplace, suitability, load limits and equipment condition still need the normal checks.",
      reference: "warehouse",
    },
    "area-h": {
      observation:
        "This section of walkway is clear and level, with a marked route and separation from vehicle movement.",
      feedback:
        "No hazard is represented at this comparison area. Keep the route clear and maintain the separation; an illustration is not a guarantee about a real workplace.",
      reference: "trips",
    },
  },
  tasks: [
    task(
      "hp-spill",
      "area-a",
      "Slippery floor",
      "What is the safest response to this spill?",
      [
        "Walk around it and leave it for the next shift.",
        "Keep people away, report it and arrange cleanup using the appropriate procedure.",
        "Cover it with loose cardboard and continue.",
      ],
      1,
      "Restrict access to the contaminated area and arrange suitable cleanup. A sign alone does not remove the spill. Follow the site procedure, especially if the substance is unknown. The scene shows access restrictions while cleanup is pending.",
      "warehouse",
    ),
    task(
      "hp-traffic",
      "area-b",
      "Pedestrian–vehicle conflict",
      "What should happen at this uncontrolled vehicle crossing?",
      [
        "Rely on high-visibility clothing to prevent a collision.",
        "Walk behind the forklift where the driver may not see you.",
        "Stay out of the operating area and arrange separation or the designated controlled crossing procedure.",
      ],
      2,
      "Separate pedestrian and vehicle activity wherever possible. Use the agreed safe crossing procedure; do not rely on the driver noticing you. The illustration adds separation, not permission to operate a vehicle.",
      "traffic",
    ),
    task(
      "hp-load",
      "area-c",
      "Unstable stored load",
      "What is the appropriate immediate response to the leaning load?",
      [
        "Keep clear, restrict access and report it for a competent response.",
        "Stand below it and push it into position.",
        "Climb the storage rack to adjust it.",
      ],
      0,
      "Do not enter beneath or climb toward a potentially falling load. Keep people out and arrange the appropriate trained response. The scene cordons off the load; it does not make the load stable or approve the racking.",
      "warehouse",
    ),
    task(
      "hp-lead",
      "area-d",
      "Damaged trailing lead",
      "How should the damaged lead be dealt with?",
      [
        "Tape over the damage and keep using it.",
        "Keep clear, report it and stop its use through the safe isolation/removal-from-service procedure, with competent attention.",
        "Move the damaged part with your foot while the equipment remains in use.",
      ],
      1,
      "Avoid contact with damaged parts and follow the safe reporting/isolation procedure. Electrical work belongs with competent, authorised people, not an improvised repair. The tag is a restriction, not confirmation that the circuit is isolated or safe.",
      "electrical",
    ),
    task(
      "hp-exit",
      "area-e",
      "Blocked escape route",
      "What should happen to the obstruction at this exit?",
      [
        "Leave it because an emergency is unlikely.",
        "Wait for the alarm before moving anything.",
        "Arrange safe removal now and keep the marked escape route available.",
      ],
      2,
      "Keep the route to the exit clear. Report the condition and arrange safe clearance under the workplace procedure. The illustration removes the packaging; it does not replace the company’s evacuation plan.",
      "fire",
    ),
  ],
  questions: [
    question(
      "hp-q1",
      "A spill has a warning sign beside it. Is the underlying slip hazard removed?",
      [
        "Yes, the sign removes the contamination.",
        "No. Keep people away and arrange suitable cleanup.",
        "Yes, if everyone has seen the sign.",
      ],
      1,
      "A sign can warn people, but contamination remains until it is safely dealt with.",
      "warehouse",
    ),
    question(
      "hp-q2",
      "What is the preferred approach to pedestrians and workplace vehicles?",
      [
        "Separate their activity and routes wherever possible.",
        "Rely only on a horn.",
        "Rely only on high-visibility clothing.",
      ],
      0,
      "Separation is preferred; use suitable controls wherever pedestrian and vehicle routes must interact.",
      "traffic",
    ),
    question(
      "hp-q3",
      "A stored load looks unstable. What should a new employee do?",
      [
        "Try to catch it if it moves.",
        "Climb the rack to adjust it.",
        "Keep clear, restrict access through the site procedure and report it for a trained response.",
      ],
      2,
      "Avoid entering the falling-object risk area or attempting an unsafe intervention.",
      "warehouse",
    ),
    question(
      "hp-q4",
      "A lead was checked in the past but is visibly damaged now. Is it safe to keep using?",
      [
        "Yes, the previous check overrides new damage.",
        "No. Report the defect and follow the safe procedure for stopping use.",
        "Yes, if it still works.",
      ],
      1,
      "Current condition matters. A previous inspection does not make a new defect safe.",
      "electrical",
    ),
    question(
      "hp-q5",
      "When should a blocked escape route be addressed?",
      [
        "Promptly, so the route is available before an emergency.",
        "Only after an alarm sounds.",
        "Only at the end of the week.",
      ],
      0,
      "An evacuation plan needs clear passageways and usable escape routes.",
      "fire",
    ),
    question(
      "hp-q6",
      "Why should walking routes be free of cables and packaging?",
      [
        "Only to improve appearance.",
        "Only to avoid damaging the packaging.",
        "They can cause trips and obstruct safe movement.",
      ],
      2,
      "Good housekeeping and suitable route design help prevent trips.",
      "trips",
    ),
    question(
      "hp-q7",
      "You are unsure whether a condition is dangerous in real work. What should you do?",
      [
        "Ignore it to avoid raising an incorrect concern.",
        "Keep yourself safe and report or seek advice through the site procedure.",
        "Intervene even if you are not trained.",
      ],
      1,
      "Uncertain conditions should be raised for a safe assessment. Never use this exercise’s marks as a reason to hide a genuine concern.",
      "warehouse",
    ),
    question(
      "hp-q8",
      "Does red equipment automatically mean a hazard exists?",
      [
        "No. Assess the condition and situation, not colour alone.",
        "Yes, all red objects are unsafe.",
        "Only if a warning sticker is missing.",
      ],
      0,
      "Identify the actual condition and possible harm. Accessible safety equipment is not itself a hazard simply because of its colour.",
      "warehouse",
    ),
    question(
      "hp-q9",
      "What makes a useful hazard report?",
      [
        "Only saying that someone should be more careful.",
        "Waiting until someone is injured.",
        "A clear location, observed condition and who may be affected, reported through the agreed process.",
      ],
      2,
      "A clear report helps the responsible people assess and control the risk. Stay safe and follow the site’s reporting arrangements.",
      "warehouse",
    ),
  ],
};

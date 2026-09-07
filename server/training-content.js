// Assessment answers stay on the server. Only explicitly serialized fields are public.
// Original scenarios informed by the linked HSE guidance; not site authorization.
export const COURSE_VERSION = "warehouse-2026-v1";
export const QUIZ_SECONDS = 20;
export const REFERENCES = {
  manual: {
    title: "HSE · Manual handling at work",
    url: "https://www.hse.gov.uk/msd/manual-handling/index.htm",
  },
  technique: {
    title: "HSE · Good handling technique",
    url: "https://www.hse.gov.uk/msd/manual-handling/good-handling-technique.htm",
  },
  height: {
    title: "HSE · Working at height safely",
    url: "https://www.hse.gov.uk/work-at-height/introduction.htm",
  },
  ladders: {
    title: "HSE · Selecting and using ladders",
    url: "https://www.hse.gov.uk/work-at-height/ladders/when-how-to-use-ladders-safely.htm",
  },
  ladderChecks: {
    title: "HSE · Ladder pre-use checks",
    url: "https://www.hse.gov.uk/work-at-height/ladders/how-to-check-ladder-is-safe-before-use.htm",
  },
  warehouse: {
    title: "HSE · Warehousing and storage: Keep it safe",
    url: "https://www.hse.gov.uk/pubns/indg412.pdf",
  },
  traffic: {
    title: "HSE · Separating pedestrians and vehicles",
    url: "https://www.hse.gov.uk/workplacetransport/separating.htm",
  },
  trips: {
    title: "HSE · Preventing slips and trips",
    url: "https://www.hse.gov.uk/slips/preventing-overview.htm",
  },
  electrical: {
    title: "HSE · Electrical equipment safety",
    url: "https://www.hse.gov.uk/electricity/faq-portable-appliance-testing.htm",
  },
};
const options = (values) =>
  values.map((text, i) => ({ id: `choice-${i + 1}`, text }));
function task(
  id,
  objectId,
  title,
  prompt,
  choices,
  correct,
  explanation,
  reference,
) {
  return {
    id,
    objectId,
    title,
    prompt,
    options: options(choices),
    correctId: `choice-${correct + 1}`,
    explanation,
    reference,
  };
}
function question(id, prompt, choices, correct, explanation, reference) {
  return {
    id,
    prompt,
    options: options(choices),
    correctId: `choice-${correct + 1}`,
    explanation,
    reference,
  };
}
export const COURSES = {
  "manual-handling": {
    key: "manual-handling",
    title: "Manual Handling",
    zone: "Dispatch bay",
    color: "mint",
    type: "guided",
    subtitle: "A safer move starts before the lift.",
    description:
      "Prepare an automotive-parts shipment. Inspect the load, clear the route, select a handling aid and make safe movement decisions.",
    objectives: [
      "Assess the task, load, individual capability and environment.",
      "Use suitable handling aids rather than relying on technique alone.",
      "Plan the route and destination before moving a load.",
    ],
    instructions: [
      "Work through five checkpoints. Click a numbered scene marker, or use the accessible scene list.",
      "Inspect each checkpoint and choose a response. Your first response counts: 14 marks per correct decision.",
      "After the activity, answer five timed questions worth 6 marks each. You have 20 seconds for each question.",
      "You need 70/100 overall. Retakes are allowed; the best assessed score is kept.",
    ],
    references: ["manual", "technique", "warehouse"],
    objects: [
      {
        id: "load",
        label: "Parts shipment",
        kind: "load",
        position: [-3.6, 0, -5.2],
      },
      {
        id: "route",
        label: "Dispatch walkway",
        kind: "obstruction",
        position: [1.1, 0, -6.2],
      },
      {
        id: "aid",
        label: "Handling equipment",
        kind: "trolley",
        position: [5, 0, -2.8],
      },
      {
        id: "move",
        label: "Handling workstation",
        kind: "workstation",
        position: [4.4, 0, 4.8],
      },
      {
        id: "destination",
        label: "Delivery bench",
        kind: "destination",
        position: [-4, 0, 5.5],
      },
    ],
    tasks: [
      task(
        "mh-load",
        "load",
        "Assess the load",
        "The shipment has no clear weight information and an awkward shape. What should happen before anyone tries to lift it?",
        [
          "Give it a quick lift to see whether it feels heavy.",
          "Assess the load, task and surroundings, and check whether the move can be avoided or mechanised.",
          "Assume it is safe because the box is not very large.",
        ],
        1,
        "Assess before handling. Weight alone does not determine risk, and hazardous manual handling should be avoided where reasonably practicable. Ask for information or assistance rather than testing an uncertain load with a lift.",
        "manual",
      ),
      task(
        "mh-route",
        "route",
        "Plan the route",
        "Discarded wrapping and a carton obstruct the marked pedestrian route. What is the safest next step?",
        [
          "Step over the wrapping while carrying the shipment.",
          "Use the forklift lane as a shortcut.",
          "Keep the load at rest, arrange safe removal of the obstruction, and check the full route and destination.",
        ],
        2,
        "Plan the route before moving the load. Remove obstructions through the site procedure and keep pedestrian routes available; carrying a load is not a reason to enter a vehicle route.",
        "technique",
      ),
      task(
        "mh-aid",
        "aid",
        "Choose a suitable aid",
        "A suitable, inspected trolley is available for this shipment, and you are trained to use it. Which plan best reduces manual carrying?",
        [
          "Use the trolley within its rating and the agreed safe system of work.",
          "Carry it by hand because using equipment takes longer.",
          "Use the trolley even if its wheel is damaged.",
        ],
        0,
        "A suitable handling aid can reduce manual carrying. Check suitability, condition, loading and training; equipment must not introduce a new risk.",
        "warehouse",
      ),
      task(
        "mh-move",
        "move",
        "Move with control",
        "The risk assessment permits moving a small manageable item by hand. You need to turn toward the bench. Which response follows good handling principles?",
        [
          "Hold it far out so it is easy to see your feet.",
          "Keep it close, maintain a stable position and turn by moving your feet rather than twisting under load.",
          "Keep your feet planted and twist your back to save time.",
        ],
        1,
        "When a manual lift is appropriate, keep the load close and move smoothly. Change direction with your feet instead of twisting under load. Technique supplements—not replaces—risk reduction.",
        "technique",
      ),
      task(
        "mh-place",
        "destination",
        "Set down safely",
        "The item needs precise positioning on the prepared bench. What should you do?",
        [
          "Keep holding it away from the body until the position looks exact.",
          "Leave it on the walkway for the next employee.",
          "Put it down in a controlled way, then adjust its position without creating an obstruction.",
        ],
        2,
        "Plan a suitable destination. Put the load down before fine positioning; do not leave loads obstructing a route. Stay within your capability and stop for help if the task is unsafe.",
        "technique",
      ),
    ],
    questions: [
      question(
        "mh-q1",
        "What is the first approach to hazardous manual handling?",
        [
          "Avoid the hazardous operation where reasonably practicable.",
          "Teach lifting technique and leave the task unchanged.",
          "Choose the strongest employee.",
        ],
        0,
        "Avoid hazardous manual handling first. If it cannot be avoided, assess and reduce the risk.",
        "manual",
      ),
      question(
        "mh-q2",
        "Which set of factors should be considered before handling a load?",
        [
          "Only its weight and colour.",
          "The task, load, working environment and individual capability.",
          "Only how quickly the task can be finished.",
        ],
        1,
        "A useful assessment considers the task, load, working environment and individual capability; weight is only one factor.",
        "warehouse",
      ),
      question(
        "mh-q3",
        "Does one fixed weight guarantee that a load is safe for everybody to lift?",
        [
          "Yes, if the label says it is light.",
          "Yes, as long as two hands are used.",
          "No. The whole task and the individual must be assessed.",
        ],
        2,
        "There is no universal safe lifting weight. Shape, reach, repetition, route and individual capability also affect risk.",
        "manual",
      ),
      question(
        "mh-q4",
        "A load feels beyond your capability. What should you do?",
        [
          "Stop and get suitable advice, assistance or equipment.",
          "Lift quickly so the effort ends sooner.",
          "Try once before asking anyone.",
        ],
        0,
        "Do not handle more than you can manage safely. Get advice or help when in doubt.",
        "technique",
      ),
      question(
        "mh-q5",
        "When an assessed manual lift is appropriate, how should you change direction?",
        [
          "Twist your back while keeping the feet still.",
          "Move your feet and keep the load close.",
          "Lean sideways with the load extended.",
        ],
        1,
        "Moving your feet is preferable to twisting and lifting at the same time.",
        "technique",
      ),
      question(
        "mh-q6",
        "Is good lifting technique a substitute for a suitable handling aid?",
        [
          "Always.",
          "Only for experienced workers.",
          "No. Technique is an additional measure, not a replacement for risk reduction.",
        ],
        2,
        "Good technique complements task design, suitable equipment and other risk controls.",
        "technique",
      ),
      question(
        "mh-q7",
        "When should the route and destination be checked?",
        [
          "Before starting the handling operation.",
          "Only after the load has been picked up.",
          "Only if another person complains.",
        ],
        0,
        "Think before handling: plan where the load will go and remove obstructions first.",
        "technique",
      ),
    ],
  },
  "working-at-height": {
    version: "height-2026-v1",
    key: "working-at-height",
    title: "Working at Height",
    zone: "Maintenance zone",
    color: "blue",
    type: "guided",
    subtitle: "The safest step may be staying on the ground.",
    description:
      "Prepare a maintenance area without rushing into a climb. Make decisions about avoiding height, equipment checks, edge protection and the people below.",
    objectives: [
      "Apply the avoid → prevent → minimise hierarchy.",
      "Recognise unsafe access equipment and incomplete edge protection.",
      "Protect people below and escalate work you are not trained to do.",
    ],
    instructions: [
      "Inspect five checkpoints in order, using the 3D markers or the accessible scene list.",
      "Each first correct activity response earns 14 marks. No real climbing task is demonstrated or authorised.",
      "Complete five quiz questions, worth 6 marks each, with 20 seconds per question.",
      "Pass at 70/100 or higher. A retake never lowers an existing assessed best score.",
    ],
    references: ["height", "ladders", "ladderChecks", "warehouse"],
    objects: [
      {
        id: "ground-tool",
        label: "Ground-level maintenance kit",
        kind: "ground-tool",
        position: [-4.7, 0, -5],
      },
      {
        id: "ladder",
        label: "Access equipment",
        kind: "ladder",
        position: [0, 0, -7],
      },
      {
        id: "platform",
        label: "Work platform",
        kind: "platform",
        position: [5, 0, -4],
      },
      {
        id: "below",
        label: "Area beneath the work",
        kind: "barrier-zone",
        position: [4.3, 0, 4.5],
      },
      {
        id: "permission",
        label: "Work plan station",
        kind: "noticeboard",
        position: [-4.8, 0, 5],
      },
    ],
    tasks: [
      task(
        "wh-ground",
        "ground-tool",
        "Avoid height first",
        "A non-electrical sign can be cleaned safely from the ground using a suitable extending tool. Which plan should be considered first?",
        [
          "Climb a rack because it is closest.",
          "Use the suitable ground-level method after checking the task and surroundings.",
          "Choose a harness before considering any other approach.",
        ],
        1,
        "Avoid work at height where reasonably practicable. A ground-level method still needs to be suitable for the task and surroundings, including any overhead hazards.",
        "height",
      ),
      task(
        "wh-check",
        "ladder",
        "Check the equipment",
        "A pre-use check finds a damaged rung on this ladder. What should you do?",
        [
          "Use it carefully and avoid that rung.",
          "Ask someone to hold it while you climb.",
          "Do not use it; report and remove it from service through the site procedure, and obtain suitable equipment.",
        ],
        2,
        "Access equipment must be suitable and checked. A damaged ladder must not be made acceptable by a helper or by stepping around the defect. The scene marks it out of use; it does not repair it.",
        "ladderChecks",
      ),
      task(
        "wh-edge",
        "platform",
        "Prevent a fall",
        "The work platform has a gap in its edge protection. What is the appropriate response?",
        [
          "Stop access until suitable collective protection and a safe work method are in place.",
          "Stand far from the gap and continue.",
          "Wear a hard hat and assume the fall risk is controlled.",
        ],
        0,
        "Prevent falls using a safe workplace or suitable equipment. Consider collective protection before personal protection; a hard hat does not prevent a fall.",
        "height",
      ),
      task(
        "wh-below",
        "below",
        "Protect people below",
        "Tools could fall from the planned work area, and a pedestrian route passes underneath. What is needed?",
        [
          "Warn people only if a tool actually falls.",
          "Plan controls for falling objects and prevent unauthorised access to the risk area, using an agreed alternative route.",
          "Ask pedestrians to walk faster under the work.",
        ],
        1,
        "Plan protection from falling objects and keep unauthorised people out of the risk area. Do not leave pedestrians to manage an uncontrolled overhead hazard.",
        "height",
      ),
      task(
        "wh-plan",
        "permission",
        "Check competence and rescue",
        "You have not been trained or authorised to use the proposed access equipment. The job is urgent. What should happen?",
        [
          "Let a colleague show you one step and start.",
          "Start now and finish the paperwork later.",
          "Do not start; ask the supervisor to arrange competent people, suitable equipment and the work/rescue plan.",
        ],
        2,
        "Work at height must be planned, supervised and carried out by competent people. Consider emergency and rescue arrangements before work begins.",
        "height",
      ),
    ],
    questions: [
      question(
        "wh-q1",
        "What is the preferred order for controlling work-at-height risk?",
        [
          "Harness, ladder, then risk assessment.",
          "Avoid height, prevent falls, then minimise remaining fall consequences.",
          "Climb first, inspect later.",
        ],
        1,
        "Use the hierarchy: avoid work at height; if unavoidable, prevent falls; if risk remains, minimise distance and consequences.",
        "height",
      ),
      question(
        "wh-q2",
        "Which is an example of collective protection?",
        [
          "Suitable guardrails protecting everyone on a platform.",
          "One person remembering not to approach an edge.",
          "A high-visibility vest.",
        ],
        0,
        "Guardrails are collective protection: effectiveness does not depend on each person attaching equipment.",
        "height",
      ),
      question(
        "wh-q3",
        "Can an ordinary pallet on forklift forks be used as a work platform?",
        [
          "Yes, if the task is quick.",
          "Yes, if the operator is careful.",
          "No. Use suitable, properly selected access equipment.",
        ],
        2,
        "HSE warehouse guidance says never use pallets on forklift trucks for access to work at height or as working platforms.",
        "warehouse",
      ),
      question(
        "wh-q4",
        "What should happen after a pre-use check finds damage to a ladder?",
        [
          "Use it only for a low step.",
          "Stop using it and follow the reporting/removal-from-service procedure.",
          "Cover the defect with tape.",
        ],
        1,
        "Damaged equipment is not made safe by a shorter task or improvised repair. Obtain suitable equipment.",
        "ladderChecks",
      ),
      question(
        "wh-q5",
        "Who should undertake the work with the selected equipment?",
        [
          "People with suitable competence, training and authorisation under the work plan.",
          "Anyone who is confident.",
          "Whoever is available first.",
        ],
        0,
        "Confidence alone is not competence. Planning, supervision and suitable skills, knowledge and experience are required.",
        "height",
      ),
      question(
        "wh-q6",
        "A person could fall a short distance and be injured. Is the fall risk worth assessing?",
        [
          "No; only very high work matters.",
          "Only when a ladder is used.",
          "Yes. A fall capable of injury can matter even at a low level.",
        ],
        2,
        "Work at height is not defined by a universal minimum height; consider whether a fall could cause injury.",
        "height",
      ),
      question(
        "wh-q9",
        "A rooflight has not been assessed as load-bearing. Can you assume it is safe to stand on?",
        [
          "Yes, if the task is quick.",
          "No. Keep off it and have the surface and protective measures assessed under the work plan.",
          "Yes, if you wear a hard hat.",
        ],
        1,
        "Do not assume a roof or rooflight can support a person. Fragile surfaces need specific precautions and competent planning; a hard hat does not prevent a fall through a surface.",
        "height",
      ),
      question(
        "wh-q8",
        "A task will take only a few minutes. Is that enough to decide a ladder is suitable?",
        [
          "Yes, short jobs are always safe on ladders.",
          "No. Assess the risk, equipment and conditions before selecting access equipment.",
          "Yes, if a colleague is nearby.",
        ],
        1,
        "Short duration alone does not make a ladder appropriate. Risk must be considered first, including whether higher-protection equipment is justified.",
        "ladders",
      ),
      question(
        "wh-q7",
        "What else must be considered when planning work above other people?",
        [
          "Only the worker’s speed.",
          "Falling objects, access restrictions and emergency arrangements.",
          "Only the colour of the platform.",
        ],
        1,
        "Protect people from falling objects and consider evacuation and rescue as part of planning.",
        "height",
      ),
    ],
  },
};
export const AVAILABLE_MODULE_KEYS = Object.freeze(Object.keys(COURSES));
export function courseOverview(key) {
  const c = COURSES[key];
  if (!Object.hasOwn(COURSES, key)) return null;
  return {
    key: c.key,
    title: c.title,
    zone: c.zone,
    color: c.color,
    type: c.type,
    subtitle: c.subtitle,
    description: c.description,
    objectives: c.objectives,
    instructions: c.instructions,
    objects: c.objects,
    taskCount: c.tasks.length,
    references: c.references.map((k) => ({ key: k, ...REFERENCES[k] })),
    version: c.version || COURSE_VERSION,
    activityMax: 70,
    quizMax: 30,
    quizCount: 5,
    quizSeconds: QUIZ_SECONDS,
    passMark: 70,
    notice:
      "Educational prototype based on HSE guidance. Follow local law and your company’s assessed procedures. Completion does not authorise practical work; content needs workplace safety review.",
  };
}

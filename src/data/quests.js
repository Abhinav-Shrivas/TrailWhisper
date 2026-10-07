// Sensory "Touch Grass" Micro-Expeditions
// Designed to minimize screen gaze and maximize tactile, auditory, and olfactory outdoor immersion.

export const OUTDOOR_QUESTS = [
  {
    id: "quest-texture",
    title: "Tactile Texture Trio",
    timeEstimate: "5 Mins Outside",
    difficulty: "Gentle",
    iconName: "Hand",
    badgeColor: "#22c55e",
    promptAudio: "Embark on the Tactile Texture Trio. Your mission: touch three distinctly different organic surfaces with your bare fingertips—rough, velvety, and waxy. Put your phone in your pocket and begin.",
    challengeText: "Touch 3 distinct nature textures: rough bark, soft velvet moss, and a glossy waxy leaf.",
    sensoryFocus: "Touch & Somatosensory",
    instructions: [
      "Put your phone in your pocket or tap Trail Sleep.",
      "Walk 50 paces along your path.",
      "Gently press your fingertips against rough tree bark.",
      "Find a bed of soft moss or clover to touch.",
      "Inspect a waxy or rubbery evergreen leaf."
    ],
    reflectionPrompt: "Notice the temperature difference between the living bark and stone."
  },
  {
    id: "quest-soundbath",
    title: "Canopy Bioacoustic Bath",
    timeEstimate: "7 Mins Outside",
    difficulty: "Mindful",
    iconName: "Headphones",
    badgeColor: "#38bdf8",
    promptAudio: "Canopy Bioacoustic Bath initiated. Find a bench or tree trunk, close your eyes, and count three separate natural sounds that are not human-made. Your screen will sleep now.",
    challengeText: "Stand motionless with eyes closed for 60 seconds. Distinguish bird song, wind in foliage, and rustling ground litter.",
    sensoryFocus: "Auditory Listening",
    instructions: [
      "Stand or sit under any tree canopy.",
      "Close your eyes completely.",
      "Listen for high-pitched bird contact notes.",
      "Listen for wind through high needles vs deciduous leaves.",
      "Open your eyes slowly and observe what moved."
    ],
    reflectionPrompt: "Which sound carried the farthest across the outdoor air?"
  },
  {
    id: "quest-chlorophyll",
    title: "Autumn Chlorophyll Spectrum",
    timeEstimate: "10 Mins Outside",
    difficulty: "Explorer",
    iconName: "Sun",
    badgeColor: "#f97316",
    promptAudio: "Autumn Spectrum challenge ready. Collect four fallen leaves illustrating nature's color gradient from summer emerald to fiery russet. Keep your eyes on the ground.",
    challengeText: "Find 4 fallen leaves displaying the degradation of green chlorophyll into carotenes and anthocyanins.",
    sensoryFocus: "Visual Observation in Nature",
    instructions: [
      "Scan the ground near tree roots.",
      "Collect 1 fully green leaf.",
      "Collect 1 yellow or golden leaf (carotenoids).",
      "Collect 1 flaming red or purple leaf (anthocyanins).",
      "Collect 1 brown weathered leaf (tannins)."
    ],
    reflectionPrompt: "Hold them side by side in the sunlight to see the life cycle of the canopy."
  },
  {
    id: "quest-petrichor",
    title: "Geosmin & Earth Inhalation",
    timeEstimate: "4 Mins Outside",
    difficulty: "Relaxing",
    iconName: "Wind",
    badgeColor: "#a855f7",
    promptAudio: "Deep Earth Inhalation. Walk until you are away from pavement. Inhale deeply through your nose three times, catching the aroma of damp earth and pine resin.",
    challengeText: "Step off concrete onto soil or grass. Take 3 deep diaphragmatic breaths, inhaling petrichor and plant phytoncides.",
    sensoryFocus: "Olfactory & Breathing",
    instructions: [
      "Step off asphalt onto grass, dirt, or pine mulch.",
      "Bend slightly and inhale deeply through your nose for 4 seconds.",
      "Hold for 4 seconds, feeling the crispness in your chest.",
      "Exhale slowly through your mouth.",
      "Repeat 3 times to absorb woodland terpenes."
    ],
    reflectionPrompt: "Notice how your shoulders relax when smelling living forest soil."
  }
];

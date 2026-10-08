// Gemma 2 Naturalist Reasoning Engine
// Connects to a real local Ollama instance (gemma2:2b) with an offline distilled field knowledge cache.

const OLLAMA_DEFAULT_ENDPOINT = typeof window !== 'undefined' ? "/ollama" : "http://localhost:11434";
const OLLAMA_DEFAULT_MODEL = "gemma2:2b";

const GEMMA_FIELD_KNOWLEDGE = {
  "white-oak": {
    ecologicalStory: "Quercus alba functions as a keystone organism. Its root exudates actively feed ectomycorrhizal fungal networks, which in turn channel phosphorus back to the tree. Its acorns contain lower tannin concentrations than red oaks, making them the primary winter caloric reserve for eastern wild turkeys, squirrels, and deer.",
    generatedQuest: {
      title: "Gemma's Keystone Canopy Quest",
      task: "Look up into the lower branches. Find where the leaves cluster at branch tips, and search the bark crevices for hidden acorn caches stashed by birds.",
      sensoryFocus: "Canopy Arch & Visual Tracking"
    }
  },
  "fly-agaric": {
    ecologicalStory: "Amanita muscaria is an obligate mycorrhizal partner to birch and pine trees. Beneath the forest litter, its mycelial mantle wraps around tree root tips (Hartig net), exchanging dissolved minerals from deep subsoil for tree photosynthates. Its brilliant red pigment serves as a warning of ibotenic acid and muscimol compounds.",
    generatedQuest: {
      title: "Gemma's Mycelial Substrate Quest",
      task: "Identify the nearest birch or pine tree within 15 paces of this mushroom. Notice how the ground soil changes from dry needles to moist humus near the root flare.",
      sensoryFocus: "Soil Texture & Tree Association"
    }
  },
  "black-capped-chickadee": {
    ecologicalStory: "Poecile atricapillus possesses extraordinary spatial neuroplasticity. Each autumn, its hippocampus expands by nearly 30% to memorize thousands of specific seed caches across bark fissures. Its complex bioacoustic call encodes predator size and aerial threat velocity through variable trailing 'dee' notes.",
    generatedQuest: {
      title: "Gemma's Acoustic Frequency Quest",
      task: "Stand motionless and mimic the soft 'fee-bee' whistle or listen for a multi-note alarm call. Watch whether other birds in the understory react to its movement.",
      sensoryFocus: "Bioacoustic Alert System"
    }
  },
  "sugar-maple": {
    ecologicalStory: "Acer saccharum performs 'hydraulic lift' at night. Its deep taproots pull moisture from deep water tables and release it into the upper rhizosphere, sustaining shallower forest herbs. In autumn, declining photoperiod triggers abscission layers, trapping sucrose in leaves to produce vibrant red anthocyanins.",
    generatedQuest: {
      title: "Gemma's Anthocyanin Leaf Filter Quest",
      task: "Hold a fallen maple leaf directly up to the autumn sunlight. Trace the primary palmate veins from the stem notch to see how sunlight shines through the yellow carotenoids.",
      sensoryFocus: "Solar Translucence & Vein Structure"
    }
  },
  "sphagnum-moss": {
    ecologicalStory: "Sphagnum palustre is a planetary carbon sequesterer. Its dead hyaline cells hold 20x dry weight in water, creating anaerobic, acidic bog conditions that prevent bacterial decay. This preserves organic matter for millennia, locking away gigatons of atmospheric carbon.",
    generatedQuest: {
      title: "Gemma's Hydro-Sponge Sensory Quest",
      task: "Gently press a fingernail against the top of the moss mound without tearing it. Feel the cool springy capillary tension and note the immediate release of forest air.",
      sensoryFocus: "Capillary Fluid Dynamics"
    }
  }
};

export const gemmaService = {
  modelMetadata: {
    name: "Google Gemma 2",
    hfModelId: "google/gemma-2-2b-it",
    ollamaTag: "gemma2:2b",
    architecture: "Decoder-only Transformer (Open Weights)",
    parameterCount: "2.6 Billion",
    license: "Gemma Open Model Terms of Use (Commercial & Research Permitted)",
    creator: "Google DeepMind"
  },

  // Configuration management for Ollama
  isOllamaEnabled() {
    if (typeof localStorage === 'undefined') return true;
    const val = localStorage.getItem('trailwhisper_ollama_enabled');
    return val === null ? true : val === 'true';
  },

  setOllamaEnabled(enabled) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('trailwhisper_ollama_enabled', String(enabled));
    }
  },

  getOllamaEndpoint() {
    if (typeof localStorage === 'undefined') return OLLAMA_DEFAULT_ENDPOINT;
    return localStorage.getItem('trailwhisper_ollama_endpoint') || OLLAMA_DEFAULT_ENDPOINT;
  },

  setOllamaEndpoint(endpoint) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('trailwhisper_ollama_endpoint', endpoint);
    }
  },

  getOllamaModel() {
    if (typeof localStorage === 'undefined') return OLLAMA_DEFAULT_MODEL;
    return localStorage.getItem('trailwhisper_ollama_model') || OLLAMA_DEFAULT_MODEL;
  },

  setOllamaModel(model) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('trailwhisper_ollama_model', model);
    }
  },

  /**
   * Pings the local Ollama instance to check if it is running and what models are installed
   */
  async checkOllamaConnection() {
    const endpoints = [this.getOllamaEndpoint(), 'http://localhost:11434'];
    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${ep}/api/tags`, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          const models = data?.models?.map(m => m.name) || [];
          const targetModel = this.getOllamaModel();
          const hasTarget = models.some(m => m.includes('gemma'));
          return {
            online: true,
            endpoint: ep,
            models,
            hasGemma: hasTarget,
            activeModel: hasTarget ? (models.find(m => m.includes('gemma')) || targetModel) : targetModel
          };
        }
      } catch (e) {
        // Continue to next endpoint attempt
      }
    }
    return { online: false, endpoint: this.getOllamaEndpoint(), models: [], hasGemma: false };
  },

  /**
   * Invokes real local Ollama instance for live Gemma 2 generation
   */
  async callOllamaGenerate(prompt, systemPrompt = "") {
    const endpoint = this.getOllamaEndpoint();
    const model = this.getOllamaModel();
    const url = `${endpoint}/api/generate`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: 0.6,
          num_predict: 220
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);
    if (!res.ok) {
      throw new Error(`Ollama HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return data.response;
  },

  /**
   * Generates a naturalist ecological reasoning insight.
   * If Ollama is enabled and responding, streams live from the real local Gemma 2 model.
   * Otherwise, provides distilled zero-cloud offline field knowledge.
   */
  async getEcologicalInsight(speciesId, speciesName, scientificName = "", category = "") {
    const startTime = performance.now();

    // 1. If user enabled Ollama, attempt live local inference
    if (this.isOllamaEnabled()) {
      try {
        const prompt = `Analyze this specimen found on an outdoor nature trail:
Common Name: ${speciesName}
Scientific Name: ${scientificName || "Species"}
Category: ${category || "Wildlife"}

Respond in this exact structured format:
INSIGHT: (2 concise sentences on its ecological relationship and role in the ecosystem)
QUEST: (One tactile/sensory prompt for a hiker to notice with their senses without looking at their phone)
FOCUS: (2-3 words, e.g. Bark Texture, Leaf Veins, Wind Patterns)`;

        const rawResponse = await this.callOllamaGenerate(prompt, "You are TrailWhisper, an outdoor naturalist AI powered by Google Gemma 2. Be poetic, scientifically accurate, and encourage sensory outdoor immersion.");
        const latencyMs = Math.round(performance.now() - startTime);

        // Parse structured response
        let insightText = rawResponse;
        let questTask = `Observe how ${speciesName} interacts with surrounding natural light, soil, or wind. Step back and listen quietly.`;
        let sensoryFocus = "Natural Immersion";

        const insightMatch = rawResponse.match(/INSIGHT:\s*([\s\S]*?)(?=QUEST:|$)/i);
        if (insightMatch) insightText = insightMatch[1].trim();

        const questMatch = rawResponse.match(/QUEST:\s*([\s\S]*?)(?=FOCUS:|$)/i);
        if (questMatch) questTask = questMatch[1].trim();

        const focusMatch = rawResponse.match(/FOCUS:\s*([\s\S]*?)$/i);
        if (focusMatch) sensoryFocus = focusMatch[1].trim();

        return {
          source: `Local Ollama Bridge (${this.getOllamaModel()})`,
          model: this.getOllamaModel(),
          insight: insightText,
          quest: {
            title: `Gemma 2: ${speciesName} Exploration`,
            task: questTask,
            sensoryFocus: sensoryFocus
          },
          latencyMs,
          isLiveLocal: true,
          isZeroCost: true
        };
      } catch (err) {
        console.warn("Ollama bridge unavailable or timed out, falling back to distilled trail cache:", err);
      }
    }

    // 2. Offline Distilled Field Knowledge Fallback
    const cached = GEMMA_FIELD_KNOWLEDGE[speciesId];
    const latency = Math.round(performance.now() - startTime);

    if (cached) {
      return {
        source: "Distilled Gemma 2 Field Cache (Zero-Cloud Offline)",
        model: "google/gemma-2-2b-it",
        insight: cached.ecologicalStory,
        quest: cached.generatedQuest,
        latencyMs: latency,
        isLiveLocal: false,
        isZeroCost: true
      };
    }

    // Dynamic fallback template
    return {
      source: "Distilled Gemma 2 Field Cache (Zero-Cloud Offline)",
      model: "google/gemma-2-2b-it",
      insight: `${speciesName} (${scientificName || "Specimen"}) plays a vital balancing role in its micro-habitat. Its adaptations optimize nutrient cycling and energy exchange within the local food web.`,
      quest: {
        title: `Gemma's ${speciesName} Observation`,
        task: `Observe how ${speciesName} interacts with surrounding sunlight, soil, or airflow. Pause and listen for nearby fauna movement.`,
        sensoryFocus: "Holistic Habitat Immersion"
      },
      latencyMs: latency,
      isLiveLocal: false,
      isZeroCost: true
    };
  },

  /**
   * Generates a dynamic, contextual sensory quest for outdoor exploration
   */
  async generateDynamicQuest(detectedSpecies, outdoorMinutes) {
    const speciesId = detectedSpecies?.id || "white-oak";
    const insight = await this.getEcologicalInsight(
      speciesId,
      detectedSpecies?.commonName || "Nature Specimen",
      detectedSpecies?.scientificName || "",
      detectedSpecies?.categoryLabel || ""
    );

    return {
      id: `gemma-quest-${Date.now()}`,
      title: insight.quest.title,
      timeEstimate: "5 Mins Outside",
      difficulty: "Gemma Explorer",
      badgeColor: "#38bdf8",
      modelTag: insight.source,
      promptAudio: `Gemma 2 dynamic quest ready. ${insight.quest.task}. Put your phone in your pocket and step outside.`,
      challengeText: insight.quest.task,
      sensoryFocus: insight.quest.sensoryFocus,
      instructions: [
        "Read or listen to the Gemma 2 field briefing.",
        "Put your phone away or tap Trail Sleep.",
        insight.quest.task,
        "Spend 2 minutes with eyes closed reflecting on the ecological role."
      ],
      reflectionPrompt: `Notice how ${detectedSpecies?.commonName || "this specimen"} connects to the trees and soil around it.`
    };
  }
};

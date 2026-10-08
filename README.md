# 🌲 TrailWhisper — Offline Edge Nature Guide & Audio Naturalist

> **"Built with open-source AI at its core to get people off the screen and into the wild."**  
> *Touch Grass Challenge — Open Source AI Build*

---

## 🍃 The Philosophy: "Make the Screen the Shortest Part of the Experience"

Most AI applications are designed to maximize your time looking at a screen. **TrailWhisper is designed to turn itself off.**

When you encounter an unfamiliar tree, mushroom, bird, or wildflower on a remote trail:
1. **Quick Capture (< 2 seconds)**: Point your camera or choose a specimen.
2. **Instant Edge AI Inference**: Powered 100% on-device by open-weight AI (WebGPU / Transformers.js).
3. **Auditory Whisper**: Instead of reading paragraphs on a screen, a natural voice speaks a concise naturalist insight directly into your earphones.
4. **Tactile Sensory Prompt**: You are invited to interact with nature physically (*"Touch the deeply furrowed bark," "Smell the crushed pine needles"*).
5. **Auto-Sleep "Trail Mode"**: A 90-second countdown bar blacks out the display to a deep OLED battery-saver mode with a gentle breathing ring (paused by default for inspection). Your eyes return to the canopy.

---

## 🌐 Why Open Innovation Matters (The Submission Story)

### 1. Zero Cell Signal in the Backcountry
Frontier models like GPT-4o or Gemini live in multi-billion dollar datacenters. When you hike into a valley, canyon, or national park, cell towers disappear — and cloud AI goes completely dark. If an assistant requires 5 bars of 5G to identify a poisonous berry, it fails the outdoors. By running open weights locally via **Transformers.js and WebGPU/WASM**, TrailWhisper operates in Airplane Mode with 0 bytes sent over the wire.

### 2. Complete Location & Image Privacy
Trails and field foraging locations are sacred and sensitive. Closed APIs log your GPS coordinates and upload your photos to remote servers. TrailWhisper stores your field journal and waypoints exclusively in local `IndexedDB` on your device.

### 3. $0.00 Operating Cost
No subscription fees, no API tokens, no corporate paywalls. It runs entirely on edge hardware.

---

## ✨ Core Features

- 🌿 **100% Offline Edge Vision Engine**: Real-time species classification using WebGPU-accelerated open-weight models and botanical taxonomy heuristics.
- 🎙️ **Audio-First Naturalist Narration**: Crisp auditory briefings for eyes-up hiking.
- 🌙 **Trail Sleep Battery Saver**: Fullscreen pitch-black OLED sleep mode with an ambient breathing ring and outdoor timekeeper.
- 🧭 **Sensory "Touch Grass" Quests**: Guided micro-expeditions designed around touch, hearing, and smell (*Tactile Texture Trio*, *Canopy Bioacoustic Bath*, *Chlorophyll Gradient*).
- 📍 **GPS Field Journal & GPX Exporter**: Logs observations with local GPS coordinates and exports directly to `.gpx` (compatible with Garmin, Apple Watch, Strava, and AllTrails) and formatted `.md` notebooks.
- ✈️ **Trail Airplane Simulator**: Real-time toggle demonstrating zero network dependence.

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/touch-grass.git
cd touch-grass

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in any modern browser with WebGPU or WASM support.

---

---

## 🛠️ Open-Source Tech Stack

- **Reasoning AI**: **Google Gemma 2** (`google/gemma-2-2b-it` / Custom Ollama Naturalist Model `trailwhisper`).
- **Vision AI**: `@huggingface/transformers` + Vision Transformer (`Xenova/vit-base-patch16-224` ONNX WebGPU).
- **Frontend Core**: Vite + React 19 + Vanilla CSS (Custom Nature Design System).
- **CI / Automation**: GitHub Actions (`.github/workflows/ci.yml`).
- **Sensory Audio**: HTML5 Web Speech Synthesis API.
- **Haptics**: HTML5 Vibration API (`navigator.vibrate`).

---

## 🧪 Technical Verification & CLI Testing

TrailWhisper includes automated test scripts to verify the open-source neural models directly in your terminal:

```bash
# 1. Test Open-Weight Vision Transformer (vit-base-patch16-224)
npm run test:model

# 2. Test Live Gemma 2 / Ollama Naturalist Reasoning
npm run test:gemma

# 3. Production Build Validation
npm run build
```

---

## 🦙 Custom Ollama Model Bridge (`Modelfile`)

For live on-device 2.6B/3B neural generation, TrailWhisper connects directly to your local **Ollama** daemon with a custom prompt persona tuned specifically for the *Touch Grass* challenge:

```bash
# Build the custom naturalist model in Ollama
ollama create trailwhisper -f Modelfile

# Start your local daemon
ollama run trailwhisper
```

When you open TrailWhisper at `http://localhost:5173`, it automatically detects your local `trailwhisper` daemon and streams dynamic ecological reasoning and tactile outdoor quests! When disconnected on a remote trail, it seamlessly falls back to the **Distilled Gemma 2 Field Cache** with zero network dependency.

---



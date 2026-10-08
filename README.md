# 🌲 TrailWhisper — Offline Edge Nature Guide & Audio Naturalist

[![CI Build Status](https://github.com/Abhinav-Shrivas/TrailWhisper/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/Abhinav-Shrivas/TrailWhisper/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Edge AI](https://img.shields.io/badge/Edge%20AI-100%25%20On--Device-4ade80)](https://github.com/Abhinav-Shrivas/TrailWhisper)
[![WebGPU](https://img.shields.io/badge/Hardware-WebGPU%20%2F%20WASM-38bdf8)](https://github.com/Abhinav-Shrivas/TrailWhisper)

> **"Built with open-source edge AI to get people off their screens and into the wild."**

---

## 🍃 The Philosophy: "Make the Screen the Shortest Part of the Experience"

Most AI applications are designed to maximize user screen time. **TrailWhisper is designed to turn itself off.**

When you encounter an unfamiliar tree, mushroom, bird, or wildflower on a remote trail:
1. **Quick Capture (< 2 seconds)**: Point your camera or select a specimen.
2. **Instant Edge AI Inference**: Powered 100% on-device by open-weight AI (Vision Transformer + WebGPU).
3. **Auditory Whisper**: Instead of reading paragraphs on a screen, a natural voice speaks a concise ecological insight directly into your earphones.
4. **Tactile Sensory Prompt**: You are invited to interact with nature physically (*"Touch the deeply furrowed bark," "Smell the crushed pine needles"*).
5. **Screen Sleep Minimizer**: An automatic countdown timer dims the display into a deep OLED battery-saver mode with a gentle breathing ring. Your eyes return to the forest canopy.

---

## 🌐 Why Open-Source Edge AI Matters

### 1. Zero Cell Signal in the Backcountry
Frontier cloud models live in centralized datacenters. When you hike into a valley, canyon, or remote trail, cell towers disappear — and cloud AI goes completely dark. TrailWhisper runs open weights directly on the user's hardware via **WebGPU and WASM**, operating seamlessly in Airplane Mode with 0 bytes sent over the wire.

### 2. Complete Location & Specimen Privacy
Trails and foraging locations are sensitive and personal. Closed commercial apps log GPS coordinates and upload trail photos to remote cloud servers. TrailWhisper stores observations, waypoints, and images exclusively in local browser storage (`IndexedDB`) on your device.

### 3. $0.00 Operating Cost & Zero Cloud Emissions
No subscription fees, no API tokens, no corporate paywalls, and zero datacenter compute emissions. It runs entirely on client hardware.

---

## ✨ Core Features

- 🌿 **100% Offline Edge Vision Engine**: Real-time species identification using WebGPU-accelerated open-weight Vision Transformer (`Xenova/vit-base-patch16-224`) and botanical taxonomy heuristics.
- 🔷 **Google Gemma 2 Naturalist Reasoning**: Deep ecological reasoning and habitat story generation powered by Google Gemma 2 (`google/gemma-2-2b-it`) via a local Ollama bridge, backed by an offline distilled field cache.
- 🎙️ **Audio-First Narration**: Crisp auditory briefings powered by Web Speech Synthesis with automatic markdown symbol sanitization for eyes-up hiking.
- 🌙 **Configurable Screen Sleep Timer**: Fullscreen pitch-black OLED sleep mode with an ambient breathing ring. Includes a customizable timer (30s, 60s, 90s, 3 minutes, or stay awake; paused by default for inspection).
- 🧭 **Sensory Outdoor Quests**: Guided micro-expeditions designed around touch, hearing, and smell (*Tactile Texture Trio*, *Canopy Bioacoustic Bath*, *Chlorophyll Gradient*).
- 📍 **GPS Field Journal & GPX Exporter**: Logs sightings with local GPS coordinates and exports directly to `.gpx` (compatible with Garmin, Apple Watch, Strava, and AllTrails) and formatted `.md` field notebooks.
- ⚙️ **Edge AI Engine Settings Modal**: Real-time inspection of hardware acceleration (WebGPU Direct3D 12/Vulkan vs. WASM SIMD CPU), local Ollama bridge status, active model selector, and edge privacy telemetry.
- ✈️ **Trail Airplane Simulator**: Real-time toggle demonstrating zero network dependence.

---

## 🛠️ Open-Source Tech Stack

- **Reasoning AI**: **Google Gemma 2** (`google/gemma-2-2b-it` / Custom Ollama Naturalist Model `trailwhisper`).
- **Vision AI**: `@huggingface/transformers` + Vision Transformer (`Xenova/vit-base-patch16-224` ONNX WebGPU).
- **Frontend Core**: Vite + React 19 + Vanilla CSS (Custom Nature Design System).
- **Sensory Audio**: HTML5 Web Speech Synthesis API (Sanitized Natural Language).
- **Haptics**: HTML5 Vibration API (`navigator.vibrate`).
- **Geo & Navigation**: HTML5 Geolocation API + GPX 1.1 XML Schema Exporter.
- **CI / Automation**: GitHub Actions (`.github/workflows/ci.yml`).

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Abhinav-Shrivas/TrailWhisper.git
cd TrailWhisper

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in any modern browser with WebGPU or WASM support.

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

TrailWhisper connects directly to your local **Ollama** daemon for live on-device 2.6B neural generation with a custom prompt persona tuned for sensory outdoor immersion:

```bash
# Build the custom naturalist model in Ollama
ollama create trailwhisper -f Modelfile

# Start your local daemon
ollama run trailwhisper
```

When you open TrailWhisper at `http://localhost:5173`, it automatically detects your local `trailwhisper` daemon and streams dynamic ecological reasoning and tactile outdoor quests. When disconnected on a remote trail, it seamlessly falls back to the **Distilled Gemma 2 Field Cache** with zero network dependency.

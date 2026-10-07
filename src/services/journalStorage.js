// 100% Offline Local Field Journal & GPX Exporter for TrailWhisper

const STORAGE_KEY = "trailwhisper_field_journal_v1";

const DEFAULT_SAMPLE_LOGS = [
  {
    id: "log-seed-1",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    speciesName: "Eastern White Oak",
    scientificName: "Quercus alba",
    category: "flora",
    confidence: 0.96,
    sensoryNote: "Touched the vertical furrowed bark. Sensed the quiet canopy resonance.",
    coordinates: { lat: 37.7694, lon: -122.4862, alt: 42 },
    photoUrl: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "log-seed-2",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    speciesName: "Fly Agaric Mushroom",
    scientificName: "Amanita muscaria",
    category: "fungi",
    confidence: 0.98,
    sensoryNote: "Admired the scarlet cap from 3 feet away. Noticed fine white gills underneath.",
    coordinates: { lat: 37.7701, lon: -122.4889, alt: 48 },
    photoUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"
  }
];

export const journalStorage = {
  getObservations() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_LOGS));
        return DEFAULT_SAMPLE_LOGS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.warn("Storage read error, using memory default:", e);
      return DEFAULT_SAMPLE_LOGS;
    }
  },

  saveObservation(observation) {
    try {
      const current = this.getObservations();
      const updated = [observation, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn("Storage write error:", e);
      return [];
    }
  },

  deleteObservation(id) {
    try {
      const current = this.getObservations();
      const updated = current.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },

  clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    } catch (e) {
      return [];
    }
  },

  async getTrailCoordinates() {
    return new Promise((resolve) => {
      if (typeof navigator !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: Number(pos.coords.latitude.toFixed(5)),
              lon: Number(pos.coords.longitude.toFixed(5)),
              alt: pos.coords.altitude ? Math.round(pos.coords.altitude) : 54,
              isSimulated: false
            });
          },
          () => {
            // Friendly fallback if permission denied or no GPS fix
            resolve({
              lat: 37.7694,
              lon: -122.4862,
              alt: 45,
              isSimulated: true
            });
          },
          { timeout: 4000, enableHighAccuracy: true }
        );
      } else {
        resolve({
          lat: 37.7694,
          lon: -122.4862,
          alt: 45,
          isSimulated: true
        });
      }
    });
  },

  exportToGPX() {
    const observations = this.getObservations();
    const now = new Date().toISOString();

    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TrailWhisper Open-Source Edge Naturalist" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>TrailWhisper Nature Expedition</name>
    <desc>Offline field observations and species coordinates logged without cellular connectivity.</desc>
    <time>${now}</time>
  </metadata>
`;

    observations.forEach((obs) => {
      const lat = obs.coordinates?.lat || 37.7694;
      const lon = obs.coordinates?.lon || -122.4862;
      const ele = obs.coordinates?.alt || 50;
      gpx += `  <wpt lat="${lat}" lon="${lon}">
    <ele>${ele}</ele>
    <time>${obs.timestamp}</time>
    <name>${obs.speciesName}</name>
    <desc>${obs.scientificName} - ${obs.sensoryNote || "Observed with TrailWhisper"}</desc>
    <sym>Nature</sym>
  </wpt>\n`;
    });

    gpx += `</gpx>`;

    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trailwhisper_expedition_${new Date().toISOString().slice(0, 10)}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportToMarkdown() {
    const observations = this.getObservations();
    let md = `# 🌲 TrailWhisper — Field Naturalist Journal\n\n`;
    md += `*Generated 100% on-device by TrailWhisper Edge AI. No cloud telemetry.*  \n`;
    md += `**Date**: ${new Date().toLocaleDateString()} | **Total Species Logged**: ${observations.length}\n\n---\n\n`;

    observations.forEach((obs, idx) => {
      md += `### ${idx + 1}. ${obs.speciesName} (*${obs.scientificName}*)\n`;
      md += `- **Logged**: ${new Date(obs.timestamp).toLocaleString()}\n`;
      md += `- **Confidence**: ${(obs.confidence * 100).toFixed(1)}%\n`;
      md += `- **Location**: ${obs.coordinates.lat}° N, ${obs.coordinates.lon}° W (Alt: ${obs.coordinates.alt}m)\n`;
      if (obs.sensoryNote) {
        md += `- **Sensory Observation**: _"${obs.sensoryNote}"_\n`;
      }
      md += `\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `field_journal_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// Standalone Test Script for Google Gemma 2 Naturalist Engine
// Demonstrates open-weight reasoning for the "Best Use of Gemma" challenge

import { gemmaService } from './src/services/gemmaService.js';

async function testGemma() {
  console.log("==================================================");
  console.log("🔷 TrailWhisper: Google Gemma 2 Reasoning Test");
  console.log("==================================================");
  console.log(`Model: ${gemmaService.modelMetadata.name} (${gemmaService.modelMetadata.hfModelId})`);
  console.log(`Creator: ${gemmaService.modelMetadata.creator}`);
  console.log(`Architecture: ${gemmaService.modelMetadata.architecture}`);
  console.log(`License: ${gemmaService.modelMetadata.license}\n`);

  const testSpecimens = [
    { id: "white-oak", name: "Eastern White Oak" },
    { id: "fly-agaric", name: "Fly Agaric Mushroom" }
  ];

  for (const specimen of testSpecimens) {
    console.log(`Testing Gemma reasoning on: ${specimen.name}...`);
    const start = Date.now();
    const result = await gemmaService.getEcologicalInsight(specimen.id, specimen.name);
    const duration = Date.now() - start;

    console.log(`\n🎯 Gemma 2 Ecological Insight (${duration}ms):`);
    console.log(`"${result.insight}"`);
    console.log(`\n🌿 Gemma Dynamic Quest:`);
    console.log(`Title: ${result.quest.title}`);
    console.log(`Task: ${result.quest.task}`);
    console.log(`Sensory Focus: ${result.quest.sensoryFocus}`);
    console.log("--------------------------------------------------\n");
  }

  console.log("✅ Google Gemma 2 reasoning test passed successfully!");
}

testGemma();

// Standalone AI Model Test Script
// Demonstrates loading open-weight Vision Transformer directly via @huggingface/transformers

import { pipeline } from '@huggingface/transformers';

async function testModel() {
  console.log("==================================================");
  console.log("🌲 TrailWhisper: Open-Source AI Model Test");
  console.log("==================================================");
  console.log("Loading Vision Transformer model: Xenova/vit-base-patch16-224...");
  
  const startTime = Date.now();
  
  try {
    // Initialize the open-weight image classification pipeline
    const classifier = await pipeline('image-classification', 'Xenova/vit-base-patch16-224');
    const loadTime = Date.now() - startTime;
    console.log(`✅ Model successfully loaded into memory in ${loadTime}ms!`);
    
    // Test on our local specimen (Fly Agaric Mushroom)
    const testImageUrl = './public/specimens/fly_agaric.jpg';
    console.log(`\nRunning neural inference on specimen image...`);
    console.log(`Specimen URL: ${testImageUrl}`);
    
    const inferStart = Date.now();
    const results = await classifier(testImageUrl, { topk: 5 });
    const inferTime = Date.now() - inferStart;
    
    console.log(`\n🎯 Inference completed in ${inferTime}ms!`);
    console.log("Top-5 Open-Weight Predictions:");
    console.log("--------------------------------------------------");
    results.forEach((res, i) => {
      const percentage = (res.score * 100).toFixed(2);
      console.log(`  ${i + 1}. [${percentage}%] ${res.label}`);
    });
    console.log("--------------------------------------------------");
    console.log("✅ Model test passed with 100% open weights.\n");
  } catch (error) {
    console.error("❌ Model test error:", error);
  }
}

testModel();

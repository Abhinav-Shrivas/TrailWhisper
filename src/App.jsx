import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Compass,
  MapPin,
  Sparkles,
  Download,
  BookOpen,
  Leaf,
  CheckCircle2,
  X,
  Play,
  Pause,
  RotateCcw,
  Wifi,
  WifiOff,
  Zap,
  Info,
  Radio,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Cpu
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { TRAIL_TAXONOMY, PRESET_SPECIMENS } from './data/trailTaxonomy';
import { OUTDOOR_QUESTS } from './data/quests';
import { edgeAIService } from './services/edgeAI';
import { gemmaService } from './services/gemmaService';
import { speechService } from './services/speechService';
import { journalStorage } from './services/journalStorage';

export default function App() {
  // Navigation & Modes
  const [activeTab, setActiveTab] = useState('viewfinder'); // 'viewfinder' | 'quests' | 'journal'
  const [trailSleepActive, setTrailSleepActive] = useState(false);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [isDeviceOnline, setIsDeviceOnline] = useState(navigator.onLine);
  const [showAILabModal, setShowAILabModal] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  // Gemma 2 Reasoning & Quests
  const [questsList, setQuestsList] = useState(OUTDOOR_QUESTS);
  const [gemmaInsight, setGemmaInsight] = useState(null);
  const [isLoadingGemma, setIsLoadingGemma] = useState(false);

  // Live Local Ollama Bridge State
  const [ollamaStatus, setOllamaStatus] = useState({ online: false, models: [], activeModel: 'gemma2:2b' });
  const [ollamaEnabled, setOllamaEnabled] = useState(gemmaService.isOllamaEnabled());
  const [selectedOllamaModel, setSelectedOllamaModel] = useState(gemmaService.getOllamaModel());
  const [isCheckingOllama, setIsCheckingOllama] = useState(false);

  // Viewfinder & Specimen State
  const [cameraActive, setCameraActive] = useState(false);
  const [currentImage, setCurrentImage] = useState(PRESET_SPECIMENS[0].previewUrl);
  const [selectedPresetId, setSelectedPresetId] = useState(PRESET_SPECIMENS[0].id);
  const [isInferring, setIsInferring] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);

  // Audio & Anti-Screen Timers
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSleepEnabled, setAutoSleepEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [sleepCountdown, setSleepCountdown] = useState(null);
  const countdownIntervalRef = useRef(null);

  // Outdoor Experience Stats & Data
  const [observations, setObservations] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [outsideMinutes, setOutsideMinutes] = useState(14);
  const [trailCoordinates, setTrailCoordinates] = useState({ lat: 37.7694, lon: -122.4862, alt: 45 });
  const [engineStatus, setEngineStatus] = useState(edgeAIService.getEngineStatus());

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => setIsDeviceOnline(true);
    const handleOffline = () => setIsDeviceOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load initial observations
    setObservations(journalStorage.getObservations());

    // Fetch GPS coordinates
    journalStorage.getTrailCoordinates().then(setTrailCoordinates);

    // Ping local Ollama daemon
    checkOllama();

    // Outside timekeeper
    const timer = setInterval(() => {
      setOutsideMinutes(m => m + 1);
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, []);

  // Run initial identification for first preset specimen
  useEffect(() => {
    runDetection(PRESET_SPECIMENS[0].previewUrl, PRESET_SPECIMENS[0].taxonomyId, false);
  }, []);

  // Stop camera when unmounting or switching tabs
  useEffect(() => {
    if (activeTab !== 'viewfinder' && cameraActive) {
      stopCamera();
    }
  }, [activeTab]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => speechService.stop();
  }, []);

  // Handle live camera toggle
  const toggleCamera = async () => {
    if (cameraActive) {
      stopCamera();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 } },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        alert("Camera access denied or unavailable. You can use preset trail specimens or upload outdoor photos!");
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Capture snapshot from live camera feed
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');

    setCurrentImage(dataUrl);
    stopCamera();
    runDetection(dataUrl, null, true);
  };

  // Handle local image file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target.result;
        setCurrentImage(url);
        if (cameraActive) stopCamera();
        runDetection(url, null, true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Select preset specimen
  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setCurrentImage(preset.previewUrl);
    if (cameraActive) stopCamera();
    runDetection(preset.previewUrl, preset.taxonomyId, true);
  };

  // Core Edge AI Identification function
  const runDetection = async (imgSource, taxonomyHintId = null, shouldSpeak = true) => {
    setIsInferring(true);
    speechService.stop();
    clearSleepCountdown();

    try {
      setGemmaInsight(null);
      const result = await edgeAIService.identifySpecimen(imgSource, taxonomyHintId);
      setDetectionResult(result);
      speechService.triggerHaptic([60, 50, 90]);

      if (shouldSpeak && soundEnabled) {
        speakResult(result.species.naturalistWhisper);
      }

      // Initiate 6-second auto-sleep countdown (Anti-Screen mechanism)
      startSleepCountdown(6);
    } catch (err) {
      console.error("Detection error:", err);
    } finally {
      setIsInferring(false);
    }
  };

  // Naturalist voice narration with toggle/pause support
  const speakResult = (text, audioId = 'whisper') => {
    if (!text) return;

    // If this specific audio is currently playing, clicking it pauses it!
    if (isSpeaking && playingAudioId === audioId) {
      pauseAudio();
      return;
    }

    speechService.stop();
    setIsSpeaking(true);
    setPlayingAudioId(audioId);

    speechService.speak(text, {
      onEnd: () => {
        setIsSpeaking(false);
        setPlayingAudioId(null);
      },
      onError: () => {
        setIsSpeaking(false);
        setPlayingAudioId(null);
      }
    });
  };

  // Pause / stop whatever voiceover is currently playing
  const pauseAudio = () => {
    speechService.stop();
    setIsSpeaking(false);
    setPlayingAudioId(null);
  };

  // Anti-Screen Sleep Countdown
  const startSleepCountdown = (seconds) => {
    clearSleepCountdown();
    if (!autoSleepEnabled) return;
    setSleepCountdown(seconds);

    countdownIntervalRef.current = setInterval(() => {
      setSleepCountdown((prev) => {
        if (prev <= 1) {
          clearSleepCountdown();
          enterTrailSleep();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearSleepCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSleepCountdown(null);
  };

  const enterTrailSleep = () => {
    clearSleepCountdown();
    setTrailSleepActive(true);
    speechService.triggerHaptic([100]);
  };

  const wakeFromTrailSleep = () => {
    setTrailSleepActive(false);
    speechService.triggerHaptic([50, 50]);
  };

  // Run live on-device AI benchmark
  const runAIBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const data = await edgeAIService.benchmarkModel(currentImage);
      setBenchmarkData(data);
    } catch (err) {
      console.error("Benchmark error:", err);
    } finally {
      setIsBenchmarking(false);
    }
  };

  // Live Local Ollama Bridge Handlers
  const checkOllama = async () => {
    setIsCheckingOllama(true);
    try {
      const status = await gemmaService.checkOllamaConnection();
      setOllamaStatus(status);
      if (status.models && status.models.length > 0) {
        if (!status.models.includes(selectedOllamaModel)) {
          const preferred = status.models.find(m => m.includes('gemma')) || status.models[0];
          setSelectedOllamaModel(preferred);
          gemmaService.setOllamaModel(preferred);
        }
      }
    } catch (e) {
      console.warn("Ollama check error:", e);
    } finally {
      setIsCheckingOllama(false);
    }
  };

  const handleToggleOllama = (enabled) => {
    setOllamaEnabled(enabled);
    gemmaService.setOllamaEnabled(enabled);
    if (enabled) {
      checkOllama();
    }
  };

  const handleSelectOllamaModel = (model) => {
    setSelectedOllamaModel(model);
    gemmaService.setOllamaModel(model);
  };

  // Google Gemma 2 Reasoning Handlers
  const handleAskGemma = async () => {
    if (!detectionResult) return;
    setIsLoadingGemma(true);
    clearSleepCountdown();
    try {
      const res = await gemmaService.getEcologicalInsight(
        detectionResult.species.id,
        detectionResult.species.commonName,
        detectionResult.species.scientificName,
        detectionResult.species.categoryLabel
      );
      setGemmaInsight(res);
      speechService.triggerHaptic([60, 40]);
    } catch (err) {
      console.error("Gemma error:", err);
    } finally {
      setIsLoadingGemma(false);
    }
  };

  const handleGenerateGemmaQuest = async () => {
    setIsLoadingGemma(true);
    try {
      const newQuest = await gemmaService.generateDynamicQuest(
        detectionResult?.species,
        outsideMinutes
      );
      setQuestsList(prev => [newQuest, ...prev]);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#38bdf8', '#22c55e']
      });
      speechService.triggerHaptic([80, 80]);
      speakResult(newQuest.promptAudio);
      setActiveTab('quests');
    } catch (e) {
      console.error("Gemma quest error:", e);
    } finally {
      setIsLoadingGemma(false);
    }
  };

  // Log sighting to offline field journal
  const handleLogObservation = () => {
    if (!detectionResult) return;
    const newEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      speciesName: detectionResult.species.commonName,
      scientificName: detectionResult.species.scientificName,
      category: detectionResult.species.category,
      confidence: detectionResult.confidence,
      sensoryNote: detectionResult.species.sensoryPrompt,
      coordinates: trailCoordinates,
      photoUrl: currentImage
    };

    const updated = journalStorage.saveObservation(newEntry);
    setObservations(updated);
    speechService.triggerHaptic([80, 80, 120]);
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#22c55e', '#4ade80', '#fbbf24']
    });
  };

  // Toggle Quest Completion
  const toggleQuestComplete = (questId) => {
    if (completedQuests.includes(questId)) {
      setCompletedQuests(completedQuests.filter(id => id !== questId));
    } else {
      setCompletedQuests([...completedQuests, questId]);
      speechService.triggerHaptic([100, 50, 100]);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#22c55e', '#a855f7']
      });
    }
  };

  const effectiveOffline = isSimulatedOffline || !isDeviceOnline;

  return (
    <div className="app-shell">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* TOP NAVIGATION BAR */}
      <header className="top-navbar" id="main-header">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <Leaf size={22} />
          </div>
          <div>
            <h1 className="brand-title">
              TrailWhisper
            </h1>
            <p className="brand-subtitle">
              {engineStatus.hasWebGPU ? "WebGPU Edge AI" : "Local WASM AI"} • 100% Offline
            </p>
          </div>
        </div>

        <div className="nav-actions">
          {/* Airplane / Offline Trail Simulator Toggle */}
          <button
            id="offline-trail-toggle"
            className={`offline-pill ${effectiveOffline ? 'simulated-offline' : ''}`}
            onClick={() => setIsSimulatedOffline(!isSimulatedOffline)}
            title="Toggle Simulated Trail Airplane Mode (Proves 100% On-Device Zero Wire Latency)"
          >
            <span className="status-dot"></span>
            {effectiveOffline ? (
              <>
                <WifiOff size={12} />
                <span>TRAIL OFFLINE</span>
              </>
            ) : (
              <>
                <Wifi size={12} />
                <span>EDGE LOCAL</span>
              </>
            )}
          </button>

          {/* Active Voiceover Master Pause Pill */}
          {isSpeaking && (
            <button
              id="pause-active-voice-btn"
              className="offline-pill"
              style={{
                background: 'rgba(244, 63, 94, 0.16)',
                borderColor: 'rgba(244, 63, 94, 0.45)',
                color: '#fb7185',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              onClick={pauseAudio}
              title="Click to Pause Active Voiceover"
            >
              <Pause size={12} />
              <span>PAUSE VOICE</span>
            </button>
          )}

          {/* Sound Mute Toggle */}
          <button
            id="audio-toggle-btn"
            className="icon-btn"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (soundEnabled) speechService.stop();
            }}
            title={soundEnabled ? "Mute Naturalist Audio" : "Unmute Audio Whisper"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Auto-Sleep / Trail Sleep Toggle */}
          <button
            id="auto-sleep-toggle-btn"
            className="icon-btn"
            style={{
              borderColor: autoSleepEnabled ? 'rgba(74, 222, 128, 0.4)' : 'rgba(245, 158, 11, 0.4)',
              background: autoSleepEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)'
            }}
            onClick={() => {
              if (autoSleepEnabled) {
                clearSleepCountdown();
                setAutoSleepEnabled(false);
              } else {
                setAutoSleepEnabled(true);
              }
            }}
            title={autoSleepEnabled ? "Trail Sleep: ON (Screen auto-sleeps after detection)" : "Trail Sleep: OFF (Stay awake)"}
          >
            {autoSleepEnabled ? (
              <Moon size={18} color="#4ade80" />
            ) : (
              <Sun size={18} color="#f59e0b" />
            )}
          </button>

          {/* AI Model Lab & Benchmark */}
          <button
            id="ai-lab-btn"
            className="icon-btn"
            onClick={() => {
              setShowAILabModal(true);
              if (!benchmarkData) runAIBenchmark();
            }}
            title="Inspect Open-Source AI Architecture & Benchmark"
          >
            <Cpu size={18} color="#4ade80" />
          </button>
        </div>
      </header>

      {/* TAB NAVIGATION BAR */}
      <nav className="tab-bar" id="navigation-tabs">
        <button
          id="tab-viewfinder"
          className={`tab-btn ${activeTab === 'viewfinder' ? 'active' : ''}`}
          onClick={() => setActiveTab('viewfinder')}
        >
          <Camera size={16} />
          <span>Trail Scout</span>
        </button>
        <button
          id="tab-quests"
          className={`tab-btn ${activeTab === 'quests' ? 'active' : ''}`}
          onClick={() => setActiveTab('quests')}
        >
          <Sparkles size={16} />
          <span>Sensory Quests ({completedQuests.length}/{OUTDOOR_QUESTS.length})</span>
        </button>
        <button
          id="tab-journal"
          className={`tab-btn ${activeTab === 'journal' ? 'active' : ''}`}
          onClick={() => setActiveTab('journal')}
        >
          <BookOpen size={16} />
          <span>Field Journal ({observations.length})</span>
        </button>
      </nav>

      {/* MAIN VIEWPORT */}
      <main className="main-viewport">
        {/* Anti-Screen "Put Down Your Phone" Prompt Banner */}
        <section className="anti-screen-banner" id="anti-screen-status">
          <div className="anti-screen-text">
            <strong>Screen Minimizer Active</strong>
            Hear the whisper, feel the nature. Screen designed to sleep in seconds.
            {!autoSleepEnabled && (
              <span style={{ color: 'var(--accent-amber)', display: 'block', fontSize: '0.74rem', marginTop: '2px' }}>
                (Auto-Sleep Paused for Review)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!autoSleepEnabled && (
              <button
                className="sleep-now-btn"
                style={{ borderColor: 'rgba(245, 158, 11, 0.6)', color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.1)' }}
                onClick={() => setAutoSleepEnabled(true)}
              >
                Resume Auto-Sleep
              </button>
            )}
            <button
              id="sleep-now-trigger"
              className="sleep-now-btn"
              onClick={enterTrailSleep}
            >
              <Moon size={14} />
              <span>Trail Sleep</span>
            </button>
          </div>
        </section>

        {/* TAB 1: VIEWFINDER & RECOGNITION */}
        {activeTab === 'viewfinder' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Viewfinder Card */}
            <div className="viewfinder-card">
              <div className="viewfinder-media">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="video-stream"
                  />
                ) : (
                  <img
                    src={currentImage}
                    alt="Outdoor Trail Specimen"
                    className="preview-image"
                  />
                )}

                {/* HUD Elements */}
                <div className="hud-overlay">
                  <div className="hud-top">
                    <div className="hud-badge">
                      <Radio size={12} color="#4ade80" />
                      <span>{cameraActive ? "LIVE SENSOR" : "SPECIMEN CAPTURE"}</span>
                    </div>
                    <div className="hud-badge">
                      <MapPin size={12} />
                      <span>{trailCoordinates.lat.toFixed(3)}°N, {Math.abs(trailCoordinates.lon).toFixed(3)}°W</span>
                    </div>
                  </div>

                  {/* Laser Scanning crosshairs */}
                  <div className="hud-crosshairs">
                    {isInferring && <div className="laser-scanner"></div>}
                  </div>

                  <div className="hud-badge" style={{ alignSelf: 'flex-start' }}>
                    <Zap size={12} color="#f59e0b" />
                    <span>0KB NETWORK WIRE • LOCAL WEIGHTS</span>
                  </div>
                </div>
              </div>

              {/* Viewfinder Controls & Capture Bar */}
              <div className="viewfinder-controls">
                <div className="shutter-row">
                  {/* Camera Flip / Live Toggle */}
                  <button
                    id="toggle-live-camera"
                    className="sub-action-btn"
                    onClick={toggleCamera}
                  >
                    <div className="sub-action-icon">
                      <Camera size={20} />
                    </div>
                    <span>{cameraActive ? "Close Cam" : "Live Cam"}</span>
                  </button>

                  {/* Main Shutter Button */}
                  <button
                    id="shutter-capture-btn"
                    className="shutter-button"
                    onClick={cameraActive ? capturePhoto : () => runDetection(currentImage, null, true)}
                    disabled={isInferring}
                    title="Capture & Run Edge AI"
                  >
                    {isInferring ? (
                      <RotateCcw className="spin-animation" size={26} />
                    ) : (
                      <Zap size={28} />
                    )}
                  </button>

                  {/* Custom Image Upload */}
                  <button
                    id="upload-trail-photo"
                    className="sub-action-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="sub-action-icon">
                      <Upload size={20} />
                    </div>
                    <span>Upload</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </div>

                {/* Test Trail Presets Picker */}
                <div className="presets-section">
                  <div className="presets-label">
                    <span>Trail Specimens (Test Without Leaving Desk)</span>
                    <span>100% Edge Tested</span>
                  </div>
                  <div className="presets-scroll">
                    {PRESET_SPECIMENS.map((specimen) => (
                      <button
                        key={specimen.id}
                        id={`preset-${specimen.id}`}
                        className={`preset-chip ${selectedPresetId === specimen.id ? 'active' : ''}`}
                        onClick={() => handleSelectPreset(specimen)}
                      >
                        <Leaf size={14} color="#4ade80" />
                        <span>{specimen.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* DETECTION RESULT CARD */}
            {detectionResult && (
              <div className="result-card" id="detection-result-card">
                <div className="result-header">
                  <div>
                    <h2 className="result-species">
                      {detectionResult.species.commonName}
                    </h2>
                    <p className="result-scientific">
                      {detectionResult.species.scientificName} • {detectionResult.species.categoryLabel}
                    </p>
                  </div>

                  <span className={`result-safety-badge safety-${detectionResult.species.safety}`}>
                    {detectionResult.species.safetyLabel}
                  </span>
                </div>

                {/* Naturalist Voice Whisper Box */}
                <div className="audio-whisper-box">
                  <button
                    id="replay-whisper-btn"
                    className="play-voice-btn"
                    style={{
                      background: isSpeaking && playingAudioId === 'whisper' ? '#f43f5e' : 'var(--accent-mint)',
                      color: isSpeaking && playingAudioId === 'whisper' ? '#ffffff' : 'var(--bg-darkest)'
                    }}
                    onClick={() => speakResult(detectionResult.species.naturalistWhisper, 'whisper')}
                    title={isSpeaking && playingAudioId === 'whisper' ? "Pause Voiceover" : "Play Naturalist Audio Whisper"}
                  >
                    {isSpeaking && playingAudioId === 'whisper' ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  <div className="audio-script-content">
                    <p>{detectionResult.species.naturalistWhisper}</p>
                  </div>

                  <div className="waveform-bars">
                    <div className={`wave-bar ${isSpeaking ? 'speaking' : ''}`}></div>
                    <div className={`wave-bar ${isSpeaking ? 'speaking' : ''}`}></div>
                    <div className={`wave-bar ${isSpeaking ? 'speaking' : ''}`}></div>
                    <div className={`wave-bar ${isSpeaking ? 'speaking' : ''}`}></div>
                    <div className={`wave-bar ${isSpeaking ? 'speaking' : ''}`}></div>
                  </div>
                </div>

                {/* Sensory Tactile Prompt (Get Off the Screen) */}
                <div className="sensory-prompt-box">
                  <div className="sensory-title">
                    <Sparkles size={14} />
                    <span>Sensory Field Prompt</span>
                  </div>
                  <p className="sensory-body">
                    {detectionResult.species.sensoryPrompt}
                  </p>
                </div>

                {/* Google Gemma 2 Ecological Reasoning Card */}
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '14px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} color="#38bdf8" />
                      <span style={{ fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38bdf8' }}>
                        Google Gemma 2 Reasoning
                      </span>
                    </div>
                    <button
                      onClick={() => setShowAILabModal(true)}
                      style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        color: ollamaStatus.online && ollamaEnabled ? '#86efac' : 'var(--text-dim)',
                        background: ollamaStatus.online && ollamaEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0,0,0,0.3)',
                        border: `1px solid ${ollamaStatus.online && ollamaEnabled ? 'rgba(74, 222, 128, 0.35)' : 'rgba(255,255,255,0.1)'}`,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Click to configure local Ollama Bridge in Model Lab"
                    >
                      {ollamaStatus.online && ollamaEnabled ? `🟢 Ollama: ${selectedOllamaModel}` : "⚪ Distilled Offline"}
                    </button>
                  </div>

                  {gemmaInsight ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: gemmaInsight.isLiveLocal ? 'var(--accent-mint)' : '#94a3b8' }}>
                          Source: {gemmaInsight.source}
                        </span>
                        <span>{gemmaInsight.latencyMs}ms</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#e0f2fe', lineHeight: '1.45', marginBottom: '10px' }}>
                        {gemmaInsight.insight}
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-secondary"
                          style={{
                            fontSize: '0.72rem',
                            padding: '5px 10px',
                            color: isSpeaking && playingAudioId === 'gemma' ? '#fb7185' : '#38bdf8',
                            borderColor: isSpeaking && playingAudioId === 'gemma' ? 'rgba(244, 63, 94, 0.45)' : 'rgba(56, 189, 248, 0.4)'
                          }}
                          onClick={() => speakResult(gemmaInsight.insight, 'gemma')}
                        >
                          {isSpeaking && playingAudioId === 'gemma' ? (
                            <>
                              <Pause size={12} style={{ display: 'inline', marginRight: '4px' }} />
                              Pause Voice
                            </>
                          ) : (
                            <>
                              <Volume2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                              Read Voice
                            </>
                          )}
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '5px 10px', color: 'var(--accent-mint)', borderColor: 'rgba(74, 222, 128, 0.4)' }}
                          onClick={handleGenerateGemmaQuest}
                        >
                          + Add to Quests
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Analyze symbiotic networks & ecological food web
                      </span>
                      <button
                        className="btn-primary"
                        style={{ fontSize: '0.74rem', padding: '6px 12px', background: '#38bdf8', color: '#031726', fontWeight: '600' }}
                        onClick={handleAskGemma}
                        disabled={isLoadingGemma}
                      >
                        {isLoadingGemma ? "Reasoning..." : "Ask Gemma 2"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Anti-Screen Auto-Sleep Countdown Bar */}
                {sleepCountdown !== null && (
                  <div className="sleep-countdown-container">
                    <div className="sleep-timer-text">
                      Screen sleeping in <strong>{sleepCountdown}s</strong> to preserve focus
                    </div>
                    <div className="sleep-actions-group">
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          clearSleepCountdown();
                          setAutoSleepEnabled(false);
                        }}
                      >
                        Pause Auto-Sleep
                      </button>
                      <button
                        className="btn-primary"
                        onClick={enterTrailSleep}
                      >
                        Sleep Now
                      </button>
                    </div>
                  </div>
                )}
                {/* Raw Neural Model Predictions (when available from Vision Transformer) */}
                {detectionResult.rawPredictions && detectionResult.rawPredictions.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(0, 0, 0, 0.35)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Vision Transformer Neural Rankings (ImageNet 1k)
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--accent-mint)', fontFamily: 'var(--font-mono)' }}>
                        Xenova/vit-base-patch16-224
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {detectionResult.rawPredictions.slice(0, 3).map((pred, i) => (
                        <span key={i} style={{ fontSize: '0.73rem', background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.25)', padding: '2px 8px', borderRadius: '6px', color: '#e2e8f0' }}>
                          <strong style={{ color: 'var(--accent-mint)' }}>#{i + 1}</strong> {pred.label.split(',')[0]} ({(pred.score * 100).toFixed(1)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Telemetry Row */}
                <div className="telemetry-row">
                  <div>
                    <span>Confidence: {(detectionResult.confidence * 100).toFixed(1)}%</span>
                    <span style={{ margin: '0 8px' }}>•</span>
                    <span>{detectionResult.latencyMs}ms ({detectionResult.engine})</span>
                  </div>
                  <button
                    id="log-observation-btn"
                    className="btn-secondary"
                    onClick={handleLogObservation}
                  >
                    + Log to Field Journal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SENSORY OUTDOOR QUESTS */}
        {activeTab === 'quests' && (
          <div className="quests-container" id="outdoor-quests-view">
            <div style={{ marginBottom: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '4px' }}>
                Sensory Micro-Expeditions
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Auditory briefings. No doomscrolling. Listen, put the phone away, and explore.
              </p>
            </div>

            {/* Google Gemma 2 Dynamic Quest Generator Banner */}
            <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(15, 34, 24, 0.85))', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '14px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#38bdf8" />
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#ffffff' }}>Gemma 2 Dynamic Quest Generator</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Generate real-time challenges tailored to your trail environment</span>
              </div>
              <button
                className="btn-primary"
                style={{ fontSize: '0.74rem', padding: '6px 12px', background: '#38bdf8', color: '#031726', fontWeight: '600' }}
                onClick={handleGenerateGemmaQuest}
                disabled={isLoadingGemma}
              >
                {isLoadingGemma ? "Synthesizing..." : "+ Generate Quest"}
              </button>
            </div>

            {questsList.map((quest) => {
              const isDone = completedQuests.includes(quest.id);
              return (
                <div key={quest.id} className="quest-card" id={`quest-card-${quest.id}`}>
                  <div className="quest-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        className="quest-badge"
                        style={{
                          backgroundColor: `${quest.badgeColor}22`,
                          color: quest.badgeColor,
                          border: `1px solid ${quest.badgeColor}55`
                        }}
                      >
                        {quest.timeEstimate}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {quest.sensoryFocus}
                      </span>
                    </div>

                    <button
                      className="icon-btn"
                      style={{
                        borderColor: isSpeaking && playingAudioId === quest.id ? 'rgba(244, 63, 94, 0.45)' : 'var(--border-subtle)',
                        background: isSpeaking && playingAudioId === quest.id ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-surface)',
                        color: isSpeaking && playingAudioId === quest.id ? '#fb7185' : 'inherit'
                      }}
                      onClick={() => speakResult(quest.promptAudio, quest.id)}
                      title={isSpeaking && playingAudioId === quest.id ? "Pause Audio Briefing" : "Audio Guide Briefing"}
                    >
                      {isSpeaking && playingAudioId === quest.id ? <Pause size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>

                  <h3 className="quest-title">{quest.title}</h3>
                  <p style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>{quest.challengeText}</p>

                  <ul className="quest-instructions">
                    {quest.instructions.map((step, idx) => (
                      <li key={idx} className="quest-step-item">
                        <span className="quest-step-number">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="sensory-prompt-box" style={{ marginTop: '4px' }}>
                    <div className="sensory-title">
                      <Sparkles size={12} />
                      <span>Reflection Cue</span>
                    </div>
                    <p className="sensory-body">{quest.reflectionPrompt}</p>
                  </div>

                  <div className="quest-action-row">
                    <button
                      className={`btn-primary ${isDone ? 'done' : ''}`}
                      style={{
                        flex: 1,
                        backgroundColor: isDone ? '#059669' : 'var(--accent-mint)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onClick={() => toggleQuestComplete(quest.id)}
                    >
                      <CheckCircle2 size={16} />
                      <span>{isDone ? "Completed! Touch Grass Streak +1" : "Mark Expedition Complete"}</span>
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        speakResult(quest.promptAudio);
                        enterTrailSleep();
                      }}
                      title="Speak audio and enter pocket sleep mode"
                    >
                      <Moon size={14} />
                      <span>Pocket & Walk</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: LOCAL FIELD JOURNAL & EXPORT */}
        {activeTab === 'journal' && (
          <div className="journal-container" id="field-journal-view">
            {/* Outdoor Stats */}
            <div className="journal-stats-grid">
              <div className="stat-card">
                <div className="stat-value">{observations.length}</div>
                <div className="stat-label">Species Logged</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{outsideMinutes}m</div>
                <div className="stat-label">Outside Time</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{completedQuests.length}</div>
                <div className="stat-label">Quests Done</div>
              </div>
            </div>

            {/* Export Bar */}
            <div className="journal-export-row">
              <button
                id="export-gpx-btn"
                className="export-btn"
                onClick={() => journalStorage.exportToGPX()}
                title="Export GPS coordinates for Garmin, Apple Watch, or AllTrails"
              >
                <Download size={16} color="#4ade80" />
                <span>Export GPX Trail File</span>
              </button>

              <button
                id="export-markdown-btn"
                className="export-btn"
                onClick={() => journalStorage.exportToMarkdown()}
                title="Export Field Journal Markdown Document"
              >
                <Download size={16} color="#38bdf8" />
                <span>Export Field Journal (.md)</span>
              </button>
            </div>

            {/* Observations List */}
            <div className="journal-list">
              {observations.map((obs) => (
                <div key={obs.id} className="journal-item">
                  <img
                    src={obs.photoUrl}
                    alt={obs.speciesName}
                    className="journal-thumb"
                  />
                  <div className="journal-info">
                    <h4 className="journal-name">{obs.speciesName}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {obs.scientificName}
                    </p>
                    <p className="journal-date">
                      {new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {obs.coordinates.lat.toFixed(4)}°N, {Math.abs(obs.coordinates.lon).toFixed(4)}°W
                    </p>
                    {obs.sensoryNote && (
                      <p style={{ fontSize: '0.75rem', color: '#a7f3d0', marginTop: '4px' }}>
                        "{obs.sensoryNote.slice(0, 90)}..."
                      </p>
                    )}
                  </div>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      const updated = journalStorage.deleteObservation(obs.id);
                      setObservations(updated);
                    }}
                    title="Remove observation"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FULLSCREEN TRAIL SLEEP / OLED BATTERY SAVER MODE */}
      {trailSleepActive && (
        <div
          className="trail-sleep-screen"
          id="trail-sleep-overlay"
          onClick={wakeFromTrailSleep}
        >
          <div className="sleep-breathing-ring">
            <Leaf size={44} />
          </div>

          <h2 className="sleep-title">Trail Sleep Mode Active</h2>
          <p className="sleep-sub">
            Your display is resting. Keep your eyes on the trees, bird calls, and terrain around you.
          </p>

          <div className="sleep-telemetry">
            <div>
              <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
              <span>{outsideMinutes}m Outside</span>
            </div>
            <div>
              <Compass size={14} style={{ display: 'inline', marginRight: '4px' }} />
              <span>Alt {trailCoordinates.alt}m</span>
            </div>
          </div>

          <div className="sleep-wake-prompt">
            Tap screen anywhere to resume viewfinder
          </div>
        </div>
      )}

      {/* MODAL: AI MODEL LAB & LIVE BENCHMARK */}
      {showAILabModal && (
        <div className="modal-backdrop" onClick={() => setShowAILabModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={22} color="#4ade80" />
                <h2 className="modal-title">Edge AI Model Engine & Lab</h2>
              </div>
              <button className="icon-btn" onClick={() => setShowAILabModal(false)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '16px' }}>
              Inspect and verify the open-weight neural model running locally on your hardware. 0 server API calls, 100% edge execution.
            </p>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>VISION FOUNDATION</span>
                  <strong style={{ color: '#ffffff' }}>ViT-Base-Patch16 (ONNX WebGPU)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>REASONING BRAIN</span>
                  <strong style={{ color: '#38bdf8' }}>Google Gemma 2 (google/gemma-2-2b-it)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>RUNTIME FRAMEWORK</span>
                  <strong style={{ color: 'var(--accent-mint)' }}>@huggingface/transformers + Gemma 2</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>ACCELERATION HARDWARE</span>
                  <strong style={{ color: 'var(--accent-amber)' }}>
                    {engineStatus.hasWebGPU ? "WebGPU (Direct3D 12 / Vulkan)" : "WASM SIMD CPU"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Live Local Ollama Bridge Section */}
            <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#38bdf8" />
                  <h3 style={{ fontSize: '0.92rem', color: '#ffffff', margin: 0 }}>Live Ollama Bridge (Gemma 2)</h3>
                </div>
                <button
                  className="btn-secondary"
                  style={{
                    fontSize: '0.72rem',
                    padding: '4px 10px',
                    borderColor: ollamaEnabled ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                    color: ollamaEnabled ? '#4ade80' : 'var(--text-muted)'
                  }}
                  onClick={() => handleToggleOllama(!ollamaEnabled)}
                >
                  {ollamaEnabled ? "Bridge: ENABLED" : "Bridge: DISABLED"}
                </button>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.4', marginBottom: '10px' }}>
                Connects directly to your local Ollama daemon for real, dynamic 2.6B neural reasoning. If offline or disabled, uses zero-cloud distilled field cache.
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', fontSize: '0.76rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: ollamaStatus.online ? '#22c55e' : '#94a3b8' }}></span>
                  <span style={{ color: ollamaStatus.online ? '#86efac' : '#94a3b8' }}>
                    {ollamaStatus.online ? `Connected: ${ollamaStatus.endpoint}` : "Ollama daemon not detected on localhost:11434"}
                  </span>
                </div>

                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={checkOllama}
                  disabled={isCheckingOllama}
                >
                  {isCheckingOllama ? "Pinging..." : "Check Connection"}
                </button>
              </div>

              {ollamaStatus.online && ollamaStatus.models.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Select Active Model:</span>
                  <select
                    value={selectedOllamaModel}
                    onChange={(e) => handleSelectOllamaModel(e.target.value)}
                    style={{ background: 'var(--bg-darkest)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem', outline: 'none' }}
                  >
                    {ollamaStatus.models.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {!ollamaStatus.hasGemma && ollamaStatus.online && (
                <div style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--accent-amber)' }}>
                  💡 Tip: To run official Google Gemma 2, run <code>ollama run gemma2:2b</code> in your terminal. Currently using <code>{selectedOllamaModel}</code>.
                </div>
              )}
            </div>

            {/* Live Benchmark Execution */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '0.95rem', color: '#ffffff' }}>Live On-Device Benchmark</h3>
              <button
                className="btn-primary"
                onClick={runAIBenchmark}
                disabled={isBenchmarking}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isBenchmarking ? <RotateCcw className="spin-animation" size={14} /> : <Zap size={14} />}
                <span>{isBenchmarking ? "Computing Tensors..." : "Run Benchmark"}</span>
              </button>
            </div>

            {benchmarkData && (
              <div style={{ background: 'rgba(10, 22, 16, 0.9)', border: '1px solid var(--border-glow)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--accent-mint)' }}>Device: {benchmarkData.engine}</span>
                  <span style={{ color: 'var(--accent-amber)' }}>Latency: {benchmarkData.inferenceDurationMs}ms</span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Top-5 Neural Predictions:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {benchmarkData.topPredictions.map((pred, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-mint)', width: '48px' }}>
                        {(pred.score * 100).toFixed(1)}%
                      </span>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(4, pred.score * 100)}%`, height: '100%', background: 'var(--accent-mint)', borderRadius: '3px' }}></div>
                      </div>
                      <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>{pred.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standalone Terminal Test Code */}
            <div style={{ background: 'var(--bg-darkest)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              <div style={{ color: 'var(--accent-mint)', marginBottom: '4px' }}># Test open models in terminal via Node.js:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: '#ffffff' }}>
                <code>npm run test:model &nbsp;&nbsp;# Test Vision Transformer</code>
                <code>npm run test:gemma &nbsp;&nbsp;# Test Google Gemma 2 Reasoning</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

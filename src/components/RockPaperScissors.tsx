/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  CameraOff, 
  Sparkles, 
  Sliders, 
  RefreshCw, 
  AlertTriangle, 
  Play, 
  Cpu, 
  Trophy, 
  User, 
  History, 
  HelpCircle,
  Lightbulb,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Global script load helper
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

type GestureType = 'rock' | 'paper' | 'scissors' | 'neutral';

interface HistoryLog {
  id: string;
  round: number;
  userGesture: GestureType;
  computerGesture: GestureType;
  result: 'win' | 'lose' | 'draw';
  time: string;
}

const GESTURE_EMOJIS: Record<GestureType, string> = {
  rock: '✊',
  paper: '🖐️',
  scissors: '✌️',
  neutral: '🧍'
};

const GESTURE_NAMES: Record<GestureType, string> = {
  rock: '바위',
  paper: '보',
  scissors: '가위',
  neutral: '대기 중'
};

const getNormalizedGesture = (label: string): GestureType => {
  const l = label.toLowerCase().trim();
  if (l === '가위' || l.includes('가위') || l.includes('scissor') || l.includes('v') || l.includes('✌️')) {
    return 'scissors';
  }
  if (l === '바위' || l.includes('바위') || l.includes('rock') || l.includes('주먹') || l.includes('✊')) {
    return 'rock';
  }
  if (l === '보' || l.includes('보') || l.includes('paper') || l.includes('손바닥') || l.includes('🖐️') || l.includes('보자기')) {
    return 'paper';
  }
  return 'neutral';
};

export default function RockPaperScissors() {
  const [appMode, setAppMode] = useState<'simulation' | 'real'>('simulation');
  const [modelUrl, setModelUrl] = useState<string>('');
  
  // Real Teachable Machine State
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isPoseModel, setIsPoseModel] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [classLabels, setClassLabels] = useState<string[]>(['가위', '바위', '보', '기타']);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // Realtime camera predictions
  const [scores, setScores] = useState<Record<string, number>>({
    '가위': 0,
    '바위': 0,
    '보': 0,
    '기타': 1.0
  });
  const [detectedGesture, setDetectedGesture] = useState<GestureType>('neutral');

  // Simulated active user gesture
  const [simulatedGesture, setSimulatedGesture] = useState<GestureType>('neutral');

  // Game States
  const [gameState, setGameState] = useState<'idle' | 'countdown' | 'result'>('idle');
  const [countdownNum, setCountdownNum] = useState<number | string>(3);
  const [userFinalChoice, setUserFinalChoice] = useState<GestureType>('neutral');
  const [computerChoice, setComputerChoice] = useState<GestureType>('neutral');
  const [roundResult, setRoundResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  
  // Score stats
  const [stats, setStats] = useState({ wins: 0, ties: 0, losses: 0, total: 0 });
  const [history, setHistory] = useState<HistoryLog[]>([]);

  // Refs for video & models
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<any>(null);
  const isPoseModelRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);

  // Active user selection based on mode
  const activeUserGesture = appMode === 'real' ? detectedGesture : simulatedGesture;

  // --- CAMERA MANAGEMENT ---
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.warn('video play error', e));
          setIsCameraActive(true);
        };
      }
    } catch (err: any) {
      console.warn('RPS Camera Permission Error:', err);
      if (err.name === 'NotReadableError' || err.message?.includes('in use')) {
        setCameraError('카메라가 다른 탭이나 프로그램에서 이미 사용 중입니다. 다른 창을 닫아주세요.');
      } else {
        setCameraError('카메라를 켤 수 없습니다. 브라우저 카메라 권한을 확인해주세요.');
      }
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // --- TEACHABLE MACHINE MODEL LOADING ---
  const loadModel = async (url: string) => {
    if (!url) return;
    setIsModelLoading(true);
    setIsModelLoaded(false);
    setModelError(null);

    try {
      let cleanedUrl = url.trim();
      if (!cleanedUrl.endsWith('/')) {
        cleanedUrl += '/';
      }

      const cacheBust = `?t=${Date.now()}`;
      const modelJsonURL = cleanedUrl + 'model.json' + cacheBust;
      const metadataJsonURL = cleanedUrl + 'metadata.json' + cacheBust;

      let isPose = false;
      try {
        const metaResponse = await fetch(metadataJsonURL);
        if (metaResponse.ok) {
          const meta = await metaResponse.json();
          if ((meta.packageName || '').includes('pose') || (meta.packageVersion || '').includes('pose')) {
            isPose = true;
          }
        }
      } catch (e) {
        console.warn('Metadata read error:', e);
      }
      isPoseModelRef.current = isPose;
      setIsPoseModel(isPose);

      // Load TensorFlow.js
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js');

      // Polyfills
      if (window.tf) {
        if (!window.tf.fromPixels && window.tf.browser?.fromPixels) window.tf.fromPixels = window.tf.browser.fromPixels;
        if (!window.tf.browser) window.tf.browser = {};
        if (!window.tf.browser.fromPixels && window.tf.fromPixels) window.tf.browser.fromPixels = window.tf.fromPixels;
      }

      let loadedModel: any = null;
      if (isPose) {
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/posenet@2.2.2/dist/posenet.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8.3/dist/teachablemachine-pose.min.js');
        loadedModel = await window.tmPose.load(modelJsonURL, metadataJsonURL);
      } else {
        await loadScript('https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.3/dist/teachablemachine-image.min.js');
        loadedModel = await window.tmImage.load(modelJsonURL, metadataJsonURL);
      }

      modelRef.current = loadedModel;
      const labels = loadedModel.getClassLabels();
      setClassLabels(labels);

      // Reset scores
      const initialScores: Record<string, number> = {};
      labels.forEach((l: string) => {
        initialScores[l] = 0;
      });
      setScores(initialScores);
      setIsModelLoaded(true);
      console.log('RPS Model loaded:', labels);
    } catch (err: any) {
      console.error('RPS Model load error:', err);
      setModelError('모델 주소를 불러오지 못했습니다. 올바른 공유 링크인지 확인해 주세요.');
      setIsModelLoaded(false);
      setIsPoseModel(false);
    } finally {
      setIsModelLoading(false);
    }
  };

  // Prediction loop
  const predictLoop = async () => {
    if (!modelRef.current || !videoRef.current || !isCameraActive) {
      animationFrameIdRef.current = requestAnimationFrame(predictLoop);
      return;
    }

    if (videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0) {
      animationFrameIdRef.current = requestAnimationFrame(predictLoop);
      return;
    }

    try {
      if (window.tf) {
        if (!window.tf.fromPixels && window.tf.browser?.fromPixels) window.tf.fromPixels = window.tf.browser.fromPixels;
        if (!window.tf.browser) window.tf.browser = {};
        if (!window.tf.browser.fromPixels && window.tf.fromPixels) window.tf.browser.fromPixels = window.tf.fromPixels;
      }

      let predictions: any[] = [];
      let currentPose: any = null;
      if (isPoseModelRef.current) {
        const { pose, posenetOutput } = await modelRef.current.estimatePose(videoRef.current);
        predictions = await modelRef.current.predict(posenetOutput);
        currentPose = pose;
      } else {
        predictions = await modelRef.current.predict(videoRef.current);
      }

      // Draw skeleton on canvas if Canvas exists
      const canvas = canvasRef.current;
      if (canvas && videoRef.current) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (isPoseModelRef.current && currentPose && currentPose.keypoints) {
            ctx.save();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1); // mirror horizontal to match scale-x-[-1] of video

            // Draw skeleton lines
            const minConfidence = 0.5;
            const adjacentKeypoints = window.tmPose?.getAdjacentKeypoints 
              ? window.tmPose.getAdjacentKeypoints(currentPose.keypoints, minConfidence)
              : [];

            ctx.strokeStyle = '#10B981'; // emerald-500
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#10B981';

            if (adjacentKeypoints && adjacentKeypoints.length > 0) {
              adjacentKeypoints.forEach((keypoints: any) => {
                const [{ position: { x: x1, y: y1 } }, { position: { x: x2, y: y2 } }] = keypoints;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
              });
            } else {
              // Fallback manual skeleton drawing
              const connections = [
                [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // arms
                [5, 11], [6, 12], [11, 12], // torso
                [11, 13], [13, 15], [12, 14], [14, 16] // legs
              ];
              connections.forEach(([i, j]) => {
                const kp1 = currentPose.keypoints[i];
                const kp2 = currentPose.keypoints[j];
                if (kp1 && kp2 && kp1.score > minConfidence && kp2.score > minConfidence) {
                  ctx.beginPath();
                  ctx.moveTo(kp1.position.x, kp1.position.y);
                  ctx.lineTo(kp2.position.x, kp2.position.y);
                  ctx.stroke();
                }
              });
            }

            // Draw keypoints
            currentPose.keypoints.forEach((kp: any) => {
              if (kp.score > minConfidence) {
                ctx.beginPath();
                ctx.arc(kp.position.x, kp.position.y, 6, 0, 2 * Math.PI);
                ctx.fillStyle = '#34D399'; // emerald-400
                ctx.shadowBlur = 4;
                ctx.shadowColor = '#34D399';
                ctx.fill();
              }
            });

            ctx.restore();
          }
        }
      }

      const newScores: Record<string, number> = {};
      let maxLabel = '기타';
      let maxProb = -1;

      predictions.forEach((p) => {
        newScores[p.className] = p.probability;
        if (p.probability > maxProb) {
          maxProb = p.probability;
          maxLabel = p.className;
        }
      });

      setScores(newScores);
      
      // Determine gesture
      if (maxProb > 0.65) {
        setDetectedGesture(getNormalizedGesture(maxLabel));
      } else {
        setDetectedGesture('neutral');
      }

    } catch (e) {
      console.warn('RPS Predict error:', e);
    }

    animationFrameIdRef.current = requestAnimationFrame(predictLoop);
  };

  // Trigger predict loops
  useEffect(() => {
    if (appMode === 'real' && isCameraActive && isModelLoaded) {
      animationFrameIdRef.current = requestAnimationFrame(predictLoop);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [appMode, isCameraActive, isModelLoaded]);

  // Load model when URL changes
  useEffect(() => {
    if (appMode === 'real' && modelUrl) {
      loadModel(modelUrl);
    }
  }, [modelUrl]);

  // Handle camera toggle with mode
  useEffect(() => {
    if (appMode === 'real') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [appMode]);

  // --- GAMEPLAY CONTROL ---
  const handleStartGame = () => {
    if (gameState === 'countdown') return;

    setGameState('countdown');
    setCountdownNum(3);
    setUserFinalChoice('neutral');
    setComputerChoice('neutral');
    setRoundResult(null);

    // Audio cue simulations / Visual timers
    let tick = 3;
    const interval = setInterval(() => {
      tick--;
      if (tick > 0) {
        setCountdownNum(tick);
      } else if (tick === 0) {
        setCountdownNum('🤖 GO!');
      } else {
        clearInterval(interval);
        evaluateMatch();
      }
    }, 850);
  };

  const evaluateMatch = () => {
    // 1. Lock the user's gesture based on active mode
    const finalUser = activeUserGesture;
    
    // 2. Randomly select computer gesture ('rock', 'paper', 'scissors')
    const choices: GestureType[] = ['rock', 'paper', 'scissors'];
    const finalComp = choices[Math.floor(Math.random() * choices.length)];

    setUserFinalChoice(finalUser);
    setComputerChoice(finalComp);

    // 3. Determine result
    let result: 'win' | 'lose' | 'draw' = 'draw';
    
    if (finalUser === 'neutral') {
      // If user was not detected or neutral, they automatically lose/forfeit
      result = 'lose';
    } else if (finalUser === finalComp) {
      result = 'draw';
    } else if (
      (finalUser === 'rock' && finalComp === 'scissors') ||
      (finalUser === 'scissors' && finalComp === 'paper') ||
      (finalUser === 'paper' && finalComp === 'rock')
    ) {
      result = 'win';
    } else {
      result = 'lose';
    }

    // 4. Update Stats & Logs
    setStats((prev) => {
      const nextStats = { ...prev };
      nextStats.total += 1;
      if (result === 'win') {
        nextStats.wins += 1;
        // Trigger elegant explosion
        confetti({
          particleCount: 80,
          spread: 75,
          origin: { y: 0.6 }
        });
      } else if (result === 'lose') {
        nextStats.losses += 1;
      } else {
        nextStats.ties += 1;
      }
      return nextStats;
    });

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newLog: HistoryLog = {
      id: Math.random().toString(),
      round: stats.total + 1,
      userGesture: finalUser,
      computerGesture: finalComp,
      result,
      time: timeString
    };

    setHistory((prev) => [newLog, ...prev]);
    setRoundResult(result);
    setGameState('result');
  };

  const handleResetStats = () => {
    setStats({ wins: 0, ties: 0, losses: 0, total: 0 });
    setHistory([]);
    setGameState('idle');
    setRoundResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>가위바위보 AI 대전 모드</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            AI 가위바위보 대전실 ✌️✊🖐️
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            가위(✌️), 바위(✊), 보(🖐️) 데이터를 직접 학습시켜 내 모델 주소를 연결하면, 카메라 동작 인식으로 
            컴퓨터와 실시간 가위바위보 대결을 즐길 수 있습니다. 카메라가 없거나 준비되지 않았다면 아래 <strong>[시뮬레이터]</strong> 버튼을 이용해 대전을 테스트해보세요!
          </p>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 border border-slate-200/50 relative z-10">
          <button
            id="btn-rps-mode-sim"
            onClick={() => setAppMode('simulation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              appMode === 'simulation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            시뮬레이터
          </button>
          <button
            id="btn-rps-mode-real"
            onClick={() => setAppMode('real')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              appMode === 'real' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            실제 웹캠 AI
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Input Camera / Gesture simulator */}
        <div id="col-rps-left" className="lg:col-span-4 flex flex-col justify-between bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-600" />
                내 입력 제어 ({appMode === 'real' ? '카메라' : '시뮬레이터'})
              </h3>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${appMode === 'real' && isCameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{appMode}</span>
              </div>
            </div>

            {/* Teachable Machine model URL input specifically for RPS */}
            {appMode === 'real' && (
              <div className="space-y-2 bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100/30">
                <label className="block text-[10px] font-extrabold text-indigo-900 uppercase">
                  🤖 가위바위보 TM 모델 주소 입력
                </label>
                <div className="flex gap-1.5">
                  <input
                    id="input-rps-model-url"
                    type="text"
                    value={modelUrl}
                    onChange={(e) => setModelUrl(e.target.value)}
                    placeholder="https://teachablemachine.withgoogle.com/models/..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    id="btn-rps-reload-model"
                    onClick={() => loadModel(modelUrl)}
                    disabled={isModelLoading || !modelUrl}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl transition cursor-pointer"
                    title="모델 로드/새로고침"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isModelLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {modelError && <p className="text-[10px] font-bold text-rose-500 mt-1">⚠️ {modelError}</p>}
                {!isModelLoaded && !modelError && !isModelLoading && (
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">
                    가위, 바위, 보를 학습시킨 뒤 모델 주소를 입력해 연결해 주세요.
                  </p>
                )}
                {isModelLoaded && (
                  <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                    ✓ AI 모델 로드 완료! 감지 레이블: {classLabels.slice(0, 4).join(', ')}
                  </p>
                )}
                {isModelLoaded && isPoseModel && (
                  <div className="mt-2 p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-xs text-indigo-900 space-y-1.5 shadow-sm">
                    <p className="font-extrabold flex items-center gap-1.5 text-[11px] uppercase text-indigo-800">
                      ✨ 모션 AI (포즈) 가위바위보 모드 작동 중!
                    </p>
                    <p className="leading-relaxed text-[11px] text-indigo-700">
                      관절의 형태를 감지하는 <strong>포즈 모델</strong>이 성공적으로 연동되었습니다! 몸 전체가 카메라에 다 나오도록 <strong>1.5m 정도 뒤로 한 걸음 물러나서</strong> 서 주세요. 머리, 양 어깨, 팔꿈치, 골반까지 뼈대(스켈레톤)가 초록선으로 그려지면 준비 완료입니다.
                    </p>
                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px]">
                      <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100 text-center">
                        <strong className="block text-indigo-900 font-bold">✊ 바위 동작</strong>
                        <span className="text-slate-500">몸을 작게 움츠리기</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100 text-center">
                        <strong className="block text-indigo-900 font-bold">✌️ 가위 동작</strong>
                        <span className="text-slate-500">팔꿈치 접어 X자 크로스</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100 text-center">
                        <strong className="block text-indigo-900 font-bold">🖐️ 보 동작</strong>
                        <span className="text-slate-500">양팔/다리 활짝 펼치기</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Video Viewport / Simulator Interface */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video flex flex-col items-center justify-center border border-slate-800 shadow-inner w-full min-h-[170px]">
              {appMode === 'real' ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                  {!isCameraActive && !cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 text-slate-400 bg-slate-950/90 space-y-2">
                      <CameraOff className="w-8 h-8 text-slate-500 animate-pulse" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-200">웹캠이 비활성화 상태입니다</p>
                        <p className="text-[10px] text-slate-500">대전을 위해 웹캠 권한을 허용해 주세요.</p>
                      </div>
                      <button
                        id="btn-rps-start-camera"
                        onClick={startCamera}
                        className="py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                      >
                        카메라 켜기
                      </button>
                    </div>
                  )}
                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 text-rose-300 bg-slate-950/95 space-y-1.5">
                      <AlertTriangle className="w-8 h-8 text-rose-400" />
                      <p className="text-xs font-bold">카메라 로드 에러</p>
                      <p className="text-[9px] leading-relaxed max-w-[200px] text-slate-400">{cameraError}</p>
                    </div>
                  )}
                </>
              ) : (
                // Simulator input buttons
                <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950 p-4 space-y-3.5">
                  <div className="text-center space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">모션 시뮬레이터</p>
                    <p className="text-[11px] text-slate-300">컴퓨터와 대결할 동작을 선택하세요</p>
                  </div>
                  <div className="flex gap-2.5">
                    {(['rock', 'scissors', 'paper'] as GestureType[]).map((gesture) => (
                      <button
                        id={`btn-sim-choice-${gesture}`}
                        key={gesture}
                        onClick={() => setSimulatedGesture(gesture)}
                        className={`w-14 h-14 rounded-2xl flex flex-col justify-center items-center border transition-all cursor-pointer ${
                          simulatedGesture === gesture
                            ? 'bg-indigo-600 border-transparent text-white scale-110 shadow-lg shadow-indigo-500/30'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="text-2xl">{GESTURE_EMOJIS[gesture]}</span>
                        <span className="text-[9px] font-bold mt-0.5">{GESTURE_NAMES[gesture]}</span>
                      </button>
                    ))}
                  </div>
                  {simulatedGesture !== 'neutral' && (
                    <button
                      id="btn-sim-reset-gesture"
                      onClick={() => setSimulatedGesture('neutral')}
                      className="text-[9px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      모션 대기 상태로 리셋
                    </button>
                  )}
                </div>
              )}

              {/* Float Active gesture overlay */}
              <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-800/40 text-white text-[10px] flex items-center gap-1">
                <span>실시간 감지:</span>
                <span className="font-bold text-indigo-400">
                  {GESTURE_EMOJIS[activeUserGesture]} {GESTURE_NAMES[activeUserGesture]}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time confidence scores chart */}
          {appMode === 'real' && (
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">실시간 인공지능 인식률</h4>
              <div className="space-y-1.5 text-[10px]">
                {Object.keys(scores).slice(0, 4).map((label) => {
                  const prob = scores[label] || 0;
                  return (
                    <div key={label} className="space-y-0.5">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>{label}</span>
                        <span>{(prob * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-100" 
                          style={{ width: `${prob * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CENTER COLUMN: Match Arena Screen */}
        <div id="col-rps-center" className="lg:col-span-5 flex flex-col justify-between bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
          {/* Neon/Cool accent background under battle arena */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-50/30 blur-3xl pointer-events-none" />

          {/* Arena Header */}
          <div className="text-center space-y-1 relative z-10">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">BATTLE ARENA</h3>
            <p className="text-xs text-slate-500 font-semibold">컴퓨터 AI vs 나 (동작 인식)</p>
          </div>

          {/* Arena Display Window */}
          <div className="flex-1 my-6 flex flex-col justify-center items-center min-h-[220px] relative z-10">
            <AnimatePresence mode="wait">
              {gameState === 'idle' && (
                <motion.div
                  key="idle-screen"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center space-y-3 p-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200/80 max-w-[260px]"
                >
                  <div className="text-4xl animate-bounce">🤖⚡️</div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-700">대결 대기 중!</p>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      아래 [대결 시작!] 버튼을 클릭한 뒤, 카운트다운이 끝나기 전에 카메라를 향해 포즈를 취하세요!
                    </p>
                  </div>
                </motion.div>
              )}

              {gameState === 'countdown' && (
                <motion.div
                  key="countdown-screen"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center justify-center space-y-4"
                >
                  <div className="text-[10px] font-black tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
                    제출 동작을 준비하세요!
                  </div>
                  <motion.div
                    key={countdownNum}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1.2 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="text-5xl md:text-6xl font-black text-indigo-600 font-mono tracking-tight"
                  >
                    {countdownNum}
                  </motion.div>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1 bg-slate-100 py-1 px-3 rounded-lg">
                    <span>현재 내 준비 모션: </span>
                    <strong className="text-indigo-600">{GESTURE_EMOJIS[activeUserGesture]} {GESTURE_NAMES[activeUserGesture]}</strong>
                  </div>
                </motion.div>
              )}

              {gameState === 'result' && (
                <motion.div
                  key="result-screen"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full flex flex-col items-center space-y-6"
                >
                  {/* Results Winner Announcement banner */}
                  <div className="text-center">
                    {roundResult === 'win' && (
                      <span className="px-5 py-1.5 bg-emerald-50 text-emerald-700 font-black text-xs rounded-full border border-emerald-100 flex items-center gap-1.5 animate-bounce shadow-md shadow-emerald-50">
                        🎉 승리했습니다! 이겼어요!
                      </span>
                    )}
                    {roundResult === 'lose' && (
                      <span className="px-5 py-1.5 bg-rose-50 text-rose-600 font-black text-xs rounded-full border border-rose-100 flex items-center gap-1.5">
                        😢 아쉽게 졌습니다! 다시 도전!
                      </span>
                    )}
                    {roundResult === 'draw' && (
                      <span className="px-5 py-1.5 bg-slate-100 text-slate-600 font-black text-xs rounded-full border border-slate-200 flex items-center gap-1.5">
                        🤝 비겼습니다! 치열한 승부!
                      </span>
                    )}
                  </div>

                  {/* VS card representation */}
                  <div className="grid grid-cols-11 items-center w-full max-w-sm gap-2">
                    {/* User side */}
                    <div className="col-span-5 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 text-center flex flex-col items-center space-y-1.5">
                      <span className="text-[10px] font-bold text-indigo-500">YOU (나)</span>
                      <span className="text-4xl">{GESTURE_EMOJIS[userFinalChoice]}</span>
                      <span className="text-xs font-black text-slate-700">{GESTURE_NAMES[userFinalChoice]}</span>
                    </div>

                    {/* VS Badge */}
                    <div className="col-span-1 text-center font-black text-slate-300 text-xs tracking-tighter">
                      VS
                    </div>

                    {/* Computer side */}
                    <div className="col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center flex flex-col items-center space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400">COMPUTER</span>
                      <span className="text-4xl">{GESTURE_EMOJIS[computerChoice]}</span>
                      <span className="text-xs font-black text-slate-700">{GESTURE_NAMES[computerChoice]}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action trigger button */}
          <div className="relative z-10 pt-2 border-t border-slate-50">
            <button
              id="btn-rps-trigger-match"
              onClick={handleStartGame}
              disabled={gameState === 'countdown'}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{gameState === 'countdown' ? '승부 결정 중...' : '대결 시작!'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Realtime Score board & Logs history */}
        <div id="col-rps-right" className="lg:col-span-3 flex flex-col justify-between bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-600" />
                대결 스코어 & 기록
              </h3>
              {stats.total > 0 && (
                <button
                  id="btn-rps-reset-stats"
                  onClick={handleResetStats}
                  className="text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer font-bold"
                >
                  초기화
                </button>
              )}
            </div>

            {/* Score Grid widgets */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50/50 border border-emerald-100/50 p-2.5 rounded-xl text-center">
                <p className="text-[9px] font-black text-emerald-600 tracking-wide">승리</p>
                <p className="text-lg font-black text-emerald-800">{stats.wins}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
                <p className="text-[9px] font-black text-slate-400 tracking-wide">무승부</p>
                <p className="text-lg font-black text-slate-700">{stats.ties}</p>
              </div>
              <div className="bg-rose-50/50 border border-rose-100/50 p-2.5 rounded-xl text-center">
                <p className="text-[9px] font-black text-rose-500 tracking-wide">패배</p>
                <p className="text-lg font-black text-rose-800">{stats.losses}</p>
              </div>
            </div>

            {/* Scrollable logs */}
            <div className="flex-1 flex flex-col min-h-[140px]">
              <span className="text-[10px] font-black text-slate-400 tracking-wide uppercase mb-1.5">승부 역사</span>
              <div className="flex-1 border border-slate-100 rounded-xl overflow-y-auto p-2 bg-slate-50/30 max-h-[190px] space-y-1.5">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <p className="text-[10px] text-slate-300">진행된 대결이 없습니다.</p>
                  </div>
                ) : (
                  history.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-2 rounded-xl text-[10px] flex items-center justify-between border ${
                        log.result === 'win' 
                          ? 'bg-emerald-50/30 border-emerald-100/40' 
                          : log.result === 'lose' 
                          ? 'bg-rose-50/30 border-rose-100/40' 
                          : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-300">R{log.round}</span>
                        <div className="flex items-center gap-0.5">
                          <span>나 {GESTURE_EMOJIS[log.userGesture]}</span>
                          <span className="text-slate-300 font-light">vs</span>
                          <span>컴 {GESTURE_EMOJIS[log.computerGesture]}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-300 font-mono">{log.time}</span>
                        <span className={`font-black uppercase text-[9px] px-1.5 py-0.5 rounded ${
                          log.result === 'win' 
                            ? 'text-emerald-600 bg-emerald-50' 
                            : log.result === 'lose' 
                            ? 'text-rose-600 bg-rose-50' 
                            : 'text-slate-500 bg-slate-100'
                        }`}>
                          {log.result === 'win' ? '승' : log.result === 'lose' ? '패' : '무'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick learning card inside score */}
          <div className="bg-indigo-50/30 p-3 rounded-2xl border border-indigo-100/30 flex gap-2.5 text-slate-500">
            <Zap className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-[10px] text-slate-700">인식 오류 해결책</h4>
              <p className="text-[9px] leading-relaxed">
                '가위' 동작이 자꾸 '보'로 잘못 분류되나요? 손을 카메라와 더 가깝게 들어올리거나, 손가락 각도를 다르게 촬영하여 학습 데이터를 보완해보세요!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* General tips footer card */}
      <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl flex gap-3 text-slate-500">
        <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-extrabold text-xs text-slate-700 font-sans">가위바위보 AI 대전은 어떻게 만드나요?</h4>
          <p className="text-[11px] leading-relaxed">
            구글 티처블 머신(Teachable Machine)에 접속하여 <strong>'가위', '바위', '보'</strong>라는 이름으로 세 개의 클래스(Class)를 생성하세요. 
            그 후 각 동작별로 웹캠을 이용해 150장 이상의 사진을 다양한 각도로 촬영해 학습시킨 뒤, 내보낸 TensorFlow.js 링크를 좌측에 붙여넣으면 됩니다. 
            나만의 고성능 가위바위보 판독 AI를 완성하여 컴퓨터를 꺾어보세요!
          </p>
        </div>
      </div>
    </div>
  );
}

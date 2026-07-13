/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Camera, CameraOff, Sparkles, Sliders, RefreshCw, AlertTriangle, Cpu, Play, Square } from 'lucide-react';
import { AppMode, PredictionState } from '../types';

interface AICameraProps {
  appMode: AppMode;
  modelUrl: string;
  onPredictionChange: (state: PredictionState) => void;
}

// Global script load helpers
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

declare global {
  interface Window {
    tf?: any;
    tmImage?: any;
    tmPose?: any;
  }
}

const isPalmLabel = (label: string): boolean => {
  const l = label.toLowerCase().trim();
  return (
    l === '만세' ||
    l === '손바닥' ||
    l.includes('만세') ||
    l.includes('손바닥') ||
    l.includes('손') ||
    l.includes('켜기') ||
    l.includes('불')
  );
};

const isSpotRunningLabel = (label: string): boolean => {
  const l = label.toLowerCase().trim();
  if (l === '제자리') return false; // '제자리' alone means standing still (neutral/idle)
  return (
    l === '제자리 달리기' ||
    l === '달리기' ||
    l.includes('달리기') ||
    l.includes('러닝') ||
    l.includes('뛰기') ||
    l.includes('걷기')
  );
};

const isFistLabel = (label: string): boolean => {
  const l = label.toLowerCase().trim();
  return (
    l === 't자세' ||
    l === 't자' ||
    l === '주먹' ||
    l.includes('t자') ||
    l.includes('주먹')
  );
};

const isNeutralLabel = (label: string): boolean => {
  const l = label.toLowerCase().trim();
  if (isSpotRunningLabel(label)) return false;
  return (
    l === '제자리' || // Sitting/standing still in place is neutral
    l === '기타' ||
    l === '중립' ||
    l === '평상시' ||
    l === '가만히' ||
    l === 'neutral' ||
    l.includes('제자리') ||
    l.includes('기타') ||
    l.includes('아무것도') ||
    l.includes('기본') ||
    l.includes('대기')
  );
};

const DEFAULT_LABELS = ['만세', 'T자세', '제자리', '기타'];

export default function AICamera({
  appMode,
  modelUrl,
  onPredictionChange,
}: AICameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const modelRef = useRef<any>(null);
  const isPoseModelRef = useRef<boolean>(false);

  // States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [classLabels, setClassLabels] = useState<string[]>(['만세', 'T자세', '제자리', '기타']);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  
  // Real-time confidence values for UI rendering
  const [scores, setScores] = useState<{ [key: string]: number }>({
    '만세': 0,
    'T자세': 0,
    '제자리': 0,
    '기타': 1,
  });

  // Simulated state for Simulation Mode
  const [simulatedState, setSimulatedState] = useState<'handsup' | 'tpose' | 'running_spot' | 'neutral'>('neutral');

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
          videoRef.current?.play();
          setIsCameraActive(true);
        };
      }
    } catch (err: any) {
      console.warn('카메라 권한 획득 상황 기록 (하드웨어/권한 상태):', err);
      if (
        err.name === 'NotReadableError' ||
        err.name === 'SourceUnavailableError' ||
        err.name === 'Device in use' ||
        err.message?.includes('in use') ||
        err.message?.includes('Device in use') ||
        err.message?.includes('Readable')
      ) {
        setCameraError(
          '카메라가 이미 다른 앱이나 티처블 머신 학습 탭에서 사용 중입니다! 티처블 머신의 웹캠 작동을 멈추거나 다른 인터넷 창을 닫은 후 [다시 시도하기] 버튼을 눌러주세요.'
        );
      } else {
        setCameraError(
          '카메라를 켤 수 없습니다. 브라우저의 카메라 권한을 허용했는지 확인해주세요!'
        );
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
  const loadTeachableMachineModel = async (url: string) => {
    if (!url) return;
    setIsModelLoading(true);
    setIsModelLoaded(false);
    setModelError(null);

    try {
      // 1. Format URL to end with a slash
      let cleanedUrl = url.trim();
      if (!cleanedUrl.endsWith('/')) {
        cleanedUrl += '/';
      }

      // Add a cache-busting timestamp to prevent browser/CDN cache issues when updating models on the same Teachable Machine URL
      const cacheBust = `?t=${Date.now()}`;
      const modelJsonURL = cleanedUrl + 'model.json' + cacheBust;
      const metadataJsonURL = cleanedUrl + 'metadata.json' + cacheBust;

      // 2. Fetch metadata first to determine model type (Image vs Pose)
      let isPose = false;
      try {
        const metaResponse = await fetch(metadataJsonURL);
        if (metaResponse.ok) {
          const meta = await metaResponse.json();
          const pkgName = meta.packageName || '';
          const pkgVer = meta.packageVersion || '';
          if (pkgName.includes('pose') || pkgVer.includes('pose')) {
            isPose = true;
          }
        }
      } catch (metaErr) {
        console.warn('Metadata fetch failed, defaulting to image model:', metaErr);
      }

      isPoseModelRef.current = isPose;

      // 3. Ensure appropriate libraries are loaded
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js');

      // Bidirectional Polyfill for tf.fromPixels & tf.browser.fromPixels to support older TM libraries and PoseNet
      if (window.tf) {
        if (!window.tf.fromPixels && window.tf.browser?.fromPixels) {
          window.tf.fromPixels = window.tf.browser.fromPixels;
        }
        if (!window.tf.browser) {
          window.tf.browser = {};
        }
        if (!window.tf.browser.fromPixels && window.tf.fromPixels) {
          window.tf.browser.fromPixels = window.tf.fromPixels;
        }
      }

      let loadedModel: any = null;
      if (isPose) {
        console.log('Teachable Machine POSE 모델 감지 - 라이브러리 로드 중...');
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/posenet@2.2.2/dist/posenet.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8.3/dist/teachablemachine-pose.min.js');

        if (!window.tmPose) {
          throw new Error('티처블 머신 포즈 라이브러리 로드 실패');
        }
        loadedModel = await window.tmPose.load(modelJsonURL, metadataJsonURL);
      } else {
        console.log('Teachable Machine IMAGE 모델 감지 - 라이브러리 로드 중...');
        await loadScript('https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.3/dist/teachablemachine-image.min.js');

        if (!window.tmImage) {
          throw new Error('티처블 머신 이미지 라이브러리 로드 실패');
        }
        loadedModel = await window.tmImage.load(modelJsonURL, metadataJsonURL);
      }

      modelRef.current = loadedModel;

      // Extract labels
      const labels = loadedModel.getClassLabels();
      // Combine DEFAULT_LABELS and any user custom labels that don't match our defaults
      const combinedLabels = [...DEFAULT_LABELS];
      labels.forEach((l: string) => {
        const isKnown =
          isPalmLabel(l) ||
          isFistLabel(l) ||
          isSpotRunningLabel(l) ||
          isNeutralLabel(l);
        if (!isKnown && !combinedLabels.includes(l)) {
          combinedLabels.push(l);
        }
      });
      setClassLabels(combinedLabels);

      // Initialize default scores
      const initialScores: { [key: string]: number } = {};
      combinedLabels.forEach((l: string) => {
        initialScores[l] = l === '기타' ? 1 : 0;
      });
      setScores(initialScores);
      setIsModelLoaded(true);

      console.log('Teachable Machine 모델 로드 성공! 유형:', isPose ? 'POSE' : 'IMAGE', '레이블:', labels);
    } catch (err: any) {
      console.error('모델 로드 에러:', err);
      setIsModelLoaded(false);
      setModelError(
        '모델 로드 중 에러가 발생했습니다. 올바른 주소인지, 또는 네트워크가 켜져 있는지 확인해보세요!'
      );
      modelRef.current = null;
    } finally {
      setIsModelLoading(false);
    }
  };

  // --- REAL-TIME INFERENCE LOOP ---
  const runPrediction = async () => {
    if (!modelRef.current || !videoRef.current || !isCameraActive) {
      animationFrameIdRef.current = requestAnimationFrame(runPrediction);
      return;
    }

    // Safety check: ensure video is fully ready and has non-zero size before processing
    if (videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0) {
      animationFrameIdRef.current = requestAnimationFrame(runPrediction);
      return;
    }

    try {
      // Ensure bidirectional polyfills exist on window.tf at prediction time
      if (window.tf) {
        if (!window.tf.fromPixels && window.tf.browser?.fromPixels) {
          window.tf.fromPixels = window.tf.browser.fromPixels;
        }
        if (!window.tf.browser) {
          window.tf.browser = {};
        }
        if (!window.tf.browser.fromPixels && window.tf.fromPixels) {
          window.tf.browser.fromPixels = window.tf.fromPixels;
        }
      }

      let predictions: any[] = [];
      let currentPose: any = null;

      if (isPoseModelRef.current) {
        // Run Teachable Machine POSE prediction
        const { pose, posenetOutput } = await modelRef.current.estimatePose(videoRef.current);
        predictions = await modelRef.current.predict(posenetOutput);
        currentPose = pose;
      } else {
        // Run Teachable Machine IMAGE prediction
        predictions = await modelRef.current.predict(videoRef.current);
      }
      
      // Handle canvas drawing if Canvas exists
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

            // Draw skeleton lines first
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
      
      const updatedScores: { [key: string]: number } = {};
      
      // Initialize display labels with 0
      classLabels.forEach((l) => {
        updatedScores[l] = 0;
      });

      // Map model predictions into displaying labels
      predictions.forEach((p: any) => {
        const className = p.className;
        const prob = p.probability;

        if (isPalmLabel(className)) {
          updatedScores['만세'] = Math.max(updatedScores['만세'] || 0, prob);
        } else if (isFistLabel(className) || isSpotRunningLabel(className)) {
          updatedScores['T자세'] = Math.max(updatedScores['T자세'] || 0, prob);
        } else if (className.trim() === '제자리') {
          updatedScores['제자리'] = Math.max(updatedScores['제자리'] || 0, prob);
        } else if (isNeutralLabel(className)) {
          updatedScores['기타'] = Math.max(updatedScores['기타'] || 0, prob);
        } else {
          if (classLabels.includes(className)) {
            updatedScores[className] = prob;
          }
        }
      });

      // If the actual model has no neutral class, dynamically assign 1 - (sum of active classes) to '기타' as fallback
      const hasNeutralInModel = predictions.some((p: any) => isNeutralLabel(p.className) || p.className.trim() === '제자리');
      if (!hasNeutralInModel) {
        const activeSum = (updatedScores['만세'] || 0) + (updatedScores['T자세'] || 0) + (updatedScores['제자리'] || 0);
        updatedScores['기타'] = Math.max(0, 1 - activeSum);
      }

      setScores(updatedScores);
      setPredictionError(null);

      // Extract the dominant label and maximum confidence out of the displaying labels to notify parent
      let maxLabel = '기타';
      let maxProb = -1;
      Object.keys(updatedScores).forEach((l) => {
        if (updatedScores[l] > maxProb) {
          maxProb = updatedScores[l];
          maxLabel = l;
        }
      });

      // Notify parent app of predictions
      onPredictionChange({
        label: maxLabel,
        confidence: maxProb,
        allPredictions: classLabels.map((l) => ({
          className: l,
          probability: updatedScores[l] || 0,
        })),
      });
    } catch (err: any) {
      console.error('Inference error:', err);
      const errMsg = err?.message || String(err);
      
      // Self-healing: if we tried to run image prediction but got a shape mismatch typical of Pose models, auto-switch to Pose mode
      if (!isPoseModelRef.current && (errMsg.includes('expected dense_') || errMsg.includes('dimension(s)'))) {
        console.warn('Shape mismatch detected! Auto-switching isPoseModelRef to true (POSE model)...');
        isPoseModelRef.current = true;
      } 
      // Self-healing: if we tried to run pose prediction but estimatePose is missing, auto-switch to Image mode
      else if (isPoseModelRef.current && (errMsg.includes('estimatePose is not a function') || errMsg.includes('undefined'))) {
        console.warn('estimatePose missing! Auto-switching isPoseModelRef to false (IMAGE model)...');
        isPoseModelRef.current = false;
      } else {
        setPredictionError(errMsg);
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(runPrediction);
  };

  // --- SIMULATION MODE CONTROLLER ---
  useEffect(() => {
    if (appMode === 'simulation') {
      stopCamera();
      // Initialize simulator values
      setClassLabels(['만세', 'T자세', '제자리', '기타']);
      
      let label = '기타';
      let confidence = 0.95;
      const initialScores = { '만세': 0, 'T자세': 0, '제자리': 0, '기타': 0.95 };

      if (simulatedState === 'handsup') {
        label = '만세';
        initialScores['만세'] = 0.98;
        initialScores['기타'] = 0.02;
      } else if (simulatedState === 'tpose') {
        label = 'T자세';
        initialScores['T자세'] = 0.98;
        initialScores['기타'] = 0.02;
      } else if (simulatedState === 'running_spot') {
        label = '제자리';
        initialScores['제자리'] = 0.98;
        initialScores['기타'] = 0.02;
      }

      setScores(initialScores);
      onPredictionChange({
        label,
        confidence,
        allPredictions: [
          { className: '만세', probability: initialScores['만세'] },
          { className: 'T자세', probability: initialScores['T자세'] },
          { className: '제자리', probability: initialScores['제자리'] },
          { className: '기타', probability: initialScores['기타'] },
        ],
      });
    } else {
      // Real mode init
      startCamera();
      if (modelUrl) {
        loadTeachableMachineModel(modelUrl);
      }
    }

    return () => {
      stopCamera();
    };
  }, [appMode, simulatedState]);

  // Handle live inference loop triggering
  useEffect(() => {
    if (appMode === 'real' && isCameraActive && modelRef.current) {
      console.log('실시간 예측 루프 시작...');
      animationFrameIdRef.current = requestAnimationFrame(runPrediction);
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

  // Reload model if URL changes
  useEffect(() => {
    if (appMode === 'real' && modelUrl) {
      loadTeachableMachineModel(modelUrl);
    }
  }, [modelUrl]);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col space-y-6">
      {/* Header of Section */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">AI 카메라 (입력)</h2>
            <p className="text-xs text-slate-400">
              {appMode === 'real' ? '실시간 웹캠 영상 분석 중' : '가상 교육 시뮬레이터'}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full animate-ping ${
              appMode === 'real' && isCameraActive
                ? 'bg-emerald-500'
                : 'bg-indigo-500'
            }`}
          />
          <span className="text-xs font-bold text-slate-500">
            {appMode === 'real' ? 'LIVE' : 'SIMULATOR'}
          </span>
        </div>
      </div>

      {/* Main Grid Layout for desktop/tablet: Camera on Left, Scores on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Viewport & Simulator Controls */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Camera/Viewport box */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video flex flex-col items-center justify-center border border-slate-800 group shadow-inner w-full">
            {appMode === 'real' ? (
              <>
                {/* Real WebCam View */}
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-400 bg-slate-950/90 space-y-3">
                    <CameraOff className="w-10 h-10 text-slate-500 animate-pulse" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-200">웹캠이 꺼져 있습니다</p>
                      <p className="text-xs text-slate-500">동작 인식을 위해 카메라를 켜주세요.</p>
                    </div>
                    <button
                      id="btn-start-camera"
                      onClick={startCamera}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all duration-200 flex items-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>카메라 켜기</span>
                    </button>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-400 bg-slate-950/95 space-y-3">
                    <AlertTriangle className="w-10 h-10 text-rose-500" />
                    <p className="text-xs font-semibold text-slate-200 max-w-xs">{cameraError}</p>
                    <button
                      id="btn-retry-camera"
                      onClick={startCamera}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all duration-200"
                    >
                      다시 시도하기
                    </button>
                  </div>
                )}

                {/* Model Loading Spinner Overlays */}
                {isModelLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white space-y-3">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-xs font-bold tracking-tight text-slate-200 animate-pulse">
                      티처블 머신 모델 불러오는 중...
                    </p>
                  </div>
                )}

                {modelError && (
                  <div className="absolute inset-x-4 bottom-4 p-3 bg-rose-500/90 border border-rose-400/20 text-white rounded-xl text-xs flex items-start gap-2 backdrop-blur-md shadow-lg">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">모델을 가져올 수 없어요!</p>
                      <p className="opacity-90">{modelError}</p>
                    </div>
                  </div>
                )}

                {predictionError && (
                  <div className="absolute inset-x-4 bottom-4 p-3 bg-amber-500/90 border border-amber-400/20 text-white rounded-xl text-xs flex items-start gap-2 backdrop-blur-md shadow-lg z-10">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">실시간 분석 에러:</p>
                      <p className="opacity-90">{predictionError}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Simulation Mode Viewport */
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-900 text-center space-y-4">
                {/* Simulated Hand graphic */}
                <div className="w-24 h-24 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-4xl shadow-lg relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  {simulatedState === 'handsup' && (
                    <span className="animate-bounce">🙌</span>
                  )}
                  {simulatedState === 'tpose' && (
                    <span className="scale-125 inline-block">🧍‍♂️</span>
                  )}
                  {simulatedState === 'running_spot' && (
                    <span className="scale-125 inline-block animate-pulse">🏃‍♂️</span>
                  )}
                  {simulatedState === 'neutral' && (
                    <span className="opacity-40 filter grayscale">🤔</span>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-200">
                    {simulatedState === 'handsup' && '만세를 감지했습니다!'}
                    {simulatedState === 'tpose' && 'T자세를 감지했습니다!'}
                    {simulatedState === 'running_spot' && '제자리 동작을 감지했습니다!'}
                    {simulatedState === 'neutral' && '카메라 앞에서 포즈를 취해 보세요!'}
                  </p>
                  <p className="text-xs text-slate-500">
                    가상 시뮬레이터가 정상 작동하고 있습니다.
                  </p>
                </div>
              </div>
            )}

            {/* Floating Controls for real mode */}
            {appMode === 'real' && isCameraActive && (
              <button
                id="btn-stop-camera"
                onClick={stopCamera}
                className="absolute top-3 right-3 bg-slate-950/75 hover:bg-slate-950 text-slate-300 hover:text-white p-2 rounded-xl border border-slate-800/50 transition-colors shadow-md backdrop-blur-sm"
                title="카메라 끄기"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Simulator Control Board (Only in Simulation Mode) */}
          {appMode === 'simulation' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                AI 비서 동작 시뮬레이터 콘솔
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  id="btn-sim-handsup"
                  onClick={() => setSimulatedState('handsup')}
                  className={`py-3 px-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all duration-200 ${
                    simulatedState === 'handsup'
                      ? 'bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-100 scale-[1.03]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg">🙌</span>
                  <span>만세 올리기</span>
                </button>
                <button
                  id="btn-sim-tpose"
                  onClick={() => setSimulatedState('tpose')}
                  className={`py-3 px-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all duration-200 ${
                    simulatedState === 'tpose'
                      ? 'bg-emerald-600 border-emerald-700 text-white shadow-md shadow-emerald-100 scale-[1.03]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg">🧍‍♂️</span>
                  <span>T자세 취하기</span>
                </button>
                <button
                  id="btn-sim-running-spot"
                  onClick={() => setSimulatedState('running_spot')}
                  className={`py-3 px-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all duration-200 ${
                    simulatedState === 'running_spot'
                      ? 'bg-emerald-600 border-emerald-700 text-white shadow-md shadow-emerald-100 scale-[1.03]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg">🏃‍♂️</span>
                  <span>제자리</span>
                </button>
                <button
                  id="btn-sim-neutral"
                  onClick={() => setSimulatedState('neutral')}
                  className={`py-3 px-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all duration-200 ${
                    simulatedState === 'neutral'
                      ? 'bg-slate-600 border-slate-700 text-white shadow-md shadow-slate-100 scale-[1.03]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg">🤔</span>
                  <span>중립 상태</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                각 버튼을 클릭하여 AI에게 보여주는 제스처를 모방할 수 있습니다.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Confidence Scores */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5 h-full flex flex-col justify-between">
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                실시간 AI 동작 인식률 (Confidence Score)
              </h3>
              
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-center">
                {classLabels.map((label) => {
                  const prob = scores[label] || 0;
                  const isFist = label === 'T자세' || label === 'T자' || label === '주먹' || label.includes('T자') || label.includes('주먹') || label.includes('달리기') || label.includes('러닝') || label.includes('걷기') || label.includes('뛰기');
                  const isPalm = label === '만세' || label === '손바닥' || label.includes('만세') || label.includes('손') || label.includes('켜기') || label.includes('불');
                  
                  let colorClass = 'bg-slate-400';
                  if (isPalm) colorClass = 'bg-gradient-to-r from-amber-400 to-amber-500';
                  if (isFist) colorClass = 'bg-gradient-to-r from-emerald-500 to-emerald-600';

                  return (
                    <div key={label} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700 flex items-center gap-1.5">
                          {isPalm && '🙌'}
                          {isFist && '🧍‍♂️'}
                          {label === '제자리' && '🧍'}
                          {label === '기타' && '⚙️'}
                          {!isPalm && !isFist && label !== '제자리' && label !== '기타' && '⚙️'}
                          {label}
                        </span>
                        <span className="text-slate-500 font-mono">{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden p-[2px] shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-150 ${colorClass}`}
                          style={{ width: `${prob * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Educational Info box inside Camera/Analysis section */}
            <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100/30 text-[11px] text-indigo-700/90 leading-relaxed">
              💡 <strong>팁:</strong> 모델이 잘 구분하지 못한다면, 티처블 머신에서 각 클래스당 최소 100장 이상의 다양한 각도/배경 사진을 추가하여 다시 학습시켜 주세요!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

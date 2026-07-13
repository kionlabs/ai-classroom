/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Sparkles, 
  Presentation, 
  Flame, 
  Lightbulb, 
  Target,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Trash2,
  Info,
  HelpCircle,
  Settings,
  Folder,
  RefreshCw
} from 'lucide-react';

// Pre-defined high-fidelity educational slides matching KION Labs curriculum
// These act as the default visual slide deck with rich layouts mimicking PPT slides
const DEFAULT_CURRICULUM_SLIDES = [
  {
    title: "1. Teachable Machine & AI 비서 개요 🌟",
    subtitle: "인공지능과 소통하는 새로운 방식 학습하기",
    badge: "기초 이론",
    bgGradient: "from-indigo-600 via-indigo-700 to-violet-800",
    illustration: "🤖",
    content: (
      <div className="space-y-4 text-white leading-relaxed">
        <p className="font-extrabold text-lg text-indigo-100">👋 내 몸의 움직임으로 컴퓨터를 제어하는 '모션 AI'</p>
        <p className="text-sm text-indigo-100/90">
          단순히 키보드나 마우스로 제어하는 비서를 넘어, 우리의 <strong className="text-amber-300 underline">몸짓과 손짓(포즈 스켈레톤)</strong>을 실시간으로 학습하고 이에 맞춰 스마트 가전이나 달리기 게임을 움직이는 인공지능 비서를 직접 만들어 봅시다!
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center gap-2 font-black text-amber-300 text-xs uppercase mb-2">
              <Target className="w-4 h-4" />
              핵심 학습 목표
            </div>
            <ul className="text-xs space-y-1.5 text-indigo-100 list-disc list-inside">
              <li>티처블 머신 포즈 모델의 작동 원리 학습</li>
              <li>직접 웹캠 앞에서 모션 데이터셋 수집하기</li>
              <li>학습된 클라우드 모델을 이 플랫폼과 실시간 연동</li>
            </ul>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center gap-2 font-black text-amber-300 text-xs uppercase mb-2">
              <Lightbulb className="w-4 h-4" />
              동작 매핑 약속
            </div>
            <ul className="text-xs space-y-1.5 text-indigo-100 list-disc list-inside">
              <li><strong>만세 (Hands Up)</strong> ➔ 스마트 조명 비서 ON/OFF</li>
              <li><strong>T자세 (T-Pose)</strong> ➔ 가상 공간 속 캐릭터 달리기 🏃</li>
              <li><strong>제자리 (Neutral)</strong> ➔ 대기 상태 및 오작동 차단</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "2. 데이터 수집 단계 (웹캠 촬영) 📸",
    subtitle: "지도학습(Supervised Learning)의 기초: 고품질 학습 세트 만들기",
    badge: "실습 가이드",
    bgGradient: "from-blue-600 via-blue-700 to-indigo-800",
    illustration: "📸",
    content: (
      <div className="space-y-4 text-white leading-relaxed">
        <p className="font-extrabold text-lg text-blue-100">🤖 AI는 우리가 촬영한 스켈레톤 뼈대를 분석해요</p>
        <p className="text-sm text-blue-100/90">
          티처블 머신 웹사이트에서 각 동작마다 최소 <strong>100장 이상의 이미지</strong>를 다각도로 촬영해 보세요. 데이터의 완성도가 높을수록 더 똑똑한 비서가 탄생합니다.
        </p>
        <div className="bg-black/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 mt-2">
          <h4 className="text-xs font-black text-amber-300 flex items-center gap-2 mb-3">
            <Flame className="w-4.5 h-4.5" />
            초등 모션 데이터셋 제작 3대 원칙
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-blue-50/90">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="font-extrabold text-white mb-1.5 text-sm">① 멀리서 촬영하기 🚶</p>
              머리부터 골반, 무릎까지 뼈대가 완전히 잡히도록 <strong>약 1.5m 정도 뒤로 물러나서</strong> 동작을 취해주세요.
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="font-extrabold text-white mb-1.5 text-sm">② 배경 변경 금지 🚫</p>
              중간에 친구가 지나가거나 다른 사물이 렌즈에 들어가면 인공지능이 헷갈려 합니다.
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="font-extrabold text-white mb-1.5 text-sm">③ 공평하게 촬영 ⚖️</p>
              만세, T자세, 제자리 동작 각각의 사진 수를 비슷하게 맞춰 공평하게 공부할 수 있도록 해요.
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "3. 모델 학습 및 신경망 검증 🧠",
    subtitle: "에포크(Epoch)와 배치(Batch Size)가 의미하는 머신러닝 이야기",
    badge: "이론 핵심",
    bgGradient: "from-violet-600 via-purple-700 to-indigo-900",
    illustration: "🧠",
    content: (
      <div className="space-y-4 text-white leading-relaxed">
        <p className="font-extrabold text-lg text-purple-100">⚡️ [모델 학습하기] 버튼을 누른 후 일어나는 인공지능의 학습 과정</p>
        <p className="text-sm text-purple-100/90">
          우리가 수집한 몸짓의 포인트 특징을 인공지능이 무수히 대조하며 최적의 분류 기준선(가중치)을 탐색합니다.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
            <h5 className="font-extrabold text-amber-300 text-sm mb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Epochs (학습 횟수)
            </h5>
            <p className="text-xs text-purple-100/80 leading-relaxed">
              수집한 이미지 뼈대 데이터를 처음부터 끝까지 <strong>총 몇 번 반복해서 볼 것인지</strong> 결정합니다. 기본값은 50회이며, 너무 작으면 덜 배우고(Underfitting), 너무 높으면 쓸데없는 세부 사항까지 외워버려 오작동(Overfitting)합니다.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
            <h5 className="font-extrabold text-amber-300 text-sm mb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              Batch Size (묶음 크기)
            </h5>
            <p className="text-xs text-purple-100/80 leading-relaxed">
              학습 시 컴퓨터의 뇌가 한 번에 다룰 수 있게 데이터를 조각으로 쪼개서 학습하는 일괄 크기입니다. 보통 16장, 32장씩 묶어 영리하게 계산하며 뼈대 변화를 포착합니다.
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "4. 모델 내보내기 & 플랫폼 실시간 연결 🌐",
    subtitle: "공유 가능한 모델 주소를 복사하여 KION Labs에 가져오기",
    badge: "실습 가이드",
    bgGradient: "from-emerald-600 via-teal-700 to-indigo-800",
    illustration: "🔗",
    content: (
      <div className="space-y-4 text-white leading-relaxed">
        <p className="font-extrabold text-lg text-emerald-100">🔗 인공지능 학습 결과를 인터넷 주소로 출력해보세요!</p>
        <div className="bg-black/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs space-y-3 mt-2">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-white/20 text-white font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
            <p className="text-emerald-50">티처블 머신 학습창 상단의 <strong>Export Model (모델 내보내기)</strong> 버튼을 꾹 누릅니다.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-white/20 text-white font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
            <p className="text-emerald-50"><strong>TensorFlow.js</strong> 탭 내의 <strong>Upload (shareable link)</strong> 라디오 박스를 확인하고, 아래 파란색 <strong>Upload my model</strong> 버튼을 누릅니다.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-white/20 text-white font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
            <p className="text-emerald-50">업로드가 약 5~10초 동안 진행된 후 생성되는 <strong>공유 주소(https://teachablemachine...)</strong>를 복사합니다.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-white/20 text-white font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</span>
            <p className="text-emerald-50">KION Labs의 <strong>[Step 1. AI 모델 연동]</strong> 창에 붙여넣어 즉시 내 몸뚱아리 동작으로 비서 제어를 시작합니다!</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "5. 모션 감지 메커니즘 & 감도 조절 ⚙️",
    subtitle: "분류 신뢰도(Confidence Score)와 캐릭터 액션 연결",
    badge: "심화 응용",
    bgGradient: "from-amber-600 via-orange-700 to-violet-800",
    illustration: "🎮",
    content: (
      <div className="space-y-4 text-white leading-relaxed">
        <p className="font-extrabold text-lg text-orange-100">🎯 신뢰도가 기준치(Threshold)인 90% 이상을 넘을 때</p>
        <p className="text-sm text-orange-100/90">
          티처블 머신 포즈 엔진이 내 몸 상태가 90% 확률로 '만세' 또는 'T자세'라고 승인할 때만 해당 가상 스위치 및 달리기가 연속적으로 발동됩니다.
        </p>
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex gap-4 mt-2 items-center">
          <div className="text-4xl">💡</div>
          <div className="space-y-1">
            <h5 className="font-black text-amber-300 text-sm">몸짓이 인식이 잘 안 될 때 응급처치!</h5>
            <p className="text-xs text-orange-50/90 leading-relaxed">
              조명이 너무 어둡거나, 상하의 옷 색깔이 뒷배경 벽 색깔과 너무 흡사하면 뼈대 관절을 검출하지 못할 수 있습니다. <strong>환한 곳에서 다른 색 옷을 입고 다시 웹캠을 켜주세요!</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }
];

export default function LessonMaterial() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerMode, setViewerMode] = useState<'interactive' | 'local-slides' | 'custom-images'>('interactive');
  
  // Array to hold custom exported PPT slide images
  const [uploadedSlides, setUploadedSlides] = useState<{ name: string; url: string }[]>([]);
  // Array to hold automatically scanned local slides in public/slides/
  const [localSlides, setLocalSlides] = useState<{ name: string; url: string }[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanPrefix, setScanPrefix] = useState<string>('slide'); // '' or 'slide' or 'page'
  const [scanExt, setScanExt] = useState<string>('jpg'); // 'png' or 'jpg' or 'jpeg'
  const [maxScanCount, setMaxScanCount] = useState<number>(30);
  const [showConfig, setShowConfig] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sliderContainerRef = useRef<HTMLDivElement | null>(null);

  const totalSlides = viewerMode === 'interactive' 
    ? DEFAULT_CURRICULUM_SLIDES.length 
    : viewerMode === 'local-slides'
    ? localSlides.length
    : uploadedSlides.length;

  // Scan local slides
  const scanLocalSlides = async (prefix: string, ext: string, maxCount: number) => {
    setIsScanning(true);
    
    // Scan indices 1 to maxCount in parallel for maximum speed
    const promises = Array.from({ length: maxCount }).map(async (_, idx) => {
      const num = idx + 1;
      
      // Determine file name patterns to try:
      // If single digit (e.g., 1-9), we check both padded ("slide01.jpg") and non-padded ("slide1.jpg") patterns
      const possibleNames = num < 10
        ? [`${prefix}0${num}.${ext}`, `${prefix}${num}.${ext}`]
        : [`${prefix}${num}.${ext}`];

      for (const fileName of possibleNames) {
        const url = `/slides/${fileName}`;
        try {
          const res = await fetch(url, { method: 'HEAD' });
          if (res.ok) {
            const contentType = res.headers.get('content-type');
            // Filter out HTML/text fallbacks (like custom 404 pages)
            if (!contentType || !contentType.includes('text/html')) {
              return {
                name: fileName,
                url: url,
                index: num
              };
            }
          }
        } catch (e) {
          // skip and try next option
        }
      }
      return null;
    });

    const results = await Promise.all(promises);
    const validSlides = results
      .filter((item): item is { name: string; url: string; index: number } => item !== null)
      .sort((a, b) => a.index - b.index)
      .map(item => ({ name: item.name, url: item.url }));

    setLocalSlides(validSlides);
    setIsScanning(false);

    if (validSlides.length > 0) {
      setViewerMode('local-slides');
      setSlideIndex(0);
    } else {
      // If active mode was local-slides but scan resulted in 0, go back to interactive
      if (viewerMode === 'local-slides') {
        setViewerMode('interactive');
        setSlideIndex(0);
      }
    }
  };

  // Run initial scan on mount
  useEffect(() => {
    scanLocalSlides(scanPrefix, scanExt, maxScanCount);
  }, []);

  // Sync state if browser native exit fullscreen is triggered (like Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle slide keys for easier teacher presentation control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slideIndex, totalSlides]);

  const handleNext = () => {
    if (totalSlides > 0 && slideIndex < totalSlides - 1) {
      setSlideIndex(slideIndex + 1);
    }
  };

  const handlePrev = () => {
    if (totalSlides > 0 && slideIndex > 0) {
      setSlideIndex(slideIndex - 1);
    }
  };

  // Multiple image files (exported from PPT) upload handler
  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Create Object URLs for images to render locally
      const newSlides = (Array.from(files) as File[]).map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file)
      }));

      // Sort combined list naturally by filename (e.g. 1 -> 2 -> 10 -> 20)
      setUploadedSlides((prev) => {
        const combined = [...prev, ...newSlides];
        return combined.sort((a, b) => 
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );
      });
      setViewerMode('custom-images');
      setSlideIndex(0); // auto switch and jump to first slide
    }
  };

  // Full Screen trigger on slide container using Full Screen API (with seamless fallback)
  const toggleFullscreen = async () => {
    if (!sliderContainerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await sliderContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen API requested but fell back gracefully:", err);
      setIsFullscreen(!isFullscreen);
    }
  };

  const clearUploadedSlides = () => {
    // Revoke old object URLs to avoid memory leaks
    uploadedSlides.forEach((slide) => URL.revokeObjectURL(slide.url));
    setUploadedSlides([]);
    setViewerMode('interactive');
    setSlideIndex(0);
  };

  return (
    <div className="space-y-6">
      {/* Introduction Banner Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>KION Labs AI 커리큘럼</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            인공지능 비서 학습 자료실 📚
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            Teachable Machine 모델 빌드 방법, 에포크 및 머신러닝 동작 원리 이론 슬라이드입니다. 
            아래 정리용 프리젠테이션 슬라이드를 넘겨 보거나, <strong>내장 이미지 폴더(public/slides/)</strong>의 이미지들을 불러오거나, <strong>개별 이미지 파일들</strong>을 업로드해 수업을 진행해 보세요!
          </p>
        </div>

        {/* Dynamic Presentation Switcher Controls */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10 shrink-0">
          {/* 1. 기본 대화형 교안 */}
          <button
            id="btn-mode-interactive"
            onClick={() => {
              setViewerMode('interactive');
              setSlideIndex(0);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              viewerMode === 'interactive'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Presentation className="w-4 h-4" />
            <span>기본 교육용 슬라이드</span>
          </button>

          {/* 2. 프로젝트 내장 이미지 슬라이더 (public/slides/) */}
          <button
            id="btn-mode-local-slides"
            onClick={() => {
              setViewerMode('local-slides');
              setSlideIndex(0);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer relative ${
              viewerMode === 'local-slides'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>내장 이미지 슬라이더</span>
            {localSlides.length > 0 ? (
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[9px] bg-amber-500 text-white font-black rounded-full shadow-sm animate-bounce">
                {localSlides.length}
              </span>
            ) : (
              <span className="absolute -top-1.5 -right-1 px-1.5 py-0.5 text-[8px] bg-slate-400 text-white font-bold rounded-full">
                0
              </span>
            )}
          </button>

          {/* 3. 로컬 파일 업로드 슬라이더 */}
          <div className="flex items-center gap-1.5">
            <button
              id="btn-upload-images-trigger"
              onClick={() => fileInputRef.current?.click()}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer border ${
                viewerMode === 'custom-images'
                  ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>{uploadedSlides.length > 0 ? '이미지 추가' : '수업 이미지 업로드'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImagesUpload}
            />

            {uploadedSlides.length > 0 && (
              <button
                id="btn-clear-images"
                onClick={clearUploadedSlides}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 transition-all cursor-pointer"
                title="불러온 슬라이드 지우기"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 내장 이미지 스캔 설정 기어 버튼 */}
          <button
            id="btn-toggle-config"
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              showConfig 
                ? 'bg-amber-100 border-amber-300 text-amber-800 ring-2 ring-amber-200' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="내장 교재 이미지 자동 스캔 설정"
          >
            <Settings className={`w-4 h-4 ${isScanning ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 내장 교재 스캔 고급 제어판 (아코디언 형태) */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-5 space-y-4 shadow-inner">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-amber-600" />
                  <span>내장 교재 이미지 자동 감지(Auto Scanner) 설정</span>
                </h4>
                <div className="text-[10px] text-amber-700">
                  * 정적 웹 환경에서 public/slides/ 경로 안의 파일 유무를 실시간으로 스캔합니다.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">파일명 접두사 (Prefix)</label>
                  <input
                    type="text"
                    value={scanPrefix}
                    onChange={(e) => setScanPrefix(e.target.value)}
                    placeholder="예: slide 또는 빈칸"
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">확장자 (Extension)</label>
                  <select
                    value={scanExt}
                    onChange={(e) => setScanExt(e.target.value)}
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-400"
                  >
                    <option value="png">PNG (.png)</option>
                    <option value="jpg">JPG (.jpg)</option>
                    <option value="jpeg">JPEG (.jpeg)</option>
                    <option value="gif">GIF (.gif)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">최대 감지 한도 (Max Slides)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={maxScanCount}
                    onChange={(e) => setMaxScanCount(Number(e.target.value))}
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    id="btn-run-manual-scan"
                    disabled={isScanning}
                    onClick={() => scanLocalSlides(scanPrefix, scanExt, maxScanCount)}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? '스캔 중...' : '지금 다시 스캔하기'}</span>
                  </button>
                </div>
              </div>

              {/* 스캔 결과 상태창 */}
              <div className="p-3 bg-white/80 rounded-xl border border-amber-100 flex items-center justify-between text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>현재 스캔 상태:</span>
                  <strong className="text-amber-900">
                    {localSlides.length > 0 
                      ? `/slides/ 폴더 내에 총 ${localSlides.length}개의 정적 이미지가 감지되어 사용할 수 있습니다.`
                      : `/slides/ 경로에 이미지가 발견되지 않았습니다. 파일명 패턴을 확인해 보시거나, slides 폴더에 이미지를 복사해 주세요.`}
                  </strong>
                </div>
                <div className="text-[10px] text-slate-400">
                  감지 예시 패턴: <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700">/slides/{scanPrefix || ''}1.{scanExt}</code>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Slide Presentation Arena Container */}
      <div 
        ref={sliderContainerRef}
        id="lesson-viewer-container" 
        className={`bg-slate-950 shadow-2xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between select-none ${
          isFullscreen 
            ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' 
            : 'rounded-3xl border border-slate-200/80 min-h-[480px] lg:min-h-[520px]'
        }`}
      >
        {/* Top Control Header Bar (Dark Presentation style to contrast slides) */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-extrabold text-slate-200">
              {viewerMode === 'interactive' 
                ? '🏫 KION Labs AI School 공식 교안 슬라이드' 
                : viewerMode === 'local-slides'
                ? `📂 내장 이미지 교재 슬라이드 (${slideIndex + 1}/${localSlides.length}) - ${localSlides[slideIndex]?.name || ''}`
                : `📂 수업 PPT 이미지 슬라이드 (${slideIndex + 1}/${uploadedSlides.length}) - ${uploadedSlides[slideIndex]?.name || ''}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {viewerMode === 'local-slides' && (
              <span className="text-[10px] bg-emerald-900/50 text-emerald-200 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                내장 폴더 모드 (public/slides/)
              </span>
            )}
            {viewerMode === 'custom-images' && (
              <span className="text-[10px] bg-indigo-900/50 text-indigo-200 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold">
                내 교재 모드
              </span>
            )}
            <button
              id="btn-toggle-fullscreen"
              onClick={toggleFullscreen}
              className="p-2.5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer bg-white/5"
              title={isFullscreen ? '전체화면 종료 (ESC)' : '전체화면 프리젠테이션'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5 text-indigo-400" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* core 16:9 Slide Stage Screen with Responsive Aspect Ratio */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
          {totalSlides === 0 ? (
            <div className="text-center p-12 text-slate-400 space-y-4 max-w-md">
              <div className="w-16 h-16 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                {viewerMode === 'local-slides' ? '📂' : '📥'}
              </div>
              <h3 className="font-extrabold text-slate-200 text-sm">
                {viewerMode === 'local-slides' 
                  ? '내장 폴더에 감지된 이미지가 없습니다' 
                  : '업로드된 수업 이미지가 없습니다'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {viewerMode === 'local-slides' 
                  ? '프로젝트의 `/public/slides/` 폴더 내에 이미지 파일(예: 1.png, 2.png)을 넣어주세요. 우측 상단의 톱니바퀴(설정) 기어 버튼을 눌러 파일명 이름 규칙 및 확장자를 조절하여 다시 스캔할 수 있습니다.' 
                  : "파워포인트(PPT) 등에서 '다른 이름으로 저장' ➔ '이미지 파일(PNG/JPG)'로 전체 내보내기 하신 뒤, 여러 장의 슬라이드 이미지를 선택해 불러와 주세요!"}
              </p>
              {viewerMode === 'local-slides' ? (
                <button
                  id="btn-open-config-from-empty"
                  onClick={() => setShowConfig(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>스캔 설정 제어판 열기</span>
                </button>
              ) : (
                <button
                  id="btn-upload-helper-trigger"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>수업 이미지 불러오기</span>
                </button>
              )}
            </div>
          ) : (
            <div className="w-full h-full max-w-5xl aspect-video flex items-center justify-center relative">
              
              {/* Massive, Highly Clickable Kid-Friendly Side Navigation Controls */}
              {/* Left Navigation Chevron Button */}
              <button
                id="btn-slide-side-prev"
                onClick={handlePrev}
                disabled={slideIndex === 0}
                className={`absolute left-0 lg:-left-16 z-20 w-16 h-16 rounded-full bg-slate-900/95 border border-white/10 shadow-2xl flex items-center justify-center text-white hover:bg-indigo-600 disabled:opacity-20 disabled:hover:bg-slate-900/95 transition-all cursor-pointer transform -translate-x-2 md:translate-x-0 ${
                  slideIndex === 0 ? 'pointer-events-none' : ''
                }`}
                title="이전 슬라이드"
              >
                <ChevronLeft className="w-8 h-8 font-black" />
              </button>

              {/* Right Navigation Chevron Button */}
              <button
                id="btn-slide-side-next"
                onClick={handleNext}
                disabled={slideIndex === totalSlides - 1}
                className={`absolute right-0 lg:-right-16 z-20 w-16 h-16 rounded-full bg-slate-900/95 border border-white/10 shadow-2xl flex items-center justify-center text-white hover:bg-indigo-600 disabled:opacity-20 disabled:hover:bg-slate-900/95 transition-all cursor-pointer transform translate-x-2 md:translate-x-0 ${
                  slideIndex === totalSlides - 1 ? 'pointer-events-none' : ''
                }`}
                title="다음 슬라이드"
              >
                <ChevronRight className="w-8 h-8 font-black" />
              </button>

              {/* Slide Content Display Stage (Animate transitions smoothly) */}
              <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl flex items-center justify-center relative">
                <AnimatePresence mode="wait">
                  {viewerMode === 'interactive' ? (
                    <motion.div
                      key={`interactive-${slideIndex}`}
                      initial={{ opacity: 0, scale: 0.98, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.98, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`w-full h-full bg-gradient-to-br ${DEFAULT_CURRICULUM_SLIDES[slideIndex].bgGradient} p-8 md:p-12 flex flex-col justify-between text-white relative`}
                    >
                      {/* Interactive slide floating design accents */}
                      <div className="absolute right-6 top-6 text-7xl opacity-15 font-serif select-none pointer-events-none">
                        {DEFAULT_CURRICULUM_SLIDES[slideIndex].illustration}
                      </div>

                      {/* Header row */}
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-wider text-amber-300">
                          <Sparkles className="w-3 h-3" />
                          <span>{DEFAULT_CURRICULUM_SLIDES[slideIndex].badge}</span>
                        </div>
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-white mt-1.5">
                          {DEFAULT_CURRICULUM_SLIDES[slideIndex].title}
                        </h2>
                        <p className="text-xs md:text-sm text-indigo-100/70 font-medium">
                          {DEFAULT_CURRICULUM_SLIDES[slideIndex].subtitle}
                        </p>
                      </div>

                      {/* Slide Core details */}
                      <div className="flex-1 my-6 flex items-center justify-start">
                        <div className="w-full">
                          {DEFAULT_CURRICULUM_SLIDES[slideIndex].content}
                        </div>
                      </div>

                      {/* Footer row */}
                      <div className="flex items-center justify-between border-t border-white/10 pt-4 text-[10px] text-white/50">
                        <span>KION Labs - 모션 인공지능 미래형 교안</span>
                        <span className="font-mono tracking-widest font-bold">
                          PAGE {(slideIndex + 1).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </motion.div>
                  ) : viewerMode === 'local-slides' ? (
                    // Local slide image render stage
                    <motion.div
                      key={`local-${slideIndex}`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="w-full h-full bg-slate-950 flex items-center justify-center relative group"
                    >
                      {localSlides[slideIndex] ? (
                        <>
                          <img
                            src={localSlides[slideIndex].url}
                            alt={`Local Slide ${slideIndex + 1}`}
                            referrerPolicy="no-referrer"
                            className="max-w-full max-h-full object-contain pointer-events-none"
                          />
                          <div className="absolute bottom-4 left-4 bg-black/75 px-3 py-1.5 rounded-xl border border-white/10 text-[10px] text-slate-300 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            서버 내장 파일명: {localSlides[slideIndex].name}
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-400 text-xs">이미지를 불러오는 중입니다...</div>
                      )}
                    </motion.div>
                  ) : (
                    // PPT exported slide image render stage
                    <motion.div
                      key={`custom-${slideIndex}`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="w-full h-full bg-slate-950 flex items-center justify-center relative group"
                    >
                      <img
                        src={uploadedSlides[slideIndex]?.url}
                        alt={`Slide ${slideIndex + 1}`}
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full object-contain pointer-events-none"
                      />
                      
                      {/* Overlay label showing file name on hover */}
                      <div className="absolute bottom-4 left-4 bg-black/75 px-3 py-1.5 rounded-xl border border-white/10 text-[10px] text-slate-300 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        파일이름: {uploadedSlides[slideIndex]?.name}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Slide Index & Presentation Navigator Deck */}
        <div className="px-6 py-4 border-t border-white/5 bg-slate-900/90 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            {viewerMode === 'interactive' ? (
              <span>💡 키보드 좌우 방향키(←, →)를 눌러서 편리하게 슬라이드를 조작해 보세요!</span>
            ) : (
              <span>📂 여러 슬라이드 이미지를 넘기며 수업할 수 있는 미디어 슬라이더입니다.</span>
            )}
          </div>

          <div className="flex items-center gap-3.5 shrink-0">
            {/* Quick dots navigation */}
            {totalSlides > 0 && totalSlides <= 12 && (
              <div className="hidden md:flex items-center gap-1.5 bg-black/30 p-2 rounded-xl border border-white/5">
                {Array.from({ length: totalSlides }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSlideIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                      idx === slideIndex 
                        ? 'bg-indigo-500 w-6' 
                        : 'bg-slate-700 hover:bg-slate-500 w-2.5'
                    }`}
                    title={`${idx + 1}번 슬라이드로 이동`}
                  />
                ))}
              </div>
            )}

            {/* Slide Index counter */}
            {totalSlides > 0 && (
              <div className="text-xs font-bold text-slate-300 bg-white/10 px-3 py-1.5 rounded-xl font-mono border border-white/10">
                <span className="text-indigo-400">{slideIndex + 1}</span>
                <span className="text-slate-500 mx-1">/</span>
                <span>{totalSlides}</span>
              </div>
            )}

            {/* Pagination Actions */}
            <div className="flex items-center gap-1.5">
              <button
                id="btn-slide-prev"
                onClick={handlePrev}
                disabled={slideIndex === 0 || totalSlides === 0}
                className="p-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-indigo-600 hover:text-white disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-slate-300 cursor-pointer transition-all duration-200"
                title="이전 슬라이드"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="btn-slide-next"
                onClick={handleNext}
                disabled={slideIndex === totalSlides - 1 || totalSlides === 0}
                className="p-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-indigo-600 hover:text-white disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-slate-300 cursor-pointer transition-all duration-200"
                title="다음 슬라이드"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Thumbnail Preview Gallery (Only shown if local slides or uploaded images exist) */}
      {((viewerMode === 'local-slides' && localSlides.length > 0) || (viewerMode === 'custom-images' && uploadedSlides.length > 0)) && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            <span>수업 슬라이드 미리보기 ({viewerMode === 'local-slides' ? localSlides.length : uploadedSlides.length}개 감지됨)</span>
          </h4>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
            {(viewerMode === 'local-slides' ? localSlides : uploadedSlides).map((slide, idx) => (
              <button
                key={idx}
                onClick={() => setSlideIndex(idx)}
                className={`relative flex-shrink-0 w-28 aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  idx === slideIndex 
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20' 
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <img
                  src={slide.url}
                  alt={slide.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white font-mono text-[10px] font-black">
                  {idx + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Beautiful Information helper cards for elementary students */}
      <div className="bg-indigo-50/40 p-5 rounded-3xl border border-indigo-100/50 flex gap-4 text-indigo-950">
        <div className="text-2xl shrink-0">🏫</div>
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-indigo-900">학습 도우미 코너</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            나만의 인공지능 비서를 더 잘 조종하려면 Teachable Machine 학습 모델 빌드 시 각 클래스 명칭을 
            <strong> '만세'</strong>, <strong>'T자세'</strong>, <strong>'제자리'</strong>로 정확하게 등록해 주는 것이 중요합니다. 
            그 외의 한글/영어 유사 키워드('주먹', 'handsup', 'tpose')도 시스템 내부 지능형 토큰 파서가 완벽하게 분류해 주니 편하게 학습시켜 보세요!
          </p>
        </div>
      </div>
    </div>
  );
}

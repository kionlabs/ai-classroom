/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lightbulb, Footprints, Flame, RefreshCw, Trophy, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PredictionState, SmartHomeSettings, GameState } from '../types';

interface AIReactionProps {
  prediction: PredictionState;
}

export default function AIReaction({ prediction }: AIReactionProps) {
  // Extract activation state based on dominant prediction
  const activeLabel = prediction.label || '';
  const confidence = prediction.confidence || 0;

  // Responsively support custom class names trained by kids (e.g., '제자리', '달리기', etc.)
  const isPalmActive = (
    activeLabel === '만세' ||
    activeLabel === '손바닥' ||
    activeLabel.includes('만세') ||
    activeLabel.includes('손바닥') ||
    activeLabel.includes('손') ||
    activeLabel.includes('켜기') ||
    activeLabel.includes('불')
  ) && confidence > 0.6;

  const isFistActive = (
    activeLabel === 'T자세' ||
    activeLabel === 'T자' ||
    activeLabel === '주먹' ||
    activeLabel.includes('T자') ||
    activeLabel.includes('주먹') ||
    activeLabel.includes('달리기') ||
    activeLabel.includes('러닝') ||
    activeLabel.includes('걷기') ||
    activeLabel.includes('뛰기')
  ) && confidence > 0.6;

  // Smart home states
  const [lightColor, setLightColor] = useState('#fbbf24'); // Default amber
  const [lightBrightness, setLightBrightness] = useState(100);

  // Runner game states
  const [game, setGame] = useState<GameState>({
    distance: 0,
    speed: 0,
    score: 0,
    isJumping: false,
  });

  const [visualLeft, setVisualLeft] = useState(10);
  const [isCharacterVisible, setIsCharacterVisible] = useState(true);

  // Color preset options for kids
  const colorPresets = [
    { name: '햇살 노랑 ☀️', value: '#fbbf24' },
    { name: '시원 하늘 🧊', value: '#38bdf8' },
    { name: '파티 핑크 🌸', value: '#f43f5e' },
    { name: '네온 초록 🍀', value: '#10b981' },
    { name: '마법 보라 🔮', value: '#a855f7' },
  ];

  // Runner distance/speed updates
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isFistActive) {
      // Speed is proportional to AI confidence!
      const currentSpeed = Math.round(confidence * 15 * 10) / 10; // max speed 15 km/h
      
      setGame((prev) => ({
        ...prev,
        speed: currentSpeed,
        distance: Math.round((prev.distance + currentSpeed * 0.05) * 100) / 100,
        score: prev.score + Math.round(currentSpeed),
      }));

      interval = setInterval(() => {
        setGame((prev) => {
          const calculatedSpeed = Math.round(confidence * 15 * 10) / 10;
          return {
            ...prev,
            speed: calculatedSpeed,
            distance: Math.round((prev.distance + calculatedSpeed * 0.05) * 100) / 100,
            score: prev.score + Math.round(calculatedSpeed),
          };
        });
      }, 100);
    } else {
      setGame((prev) => ({
        ...prev,
        speed: 0,
      }));
    }

    return () => clearInterval(interval);
  }, [isFistActive, confidence]);

  const resetGame = () => {
    setGame({
      distance: 0,
      speed: 0,
      score: 0,
      isJumping: false,
    });
  };

  // Dynamic character position (goes from 10% to 80% based on distance, then wraps around)
  const characterLeft = 10 + (game.distance * 2) % 70;

  // Refs to prevent cleanups and race conditions from interrupting fade out -> snap -> fade in sequence
  const prevLeftRef = React.useRef(10);
  const resettingRef = React.useRef(false);
  const characterLeftRef = React.useRef(characterLeft);
  characterLeftRef.current = characterLeft;

  useEffect(() => {
    const prevLeft = prevLeftRef.current;
    prevLeftRef.current = characterLeft;

    if (resettingRef.current) {
      return;
    }

    if (characterLeft < prevLeft) {
      // Wrap-around occurred! Fade out first, snap position, then fade in
      resettingRef.current = true;
      setIsCharacterVisible(false);
      
      setTimeout(() => {
        setVisualLeft(characterLeftRef.current);
        setIsCharacterVisible(true);
        resettingRef.current = false;
      }, 300); // match fade out duration (0.3s)
    } else {
      setVisualLeft(characterLeft);
    }
  }, [characterLeft]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* 1. SMART LIGHT SECTION */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col space-y-5 flex-1 justify-between">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-50 p-2 rounded-xl text-amber-500">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">1. 스마트 조명 비서 💡</h2>
              <p className="text-xs text-slate-400">만세 🙌 포즈로 켜고 끌 수 있어요</p>
            </div>
          </div>

          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full border transition-all duration-300 ${
              isPalmActive
                ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            {isPalmActive ? '조명 켜짐 ☀️' : '조명 꺼짐 🌑'}
          </span>
        </div>

        {/* Light Display Chamber */}
        <div className="relative rounded-2xl bg-slate-950 aspect-video flex items-center justify-center border border-slate-900 overflow-hidden shadow-inner p-4">
          {/* Animated Glow Backdrops */}
          <AnimatePresence>
            {isPalmActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 filter blur-[40px] opacity-40 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${lightColor} 0%, transparent 70%)`,
                }}
              />
            )}
          </AnimatePresence>

          {/* Glowing Bulb graphic */}
          <div className="relative flex flex-col items-center justify-center z-10">
            <motion.div
              animate={
                isPalmActive
                  ? {
                      y: [0, -3, 0],
                      scale: [1, 1.02, 1],
                    }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="relative"
            >
              {/* Outer rays when active */}
              {isPalmActive && (
                <div className="absolute inset-[-20px] flex items-center justify-center animate-pulse">
                  <div
                    className="w-20 h-20 rounded-full opacity-20 filter blur-[10px]"
                    style={{ backgroundColor: lightColor }}
                  />
                  {/* Sun ray lines */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <div
                      key={angle}
                      className="absolute w-1 h-3 rounded-full opacity-65"
                      style={{
                        backgroundColor: lightColor,
                        transform: `rotate(${angle}deg) translateY(-26px)`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Lightbulb SVG */}
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isPalmActive ? lightColor : '#64748b'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-colors duration-300"
              >
                {/* Yellow light color wash */}
                {isPalmActive && (
                  <path
                    d="M15 14.5c.92-1 1.5-2.25 1.5-3.5A4.5 4.5 0 0 0 12 6.5 4.5 4.5 0 0 0 7.5 11c0 1.25.58 2.5 1.5 3.5v3.5h6v-3.5Z"
                    fill={lightColor}
                    fillOpacity="0.2"
                    className="transition-all duration-300"
                  />
                )}
                {/* Bulb Outline */}
                <path d="M15 14.5c.92-1 1.5-2.25 1.5-3.5A4.5 4.5 0 0 0 12 6.5 4.5 4.5 0 0 0 7.5 11c0 1.25.58 2.5 1.5 3.5v3.5h6v-3.5Z" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
                {/* Internal filament */}
                {isPalmActive && (
                  <path
                    d="M10 11.5c1.5-1 2.5-1 4 0"
                    stroke={lightColor}
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                )}
              </svg>
            </motion.div>

            <span
              className={`text-sm font-bold mt-3 tracking-tight transition-colors duration-300 ${
                isPalmActive ? 'text-white' : 'text-slate-500'
              }`}
            >
              {isPalmActive ? '전구 켜짐! 반짝반짝 ✨' : '두 손 들고 만세를 하면 켜져요'}
            </span>
          </div>

          {/* Floating Instruction overlay */}
          <div className="absolute top-3 left-3 bg-slate-900/80 text-[10px] text-slate-400 border border-slate-800/50 px-2 py-1 rounded-lg">
            {isPalmActive ? 'IoT 장치 작동 상태: ON' : 'IoT 장치 작동 상태: OFF'}
          </div>
        </div>

        {/* Kids Color Customizer */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-amber-500" />
            조명 비서 커스텀 색상 선택하기
          </span>
          <div className="flex flex-wrap gap-2">
            {colorPresets.map((preset) => (
              <button
                id={`btn-color-${preset.value}`}
                key={preset.value}
                onClick={() => setLightColor(preset.value)}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                  lightColor === preset.value
                    ? 'bg-white text-slate-800 shadow-sm border-amber-300'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full mr-1 align-middle"
                  style={{ backgroundColor: preset.value }}
                />
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. RUNNING CHARACTER SECTION */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col space-y-5 flex-1 justify-between">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-500">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">2. 달리는 캐릭터 비서 🏃</h2>
              <p className="text-xs text-slate-400">T자세를 취해 캐릭터를 이동시켜요</p>
            </div>
          </div>

          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full border transition-all duration-300 ${
              isFistActive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            {isFistActive ? '캐릭터 이동 중 🏃' : '캐릭터 대기 중 🧍'}
          </span>
        </div>

        {/* Parallax Running Game Stage */}
        <div className="relative rounded-2xl bg-gradient-to-b from-sky-400 to-sky-100 aspect-video flex items-end justify-center border border-sky-200 overflow-hidden shadow-inner">
          {/* Clouds */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className={`absolute top-4 w-12 h-6 bg-white/70 rounded-full filter blur-[1px] ${
                isFistActive ? 'animate-pulse' : ''
              }`}
              style={{ left: '15%' }}
            />
            <div className="absolute top-8 left-[65%] w-16 h-8 bg-white/80 rounded-full filter blur-[1px]" />
          </div>

          {/* Mountains/Hills in Back */}
          <div className="absolute bottom-6 inset-x-0 h-16 flex items-end opacity-40">
            <div className="w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[40px] border-b-emerald-800 ml-6" />
            <div className="w-0 h-0 border-l-[90px] border-l-transparent border-r-[90px] border-r-transparent border-b-[60px] border-b-emerald-800 ml-12" />
          </div>

          {/* Scrolling Ground */}
          <div className="absolute bottom-0 inset-x-0 h-8 bg-amber-800 border-t-4 border-emerald-500 overflow-hidden">
            {/* Ground lines sliding to represent motion */}
            <div className="flex w-[200%] h-full animate-none relative">
              {isFistActive && (
                <div
                  className="absolute inset-0 flex"
                  style={{
                    animation: `scroll-ground ${1 / (confidence || 0.1)}s linear infinite`,
                  }}
                >
                  {[...Array(20)].map((_, idx) => (
                    <div
                      key={idx}
                      className="w-1.5 h-full bg-amber-900/40 transform -skew-x-12 mx-10"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Character GIF / Interactive Runner */}
          <div
            className="absolute bottom-6 z-20"
            style={{
              left: `${visualLeft}%`,
              opacity: isCharacterVisible ? 1 : 0,
              transition: 'left 0.1s linear, opacity 0.3s ease-in-out',
            }}
          >
            <motion.div
              animate={
                isFistActive
                  ? {
                      y: [0, -4, 0], // Hop motion while running
                      rotate: [-2, 2, -2],
                    }
                  : {
                      y: [0, -1, 0], // Idle breathing
                    }
              }
              transition={{
                repeat: Infinity,
                duration: isFistActive ? 0.3 : 1.2,
                ease: 'easeInOut',
              }}
              className="relative"
            >
              {/* Cute little Robot Character SVG (Running Avatar) */}
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Robot Head */}
                <rect x="18" y="14" width="28" height="20" rx="6" fill="#4f46e5" stroke="#312e81" strokeWidth="2" />
                {/* Robot Eyes */}
                <circle cx="27" cy="22" r="3" fill={isFistActive ? '#10b981' : '#fbbf24'} />
                <circle cx="37" cy="22" r="3" fill={isFistActive ? '#10b981' : '#fbbf24'} />
                {/* Robot Antenna */}
                <line x1="32" y1="14" x2="32" y2="8" stroke="#312e81" strokeWidth="2" />
                <circle cx="32" cy="7" r="2.5" fill="#e11d48" />
                {/* Robot Body */}
                <rect x="20" y="34" width="24" height="18" rx="4" fill="#6366f1" stroke="#312e81" strokeWidth="2" />
                {/* Cute logo on chest */}
                <polygon points="32,38 35,43 29,43" fill="#fbbf24" />
                {/* Running Legs */}
                <motion.path
                  d={isFistActive ? "M26 52 L22 58 M38 52 L42 58" : "M26 52 L26 58 M38 52 L38 58"}
                  stroke="#312e81"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  animate={isFistActive ? { d: ["M26 52 L20 56 M38 52 L44 56", "M26 52 L28 58 M38 52 L34 58"] } : {}}
                  transition={{ repeat: Infinity, duration: 0.15, repeatType: 'reverse' }}
                />
                {/* Swinging arms */}
                <motion.path
                  d={isFistActive ? "M17 38 L14 44" : "M17 38 L17 44"}
                  stroke="#312e81"
                  strokeWidth="3"
                  strokeLinecap="round"
                  animate={isFistActive ? { d: ["M17 38 L12 40", "M17 38 L22 42"] } : {}}
                  transition={{ repeat: Infinity, duration: 0.15, repeatType: 'reverse' }}
                />
              </svg>

              {/* Running Speed Dust Particles */}
              {isFistActive && (
                <div className="absolute left-[-15px] bottom-1 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-ping" />
                  <span className="w-1 h-1 bg-white/50 rounded-full animate-ping delay-75" />
                </div>
              )}
            </motion.div>
          </div>

          {/* Floating Game Overlay Dashboard */}
          <div className="absolute top-3 left-3 bg-slate-900/80 text-[10px] text-white border border-slate-800/50 px-2.5 py-1 rounded-xl flex items-center gap-3 backdrop-blur-sm shadow-md">
            <span className="flex items-center gap-1">
              <Footprints className="w-3 h-3 text-emerald-400" />
              거리: <strong className="font-mono text-emerald-300">{game.distance.toFixed(1)}m</strong>
            </span>
            <span className="flex items-center gap-1 border-l border-slate-700 pl-3">
              <Flame className="w-3 h-3 text-rose-400 animate-pulse" />
              속도: <strong className="font-mono text-rose-300">{game.speed.toFixed(1)} km/h</strong>
            </span>
          </div>

          {/* Jump Hint / Overlay */}
          <div className="absolute top-3 right-3 text-[10px] bg-slate-900/80 text-white border border-slate-800/50 px-2 py-1 rounded-lg">
            {isFistActive ? `⚡️ ${activeLabel} 파워 작동 중!` : '🧍‍♂️ T자세를 취해 달리세요'}
          </div>
        </div>

        {/* Distance Stats & Reset */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                인공지능 비서 러닝 미션! 🏆
              </p>
              <p className="text-[10px] text-slate-400">
                온 힘을 합쳐 더 먼 곳까지 캐릭터를 탐험시켜보세요!
              </p>
            </div>
          </div>

          <button
            id="btn-reset-game"
            onClick={resetGame}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-xl transition-all duration-200"
            title="거리 초기화"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global scrolling ground keyframes injections inside reaction style tag */}
      <style>{`
        @keyframes scroll-ground {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50px);
          }
        }
      `}</style>
    </div>
  );
}

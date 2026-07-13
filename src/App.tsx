/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Header from './components/Header';
import ModelInput from './components/ModelInput';
import AICamera from './components/AICamera';
import AIReaction from './components/AIReaction';
import Login from './components/Login';
import LessonMaterial from './components/LessonMaterial';
import RockPaperScissors from './components/RockPaperScissors';
import { AppMode, PredictionState } from './types';
import { Sparkles, HelpCircle, BookOpen, ChevronRight, LogOut, UserCheck } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('kion_auth') === 'true';
  });
  const [activeTab, setActiveTab] = useState<'practice' | 'material'>('practice');
  const [practiceTab, setPracticeTab] = useState<'assistant' | 'rps'>('assistant');
  const [appMode, setAppMode] = useState<AppMode>('simulation');
  const [modelUrl, setModelUrl] = useState<string>('');
  
  // Default neutral prediction state
  const [prediction, setPrediction] = useState<PredictionState>({
    label: '기타',
    confidence: 1.0,
    allPredictions: [
      { className: '손바닥', probability: 0 },
      { className: '주먹', probability: 0 },
      { className: '기타', probability: 1.0 },
    ],
  });

  const handlePredictionChange = (newPrediction: PredictionState) => {
    setPrediction(newPrediction);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('kion_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('kion_auth');
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Educational Header */}
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8 animate-fade-in">
        
        {/* Auth Status Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-50/60 border border-indigo-100/50 px-5 py-3.5 rounded-2xl">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-indigo-800">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>KION Labs 클래스에 접속 중입니다 (인증 완료)</span>
          </div>
          <button
            id="btn-logout"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 px-3 py-1.5 rounded-xl border border-transparent hover:border-rose-100 transition-all duration-200 font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>수업 종료 (로그아웃)</span>
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex border border-slate-200/60 bg-white p-1 rounded-2xl shadow-sm max-w-sm">
          <button
            id="tab-btn-practice"
            onClick={() => setActiveTab('practice')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
              activeTab === 'practice'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI 실습실 🧪</span>
          </button>
          <button
            id="tab-btn-material"
            onClick={() => setActiveTab('material')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
              activeTab === 'material'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>학습 자료실 📚</span>
          </button>
        </div>

        {activeTab === 'practice' ? (
          <>
            {/* Sub Tabs switcher inside AI Practice room */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 max-w-sm mb-2">
              <button
                id="sub-tab-btn-assistant"
                onClick={() => setPracticeTab('assistant')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  practiceTab === 'assistant'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🤖 비서 모드 실습</span>
              </button>
              <button
                id="sub-tab-btn-rps"
                onClick={() => setPracticeTab('rps')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  practiceTab === 'rps'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>✌️ 가위바위보 대전</span>
              </button>
            </div>

            {practiceTab === 'assistant' ? (
              <>
                {/* Step 1: Mode Switcher & Teachable Machine URL input */}
                <section id="section-model-input" className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      1
                    </span>
                    <h2 className="text-base font-bold text-slate-800 tracking-tight">
                      연동할 인공지능(AI) 모델 선택하기
                    </h2>
                  </div>
                  <ModelInput
                    modelUrl={modelUrl}
                    onChangeModelUrl={setModelUrl}
                    appMode={appMode}
                    onChangeAppMode={setAppMode}
                  />
                </section>

                {/* Step 2: Main interactive layout (2-Column Grid) */}
                <section id="section-main-playground" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        2
                      </span>
                      <h2 className="text-base font-bold text-slate-800 tracking-tight">
                        AI 비서 실시간 연동 테스트룸 🧪
                      </h2>
                    </div>
                    
                    <div className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/30 flex items-center gap-1.5">
                      <span>작동 모드:</span>
                      <span>{appMode === 'real' ? '실제 웹캠' : '시뮬레이터'}</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Top Row: AI Camera & Confidence Tracker (Full Width) */}
                    <AICamera
                      appMode={appMode}
                      modelUrl={modelUrl}
                      onPredictionChange={handlePredictionChange}
                    />

                    {/* Bottom Row: Visual AI Reactions (Split Left/Right inside component) */}
                    <AIReaction prediction={prediction} />
                  </div>
                </section>

                {/* Step 3: Bottom Educational Guide cards for kids */}
                <section id="section-edu-cards" className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2.5">
                    <div className="bg-amber-50 text-amber-600 w-9 h-9 rounded-xl flex items-center justify-center font-bold">
                      🙌
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">만세 클래스 (Light)</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      웹캠을 향해 <strong>두 손을 번쩍 들어 만세를 해보세요!</strong> AI 카메라가 만세 포즈를 인식하면 스마트 조명 비서가 켜집니다.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2.5">
                    <div className="bg-emerald-50 text-emerald-600 w-9 h-9 rounded-xl flex items-center justify-center font-bold">
                      🧍‍♂️
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">T자세 클래스 (Running)</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      웹캠을 향해 <strong>두 팔을 양옆으로 뻗어 T자세를 해보세요!</strong> AI 카메라가 T자세를 인식하면 귀여운 러닝 로봇 캐릭터가 앞으로 힘차게 달려나갑니다.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="bg-indigo-50 text-indigo-600 w-9 h-9 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-800">AI 학습 원리 탐구</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        컴퓨터가 이미지를 여러 개 보고 공통적인 특징을 찾아내며 손 모양을 구분하는 원리를 직접 머신러닝으로 체험해보는 학습 도구입니다.
                      </p>
                    </div>
                    <div className="pt-2 text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <span>Made with KION Labs 🚀</span>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <RockPaperScissors />
            )}
          </>
        ) : (
          <LessonMaterial />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 mt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">
              KL
            </div>
            <span className="font-bold text-slate-200">KION Labs AI School</span>
          </div>
          <p className="text-center sm:text-right">
            © 2026 KION Labs. 초등 머신러닝 & 메이커 교육 플랫폼. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

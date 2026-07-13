/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, HelpCircle, BookOpen, X, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-md shadow-indigo-100 flex items-center justify-center">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  KION Labs
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">
                나만의 AI 비서 만들기 ⚡️
              </h1>
            </div>
          </div>

          {/* Controls / Info */}
          <div className="flex items-center gap-3">
            <button
              id="btn-edu-guide"
              onClick={() => setShowInfo(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl font-medium text-sm transition-all duration-200"
            >
              <BookOpen className="w-4 h-4" />
              <span>학습 가이드 보기</span>
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              <Award className="w-4 h-4 text-amber-500" />
              <span>쉽고 재미있는 초등 AI 교실</span>
            </div>
          </div>
        </div>
      </header>

      {/* Educational Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white relative">
                <button
                  id="btn-close-modal"
                  onClick={() => setShowInfo(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
                    AI 비서 학습 가이드
                  </span>
                </div>
                <h3 className="text-xl font-extrabold tracking-tight">
                  컴퓨터는 어떻게 내 손을 알아볼까요? 🧠
                </h3>
              </div>

              <div className="p-6 space-y-5 text-slate-600 text-sm overflow-y-auto max-h-[70vh]">
                <section className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                    <span className="text-indigo-600">1.</span> 티처블 머신이란?
                  </h4>
                  <p className="leading-relaxed">
                    구글(Google)에서 만든 누구나 쉽게 인공지능 모델을 코딩 없이 학습시킬 수 있는 특별한 도구예요. 웹캠으로 사진을 찍어 컴퓨터에게 공부시킬 수 있습니다!
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                    <span className="text-indigo-600">2.</span> 미션: 동작 만들기
                  </h4>
                  <p className="leading-relaxed">
                    티처블 머신(Teachable Machine) 사이트에서 클래스(Class) 두 개를 만들고 이름을 각각 <strong className="text-indigo-600 bg-indigo-50 px-1 rounded">만세</strong>와 <strong className="text-indigo-600 bg-indigo-50 px-1 rounded">T자세</strong>로 지정해요!
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-500">
                    <li><strong>만세 클래스:</strong> 두 팔을 머리 위로 높이 올린 상태로 웹캠 사진 찍기</li>
                    <li><strong>T자세 클래스:</strong> 두 팔을 양옆으로 활짝 펼쳐 알파벳 T를 그린 상태로 사진 찍기</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                    <span className="text-indigo-600">3.</span> 우리 웹앱과 연동하기
                  </h4>
                  <p className="leading-relaxed">
                    모델 학습을 완료하고 <strong className="text-slate-800">Model Export &gt; Update/Upload Model</strong>을 누르면 나오는 공유용 주소(<code className="bg-slate-100 text-rose-500 px-1.5 py-0.5 rounded text-xs">https://teachablemachine...</code>)를 복사해서 아래 입력창에 넣으면 실시간 동작 인식이 시작돼요!
                  </p>
                </section>

                <section className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
                  <h5 className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-500" />
                    모델이 없거나 카메라가 없으면 어쩌죠?
                  </h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    걱정 마세요! <strong>시뮬레이션(체험) 모드</strong>를 이용하면 키보드나 버튼 조작으로 실제 동작 인식이 어떻게 작동하는지 바로 가상으로 체험할 수 있답니다.
                  </p>
                </section>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  id="btn-edu-guide-confirm"
                  onClick={() => setShowInfo(false)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md transition-all duration-200"
                >
                  준비 완료! 시작하기 🚀
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, KeyRound, ArrowRight, HelpCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Simulate a brief, satisfying verification animation feel
    setTimeout(() => {
      const normalizedCode = classCode.trim().toUpperCase();
      if (normalizedCode === 'KION2026') {
        onLoginSuccess();
      } else {
        setError('올바른 수업 코드가 아닙니다. 선생님께 코드를 확인해 주세요!');
        setIsSubmitting(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4 md:p-6 font-sans antialiased">
      {/* Visual background accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-100/40 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-violet-100/40 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 relative z-10 space-y-8"
      >
        {/* KION Labs Brand Logo / Heading */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              KION Labs AI School
            </span>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-2">
              나만의 AI 비서 만들기 ⚡️
            </h1>
            <p className="text-xs text-slate-400">
              로그인 후 인공지능 비서 실시간 연동 학습을 시작해보세요!
            </p>
          </div>
        </div>

        {/* Form area */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="class-code"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              수업 코드 입력
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="class-code"
                type="text"
                required
                value={classCode}
                onChange={(e) => {
                  setClassCode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="수업 코드를 입력해 주세요 (예: KION2026)"
                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm font-semibold tracking-wide placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200"
                disabled={isSubmitting}
                autoFocus
                autoComplete="off"
              />
            </div>
          </div>

          {/* Animated Error Block */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -5 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -5 }}
                className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 text-xs text-rose-600 font-medium leading-relaxed"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            id="btn-login-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200/80 active:scale-[0.98] transition-all duration-200 text-sm cursor-pointer"
          >
            <span>{isSubmitting ? '인증 확인 중...' : '시작하기'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Tip / Classroom Info Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 text-slate-500">
          <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-slate-700">도움말</h4>
            <p className="text-[11px] leading-relaxed">
              수업 코드는 선생님이 제공해주는 알파벳과 숫자로 이루어진 코드입니다. KION Labs 클래스인 경우 기본 코드 <strong className="text-indigo-600">KION2026</strong>을 사용해보세요!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link2, AlertCircle, CheckCircle, Info, Sparkles } from 'lucide-react';
import { AppMode } from '../types';

interface ModelInputProps {
  modelUrl: string;
  onChangeModelUrl: (url: string) => void;
  appMode: AppMode;
  onChangeAppMode: (mode: AppMode) => void;
}

export default function ModelInput({
  modelUrl,
  onChangeModelUrl,
  appMode,
  onChangeAppMode,
}: ModelInputProps) {
  const [inputValue, setInputValue] = useState(modelUrl);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // Validate TM URL pattern: https://teachablemachine.withgoogle.com/models/MODEL_ID
  const validateUrl = (url: string): boolean => {
    const trimmed = url.trim();
    if (!trimmed) {
      setErrorMsg('티처블 머신 공유 링크를 입력해주세요.');
      setIsValid(false);
      return false;
    }

    // Support extracting model ID from various pasted formats, ignoring query parameters, trailing spaces or slashes
    const match = trimmed.match(/teachablemachine\.withgoogle\.com\/models\/([a-zA-Z0-9_-]+)/);
    
    if (!match) {
      setErrorMsg(
        '올바른 티처블 머신 공유 주소가 아닙니다. 주소 형식을 다시 확인해주세요!\n(예시: https://teachablemachine.withgoogle.com/models/abc123xyz/)'
      );
      setIsValid(false);
      return false;
    }

    const modelId = match[1];
    const cleanedUrl = `https://teachablemachine.withgoogle.com/models/${modelId}/`;
    
    setInputValue(cleanedUrl);
    setErrorMsg(null);
    setIsValid(true);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateUrl(inputValue)) {
      const match = inputValue.trim().match(/teachablemachine\.withgoogle\.com\/models\/([a-zA-Z0-9_-]+)/);
      if (match) {
        const cleanedUrl = `https://teachablemachine.withgoogle.com/models/${match[1]}/`;
        onChangeModelUrl(cleanedUrl);
      }
      onChangeAppMode('real');
    }
  };

  const handlePresetClick = () => {
    // Standard public preset Teachable Machine model URL for Palm vs Fist (or similar test)
    // We can provide a working preset link so kids can try it instantly!
    const presetUrl = 'https://teachablemachine.withgoogle.com/models/pNVRszudQ/';
    setInputValue(presetUrl);
    setErrorMsg(null);
    setIsValid(true);
    onChangeModelUrl(presetUrl);
    onChangeAppMode('real');
  };

  useEffect(() => {
    if (appMode === 'simulation') {
      // Clear or keep, but let's sync local state with prop
      setInputValue(modelUrl);
      if (!modelUrl) {
        setIsValid(null);
        setErrorMsg(null);
      }
    }
  }, [appMode, modelUrl]);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
      {/* Tab Switcher */}
      <div className="flex p-1 bg-slate-100 rounded-2xl">
        <button
          id="tab-simulation-mode"
          type="button"
          onClick={() => {
            onChangeAppMode('simulation');
            setErrorMsg(null);
          }}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
            appMode === 'simulation'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>시뮬레이션 모드 (추천)</span>
        </button>
        <button
          id="tab-real-mode"
          type="button"
          onClick={() => {
            onChangeAppMode('real');
            if (inputValue) {
              validateUrl(inputValue);
            }
          }}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
            appMode === 'real'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>나만의 AI 모델 연동</span>
        </button>
      </div>

      {/* Conditionally render URL input form */}
      {appMode === 'real' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="tm-url-input"
              className="block text-sm font-bold text-slate-700 flex items-center gap-1.5"
            >
              티처블 머신 공유 링크 입력
              <span className="text-rose-500 font-normal">*</span>
            </label>
            <div className="relative">
              <input
                id="tm-url-input"
                type="text"
                placeholder="https://teachablemachine.withgoogle.com/models/..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setIsValid(null);
                  setErrorMsg(null);
                }}
                className={`w-full px-4 py-3.5 pl-11 bg-slate-50 border rounded-2xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 ${
                  isValid === true
                    ? 'border-emerald-200 focus:ring-emerald-500/20 bg-emerald-50/10 text-emerald-800'
                    : errorMsg
                    ? 'border-rose-200 focus:ring-rose-500/20 bg-rose-50/10 text-rose-800'
                    : 'border-slate-200 focus:ring-indigo-500/20 text-slate-800'
                }`}
              />
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="btn-apply-model"
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-100 transition-all duration-200"
            >
              모델 불러오기 ⚡️
            </button>
            <button
              id="btn-use-preset"
              type="button"
              onClick={handlePresetClick}
              className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm rounded-2xl border border-slate-200 transition-all duration-200"
            >
              준비된 모델로 먼저 타보기 🧪
            </button>
          </div>

          {/* Validation Feedbacks */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 font-medium leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <div className="whitespace-pre-line">{errorMsg}</div>
            </div>
          )}

          {isValid === true && !errorMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-700 font-medium leading-relaxed">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
              <div>
                멋져요! 티처블 머신 공유 주소가 확인되었습니다. 아래 카메라에서 실시간 학습 모델이 가동됩니다.
              </div>
            </div>
          )}

          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-700 leading-relaxed">
            <Info className="w-4 h-4 shrink-0 text-indigo-500" />
            <div>
              <strong>티처블 머신 가이드:</strong> 학습한 모델을 공유할 때, <code className="bg-white/80 px-1 rounded text-indigo-600 font-semibold">만세</code>, <code className="bg-white/80 px-1 rounded text-indigo-600 font-semibold">T자세</code>, 그리고 <code className="bg-white/80 px-1 rounded text-indigo-600 font-semibold">제자리</code>라는 이름의 클래스를 만들어주셔야 조명과 캐릭터가 완벽하게 연동돼요!
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 text-xs text-indigo-700 leading-relaxed">
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-500 animate-pulse mt-0.5" />
            <div>
              <strong>시뮬레이션 모드가 실행 중입니다.</strong><br />
              웹캠이나 실제 모델 없이도 하단의 가상 AI 버튼을 통해 조명과 달리기 반응을 바로 테스트해볼 수 있어요!
            </div>
          </div>
          <button
            id="btn-switch-tab-real"
            onClick={() => onChangeAppMode('real')}
            className="shrink-0 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl shadow-md transition-all duration-200"
          >
            내 모델 연동할래요! 🔌
          </button>
        </div>
      )}
    </div>
  );
}

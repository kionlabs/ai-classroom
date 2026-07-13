# -*- coding: utf-8 -*-
"""
KION Labs: 나만의 AI 비서 만들기
초등학생 인공지능 교육용 웹앱 (Streamlit + Teachable Machine)
"""

import streamlit as st
import re
from streamlit_teachable_machine import teachable_machine_camera

# 1. 페이지 기본 설정 및 디자인 테마 적용
st.set_page_config(
    page_title="KION Labs: 나만의 AI 비서",
    page_icon="⚡️",
    layout="wide"
)

# 커스텀 CSS를 통한 초등학생 맞춤형 디자인 (폰트, 배경, 카드 등)
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap');
    html, body, [class*="css"] {
        font-family: 'Nanum Gothic', sans-serif;
    }
    .main-title {
        color: #4F46E5;
        font-size: 2.5rem;
        font-weight: 800;
        text-align: center;
        margin-bottom: 5px;
    }
    .sub-title {
        color: #6B7280;
        font-size: 1.1rem;
        text-align: center;
        margin-bottom: 30px;
    }
    .reaction-box {
        background-color: #F3F4F6;
        padding: 20px;
        border-radius: 15px;
        border: 2px solid #E5E7EB;
        text-align: center;
        margin-top: 10px;
    }
    .highlight-yellow {
        color: #D97706;
        font-weight: bold;
        font-size: 1.3rem;
    }
    .highlight-green {
        color: #059669;
        font-weight: bold;
        font-size: 1.3rem;
    }
    </style>
""", unsafe_allow_html=True)

# 2. 상단 헤더 출력
st.markdown('<h1 class="main-title">KION Labs: 나만의 AI 비서 ⚡️</h1>', unsafe_allow_html=True)
st.markdown('<p class="sub-title">티처블 머신으로 나만의 똑똑한 손동작 인식 AI 비서를 만들어봐요!</p>', unsafe_allow_html=True)

# 3. 모델 URL 입력 및 검증 (Label 필수)
model_url = st.text_input(
    label="티처블 머신 공유 링크 입력",
    placeholder="https://teachablemachine.withgoogle.com/models/..."
)

# 정규식을 이용한 티처블 머신 URL 검증 함수
def validate_url(url):
    pattern = r"^https:\/\/teachablemachine\.withgoogle\.com\/models\/[a-zA-Z0-9_-]+\/?$"
    return bool(re.match(pattern, url.strip()))

# 4. 메인 컨텐츠 영역 (2분할 레이아웃)
col1, col2 = st.columns(2)

if model_url:
    cleaned_url = model_url.strip()
    
    # URL 유효성 검사 진행
    if validate_url(cleaned_url):
        st.success("🎉 올바른 티처블 머신 주소입니다! 동작 인식을 시작합니다.")
        
        # 왼쪽 컬럼: AI 카메라 (실시간 웹캠 분석)
        with col1:
            st.subheader("📸 AI 카메라 (입력)")
            st.info("웹캠을 향해 '손바닥'을 펴거나 '주먹'을 쥐어보세요!")
            
            # streamlit-teachable-machine 컴포넌트 호출
            # Teachable Machine에서 학습시킨 가중치 모델을 로드하여 카메라 예측 진행
            image_predictions = teachable_machine_camera(
                model_url=cleaned_url,
                key="teachable_machine"
            )
            
        # 오른쪽 컬럼: AI 반응 (시각적 결과물)
        with col2:
            st.subheader("💡 AI 반응 (결과)")
            
            if image_predictions:
                # 인식된 모든 클래스 중 확률(Confidence)이 가장 높은 항목 탐색
                highest_prediction = max(image_predictions, key=lambda x: x['value'])
                detected_class = highest_prediction['class']
                confidence = highest_prediction['value']
                
                # 예측 신뢰도가 60% 이상인 경우에만 반응 수행 (오작동 방지)
                if confidence > 0.6:
                    st.write(f"**현재 인식된 동작:** {detected_class} (정확도: {confidence*100:.1f}%)")
                    
                    if detected_class == "손바닥":
                        st.markdown("""
                            <div class="reaction-box" style="background-color: #FFFBEB; border-color: #FDE68A;">
                                <p class="highlight-yellow">조명 켜짐 ☀️</p>
                            </div>
                        """, unsafe_allow_html=True)
                        # 전구 이미지 출력 (구글 머티리얼 또는 무료 오픈 CDN 아이콘 활용)
                        st.image(
                            "https://img.icons8.com/emoji/96/000000/light-bulb.png",
                            use_container_width=False,
                            width=150
                        )
                        st.balloons()  # 깜짝 축하 풍선 효과!
                        
                    elif detected_class == "주먹":
                        st.markdown("""
                            <div class="reaction-box" style="background-color: #ECFDF5; border-color: #A7F3D0;">
                                <p class="highlight-green">캐릭터 이동 중 🏃</p>
                            </div>
                        """, unsafe_allow_html=True)
                        # 달리는 캐릭터 GIF 출력
                        st.image(
                            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTlkMnd6ODZpMGZibjB3bjd3czdycmEwaW95d3pxOHZ1dGo2eWttMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/9t794b4IthpWpQO3aN/giphy.gif",
                            use_container_width=False,
                            width=180
                        )
                    else:
                        # 손바닥이나 주먹 이외의 제스처 (중립 상태 등)
                        st.write("인식 대기 중입니다. 손바닥✋이나 주먹✊을 보여주세요!")
                        st.image(
                            "https://img.icons8.com/emoji/96/000000/thinking-face.png",
                            width=120
                        )
                else:
                    st.warning("동작을 확실하게 보여주세요! (확률이 너무 낮습니다)")
            else:
                st.write("카메라 화면에 동작을 보여주면 AI가 자동으로 분석해요.")
                
    else:
        # 유효하지 않은 URL인 경우 에러 메시지 띄우기 (정규식 실패)
        st.error("❌ 유효하지 않은 공유 주소입니다! 다시 한번 확인해 주시겠어요?")
        st.info("올바른 주소 예시: `https://teachablemachine.withgoogle.com/models/abc123xyz/`")
else:
    # URL이 아예 비어있을 때 안내 문구
    st.warning("💡 상단 입력창에 Teachable Machine 모델 주소를 입력하여 AI 비서를 활성화해 주세요!")
    
    # 초보자용 시각 자료 가이드
    with col1:
        st.subheader("1단계: 티처블 머신에서 학습하기")
        st.write("구글 Teachable Machine에 접속하여 아래 클래스를 만들고 이미지를 학습시킵니다.")
        st.code("클래스 1: 손바닥\n클래스 2: 주먹", language="text")
        
    with col2:
        st.subheader("2단계: 공유 링크 복사 및 입력")
        st.write("학습 완료 후 'Upload my model'을 누르고 발급된 공유 링크를 가져와 상단에 넣어주세요!")

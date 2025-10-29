import streamlit as st
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
import time

st.set_page_config(
    page_title="3D SUN TECH 코인 P/E Ratio 대시보드",
    page_icon="🚀",
    layout="wide"
)

# CSS 스타일링
st.markdown("""
    <style>
    .stApp {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .main-container {
        background: white;
        padding: 2rem;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.1);
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        margin: 10px;
    }
    h1 {
        text-align: center;
        color: #333;
    }
    </style>
""", unsafe_allow_html=True)

# 제목
st.title("🚀 3D SUN TECH 코인 P/E Ratio 분석 대시보드")
st.markdown("---")

# 세션 상태 초기화
if 'history' not in st.session_state:
    st.session_state.history = []
    
if 'animation_running' not in st.session_state:
    st.session_state.animation_running = False

# 함수 정의
def calculate_total_coins(members):
    """회원 수에 따른 총 코인 발행량 계산"""
    total_coins = 0
    
    # 1~10,000명: 1,500코인/인
    first_10k = min(members, 10000)
    total_coins += first_10k * 1500
    
    # 10,001~20,000명: 600코인/인
    if members > 10000:
        next_10k = min(members - 10000, 10000)
        total_coins += next_10k * 600
    
    # 20,001명 이상: 300코인/인
    if members > 20000:
        remaining = members - 20000
        total_coins += remaining * 300
    
    return total_coins

def calculate_metrics(pe_ratio, members, revenue, profit_margin, coin_share):
    """주요 지표 계산"""
    revenue_won = revenue * 100_000_000  # 억원 -> 원
    profit = revenue_won * (profit_margin / 100)
    company_value = profit * pe_ratio
    coin_holder_value = company_value * (coin_share / 100)
    total_coins = calculate_total_coins(members)
    coin_value = coin_holder_value / total_coins
    dividend_per_coin = (profit * (coin_share / 100)) / total_coins
    dividend_yield = (dividend_per_coin / coin_value) * 100
    
    return {
        'company_value': company_value,
        'coin_value': coin_value,
        'dividend_per_coin': dividend_per_coin,
        'dividend_yield': dividend_yield,
        'total_coins': total_coins,
        'coin_holder_value': coin_holder_value
    }

def format_krw(value):
    """한국 원화 포맷팅"""
    if value >= 1_000_000_000_000:
        return f"{value / 1_000_000_000_000:.1f}조원"
    elif value >= 100_000_000:
        return f"{value / 100_000_000:.0f}억원"
    else:
        return f"{value / 10_000:.0f}만원"

# 사이드바 - 입력 컨트롤
st.sidebar.header("📊 파라미터 설정")

# 프리셋 버튼
st.sidebar.subheader("시나리오 프리셋")
col1, col2 = st.sidebar.columns(2)
with col1:
    if st.button("보수적 (P/E 8)", use_container_width=True):
        st.session_state.pe_preset = 8
        st.session_state.profit_preset = 10
with col2:
    if st.button("중립 (P/E 12)", use_container_width=True):
        st.session_state.pe_preset = 12
        st.session_state.profit_preset = 15
        
col3, col4 = st.sidebar.columns(2)
with col3:
    if st.button("낙관적 (P/E 15)", use_container_width=True):
        st.session_state.pe_preset = 15
        st.session_state.profit_preset = 20
with col4:
    if st.button("공격적 (P/E 20)", use_container_width=True):
        st.session_state.pe_preset = 20
        st.session_state.profit_preset = 25

st.sidebar.markdown("---")

# 슬라이더 입력
pe_ratio = st.sidebar.slider(
    "P/E Ratio (주가수익비율)",
    min_value=5.0,
    max_value=30.0,
    value=st.session_state.get('pe_preset', 10.0),
    step=0.5,
    help="Price-to-Earnings Ratio: 회사 가치를 순이익으로 나눈 비율"
)

members = st.sidebar.number_input(
    "회원 수 (명)",
    min_value=1000,
    max_value=1000000,
    value=10000,
    step=1000,
    help="플랫폼 가입 회원 수"
)

revenue = st.sidebar.number_input(
    "연간 매출 (억원)",
    min_value=100,
    max_value=50000,
    value=10000,
    step=100,
    help="연간 예상 매출액"
)

profit_margin = st.sidebar.slider(
    "순이익률 (%)",
    min_value=5,
    max_value=30,
    value=st.session_state.get('profit_preset', 15),
    step=1,
    help="매출 대비 순이익 비율"
)

coin_share = st.sidebar.slider(
    "코인 보유자 지분 (%)",
    min_value=5,
    max_value=30,
    value=15,
    step=1,
    help="회사 지분 중 코인 보유자 몫"
)

# 애니메이션 토글
st.sidebar.markdown("---")
animation_toggle = st.sidebar.checkbox("🎬 실시간 변동 시뮬레이션")

if animation_toggle:
    st.session_state.animation_running = True
    placeholder = st.sidebar.empty()
    
    # 애니메이션 실행
    if st.sidebar.button("정지", key="stop_animation"):
        st.session_state.animation_running = False
        
# 메트릭 계산
metrics = calculate_metrics(pe_ratio, members, revenue, profit_margin, coin_share)

# 히스토리 업데이트
st.session_state.history.append({
    'pe_ratio': pe_ratio,
    'coin_value': metrics['coin_value'],
    'dividend_yield': metrics['dividend_yield']
})

# 최대 50개 데이터 포인트 유지
if len(st.session_state.history) > 50:
    st.session_state.history = st.session_state.history[-50:]

# 메인 레이아웃
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric(
        label="🏢 회사 전체 가치",
        value=format_krw(metrics['company_value']),
        delta=None
    )

with col2:
    st.metric(
        label="💰 1코인당 가치",
        value=f"{int(metrics['coin_value']):,}원",
        delta=None
    )

with col3:
    st.metric(
        label="💵 1코인당 배당액",
        value=f"{int(metrics['dividend_per_coin']):,}원",
        delta=None
    )

with col4:
    st.metric(
        label="📈 배당 수익률",
        value=f"{metrics['dividend_yield']:.2f}%",
        delta=None
    )

# 차트 생성
st.markdown("---")
st.subheader("📊 실시간 차트")

# 듀얼 Y축 차트 생성
fig = make_subplots(
    rows=1, cols=1,
    specs=[[{"secondary_y": True}]]
)

# 히스토리 데이터를 DataFrame으로 변환
if st.session_state.history:
    df_history = pd.DataFrame(st.session_state.history)
    
    # 1코인당 가치 라인
    fig.add_trace(
        go.Scatter(
            x=list(range(len(df_history))),
            y=df_history['coin_value'],
            name='1코인당 가치 (원)',
            line=dict(color='#667eea', width=3),
            mode='lines+markers'
        ),
        secondary_y=False
    )
    
    # 배당 수익률 라인
    fig.add_trace(
        go.Scatter(
            x=list(range(len(df_history))),
            y=df_history['dividend_yield'],
            name='배당 수익률 (%)',
            line=dict(color='#764ba2', width=3),
            mode='lines+markers'
        ),
        secondary_y=True
    )

    # 레이아웃 업데이트
    fig.update_xaxes(title_text="시간")
    fig.update_yaxes(title_text="1코인당 가치 (원)", secondary_y=False)
    fig.update_yaxes(title_text="배당 수익률 (%)", secondary_y=True)
    
    fig.update_layout(
        title="코인 가치 및 수익률 추이",
        hovermode='x unified',
        height=400
    )
    
    st.plotly_chart(fig, use_container_width=True)

# 시나리오 분석 테이블
st.markdown("---")
st.subheader("📋 시나리오별 상세 분석")

scenario_data = []
for pe in [8, 10, 12, 15, 20, 25]:
    m = calculate_metrics(pe, members, revenue, profit_margin, coin_share)
    scenario_data.append({
        'P/E Ratio': pe,
        '회사 가치': format_krw(m['company_value']),
        '코인 지분 가치': format_krw(m['coin_holder_value']),
        '1코인당 가치': f"{int(m['coin_value']):,}원",
        '연간 배당액': f"{int(m['dividend_per_coin']):,}원",
        '수익률': f"{m['dividend_yield']:.2f}%"
    })

df_scenarios = pd.DataFrame(scenario_data)
st.dataframe(df_scenarios, use_container_width=True, hide_index=True)

# 추가 정보
st.markdown("---")
st.subheader("ℹ️ 계산 기준")

col1, col2 = st.columns(2)

with col1:
    st.info(f"""
    **현재 설정값:**
    - 총 발행 코인 수: {int(metrics['total_coins']):,}개
    - 회사 순이익: {format_krw(revenue * 100_000_000 * profit_margin / 100)}
    - 코인 보유자 배당 총액: {format_krw(metrics['coin_holder_value'])}
    """)

with col2:
    st.info(f"""
    **코인 발행 구조:**
    - 1~10,000명: 1,500코인/인
    - 10,001~20,000명: 600코인/인
    - 20,001명 이상: 300코인/인
    """)

# 애니메이션 실행
if animation_toggle and st.session_state.animation_running:
    while st.session_state.animation_running:
        # P/E 값 랜덤 변동
        random_change = np.random.uniform(-0.5, 0.5)
        new_pe = pe_ratio + random_change
        new_pe = max(5, min(30, new_pe))  # 범위 제한
        
        # 새로운 메트릭 계산
        new_metrics = calculate_metrics(new_pe, members, revenue, profit_margin, coin_share)
        
        # 히스토리 업데이트
        st.session_state.history.append({
            'pe_ratio': new_pe,
            'coin_value': new_metrics['coin_value'],
            'dividend_yield': new_metrics['dividend_yield']
        })
        
        if len(st.session_state.history) > 50:
            st.session_state.history = st.session_state.history[-50:]
        
        time.sleep(0.5)
        st.rerun()

# 사용 방법
with st.expander("📖 사용 방법", expanded=False):
    st.markdown("""
    ### 이 대시보드 사용법:
    
    1. **파라미터 조정**: 좌측 사이드바에서 P/E Ratio, 회원 수, 매출 등을 조정하세요.
    2. **시나리오 프리셋**: 미리 정의된 시나리오(보수적, 중립, 낙관적, 공격적)를 선택할 수 있습니다.
    3. **실시간 시뮬레이션**: 체크박스를 선택하면 P/E 값이 자동으로 변동합니다.
    4. **차트 분석**: 실시간으로 업데이트되는 차트로 트렌드를 파악하세요.
    5. **시나리오 비교**: 하단 테이블에서 다양한 P/E 시나리오를 비교할 수 있습니다.
    
    ### 주요 지표 설명:
    
    - **P/E Ratio**: 회사 가치를 순이익으로 나눈 비율
    - **회사 가치**: 순이익 × P/E Ratio
    - **1코인당 가치**: 코인 보유자 지분 가치 ÷ 총 코인 수
    - **배당 수익률**: 연간 배당액 ÷ 코인 가치 × 100%
    """)

# 실행 방법 안내
st.markdown("---")
st.info("""
**💻 실행 방법:**
```bash
# 필요한 패키지 설치
pip install streamlit plotly pandas numpy

# 앱 실행
streamlit run 3d_sun_coin_dashboard.py
```
""")

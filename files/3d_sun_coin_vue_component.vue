<template>
  <div class="coin-dashboard">
    <h1 class="title">🚀 3D SUN TECH 코인 P/E Ratio 대시보드</h1>
    
    <!-- 컨트롤 패널 -->
    <div class="controls">
      <div class="control-group">
        <label>P/E Ratio: {{ peRatio }}</label>
        <input 
          type="range" 
          v-model.number="peRatio"
          min="5" 
          max="30" 
          step="0.5"
          class="slider"
        />
      </div>
      
      <div class="control-group">
        <label>회원 수: {{ members.toLocaleString('ko-KR') }}명</label>
        <input 
          type="range" 
          v-model.number="members"
          min="1000" 
          max="100000" 
          step="1000"
          class="slider"
        />
      </div>
      
      <div class="control-group">
        <label>연간 매출: {{ revenue.toLocaleString('ko-KR') }}억원</label>
        <input 
          type="range" 
          v-model.number="revenue"
          min="100" 
          max="50000" 
          step="100"
          class="slider"
        />
      </div>
      
      <div class="control-group">
        <label>순이익률: {{ profitMargin }}%</label>
        <input 
          type="range" 
          v-model.number="profitMargin"
          min="5" 
          max="30" 
          step="1"
          class="slider"
        />
      </div>
      
      <div class="control-group">
        <label>코인 지분: {{ coinShare }}%</label>
        <input 
          type="range" 
          v-model.number="coinShare"
          min="5" 
          max="30" 
          step="1"
          class="slider"
        />
      </div>
    </div>
    
    <!-- 프리셋 버튼 -->
    <div class="preset-buttons">
      <button @click="setPreset('conservative')">보수적 (P/E 8)</button>
      <button @click="setPreset('moderate')">중립 (P/E 12)</button>
      <button @click="setPreset('optimistic')">낙관적 (P/E 15)</button>
      <button @click="setPreset('aggressive')">공격적 (P/E 20)</button>
    </div>
    
    <!-- 애니메이션 토글 -->
    <div class="animation-toggle">
      <label>
        <input type="checkbox" v-model="isAnimating" />
        실시간 변동 시뮬레이션
      </label>
    </div>
    
    <!-- 차트 -->
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
    
    <!-- 지표 카드 -->
    <div class="metrics">
      <div class="metric-card">
        <div class="metric-title">회사 전체 가치</div>
        <div class="metric-value">{{ formatKRW(metrics.companyValue) }}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">1코인당 가치</div>
        <div class="metric-value">{{ Math.round(metrics.coinValue).toLocaleString('ko-KR') }}원</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">1코인당 배당액</div>
        <div class="metric-value">{{ Math.round(metrics.dividendPerCoin).toLocaleString('ko-KR') }}원</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">배당 수익률</div>
        <div class="metric-value">{{ metrics.dividendYield.toFixed(2) }}%</div>
      </div>
    </div>
    
    <!-- 시나리오 테이블 -->
    <div class="table-container">
      <h2>📊 시나리오별 분석</h2>
      <table>
        <thead>
          <tr>
            <th>P/E Ratio</th>
            <th>회사 가치</th>
            <th>1코인당 가치</th>
            <th>배당 수익률</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="scenario in scenarios" :key="scenario.pe">
            <td>{{ scenario.pe }}</td>
            <td>{{ formatKRW(scenario.companyValue) }}</td>
            <td>{{ Math.round(scenario.coinValue).toLocaleString('ko-KR') }}원</td>
            <td>{{ scenario.dividendYield.toFixed(2) }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { Chart } from 'chart.js/auto';

export default {
  name: 'CoinDashboard',
  data() {
    return {
      peRatio: 10,
      members: 10000,
      revenue: 10000, // 억원
      profitMargin: 15, // %
      coinShare: 15, // %
      isAnimating: false,
      chartHistory: [],
      chart: null,
      animationInterval: null
    }
  },
  computed: {
    metrics() {
      return this.calculateMetrics(this.peRatio, this.members, this.revenue, this.profitMargin, this.coinShare);
    },
    scenarios() {
      const peValues = [8, 10, 12, 15, 20];
      return peValues.map(pe => {
        const m = this.calculateMetrics(pe, this.members, this.revenue, this.profitMargin, this.coinShare);
        return {
          pe,
          companyValue: m.companyValue,
          coinValue: m.coinValue,
          dividendYield: m.dividendYield
        };
      });
    }
  },
  watch: {
    peRatio: 'updateChart',
    members: 'updateChart',
    revenue: 'updateChart',
    profitMargin: 'updateChart',
    coinShare: 'updateChart',
    isAnimating(newVal) {
      if (newVal) {
        this.startAnimation();
      } else {
        this.stopAnimation();
      }
    }
  },
  mounted() {
    this.initChart();
    this.updateChart();
  },
  beforeUnmount() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    if (this.chart) {
      this.chart.destroy();
    }
  },
  methods: {
    calculateTotalCoins(memberCount) {
      let totalCoins = 0;
      
      // 1~10,000명: 1,500코인/인
      const first10k = Math.min(memberCount, 10000);
      totalCoins += first10k * 1500;
      
      // 10,001~20,000명: 600코인/인
      if (memberCount > 10000) {
        const next10k = Math.min(memberCount - 10000, 10000);
        totalCoins += next10k * 600;
      }
      
      // 20,001명 이상: 300코인/인
      if (memberCount > 20000) {
        const remaining = memberCount - 20000;
        totalCoins += remaining * 300;
      }
      
      return totalCoins;
    },
    
    calculateMetrics(pe, members, revenue, profitMargin, coinShare) {
      const revenueWon = revenue * 100000000; // 억원 -> 원
      const profit = revenueWon * (profitMargin / 100);
      const companyValue = profit * pe;
      const coinHolderValue = companyValue * (coinShare / 100);
      const totalCoins = this.calculateTotalCoins(members);
      const coinValue = coinHolderValue / totalCoins;
      const dividendPerCoin = (profit * (coinShare / 100)) / totalCoins;
      const dividendYield = (dividendPerCoin / coinValue) * 100;
      
      return {
        companyValue,
        coinValue,
        dividendPerCoin,
        dividendYield,
        totalCoins
      };
    },
    
    formatKRW(value) {
      if (value >= 1000000000000) {
        return `${(value / 1000000000000).toFixed(1)}조원`;
      } else if (value >= 100000000) {
        return `${(value / 100000000).toFixed(0)}억원`;
      } else {
        return `${(value / 10000).toFixed(0)}만원`;
      }
    },
    
    initChart() {
      const ctx = this.$refs.chartCanvas.getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: '1코인당 가치 (원)',
              data: [],
              borderColor: '#667eea',
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              yAxisID: 'y',
              tension: 0.4
            },
            {
              label: '배당 수익률 (%)',
              data: [],
              borderColor: '#764ba2',
              backgroundColor: 'rgba(118, 75, 162, 0.1)',
              yAxisID: 'y1',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: '1코인당 가치 (원)'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: '배당 수익률 (%)'
              },
              grid: {
                drawOnChartArea: false,
              }
            }
          }
        }
      });
    },
    
    updateChart() {
      const metrics = this.calculateMetrics(
        this.peRatio,
        this.members,
        this.revenue,
        this.profitMargin,
        this.coinShare
      );
      
      // 히스토리에 추가
      this.chartHistory.push({
        pe: this.peRatio,
        coinValue: metrics.coinValue,
        dividendYield: metrics.dividendYield
      });
      
      // 최대 50개 데이터 포인트 유지
      if (this.chartHistory.length > 50) {
        this.chartHistory.shift();
      }
      
      // 차트 업데이트
      if (this.chart) {
        this.chart.data.labels = this.chartHistory.map((_, i) => `T${i}`);
        this.chart.data.datasets[0].data = this.chartHistory.map(d => d.coinValue);
        this.chart.data.datasets[1].data = this.chartHistory.map(d => d.dividendYield);
        this.chart.update();
      }
    },
    
    setPreset(type) {
      const presets = {
        conservative: { pe: 8, profit: 10 },
        moderate: { pe: 12, profit: 15 },
        optimistic: { pe: 15, profit: 20 },
        aggressive: { pe: 20, profit: 25 }
      };
      
      const preset = presets[type];
      this.peRatio = preset.pe;
      this.profitMargin = preset.profit;
    },
    
    startAnimation() {
      this.animationInterval = setInterval(() => {
        const change = (Math.random() - 0.5) * 2;
        let newPE = this.peRatio + change;
        
        // 범위 제한
        if (newPE > 30) newPE = 30;
        if (newPE < 5) newPE = 5;
        
        this.peRatio = newPE;
      }, 500);
    },
    
    stopAnimation() {
      if (this.animationInterval) {
        clearInterval(this.animationInterval);
        this.animationInterval = null;
      }
    }
  }
}
</script>

<style scoped>
.coin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.title {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.control-group {
  display: flex;
  flex-direction: column;
}

.control-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #555;
}

.slider {
  width: 100%;
  height: 8px;
  border-radius: 5px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
}

.preset-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

button {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.animation-toggle {
  margin-bottom: 20px;
}

.animation-toggle label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.chart-container {
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.metric-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.metric-title {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
}

.table-container {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
}

tr:hover {
  background: #f8f9fa;
}
</style>

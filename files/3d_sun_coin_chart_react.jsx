import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const CoinValueChart = () => {
  const [peRatio, setPeRatio] = useState(10);
  const [members, setMembers] = useState(10000);
  const [revenue, setRevenue] = useState(10000); // 억원
  const [profitMargin, setProfitMargin] = useState(15); // %
  const [coinShare, setCoinShare] = useState(15); // %
  const [chartHistory, setChartHistory] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);

  // 총 코인 수 계산
  const calculateTotalCoins = (memberCount) => {
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
  };

  // 주요 지표 계산
  const calculateMetrics = () => {
    const revenueWon = revenue * 100000000; // 억원 -> 원
    const profit = revenueWon * (profitMargin / 100);
    const companyValue = profit * peRatio;
    const coinHolderValue = companyValue * (coinShare / 100);
    const totalCoins = calculateTotalCoins(members);
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
  };

  // 차트 데이터 업데이트
  useEffect(() => {
    const metrics = calculateMetrics();
    
    setChartHistory(prev => {
      const newHistory = [...prev, {
        pe: peRatio,
        coinValue: metrics.coinValue,
        yield: metrics.dividendYield
      }];
      
      // 최대 50개 데이터 포인트 유지
      if (newHistory.length > 50) {
        return newHistory.slice(-50);
      }
      return newHistory;
    });
  }, [peRatio, members, revenue, profitMargin, coinShare]);

  // 애니메이션 토글
  useEffect(() => {
    if (isAnimating) {
      animationRef.current = setInterval(() => {
        setPeRatio(prev => {
          const change = (Math.random() - 0.5) * 2;
          const newValue = prev + change;
          
          if (newValue > 30) return 30;
          if (newValue < 5) return 5;
          return newValue;
        });
      }, 500);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isAnimating]);

  const metrics = calculateMetrics();

  // 차트 설정
  const chartData = {
    labels: chartHistory.map((_, i) => `T${i}`),
    datasets: [
      {
        label: '1코인당 가치 (원)',
        data: chartHistory.map(d => d.coinValue),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        yAxisID: 'y',
      },
      {
        label: '배당 수익률 (%)',
        data: chartHistory.map(d => d.yield),
        borderColor: 'rgb(118, 75, 162)',
        backgroundColor: 'rgba(118, 75, 162, 0.1)',
        yAxisID: 'y1',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '3D SUN TECH 코인 가치 실시간 차트'
      }
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
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: '배당 수익률 (%)'
        }
      },
    }
  };

  const formatKRW = (value) => {
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(1)}조원`;
    } else if (value >= 100000000) {
      return `${(value / 100000000).toFixed(0)}억원`;
    } else {
      return `${(value / 10000).toFixed(0)}만원`;
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        🚀 3D SUN TECH 코인 P/E Ratio 분석 대시보드
      </h1>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '10px'
      }}>
        <div>
          <label>P/E Ratio: {peRatio.toFixed(1)}</label>
          <input
            type="range"
            min="5"
            max="30"
            step="0.5"
            value={peRatio}
            onChange={(e) => setPeRatio(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label>회원 수: {members.toLocaleString('ko-KR')}명</label>
          <input
            type="range"
            min="1000"
            max="100000"
            step="1000"
            value={members}
            onChange={(e) => setMembers(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label>연간 매출: {revenue.toLocaleString('ko-KR')}억원</label>
          <input
            type="range"
            min="100"
            max="50000"
            step="100"
            value={revenue}
            onChange={(e) => setRevenue(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label>순이익률: {profitMargin}%</label>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={profitMargin}
            onChange={(e) => setProfitMargin(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label>코인 지분: {coinShare}%</label>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={coinShare}
            onChange={(e) => setCoinShare(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={isAnimating}
              onChange={(e) => setIsAnimating(e.target.checked)}
            />
            실시간 변동 시뮬레이션
          </label>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <button onClick={() => setPeRatio(8)} style={{ marginRight: '10px' }}>
          보수적 (P/E 8)
        </button>
        <button onClick={() => setPeRatio(12)} style={{ marginRight: '10px' }}>
          중립 (P/E 12)
        </button>
        <button onClick={() => setPeRatio(15)} style={{ marginRight: '10px' }}>
          낙관적 (P/E 15)
        </button>
        <button onClick={() => setPeRatio(20)}>
          공격적 (P/E 20)
        </button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>회사 전체 가치</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {formatKRW(metrics.companyValue)}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>1코인당 가치</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {Math.round(metrics.coinValue).toLocaleString('ko-KR')}원
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>1코인당 배당액</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {Math.round(metrics.dividendPerCoin).toLocaleString('ko-KR')}원
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>배당 수익률</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {metrics.dividendYield.toFixed(2)}%
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>📊 시나리오별 분석</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>P/E</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>회사 가치</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>1코인 가치</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>배당 수익률</th>
            </tr>
          </thead>
          <tbody>
            {[8, 10, 12, 15, 20].map(pe => {
              const tempMetrics = {
                ...metrics,
                companyValue: revenue * 100000000 * (profitMargin / 100) * pe,
                coinValue: (revenue * 100000000 * (profitMargin / 100) * pe * (coinShare / 100)) / metrics.totalCoins,
                dividendYield: ((revenue * 100000000 * (profitMargin / 100) * (coinShare / 100)) / metrics.totalCoins) / 
                              ((revenue * 100000000 * (profitMargin / 100) * pe * (coinShare / 100)) / metrics.totalCoins) * 100
              };
              
              return (
                <tr key={pe}>
                  <td style={{ padding: '12px' }}>{pe}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {formatKRW(tempMetrics.companyValue)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {Math.round(tempMetrics.coinValue).toLocaleString('ko-KR')}원
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {tempMetrics.dividendYield.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoinValueChart;
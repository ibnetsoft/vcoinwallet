'use client'

import { useEffect, useRef } from 'react'

export default function CoinValueChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const dataPoints = useRef<{ time: number; value: number }[]>([])
  const peRatio = useRef(15)
  const time = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 크기 설정
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    // 코인 가치 계산 함수
    const calculateCoinValue = (pe: number) => {
      const revenue = 10000 // 100억원
      const profitMargin = 0.15 // 15%
      const coinShare = 0.15 // 15%
      const members = 10000
      const totalCoins = members * 1500 // 1~10,000명: 1,500코인/인

      const revenueWon = revenue * 100000000
      const profit = revenueWon * profitMargin
      const companyValue = profit * pe
      const coinHolderValue = companyValue * coinShare
      const coinValue = coinHolderValue / totalCoins

      return coinValue
    }

    // 애니메이션 루프
    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      // 배경 클리어
      ctx.clearRect(0, 0, width, height)

      // P/E Ratio 랜덤 변동 (10~20 사이)
      const change = (Math.random() - 0.5) * 0.5
      peRatio.current = Math.max(10, Math.min(20, peRatio.current + change))

      // 코인 가치 계산
      const coinValue = calculateCoinValue(peRatio.current)

      // 데이터 포인트 추가
      time.current += 1
      dataPoints.current.push({ time: time.current, value: coinValue })

      // 최대 100개 데이터 포인트 유지
      if (dataPoints.current.length > 100) {
        dataPoints.current.shift()
      }

      // 그래프 그리기
      if (dataPoints.current.length > 1) {
        const maxValue = Math.max(...dataPoints.current.map(d => d.value))
        const minValue = Math.min(...dataPoints.current.map(d => d.value))
        const valueRange = maxValue - minValue || 1

        // 그라데이션 생성
        const gradient = ctx.createLinearGradient(0, 0, 0, height)
        gradient.addColorStop(0, 'rgba(234, 179, 8, 0.3)') // 노란색 (yellow-500)
        gradient.addColorStop(1, 'rgba(234, 179, 8, 0.05)')

        // 영역 채우기
        ctx.beginPath()
        ctx.moveTo(0, height)

        dataPoints.current.forEach((point, i) => {
          const x = (i / (dataPoints.current.length - 1)) * width
          const normalizedValue = (point.value - minValue) / valueRange
          const y = height - (normalizedValue * height * 0.7 + height * 0.15)

          if (i === 0) {
            ctx.lineTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })

        ctx.lineTo(width, height)
        ctx.closePath()
        ctx.fillStyle = gradient
        ctx.fill()

        // 라인 그리기
        ctx.beginPath()
        dataPoints.current.forEach((point, i) => {
          const x = (i / (dataPoints.current.length - 1)) * width
          const normalizedValue = (point.value - minValue) / valueRange
          const y = height - (normalizedValue * height * 0.7 + height * 0.15)

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })

        ctx.strokeStyle = '#eab308' // yellow-500
        ctx.lineWidth = 3
        ctx.stroke()

        // 현재 값 표시
        const currentValue = dataPoints.current[dataPoints.current.length - 1].value
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 24px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`₩${Math.round(currentValue).toLocaleString()}`, 20, 40)

        ctx.font = '14px sans-serif'
        ctx.fillStyle = '#9ca3af'
        ctx.fillText('1코인당 실시간 가치', 20, 65)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="w-full bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: '200px' }}
      />
    </div>
  )
}

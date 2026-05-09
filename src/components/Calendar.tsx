'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'

interface CalendarProps {
  /** Set of date strings (YYYY-MM-DD) that have data */
  activeDates: Set<string>
  /** Called when user clicks a date that has data */
  onSelectDate: (date: string) => void
  /** Currently selected date */
  selectedDate: string | null
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function formatYM(year: number, month: number) {
  return `${year}年${month + 1}月`
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export default function Calendar({ activeDates, onSelectDate, selectedDate }: CalendarProps) {
  const today = new Date()
  // 默认显示选中日期所在的月份，没有则显示今天
  const initDate = selectedDate ? new Date(selectedDate) : today
  const [year, setYear] = useState(initDate.getFullYear())
  const [month, setMonth] = useState(initDate.getMonth())
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const cells = useMemo(() => {
    const arr: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(d)
    return arr
  }, [firstDay, daysInMonth])

  // 切换月份时同步到选中日期
  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const pickDate = useCallback((dateStr: string) => {
    onSelectDate(dateStr)
    setOpen(false)
  }, [onSelectDate])

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const displayLabel = selectedDate ? formatDateShort(selectedDate) : '选择日期'

  return (
    <div style={{ position: 'relative', marginBottom: 20 }}>
      {/* 触发按钮 */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: selectedDate ? 'rgba(0,217,255,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${selectedDate ? 'rgba(0,217,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 10,
          padding: '8px 14px',
          cursor: 'pointer',
          fontSize: 14,
          color: selectedDate ? '#00d9ff' : '#888',
          transition: 'all 0.2s',
        }}
      >
        <span>📅</span>
        <span>{displayLabel}</span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* 弹出面板 */}
      <div
        ref={panelRef}
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 8,
          zIndex: 200,
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: 16,
          width: 300,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.96)',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
        }}>
          <button onClick={prevMonth} style={{
            background: 'none', border: 'none', color: '#888', cursor: 'pointer',
            fontSize: 16, padding: '2px 6px', borderRadius: 6,
          }}>◀</button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#ccc' }}>{formatYM(year, month)}</span>
          <button onClick={nextMonth} style={{
            background: 'none', border: 'none', color: '#888', cursor: 'pointer',
            fontSize: 16, padding: '2px 6px', borderRadius: 6,
          }}>▶</button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#555', padding: '2px 0' }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((day, i) => {
            if (day === null) return <div key={`pad-${i}`} />
            const dateStr = toDateStr(year, month, day)
            const hasData = activeDates.has(dateStr)
            const isSelected = selectedDate === dateStr
            const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate()

            return (
              <button
                key={dateStr}
                onClick={() => hasData && pickDate(dateStr)}
                disabled={!hasData}
                style={{
                  aspectRatio: '1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8,
                  border: isToday ? '1px solid rgba(0,217,255,0.4)' : '1px solid transparent',
                  cursor: hasData ? 'pointer' : 'default',
                  fontSize: 13,
                  fontWeight: isToday ? 700 : 400,
                  transition: 'background 0.12s, color 0.12s',
                  background: isSelected ? 'rgba(0,217,255,0.25)' : hasData ? 'rgba(0,255,136,0.08)' : 'transparent',
                  color: isSelected ? '#00d9ff' : hasData ? '#00ff88' : '#333',
                }}
                onMouseEnter={e => {
                  if (hasData && !isSelected) e.currentTarget.style.background = 'rgba(0,217,255,0.12)'
                }}
                onMouseLeave={e => {
                  if (hasData && !isSelected) e.currentTarget.style.background = 'rgba(0,255,136,0.08)'
                }}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Footer hint */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: '#555' }}>
          <span>🟢 有数据的日子可点击</span>
          {selectedDate && (
            <button
              onClick={() => { onSelectDate(selectedDate); setOpen(false) }}
              style={{ background: 'none', border: 'none', color: '#00d9ff', cursor: 'pointer', fontSize: 11, padding: 0 }}
            >
              清除筛选
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

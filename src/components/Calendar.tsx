'use client'

import { useState, useMemo, useCallback } from 'react'

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

export default function Calendar({ activeDates, onSelectDate, selectedDate }: CalendarProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [expanded, setExpanded] = useState(false)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const cells = useMemo(() => {
    const arr: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(d)
    return arr
  }, [firstDay, daysInMonth])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const toggleExpand = useCallback(() => {
    setExpanded(prev => !prev)
  }, [])

  const isToday = (day: number) =>
    year === today.getFullYear() && month === today.getMonth() && day === today.getDate()

  // Compact view: just show month/year and toggle button
  if (!expanded) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 20,
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }} onClick={toggleExpand}>
        <span style={{ color: '#888', fontSize: 14 }}>📅 {formatYM(year, month)}</span>
        <span style={{ color: '#666', fontSize: 12 }}>展开日历 ▼</span>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <button
          onClick={prevMonth}
          style={{
            background: 'none', border: 'none', color: '#888', cursor: 'pointer',
            fontSize: 18, padding: '4px 8px', borderRadius: 6,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00d9ff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#888')}
        >
          ◀
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#ccc' }}>
          {formatYM(year, month)}
        </span>
        <button
          onClick={nextMonth}
          style={{
            background: 'none', border: 'none', color: '#888', cursor: 'pointer',
            fontSize: 18, padding: '4px 8px', borderRadius: 6,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00d9ff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#888')}
        >
          ▶
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
        marginBottom: 8,
      }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 12, color: '#666', padding: '4px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
      }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`pad-${i}`} />

          const dateStr = toDateStr(year, month, day)
          const hasData = activeDates.has(dateStr)
          const isSelected = selectedDate === dateStr
          const todayFlag = isToday(day)

          return (
            <button
              key={dateStr}
              onClick={() => hasData && onSelectDate(dateStr)}
              disabled={!hasData}
              style={{
                position: 'relative',
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                border: todayFlag ? '1px solid rgba(0,217,255,0.4)' : 'none',
                cursor: hasData ? 'pointer' : 'default',
                fontSize: 14,
                fontWeight: todayFlag ? 700 : 400,
                transition: 'all 0.15s',
                background: isSelected
                  ? 'rgba(0,217,255,0.25)'
                  : hasData
                    ? 'rgba(0,255,136,0.1)'
                    : 'rgba(255,255,255,0.02)',
                color: isSelected
                  ? '#00d9ff'
                  : hasData
                    ? '#00ff88'
                    : '#444',
                boxShadow: isSelected
                  ? '0 0 12px rgba(0,217,255,0.2)'
                  : 'none',
              }}
              onMouseEnter={e => {
                if (hasData && !isSelected) {
                  e.currentTarget.style.background = 'rgba(0,217,255,0.12)'
                  e.currentTarget.style.color = '#00d9ff'
                }
              }}
              onMouseLeave={e => {
                if (hasData && !isSelected) {
                  e.currentTarget.style.background = 'rgba(0,255,136,0.1)'
                  e.currentTarget.style.color = '#00ff88'
                }
              }}
              title={hasData ? `${dateStr} — 有数据` : `${dateStr} — 无数据`}
            >
              {day}
              {hasData && (
                <span style={{
                  position: 'absolute',
                  bottom: 4,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: isSelected ? '#00d9ff' : '#00ff88',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: 16,
        justifyContent: 'center',
        marginTop: 12,
        fontSize: 11,
        color: '#666',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'rgba(0,255,136,0.3)', display: 'inline-block',
          }} />
          有数据
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', display: 'inline-block',
          }} />
          无数据
        </span>
      </div>
    </div>
  )
}

export function parseDateParts(dateStr?: string | null) {
  if (!dateStr) return { date: '', time: '', full: '' }
  
  const str = String(dateStr).trim()
  if (!str) return { date: '', time: '', full: '' }

  // Format YYYY-MM-DDTHH:mm... (datetime-local format without Z)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) && !str.includes('Z')) {
    const [datePart, timePart] = str.split('T')
    const [year, month, day] = datePart.split('-')
    const [hStr, mStr] = timePart.split(':')
    const hours = parseInt(hStr, 10)
    const minutes = (mStr || '00').slice(0, 2)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 || 12
    const timeFormatted = `${hour12}:${minutes} ${ampm}`
    return {
      date: `${year}-${month}-${day}`,
      time: timeFormatted,
      full: `${year}-${month}-${day} a las ${timeFormatted}`,
    }
  }

  // Format YYYY-MM-DD (date only)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return {
      date: str,
      time: '',
      full: str,
    }
  }

  // Other formats (ISO with Z, timestamps, etc.)
  try {
    const d = new Date(str)
    if (isNaN(d.getTime())) return { date: str, time: '', full: str }
    const parts = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(d)
    const map: Record<string, string> = {}
    parts.forEach((p) => (map[p.type] = p.value))
    const dateFormatted = `${map.year}-${map.month}-${map.day}`
    const timeFormatted = `${map.hour}:${map.minute} ${map.dayPeriod || ''}`.trim()
    return {
      date: dateFormatted,
      time: timeFormatted,
      full: `${dateFormatted} a las ${timeFormatted}`,
    }
  } catch {
    return { date: str, time: '', full: str }
  }
}

export function formatDateTime(dateStr?: string | null): string {
  return parseDateParts(dateStr).full
}

export function formatDateOnly(dateStr?: string | null): string {
  return parseDateParts(dateStr).date
}

export function formatTimeOnly(dateStr?: string | null): string {
  return parseDateParts(dateStr).time
}

export function getDayName(dateStr?: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
  return days[d.getDay()]
}

export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr || dateStr === '-' || dateStr === '—') return '—'
  if (dateStr.includes('/')) return dateStr
  try {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  } catch {}
  return dateStr
}

export function getReminderInterval(urgency: string): number {
  const u = (urgency || '').toLowerCase()
  if (u === 'very-urgent' || u === 'veryurgent') return 1
  if (u === 'urgent') return 3
  return 5
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function normalizeWeekData(data: any[]) {
  return DAYS.map((name, i) => {
    const found = data.find(d => d.day === i)
    return {
      day: i,
      day_name: name,
      total_sold: found ? found.total_sold : 0
    }
  })
}



export function normalizeMonthWeeks(
  data: { week: number; total_sold: number }[]
) {
  if (data.length === 0) {
    return [
      { week: 1, label: "Week 1", total_sold: 0 },
      { week: 2, label: "Week 2", total_sold: 0 },
      { week: 3, label: "Week 3", total_sold: 0 },
      { week: 4, label: "Week 4", total_sold: 0 },
    ]
  }

  const maxWeek = Math.max(...data.map(d => d.week))

  const base = Array.from({ length: maxWeek }, (_, i) => ({
    week: i + 1,
    label: `Week ${i + 1}`,
    total_sold: 0,
  }))

  for (const item of data) {
    const idx = base.findIndex(w => w.week === item.week)
    if (idx !== -1) {
      base[idx].total_sold = item.total_sold
    }
  }

  return base
}


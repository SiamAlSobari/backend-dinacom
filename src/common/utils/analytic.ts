const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

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


export function normalizeMonthWeeks(data: any[]) {
  const maxWeek = 5
  return Array.from({ length: maxWeek }, (_, i) => {
    const week = i + 1
    const found = data.find(d => d.week === week)
    return {
      week,
      label: `Week ${week}`,
      total_sold: found ? found.total_sold : 0
    }
  })
}

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ReportData = {
  ok: boolean
  data?: {
    kpi: {
      totalCards: number
      thisMonth: number
      totalCompanies: number
      aiInsights: number
      avgImportance: number
      trend: string
    }
    industryData: Array<{
      name: string
      count: number
      percentage: number
    }>
    topCompanies: Array<{
      name: string
      contacts: number
      importance: number
      lastContact: string
    }>
    activityData: Array<{
      week: string
      cards: number
      insights: number
    }>
  }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReportData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    const { period = 'month' } = req.query

    // 기간별 날짜 계산
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // 1. 총 명함 수
    const { count: totalCards } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })

    // 2. 이번 달 명함 수
    const { count: thisMonth } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    // 3. 총 회사 수 (고유한 회사명 개수)
    const { data: companies } = await supabase
      .from('contacts')
      .select('company')
      .not('company', 'is', null)

    const uniqueCompanies = new Set(companies?.map(c => c.company) || [])
    const totalCompanies = uniqueCompanies.size

    // 4. AI 인사이트 수
    const { count: aiInsights } = await supabase
      .from('ai_analysis_history')
      .select('*', { count: 'exact', head: true })

    // 5. 평균 중요도
    const { data: importanceData } = await supabase
      .from('contacts')
      .select('importance')
      .not('importance', 'is', null)

    const avgImportance = importanceData?.length 
      ? (importanceData.reduce((sum, c) => sum + (c.importance || 0), 0) / importanceData.length).toFixed(1)
      : 0

    // 6. 성장률 계산 (이번 달 vs 지난 달)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    
    const { count: lastMonth } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonthStart.toISOString())
      .lte('created_at', lastMonthEnd.toISOString())

    const growthRate = lastMonth && thisMonth 
      ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(0)
      : 0
    const trend = growthRate > 0 ? `+${growthRate}%` : `${growthRate}%`

    // 7. 산업군 분포 (회사명 기반으로 추정)
    const { data: allContacts } = await supabase
      .from('contacts')
      .select('company')
      .not('company', 'is', null)

    const industryMap = new Map<string, number>()
    allContacts?.forEach(contact => {
      if (contact.company) {
        // 간단한 산업군 분류 로직
        let industry = '기타'
        const company = contact.company.toLowerCase()
        
        if (company.includes('소프트웨어') || company.includes('software') || 
            company.includes('개발') || company.includes('tech') || 
            company.includes('it') || company.includes('정보')) {
          industry = '소프트웨어 개발'
        } else if (company.includes('제조') || company.includes('manufacturing') || 
                   company.includes('산업') || company.includes('산업')) {
          industry = '제조업'
        } else if (company.includes('금융') || company.includes('finance') || 
                   company.includes('은행') || company.includes('bank') || 
                   company.includes('증권') || company.includes('보험')) {
          industry = '금융'
        } else if (company.includes('유통') || company.includes('물류') || 
                   company.includes('retail') || company.includes('logistics') || 
                   company.includes('쇼핑') || company.includes('마트')) {
          industry = '유통/물류'
        }
        
        industryMap.set(industry, (industryMap.get(industry) || 0) + 1)
      }
    })

    const industryData = Array.from(industryMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalCards ? Math.round((count / totalCards) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)

    // 8. 주요 고객사 (명함 수 기준)
    const companyCounts = new Map<string, { count: number, importance: number, lastContact: string }>()
    
    const { data: contactsForCompanies } = await supabase
      .from('contacts')
      .select('company, importance, created_at')
      .not('company', 'is', null)

    contactsForCompanies?.forEach(contact => {
      if (contact.company) {
        const existing = companyCounts.get(contact.company)
        if (existing) {
          existing.count++
          existing.importance = Math.max(existing.importance, contact.importance || 0)
          if (contact.created_at > existing.lastContact) {
            existing.lastContact = contact.created_at
          }
        } else {
          companyCounts.set(contact.company, {
            count: 1,
            importance: contact.importance || 0,
            lastContact: contact.created_at
          })
        }
      }
    })

    const topCompanies = Array.from(companyCounts.entries())
      .map(([name, data]) => ({
        name,
        contacts: data.count,
        importance: data.importance,
        lastContact: new Date(data.lastContact).toISOString().split('T')[0]
      }))
      .sort((a, b) => b.contacts - a.contacts)
      .slice(0, 5)

    // 9. 주간 활동량 (최근 4주)
    const activityData = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      
      const { count: weekCards } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString())

      const { count: weekInsights } = await supabase
        .from('ai_analysis_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString())

      activityData.push({
        week: `${4 - i}주차`,
        cards: weekCards || 0,
        insights: weekInsights || 0
      })
    }

    const reportData = {
      kpi: {
        totalCards: totalCards || 0,
        thisMonth: thisMonth || 0,
        totalCompanies,
        aiInsights: aiInsights || 0,
        avgImportance: parseFloat(avgImportance),
        trend
      },
      industryData,
      topCompanies,
      activityData
    }

    return res.status(200).json({ ok: true, data: reportData })

  } catch (error) {
    console.error('Reports API Error:', error)
    return res.status(500).json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch reports data' 
    })
  }
}

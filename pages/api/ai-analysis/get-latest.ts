import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

interface GetLatestAIAnalysisRequest {
  companyName: string;
}

interface GetLatestAIAnalysisResponse {
  ok: boolean;
  analysis?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetLatestAIAnalysisResponse>
) {
  console.log('=== Get Latest AI Analysis API Handler Started ===');
  console.log('Method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { companyName }: GetLatestAIAnalysisRequest = req.body;

    if (!companyName) {
      return res.status(400).json({ ok: false, error: 'Company name is required' });
    }

    console.log('Getting latest AI analysis for company:', companyName);

    // 해당 회사의 가장 최근 AI 분석 결과 가져오기
    const { data: latestAnalysis, error } = await supabaseAdmin
      .from('ai_analysis_history')
      .select('*')
      .eq('company_name', companyName)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터가 없는 경우
        console.log('No AI analysis found for company:', companyName);
        return res.status(404).json({ ok: false, error: 'No AI analysis found for this company' });
      }
      
      // 테이블이 존재하지 않는 경우 특별한 오류 메시지
      if (error.message.includes('relation "ai_analysis_history" does not exist')) {
        console.error('AI analysis history table does not exist');
        return res.status(500).json({ 
          ok: false, 
          error: 'AI 분석 히스토리 테이블이 존재하지 않습니다. 관리자에게 문의하세요.' 
        });
      }
      
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        ok: false, 
        error: `Failed to fetch AI analysis: ${error.message}` 
      });
    }

    console.log('Latest AI analysis found:', latestAnalysis.id);

    // analysis_data가 유효한 객체인지 확인
    const analysisData = latestAnalysis.analysis_data;
    const safeAnalysisData = analysisData && typeof analysisData === 'object' ? analysisData : {};

    res.status(200).json({
      ok: true,
      analysis: {
        company: safeAnalysisData.company || '회사명 없음',
        overview: safeAnalysisData.overview || '분석 정보가 없습니다.',
        industry: safeAnalysisData.industry || '정보 없음',
        solutions: Array.isArray(safeAnalysisData.solutions) ? safeAnalysisData.solutions : [],
        employees: safeAnalysisData.employees || '정보 없음',
        founded: safeAnalysisData.founded || '정보 없음',
        website: safeAnalysisData.website || '정보 없음',
        sources: Array.isArray(safeAnalysisData.sources) ? safeAnalysisData.sources : [],
        sourceDetails: safeAnalysisData.sourceDetails || {
          overview: "정보가 제한적",
          industry: "정보가 제한적",
          employees: "정보가 제한적",
          founded: "정보가 제한적"
        },
        recentNews: Array.isArray(safeAnalysisData.recentNews) ? safeAnalysisData.recentNews : [],
        proposalPoints: Array.isArray(safeAnalysisData.proposalPoints) ? safeAnalysisData.proposalPoints : [],
        lastAnalyzed: new Date(latestAnalysis.created_at).toLocaleDateString('ko-KR'),
        analysisId: latestAnalysis.id
      }
    });

  } catch (error) {
    console.error('Get Latest AI Analysis API error:', error);
    res.status(500).json({
      ok: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

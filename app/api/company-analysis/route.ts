import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  try {
    const { companyName, selfAnalysisData, careerAxis } = await req.json()

    const selfContext = selfAnalysisData ? `
## ユーザーの自己分析結果:
ガクチカ候補: ${selfAnalysisData.gakuchikaCandiates?.map((g: any) => g.title).join('、') || 'なし'}
強み: ${selfAnalysisData.values?.join('、') || 'なし'}` : ''

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: `あなたは新卒就活の企業研究アドバイザーです。以下の企業を分析し、就活生向けのレポートを作成してください。

## 志望企業: ${companyName}
## 就活の軸: ${(careerAxis || []).join('、') || '未選択'}
${selfContext}

## 出力形式（必ずJSON形式で返してください）:
{
  "companyOverview": "企業の概要（2〜3文）",
  "strengths": "企業の強み（2〜3文）",
  "challenges": "企業の課題（2〜3文）",
  "competitors": "主な競合と差別化ポイント（2〜3文）",
  "desiredPerson": "求める人物像の推定（採用ページ・社風から推定、2〜3文）",
  "selectionFlow": "想定される選考フロー（わかる範囲で）",
  "interviewTopics": ["この企業が面接で聞きそうなこと1", "聞きそうなこと2", "聞きそうなこと3"],
  "connectionToExperience": "ユーザーの経験とこの企業の接続点（自己分析データがある場合。ない場合は一般的なアドバイス）",
  "motivationDraft": "志望動機の骨子（「なぜこの業界？」「なぜこの企業？」への回答素材）"
}

重要なルール:
- 推測は「〜と考えられます」「〜の可能性があります」と明記
- 断定的な表現は避ける
- 架空の数字は生成しない
- すべて日本語で回答` }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: '解析に失敗しました' }, { status: 500 })

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (error: any) {
    console.error('Company analysis error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

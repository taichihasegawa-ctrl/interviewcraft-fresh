import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  try {
    const { selfAnalysisData, chatLog, careerAxis } = await req.json()

    // チャットログから一次情報を構成
    const chatContext = chatLog && chatLog.length > 0
      ? `\n## 学生との会話ログ:\n${
          chatLog.map((m: any) => `${m.role === 'user' ? '学生' : 'コーチ'}: ${m.content}`).join('\n')
        }`
      : ''

    const analysisContext = selfAnalysisData ? `
## 自己分析結果:
${selfAnalysisData.gakuchikaCandiates?.map((g: any) => `- ${g.title}: ${g.summary} (強み: ${g.strengths?.join('、')})`).join('\n') || 'なし'}

自己PR素案: ${selfAnalysisData.selfPR || 'なし'}
強み・価値観: ${selfAnalysisData.values?.join('、') || 'なし'}
${selfAnalysisData.selfInsights?.othersView ? `周囲の評価: ${selfAnalysisData.selfInsights.othersView}` : ''}
${selfAnalysisData.selfInsights?.teamRole ? `チームでの役割: ${selfAnalysisData.selfInsights.teamRole}` : ''}
${selfAnalysisData.selfInsights?.workValues ? `仕事の価値観: ${selfAnalysisData.selfInsights.workValues}` : ''}` : ''

    const axisContext = careerAxis && careerAxis.length > 0
      ? `\n## 就活の軸: ${careerAxis.join('、')}`
      : ''

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: `あなたは新卒就活のキャリアアドバイザーです。元大手メーカーの採用担当で、幅広い業界の採用事情に精通しています。

以下の学生の自己分析結果・会話ログ・就活の軸をもとに、この学生の強みが最も活きる業界と企業をおすすめしてください。

${analysisContext}
${chatContext}
${axisContext}

## 出力形式（必ずJSON形式で返してください）:
{
  "summary": "この学生の特徴を2〜3文で要約（「あなたは〇〇な強みを持っているので…」という語りかけ調で）",
  "recommendations": [
    {
      "industry": "おすすめ業界名",
      "matchScore": 5,
      "reason": "この学生の強み・経験がこの業界で活きる理由（2〜3文。具体的にどのエピソード/強みがどう活きるか）",
      "companies": [
        {
          "name": "おすすめ企業名",
          "type": "大手 or 中堅 or ベンチャー",
          "reason": "この学生にこの企業をすすめる理由（1〜2文）"
        }
      ],
      "roles": "この業界で向いている職種（1〜2つ）",
      "tips": "この業界を受ける時のアドバイス（1文）"
    }
  ],
  "unexpectedPick": {
    "industry": "意外なおすすめ業界",
    "reason": "一見関係なさそうだが、この学生の〇〇という経験/強みは実は〇〇業界で高く評価される理由（2〜3文）",
    "companies": [
      {
        "name": "企業名",
        "type": "大手 or 中堅 or ベンチャー",
        "reason": "理由（1文）"
      }
    ]
  }
}

## ルール:
- recommendationsは3〜5業界。matchScoreは5段階（5が最高）
- 各業界のcompaniesは2〜3社。大手/中堅/ベンチャーのバランスを意識
- unexpectedPickは必ず1つ。学生が自分では思いつかないような意外な業界を提案し、視野を広げる
- 学生の具体的なエピソードや強みと紐づけて理由を説明すること（「あなたの〇〇の経験は…」のように）
- 推測は「〜と考えられます」と明記
- すべて日本語で回答
- JSON以外のテキストは出力しない` }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: '解析に失敗しました' }, { status: 500 })

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (error: any) {
    console.error('Industry research error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

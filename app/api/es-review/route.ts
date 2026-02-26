import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const REVIEW_PROMPTS: Record<string, string> = {
  structure: 'STAR法（状況→課題→行動→結果）に沿った構成になっているかを重点的に評価してください。',
  specificity: '数字や固有名詞が含まれているか、具体性があるかを重点的に評価してください。「多くの」「いろいろな」などの曖昧な表現を指摘してください。',
  company_fit: '企業の求める人物像に合っている内容かを重点的に評価してください。',
  differentiation: '他の学生と差がつく内容かを重点的に評価してください。ありがちな表現や内容を指摘してください。',
  char_optimization: '文字数制限内で最大限情報を伝えられているかを重点的に評価してください。無駄な表現の削除提案をしてください。',
}

export async function POST(req: Request) {
  try {
    const { esText, reviewMode, targetCompany, companyData } = await req.json()

    const companyContext = companyData ? `
## 志望企業情報:
企業名: ${targetCompany}
求める人物像: ${companyData.desiredPerson || '不明'}` : targetCompany ? `
## 志望企業: ${targetCompany}` : ''

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: `あなたは新卒就活のES添削のプロです。以下のESを添削してください。

## 添削するES（${esText.length}字）:
${esText}

## 添削の重点ポイント:
${REVIEW_PROMPTS[reviewMode] || REVIEW_PROMPTS.structure}
${companyContext}

## 出力形式（必ずJSON形式で返してください）:
{
  "overallScore": 5段階評価の数値（1〜5）,
  "overallComment": "総合評価コメント（1文）",
  "passGrade": "ES通過可能性（A/B/C）",
  "scores": {
    "structure": 5段階評価,
    "specificity": 5段階評価,
    "company_fit": 5段階評価,
    "differentiation": 5段階評価,
    "char_optimization": 5段階評価
  },
  "improved": "改善後のES全文",
  "advice": "具体的な改善アドバイス（箇条書きではなく文章で。なぜその改善が必要かの理由も含める）"
}

重要なルール:
- 改善後のESもユーザーの元の内容をベースにし、架空の情報は追加しない
- 数字がない場合は「具体的な数字を入れると良い」とアドバイスするが、架空の数字は入れない
- 建設的で、応募者が自信を持てるフィードバックを心がける
- すべて日本語で回答` }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: '解析に失敗しました' }, { status: 500 })

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (error: any) {
    console.error('ES review error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

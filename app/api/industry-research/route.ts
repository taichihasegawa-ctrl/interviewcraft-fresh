import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  try {
    const { industries, careerAxis } = await req.json()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: `あなたは新卒就活の業界研究アドバイザーです。以下の業界について、就活生向けの業界マップを作成してください。

## 興味のある業界:
${industries.join('、')}

## 就活の軸:
${(careerAxis || []).join('、') || '未選択'}

## 出力形式（必ずJSON形式で返してください）:
{
  "industries": [
    {
      "name": "業界名",
      "overview": "業界の特徴・概要（3〜4文）",
      "trend": "最新トレンド（1〜2文）",
      "majorCompanies": "主要企業（大手・中堅・ベンチャーそれぞれ2〜3社）",
      "newGradRoles": "新卒が就く主な職種とキャリアパス",
      "desiredTraits": "この業界で評価される学生の特徴"
    }
  ],
  "axisMatch": "選択した就活の軸との相性分析（2〜3文）"
}

重要：推測は「〜と考えられます」と明記。断定的な表現は避ける。すべて日本語で回答。` }]
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

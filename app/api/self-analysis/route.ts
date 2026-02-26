import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  try {
    const { guideAnswers, freeText } = await req.json()

    const inputSummary = Object.entries(guideAnswers || {})
      .filter(([, v]) => (v as string).trim())
      .map(([k, v]) => `【${k}】${v}`)
      .join('\n') + (freeText ? `\n【フリー入力】${freeText}` : '')

    if (!inputSummary.trim()) {
      return NextResponse.json({ error: '入力が空です' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: `あなたは就活アドバイザーです。以下の大学生の経験を分析し、ガクチカ候補と自己PRの素材を抽出してください。

## 入力された経験:
${inputSummary}

## 出力形式（必ずJSON形式で返してください）:
{
  "gakuchikaCandiates": [
    {
      "title": "ガクチカのタイトル（例：飲食店での新人教育改革）",
      "summary": "エピソードの要約（3〜4文）",
      "strengths": ["この経験で伝わる強み1", "強み2", "強み3"]
    }
  ],
  "selfPR": "自己PRの素案（300字程度。STAR法で構成）",
  "values": ["主体性", "協調性", "課題解決力"]
}

重要なルール:
- ガクチカ候補は最大3つ抽出。入力が少ない場合でも、深掘りして1つは提案する
- 「大したことはしていない」という入力にも対応し、日常の工夫からガクチカを見出す
- 架空の数字は絶対に生成しない。ユーザーが数字を入力していない場合は数字を使わない
- 自己PRはユーザーの入力内容のみをベースにする
- すべて日本語で回答` }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: '解析に失敗しました' }, { status: 500 })

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (error: any) {
    console.error('Self-analysis error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

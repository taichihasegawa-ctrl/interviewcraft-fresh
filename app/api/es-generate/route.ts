import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  try {
    const { question, charLimit, targetCompany, selfAnalysisData, companyData, selectedGakuchika, esType } = await req.json()

    const gakuchika = selfAnalysisData?.gakuchikaCandiates?.[selectedGakuchika || 0]
    const gakuchikaContext = gakuchika ? `
## 使用するエピソード:
タイトル: ${gakuchika.title}
概要: ${gakuchika.summary}
強み: ${gakuchika.strengths?.join('、')}` : ''

    const selfPRContext = selfAnalysisData?.selfPR ? `
## 自己PR素案:
${selfAnalysisData.selfPR}` : ''

    const valuesContext = selfAnalysisData?.values ? `
## 本人の強み・価値観:
${selfAnalysisData.values.join('、')}` : ''

    const companyContext = companyData ? `
## 志望企業情報:
企業名: ${targetCompany}
求める人物像: ${companyData.desiredPerson || '不明'}` : targetCompany ? `
## 志望企業: ${targetCompany}` : ''

    const charInstruction = charLimit > 0 ? `文字数は${charLimit}字の95〜100%に収めてください（${Math.floor(charLimit * 0.95)}〜${charLimit}字）。` : '文字数制限はありません。400字程度を目安にしてください。'

    // 設問タイプ別の指示
    let typeInstruction = ''
    if (esType === 'self_pr') {
      const insights = selfAnalysisData?.selfInsights
      const insightsContext = insights ? `
## 自己PR用の素材:
${insights.othersView ? `- 周囲の評価: ${insights.othersView}` : ''}
${insights.selfStrength ? `- 自覚する強み: ${insights.selfStrength}` : ''}
${insights.teamRole ? `- チームでの役割: ${insights.teamRole}` : ''}
${insights.workValues ? `- 仕事の価値観: ${insights.workValues}` : ''}` : ''

      typeInstruction = `
## 自己PRの書き方:
- 選択されたエピソードを軸に、本人の強み・価値観を具体的に伝える
- 冒頭で強みを端的に述べ、エピソードで裏付ける構成にする
- 企業が求める人物像がある場合、それとの接点を意識する
- 自己PR素案がある場合はそれを参考にしつつ、より洗練された文章にする
${selfPRContext}
${valuesContext}
${insightsContext}`
    } else if (esType === 'motivation') {
      typeInstruction = `
## 志望動機の書き方:
- 選択されたエピソードから得た経験・価値観と、志望企業の接点を明確にする
- 「なぜこの業界か」→「なぜこの企業か」→「入社後どう貢献したいか」の流れ
- 企業情報がある場合は具体的な事業や方針に触れる
${valuesContext}`
    } else if (esType === 'gakuchika') {
      typeInstruction = `
## ガクチカの書き方:
- 選択されたエピソードに特化して深く掘り下げる
- STAR法（状況→課題→行動→結果）を厳密に守る
- 「何をしたか」だけでなく「なぜそうしたか」「どう工夫したか」を重視する`
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: `あなたは新卒就活のES作成アドバイザーです。以下の設問に対するESを作成してください。

## 設問:
${question}

## 文字数:
${charInstruction}
${gakuchikaContext}
${typeInstruction}
${companyContext}

## 出力形式（必ずJSON形式で返してください）:
{
  "es": "作成したES本文",
  "charCount": 文字数（数値）,
  "explanation": "この構成にした理由（どのエピソード・強みをどう使ったか）",
  "tips": "このESをさらに良くするための具体的なアドバイス"
}

重要なルール:
- ユーザーが提供した情報のみを使用し、架空の数字や事実は絶対に生成しない
- ユーザーの経験データがない部分は「〇〇」のようなプレースホルダーにする
- 企業の求める人物像がある場合は、それに合わせた表現を心がける
- すべて日本語で回答` }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: '解析に失敗しました' }, { status: 500 })

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (error: any) {
    console.error('ES generate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

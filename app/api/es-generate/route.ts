import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ============================================================
// 文字数別の構成テンプレート
// ============================================================
function getStructureTemplate(charLimit: number, esType: string): string {
  const limit = charLimit || 400

  if (esType === 'gakuchika') {
    if (limit <= 250) {
      return `
【200〜250字構成】要点凝縮型
- 結論（強み/成果）: 1文（〜30字）
- 状況+課題: 1〜2文（〜60字）
- 行動（最もインパクトのある1つに絞る）: 2文（〜80字）
- 結果（数字必須）: 1文（〜40字）
- 学び/活かし方: 1文（〜40字）`
    } else if (limit <= 450) {
      return `
【300〜450字構成】標準型
- 導入（結論ファースト。何をして何を得たか1文で）: 〜40字
- 状況説明（背景、自分の立場・役割）: 〜60字
- 課題（何が問題だったか。具体的に）: 〜50字
- 行動（自分が主体的にやったこと。2〜3つの工夫）: 〜120字 ← ここが最重要。配分を厚く
- 結果（数字や変化で示す）: 〜60字
- 学び・今後への活かし方: 〜50字`
    } else {
      return `
【500字以上構成】詳細型
- 導入（結論ファースト）: 〜50字
- 状況（組織の規模、背景、自分の立場）: 〜80字
- 課題発見（なぜそれを課題と感じたか、動機）: 〜70字
- 行動① 分析/計画: 〜80字
- 行動② 実行/工夫の詳細: 〜100字 ← 最重要パート
- 行動③ 周囲の巻き込み/困難の乗り越え方: 〜80字
- 結果（定量+定性の両面）: 〜80字
- 学び+入社後の活かし方: 〜60字`
    }
  }

  if (esType === 'self_pr') {
    if (limit <= 250) {
      return `
【200〜250字構成】
- 強み宣言: 1文（〜30字）
- 裏付けエピソード（最もインパクトのある1つ）: 3〜4文（〜150字）
- 入社後の活かし方: 1文（〜50字）`
    } else if (limit <= 450) {
      return `
【300〜450字構成】
- 強み宣言（端的に。「私の強みは〇〇です」は避け、印象的な表現で）: 〜40字
- 強みの根拠エピソード（STAR法で1つ深掘り）: 〜200字
- 強みを裏付ける別の場面（1〜2文で補強）: 〜60字
- この強みを御社でどう活かすか: 〜80字`
    } else {
      return `
【500字以上構成】
- 強み宣言（印象的な書き出し）: 〜50字
- メインエピソード（STAR法で詳細に）: 〜250字
- サブエピソード（別の場面で同じ強みが発揮された例）: 〜100字
- 周囲からの評価（第三者の言葉があればベスト）: 〜50字
- 御社での活かし方（具体的な場面を想定）: 〜80字`
    }
  }

  if (esType === 'motivation') {
    if (limit <= 250) {
      return `
【200〜250字構成】
- 志望理由の結論: 1文（〜40字）
- 自分の経験/価値観との接点: 2文（〜100字）
- 入社後の貢献: 1〜2文（〜80字）`
    } else if (limit <= 450) {
      return `
【300〜450字構成】
- きっかけ/結論: 〜50字
- なぜこの業界か（原体験と接続）: 〜80字
- なぜこの企業か（他社との差別化。具体的な事業/方針に触れる）: 〜120字
- 入社後に何をしたいか（具体的に）: 〜100字`
    } else {
      return `
【500字以上構成】
- 結論（御社を志望する理由を端的に）: 〜50字
- 原体験（なぜこの分野に関心を持ったか）: 〜100字
- 業界への共感（業界の課題/可能性への理解）: 〜80字
- 御社ならではの魅力（具体的な事業/取り組み/理念に言及）: 〜120字
- 自分が貢献できること（強み×企業ニーズ）: 〜80字
- 入社後のビジョン: 〜70字`
    }
  }

  // custom type
  return `文字数 ${limit}字に合わせて適切に構成してください。結論ファースト、具体例、学び/今後の順で。`
}

// ============================================================
// API Handler: 2段階生成
// ============================================================
export async function POST(req: Request) {
  try {
    const {
      question, charLimit, targetCompany,
      selfAnalysisData, companyData, selectedGakuchika,
      esType, chatLog
    } = await req.json()

    // === 素材の整理 ===
    const gakuchika = selfAnalysisData?.gakuchikaCandiates?.[selectedGakuchika || 0]

    // チャットログから一次情報を抽出
    const chatContext = chatLog && chatLog.length > 0
      ? `\n## 学生との会話ログ（一次情報。ここに具体的な数字や感情がある）:\n${
          chatLog.map((m: any) => `${m.role === 'user' ? '学生' : 'コーチ'}: ${m.content}`).join('\n')
        }`
      : ''

    const gakuchikaContext = gakuchika ? `
## 分析で抽出されたエピソード:
タイトル: ${gakuchika.title}
概要: ${gakuchika.summary}
強み: ${gakuchika.strengths?.join('、')}` : ''

    const selfPRContext = selfAnalysisData?.selfPR ? `
## 自己PR素案:
${selfAnalysisData.selfPR}` : ''

    const valuesContext = selfAnalysisData?.values ? `
## 本人の強み・価値観:
${selfAnalysisData.values.join('、')}` : ''

    const insightsContext = selfAnalysisData?.selfInsights ? `
## 自己認識:
${selfAnalysisData.selfInsights.othersView ? `- 周囲の評価: ${selfAnalysisData.selfInsights.othersView}` : ''}
${selfAnalysisData.selfInsights.selfStrength ? `- 自覚する強み: ${selfAnalysisData.selfInsights.selfStrength}` : ''}
${selfAnalysisData.selfInsights.teamRole ? `- チームでの役割: ${selfAnalysisData.selfInsights.teamRole}` : ''}
${selfAnalysisData.selfInsights.workValues ? `- 仕事の価値観: ${selfAnalysisData.selfInsights.workValues}` : ''}` : ''

    const companyContext = companyData ? `
## 志望企業の詳細情報:
企業名: ${targetCompany}
企業概要: ${companyData.companyOverview || '不明'}
企業の強み: ${companyData.strengths || '不明'}
企業の課題: ${companyData.challenges || '不明'}
競合との差別化: ${companyData.competitors || '不明'}
求める人物像: ${companyData.desiredPerson || '不明'}
ユーザーの経験との接点: ${companyData.connectionToExperience || '不明'}
志望動機の骨子: ${companyData.motivationDraft || '不明'}` : targetCompany ? `
## 志望企業: ${targetCompany}` : ''

    const charInstruction = charLimit > 0
      ? `目標文字数: ${charLimit}字（${Math.floor(charLimit * 0.95)}〜${charLimit}字に収めること。1字でもオーバーは不可）`
      : '目標文字数: 400字程度'

    const structureTemplate = getStructureTemplate(charLimit || 400, esType || 'gakuchika')

    // ================================================================
    // STEP 1: 構成案の生成
    // ================================================================
    const step1Response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: `あなたは大手企業の元採用担当者（ES審査歴10年、累計50,000枚以上を評価）です。

採用担当として、以下のESを「通過させたくなる」構成案を作ってください。

## 設問:
${question}

## ${charInstruction}

## 推奨構成テンプレート:
${structureTemplate}
${gakuchikaContext}
${chatContext}
${selfPRContext}
${valuesContext}
${insightsContext}
${companyContext}

## 構成案の作成ルール:

### 素材の使い方
- 会話ログがある場合、そこから「具体的な数字」「本人の言葉」「感情が込もった表現」を最優先で拾う
- 分析結果の要約は骨格として使い、会話ログの一次情報で肉付けする
- 本人が話していない情報は絶対に使わない。情報が不足する箇所は「【要確認: 〇〇の数字】」と明記

### 採用担当が見るポイント
- 最初の1文で「この学生に会いたい」と思わせる（結論ファースト、ただし「私は〇〇です」の定型は避ける）
- 「行動」パートが最重要。「何をしたか」だけでなく「なぜその方法を選んだか」の思考プロセスが見たい
- 数字は絶対。Before/Afterの変化を定量で示せると説得力が段違い
- 最後は「再現性」。この強みが入社後も発揮されると確信できるか

### 出力形式:
以下の形式で構成案を出力してください。

導入（〇字）: [書く内容の要点]
---
本論①（〇字）: [書く内容の要点]
---
本論②（〇字）: [書く内容の要点]
---
本論③（〇字）: [書く内容の要点]
---
結び（〇字）: [書く内容の要点]
---
使う素材: [会話ログから拾った具体的な数字・表現のリスト]
---
差別化ポイント: [この学生ならではの独自性]` }]
    })

    const outline = step1Response.content[0].type === 'text' ? step1Response.content[0].text : ''

    // ================================================================
    // STEP 2: 構成案をもとに本文を生成
    // ================================================================
    const step2Response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: `あなたは就活ES専門のプロライターです。以下の構成案をもとに、ES本文を執筆してください。

## 設問:
${question}

## ${charInstruction}

## 構成案（STEP 1で作成済み）:
${outline}

## 執筆ルール:

### 文体
- 「です・ます」調で統一
- 一文は60字以内を目安（読みやすさ）
- 接続詞は最小限。文のつながりは内容で示す
- 「〜という経験を通じて」「〜することができました」などの冗長表現を排除
- 体言止めは使わない

### 構成の鉄則
- 第1文が勝負。採用担当は30秒で判断する。最初の1文で「おっ」と思わせる
- 「私は〇〇です」「私は〇〇と申します」で始めない
- 行動パートでは「考え→実行→工夫」の思考プロセスを見せる
- 結果は必ず数字を含める。数字がない場合は「【〇〇の数字を記入】」とする
- 最終文は「入社後の再現性」を感じさせるものにする

### 品質チェック（書き上げた後に自己検証）
- [ ] 設問に正面から答えているか
- [ ] 「この人に会いたい」と思える内容か
- [ ] 具体性があるか（いつ・どこで・何人で・何を・どう変わった）
- [ ] 行動の「なぜ」が書かれているか
- [ ] 他の学生と差別化できているか
- [ ] 文字数は目標の95〜100%に収まっているか

### 出力形式（必ずJSON形式で返してください）:
{
  "es": "完成したES本文",
  "charCount": 文字数（数値）,
  "outline": "使用した構成の概要（例: 結論→状況→課題→行動3つ→結果→学び）",
  "keyMaterials": "会話ログから使用した具体的な素材（数字・表現）のリスト",
  "differentiator": "このESの差別化ポイント",
  "improvementHints": "さらに良くするために本人が追加できる情報（例: 具体的な数字、第三者の評価など）"
}

重要:
- 構成案の「使う素材」に挙がった数字・表現を必ず本文に組み込む
- 本人が話していない情報は絶対に創作しない
- 情報不足箇所は「【〇〇】」のプレースホルダーにする
- JSON以外のテキストは出力しない` }]
    })

    const text = step2Response.content[0].type === 'text' ? step2Response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'ES生成に失敗しました' }, { status: 500 })

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (error: any) {
    console.error('ES generate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

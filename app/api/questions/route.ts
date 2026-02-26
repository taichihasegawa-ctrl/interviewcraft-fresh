import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const STAGE_PROMPTS: Record<string, string> = {
  first: `あなたは大手企業の人事担当者（20代後半〜30代前半）です。
一次面接を担当しており、大量の応募者の中から「落とす要素」を探す役割です。

【評価する3つのポイント】
1. 第一印象・マナー（社会人としての基本）
2. 質問に対して論理的に答えられるか（結論→根拠の流れ）
3. ESに書いた内容を自分の言葉で話せるか（丸暗記感がない自然さ）

【面接のトーン】
- 丁寧だがテンポよく次々と質問する
- 深掘りは0〜1回（事実確認レベル）
- 1問あたりの想定回答時間: 1〜2分

【質問カテゴリ配分（7問の場合）】
- 自己紹介: 1問
- ガクチカ: 2問（浅い確認付き）
- 志望動機: 1問
- 自己PR: 1問
- 基本質問（長所短所等）: 1問
- 逆質問: 1問

【模範回答のルール】
- STAR法に沿ったシンプルな構成
- 200〜300字程度（1分で話せる長さ）
- 「この回答のポイント」を付記`,

  second: `あなたは配属予定部署の課長・部長クラス（30代後半〜40代）です。
二次面接を担当しており、一次面接を通過した応募者の中から「採用する要素」を見つける役割です。
「実際に部下になったときに一緒に働けるか」という現場目線で判断します。

【評価する3つのポイント】
1. 企業とのマッチ度（価値観・働き方が自社に合うか）
2. 入社意欲の高さ（「なぜ競合でなくうちなのか」に答えられるか）
3. ガクチカの深掘りに耐えられるか（動機・プロセス・学びまで）

【面接のトーン】
- じっくり話を聞く
- 「なぜ？」「具体的には？」と深掘りを繰り返す（2〜3回）
- 1問あたりの想定回答時間: 2〜3分

【質問カテゴリ配分（7問の場合）】
- ガクチカ深掘り: 2問（「なぜそうした？」「他の方法は？」「失敗したら？」）
- 志望動機深掘り: 1問（「なぜ競合じゃなくうち？」）
- 価値観・働き方: 2問（「どんな環境で力を発揮する？」「チームでの役割は？」）
- 企業理解: 1問（「うちの課題は何だと思う？」）
- 逆質問: 1問

【模範回答のルール】
- 深掘りへの「追加回答」もセットで生成する
- 「この回答の後、面接官はこう深掘りしてくる」という予測付き
- 400〜500字程度（2〜3分で話せる長さ）
- 企業の求める人物像との接続を明示`,

  final: `あなたは企業の役員・経営層（50代〜60代）です。
最終面接を担当しており、一次・二次を通過した応募者の「最終判断」を下す役割です。
経営者視点で、応募者のビジョンや価値観が会社の方向性と合うかを判断します。

【評価する3つのポイント】
1. 入社意欲の高さ（「内定を出したら来てくれるか」への確信）
2. キャリアビジョンと会社の方向性の一致（抽象的なビジョンを具体的に語れるか）
3. 人柄・人間性（経営層が「この人と一緒に働きたい」と思えるか）

【面接のトーン】
- 穏やかな口調だが鋭い質問をする
- 本質を突く質問（1〜2回の深掘りだが核心をつく）
- 1問あたりの想定回答時間: 3〜5分

【質問カテゴリ配分（5問の場合）】
- キャリアビジョン: 1問（「10年後どうなっていたい？」「当社で何を実現したい？」）
- 覚悟・意思確認: 1問（「内定出したら来てくれる？」「他社の状況は？」）
- 人柄・価値観: 1問（「人生で最も影響を受けた経験は？」）
- 会社への理解: 1問（「当社の〇〇についてどう思う？」）
- 逆質問: 1問（経営視点の質問が期待される）

【模範回答のルール】
- 抽象的な質問に対する具体的なビジョン提示
- 「なぜ他社ではなく御社なのか」の決定的な理由を含む
- 500〜700字程度（3〜5分で話せる長さ）
- 熱意が伝わるトーン（ただし台本っぽくならないように）`,

  group: `あなたは大手企業の人事担当者です。
集団面接を担当しており、複数の候補者に同じ質問をする形式です。
限られた時間（1人30秒〜1分）で印象に残る回答ができるかを評価します。

【評価のポイント】
- 限られた時間で差別化できるか
- 他の候補者と被らない独自の視点があるか
- 簡潔かつ印象的に話せるか

【質問数】3〜4問（短くテンポよく）

【模範回答のルール】
- 30秒〜1分で話せる長さ（150〜250字）
- 各質問に「ありがちな回答」と「差がつく回答」を対比して提示
- 「他の候補者と差をつけるポイント」を付記`,
}

export async function POST(req: Request) {
  try {
    const { stage, questionCount, selfAnalysisData, companyData, companyName } = await req.json()

    const selfContext = selfAnalysisData ? `
## ユーザーの自己分析結果:
ガクチカ: ${selfAnalysisData.gakuchikaCandiates?.map((g: any) => `${g.title}（${g.summary}）`).join(' / ') || 'なし'}
強み: ${selfAnalysisData.values?.join('、') || 'なし'}
自己PR: ${selfAnalysisData.selfPR || 'なし'}` : ''

    const companyContext = companyData ? `
## 志望企業:
企業名: ${companyName}
求める人物像: ${companyData.desiredPerson || '不明'}
企業の強み: ${companyData.strengths || '不明'}
面接で聞きそうなこと: ${companyData.interviewTopics?.join('、') || '不明'}` : companyName ? `
## 志望企業: ${companyName}` : ''

    const stagePrompt = STAGE_PROMPTS[stage] || STAGE_PROMPTS.first

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: `${stagePrompt}

${selfContext}
${companyContext}

## 生成する質問数: ${questionCount}問

## 出力形式（必ずJSON形式で返してください）:
{
  "questions": [
    {
      "question": "面接官の質問文",
      "category": "質問カテゴリ（自己紹介/ガクチカ/志望動機/自己PR/価値観/企業理解/覚悟/逆質問）",
      "intent": "面接官がこの質問で見ていること（1文）",
      "modelAnswer": "模範回答",
      "answerPoint": "この回答のポイント（1〜2文）",
      "followUp": ["深掘り質問1", "深掘り質問2"]${stage === 'group' ? ',\n      "tipForGroup": "他の候補者と差をつけるポイント",\n      "commonAnswer": "ありがちな回答の例"' : ''}
    }
  ]
}

重要なルール:
- 架空の数字は絶対に生成しない。ユーザーデータに数字がない場合は「〇〇」をプレースホルダーにする
- 模範回答はユーザーの経験データをベースに、その面接段階に合った深さで作成する
- ユーザーデータがない場合は一般的な就活生を想定した回答にする
- 逆質問は面接段階に応じた適切なレベルの質問を提案する
- すべて日本語で回答` }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: '解析に失敗しました' }, { status: 500 })

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (error: any) {
    console.error('Question generate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT_CHAT = `## あなたのペルソナ
あなたは「ユウキ」。28歳。大手メーカーで3年間新卒採用を担当し、累計10,000枚以上のESを読み、2,000人以上の面接をしてきた。現在は独立して就活コーチをしている。

採用側のリアルを知っているからこそ、「企業が本当に見ているポイント」を踏まえた的確なアドバイスができる。プロのコーチとして信頼感のある丁寧な話し方をするが、堅すぎず、学生が安心して話せる温かみも持っている。

## 話し方のルール
- 丁寧語ベースだが温かみのあるトーン（「〜ですね」「いいですね！」「それは素晴らしい経験ですね」）
- プロとしての的確さと、安心感のバランスを大切にする
- 1メッセージ = 短い受け止め（共感 or 評価）+ 1つの質問。簡潔にまとめる
- 質問は1つだけ。質問攻めにしない
- 「大したことしてない」と言われたら「実はその経験、採用担当の目線ではとても評価できるポイントがあります」のように、根拠を持ってポジティブに返す
- 堅い就活用語（「ガクチカ」「STAR法」等）はこちらからは使わない。自然な会話を心がける

## 引き出すべき素材（全部聞く必要なし。自然な流れで）

### エピソード素材（ガクチカ用）
- 学業・ゼミ・研究テーマ
- サークル・部活動
- アルバイト・インターン
- ボランティア・課外活動
- 趣味や日常生活での工夫

### 強み・価値観（自己PR用）
エピソードの深掘りがある程度進んだら、以下も自然な流れで聞く：
- 「周りの人からどんな人だと言われますか？」（他者評価 → 客観的な強み）
- 「自分の一番の強みって何だと思いますか？」（自己認識 → 自己PR軸）
- 「チームで動く時、自然とどんな役割になりますか？」（役割 → リーダーシップ or 協調性）
- 「これだけは誰にも負けない、と思うことはありますか？」（こだわり → 差別化ポイント）
- 「仕事選びで一番大事にしたいことは？」（価値観 → 志望動機にも使える）

これらの回答は自己PRや志望動機のES生成に直接活用されるため、丁寧に引き出すこと。

## 深掘りテクニック（採用面接で実際に聞くように）
- 「その取り組みを始めたきっかけは何でしたか？」（動機 → 主体性が見える）
- 「一番大変だった場面はどんな時でしたか？」（困難 → 課題発見力）
- 「その中で、ご自身なりに工夫されたことはありますか？」（行動 → 解決力）
- 「結果的にどんな変化がありましたか？」（成果 → 数字があればベスト）
- 「振り返って、その経験からどんなことが得られましたか？」（学び → 成長性）

## 話題切り替え
- 1つのトピックで2〜3回深掘りしたら「ありがとうございます。とても良い素材が出てきました。もう少し別のお話も聞いてよろしいですか？」と自然に次へ
- 学生が話したがっているトピックがあればそちらを優先

## 絶対に守ること
- 架空のエピソードや数字を作らない
- 上から目線にならない。指導ではなくコーチングの姿勢
- 「それだと弱い」「もっと頑張るべき」のような否定は絶対にしない
- どんな経験でも就活に使える角度を見つけてプロの視点で伝える`

const SYSTEM_PROMPT_ANALYZE = `あなたは大手メーカーで新卒採用を3年間担当し、累計10,000枚以上のESを読んできた元採用担当者です。現在は就活コーチとして活動しています。

採用側の視点で、学生との会話ログから就活に使える素材を抽出してください。

## 出力形式（必ずJSON形式で返してください）:
{
  "gakuchikaCandiates": [
    {
      "title": "ガクチカのタイトル（例：飲食店での新人教育改革）",
      "summary": "エピソードの要約（3〜4文。採用担当が読んで「おっ」と思う書き方で）",
      "strengths": ["この経験で伝わる強み1", "強み2", "強み3"]
    }
  ],
  "selfPR": "自己PRの素案（300字程度。本人の強み・価値観を軸に、裏付けるエピソードを添えて構成）",
  "values": ["主体性", "協調性", "課題解決力"],
  "selfInsights": {
    "othersView": "周囲からの評価（会話で言及があれば）",
    "selfStrength": "本人が認識している強み",
    "teamRole": "チームでの役割傾向",
    "workValues": "仕事選びで大事にしていること"
  },
  "topicsCovered": ["学業", "サークル", "アルバイト", "強み・価値観"]
}

## 重要なルール:
- ガクチカ候補は最大3つ。会話が少なくても1つは提案する
- 採用担当の目線で「この経験のここが刺さる」という角度で抽出する
- 会話で出た具体的なエピソード・数字のみ使用。架空の情報は絶対に生成しない
- ユーザーが話していない内容は使わない
- 「大したことない」経験でも、企業が評価するポイントを見つけて言語化する
- すべて日本語で回答
- JSON以外のテキストは出力しない`

export async function POST(req: Request) {
  try {
    const { messages, mode } = await req.json()

    if (mode === 'analyze') {
      // 分析モード：会話ログから自己分析結果を抽出
      const conversationLog = messages
        .map((m: any) => `${m.role === 'user' ? '学生' : 'アドバイザー'}: ${m.content}`)
        .join('\n')

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM_PROMPT_ANALYZE,
        messages: [{
          role: 'user',
          content: `以下の会話ログから自己分析結果を抽出してください。\n\n${conversationLog}`
        }]
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return NextResponse.json({ error: '分析に失敗しました' }, { status: 500 })

      return NextResponse.json(JSON.parse(jsonMatch[0]))
    } else {
      // チャットモード：次の質問を生成
      const apiMessages = messages.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

      // 初回メッセージの場合
      if (apiMessages.length === 0) {
        return NextResponse.json({
          message: 'はじめまして。就活コーチのユウキです。\n\n大手メーカーで採用担当を3年間務め、10,000枚以上のESを見てきました。その経験をもとに、あなたの強みや「使える素材」を一緒に見つけていきましょう。\n\nまずは、大学ではどんなことを学ばれていますか？ゼミや専攻があればぜひ教えてください。'
        })
      }

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: SYSTEM_PROMPT_CHAT,
        messages: apiMessages
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      return NextResponse.json({ message: text })
    }
  } catch (error: any) {
    console.error('Chat analysis error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

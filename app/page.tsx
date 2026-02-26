'use client'
import { useState, useEffect, useCallback } from 'react'

// ============================================================
// Types
// ============================================================
type Step = 1 | 2 | 3 | 4
type GuideCategory = 'academic' | 'club' | 'parttime' | 'volunteer' | 'daily'
type ESMode = 'create' | 'review'
type InterviewStage = 'first' | 'second' | 'final' | 'group'
type ESReviewMode = 'structure' | 'specificity' | 'company_fit' | 'differentiation' | 'char_optimization'

interface SelfAnalysisData {
  guideAnswers: Record<string, string>
  freeText: string
  result: any | null
}

interface ResearchData {
  industries: string[]
  companyName: string
  careerAxis: string[]
  industryResult: any | null
  companyResult: any | null
}

interface ESData {
  question: string
  charLimit: number
  targetCompany: string
  selectedGakuchika: number
  generatedES: string
  reviewText: string
  reviewMode: ESReviewMode
  createResult: any | null
  reviewResult: any | null
}

interface InterviewData {
  stage: InterviewStage
  questionCount: number
  questions: any[] | null
  practiceIndex: number
  practiceActive: boolean
  timerSeconds: number
  timerRunning: boolean
}

// ============================================================
// Constants
// ============================================================
const GUIDE_QUESTIONS: Record<GuideCategory, { label: string; question: string; strength: string }> = {
  academic: { label: '学業', question: 'ゼミやレポートで工夫したことはありますか？テーマや取り組み方を教えてください。', strength: '課題解決力・論理的思考' },
  club: { label: 'サークル・部活', question: 'チームで困難だったことと、どう対処したか教えてください。', strength: '協調性・リーダーシップ' },
  parttime: { label: 'アルバイト', question: '売上や業務で改善した例はありますか？具体的に教えてください。', strength: '主体性・成果志向' },
  volunteer: { label: 'ボランティア', question: 'なぜ参加し、何を学びましたか？', strength: '行動力・社会貢献' },
  daily: { label: '日常のエピソード', question: '最近「これはうまくいった」と感じた体験はありますか？', strength: '主体性・柔軟性' },
}

const INDUSTRIES = ['メーカー', 'IT・通信', '金融', '商社', 'コンサル', '広告・メディア', '不動産', '小売・流通', '食品', '人材', '公務員', 'その他']
const CAREER_AXES = ['成長環境', '安定性', '社会貢献', 'グローバル', '裁量権', 'ワークライフバランス', '専門性', 'チームワーク']
const CHAR_LIMITS = [200, 300, 400, 500, 0]

const STAGE_CONFIG: Record<InterviewStage, { label: string; icon: string; desc: string; questionDefault: number; color: string }> = {
  first: { label: '一次面接', icon: '👤', desc: '人事担当者による足切り面接', questionDefault: 7, color: 'bg-blue-500' },
  second: { label: '二次面接', icon: '👔', desc: '現場管理職によるマッチング面接', questionDefault: 7, color: 'bg-indigo-500' },
  final: { label: '最終面接', icon: '🏢', desc: '役員によるビジョン共有面接', questionDefault: 5, color: 'bg-purple-500' },
  group: { label: '集団面接', icon: '👥', desc: '他の候補者との差別化が鍵', questionDefault: 4, color: 'bg-teal-500' },
}

const ES_REVIEW_MODES: Record<ESReviewMode, { label: string; desc: string }> = {
  structure: { label: '構成', desc: 'STAR法に沿っているか' },
  specificity: { label: '具体性', desc: '数字や固有名詞があるか' },
  company_fit: { label: '企業適合', desc: '求める人物像に合っているか' },
  differentiation: { label: '差別化', desc: '他の学生と差がつく内容か' },
  char_optimization: { label: '文字数最適化', desc: '制限内で最大限伝わるか' },
}

// ============================================================
// Main Component
// ============================================================
export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isPaid, setIsPaid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  // STEP 1 State
  const [selfAnalysis, setSelfAnalysis] = useState<SelfAnalysisData>({
    guideAnswers: {}, freeText: '', result: null
  })
  const [inputMode, setInputMode] = useState<'guide' | 'free'>('guide')

  // STEP 2 State
  const [research, setResearch] = useState<ResearchData>({
    industries: [], companyName: '', careerAxis: [], industryResult: null, companyResult: null
  })

  // STEP 3 State
  const [esData, setEsData] = useState<ESData>({
    question: '', charLimit: 400, targetCompany: '', selectedGakuchika: 0,
    generatedES: '', reviewText: '', reviewMode: 'structure',
    createResult: null, reviewResult: null
  })
  const [esMode, setEsMode] = useState<ESMode>('create')

  // STEP 4 State
  const [interview, setInterview] = useState<InterviewData>({
    stage: 'first', questionCount: 7, questions: null,
    practiceIndex: 0, practiceActive: false, timerSeconds: 0, timerRunning: false
  })
  const [showAnswer, setShowAnswer] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('icf_data')
      if (saved) {
        const data = JSON.parse(saved)
        if (data.selfAnalysis) setSelfAnalysis(data.selfAnalysis)
        if (data.research) setResearch(data.research)
        if (data.esData) setEsData(data.esData)
        if (data.isPaid) setIsPaid(data.isPaid)
      }
    } catch {}
  }, [])

  // Save to localStorage
  const saveData = useCallback(() => {
    try {
      localStorage.setItem('icf_data', JSON.stringify({ selfAnalysis, research, esData, isPaid }))
    } catch {}
  }, [selfAnalysis, research, esData, isPaid])

  useEffect(() => { saveData() }, [saveData])

  // Check payment from URL + trial link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('paid') === 'true') {
      setIsPaid(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
    const trial = params.get('trial')
    if (trial) {
      const [expiry, key] = trial.split('_')
      if (new Date(expiry) > new Date() && key === 'FRESH2026') {
        setIsPaid(true)
      }
    }
  }, [])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (interview.timerRunning) {
      interval = setInterval(() => {
        setInterview(prev => ({ ...prev, timerSeconds: prev.timerSeconds + 1 }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [interview.timerRunning])

  // ============================================================
  // API Calls
  // ============================================================
  async function callAPI(endpoint: string, body: any, msg: string) {
    setIsLoading(true)
    setLoadingMessage(msg)
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(`API Error: ${res.status}`)
      return await res.json()
    } catch (err: any) {
      alert(`エラーが発生しました: ${err.message}`)
      return null
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  async function runSelfAnalysis() {
    const result = await callAPI('/api/self-analysis', {
      guideAnswers: selfAnalysis.guideAnswers,
      freeText: selfAnalysis.freeText,
    }, '自己分析中...')
    if (result) setSelfAnalysis(prev => ({ ...prev, result }))
  }

  async function runIndustryResearch() {
    const result = await callAPI('/api/industry-research', {
      industries: research.industries,
      careerAxis: research.careerAxis,
    }, '業界分析中...')
    if (result) setResearch(prev => ({ ...prev, industryResult: result }))
  }

  async function runCompanyAnalysis() {
    const result = await callAPI('/api/company-analysis', {
      companyName: research.companyName,
      selfAnalysisData: selfAnalysis.result,
      careerAxis: research.careerAxis,
    }, '企業分析中...')
    if (result) setResearch(prev => ({ ...prev, companyResult: result }))
  }

  async function runESGenerate() {
    const result = await callAPI('/api/es-generate', {
      question: esData.question,
      charLimit: esData.charLimit,
      targetCompany: esData.targetCompany || research.companyName,
      selfAnalysisData: selfAnalysis.result,
      companyData: research.companyResult,
      selectedGakuchika: esData.selectedGakuchika,
    }, 'ES作成中...')
    if (result) setEsData(prev => ({ ...prev, createResult: result }))
  }

  async function runESReview() {
    const result = await callAPI('/api/es-review', {
      esText: esData.reviewText,
      reviewMode: esData.reviewMode,
      targetCompany: esData.targetCompany || research.companyName,
      companyData: research.companyResult,
    }, 'ES添削中...')
    if (result) setEsData(prev => ({ ...prev, reviewResult: result }))
  }

  async function runQuestionGenerate() {
    const result = await callAPI('/api/questions', {
      stage: interview.stage,
      questionCount: interview.questionCount,
      selfAnalysisData: selfAnalysis.result,
      companyData: research.companyResult,
      companyName: research.companyName,
    }, '質問生成中...')
    if (result) setInterview(prev => ({ ...prev, questions: result.questions || result }))
  }

  async function handleCheckout() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { alert('決済エラーが発生しました') }
    finally { setIsLoading(false) }
  }

  // ============================================================
  // Helpers
  // ============================================================
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const stepCompleted = (s: Step) => {
    if (s === 1) return !!selfAnalysis.result
    if (s === 2) return !!(research.industryResult || research.companyResult)
    if (s === 3) return !!(esData.createResult || esData.reviewResult)
    return !!interview.questions
  }

  const canProceed = (s: Step) => {
    if (s <= 1) return true
    return isPaid
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-brand-600 tracking-tight">InterviewCraft</h1>
            <p className="text-xs text-gray-400 -mt-0.5">Fresh Graduate Edition</p>
          </div>
          {!isPaid && (
            <button onClick={handleCheckout} className="px-4 py-1.5 bg-accent-500 text-white text-sm font-medium rounded-lg hover:bg-accent-600 transition">
              全機能を解放 ¥500
            </button>
          )}
          {isPaid && <span className="text-xs text-accent-600 font-medium bg-accent-50 px-3 py-1 rounded-full">✓ PRO</span>}
        </div>
      </header>

      {/* Step Bar */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1 sm:gap-2">
            {([1, 2, 3, 4] as Step[]).map(s => {
              const labels = ['自己分析', '業界・企業', 'ES作成', '面接対策']
              const icons = ['🔍', '🏭', '✍️', '🎤']
              const completed = stepCompleted(s)
              const active = currentStep === s
              const locked = !canProceed(s)
              return (
                <button
                  key={s}
                  onClick={() => !locked && setCurrentStep(s)}
                  disabled={locked}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-sm font-medium transition-all ${
                    active ? 'bg-brand-500 text-white shadow-md' :
                    completed ? 'bg-accent-50 text-accent-700 border border-accent-200' :
                    locked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                    'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{completed && !active ? '✓' : icons[s-1]}</span>
                  <span className="hidden sm:inline">{labels[s-1]}</span>
                  <span className="sm:hidden text-xs">STEP{s}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-xs">
            <div className="animate-pulse-soft text-4xl mb-4">🤖</div>
            <p className="text-sm font-medium text-gray-700">{loadingMessage}</p>
            <p className="text-xs text-gray-400 mt-2">30秒〜1分ほどお待ちください</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* ============ STEP 1: 自己分析 ============ */}
        {currentStep === 1 && (
          <div className="animate-fadeIn space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">STEP 1: 自己分析</h2>
              <p className="text-sm text-gray-500 mt-1">経験を棚卸しして、ガクチカ・自己PRの素材を見つけましょう</p>
            </div>

            {/* Input Mode Toggle */}
            <div className="flex gap-2">
              <button onClick={() => setInputMode('guide')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${inputMode === 'guide' ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                ガイド付き入力（おすすめ）
              </button>
              <button onClick={() => setInputMode('free')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${inputMode === 'free' ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                フリー入力
              </button>
            </div>

            {inputMode === 'guide' ? (
              <div className="space-y-4">
                {(Object.entries(GUIDE_QUESTIONS) as [GuideCategory, typeof GUIDE_QUESTIONS[GuideCategory]][]).map(([key, q]) => (
                  <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-gray-700">{q.label}</h3>
                      <span className="text-xs text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full">{q.strength}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{q.question}</p>
                    <textarea
                      value={selfAnalysis.guideAnswers[key] || ''}
                      onChange={e => setSelfAnalysis(prev => ({ ...prev, guideAnswers: { ...prev.guideAnswers, [key]: e.target.value } }))}
                      placeholder="具体的に書いてみてください（空欄でもOK）"
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500 mb-3">学業、サークル、アルバイト、趣味など、自分の経験を自由に書いてください。</p>
                <textarea
                  value={selfAnalysis.freeText}
                  onChange={e => setSelfAnalysis(prev => ({ ...prev, freeText: e.target.value }))}
                  placeholder="例: 大学では経済学のゼミでマーケティングを研究。飲食店のアルバイトでは新人教育を担当し..."
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                  rows={10}
                />
              </div>
            )}

            <button
              onClick={runSelfAnalysis}
              disabled={isLoading || (!Object.values(selfAnalysis.guideAnswers).some(v => v.trim()) && !selfAnalysis.freeText.trim())}
              className="w-full py-3 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ✨ AIで自己分析を実行
            </button>

            {/* Results */}
            {selfAnalysis.result && (
              <div className="animate-fadeIn space-y-4">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">分析結果</h3>

                {selfAnalysis.result.gakuchikaCandiates && selfAnalysis.result.gakuchikaCandiates.map((g: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-white bg-brand-500 w-6 h-6 rounded-full flex items-center justify-center">{i + 1}</span>
                      <h4 className="font-bold text-gray-800">{g.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{g.summary}</p>
                    <div className="flex flex-wrap gap-1">
                      {g.strengths?.map((s: string, j: number) => (
                        <span key={j} className="text-xs bg-accent-50 text-accent-700 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}

                {selfAnalysis.result.selfPR && (
                  <div className="bg-brand-50 rounded-xl border border-brand-200 p-5">
                    <h4 className="font-bold text-brand-700 mb-2">自己PR素案</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selfAnalysis.result.selfPR}</p>
                  </div>
                )}

                {selfAnalysis.result.values && (
                  <div className="bg-accent-50 rounded-xl border border-accent-200 p-5">
                    <h4 className="font-bold text-accent-700 mb-2">あなたの強み・価値観</h4>
                    <div className="flex flex-wrap gap-2">
                      {selfAnalysis.result.values.map((v: string, i: number) => (
                        <span key={i} className="text-sm bg-white border border-accent-200 text-accent-700 px-3 py-1 rounded-full">{v}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============ STEP 2: 業界・企業研究 ============ */}
        {currentStep === 2 && (
          <div className="animate-fadeIn space-y-6">
            {!isPaid ? (
              <PaywallCard onCheckout={handleCheckout} />
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">STEP 2: 業界・企業研究</h2>
                  <p className="text-sm text-gray-500 mt-1">興味のある業界と企業を分析して、志望動機の素材を見つけましょう</p>
                </div>

                {/* Industry Selection */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">興味のある業界（複数選択可）</h3>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map(ind => (
                      <button
                        key={ind}
                        onClick={() => setResearch(prev => ({
                          ...prev,
                          industries: prev.industries.includes(ind) ? prev.industries.filter(i => i !== ind) : [...prev.industries, ind]
                        }))}
                        className={`px-3 py-1.5 rounded-lg text-sm transition ${research.industries.includes(ind) ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Career Axis */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">就活の軸（複数選択可）</h3>
                  <div className="flex flex-wrap gap-2">
                    {CAREER_AXES.map(axis => (
                      <button
                        key={axis}
                        onClick={() => setResearch(prev => ({
                          ...prev,
                          careerAxis: prev.careerAxis.includes(axis) ? prev.careerAxis.filter(a => a !== axis) : [...prev.careerAxis, axis]
                        }))}
                        className={`px-3 py-1.5 rounded-lg text-sm transition ${research.careerAxis.includes(axis) ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {axis}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={runIndustryResearch}
                  disabled={isLoading || research.industries.length === 0}
                  className="w-full py-3 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  🏭 業界マップを生成
                </button>

                {/* Industry Result */}
                {research.industryResult && (
                  <div className="animate-fadeIn bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <h3 className="text-lg font-bold text-gray-800">業界マップ</h3>
                    {research.industryResult.industries?.map((ind: any, i: number) => (
                      <div key={i} className="border-l-4 border-brand-400 pl-4">
                        <h4 className="font-bold text-gray-800">{ind.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{ind.overview}</p>
                        {ind.trend && <p className="text-sm text-brand-600 mt-1">📈 トレンド: {ind.trend}</p>}
                        {ind.newGradRoles && <p className="text-sm text-accent-600 mt-1">👤 新卒の主な職種: {ind.newGradRoles}</p>}
                        {ind.desiredTraits && <p className="text-sm text-purple-600 mt-1">⭐ 評価される学生の特徴: {ind.desiredTraits}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Company Analysis */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">志望企業名（任意）</h3>
                  <input
                    type="text"
                    value={research.companyName}
                    onChange={e => setResearch(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="例: 株式会社〇〇"
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                  />
                </div>

                <button
                  onClick={runCompanyAnalysis}
                  disabled={isLoading || !research.companyName.trim()}
                  className="w-full py-3 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  🔍 企業分析レポートを生成
                </button>

                {/* Company Result */}
                {research.companyResult && (
                  <div className="animate-fadeIn bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <h3 className="text-lg font-bold text-gray-800">{research.companyName} 分析レポート</h3>
                    {research.companyResult.strengths && (
                      <div><h4 className="text-sm font-bold text-accent-600 mb-1">💪 企業の強み</h4><p className="text-sm text-gray-600">{research.companyResult.strengths}</p></div>
                    )}
                    {research.companyResult.challenges && (
                      <div><h4 className="text-sm font-bold text-orange-600 mb-1">⚡ 課題</h4><p className="text-sm text-gray-600">{research.companyResult.challenges}</p></div>
                    )}
                    {research.companyResult.desiredPerson && (
                      <div><h4 className="text-sm font-bold text-brand-600 mb-1">🎯 求める人物像</h4><p className="text-sm text-gray-600">{research.companyResult.desiredPerson}</p></div>
                    )}
                    {research.companyResult.interviewTopics && (
                      <div>
                        <h4 className="text-sm font-bold text-purple-600 mb-1">💬 面接で聞きそうなこと</h4>
                        <ul className="space-y-1">{research.companyResult.interviewTopics.map((t: string, i: number) => (
                          <li key={i} className="text-sm text-gray-600 border-l-2 border-purple-300 pl-3">{t}</li>
                        ))}</ul>
                      </div>
                    )}
                    {research.companyResult.connectionToExperience && (
                      <div className="bg-brand-50 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-brand-700 mb-1">🔗 あなたの経験との接続</h4>
                        <p className="text-sm text-gray-700">{research.companyResult.connectionToExperience}</p>
                      </div>
                    )}
                    {research.companyResult.motivationDraft && (
                      <div className="bg-accent-50 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-accent-700 mb-1">📝 志望動機の骨子</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{research.companyResult.motivationDraft}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============ STEP 3: ES作成・添削 ============ */}
        {currentStep === 3 && (
          <div className="animate-fadeIn space-y-6">
            {!isPaid ? (
              <PaywallCard onCheckout={handleCheckout} />
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">STEP 3: ES作成・添削</h2>
                  <p className="text-sm text-gray-500 mt-1">AIがSTAR法に基づいてESを作成・添削します</p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setEsMode('create')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${esMode === 'create' ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    ✍️ ES作成
                  </button>
                  <button onClick={() => setEsMode('review')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${esMode === 'review' ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    📝 ES添削
                  </button>
                </div>

                {esMode === 'create' ? (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                      <div>
                        <label className="text-sm font-bold text-gray-700">設問文</label>
                        <textarea
                          value={esData.question}
                          onChange={e => setEsData(prev => ({ ...prev, question: e.target.value }))}
                          placeholder="例: 学生時代に力を入れたことを教えてください"
                          className="w-full mt-1 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-brand-300"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-bold text-gray-700">文字数制限</label>
                          <select
                            value={esData.charLimit}
                            onChange={e => setEsData(prev => ({ ...prev, charLimit: Number(e.target.value) }))}
                            className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm"
                          >
                            {CHAR_LIMITS.map(l => (
                              <option key={l} value={l}>{l === 0 ? '制限なし' : `${l}字`}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-bold text-gray-700">志望企業</label>
                          <input
                            type="text"
                            value={esData.targetCompany || research.companyName}
                            onChange={e => setEsData(prev => ({ ...prev, targetCompany: e.target.value }))}
                            className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm"
                            placeholder="任意"
                          />
                        </div>
                      </div>
                      {selfAnalysis.result?.gakuchikaCandiates && (
                        <div>
                          <label className="text-sm font-bold text-gray-700">使うガクチカ候補</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selfAnalysis.result.gakuchikaCandiates.map((g: any, i: number) => (
                              <button
                                key={i}
                                onClick={() => setEsData(prev => ({ ...prev, selectedGakuchika: i }))}
                                className={`px-3 py-1.5 rounded-lg text-sm transition ${esData.selectedGakuchika === i ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                              >
                                {g.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={runESGenerate}
                      disabled={isLoading || !esData.question.trim()}
                      className="w-full py-3 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition disabled:opacity-40"
                    >
                      ✨ ES下書きを生成
                    </button>

                    {esData.createResult && (
                      <div className="animate-fadeIn bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-800">生成されたES</h3>
                          {esData.createResult.charCount && (
                            <span className="text-xs text-gray-500">{esData.createResult.charCount}字</span>
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{esData.createResult.es}</p>
                        </div>
                        {esData.createResult.explanation && (
                          <div className="bg-brand-50 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-brand-700 mb-1">💡 この構成にした理由</h4>
                            <p className="text-sm text-gray-700">{esData.createResult.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                      <div>
                        <label className="text-sm font-bold text-gray-700">添削するES</label>
                        <textarea
                          value={esData.reviewText}
                          onChange={e => setEsData(prev => ({ ...prev, reviewText: e.target.value }))}
                          placeholder="書いたESを貼り付けてください"
                          className="w-full mt-1 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-brand-300"
                          rows={8}
                        />
                        {esData.reviewText && <p className="text-xs text-gray-400 text-right mt-1">{esData.reviewText.length}字</p>}
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">添削の重点ポイント</label>
                        <div className="flex flex-wrap gap-2">
                          {(Object.entries(ES_REVIEW_MODES) as [ESReviewMode, { label: string; desc: string }][]).map(([key, mode]) => (
                            <button
                              key={key}
                              onClick={() => setEsData(prev => ({ ...prev, reviewMode: key }))}
                              className={`px-3 py-1.5 rounded-lg text-sm transition ${esData.reviewMode === key ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                              title={mode.desc}
                            >
                              {mode.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={runESReview}
                      disabled={isLoading || !esData.reviewText.trim()}
                      className="w-full py-3 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition disabled:opacity-40"
                    >
                      📝 添削を実行
                    </button>

                    {esData.reviewResult && (
                      <div className="animate-fadeIn space-y-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                          <h3 className="font-bold text-gray-800 mb-3">添削結果</h3>
                          {esData.reviewResult.overallScore && (
                            <div className="flex items-center gap-3 mb-4">
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white ${
                                esData.reviewResult.overallScore >= 4 ? 'bg-accent-500' : esData.reviewResult.overallScore >= 3 ? 'bg-yellow-500' : 'bg-orange-500'
                              }`}>{esData.reviewResult.overallScore}/5</div>
                              <div>
                                <p className="text-sm font-bold text-gray-700">{esData.reviewResult.overallComment}</p>
                                {esData.reviewResult.passGrade && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    esData.reviewResult.passGrade === 'A' ? 'bg-accent-100 text-accent-700' :
                                    esData.reviewResult.passGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                                    'bg-orange-100 text-orange-700'
                                  }`}>ES通過可能性: {esData.reviewResult.passGrade}</span>
                                )}
                              </div>
                            </div>
                          )}
                          {esData.reviewResult.scores && (
                            <div className="space-y-2 mb-4">
                              {Object.entries(esData.reviewResult.scores).map(([key, score]: [string, any]) => (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 w-20">{ES_REVIEW_MODES[key as ESReviewMode]?.label || key}</span>
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${(Number(score) / 5) * 100}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-gray-600">{String(score)}/5</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {esData.reviewResult.improved && (
                          <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h4 className="font-bold text-accent-700 mb-2">✨ 改善後のES</h4>
                            <div className="bg-accent-50 rounded-lg p-4">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{esData.reviewResult.improved}</p>
                            </div>
                          </div>
                        )}
                        {esData.reviewResult.advice && (
                          <div className="bg-brand-50 rounded-xl border border-brand-200 p-5">
                            <h4 className="font-bold text-brand-700 mb-2">💡 改善アドバイス</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{esData.reviewResult.advice}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============ STEP 4: 面接対策 ============ */}
        {currentStep === 4 && (
          <div className="animate-fadeIn space-y-6">
            {!isPaid ? (
              <PaywallCard onCheckout={handleCheckout} />
            ) : !interview.practiceActive ? (
              <>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">STEP 4: 面接対策</h2>
                  <p className="text-sm text-gray-500 mt-1">面接段階に応じた質問を生成し、練習しましょう</p>
                </div>

                {/* Stage Selection */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(Object.entries(STAGE_CONFIG) as [InterviewStage, typeof STAGE_CONFIG[InterviewStage]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setInterview(prev => ({ ...prev, stage: key, questionCount: cfg.questionDefault, questions: null }))}
                      className={`p-4 rounded-xl border-2 transition text-center ${
                        interview.stage === key ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cfg.icon}</div>
                      <div className="text-sm font-bold text-gray-800">{cfg.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{cfg.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Stage Info Box */}
                <div className={`${STAGE_CONFIG[interview.stage].color} rounded-xl p-4 text-white`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{STAGE_CONFIG[interview.stage].icon}</span>
                    <span className="font-bold">{STAGE_CONFIG[interview.stage].label}</span>
                  </div>
                  <p className="text-sm opacity-90">
                    {interview.stage === 'first' && '面接官: 人事担当者（20代後半〜30代前半）。基礎的なコミュニケーション能力を確認します。テンポよく質問が続きます。'}
                    {interview.stage === 'second' && '面接官: 配属部署の課長・部長クラス（30代後半〜40代）。「一緒に働けるか」を見極めます。深掘り質問が多くなります。'}
                    {interview.stage === 'final' && '面接官: 役員・経営層（50代〜60代）。ビジョンや覚悟を問います。穏やかですが本質を突く質問をします。'}
                    {interview.stage === 'group' && '面接官: 人事担当者複数名。他の候補者と同じ質問に答える形式です。限られた時間で差別化がポイントです。'}
                  </p>
                </div>

                <button
                  onClick={runQuestionGenerate}
                  disabled={isLoading}
                  className="w-full py-3 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition disabled:opacity-40"
                >
                  🎤 想定質問を生成
                </button>

                {/* Questions List */}
                {interview.questions && (
                  <div className="animate-fadeIn space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-800">想定質問（{interview.questions.length}問）</h3>
                      <button
                        onClick={() => setInterview(prev => ({ ...prev, practiceActive: true, practiceIndex: 0, timerSeconds: 0, timerRunning: false }))}
                        className="px-4 py-2 bg-accent-500 text-white text-sm font-medium rounded-lg hover:bg-accent-600 transition"
                      >
                        🎯 練習モードへ
                      </button>
                    </div>

                    {interview.questions.map((q: any, i: number) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-bold text-white bg-brand-500 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{q.question}</p>
                            {q.category && <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full mt-1 inline-block">{q.category}</span>}
                            {q.intent && <p className="text-xs text-gray-500 mt-2">👀 面接官の意図: {q.intent}</p>}
                            {q.modelAnswer && (
                              <details className="mt-3">
                                <summary className="text-sm text-brand-600 cursor-pointer hover:text-brand-700">模範回答を見る</summary>
                                <div className="mt-2 bg-gray-50 rounded-lg p-3">
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.modelAnswer}</p>
                                </div>
                              </details>
                            )}
                            {q.followUp && (
                              <details className="mt-2">
                                <summary className="text-sm text-purple-600 cursor-pointer hover:text-purple-700">深掘り質問を見る</summary>
                                <div className="mt-2 space-y-1">
                                  {q.followUp.map((f: string, j: number) => (
                                    <p key={j} className="text-sm text-gray-600 border-l-2 border-purple-300 pl-3">↳ {f}</p>
                                  ))}
                                </div>
                              </details>
                            )}
                            {q.tipForGroup && interview.stage === 'group' && (
                              <div className="mt-2 bg-teal-50 rounded-lg p-2">
                                <p className="text-xs text-teal-700">💡 差別化ポイント: {q.tipForGroup}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Practice Mode */
              <div className="animate-fadeIn space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">🎯 練習モード</h2>
                  <button
                    onClick={() => setInterview(prev => ({ ...prev, practiceActive: false, timerRunning: false }))}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← 質問一覧に戻る
                  </button>
                </div>

                {/* Timer */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                  <div className="text-4xl font-mono font-bold text-gray-800 mb-3">
                    {formatTime(interview.timerSeconds)}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setInterview(prev => ({ ...prev, timerRunning: !prev.timerRunning }))}
                      className={`px-6 py-2 rounded-lg text-sm font-medium ${interview.timerRunning ? 'bg-red-500 text-white' : 'bg-accent-500 text-white'}`}
                    >
                      {interview.timerRunning ? '⏸ 停止' : '▶ スタート'}
                    </button>
                    <button
                      onClick={() => setInterview(prev => ({ ...prev, timerSeconds: 0, timerRunning: false }))}
                      className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm"
                    >
                      リセット
                    </button>
                  </div>
                </div>

                {/* Current Question */}
                {interview.questions && interview.questions[interview.practiceIndex] && (
                  <div className="bg-white rounded-xl border-2 border-brand-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-gray-500">質問 {interview.practiceIndex + 1} / {interview.questions.length}</span>
                      {interview.questions[interview.practiceIndex].category && (
                        <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">{interview.questions[interview.practiceIndex].category}</span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-gray-800 mb-4">{interview.questions[interview.practiceIndex].question}</p>
                    
                    <button
                      onClick={() => setShowAnswer(!showAnswer)}
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                    >
                      {showAnswer ? '▲ 模範回答を隠す' : '▼ 模範回答を表示'}
                    </button>

                    {showAnswer && interview.questions[interview.practiceIndex].modelAnswer && (
                      <div className="mt-3 bg-gray-50 rounded-lg p-4 animate-fadeIn">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{interview.questions[interview.practiceIndex].modelAnswer}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setInterview(prev => ({ ...prev, practiceIndex: Math.max(0, prev.practiceIndex - 1), timerSeconds: 0 })); setShowAnswer(false) }}
                    disabled={interview.practiceIndex === 0}
                    className="flex-1 py-3 bg-gray-200 text-gray-600 font-medium rounded-xl disabled:opacity-40"
                  >
                    ← 前の質問
                  </button>
                  <button
                    onClick={() => { setInterview(prev => ({ ...prev, practiceIndex: Math.min((prev.questions?.length || 1) - 1, prev.practiceIndex + 1), timerSeconds: 0 })); setShowAnswer(false) }}
                    disabled={interview.practiceIndex === (interview.questions?.length || 1) - 1}
                    className="flex-1 py-3 bg-brand-500 text-white font-medium rounded-xl disabled:opacity-40"
                  >
                    次の質問 →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// ============================================================
// Paywall Component
// ============================================================
function PaywallCard({ onCheckout }: { onCheckout: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">🔒</div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">この機能はPROプランで利用できます</h3>
      <p className="text-sm text-gray-500 mb-6">500円（買い切り）で全機能が解放されます</p>
      <button
        onClick={onCheckout}
        className="px-8 py-3 bg-accent-500 text-white font-medium rounded-xl hover:bg-accent-600 transition shadow-lg"
      >
        ¥500 で全機能を解放する
      </button>
      <p className="text-xs text-gray-400 mt-3">※ STEP 1（自己分析）は無料でご利用いただけます</p>
    </div>
  )
}

import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const TRIAL_SECRET = process.env.TRIAL_SECRET || 'icf-default-secret-change-me'

function generateHash(expiry: string): string {
  return createHmac('sha256', TRIAL_SECRET)
    .update(expiry)
    .digest('hex')
    .slice(0, 12)
}

export async function POST(req: Request) {
  try {
    const { trial } = await req.json()
    if (!trial) return NextResponse.json({ valid: false })

    const underscoreIndex = trial.lastIndexOf('_')
    if (underscoreIndex === -1) return NextResponse.json({ valid: false })

    const expiry = trial.slice(0, underscoreIndex)
    const hash = trial.slice(underscoreIndex + 1)

    // Check expiry
    const expiryDate = new Date(expiry)
    if (isNaN(expiryDate.getTime()) || expiryDate < new Date()) {
      return NextResponse.json({ valid: false })
    }

    // Check hash
    const expected = generateHash(expiry)
    if (hash !== expected) {
      return NextResponse.json({ valid: false })
    }

    return NextResponse.json({ valid: true })
  } catch {
    return NextResponse.json({ valid: false })
  }
}

// GET endpoint to generate trial links (protected by secret header)
export async function GET(req: Request) {
  const url = new URL(req.url)
  const expiry = url.searchParams.get('expiry')
  const secret = url.searchParams.get('secret')

  if (secret !== TRIAL_SECRET || !expiry) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hash = generateHash(expiry)
  const token = `${expiry}_${hash}`
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://interviewcraft-fresh.vercel.app'

  return NextResponse.json({
    token,
    url: `${baseUrl}?trial=${token}`,
  })
}

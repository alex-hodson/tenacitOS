import { NextRequest, NextResponse } from 'next/server'

// Simple webhook to trigger git pull on PetClicker repo
// POST from GitHub webhook → calls pull script on Mac Mini via SSH

const MAC_MINI = '100.97.151.64'
const REPO_PATH = '~/workspace/PetClicker'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify it's a push event
    if (body.ref !== 'refs/heads/main') {
      return NextResponse.json({ message: 'Not main branch, skipping' })
    }
    
    // Trigger pull on Mac Mini
    const { exec } = await import('child_process')
    exec(`ssh -o ConnectTimeout=10 ${MAC_MINI} "cd ${REPO_PATH} && git pull origin main"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Pull failed:', error.message)
      } else {
        console.log('Pull result:', stdout)
      }
    })
    
    return NextResponse.json({ message: 'Pull triggered', branch: body.ref })
  } catch (error) {
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server';
import { processBullets } from '@/lib/ai/ollama';

export async function POST(request: Request) {
  try {
    const { bullets, rankLevel, evaluationType } = await request.json();

    if (!bullets || !Array.isArray(bullets) || bullets.length === 0) {
      return NextResponse.json(
        { error: 'Invalid bullets array' },
        { status: 400 }
      );
    }

    // Process bullets with AI using proper NCOER/OER tone
    const categorized = await processBullets(
      bullets, 
      rankLevel,
      evaluationType || 'NCOER'
    );

    return NextResponse.json({ categorized });
  } catch (error) {
    console.error('AI categorization error:', error);
    return NextResponse.json(
      { error: 'AI processing failed. Make sure Ollama is running.' },
      { status: 500 }
    );
  }
}


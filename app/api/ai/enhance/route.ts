import { NextResponse } from 'next/server';
import { enhanceBullet } from '@/lib/ai/ollama';

export async function POST(request: Request) {
  try {
    const { bullet, category, rankLevel, evaluationType } = await request.json();

    if (!bullet || !category || !rankLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Enhance bullet with AI using proper NCOER/OER tone
    const enhanced = await enhanceBullet(
      bullet, 
      category, 
      rankLevel,
      evaluationType || 'NCOER'
    );

    return NextResponse.json({ enhanced });
  } catch (error) {
    console.error('AI enhancement error:', error);
    return NextResponse.json(
      { error: 'AI processing failed. Make sure Ollama is running.' },
      { status: 500 }
    );
  }
}


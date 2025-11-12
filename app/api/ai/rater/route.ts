import { NextResponse } from 'next/server';
import { generateRaterComments } from '@/lib/ai/ollama';

export async function POST(request: Request) {
  try {
    const { bullets, rankLevel, dutyTitle, evaluationType } = await request.json();

    if (!bullets || !Array.isArray(bullets)) {
      return NextResponse.json(
        { error: 'Invalid bullets array' },
        { status: 400 }
      );
    }

    // Generate rater comments with AI using proper NCOER/OER language
    const comments = await generateRaterComments(
      bullets, 
      rankLevel, 
      dutyTitle,
      evaluationType || 'NCOER'
    );

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('AI rater comments error:', error);
    return NextResponse.json(
      { error: 'AI processing failed. Make sure Ollama is running.' },
      { status: 500 }
    );
  }
}


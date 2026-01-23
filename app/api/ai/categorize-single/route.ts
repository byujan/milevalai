import { NextResponse } from 'next/server';
import { categorizeBullet, enhanceBullet } from '@/lib/ai/ollama';
import { RankLevel, EvaluationType } from '@/lib/types/database';

export async function POST(request: Request) {
  try {
    const { bullet, rankLevel, evaluationType } = await request.json();

    if (!bullet) {
      return NextResponse.json(
        { error: 'Bullet is required' },
        { status: 400 }
      );
    }

    console.log(`🎯 Categorizing single bullet for ${evaluationType} ${rankLevel}`);

    // Categorize the bullet
    const categorized = await categorizeBullet(bullet);

    // Enhance the bullet with proper NCOER/OER tone
    const enhanced = await enhanceBullet(
      bullet,
      categorized.category,
      rankLevel as RankLevel,
      evaluationType as EvaluationType
    );

    const result = {
      category: categorized.category,
      enhanced: enhanced,
      confidence: categorized.confidence,
      original: bullet,
    };

    console.log(`✅ Categorized as: ${result.category} (${Math.round(result.confidence * 100)}% confidence)`);

    return NextResponse.json({ categorized: result });
  } catch (error) {
    console.error('Error in categorize-single API:', error);
    return NextResponse.json(
      { error: 'Failed to categorize bullet' },
      { status: 500 }
    );
  }
}

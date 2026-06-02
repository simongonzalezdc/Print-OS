import { NextResponse } from 'next/server';
import { validateAIProvider, getProviderInfo } from '@/lib/ai/provider';

export async function GET() {
  try {
    const status = validateAIProvider();
    const providerInfo = getProviderInfo();
    
    return NextResponse.json({
      ...status,
      providerInfo,
    });
  } catch (error) {
    console.error('AI status error:', error);
    return NextResponse.json(
      {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        providerInfo: {
          provider: 'unknown',
          model: 'unknown',
          isLocal: false,
        },
      },
      { status: 500 }
    );
  }
}

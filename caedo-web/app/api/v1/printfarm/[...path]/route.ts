import { NextRequest, NextResponse } from 'next/server';

const PRINTFARM_API_URL = process.env.PRINTFARM_API_URL || 'http://localhost:8000';

async function proxyRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const url = new URL(req.url);
    const targetUrl = `${PRINTFARM_API_URL}/api/v1/${path}${url.search}`;

    try {
        const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': req.headers.get('Content-Type') || 'application/json',
                // Forward other necessary headers if needed
            },
            body,
        });

        const data = await response.text();

        return new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/json',
            },
        });
    } catch (error) {
        console.error('PrintFarm API Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to communicate with PrintFarm API' }, { status: 502 });
    }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;


import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { log } from '@/lib/logger';

// Use environment variable or default to relative path from workspace root
const SHARED_DIR = process.env.HANDOFF_DIR || path.join(process.cwd(), '../shared/handoffs');
const MAX_PAYLOAD_SIZE = 50 * 1024 * 1024; // 50MB limit

export async function POST(req: NextRequest) {
    try {
        // Future: Add authentication check here
        // const session = await getServerSession();
        // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();
        const { filename, content, metadata } = data;

        if (!filename || !content) {
            return NextResponse.json({ error: 'Missing filename or content' }, { status: 400 });
        }

        // Limit payload size to prevent DOS/memory issues
        if (content.length > MAX_PAYLOAD_SIZE * 1.4) { // base64 is ~1.37x larger than binary
            return NextResponse.json({ error: 'Payload too large (max 50MB)' }, { status: 413 });
        }

        // Ensure directory exists (async)
        if (!existsSync(SHARED_DIR)) {
            await mkdir(SHARED_DIR, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        // Better sanitization: remove path traversal characters
        const sanitizedFilename = path.basename(filename).replace(/[^a-z0-9.]/gi, '_');
        const safeFilename = `${timestamp}_${sanitizedFilename}`;
        const filePath = path.join(SHARED_DIR, safeFilename);

        // Save content (assume base64 if it's a blob/binary)
        const buffer = Buffer.from(content, 'base64');
        await writeFile(filePath, buffer);

        // Save metadata
        if (metadata) {
            await writeFile(`${filePath}.json`, JSON.stringify(metadata, null, 2));
        }

        log.info(`Design handed off: ${safeFilename}`);

        return NextResponse.json({
            success: true,
            path: filePath,
            message: 'Design handed off to Caedo API'
        });
    } catch (error) {
        log.error('Handoff error:', error);
        return NextResponse.json({ error: 'Failed to handoff design' }, { status: 500 });
    }
}

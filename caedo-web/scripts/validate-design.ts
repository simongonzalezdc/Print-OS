import fs from 'fs';
import path from 'path';
import { createAIProvider } from '../lib/ai/provider';
import { generateText } from 'ai';
import { buildSystemPrompt } from '../lib/ai/system-prompt';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            process.env[key.trim()] = values.join('=').trim();
        }
    });
}

async function validate() {
    console.log('Validating AI Design Workflow...');

    if (!process.env.ZAI_API_KEY) {
        console.error('Error: ZAI_API_KEY not found in environment');
        process.exit(1);
    }

    // Set AI provider to Z.AI for this test
    process.env.AI_PROVIDER = 'zai';

    // 1. Get Provider
    const provider = createAIProvider();
    console.log('Provider created:', process.env.AI_PROVIDER);
    console.log('Model:', process.env.ZAI_MODEL || 'default');

    // 2. Read Image
    const imagePath = '/Users/simongonzalezdecruz/.gemini/antigravity/brain/15720b94-651e-45b4-9c5b-e761a2c0653a/phone_stand_sketch_1765678328583.png';
    if (!fs.existsSync(imagePath)) {
        throw new Error('Image not found: ' + imagePath);
    }
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // 3. Generate Design
    console.log('Sending request to AI...');
    console.log('Prompt: Create a JSCAD design for this phone stand...');

    const systemPrompt = buildSystemPrompt(); // Get the default system prompt

    const result = await generateText({
        model: provider,
        system: systemPrompt, // Inject the critical system prompt properly
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'Create a JSCAD design for this phone stand. It should be 3D printable on an FDM printer. Make it rugged. Return ONLY the JSCAD code.' },
                    { type: 'image', image: dataUrl } // SDK handles format conversion
                ]
            }
        ]
    });

    console.log('Result received!');
    console.log('Length:', result.text.length);

    // 4. Save Result
    const outputPath = path.join(process.cwd(), 'knowledge/templates/rugged_phone_stand_candidate.jscad');

    // Extract code block if present
    let code = result.text;
    const match = code.match(/```(?:javascript|js|jscad)?\n([\s\S]*?)\n```/);
    if (match && match[1]) {
        code = match[1];
        console.log('Extracted code block');
    }

    fs.writeFileSync(outputPath, code);
    console.log('Saved candidate to:', outputPath);
}

validate().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
});

import { CopilotClient, approveAll } from '@github/copilot-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function test() {
    console.log('Testing Copilot SDK...');
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!token) {
        console.error('No GITHUB_TOKEN found in .env');
        process.exit(1);
    }

    const client = new CopilotClient({
        githubToken: token,
        logLevel: 'debug'
    });

    try {
        console.log('Starting client...');
        await client.start();
        console.log('Client started. Protocol Version:', client.negotiatedProtocolVersion);
        
        console.log('Creating session...');
        const session = await client.createSession({
            model: 'gpt-4o',
            onPermissionRequest: approveAll
        });
        
        console.log('Session created. Requesting completion...');
        const response = await session.ask('Say hello!', { stream: false });
        console.log('Response:', response.text);
        
        await client.stop();
        console.log('Test successful!');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

test();

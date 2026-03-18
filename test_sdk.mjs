import { CopilotClient, approveAll } from '@github/copilot-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function test() {
    process.stdout.write('Testing Copilot SDK... ');
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!token) {
        process.stdout.write('\n❌ FAILED: No GITHUB_TOKEN in .env\n');
        process.exit(1);
    }

    const client = new CopilotClient({
        githubToken: token,
        logLevel: 'debug'
    });

    try {
        process.stdout.write('Starting... ');
        await client.start();
        process.stdout.write('Connected... ');
        
        process.stdout.write('Creating session... ');
        const session = await client.createSession({
            model: 'gpt-4o',
            onPermissionRequest: approveAll
        });
        
        process.stdout.write('Checking ping... ');
        const ping = await client.ping();
        process.stdout.write(`Protocol: ${ping.protocolVersion}\n`);
        
        await client.stop();
        process.stdout.write('✅ SDK TEST SUCCESSFUL!\n');
    } catch (error) {
        process.stdout.write(`\n❌ FAILED: ${error.message}\n`);
        console.error(error);
        process.exit(1);
    }
}

test();

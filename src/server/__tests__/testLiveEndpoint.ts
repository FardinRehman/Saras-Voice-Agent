import { WebSocket } from 'ws';

async function testLiveEndpoint() {
  const port = process.env.PORT || 5000;
  console.log(`Testing /api/live WebSocket endpoint on localhost:${port}...`);

  const ws = new WebSocket(`ws://localhost:${port}/api/live?callId=TEST-E2E-SARAS-1&caller=%2B919876543210&visitorName=Aditya`);

  let receivedReady = false;
  let receivedAudio = false;
  let audioChunkCount = 0;
  let transcript = '';

  ws.on('open', () => {
    console.log(`[E2E Test] Connected to ws://localhost:${port}/api/live`);
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'status') {
        console.log('[E2E Test] Status received:', msg.status, msg.message);
        if (msg.status === 'READY') {
          receivedReady = true;
        }
      } else if (msg.type === 'audio') {
        receivedAudio = true;
        audioChunkCount++;
        process.stdout.write('A');
      } else if (msg.type === 'transcript_delta') {
        process.stdout.write(msg.delta);
      } else if (msg.type === 'transcript') {
        console.log(`\n[E2E Test Transcript] [${msg.speaker}]: ${msg.text}`);
        transcript = msg.text;
      } else if (msg.type === 'turn_complete') {
        console.log('\n[E2E Test] Turn complete received!');
        console.log('[E2E Test] Sending user message: "What services does Saras Dynamics provide?"');
        ws.send(JSON.stringify({
          type: 'text_input',
          text: 'What services does Saras Dynamics provide?',
        }));
      } else if (msg.type === 'tool_executing') {
        console.log('\n[E2E Test Tool Executing]:', msg.toolName, msg.args);
      } else if (msg.type === 'tool_executed') {
        console.log('\n[E2E Test Tool Executed]:', msg.toolName, msg.status);
      }
    } catch (e) {
      console.error('Error parsing msg:', e);
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 10000));

  ws.close();

  console.log('\n=============================');
  console.log('SARAS DYNAMICS LIVE E2E TEST SUMMARY:');
  console.log('Status READY received:', receivedReady ? 'YES' : 'NO');
  console.log('Audio chunks received:', receivedAudio ? `YES (${audioChunkCount} chunks)` : 'NO');
  console.log('Transcript received:', transcript ? 'YES' : 'NO');
  console.log('=============================');
}

testLiveEndpoint();

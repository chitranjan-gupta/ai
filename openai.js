import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

async function main() {
    const completion = client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'developer', content: 'Talk like a pirate.' },
          { role: 'user', content: 'Are semicolons optional in JavaScript?' },
        ],
        stream: true
    });
      
    for await (const part of await completion){
        const content = part.choices[0]?.delta?.content || '';
        console.log(content); 
    }
}

main()
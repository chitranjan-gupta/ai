import { Ollama } from 'ollama'

const ollama = new Ollama({ host: "http://localhost:11434" })

const message = { role: 'user', content: 'Why is the sky blue?' }
const response = await ollama.chat({ model: 'llama3.2', messages: [message], stream: true })
for await (const part of response) {
  process.stdout.write(part.message.content)
}

//OLLAMA_ORIGINS=chrome-extension://* ollama serve

/**
 * curl https://11434-chitranjangupta-ai-zoqdqpg6oht.ws-us118.gitpod.io/api/chat -H "Host: localhost:11434" -d '{
    "model": "llama3.2",
    "messages": [
      { "role": "user", "content": "why is the sky blue?" }
    ]
  }'
 */

//OLLAMA_ORIGINS=https://11434-chitranjangupta-ai-zoqdqpg6oht.ws-us118.gitpod.io,https://11434-chitranjangupta-ai-zoqdqpg6oht.ws-us118.gitpod.io:*,http://34.53.51.220,https://34.53.51.220,http://34.53.51.220:*,https://34.53.51.220:* ollama serve

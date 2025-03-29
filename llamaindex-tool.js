import { Ollama, OllamaEmbedding } from "@llamaindex/ollama";
import { Document, VectorStoreIndex, Settings, agent, tool, AgentToolCall, AgentStream  } from "llamaindex";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import fs from "fs/promises";
 
const ollama = new Ollama({ model: "llama3.2", temperature: 0.75 });
const ollamaEmbedding = new OllamaEmbedding({ model: "llama3.2" });
 
// Use Ollama LLM and Embed Model
Settings.llm = ollama;
Settings.embedModel = ollamaEmbedding;
 
async function main() {
  //const essay = await fs.readFile("./test.txt", "utf-8");
  const loader = new PDFLoader("./DOC-20241003-WA0008..pdf");
  const essay = await loader.load();

  const document = new Document({ text: essay[0].pageContent, id_: "essay" });
  //const document = new Document({ text: essay, id_: "essay"});

  // Load and index documents
  const index = await VectorStoreIndex.fromDocuments([document]);
 
  // get retriever
  const retriever = index.asRetriever({ similarityTopK: 10 });

  const query = "Who is Utkarsh?";

  const chatEngine = index.asChatEngine({
    similarityTopK: 5,
    systemPrompt: "You are a helpful assistant.",
  });

  const stream = await chatEngine.chat({ message: query, stream: true });
  for await (const chunk of stream) {
    console.log(chunk.message.content);
  }
}

async function test(){ 
  // Define a joke-telling tool
  const jokeTool = tool(
    () => "Baby Llama is called cria",
    {
      name: "joke",
      description: "Use this tool to get a joke",
    }
  );
  
  // Create an single agent workflow with the tool
  const jokeAgent = agent({
    tools: [jokeTool],
  });
  
  // Run the workflow
  const context = jokeAgent.run("Tell me something funny");

  // Stream and handle events
  for await (const event of context) {
    if (event instanceof AgentToolCall) {
      console.log(`Tool being called: ${event.data.toolName}`);
    }
    if (event instanceof AgentStream) {
      process.stdout.write(event.data.delta);
    }
  }
}

main()
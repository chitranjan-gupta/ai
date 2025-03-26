import { Ollama, OllamaEmbedding } from "@llamaindex/ollama";
import { Document, VectorStoreIndex, Settings, agent } from "llamaindex";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

import fs from "fs/promises";
 
const ollama = new Ollama({ model: "llama3.2", temperature: 0.75 });
const ollamaEmbedding = new OllamaEmbedding({ model: "llama3.2" });
 
// Use Ollama LLM and Embed Model
Settings.llm = ollama;
Settings.embedModel = ollamaEmbedding;
 
async function main() {
  const essay = await fs.readFile("./test.txt", "utf-8");
  //const loader = new PDFLoader("./data/DOC-20241003-WA0008..pdf");
  //const essay = await loader.load();

  //const document = new Document({ text: essay[0].pageContent, id_: "essay" });
  const document = new Document({ text: essay, id_: "essay"});

  // Load and index documents
  const index = await VectorStoreIndex.fromDocuments([document]);
 
  // get retriever
  const retriever = index.asRetriever({ similarityTopK: 10 });

  const query = "Who is Utkarsh?";

  const tools = [
    index.queryTool({
      metadata: {
        name: "utkarsh_rag_tool",
        description: `This tool to get details about Utkarsh`,
      },
    }),
  ];
   
  // Create an agent using the tools array
  const ragAgent = agent({ tools });
   
  let toolResponse = await ragAgent.run(query);
   
  console.log(toolResponse);
  
}

main();
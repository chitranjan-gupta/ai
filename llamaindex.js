import { Ollama, OllamaEmbedding } from "@llamaindex/ollama";
import { Document, VectorStoreIndex, Settings } from "llamaindex";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

import fs from "fs/promises";
 
const ollama = new Ollama({ model: "mistral", temperature: 0.75 });
const ollamaEmbedding = new OllamaEmbedding({ model: "mistral" });
 
// Use Ollama LLM and Embed Model
Settings.llm = ollama;
Settings.embedModel = ollamaEmbedding;
 
async function main() {
  //const essay = await fs.readFile("./test.txt", "utf-8");
  const loader = new PDFLoader("./data/DOC-20241003-WA0008..pdf");
  const essay = await loader.load();

  const document = new Document({ text: essay[0].pageContent, id_: "essay" });
  // Load and index documents
  const index = await VectorStoreIndex.fromDocuments([document]);
 
  // get retriever
  const retriever = index.asRetriever();
 
  // Create a query engine
  const queryEngine = index.asQueryEngine({
    retriever,
  });
 
  const query = "Who is Utkarsh?";
 
  // Query
  const response = await queryEngine.query({
    query,
  });
 
  // Log the response
  console.log(response.message);
}

main();
import { Ollama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";

const llm = new Ollama({
  model: "mistral", // Default value
  temperature: 0,
  maxRetries: 2,
  // other params...
});

//const inputText = "Ollama is an AI company that ";

// const completion = await llm.invoke(inputText);
// console.log(completion);

const prompt = PromptTemplate.fromTemplate(
  "How to say {input} in {output_language}:\n"
);

const chain = prompt.pipe(llm);
const res = await chain.invoke({
  output_language: "Hindi",
  input: "I love programming.",
});

console.log(res)
from fastapi import FastAPI
from langchain_core.prompts import ChatPromptTemplate
from langserve import add_routes
import uvicorn
from langchain_ollama.chat_models import ChatOllama
#from langchain_openai import ChatOpenAI

from dotenv import load_dotenv
load_dotenv()

app = FastAPI(
    title="Langchain OpenAI Chatbot",
    version="0.1.0",
    description="This is a simple chatbot API using Langchain and Ollama",
)

#llm1 = ChatOpenAI(model="gpt-3.5-turbo")
llm2 = ChatOllama(model="llama3.2")

#prompt1 = ChatPromptTemplate.from_template("Write me an essay about {topic} with 100 words")
prompt2 = ChatPromptTemplate.from_template("Write me an poem about {topic} with 100 words")

#add_routes(app, prompt1 | llm1, path="/openai")
add_routes(app, prompt2 | llm2, path="/ollama")

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
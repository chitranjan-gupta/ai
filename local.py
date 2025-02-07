from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_ollama.llms import OllamaLLM
#from langchain_ollama.chat_models import ChatOllama

import streamlit as st
import os
from dotenv import load_dotenv

#os.environ['LANGCHAIN_TRACING_V2'] = "True"
#os.environ['LANGCHAIN_API_KEY'] = os.getenv('LANGCHAIN_API_KEY')

## Prompt Template
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a helpful assistant. Please respond to user queries."),
        ("user", "Question:{question}")
    ]
)

## streamlit framework

st.title("Langchain OpenAI Chatbot")
input_text = st.text_input("Enter your question here:")

#ollama llm
llm = OllamaLLM(model="llama3.2")
#llm = ChatOllama(model="llama3.2")
output_parser = StrOutputParser()
chain = prompt | llm | output_parser

if input_text:
    st.write(chain.invoke({"question":input_text}))

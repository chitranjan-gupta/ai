__import__('pysqlite3')
import sys
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')

from langchain_community.document_loaders import TextLoader, WebBaseLoader, PyPDFLoader
import os
import bs4
from dotenv import load_dotenv

load_dotenv()

#loader = TextLoader("temp.txt")
#text_documents = loader.load()

#webloader = WebBaseLoader(web_paths=("https://lilianweng.github.io/posts/2023-06-23-agent",), bs_kwargs=dict(parse_only=bs4.SoupStrainer(class_=("post-title", "post-content", "post-header"))),)

#web_documents = webloader.load()
pdfloader = PyPDFLoader("DOC-20241003-WA0008..pdf")
pdf_documents = pdfloader.load()

from langchain.text_splitter import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

documents = text_splitter.split_documents(pdf_documents)

from langchain_ollama.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma

db = Chroma.from_documents(documents, OllamaEmbeddings(model="llama3.2"))

query = "Is Utkarsh is qualified for a web developer job?"

#result = db.similarity_search(query)

from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="llama3.2")

from langchain_core.prompts import ChatPromptTemplate
prompt = ChatPromptTemplate.from_template("""
Answer the following question based on the provided context.
Think step by step before providing a detailed answer.
I will tip you $1000 if the user finds the answer helpful.
The current date is: 08-02-2025
<contex>
{context}
</context>
Question: {input}
""")

from langchain.chains.combine_documents import create_stuff_documents_chain

documents_chain = create_stuff_documents_chain(llm, prompt)

retriever = db.as_retriever()

from langchain.chains import create_retrieval_chain

retriever_chain = create_retrieval_chain(retriever, documents_chain)

response = retriever_chain.invoke({"input": query})

print(response['answer'])
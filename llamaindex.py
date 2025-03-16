from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding

embedding = OllamaEmbedding(model_name="qwen2.5:7b")
llm = Ollama(model="qwen2.5:7b", request_timeout=120.0)

Settings.embed_model = embedding
Settings.llm = llm

documents = SimpleDirectoryReader("data").load_data()
index = VectorStoreIndex.from_documents(documents)
query_engine = index.as_query_engine()
response = query_engine.query("Is Utkarsh is eligible for frontend developer role?")
print(response)

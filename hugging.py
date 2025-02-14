from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEndpoint, HuggingFacePipeline
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from langchain import PromptTemplate, LLMChain
import os

load_dotenv()

# Load the API key from the environment
api_key = os.getenv("HUGGINGFACEHUB_API_TOKEN")
os.environ['HUGGINGFACEHUB_API_TOKEN'] = api_key

repo_id = "mistralai/Mistral-7B-Instruct-v0.3"

llm = HuggingFaceEndpoint(repo_id=repo_id,
    max_length=128,
    task="text-generation",
    temperature=0.5, huggingfacehub_api_token=api_key)

#answer = llm.invoke("What is the capital of France?")
#print(answer)

# Create a prompt template
question = "Who won the Cricket World Cup in 2011?"

template = """Question: {question}
Answer: Let's think step by step."""

prompt = PromptTemplate(template=template, input_variables=["question"])

llm_chain = LLMChain(llm=llm, prompt=prompt)

#answer = llm_chain.invoke(question)

#print(answer)

model_id = "gpt2"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id)

pipe = pipeline("text-generation", model=model, tokenizer=tokenizer, max_new_tokens=100)

hf = HuggingFacePipeline(pipeline=pipe)

answer = hf.invoke("What is machine learning?")
print(answer)

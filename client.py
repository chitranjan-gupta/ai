import requests
import streamlit as st

def get_ollama_response(input_text):
    response = requests.post("http://localhost:8000/ollama/invoke", json={"input": { "topic": input_text }})
    return response.json()["output"]

st.title("Ollama Chatbot")
input_text = st.text_input("Enter a topic", "flowers")
if st.button("Submit"):
    response = get_ollama_response(input_text)
    st.write(response)
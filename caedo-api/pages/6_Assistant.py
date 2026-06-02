import streamlit as st
from caedoapi.repositories.printers_repo import PrinterRepository
from caedoapi.repositories.jobs_repo import JobsRepository
from caedoapi.ai.client import AIClient
from caedoapi.ui.styles import apply_custom_styles

st.set_page_config(page_title="Assistant — Caedo API", page_icon="🤖", layout="wide")
apply_custom_styles()

st.title("OPERATIONS_ASSISTANT")

ai = AIClient()

# 1. Initialize Chat History
if "messages" not in st.session_state:
    st.session_state.messages = [] # Client handles system prompt injection

# 2. Display Chat History
for message in st.session_state.messages:
    if message["role"] != "system":
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

# 3. Handle Input
if prompt := st.chat_input("QUERY_COMMAND"):
    # User Message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Assistant Response
    with st.chat_message("assistant"):
        # Fetch fresh context
        context = {
            "online_printers": PrinterRepository.get_all(),
            "active_tasks": [j for j in JobsRepository.get_all() if j['status'] not in ['completed', 'failed', 'canceled']]
        }
        
        response_placeholder = st.empty()
        full_response = ""
        
        # Stream response
        for chunk in ai.stream_chat(st.session_state.messages, context=context):
            full_response += chunk
            response_placeholder.markdown(full_response + "▌")
            
        response_placeholder.markdown(full_response)
        st.session_state.messages.append({"role": "assistant", "content": full_response})

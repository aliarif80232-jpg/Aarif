import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# API key लोड करें
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# चैट हिस्ट्री स्टोर करने के लिए
conversation_history = [
    {"role": "system", "content": "You are a helpful assistant."}
]

def save_history(filename="history.json"):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(conversation_history, f, indent=2, ensure_ascii=False)

def load_history(filename="history.json"):
    global conversation_history
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            conversation_history = json.load(f)

def chat_with_gpt(user_input):
    conversation_history.append({"role": "user", "content": user_input})
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # या "gpt-4" अगर एक्सेस हो
            messages=conversation_history,
            temperature=0.7,
            max_tokens=500,
        )
        assistant_reply = response.choices[0].message.content
        conversation_history.append({"role": "assistant", "content": assistant_reply})
        return assistant_reply
    except Exception as e:
        return f"❌ Error: {str(e)}"

# मुख्य लूप
print("🤖 ChatGPT Clone Started! Type 'exit' to quit, 'save' to save chat, 'load' to load last chat.\n")
while True:
    user_input = input("You: ")
    if user_input.lower() in ["exit", "quit"]:
        print("Goodbye!")
        break
    elif user_input.lower() == "save":
        save_history()
        print("✅ History saved to history.json")
        continue
    elif user_input.lower() == "load":
        load_history()
        print("✅ History loaded")
        continue
    
    reply = chat_with_gpt(user_input)
    print(f"AI: {reply}\n")

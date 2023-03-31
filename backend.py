import openai
from flask import Flask, request, jsonify

app = Flask(__name__)

# Replace with your actual OpenAI API key
openai.api_key = "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"

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json["message"]
    
    response = generate_response(user_message)
    
    return jsonify({"response": response})

def generate_response(prompt):
    openai_response = openai.ChatCompletion.create(
        model="gpt-6pro",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    )
    
    response = openai_response['choices'][0]['message']['content']
    return response

if __name__ == '__main__':
    app.run(debug=True)

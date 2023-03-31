import botpfp from './botpfp.jpg';
import mypfp from './mypfp.jpg';
import './css/App.css';
import './css/normal.css';
import './css/secondarymenu.css';
import './css/primarymenu.css';
import './css/chatbox.css';
import { useState, useEffect, useRef } from 'react';

function App() {

  useEffect(() => { getEngines(); }, [])

  const [input, setInput] = useState('');
  const [models, setModels] = useState([]);
  const [currentModel, setcurrentModel] = useState('gpt-3.5-turbo');
  const [chatLog, setChatLog] = useState([]);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [chatHistoryInstances, setChatHistoryInstances] = useState([]);
  const [activeInstanceId, setActiveInstanceId] = useState(null);
  const chatInputRef = useRef();

    function clearConversation(){
    setChatLog([]);
  }

  async function getChatInstanceEmoji() {
    const emojiRequest = [
      ...chatLog,
      {
        user: "me",
        message:
          "Generate a single emoji that best represents the previous conversation. do not reply with any form of text or characters besides one single emoji. if no emoji whatsoever can represent the conversation, use this one: '💬'.",
      },
    ];
  
    const formattedRequest = formatRequest(emojiRequest);
    const emojiData = await sendFetchRequest(formattedRequest);
    const emoji = emojiData.message;
  
    return emoji;
  }
  
  async function getChatInstanceTitle() {
    const titleRequest = [
      ...chatLog,
      {
        user: "me",
        message:
          "Generate a very short and concise title that best represents the previous conversation. The title should be no longer than 4 short words, without any other characters but pure text unless absolutely necessary to describe the conversation. do NOT use quotation marks around the title under any circumstances. no text preceding the title itself like 'conversation title: [title]' (DO NOT DO THAT).",
      },
    ];
  
    const formattedRequest = formatRequest(titleRequest);
    const titleData = await sendFetchRequest(formattedRequest);
    const title = titleData.message;
  
    return title;
  }
  
  function formatRequest(messages) {
    return messages.map((message) => ({
      role: message.user === "me" ? "user" : "system",
      content: message.message,
    }));
  }
  
  async function sendFetchRequest(formattedRequest) {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: formattedRequest,
      }),
    });
  
    return await response.json();
  }
  
  async function getChatInstanceTitleAndEmoji() {
    const [emoji, title] = await Promise.all([
      getChatInstanceEmoji(),
      getChatInstanceTitle(),
    ]);
  
    return { emoji, title };
  }
  
  async function saveCurrentConversation() {
    //if the chat log is empty do nothing
    if (chatLog.length === 0) {
      return;
    }

    //give current conversation an ID
    const chatLogHash = chatLog
      .map((msg) => JSON.stringify(msg))
      .reduce((hash, msg) => {
        for (let i = 0; i < msg.length; i++) {
          hash = (hash * 31 + msg.charCodeAt(i)) | 0;
        }
        return hash;
    }, 0);

    //check if ID exists
    const chatLogExists = chatHistoryInstances.some(
      (instance) => instance.id === chatLogHash
    );

    //if ID exists dont create duplicate
    if (chatLogExists) {
      clearConversation()
      return;
    }
    
    //give each conversation an emoji and title
    const { emoji, title } = await getChatInstanceTitleAndEmoji();

    //create new instance
    const newInstance = {
      id: chatLogHash,
      emoji: emoji,
      title: title,
      chatLog: [...chatLog],
    };
    setChatHistoryInstances((prevInstances) => [...prevInstances, newInstance]);
    clearConversation();
  }

  function loadConversationOnClick(instance) {
    setChatLog(instance.chatLog);
    setActiveInstanceId(instance.id);
  }

  function getEngines(){
    fetch('http://localhost:3080/models')
    .then(res => res.json())
    .then(data => setModels(data.models.data))
  }

  function SideMenuButton({ emoji, onClick }) {
    return (
      <div className="sideMenuButton" onClick={onClick}>
        <div className="sideMenuButtonEmoji">{emoji}</div>
      </div>
    );
  }

  function ModelSelect({ title, models, currentModel, onModelChange }) {
    const handleClick = (e) => {
      e.stopPropagation();
    };

    return (
      <div className="modelSelectContainer" onClick={handleClick}>
        <div className="modelSelectTitle">{title}</div>
        <div className="modelSelectList">
          {models.map((model) => (
            <div
              className={`modelSelectOption ${
                model.id === currentModel ? "modelSelectOption-active" : ""
              }`}
              key={model.id}
              onClick={() => {
                onModelChange(model.id);
                setShowModelSelect(false);
              }}
            >
              {model.id}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function updateChatInput(text) {
    setInput(text);
    chatInputRef.current.style.height = 'auto';
  }

  function addMessageToChatLog(user, message) {
    setChatLog((prevChatLog) => [...prevChatLog, { user, message }]);
  }

  async function fetchBotResponse(message) {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
          message: message
      })
    });

    const data = await response.json();
    return data.response;
  }

  async function handleChatInputSubmit(e){
    e.preventDefault();

    // If input is empty, don't submit
    if (!input.trim()) {
      return;
    }

    // Add user's message to chat log
    addMessageToChatLog('me', input);

    // Clear chat input
    updateChatInput('');

    // Fetch bot's response
    const botResponse = await fetchBotResponse(input);

    // Add bot's response to chat log
    addMessageToChatLog('bot', botResponse);
  }
  
  return (
    <div className="App">
      <div className='secondaryMenuContainer'>
        <aside className="secondaryMenu">
          <SideMenuButton
            emoji="🤖"
            onClick={() => setShowModelSelect(!showModelSelect)}
          />
            {showModelSelect && (
              <div className="modelSelectOverlay" onClick={() => setShowModelSelect(false)}>
                <ModelSelect
                  title="model"
                  models={models.filter((model) => ["gpt-3.5-turbo", "gpt-4"].includes(model.id))}
                  currentModel={currentModel}
                  onModelChange={setcurrentModel}
                />
              </div>
            )}
          <SideMenuButton
            emoji="💬" 
            onClick={() => {
              saveCurrentConversation();
              setActiveInstanceId(null);
              chatInputRef.current.focus();
            }}
          />

        </aside>
      </div>
      <aside className= "primaryMenu">
        <div className='primaryMenuItemContainer'>
          <div className='conversationSearchBoxContainer'>
            <textarea className='conversationSearchBox' maxLength="25" placeholder='find a chat' rows='1' ></textarea>
          </div>
          <div className='chatHistory'>
          {chatHistoryInstances
            .slice()
            .reverse()
            .map((instance) => (
              <div
                className={`conversationInstance ${
                  instance.id === activeInstanceId ? "conversationInstance-active" : ""
                }`}
                key={instance.id}
                onClick={() => loadConversationOnClick(instance)}
              >
                <div className="conversationEmoji">{instance.emoji}</div>
                <div className="conversationTitle">{instance.title}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
      <section className='chatbox'>
        <div className='log'>
          {chatLog.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
        </div>
        <div className='inputcontainer'>
          <form onSubmit={handleChatInputSubmit}>
            <textarea
              ref={chatInputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleChatInputSubmit(e);
                }
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              className="input"
              placeholder="explain quantum physics in simple terms"
              rows="1"
            />
          </form>
        </div>
      </section>
    </div>
  );
}

const ChatMessage = ({ message }) => {
  return (
    <div className={`msgInstance ${message.user === 'me' ? 'msgInstance-me' : 'msgInstance-bot'}`}>
      <div className={`pfpContainer ${message.user === 'me' ? 'pfpContainer-me' : 'pfpContainer-bot'}`}>
        {message.user === 'me' && <img className='pfp' src={mypfp} alt="My profile"></img>}
        {message.user === 'bot' && <img className='pfp' src={botpfp} alt="Bot profile"></img>}
      </div>
      <div className='msg'> { message.message } </div>
    </div>
  )
}

export default App;

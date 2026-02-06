import React, { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighliter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAi = new GoogleGenerativeAI("AIzaSyBon-XrKN33wxPDoDHrJx3Zp0dDQqpTUPs")
const model = genAi.getGenerativeModel({model: "gemini-3-flash-preview"})

const ChatApp = () => {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")
    const [isTyping, setIsTyping]  = useState(false)
    const messageEndRef = useRef(null)
    const chatSessionRef = useRef(null)

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({behavior: "smooth"})
    }

    useEffect(() => {
        scrollToBottom();
        if(!chatSessionRef.current){
            chatSessionRef.current = model.startChat({
                generationConfig:{
                    temperature: 0.9,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 2048,
                },
                history:[],
            });
        }
    }, [messages])

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!input.trim()) return;

        setMessages(prev => [...prev, {sender: "user", text: input}]);
        setInput("");
        setIsTyping(true);

        try{
            let fullResponse = ""
            const result = await chatSessionRef.current.sendMessageStream(input)
            setMessages((prev) => [
                ...prev, 
                {sender: "ai", text: "", isGenerating: true},
            
            ]);

            for await(const chunk of result.stream){
                const chunkText = chunk.text()
                fullResponse += chunkText

                 setMessages((prev) => [
                ...prev.slice(0, -1), 
                {sender: "ai", text: fullResponse, isGenerating: true},
            
            ]);
            }

            setMessages((prev) => [
                ...prev.slice(0, -1), 
                {sender: "ai", text: fullResponse, isGenerating: false},
            
            ]);

            setIsTyping(false);


        }catch(error){
            console.log(error)
            setIsTyping(false)
             setMessages(prev => [...prev, {sender: "ai", text: "Sorry, there was an error", isGenerating: false}]);
        }
    };

    const MarkdownComponent = {
        code({node, inline, className, childreen, ...props}){
            const match = /Language-(\w+)/.exec(className || "")
            return !inline && match ? (
                <SyntaxHighliter 
                style={vscDarkPlus} 
                Language={match[1]} 
                Pretag ="div" 
                {...props}>
                
                    {String(childreen).replace(/\n$/, "")}
                </SyntaxHighliter>
            ) : (
               <code className={className} {...props}>
                {childreen}
               </code> 
            )
        }
    }
  
    return ( 
    <div className='flex flex-col h-screen bg-gray-100'>
        <style jsx global> {`
        
            @keyframe typing {
            
                0%{
                    opacity: 0.3;
                }
                50%{
                    opacity: 1;
                }
                100%{
                    opacity: 0.3;
                }
                
            }

            .typing-animation{
                animation: typing 1.5s infinite;
            }
     ` }
        
        </style>
        <header className='bg-blue-600 text-white p-4'>
            <h1 className='text-2xl font-bold'>Gemini Chat</h1>
        </header>

        <div className='flex-1 overflow-y-auto p-4'>
            {messages.map((message, index) => (
                <div 
                    key={index} 
                     className={`mb-4 ${
                        message.sender === 'user' ? 'text-right' : 'text-lef'}`}>
                         
                        <div 
                        
                            className={`inline-block p-2 rounded-lg ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'ai-message' }`}>

                            {message.sender === 'user' ? (
                                message.text
                            ) : (
                               <ReactMarkdown 
                               classname={`prose max-w-none ${message.isGenerating ? "typing-animation" : ""}`}
                                 components={MarkdownComponent}
                               >
                                {message.text || "Thinking..."}
                               </ReactMarkdown>
                            )}
                        </div>
                </div>
            ))}

             {isTyping && (
                <div className='inline-block p-2 rounded-lg bg-gray-300'>
                    Typing...
                </div>
             )}
            <div ref={messageEndRef} />
            
        </div> 
        <form onSubmit={handleSubmit} className='p-4 bg-white'>
             <div className='flex items-center'>
                <input type="text" className='flex-1 p-2 border rounded-l-lg focus:outline-none' value={input} placeholder='Type a message...' onChange={(e) => setInput (e.target.value)} />
                <button className='p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none'>
                    <Send size={24} />
                </button>
             </div>
        </form>
    </div>
  )
}

export default ChatApp
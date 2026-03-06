import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, Book, HelpCircle, FileQuestion, Code } from 'lucide-react';
import { API_URL } from '../config';

export default function Chatbot({ currentLesson }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Draggable state
    const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Add welcome message if opened for the first time
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ role: 'assistant', content: 'Hello! I am your AI Tutor. How can I help you with this lesson?' }]);
        }
    }, [isOpen]);

    const handleMouseDown = (e) => {
        // Only drag if clicking the outer button, not when chat is open and we click inside
        if (isOpen) return;
        isDragging.current = true;
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;

        // Prevent dragging out of bounds
        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;

        newX = Math.max(0, Math.min(newX, window.innerWidth - 60));
        newY = Math.max(0, Math.min(newY, window.innerHeight - 60));

        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const sendMessage = async (textOverride = null) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim()) return;

        const newMessages = [...messages, { role: 'user', content: textToSend }];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/chat`, {
                messages: newMessages,
                context: {
                    title: currentLesson?.title,
                    description: currentLesson?.description
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Sorry, I encountered an error connecting to the AI.';
            setMessages([...newMessages, { role: 'assistant', content: errorMsg }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleQuickAction = (action) => {
        let msg = '';
        switch (action) {
            case 'explain': msg = `Can you explain the main concept of ${currentLesson?.title || 'this lesson'} in simple terms?`; break;
            case 'summarize': msg = 'Summarize this lesson in 5 bullet points.'; break;
            case 'quiz': msg = 'Generate 5 multiple-choice quiz questions based on this lesson.'; break;
            case 'code': msg = 'I have a question about some code in this lesson. Can you explain how it works step by step?'; break;
            default: break;
        }
        if (msg) sendMessage(msg);
    };

    // Inline CSS for the typing dots animation
    const typingDotsStyle = `
        @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-5px); }
        }
        .typing-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: var(--text-muted);
            margin: 0 2px;
            animation: bounce 1.4s infinite ease-in-out both;
        }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
    `;

    return (
        <>
            <style>{typingDotsStyle}</style>

            {/* Fixed FAB in Bottom Right */}
            {!isOpen && (
                <div
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        width: '60px',
                        height: '60px',
                        borderRadius: '30px',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-lg)',
                        cursor: 'pointer',
                        zIndex: 9999,
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'scale(1.05)' }
                    }}
                >
                    <MessageSquare size={28} />
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '380px',
                    height: '550px',
                    maxHeight: '80vh',
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 10000,
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '1rem',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageSquare size={20} />
                            <span style={{ fontWeight: 600 }}>AI Tutor</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ color: 'white' }}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Quick Actions (only show if few messages) */}
                    {messages.length <= 2 && (
                        <div style={{ padding: '1rem 1rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <button onClick={() => handleQuickAction('explain')} style={{ fontSize: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                                <HelpCircle size={14} /> Explain Concept
                            </button>
                            <button onClick={() => handleQuickAction('summarize')} style={{ fontSize: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                                <Book size={14} /> Summarize
                            </button>
                            <button onClick={() => handleQuickAction('quiz')} style={{ fontSize: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                                <FileQuestion size={14} /> Gen Quiz
                            </button>
                            <button onClick={() => handleQuickAction('code')} style={{ fontSize: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                                <Code size={14} /> Explain Code
                            </button>
                        </div>
                    )}

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        padding: '1rem',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%'
                            }}>
                                <div style={{
                                    backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--background)',
                                    color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                                    padding: '0.75rem',
                                    borderRadius: '1rem',
                                    borderBottomRightRadius: msg.role === 'user' ? '0' : '1rem',
                                    borderBottomLeftRadius: msg.role === 'assistant' ? '0' : '1rem',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.5,
                                    whiteSpace: 'pre-wrap',
                                    border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none'
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                                <div style={{
                                    backgroundColor: 'var(--background)',
                                    padding: '0.75rem',
                                    borderRadius: '1rem',
                                    borderBottomLeftRadius: '0',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px'
                                }}>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
                        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--text-main)',
                                    outline: 'none',
                                    fontSize: '0.875rem'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                style={{
                                    backgroundColor: input.trim() && !isTyping ? 'var(--primary)' : 'var(--border)',
                                    color: input.trim() && !isTyping ? 'white' : 'var(--text-muted)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    width: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                                    transition: 'var(--transition)'
                                }}
                            >
                                <Send size={18} style={{ marginLeft: '-2px' }} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, Send, Users, Sparkles, Link2, Check } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import API from '../services/api';
import { ChatMessage, socketService } from '../services/socket';

interface UserInfo {
  id?: string;
  name?: string;
}

interface Meeting {
  _id: string;
  title: string;
  createdAt: string;
}

export const MeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUser, setTypingUser] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUser: UserInfo = JSON.parse(
    localStorage.getItem('syncmind_user') || '{}'
  );

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const loadRoom = async () => {
      try {
        const response = await API.get(`/chat/meetings/${id}/room`);

        if (cancelled) return;

        setMeeting(response.data.meeting);
        setMessages(response.data.messages);
      } catch (err: any) {
        console.error('Failed to load meeting room:', err);

        if (!cancelled) {
          setError(
            err.response?.data?.message || 'Failed to load meeting room'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRoom();

    const socket = socketService.connect();

    const cleanupMessage = socketService.onChatMessage((message) => {
      if (message.meetingId !== id) return;

      setMessages((previous) => {
        const alreadyExists = previous.some(
          (item) => item._id === message._id
        );

        if (alreadyExists) return previous;

        return [...previous, message];
      });
    });

    const cleanupPresence = socketService.onMeetingPresence(({ count }) => {
      setOnlineCount(count);
    });

    const cleanupTypingStart = socketService.onTypingStart(
      ({ userId, senderName }) => {
        if (userId !== currentUser.id) {
          setTypingUser(senderName);
        }
      }
    );

    const cleanupTypingStop = socketService.onTypingStop(() => {
      setTypingUser('');
    });

    const cleanupSocketError = socketService.onConnectionError((socketError) => {
      console.error('Socket connection error:', socketError.message);
      setError('Real-time connection failed.');
    });

    const joinMeeting = () => {
      socketService.joinMeeting(id, (ok, joinError) => {
        if (!ok) {
          setError(joinError || 'Unable to join meeting');
        }
      });
    };

    if (socket.connected) {
      joinMeeting();
    } else {
      socket.once('connect', joinMeeting);
    }

    return () => {
      cancelled = true;

      socketService.leaveMeeting(id);

      cleanupMessage();
      cleanupPresence();
      cleanupTypingStart();
      cleanupTypingStop();
      cleanupSocketError();

      socket.off('connect', joinMeeting);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [id, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (value: string) => {
    setDraft(value);

    if (!id) return;

    socketService.startTyping(id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(id);
    }, 700);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();

    const message = draft.trim();

    if (!message || !id || sending) return;

    setSending(true);
    setError('');

    try {
      await socketService.sendChatMessage(id, message);
      setDraft('');
      socketService.stopTyping(id);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSummarize = async () => {
    if (!id || summarizing) return;

    setSummarizing(true);
    setError('');
    setSuccessMessage('');

    try {
      await API.post(`/meetings/${id}/summarize`);
      setSuccessMessage('Meeting summarized successfully! Check the meeting details page.');
      
      setTimeout(() => {
        navigate(`/meetings/${id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to summarize meeting');
    } finally {
      setSummarizing(false);
    }
  };

  const handleCopyLink = () => {
    const meetingUrl = window.location.href;
    navigator.clipboard.writeText(meetingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        Loading meeting room...
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        Meeting not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto h-[calc(100vh-3rem)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(`/meetings/${id}`)}
              className="p-2 rounded-lg border border-gray-800 hover:bg-gray-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
                Live Meeting Room
              </p>
              <h1 className="text-xl font-bold truncate">
                {meeting.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-900 border border-gray-800 rounded-full px-3 py-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{onlineCount} online</span>
            </div>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition"
              title="Copy meeting link to invite others"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Share Link
                </>
              )}
            </button>

            <button
              onClick={handleSummarize}
              disabled={summarizing || messages.length === 0}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-sm font-medium transition"
              title={messages.length === 0 ? 'No messages to summarize' : 'Summarize this meeting with AI'}
            >
              <Sparkles className="w-4 h-4" />
              {summarizing ? 'Summarizing...' : 'Summarize'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            {successMessage}
          </div>
        )}

        <div className="flex-1 min-h-0 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-semibold">Team Chat</h2>
              <p className="text-xs text-gray-500">
                Messages are synced live for everyone in this room.
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {messages.length === 0 && (
              <div className="h-full grid place-items-center text-center text-gray-500">
                <div>
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No messages yet.</p>
                  <p className="text-xs mt-1">Start the conversation.</p>
                </div>
              </div>
            )}

            {messages.map((message) => {
              const isMine = message.userId === currentUser.id;

              return (
                <div
                  key={message._id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] ${
                      isMine ? 'items-end' : 'items-start'
                    } flex flex-col`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs text-gray-400">
                        {isMine ? 'You' : message.senderName}
                      </span>

                      <span className="text-[10px] text-gray-600">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? 'bg-indigo-600 rounded-br-md'
                          : 'bg-gray-800 border border-gray-700 rounded-bl-md text-gray-200'
                      }`}
                    >
                      {message.message}
                    </div>
                  </div>
                </div>
              );
            })}

            {typingUser && (
              <p className="text-xs text-gray-500 italic">
                {typingUser} is typing...
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="p-4 border-t border-gray-800"
          >
            <div className="flex items-end gap-3">
              <textarea
                value={draft}
                onChange={(event) => handleTyping(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(event);
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder="Write a message..."
                className="flex-1 resize-none bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
              />

              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-gray-600 mt-2">
              Enter to send · Shift + Enter for a new line
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
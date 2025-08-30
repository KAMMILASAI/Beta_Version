import React, { useState, useEffect, useRef } from 'react';
import { 
  FiSearch, 
  FiPlus, 
  FiSend, 
  FiMoreVertical, 
  FiSave, 
  FiTrash2, 
  FiArrowLeft,
  FiUser,
  FiPaperclip,
  FiDownload,
  FiImage,
  FiFile,
  FiUsers,
  FiTrash
} from 'react-icons/fi';
import axios from 'axios';

const DynamicChat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showChatList, setShowChatList] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  
  const messagesEndRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get auth token
  const getToken = () => localStorage.getItem('token');

  // Get current user id from JWT (as string for stable comparisons)
  const getCurrentUserId = () => {
    try {
      const token = getToken();
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return String(payload.id);
    } catch (e) {
      return null;
    }
  };

  // API calls
  const api = axios.create({
    baseURL: '/api/chat',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Refresh unread counts
  const refreshUnreadCounts = async () => {
    try {
      const response = await api.get('/chats');
      setChats(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to refresh unread counts:', error);
    }
  };

  // Load chats on component mount and set up periodic refresh
  useEffect(() => {
    loadChats();
    
    // Refresh unread counts every 10 seconds
    const interval = setInterval(refreshUnreadCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load all chats
  const loadChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  // Load messages for selected chat
  const loadMessages = async (chatId) => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/${chatId}`);
      setMessages(Array.isArray(response.data) ? response.data : []);
      
      // Mark messages as read
      await api.post('/mark-read', { chatId });
      // Optimistically zero unread for this chat in sidebar
      setChats(prev => prev.map(c => c._id === String(chatId) ? { ...c, unreadCount: 0 } : c));
      // Sync with backend (ensures sidebar reflects latest counts)
      refreshUnreadCounts();
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search users
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.get(`/search-users?query=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Create new chat
  const createChat = async (participantId) => {
    try {
      const response = await api.post('/create-chat', { participantId });
      const newChat = response.data;
      
      // Update chats list
      setChats(prev => {
        const exists = prev.find(chat => chat._id === newChat._id);
        if (exists) return prev;
        return [newChat, ...prev];
      });
      
      // Select the new chat
      setSelectedChat(newChat);
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
      
      // Load messages
      loadMessages(newChat._id);
      
      if (isMobile) {
        setShowChatList(false);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const response = await api.post('/send-message', {
        chatId: selectedChat._id,
        text: newMessage
      });
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      
      // Update chat's last message and refresh unread counts
      setChats(prev => prev.map(chat => 
        chat._id === selectedChat._id 
          ? { ...chat, lastMessage: response.data, lastActivity: new Date() }
          : chat
      ));
      
      // Refresh unread counts for all chats
      setTimeout(refreshUnreadCounts, 500);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Toggle save message
  const toggleSaveMessage = async (messageId) => {
    try {
      const response = await api.post('/toggle-save-message', { messageId });
      
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, isSaved: response.data.savedByUser }
          : msg
      ));
      
      setShowMessageOptions(null);
    } catch (error) {
      console.error('Failed to toggle save message:', error);
    }
  };

  // Handle file selection (show preview)
  const handleFileSelection = (file) => {
    if (!selectedChat || !file) return;
    
    // Check file size (1MB limit)
    if (file.size > 1024 * 1024) {
      alert('File size must be less than 1MB');
      return;
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed');
      return;
    }
    
    // Create file preview
    const preview = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      isImage: file.type.startsWith('image/'),
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    };
    
    setFilePreview(preview);
    setShowFilePreview(true);
  };
  
  // Handle file upload after confirmation
  const handleFileUpload = async () => {
    if (!filePreview) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', filePreview.file);
      formData.append('chatId', selectedChat._id);
      
      const response = await api.post('/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessages(prev => [...prev, response.data]);
      scrollToBottom();
      
      // Refresh chat list to update last message
      refreshUnreadCounts();
      
      // Close preview
      closeFilePreview();
      
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  // Close file preview
  const closeFilePreview = () => {
    if (filePreview?.url) {
      URL.revokeObjectURL(filePreview.url);
    }
    setFilePreview(null);
    setShowFilePreview(false);
  };
  
  // Delete file message
  const deleteFileMessage = async (messageId) => {
    try {
      await api.delete(`/delete-file/${messageId}`);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      setShowMessageOptions(null);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };
  
  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/delete-message/${messageId}`);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      setShowMessageOptions(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  // Delete entire chat
  const deleteChat = async (chatId) => {
    if (!window.confirm('Are you sure you want to delete this entire chat? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/delete-chat/${chatId}`);
      
      // Remove chat from list
      setChats(prev => prev.filter(chat => chat._id !== chatId));
      
      // Clear selected chat if it was the deleted one
      if (selectedChat?._id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
      
      if (isMobile) {
        setShowChatList(true);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('Failed to delete chat. Please try again.');
    }
  };

  // Format time helper
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get chat display name
  const getChatDisplayName = (chat, currentUserId) => {
    if (chat.chatType === 'group') {
      return chat.chatName || 'Group Chat';
    }
    
    const otherParticipant = chat.participants.find(p => String(p._id) !== String(currentUserId));
    return otherParticipant?.firstName 
      ? `${otherParticipant.firstName} ${otherParticipant.lastName || ''}`.trim()
      : otherParticipant?.name || otherParticipant?.email || 'Unknown User';
  };

  // Get user role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'recruiter': return '#28a745';
      case 'candidate': return '#007bff';
      default: return '#6c757d';
    }
  };

  return (
    <div className="chat-container">
      <style>{`
        .chat-container {
          display: flex;
          height: 100vh;
          height: 100dvh; /* better mobile viewport */
          width: 100%;
          margin: 0;
          background: #0b1220;
          border-radius: 0;
          box-shadow: none;
          overflow: hidden;
        }

        .chat-sidebar {
          width: ${isMobile ? '100%' : '350px'};
          background: #0f1629;
          border-right: 1px solid #26314f;
          display: ${isMobile && !showChatList ? 'none' : 'flex'};
          flex-direction: column;
        }

        .chat-main {
          flex: 1;
          display: ${isMobile && showChatList ? 'none' : 'flex'};
          flex-direction: column;
          overflow: hidden; /* keep header/input static; only messages scroll */
          min-height: 0; /* enable child flex item to shrink and scroll */
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid #26314f;
          background: #0b1220;
        }

        .sidebar-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .search-box {
          position: relative;
          margin-bottom: 10px;
        }

        .search-input {
          width: 100%;
          padding: 10px 40px 10px 15px;
          border: 1px solid #26314f;
          border-radius: 25px;
          font-size: 14px;
          outline: none;
          background: #0f1629;
          color: #e2e8f0;
        }

        .search-icon {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .new-chat-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #1b4edb;
          color: white;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s, opacity 0.2s;
          box-shadow: none;
        }

        .new-chat-btn:hover { background: #0f3fb1; }

        .chat-list {
          flex: 1;
          overflow-y: auto;
        }

        .chat-item {
          padding: 15px 20px;
          border-bottom: 1px solid #1e2a4a;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-item:hover {
          background: #101a32;
        }

        .chat-item.active {
          background: #0e1a35;
          border-right: 3px solid #007bff;
        }

        .chat-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: #007bff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .chat-info {
          flex: 1;
          min-width: 0;
        }

        .chat-name {
          font-weight: 600;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .role-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          color: white;
          text-transform: uppercase;
          font-weight: bold;
        }

        .chat-preview {
          font-size: 13px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chat-time {
          font-size: 12px;
          color: #94a3b8;
        }

        .unread-badge {
          background: #dc3545;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          position: absolute;
          top: -5px;
          right: -5px;
          border: 2px solid #0f1629;
        }

        .chat-header {
          position: sticky;
          top: env(safe-area-inset-top, 0);
          z-index: 10;
          padding: 16px 18px;
          border-bottom: 1px solid #26314f;
          background: #0b1220;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .back-btn {
          display: ${isMobile ? 'block' : 'none'};
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          color: #6c757d;
        }

        .icon-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          color: #cbd5e1;
          transition: background 0.2s, color 0.2s, transform 0.1s;
          box-shadow: none;
          outline: none;
        }

        .icon-btn:hover { background: #101a32; color: #e2e8f0; }
        .icon-btn:active { transform: scale(0.98); }
        .icon-btn:focus-visible { box-shadow: 0 0 0 2px rgba(27,78,219,0.35); }
        .icon-btn.danger { color: #dc3545; border: 1px solid rgba(220,53,69,0.35); background: transparent; }
        .icon-btn.danger:hover { background: rgba(220,53,69,0.08); color: #ff6b81; }

        /* Header icon sizing for consistent look */
        .header-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        /* Smaller avatar in header on mobile */
        @media (max-width: 768px) {
          .chat-header { padding: 16px 18px; gap: 10px; }
          .chat-header .chat-avatar { width: 36px; height: 36px; font-size: 14px; }
        }

        .messages-container {
          flex: 1 1 auto;
          min-height: 0; /* critical for proper scrolling inside flex */
          overflow-y: auto;
          padding: 26px 16px calc(120px + env(safe-area-inset-bottom));
          background: #0f1629;
        }

        .message {
          display: flex;
          margin-bottom: 15px;
          align-items: flex-end;
        }

        .message.own {
          justify-content: flex-end;
        }

        .message-content {
          max-width: 70%;
          position: relative;
        }

        .message-bubble {
          padding: 10px 14px;
          border-radius: 18px;
          position: relative;
          word-wrap: break-word;
          box-shadow: 0 1px 3px rgba(0,0,0,0.25);
        }

        .message.own .message-bubble {
          background: #1b4edb;
          color: #e2e8f0;
        }

        .message:not(.own) .message-bubble {
          background: #101a32;
          color: #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          border: 1px solid #26314f;
        }

        .message-time {
          font-size: 10px;
          opacity: 0.65;
          margin-top: 3px;
          text-align: right;
        }

        .message:not(.own) .message-time {
          text-align: left;
        }

        .message-options {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #0f1629;
          border: 1px solid #26314f;
          border-radius: 15px;
          padding: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.4);
          display: flex;
          gap: 5px;
          z-index: 10;
        }

        .option-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .option-btn:hover {
          background: #101a32;
        }

        .saved-indicator {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #28a745;
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }

        .message-input {
          position: sticky;
          bottom: 0;
          padding: 12px 16px;
          padding-bottom: calc(16px + env(safe-area-inset-bottom));
          border-top: 1px solid #26314f;
          background: #0b1220;
          box-shadow: 0 -1px 6px rgba(0, 0, 0, 0.18);
          z-index: 11;
        }

        .input-form {
          display: flex;
          gap: 10px;
          align-items: center;
          background: #0f1629;
          border-radius: 16px;
          padding: 8px 12px;
          border: 1px solid #26314f;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-form:focus-within {
          border-color: #1b4edb;
          box-shadow: 0 0 0 3px rgba(27, 78, 219, 0.2);
        }

        .text-input {
          flex: 1;
          padding: 8px 12px;
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          color: #e2e8f0;
        }

        .text-input::placeholder {
          color: #94a3b8;
        }

        .send-btn {
          background: #1b4edb;
          color: white;
          border: none;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          cursor: pointer;
          transition: background 0.2s;
          box-shadow: none;
        }

        /* Make sure the send icon stays visible */
        .send-btn svg { color: inherit; width: 18px; height: 18px; flex-shrink: 0; display: block; }
        .send-btn svg path { stroke: currentColor; stroke-width: 2.2; fill: none; }

        .send-btn:hover:not(:disabled) { background: #0f3fb1; }

        .send-btn:disabled { background: #6c757d; color: #e2e8f0; cursor: not-allowed; }
        .send-btn:disabled svg { color: inherit; opacity: 0.95; }

        .attachment-btn {
          background: transparent;
          color: #cbd5e1;
          border: 1px solid #26314f;
          border-radius: 50%;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          box-shadow: none;
        }

        /* Ensure the paperclip icon is visible */
        .attachment-btn svg { color: inherit; width: 18px; height: 18px; flex-shrink: 0; display: block; }
        .attachment-btn svg path { stroke: currentColor; stroke-width: 2.2; fill: none; }

        .attachment-btn:hover:not(:disabled) { background: #101a32; color: #e2e8f0; }
        .attachment-btn:disabled svg { color: #94a3b8; opacity: 0.9; }

        .attachment-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .file-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: linear-gradient(135deg, #0f1629 0%, #101a32 100%);
          border-radius: 10px;
          border: 1px solid #26314f;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: all 0.2s;
          max-width: 280px;
        }

        .file-message:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          transform: translateY(-1px);
        }

        .file-icon {
          flex-shrink: 0;
          background: #1b4edb;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(27, 78, 219, 0.3);
        }

        .file-info {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .file-name {
          font-weight: 600;
          color: #e2e8f0;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
          flex: 1;
        }

        .file-size {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .file-download {
          background: linear-gradient(135deg, #1b4edb 0%, #0f3fb1 100%);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 10px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(27, 78, 219, 0.3);
        }

        .file-download:hover {
          background: linear-gradient(135deg, #0f3fb1 0%, #0a2f89 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(27, 78, 219, 0.4);
        }

        .file-download:active {
          transform: translateY(0);
        }

        .image-message {
          max-width: 300px;
          border-radius: 8px;
          overflow: hidden;
        }

        .image-message img {
          width: 100%;
          height: auto;
          display: block;
        }

        .file-preview-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .file-preview-modal {
          background: #0f1629;
          border: 1px solid #26314f;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
          color: #e2e8f0;
        }

        .file-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #26314f;
        }

        .file-preview-title {
          font-size: 18px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .close-preview-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6c757d;
          padding: 4px;
          border-radius: 4px;
        }

        .close-preview-btn:hover {
          background: #101a32;
          color: #e2e8f0;
        }

        .file-preview-content {
          text-align: center;
          margin-bottom: 24px;
        }

        .preview-image {
          max-width: 100%;
          max-height: 300px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .preview-file-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 24px;
          background: linear-gradient(135deg, #0f1629 0%, #101a32 100%);
          border-radius: 12px;
          border: 2px dashed #26314f;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .preview-file-icon {
          background: #007bff;
          color: white;
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .preview-file-details {
          text-align: left;
        }

        .preview-file-name {
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 6px;
          font-size: 16px;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 250px;
        }

        .preview-file-size {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 500;
        }

        .file-preview-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .preview-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
        }

        .cancel-btn:hover {
          background: #5a6268;
        }

        .send-file-btn {
          background: #1b4edb;
          color: white;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .send-file-btn:hover:not(:disabled) {
          background: #0f3fb1;
        }

        .send-file-btn:disabled {
          background: #adb5bd;
          cursor: not-allowed;
        }

        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #0f1629;
          border: 1px solid #26314f;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          z-index: 20;
          max-height: 200px;
          overflow-y: auto;
        }

        .search-result {
          padding: 12px 15px;
          cursor: pointer;
          border-bottom: 1px solid #26314f;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #e2e8f0;
        }

        .search-result:hover {
          background: #101a32;
        }

        .search-result:last-child {
          border-bottom: none;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6c757d;
          text-align: center;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100px;
          color: #6c757d;
        }

        @media (max-width: 768px) {
          .new-chat-btn { padding: 8px 12px; border-radius: 12px; }
          .chat-container {
            height: 100vh;
            height: 100dvh;
            margin: 0;
            border-radius: 0;
          }
          .input-form { gap: 8px; padding: 8px 10px; border-radius: 14px; }
          .send-btn { width: 40px; height: 40px; }
          .attachment-btn { width: 38px; height: 38px; }
          .message-content { max-width: 88%; }
          .message-bubble { padding: 10px 12px; border-radius: 16px; }
          .chat-name { font-size: 14px; }
          .chat-preview { font-size: 12px; }
          /* If a bottom navigation bar overlaps the chat, offset the input above it */
          .message-input { 
            padding: 10px 12px; 
            box-shadow: 0 -1px 4px rgba(0,0,0,0.16);
            bottom: calc(64px + env(safe-area-inset-bottom)); /* lift above bottom nav */
          }
          .messages-container { 
            padding-top: 30px; /* give more room under header */
            padding-bottom: calc(156px + 64px + env(safe-area-inset-bottom)); /* a bit more room for input + bottom nav */
          }
        }
      `}</style>

      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <h3 style={{ margin: 0, fontSize: '18px' }}>Messages</h3>
            <button 
              className="new-chat-btn"
              onClick={() => setShowNewChat(!showNewChat)}
            >
              <FiPlus size={16} />
              New Chat
            </button>
          </div>
          
          {showNewChat && (
            <div className="search-box" style={{ position: 'relative' }}>
              <input
                type="text"
                className="search-input"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch className="search-icon" size={16} />
              
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(user => (
                    <div
                      key={user._id}
                      className="search-result"
                      onClick={() => createChat(user._id)}
                    >
                      <div 
                        className="chat-avatar" 
                        style={{ 
                          width: '35px', 
                          height: '35px',
                          backgroundImage: user.image ? `url(${user.image})` : 'none',
                          backgroundColor: user.image ? 'transparent' : '#007bff',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        {!user.image && (user.firstName?.[0] || user.name?.[0] || user.email[0])}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500' }}>
                          {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.name || user.email}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          {user.role} • {user.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="chat-list">
          {(Array.isArray(chats) ? chats : []).map(chat => {
            const currentUserId = getCurrentUserId();
            const displayName = getChatDisplayName(chat, currentUserId);
            const otherParticipant = chat.participants.find(p => String(p._id) !== String(currentUserId));
            
            return (
              <div
                key={chat._id}
                className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedChat(chat);
                  loadMessages(chat._id);
                  if (isMobile) setShowChatList(false);
                }}
              >
                <div 
                  className="chat-avatar"
                  style={{
                    backgroundImage: otherParticipant?.image ? `url(${otherParticipant.image})` : 'none',
                    backgroundColor: otherParticipant?.image ? 'transparent' : '#007bff',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!otherParticipant?.image && displayName[0]?.toUpperCase()}
                  {chat.unreadCount > 0 && (
                    <div className="unread-badge">
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </div>
                  )}
                </div>
                <div className="chat-info">
                  <div className="chat-name">
                    {displayName}
                    {otherParticipant && (
                      <span 
                        className="role-badge"
                        style={{ backgroundColor: getRoleBadgeColor(otherParticipant.role) }}
                      >
                        {otherParticipant.role}
                      </span>
                    )}
                  </div>
                  <div className="chat-preview">
                    {chat.lastMessage?.text || 'Start a conversation...'}
                  </div>
                </div>
                <div className="chat-time">
                  {chat.lastActivity && formatTime(chat.lastActivity)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              {isMobile && (
                <button 
                  className="back-btn icon-btn header-icon"
                  onClick={() => setShowChatList(true)}
                  aria-label="Back"
                >
                  <FiArrowLeft size={18} />
                </button>
              )}
              <div 
                className="chat-avatar"
                style={{
                  backgroundImage: (() => {
                    const meId = getCurrentUserId();
                    const other = selectedChat.participants.find(p => String(p._id) !== String(meId));
                    return other?.image ? `url(${other.image})` : 'none';
                  })(),
                  backgroundColor: (() => {
                    const meId = getCurrentUserId();
                    const other = selectedChat.participants.find(p => String(p._id) !== String(meId));
                    return other?.image ? 'transparent' : '#007bff';
                  })(),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {(() => {
                  const meId = getCurrentUserId();
                  const otherHasImage = selectedChat.participants.find(p => String(p._id) !== String(meId))?.image;
                  return !otherHasImage && getChatDisplayName(selectedChat, meId)[0]?.toUpperCase();
                })()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '16px' }}>
                  {getChatDisplayName(selectedChat, getCurrentUserId())}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {selectedChat.chatType === 'group' ? `${selectedChat.participants.length} members` : 'Online'}
                </div>
              </div>
              <button
                className="icon-btn header-icon danger"
                onClick={() => deleteChat(selectedChat._id)}
                title="Delete Chat"
                aria-label="Delete Chat"
              >
                <FiTrash size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {loading ? (
                <div className="loading">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="empty-state">
                  <FiUsers size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                (Array.isArray(messages) ? messages : []).map(message => {
                  const currentUserId = getCurrentUserId();
                  const isOwn = String(message.sender._id) === String(currentUserId);
                  
                  return (
                    <div
                      key={message._id}
                      className={`message ${isOwn ? 'own' : ''}`}
                      onClick={() => setShowMessageOptions(
                        showMessageOptions === message._id ? null : message._id
                      )}
                    >
                      <div className="message-content">
                        <div className="message-bubble">
                          {message.messageType === 'image' && message.attachment ? (
                            <div className="image-message">
                              <img 
                                src={message.attachment.url} 
                                alt={message.attachment.fileName}
                                onClick={() => window.open(message.attachment.url, '_blank')}
                                style={{ cursor: 'pointer' }}
                              />
                              {message.text && (
                                <div style={{ padding: '8px 0 0 0', fontSize: '14px' }}>
                                  {message.text}
                                </div>
                              )}
                            </div>
                          ) : message.messageType === 'file' && message.attachment ? (
                            <div className="file-message">
                              <div className="file-icon">
                                <FiFile size={16} />
                              </div>
                              <div className="file-info">
                                <div className="file-name">{message.attachment.fileName}</div>
                                <div className="file-size">
                                  {formatFileSize(message.attachment.fileSize)}
                                </div>
                              </div>
                              <button 
                                className="file-download"
                                onClick={() => window.open(message.attachment.url, '_blank')}
                              >
                                <FiDownload size={12} />
                                Download
                              </button>
                            </div>
                          ) : (
                            message.text
                          )}
                          {message.isSaved && (
                            <div className="saved-indicator">
                              <FiSave size={8} />
                            </div>
                          )}
                        </div>
                        <div className="message-time">
                          {formatTime(message.createdAt)}
                        </div>
                        
                        {showMessageOptions === message._id && (
                          <div className="message-options">
                            <button
                              className="option-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveMessage(message._id);
                              }}
                              title={message.isSaved ? 'Unsave' : 'Save'}
                            >
                              <FiSave size={14} color={message.isSaved ? '#28a745' : '#6c757d'} />
                            </button>
                            {isOwn && (
                              <button
                                className="option-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (message.attachment) {
                                    deleteFileMessage(message._id);
                                  } else {
                                    deleteMessage(message._id);
                                  }
                                }}
                                title="Delete"
                              >
                                <FiTrash2 size={14} color="#dc3545" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="message-input">
              <form className="input-form" onSubmit={sendMessage}>
                <button
                  type="button"
                  className="attachment-btn"
                  onClick={triggerFileInput}
                  disabled={uploading}
                  title="Upload file (max 1MB)"
                >
                  {uploading ? '...' : <FiPaperclip size={18} />}
                </button>
                <input
                  type="text"
                  className="text-input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="send-btn"
                  disabled={!newMessage.trim()}
                >
                  <FiSend size={18} />
                </button>
              </form>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handleFileSelection(file);
                    e.target.value = ''; // Reset input
                  }
                }}
              />
            </div>
          </>
        ) : (
          <div className="empty-state">
            <FiUsers size={64} style={{ marginBottom: '20px', opacity: 0.3 }} />
            <h3 style={{ margin: '0 0 10px 0', color: '#6c757d' }}>Welcome to Messages</h3>
            <p style={{ margin: 0, opacity: 0.7 }}>Select a chat to start messaging</p>
          </div>
        )}
      </div>
      
      {/* File Preview Modal */}
      {showFilePreview && filePreview && (
        <div className="file-preview-overlay" onClick={closeFilePreview}>
          <div className="file-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="file-preview-header">
              <h3 className="file-preview-title">Send File</h3>
              <button className="close-preview-btn" onClick={closeFilePreview}>
                ×
              </button>
            </div>
            
            <div className="file-preview-content">
              {filePreview.isImage ? (
                <img 
                  src={filePreview.url} 
                  alt={filePreview.name}
                  className="preview-image"
                />
              ) : (
                <div className="preview-file-info">
                  <div className="preview-file-icon">
                    <FiFile size={32} />
                  </div>
                  <div className="preview-file-details">
                    <div className="preview-file-name">{filePreview.name}</div>
                    <div className="preview-file-size">{formatFileSize(filePreview.size)}</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="file-preview-actions">
              <button 
                className="preview-btn cancel-btn" 
                onClick={closeFilePreview}
                disabled={uploading}
              >
                Cancel
              </button>
              <button 
                className="preview-btn send-file-btn" 
                onClick={handleFileUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>Sending...</>
                ) : (
                  <>
                    <FiSend size={16} />
                    Send File
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicChat;

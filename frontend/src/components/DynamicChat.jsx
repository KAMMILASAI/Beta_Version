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
      setChats(response.data);
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
      setChats(response.data);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  // Load messages for selected chat
  const loadMessages = async (chatId) => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/${chatId}`);
      setMessages(response.data);
      
      // Mark messages as read
      await api.post('/mark-read', { chatId });
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
    
    const otherParticipant = chat.participants.find(p => p._id !== currentUserId);
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
      <style jsx>{`
        .chat-container {
          display: flex;
          height: 90vh;
          width: 100%;
          margin: 0;
          background: white;
          border-radius: 0;
          box-shadow: none;
          overflow: hidden;
        }

        .chat-sidebar {
          width: ${isMobile ? '100%' : '350px'};
          background: #f8f9fa;
          border-right: 1px solid #e9ecef;
          display: ${isMobile && !showChatList ? 'none' : 'flex'};
          flex-direction: column;
        }

        .chat-main {
          flex: 1;
          display: ${isMobile && showChatList ? 'none' : 'flex'};
          flex-direction: column;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid #e9ecef;
          background: white;
        }

        .sidebar-title {
          display: flex;
          justify-content: between;
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
          border: 1px solid #dee2e6;
          border-radius: 25px;
          font-size: 14px;
          outline: none;
        }

        .search-icon {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }

        .new-chat-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .new-chat-btn:hover {
          background: #0056b3;
        }

        .chat-list {
          flex: 1;
          overflow-y: auto;
        }

        .chat-item {
          padding: 15px 20px;
          border-bottom: 1px solid #f1f3f4;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-item:hover {
          background: #f1f3f4;
        }

        .chat-item.active {
          background: #e3f2fd;
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
          color: #6c757d;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chat-time {
          font-size: 12px;
          color: #6c757d;
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
          border: 2px solid white;
        }

        .chat-header {
          padding: 20px;
          border-bottom: 1px solid #e9ecef;
          background: white;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .back-btn {
          display: ${isMobile ? 'block' : 'none'};
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
          color: #6c757d;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f8f9fa;
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
          padding: 12px 16px;
          border-radius: 18px;
          position: relative;
          word-wrap: break-word;
        }

        .message.own .message-bubble {
          background: #007bff;
          color: white;
        }

        .message:not(.own) .message-bubble {
          background: white;
          color: #333;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .message-time {
          font-size: 11px;
          opacity: 0.7;
          margin-top: 4px;
          text-align: right;
        }

        .message:not(.own) .message-time {
          text-align: left;
        }

        .message-options {
          position: absolute;
          top: -5px;
          right: -5px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 15px;
          padding: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
          background: #f1f3f4;
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
          padding: 16px 20px;
          border-top: 1px solid #e9ecef;
          background: white;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
        }

        .input-form {
          display: flex;
          gap: 12px;
          align-items: center;
          background: #f8f9fa;
          border-radius: 25px;
          padding: 8px 12px;
          border: 1px solid #e9ecef;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-form:focus-within {
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .text-input {
          flex: 1;
          padding: 8px 12px;
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          color: #333;
        }

        .text-input::placeholder {
          color: #6c757d;
        }

        .send-btn {
          background: #007bff;
          color: white;
          border: none;
          border-radius: 50%;
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          background: #0056b3;
        }

        .send-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .attachment-btn {
          background: #007bff;
          color: white;
          border: none;
          border-radius: 50%;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
        }

        .attachment-btn:hover:not(:disabled) {
          background: #0056b3;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
        }

        .attachment-btn:disabled {
          background: #adb5bd;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .file-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 10px;
          border: 1px solid #dee2e6;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.2s;
          max-width: 280px;
        }

        .file-message:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          transform: translateY(-1px);
        }

        .file-icon {
          flex-shrink: 0;
          background: #007bff;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0, 123, 255, 0.2);
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
          color: #333;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
          flex: 1;
        }

        .file-size {
          font-size: 11px;
          color: #6c757d;
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .file-download {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
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
          box-shadow: 0 2px 6px rgba(0, 123, 255, 0.2);
        }

        .file-download:hover {
          background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0, 123, 255, 0.3);
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
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        }

        .file-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e9ecef;
        }

        .file-preview-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
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
          background: #f8f9fa;
          color: #333;
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
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          border: 2px dashed #007bff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
          color: #333;
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
          color: #6c757d;
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
          background: #007bff;
          color: white;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .send-file-btn:hover:not(:disabled) {
          background: #0056b3;
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
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 20;
          max-height: 200px;
          overflow-y: auto;
        }

        .search-result {
          padding: 12px 15px;
          cursor: pointer;
          border-bottom: 1px solid #f1f3f4;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .search-result:hover {
          background: #f8f9fa;
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
          .chat-container {
            height: 100vh;
            margin: 0;
            border-radius: 0;
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
          {chats.map(chat => {
            const currentUserId = JSON.parse(atob(getToken().split('.')[1])).id;
            const displayName = getChatDisplayName(chat, currentUserId);
            const otherParticipant = chat.participants.find(p => p._id !== currentUserId);
            
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
                  className="back-btn"
                  onClick={() => setShowChatList(true)}
                >
                  <FiArrowLeft size={20} />
                </button>
              )}
              <div 
                className="chat-avatar"
                style={{
                  backgroundImage: selectedChat.participants.find(p => p._id !== JSON.parse(atob(getToken().split('.')[1])).id)?.image 
                    ? `url(${selectedChat.participants.find(p => p._id !== JSON.parse(atob(getToken().split('.')[1])).id).image})` 
                    : 'none',
                  backgroundColor: selectedChat.participants.find(p => p._id !== JSON.parse(atob(getToken().split('.')[1])).id)?.image 
                    ? 'transparent' 
                    : '#007bff',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!selectedChat.participants.find(p => p._id !== JSON.parse(atob(getToken().split('.')[1])).id)?.image && 
                  getChatDisplayName(selectedChat, JSON.parse(atob(getToken().split('.')[1])).id)[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '16px' }}>
                  {getChatDisplayName(selectedChat, JSON.parse(atob(getToken().split('.')[1])).id)}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {selectedChat.chatType === 'group' ? `${selectedChat.participants.length} members` : 'Online'}
                </div>
              </div>
              <button
                onClick={() => deleteChat(selectedChat._id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  color: '#dc3545',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#f8f9fa'}
                onMouseOut={(e) => e.target.style.background = 'none'}
                title="Delete Chat"
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
                messages.map(message => {
                  const currentUserId = JSON.parse(atob(getToken().split('.')[1])).id;
                  const isOwn = message.sender._id === currentUserId;
                  
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

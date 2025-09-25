import React, { useState, useEffect, useRef } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Send, Paperclip, Image, FileText, MessageCircle, ChevronDown, ChevronUp, Edit, Trash2, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface ChatMessage {
  id: string;
  user_id: string;
  content: string | null;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  is_edited?: boolean;
  edited_at?: string | null;
  profiles?: {
    display_name: string | null;
  } | null;
  likes?: ChatLike[];
  comments?: ChatComment[];
}

interface ChatLike {
  id: string;
  user_id: string;
  emoji: string;
  profiles?: {
    display_name: string | null;
  } | null;
}

interface ChatComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    display_name: string | null;
  } | null;
  likes?: ChatCommentLike[];
}

interface ChatCommentLike {
  id: string;
  user_id: string;
  emoji: string;
  profiles?: {
    display_name: string | null;
  } | null;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileCaption, setFileCaption] = useState('');
  const [showFileDialog, setShowFileDialog] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getUser();
    fetchMessages();
    subscribeToMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles:user_id (display_name),
        likes:chat_likes (
          id,
          user_id,
          emoji,
          profiles:user_id (display_name)
        ),
        comments:chat_comments (
          id,
          user_id,
          content,
          created_at,
          profiles:user_id (display_name),
          likes:chat_comment_likes (
            id,
            user_id,
            emoji,
            profiles:user_id (display_name)
          )
        )
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages((data as any) || []);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('chat_messages_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, async (payload) => {
        // Fetch the new message with profile data
        const { data } = await supabase
          .from('chat_messages')
          .select(`
            *,
            profiles:user_id (display_name)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          setMessages(prev => [...prev, data as any]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert([{
        user_id: user.id,
        content: newMessage,
        message_type: 'text'
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      return;
    }

    setNewMessage('');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only images, PDFs, and text files are allowed",
        variant: "destructive"
      });
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive"
      });
      return;
    }

    setPendingFile(file);
    setFileCaption('');
    setShowFileDialog(true);
  };

  const handleFileUpload = async () => {
    if (!pendingFile || !user) return;

    setUploading(true);
    setShowFileDialog(false);

    try {
      const fileExt = pendingFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, pendingFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: user.id,
          content: fileCaption.trim() || null,
          message_type: 'file',
          file_url: publicUrl,
          file_name: pendingFile.name,
          file_type: pendingFile.type,
          file_size: pendingFile.size
        }]);

      if (messageError) throw messageError;

      toast({
        title: "File uploaded",
        description: "File shared successfully"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setPendingFile(null);
      setFileCaption('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const cancelFileUpload = () => {
    setPendingFile(null);
    setFileCaption('');
    setShowFileDialog(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLikeMessage = async (messageId: string, emoji: string = '👍') => {
    if (!user) return;

    // Check if user already liked with this emoji
    const message = messages.find(m => m.id === messageId);
    const existingLike = message?.likes?.find(like => 
      like.user_id === user.id && like.emoji === emoji
    );

    if (existingLike) {
      // Remove like
      const { error } = await supabase
        .from('chat_likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove like",
          variant: "destructive"
        });
        return;
      }
    } else {
      // Add like
      const { error } = await supabase
        .from('chat_likes')
        .insert([{
          user_id: user.id,
          message_id: messageId,
          emoji
        }]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add like",
          variant: "destructive"
        });
        return;
      }
    }

    // Refresh messages to show updated likes
    fetchMessages();
  };

  const handleLikeComment = async (commentId: string, emoji: string = '👍') => {
    if (!user) return;

    // Find the comment to check existing likes
    const comment = messages
      .flatMap(m => m.comments || [])
      .find(c => c.id === commentId);

    const existingLike = comment?.likes?.find(like => 
      like.user_id === user.id && like.emoji === emoji
    );

    if (existingLike) {
      // Remove like
      const { error } = await supabase
        .from('chat_comment_likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove comment like",
          variant: "destructive"
        });
        return;
      }
    } else {
      // Add like
      const { error } = await supabase
        .from('chat_comment_likes')
        .insert([{
          user_id: user.id,
          comment_id: commentId,
          emoji
        }]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to like comment",
          variant: "destructive"
        });
        return;
      }
    }

    // Refresh messages to show updated comment likes
    fetchMessages();
  };

  const handleAddComment = async (messageId: string) => {
    if (!user || !newComment[messageId]?.trim()) return;

    const { error } = await supabase
      .from('chat_comments')
      .insert([{
        user_id: user.id,
        message_id: messageId,
        content: newComment[messageId].trim()
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
      return;
    }

    setNewComment(prev => ({ ...prev, [messageId]: '' }));
    fetchMessages();
  };

  const toggleComments = (messageId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!user || !newContent.trim()) return;

    const { error } = await supabase
      .from('chat_messages')
      .update({
        content: newContent.trim(),
        is_edited: true
      })
      .eq('id', messageId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to edit message",
        variant: "destructive"
      });
      return;
    }

    setEditingMessage(null);
    setEditContent('');
    fetchMessages();
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Message deleted",
      description: "Your message has been deleted successfully"
    });
    fetchMessages();
  };

  const startEdit = (message: ChatMessage) => {
    setEditingMessage(message.id);
    setEditContent(message.content || '');
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = user && message.user_id === user.id;
    const displayName = message.profiles?.display_name || 'Anonymous';
    const likes = message.likes || [];
    const comments = message.comments || [];
    const isEditing = editingMessage === message.id;
    
    // Group likes by emoji
    const likeGroups = likes.reduce((acc, like) => {
      if (!acc[like.emoji]) {
        acc[like.emoji] = [];
      }
      acc[like.emoji].push(like);
      return acc;
    }, {} as { [emoji: string]: ChatLike[] });

    return (
      <div key={message.id} className="mb-6">
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          <Card className="max-w-xs md:max-w-lg p-4 bg-gray-50 border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs text-gray-600 flex-1">
                {displayName} • {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                {message.is_edited && message.edited_at && (
                  <span className="ml-2 italic">(edited {formatDistanceToNow(new Date(message.edited_at), { addSuffix: true })})</span>
                )}
              </div>
              
              {/* Edit/Delete buttons for own messages */}
              {isOwnMessage && message.message_type === 'text' && !isEditing && (
                <div className="flex gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => startEdit(message)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this message? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteMessage(message.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Message content or edit form */}
            {isEditing ? (
              <div className="mb-3">
                <ReactQuill
                  value={editContent}
                  onChange={setEditContent}
                  theme="snow"
                  placeholder="Edit your message..."
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      ['link'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['clean']
                    ]
                  }}
                  className="bg-white rounded"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditMessage(message.id, editContent)}
                    disabled={!editContent.trim()}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEdit}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {message.message_type === 'text' && message.content && (
                  <div 
                    className="break-words mb-3 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: message.content }}
                  />
                )}

                {message.message_type === 'file' && message.file_url && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      {message.file_type?.startsWith('image/') && <Image className="h-4 w-4" />}
                      {message.file_type === 'application/pdf' && <FileText className="h-4 w-4" />}
                      {message.file_type === 'text/plain' && <FileText className="h-4 w-4" />}
                      <span className="text-sm font-medium">{message.file_name}</span>
                    </div>

                    {message.file_type?.startsWith('image/') ? (
                      <img 
                        src={message.file_url} 
                        alt={message.file_name || 'Uploaded image'} 
                        className="max-w-full h-auto rounded"
                      />
                    ) : (
                      <a 
                        href={message.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 underline"
                      >
                        Download {message.file_name}
                      </a>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Like reactions */}
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(likeGroups).map(([emoji, emojiLikes]) => {
                const userLiked = emojiLikes.some(like => like.user_id === user?.id);
                return (
                  <Button
                    key={emoji}
                    variant={userLiked ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => handleLikeMessage(message.id, emoji)}
                  >
                    {emoji} {emojiLikes.length}
                  </Button>
                );
              })}
              
              {/* Quick emoji reactions */}
              {!likeGroups['👍'] && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => handleLikeMessage(message.id, '👍')}
                >
                  👍
                </Button>
              )}
              {!likeGroups['❤️'] && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => handleLikeMessage(message.id, '❤️')}
                >
                  ❤️
                </Button>
              )}
              {!likeGroups['😄'] && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => handleLikeMessage(message.id, '😄')}
                >
                  😄
                </Button>
              )}
            </div>

            {/* Comments toggle and count */}
            <div className="border-t pt-2">
              <Collapsible
                open={expandedComments[message.id] || false}
                onOpenChange={() => toggleComments(message.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</span>
                    </div>
                    {expandedComments[message.id] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-2 mt-2">
                  {/* Existing comments */}
                  {comments
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map((comment) => {
                      const commentLikes = comment.likes || [];
                      const commentLikeGroups = commentLikes.reduce((acc, like) => {
                        if (!acc[like.emoji]) {
                          acc[like.emoji] = [];
                        }
                        acc[like.emoji].push(like);
                        return acc;
                      }, {} as { [emoji: string]: ChatCommentLike[] });

                      return (
                        <div key={comment.id} className="bg-white p-3 rounded border text-sm">
                          <div className="text-xs text-gray-600 mb-1">
                            {comment.profiles?.display_name || 'Anonymous'} • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </div>
                          <div className="mb-2">{comment.content}</div>
                          
                          {/* Comment like reactions */}
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(commentLikeGroups).map(([emoji, emojiLikes]) => {
                              const userLiked = emojiLikes.some(like => like.user_id === user?.id);
                              return (
                                <Button
                                  key={emoji}
                                  variant={userLiked ? "default" : "outline"}
                                  size="sm"
                                  className="h-6 text-xs px-1"
                                  onClick={() => handleLikeComment(comment.id, emoji)}
                                >
                                  {emoji} {emojiLikes.length}
                                </Button>
                              );
                            })}
                            
                            {/* Quick emoji reactions for comments */}
                            {!commentLikeGroups['👍'] && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs px-1"
                                onClick={() => handleLikeComment(comment.id, '👍')}
                              >
                                👍
                              </Button>
                            )}
                            {!commentLikeGroups['❤️'] && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs px-1"
                                onClick={() => handleLikeComment(comment.id, '❤️')}
                              >
                                ❤️
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  
                  {/* Add comment input */}
                  {user && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newComment[message.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [message.id]: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(message.id)}
                        placeholder="Add a comment..."
                        className="text-sm"
                      />
                      <Button 
                        size="sm" 
                        onClick={() => handleAddComment(message.id)}
                        disabled={!newComment[message.id]?.trim()}
                      >
                        Post
                      </Button>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <SEOHead 
          title="Chat - UPSC Study Platform"
          description="Join study discussions and share notes with fellow UPSC aspirants"
          keywords="UPSC chat, study group, notes sharing"
        />
        <Card className="max-w-md mx-auto p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in to access chat</h2>
          <p className="text-muted-foreground">You need to be logged in to participate in discussions</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <SEOHead 
        title="Study Chat - UPSC Preparation Platform"
        description="Connect with fellow UPSC aspirants, share notes, and discuss current affairs in our collaborative study chat"
        keywords="UPSC study group, chat, notes sharing, current affairs discussion"
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Study Chat</h1>
        <p className="text-muted-foreground">Connect with fellow UPSC aspirants and share study materials</p>
      </div>

      <Card className="h-[600px] flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-background">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-8">
              <h3 className="text-lg font-semibold mb-2">Welcome to Study Chat!</h3>
              <p>Start a conversation by sending a message or sharing study materials</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="mb-4">
            <ReactQuill
              value={newMessage}
              onChange={setNewMessage}
              theme="snow"
              placeholder="Type your message..."
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  ['link'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['clean']
                ]
              }}
              className="bg-white rounded"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <div className="flex-1" />
            
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim()}
              className="ml-auto"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>

            <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* File Upload Dialog */}
          <AlertDialog open={showFileDialog} onOpenChange={setShowFileDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Add File</AlertDialogTitle>
                <AlertDialogDescription>
                  {pendingFile && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        {pendingFile.type.startsWith('image/') ? (
                          <Image className="h-4 w-4" />
                        ) : pendingFile.type.includes('pdf') ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <Paperclip className="h-4 w-4" />
                        )}
                        <span className="text-sm">{pendingFile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({Math.round(pendingFile.size / 1024)} KB)
                        </span>
                      </div>
                    </div>
                  )}
                  <ReactQuill
                    value={fileCaption}
                    onChange={setFileCaption}
                    theme="snow"
                    placeholder="Add a caption (optional)..."
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline'],
                        ['link'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['clean']
                      ]
                    }}
                    className="bg-white rounded"
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={cancelFileUpload}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleFileUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Share'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="text-xs text-muted-foreground mt-2">
            Supported files: Images (JPG, PNG, GIF), PDFs, Text files • Max size: 10MB
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Chat;

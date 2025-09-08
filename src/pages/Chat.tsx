import React, { useState, useEffect, useRef } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Send, Paperclip, Image, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  profiles?: {
    display_name: string | null;
  } | null;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
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
        profiles:user_id (display_name)
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: user.id,
          content: null,
          message_type: 'file',
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = user && message.user_id === user.id;
    const displayName = message.profiles?.display_name || 'Anonymous';

    return (
      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <Card className={`max-w-xs md:max-w-md p-3 ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
          <div className="text-xs opacity-70 mb-1">
            {displayName} • {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </div>

          {message.message_type === 'text' && message.content && (
            <div className="break-words">{message.content}</div>
          )}

          {message.message_type === 'file' && message.file_url && (
            <div>
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
        </Card>
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1"
            />
            
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="text-xs text-muted-foreground mt-2">
            Supported files: Images (JPG, PNG, GIF), PDFs, Text files • Max size: 10MB
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Chat;
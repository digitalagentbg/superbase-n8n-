import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Calendar, Hash, ChevronDown, ChevronUp } from 'lucide-react';
import { MessageParser } from './MessageParser';

interface ConversationMessage {
  id: number;
  session_id: string;
  message: any;
  timestamp?: string;
}

interface ConversationViewProps {
  messages: ConversationMessage[];
  title?: string;
  showSessionGroups?: boolean;
  maxHeight?: string;
}

export const ConversationView: React.FC<ConversationViewProps> = ({ 
  messages, 
  title = "Messages",
  showSessionGroups = true,
  maxHeight = "600px"
}) => {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [showAllMessages, setShowAllMessages] = useState(false);

  // Group messages by session_id
  const groupedMessages = messages.reduce((acc, message) => {
    const sessionId = message.session_id || 'unknown';
    if (!acc[sessionId]) {
      acc[sessionId] = [];
    }
    acc[sessionId].push(message);
    return acc;
  }, {} as Record<string, ConversationMessage[]>);

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const displayMessages = showAllMessages ? messages : messages.slice(0, 10);

  if (!showSessionGroups) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {title}
            </CardTitle>
            <Badge variant="outline">{messages.length} messages</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea style={{ height: maxHeight }}>
            <div className="space-y-4 pr-4">
              {displayMessages.map((message) => (
                <div key={message.id} className="border-l-2 border-primary/20 pl-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Hash className="h-3 w-3" />
                    <span>ID: {message.id}</span>
                    {message.timestamp && (
                      <>
                        <Calendar className="h-3 w-3 ml-2" />
                        <span>{new Date(message.timestamp).toLocaleString()}</span>
                      </>
                    )}
                  </div>
                  <MessageParser 
                    message={message.message} 
                    variant="bubble" 
                    showType={true}
                  />
                </div>
              ))}
              
              {messages.length > 10 && !showAllMessages && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllMessages(true)}
                  >
                    Show {messages.length - 10} more messages
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{Object.keys(groupedMessages).length} sessions</Badge>
            <Badge variant="outline">{messages.length} messages</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ height: maxHeight }}>
          <div className="space-y-4 pr-4">
            {Object.entries(groupedMessages).map(([sessionId, sessionMessages]) => {
              const isExpanded = expandedSessions.has(sessionId);
              const latestMessage = sessionMessages[sessionMessages.length - 1];
              
              return (
                <Card key={sessionId} className="border border-border/50">
                  <CardHeader 
                    className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => toggleSession(sessionId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          <span className="font-medium">Session {sessionId}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {sessionMessages.length} messages
                        </Badge>
                      </div>
                      {latestMessage?.timestamp && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(latestMessage.timestamp).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {!isExpanded && (
                      <div className="mt-2 pl-6">
                        <MessageParser 
                          message={latestMessage?.message} 
                          variant="inline" 
                          showType={true}
                          maxLength={100}
                        />
                      </div>
                    )}
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {sessionMessages.map((message) => (
                          <div key={message.id} className="pl-6">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <Hash className="h-3 w-3" />
                              <span>ID: {message.id}</span>
                            </div>
                            <MessageParser 
                              message={message.message} 
                              variant="bubble" 
                              showType={true}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ConversationView;
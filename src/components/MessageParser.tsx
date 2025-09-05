import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Clock } from 'lucide-react';

interface ParsedMessage {
  content: string;
  type: 'ai' | 'human' | 'assistant' | 'user' | string;
  timestamp?: string;
  metadata?: any;
}

interface MessageParserProps {
  message: any;
  variant?: 'bubble' | 'inline' | 'table';
  showType?: boolean;
  maxLength?: number;
}

export function parseMessage(message: any): ParsedMessage {
  // Handle string messages
  if (typeof message === 'string') {
    try {
      const parsed = JSON.parse(message);
      return parseMessage(parsed);
    } catch {
      return {
        content: message,
        type: 'unknown'
      };
    }
  }

  // Handle object messages
  if (typeof message === 'object' && message !== null) {
    const content = message.content || message.text || message.message || '';
    const type = message.type || message.role || 'unknown';
    const timestamp = message.timestamp || message.created_at;
    
    return {
      content: typeof content === 'string' ? content : JSON.stringify(content),
      type: type.toLowerCase(),
      timestamp,
      metadata: message
    };
  }

  return {
    content: 'Empty message',
    type: 'unknown'
  };
}

export const MessageParser: React.FC<MessageParserProps> = ({ 
  message, 
  variant = 'inline', 
  showType = true,
  maxLength 
}) => {
  const parsed = parseMessage(message);
  
  const getMessageIcon = () => {
    switch (parsed.type) {
      case 'ai':
      case 'assistant':
        return <Bot className="h-4 w-4" />;
      case 'human':
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getMessageTypeColor = () => {
    switch (parsed.type) {
      case 'ai':
      case 'assistant':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'human':
      case 'user':
        return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  let displayContent = parsed.content;
  if (maxLength && displayContent.length > maxLength) {
    displayContent = displayContent.substring(0, maxLength) + '...';
  }

  if (variant === 'bubble') {
    const isAI = parsed.type === 'ai' || parsed.type === 'assistant';
    
    return (
      <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
        <div className={`
          max-w-[80%] rounded-2xl px-4 py-3 shadow-sm
          ${isAI 
            ? 'bg-card border border-border text-foreground' 
            : 'bg-primary text-primary-foreground'
          }
        `}>
          {showType && (
            <div className="flex items-center gap-2 mb-2 text-xs opacity-70">
              {getMessageIcon()}
              <span className="capitalize">{parsed.type}</span>
              {parsed.timestamp && (
                <span className="ml-auto">
                  {new Date(parsed.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-2">
        {showType && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${getMessageTypeColor()}`}>
              {getMessageIcon()}
              <span className="ml-1 capitalize">{parsed.type}</span>
            </Badge>
          </div>
        )}
        <div className="text-sm text-foreground leading-relaxed">
          {displayContent}
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className="space-y-2">
      {showType && (
        <Badge variant="outline" className={`text-xs inline-flex items-center gap-1 ${getMessageTypeColor()}`}>
          {getMessageIcon()}
          <span className="capitalize">{parsed.type}</span>
        </Badge>
      )}
      <div className="text-sm text-foreground">
        {displayContent}
      </div>
    </div>
  );
};

export default MessageParser;
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Eye, Copy, MessageSquare } from 'lucide-react';
import { MessageParser, parseMessage } from './MessageParser';
import { toast } from '@/hooks/use-toast';

interface ExpandableMessageProps {
  message: any;
  recordId?: string | number;
  sessionId?: string;
  showPreview?: boolean;
  previewLength?: number;
  variant?: 'inline' | 'table' | 'card';
}

export const ExpandableMessage: React.FC<ExpandableMessageProps> = ({
  message,
  recordId,
  sessionId,
  showPreview = true,
  previewLength = 100,
  variant = 'table'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const parsedMessage = parseMessage(message);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Message content copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const getPreviewContent = () => {
    if (!showPreview) return null;
    
    const content = parsedMessage.content;
    if (content.length <= previewLength) {
      return content;
    }
    
    return content.substring(0, previewLength) + '...';
  };

  const canExpand = parsedMessage.content.length > previewLength;

  if (variant === 'inline' && canExpand) {
    return (
      <div className="space-y-2">
        <MessageParser 
          message={message} 
          variant="inline" 
          showType={true}
          maxLength={isExpanded ? undefined : previewLength}
        />
        
        {canExpand && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show More
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="border border-border/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Message</span>
            {recordId && (
              <Badge variant="outline" className="text-xs">
                ID: {recordId}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(parsedMessage.content)}
              className="h-6 px-2"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <MessageParser 
          message={message} 
          variant="inline" 
          showType={true}
          maxLength={isExpanded ? undefined : previewLength}
        />
        
        {canExpand && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-2" />
                Show Full Message ({parsedMessage.content.length} characters)
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  // Default table variant
  return (
    <div className="space-y-2">
      <MessageParser 
        message={message} 
        variant="table" 
        showType={true}
        maxLength={showPreview ? previewLength : undefined}
      />
      
      <div className="flex items-center gap-2">
        {canExpand && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                <Eye className="h-3 w-3 mr-1" />
                View Full
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Message Details
                  {recordId && (
                    <Badge variant="outline">ID: {recordId}</Badge>
                  )}
                </DialogTitle>
                {sessionId && (
                  <DialogDescription>
                    Session: {sessionId}
                  </DialogDescription>
                )}
              </DialogHeader>
              
              <div className="space-y-4 overflow-auto max-h-[60vh]">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Parsed Message:</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(parsedMessage.content)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                
                <div className="bg-card border rounded-lg p-4">
                  <MessageParser 
                    message={message} 
                    variant="bubble" 
                    showType={true}
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Raw Data:</h4>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-40 whitespace-pre-wrap border">
                    {typeof message === 'string' ? message : JSON.stringify(message, null, 2)}
                  </pre>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(parsedMessage.content)}
          className="h-7 px-2 text-xs"
        >
          <Copy className="h-3 w-3 mr-1" />
          Copy
        </Button>
      </div>
    </div>
  );
};

export default ExpandableMessage;
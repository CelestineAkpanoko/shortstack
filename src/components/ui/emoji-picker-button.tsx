"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import EmojiPicker, { EmojiClickData, EmojiStyle } from "emoji-picker-react";
// import { useOnClickOutside } from "@/src/hooks/use-on-click-outside";

interface EmojiPickerButtonProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

/**
 * A lightweight emoji picker button that opens quickly
 */
export function EmojiPickerButton({ 
  value = "💰", 
  onChange,
  className = "text-2xl h-14 w-14"
}: EmojiPickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Immediate preload
  useEffect(() => {
    setIsPreloaded(true);
  }, []);
  
  // Handle click outside to close the picker
  useOnClickOutside(containerRef as React.RefObject<HTMLElement>, () => setIsOpen(false));
  
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji);
    setIsOpen(false);
  };
  
  const togglePicker = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="relative" ref={containerRef}>
      {/* Preload emoji data */}
      {isPreloaded && !isOpen && (
        <div className="hidden">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E" 
               onLoad={() => {
                 // Trigger emoji data preloading
                 require('emoji-picker-react');
               }} 
               alt="" 
          />
        </div>
      )}
      
      <Button 
        variant="outline" 
        className={className}
        type="button"
        onClick={togglePicker}
      >
        {value}
      </Button>
      
      {isOpen && (
        <div 
          className="absolute z-50 mt-1 shadow-md rounded-md border border-gray-200"
          style={{ 
            width: '320px', 
            marginTop: '4px', 
            transform: 'translateX(-50%)',
            left: '50%'
          }}
        >
          <EmojiPicker 
            onEmojiClick={handleEmojiClick}
            width="100%"
            height={400}
            lazyLoadEmojis={false}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{ showPreview: false }}
            emojiStyle={EmojiStyle.NATIVE}
          />
        </div>
      )}
    </div>
  );
}

// Create hook for detecting clicks outside an element
// Add this to src/hooks/use-on-click-outside.ts if you don't have it already
export function useOnClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
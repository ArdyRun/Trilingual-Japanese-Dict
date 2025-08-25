"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LanguageButtonProps {
  language: string;
  isSelected: boolean;
  onClick: () => void;
}

const LanguageButton = ({ 
  language, 
  isSelected, 
  onClick 
}: LanguageButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{x: number, y: number, id: number}[]>([]);
  const rippleId = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newRipple = { x, y, id: rippleId.current++ };
      setRipples(prev => [...prev, newRipple]);
      
      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }
    
    onClick();
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105",
        "border border-transparent flex items-center justify-center"
      )}
      style={{
        background: isSelected 
          ? "rgba(255, 100, 100, 0.3)"  // Lighter red when selected
          : "rgba(255, 255, 255, 0.1)", // Transparent when not selected
        border: "1px solid rgba(255, 255, 255, 0.2)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.2)",
        minWidth: "120px"
      }}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: "0",
            height: "0",
            transform: "translate(-50%, -50%)",
            background: "rgba(255, 100, 100, 0.5)", // Lighter red ripple
          }}
        />
      ))}
      
      <span className="relative z-10" style={{ color: isSelected ? "white" : "rgba(255, 255, 255, 0.7)" }}>
        {language}
      </span>
    </button>
  );
};

const LanguageSelector = ({ selectedLanguage, onLanguageChange }: { 
  selectedLanguage: string; 
  onLanguageChange: (language: string) => void 
}) => {
  // Add animation styles to document head
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes ripple {
        to {
          width: 200px;
          height: 200px;
          opacity: 0;
        }
      }
      
      .animate-ripple {
        animation: ripple 0.6s linear;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Language display names in their respective languages
  const languageLabels = {
    english: "Choose Language",
    indonesia: "Pilih Bahasa",
    japanese: "言語を選択" // "Gengo wo sentaku"
  };

  // Order: Indonesia, English, Japanese
  const languages = [
    { code: "indonesia", name: "Indonesia" },
    { code: "english", name: "English" },
    { code: "japanese", name: "Japanese" },
  ];

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Language indicator with globe icon */}
      <div className="flex items-center gap-2 text-gray-400">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-base font-medium">
          {languageLabels[selectedLanguage as keyof typeof languageLabels] || languageLabels.english}:
        </span>
      </div>
      
      {/* Language buttons */}
      <div className="flex gap-4 justify-center flex-wrap pt-1">
        {languages.map((lang) => (
          <LanguageButton
            key={lang.code}
            language={lang.name}
            isSelected={selectedLanguage === lang.code}
            onClick={() => onLanguageChange(lang.code)}
          />
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
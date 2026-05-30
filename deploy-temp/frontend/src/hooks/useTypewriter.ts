import { useState, useEffect, useCallback } from 'react';

export const useTypewriter = (text: string, speed = 100, delay = 500) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const reset = useCallback(() => {
    setDisplayText('');
    setIsComplete(false);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let charIndex = 0;

    const startTyping = () => {
      timeout = setTimeout(() => {
        const type = () => {
          if (charIndex < text.length) {
            setDisplayText(text.slice(0, charIndex + 1));
            charIndex++;
            timeout = setTimeout(type, speed);
          } else {
            setIsComplete(true);
          }
        };
        type();
      }, delay);
    };

    startTyping();

    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { displayText, isComplete, reset };
};

import { useState, useRef, useEffect } from "react";
import "./IntroAnimation.css";

interface IntroAnimationProps {
  onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [fadingOut, setFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoEnd = () => {
    // Start the fade out animation of the container
    setFadingOut(true);
    // After the CSS fade out animation completes (0.5s), call onComplete
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  useEffect(() => {
    // Failsafe: if the video doesn't play or is missing, just skip intro after a short delay
    const failsafeTimer = setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState === 0) {
        handleVideoEnd();
      }
    }, 2000);

    return () => clearTimeout(failsafeTimer);
  }, []);

  return (
    <div className={`intro-container ${fadingOut ? "fade-out" : ""}`}>
      <div className="video-wrapper">
        <video 
          ref={videoRef}
          src="/animation.mp4" 
          className="intro-video" 
          autoPlay 
          muted 
          playsInline
          onEnded={handleVideoEnd}
          onError={handleVideoEnd}
        />
      </div>
    </div>
  );
}

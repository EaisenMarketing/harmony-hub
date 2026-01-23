import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ProtectedVideoPlayerProps {
  videoUrl: string;
  isLocked: boolean;
  requiredPlan: string;
  currentPlan: string;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
  initialProgress?: number;
}

const planHierarchy: Record<string, number> = {
  basic: 1,
  standard: 2,
  pro: 3,
};

const planLabels: Record<string, string> = {
  basic: 'Basic',
  standard: 'Standard',
  pro: 'Pro',
};

export const ProtectedVideoPlayer = ({
  videoUrl,
  isLocked,
  requiredPlan,
  currentPlan,
  onProgress,
  onComplete,
  initialProgress = 0,
}: ProtectedVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const hasAccess = !isLocked || planHierarchy[currentPlan] >= planHierarchy[requiredPlan];

  useEffect(() => {
    if (videoRef.current && initialProgress > 0 && duration > 0) {
      videoRef.current.currentTime = (initialProgress / 100) * duration;
    }
  }, [initialProgress, duration]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      
      const percent = Math.round((current / total) * 100);
      onProgress?.(percent);

      // Mark as complete at 90%
      if (percent >= 90) {
        onComplete?.();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!hasAccess) return;
    
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current && hasAccess) {
      videoRef.current.currentTime = (value[0] / 100) * duration;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0] / 100;
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current && hasAccess) {
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleFullscreen = async () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!hasAccess) {
    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/80 flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="p-4 bg-primary/20 rounded-full mb-4">
            <Lock className="w-12 h-12 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Contenido Bloqueado</h3>
          <p className="text-white/80 mb-4 max-w-md">
            Esta lección requiere el plan <strong>{planLabels[requiredPlan]}</strong> o superior.
            Actualmente tienes el plan <strong>{planLabels[currentPlan]}</strong>.
          </p>
          <Button variant="gradient" size="lg">
            Actualizar Plan
          </Button>
        </div>
        <div className="w-full h-full bg-muted/20" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          onComplete?.();
        }}
        onClick={togglePlay}
      />

      {/* Play overlay */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30"
          onClick={togglePlay}
        >
          <div className="p-5 bg-primary rounded-full hover:bg-primary/90 transition-colors">
            <Play className="w-10 h-10 text-primary-foreground fill-current" />
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress bar */}
        <div className="mb-3">
          <Slider
            value={[progressPercent]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="cursor-pointer"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-10)}
              className="text-white hover:bg-white/20"
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(10)}
              className="text-white hover:bg-white/20"
            >
              <SkipForward className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                className="w-20"
              />
            </div>

            <span className="text-white text-sm ml-4">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

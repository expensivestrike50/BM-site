import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ConstructionScene } from '@/lib/construction-scenes';

export function ConstructionVideo({ src, webm, poster, label, scenes }: { src: string; webm: string; poster: string; label: string; scenes?: ConstructionScene[] }) {
  const video = useRef<HTMLVideoElement>(null);
  const manualPause = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = scenes?.[sceneIndex];
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !motion.matches && !manualPause.current) {
        element.play().catch(() => setPlaying(false));
      } else element.pause();
    }, { threshold: 0.2 });
    observer.observe(element);
    const handleMotion = () => { if (motion.matches) element.pause(); };
    motion.addEventListener('change', handleMotion);
    return () => { observer.disconnect(); motion.removeEventListener('change', handleMotion); };
  }, []);
  function toggle() {
    const element = video.current;
    if (!element) return;
    if (element.paused) { manualPause.current = false; element.play().catch(() => setPlaying(false)); }
    else { manualPause.current = true; element.pause(); }
  }
  return <>
    <video ref={video} poster={poster} muted loop playsInline preload="metadata" aria-label={label} onTimeUpdate={event => {
      if (!scenes) return;
      const time = event.currentTarget.currentTime;
      const index = scenes.reduce((current, item, index) => time >= item.start ? index : current, 0);
      setSceneIndex(index);
    }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}><source src={webm} type="video/webm"/><source src={src} type="video/mp4"/></video>
    {scene && <div className="construction-annotation" data-scene={sceneIndex}>
      <h2>{scene.title}</h2>
      <p className="construction-scene-description">{scene.description}</p>
      <p className="construction-scene-note">{scene.note}</p>
    </div>}
    <Button variant="media" className="construction-playback" onClick={toggle} aria-label={`${playing ? 'Pause' : 'Play'} ${label}`} title={`${playing ? 'Pause' : 'Play'} video`}>{playing ? <Pause size={18}/> : <Play size={18}/>}</Button>
  </>;
}
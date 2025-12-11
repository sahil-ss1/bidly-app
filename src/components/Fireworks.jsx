import { useEffect, useState } from 'react';
import './Confetti.css';

function Fireworks({ trigger }) {
  const [fireworks, setFireworks] = useState([]);

  useEffect(() => {
    if (trigger) {
      // Create multiple firework bursts
      const bursts = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        left: 20 + (i * 15) + Math.random() * 10,
        top: 20 + Math.random() * 30,
        delay: i * 0.2,
      }));

      setFireworks(bursts);

      const timer = setTimeout(() => {
        setFireworks([]);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (fireworks.length === 0) return null;

  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="fireworks-container">
      {fireworks.map((firework) => (
        <div
          key={firework.id}
          style={{
            position: 'absolute',
            left: `${firework.left}%`,
            top: `${firework.top}%`,
            animationDelay: `${firework.delay}s`,
          }}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 360) / 12;
            const distance = 50;
            const tx = Math.cos((angle * Math.PI) / 180) * distance;
            const ty = Math.sin((angle * Math.PI) / 180) * distance;
            const color = colors[Math.floor(Math.random() * colors.length)];

            return (
              <div
                key={i}
                className="firework-particle"
                style={{
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                  backgroundColor: color,
                  animationDelay: `${firework.delay}s`,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default Fireworks;


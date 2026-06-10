/** Production-safe card — avoids opacity:0 stuck state from animationFillMode */
export default function AnimatedCard({ children, className = '', delay = 0 }) {
  return (
    <div
      className={`opacity-100 ${className}`}
      style={
        delay > 0
          ? { animationDelay: `${Math.min(delay, 400)}ms` }
          : undefined
      }
    >
      {children}
    </div>
  );
}

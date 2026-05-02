export default function StarsBackground() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    dur: `${2 + Math.random() * 4}s`,
    delay: `${Math.random() * 3}s`,
  }))

  return (
    <div className="stars-bg">
      {stars.map(star => (
        <div
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            '--dur': star.dur,
            '--delay': star.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

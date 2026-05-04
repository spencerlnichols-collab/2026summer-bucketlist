import ProgressBar from './ProgressBar';

// Polaroid component — shows photo if provided, placeholder if not
function Polaroid({ src, caption, rotate, objectPosition = 'center' }) {
  return (
    <div
      className="flex-shrink-0 flex flex-col items-center shadow-lg"
      style={{
        transform: `rotate(${rotate}deg)`,
        backgroundColor: 'white',
        padding: '8px 8px 28px 8px',
        width: '130px',
      }}
    >
      <div
        className="w-full overflow-hidden flex items-center justify-center"
        style={{ height: '110px', backgroundColor: '#F5EFE6' }}
      >
        {src ? (
          <img src={src} alt={caption} className="w-full h-full object-cover" style={{ objectPosition }} />
        ) : (
          <div className="flex flex-col items-center gap-1 opacity-40">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A67C60" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span className="text-xs" style={{ color: '#A67C60', fontFamily: "'Caveat', cursive" }}>add photo</span>
          </div>
        )}
      </div>
      {caption && (
        <p
          className="mt-2 text-center text-xs leading-tight"
          style={{ fontFamily: "'Caveat', cursive", color: '#7A4030', fontSize: '0.85rem' }}
        >
          {caption}
        </p>
      )}
    </div>
  );
}

const OUR_PHOTOS = [
  { src: '/photos/photo1.jpg', caption: 'car rides', objectPosition: '0% center' },
  { src: '/photos/photo2.jpg', caption: 'mass moca' },
  { src: '/photos/photo3.jpg', caption: 'bryce canyon' },
  { src: '/photos/photo4.jpg', caption: 'shanghai nights' },
];

export default function Header({ done, total }) {
  const rotations = [-3, 2, -1.5, 2.5];

  return (
    <header className="w-full pt-10 pb-6 px-4 text-center" style={{ backgroundColor: '#FFF8F0' }}>
      {/* title */}
      <p
        className="text-sm uppercase tracking-widest mb-1"
        style={{ color: '#A67C60', fontFamily: "'Caveat', cursive", fontSize: '1rem' }}
      >
        Spencer &amp; Abby's
      </p>
      <h1
        className="text-4xl sm:text-5xl font-bold mb-1"
        style={{ fontFamily: "'Playfair Display', serif", color: '#3D1F10' }}
      >
        Bay Area Summer
      </h1>
      <p
        className="text-2xl mb-6"
        style={{ fontFamily: "'Caveat', cursive", color: '#C4614A', fontSize: '1.6rem' }}
      >
        Bucket List ☀️ 2026
      </p>

      {/* polaroid row — horizontally scrollable on mobile */}
      <div
        className="flex gap-4 mb-8 pb-2"
        style={{
          overflowX: 'auto',
          justifyContent: 'center',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {OUR_PHOTOS.map((photo, i) => (
          <div key={i} style={{ scrollSnapAlign: 'center', flexShrink: 0 }}>
            <Polaroid
              src={photo.src}
              caption={photo.caption}
              rotate={rotations[i]}
              objectPosition={photo.objectPosition}
            />
          </div>
        ))}
      </div>

      {/* overall progress */}
      <div className="max-w-sm mx-auto">
        <div className="flex justify-between items-baseline mb-1">
          <span style={{ fontFamily: "'Caveat', cursive", color: '#7A4030', fontSize: '1.1rem' }}>
            this summer so far
          </span>
          <span className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#3D1F10' }}>
            {done}<span className="text-base font-normal text-gray-400">/{total}</span>
          </span>
        </div>
        <ProgressBar done={done} total={total} color="#C4614A" />
      </div>
    </header>
  );
}

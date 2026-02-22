import React from 'react';

interface AvatarSvgProps {
  avatarId: string;
  size?: number;
  className?: string;
}

// Shared face parts
const eyes = (
  <>
    <ellipse cx="38" cy="48" rx="3" ry="3.5" fill="#2d1810" />
    <ellipse cx="62" cy="48" rx="3" ry="3.5" fill="#2d1810" />
    <circle cx="39.2" cy="46.8" r="1.2" fill="white" opacity="0.9" />
    <circle cx="63.2" cy="46.8" r="1.2" fill="white" opacity="0.9" />
  </>
);

const smile = <path d="M42,60 Q50,67 58,60" stroke="#2d1810" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
const nose = <ellipse cx="50" cy="54" rx="2.5" ry="1.5" fill="currentColor" opacity="0.15" />;

// Skin tones
const SKIN = {
  light: '#FDDCB5',
  medium: '#E8B87E',
  tan: '#C8956C',
  brown: '#A0704E',
  dark: '#6B4932',
};

const avatarRenderers: Record<string, (id: string) => React.ReactNode> = {
  // 1. EMPRESARIA — Woman, long dark hair, earrings, medium skin
  empresaria: (id) => (
    <>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#bg-${id})`} />
      {/* Hair behind */}
      <ellipse cx="50" cy="54" rx="30" ry="36" fill="#1a1025" />
      <rect x="22" y="50" width="56" height="40" rx="8" fill="#1a1025" />
      {/* Neck */}
      <rect x="44" y="66" width="12" height="10" rx="3" fill={SKIN.medium} />
      {/* Face */}
      <ellipse cx="50" cy="52" rx="22" ry="26" fill={SKIN.medium} />
      {/* Hair front */}
      <path d="M28,42 Q30,22 50,20 Q70,22 72,42 L70,38 Q68,28 50,26 Q32,28 30,38 Z" fill="#1a1025" />
      <path d="M28,42 Q27,48 28,52 L30,44 Z" fill="#1a1025" />
      <path d="M72,42 Q73,48 72,52 L70,44 Z" fill="#1a1025" />
      {/* Earrings */}
      <circle cx="28" cy="56" r="3" fill="#F59E0B" opacity="0.9" />
      <circle cx="72" cy="56" r="3" fill="#F59E0B" opacity="0.9" />
      {eyes}
      {nose}
      {smile}
      {/* Blush */}
      <circle cx="34" cy="57" r="4" fill="#E88B8B" opacity="0.25" />
      <circle cx="66" cy="57" r="4" fill="#E88B8B" opacity="0.25" />
      {/* Shirt collar */}
      <path d="M35,76 Q50,82 65,76 L68,85 Q50,92 32,85 Z" fill="white" opacity="0.9" />
    </>
  ),

  // 2. TECH — Man, short hair, glasses, light skin
  tech: (id) => (
    <>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#bg-${id})`} />
      {/* Neck */}
      <rect x="44" y="68" width="12" height="10" rx="3" fill={SKIN.light} />
      {/* Face */}
      <ellipse cx="50" cy="52" rx="22" ry="26" fill={SKIN.light} />
      {/* Hair */}
      <path d="M28,40 Q30,20 50,18 Q70,20 72,40 L72,34 Q68,22 50,20 Q32,22 28,34 Z" fill="#4A3728" />
      <path d="M28,40 L72,40 L72,36 Q68,22 50,20 Q32,22 28,36 Z" fill="#4A3728" />
      {/* Glasses */}
      <rect x="29" y="43" rx="4" width="18" height="13" fill="none" stroke="#334155" strokeWidth="2.2" />
      <rect x="53" y="43" rx="4" width="18" height="13" fill="none" stroke="#334155" strokeWidth="2.2" />
      <line x1="47" y1="49" x2="53" y2="49" stroke="#334155" strokeWidth="2" />
      {/* Lenses tint */}
      <rect x="30" y="44" rx="3" width="16" height="11" fill="#93C5FD" opacity="0.15" />
      <rect x="54" y="44" rx="3" width="16" height="11" fill="#93C5FD" opacity="0.15" />
      {eyes}
      {nose}
      {smile}
      {/* Hoodie */}
      <path d="M32,78 Q50,86 68,78 L72,95 Q50,100 28,95 Z" fill="#1E293B" />
    </>
  ),

  // 3. ESTUDIANTE — Woman, dark skin, curly hair up in puffs
  estudiante: (id) => (
    <>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#bg-${id})`} />
      {/* Hair puffs */}
      <circle cx="35" cy="26" r="14" fill="#1a1025" />
      <circle cx="65" cy="26" r="14" fill="#1a1025" />
      {/* Hair base */}
      <ellipse cx="50" cy="38" rx="26" ry="16" fill="#1a1025" />
      {/* Neck */}
      <rect x="44" y="68" width="12" height="10" rx="3" fill={SKIN.dark} />
      {/* Face */}
      <ellipse cx="50" cy="53" rx="21" ry="25" fill={SKIN.dark} />
      {/* Hair front bangs */}
      <path d="M30,40 Q35,30 50,28 Q65,30 70,40 L68,36 Q64,28 50,26 Q36,28 32,36 Z" fill="#1a1025" />
      {eyes}
      {nose}
      {smile}
      {/* Blush */}
      <circle cx="35" cy="58" r="4" fill="#D97706" opacity="0.2" />
      <circle cx="65" cy="58" r="4" fill="#D97706" opacity="0.2" />
      {/* T-shirt */}
      <path d="M33,78 Q50,85 67,78 L72,95 Q50,100 28,95 Z" fill="#FCD34D" />
    </>
  ),

  // 4. ZEN — Woman, light skin, headband, long straight hair
  zen: (id) => (
    <>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#bg-${id})`} />
      {/* Long hair behind */}
      <ellipse cx="50" cy="54" rx="28" ry="34" fill="#8B6542" />
      <rect x="24" y="50" width="52" height="38" rx="6" fill="#8B6542" />
      {/* Neck */}
      <rect x="44" y="68" width="12" height="10" rx="3" fill={SKIN.light} />
      {/* Face */}
      <ellipse cx="50" cy="53" rx="21" ry="25" fill={SKIN.light} />
      {/* Hair front */}
      <path d="M29,42 Q32,22 50,20 Q68,22 71,42 L69,36 Q66,24 50,22 Q34,24 31,36 Z" fill="#8B6542" />
      {/* Headband */}
      <path d="M28,38 Q50,32 72,38" stroke="#F472B6" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Flower on headband */}
      <circle cx="34" cy="36" r="4" fill="#FB7185" />
      <circle cx="34" cy="36" r="2" fill="#FDE68A" />
      {eyes}
      {nose}
      {smile}
      {/* Blush */}
      <circle cx="35" cy="58" r="4" fill="#FCA5A5" opacity="0.3" />
      <circle cx="65" cy="58" r="4" fill="#FCA5A5" opacity="0.3" />
      {/* Top */}
      <path d="M34,78 Q50,84 66,78 L70,95 Q50,100 30,95 Z" fill="white" opacity="0.85" />
    </>
  ),

  // 5. FITNESS — Man, tan skin, short buzz cut, strong build
  fitness: (id) => (
    <>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#bg-${id})`} />
      {/* Neck (thicker) */}
      <rect x="42" y="66" width="16" height="12" rx="4" fill={SKIN.tan} />
      {/* Face */}
      <ellipse cx="50" cy="52" rx="23" ry="26" fill={SKIN.tan} />
      {/* Buzz cut hair */}
      <path d="M27,42 Q30,20 50,18 Q70,20 73,42 L73,36 Q70,20 50,18 Q30,20 27,36 Z" fill="#2D1F12" />
      <ellipse cx="50" cy="32" rx="24" ry="14" fill="#2D1F12" />
      {eyes}
      {nose}
      {/* Confident grin */}
      <path d="M40,60 Q50,68 60,60" stroke="#2d1810" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Tank top */}
      <path d="M30,78 L38,74 Q50,80 62,74 L70,78 L74,95 Q50,100 26,95 Z" fill="white" />
      {/* Shoulders hint */}
      <ellipse cx="30" cy="82" rx="8" ry="10" fill={SKIN.tan} />
      <ellipse cx="70" cy="82" rx="8" ry="10" fill={SKIN.tan} />
    </>
  ),

  // 6. VIAJERO — Man, medium skin, messy hair, stubble
  viajero: (id) => (
    <>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#bg-${id})`} />
      {/* Neck */}
      <rect x="44" y="68" width="12" height="10" rx="3" fill={SKIN.medium} />
      {/* Face */}
      <ellipse cx="50" cy="53" rx="22" ry="26" fill={SKIN.medium} />
      {/* Messy hair */}
      <path d="M26,40 Q28,18 50,15 Q72,18 74,40 L72,34 Q68,20 50,17 Q32,20 28,34 Z" fill="#5C3D1E" />
      <path d="M28,38 L26,32 L30,36 L28,30 L34,36 Z" fill="#5C3D1E" />
      <path d="M72,38 L74,32 L70,36 L72,30 L66,36 Z" fill="#5C3D1E" />
      <ellipse cx="50" cy="28" rx="24" ry="12" fill="#5C3D1E" />
      {/* Stubble */}
      <ellipse cx="50" cy="66" rx="14" ry="6" fill="#5C3D1E" opacity="0.12" />
      {eyes}
      {nose}
      {smile}
      {/* Backpacker jacket */}
      <path d="M32,78 Q50,86 68,78 L72,95 Q50,100 28,95 Z" fill="#065F46" />
      <line x1="50" y1="80" x2="50" y2="95" stroke="#047857" strokeWidth="2" />
    </>
  ),

  // 7. CREATIVA — Woman, light skin, colorful bob cut
  creativa: (id) => (
    <>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id={`hair-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#bg-${id})`} />
      {/* Hair bob */}
      <ellipse cx="50" cy="48" rx="30" ry="30" fill={`url(#hair-${id})`} />
      <rect x="22" y="44" width="56" height="24" rx="10" fill={`url(#hair-${id})`} />
      {/* Neck */}
      <rect x="44" y="66" width="12" height="10" rx="3" fill={SKIN.light} />
      {/* Face */}
      <ellipse cx="50" cy="53" rx="21" ry="24" fill={SKIN.light} />
      {/* Bangs */}
      <path d="M30,42 Q34,28 50,26 Q66,28 70,42 L68,38 Q64,30 50,28 Q36,30 32,38 Z" fill={`url(#hair-${id})`} />
      <path d="M30,40 Q32,36 38,38 Q34,34 32,38" fill={`url(#hair-${id})`} />
      {eyes}
      {nose}
      {smile}
      {/* Blush */}
      <circle cx="35" cy="57" r="4" fill="#FCA5A5" opacity="0.3" />
      <circle cx="65" cy="57" r="4" fill="#FCA5A5" opacity="0.3" />
      {/* Artsy top */}
      <path d="M34,78 Q50,84 66,78 L70,95 Q50,100 30,95 Z" fill="#FBBF24" />
    </>
  ),

  // 8. SALUD — Woman, brown skin, hijab/headscarf
  salud: (id) => (
    <>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#bg-${id})`} />
      {/* Hijab/headscarf */}
      <ellipse cx="50" cy="46" rx="32" ry="30" fill="#E0F2FE" />
      <ellipse cx="50" cy="52" rx="30" ry="28" fill="#BAE6FD" />
      <rect x="22" y="50" width="56" height="36" rx="12" fill="#BAE6FD" />
      {/* Neck covered */}
      <rect x="36" y="70" width="28" height="16" rx="6" fill="#BAE6FD" />
      {/* Face opening */}
      <ellipse cx="50" cy="54" rx="19" ry="22" fill={SKIN.brown} />
      {/* Hijab frame */}
      <path d="M31,46 Q34,28 50,26 Q66,28 69,46" stroke="#BAE6FD" strokeWidth="6" fill="none" />
      {eyes}
      {nose}
      {smile}
      {/* Blush */}
      <circle cx="36" cy="58" r="3.5" fill="#D97706" opacity="0.2" />
      <circle cx="64" cy="58" r="3.5" fill="#D97706" opacity="0.2" />
      {/* Lab coat hint */}
      <path d="M30,82 Q50,90 70,82 L74,100 Q50,100 26,100 Z" fill="white" opacity="0.9" />
    </>
  ),

  // 9. GAMER — Man, light skin, headphones, spiky hair
  gamer: (id) => (
    <>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#bg-${id})`} />
      {/* Neck */}
      <rect x="44" y="68" width="12" height="10" rx="3" fill={SKIN.light} />
      {/* Face */}
      <ellipse cx="50" cy="53" rx="22" ry="26" fill={SKIN.light} />
      {/* Spiky hair */}
      <path d="M28,38 L24,22 L34,34 L32,18 L42,32 L44,14 L50,30 L56,14 L58,32 L68,18 L66,34 L76,22 L72,38 Z" fill="#1E1B4B" />
      <ellipse cx="50" cy="34" rx="24" ry="10" fill="#1E1B4B" />
      {/* Headphones */}
      <path d="M24,48 Q24,30 50,28 Q76,30 76,48" stroke="#374151" strokeWidth="4" fill="none" />
      <rect x="20" y="44" width="8" height="16" rx="4" fill="#374151" />
      <rect x="72" y="44" width="8" height="16" rx="4" fill="#374151" />
      <rect x="21" y="46" width="6" height="12" rx="3" fill="#6366F1" />
      <rect x="73" y="46" width="6" height="12" rx="3" fill="#6366F1" />
      {eyes}
      {nose}
      {smile}
      {/* Gaming hoodie */}
      <path d="M32,78 Q50,86 68,78 L72,95 Q50,100 28,95 Z" fill="#312E81" />
    </>
  ),

  // 10. EJECUTIVO — Man, dark skin, clean cut, tie
  ejecutivo: (id) => (
    <>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#bg-${id})`} />
      {/* Neck */}
      <rect x="44" y="68" width="12" height="10" rx="3" fill={SKIN.dark} />
      {/* Face */}
      <ellipse cx="50" cy="53" rx="22" ry="26" fill={SKIN.dark} />
      {/* Short neat hair */}
      <path d="M28,42 Q30,22 50,20 Q70,22 72,42 L72,36 Q68,22 50,20 Q32,22 28,36 Z" fill="#0F0A05" />
      <ellipse cx="50" cy="32" rx="23" ry="13" fill="#0F0A05" />
      {/* Clean side part */}
      <path d="M36,24 Q42,20 50,20" stroke="#0F0A05" strokeWidth="3" fill="none" />
      {eyes}
      {nose}
      {smile}
      {/* Suit and tie */}
      <path d="M30,78 Q50,88 70,78 L76,100 Q50,100 24,100 Z" fill="#1E293B" />
      <path d="M44,78 L50,100 L56,78" fill="#334155" />
      <path d="M47,78 L50,90 L53,78" fill="#DC2626" />
      {/* Collar */}
      <path d="M38,76 L50,82 L62,76" stroke="white" strokeWidth="2" fill="none" />
    </>
  ),
};

export const AvatarSvg: React.FC<AvatarSvgProps> = ({ avatarId, size = 48, className = '' }) => {
  const renderer = avatarRenderers[avatarId];

  if (!renderer) {
    // Fallback: colored circle with first letter
    return (
      <div
        className={`rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {avatarId.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      {renderer(avatarId)}
    </svg>
  );
};

export default AvatarSvg;

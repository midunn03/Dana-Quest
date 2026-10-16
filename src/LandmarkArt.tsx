export function Dragon() {
  return <g stroke="#ae731b" strokeWidth="1.5" strokeLinejoin="round">
    <path fill="none" stroke="#b7761b" strokeWidth="13" d="M10 82Q25 74 35 50T62 47Q77 74 87 67L110 34" />
    <path fill="none" stroke="#ffc83e" strokeWidth="9" d="M10 79Q25 71 35 47T62 44Q77 71 87 64L110 31" />
    <path fill="#f5b932" d="M85 46l-8-12 14 3-4-12 12 6 1-13 9 10 10-13 2 16 18 1-6 9 11 5-13 10-12-5-9 9-11-5z" />
    <path fill="#ffe47c" d="M104 29l-4-17 9 6 8-16 4 24M119 35l14-10-1 12M99 50l-9 12 16-4" />
    <path fill="#734722" d="M119 40h5v5h-5z" stroke="none"/><path fill="#fff2b8" d="M122 50l10-2-4 5z" />
    <path fill="none" stroke="#ffe48a" strokeWidth="2" d="M35 49l7-4m1-7l7-1m3 2l5 4m20 19l7-2m13-24l8 3" />
  </g>
}

/* ------- shared pixel-scene bits (palette "hoàng hôn biển Đà Nẵng") ------- */
function Sky({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <>
    <rect width="360" height="220" fill={night ? '#1d3357' : sunset ? '#e9ae76' : '#7bcafa'} />
    {night ? <g>
      <circle cx="300" cy="38" r="15" fill="#f5efc8" />
      {[28, 64, 110, 160, 210, 258, 330].map((x, i) => <rect key={x} x={x} y={10 + (i % 4) * 12} width={3} height={3} fill="#fff6c8" />)}
    </g> : <>
      <circle cx={sunset ? 286 : 70} cy={sunset ? 112 : 48} r="20" fill={sunset ? '#ffe1a0' : '#fff2b4'} />
      <path fill={sunset ? '#ffdab1' : '#e9f8ff'} d="M20 35h14V24h22v11h21v10H20zM264 26h17V15h23v11h27v11h-67z" />
    </>}
  </>
}
function Grass() {
  return <path fill="#3d7961" d="M0 202l28-12 22 17 28-6v19H0zM360 195l-36 8-22-4-33 21h91z" />
}
function River({ night }: { night?: boolean }) {
  return <>
    <rect y="150" width="360" height="70" fill={night ? '#244f78' : '#4db4d2'} />
    {[24, 96, 168, 240, 312].map(x => <rect key={x} x={x} y={172} width={30} height={3} fill={night ? '#7fb3d5' : '#a9e3df'} opacity={0.7} />)}
    {[60, 150, 240, 320].map(x => <rect key={x} x={x} y={192} width={22} height={3} fill={night ? '#5a86ad' : '#8fd0d8'} opacity={0.6} />)}
  </>
}

/* ------- scenes: vẽ theo ảnh thật từng địa danh ------- */
function CauRongScene() {
  return <g>
    <Sky night />
    {[0, 42, 84, 128, 172, 216, 260, 304].map((x, i) => <g key={x}>
      <rect x={x} y={94 + (i % 3) * 8} width={36} height={58} fill="#16263f" />
      {[0, 1, 2].map(r => [0, 1, 2].map(c => <rect key={`${r}${c}`} x={x + 6 + c * 10} y={100 + (i % 3) * 8 + r * 14} width={5} height={7} fill="#ffd76a" opacity={0.85} />))}
    </g>)}
    <rect y="150" width="360" height="70" fill="#244f78" />
    {[20, 70, 120, 170, 220, 270, 320].map(x => <rect key={x} x={x} y={174} width={26} height={3} fill="#ffca49" opacity={0.55} />)}
    {[48, 128, 208, 288].map(x => <rect key={x} x={x} y={194} width={18} height={3} fill="#7fb3d5" opacity={0.6} />)}
    <rect x="0" y="142" width="360" height="8" fill="#3a4a55" />
    <rect x="0" y="142" width="360" height="2" fill="#ffca49" />
    <g transform="translate(57 8) scale(1.85)"><Dragon /></g>
  </g>
}
function CauSongHanScene({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <g>
    <Sky night={night} sunset={sunset} />
    {[0, 56, 112, 168, 224, 280].map((x, i) => <rect key={x} x={x} y={102 + (i % 2) * 10} width={48} height={44} fill={night ? '#1c2c47' : '#5b99b7'} opacity={0.65} />)}
    <River night={night} />
    {/* trụ dây văng nghiêng đặc trưng */}
    <polygon points="296,146 310,146 303,38 293,38" fill="#274b73" />
    <rect x="290" y="28" width="16" height="12" fill="#274b73" />
    {[0, 1, 2, 3, 4, 5].map(i => <line key={i} x1={299} y1={46 + i * 9} x2={212 - i * 15} y2={132} stroke={night ? '#cfe3f2' : '#eef6fb'} strokeWidth={1.6} />)}
    {[0, 1, 2, 3].map(i => <line key={i} x1={304} y1={50 + i * 11} x2={360} y2={132} stroke={night ? '#cfe3f2' : '#eef6fb'} strokeWidth={1.6} />)}
    {/* mặt cầu trắng */}
    <rect x="0" y="130" width="360" height="12" fill={night ? '#d7dee2' : '#f4f6f4'} />
    <rect x="0" y="140" width="360" height="2" fill="#22333b" opacity={0.25} />
    {[64, 152, 240].map(x => <g key={x}><rect x={x} y={142} width={18} height={32} fill="#dfe7e7" /><rect x={x} y={172} width={18} height={5} fill="#b9c8c8" /></g>)}
    {[40, 120, 200, 280].map(x => <g key={x}><rect x={x} y={110} width={3} height={20} fill="#5b6b73" /><rect x={x} y={108} width={11} height={3} fill="#5b6b73" /></g>)}
  </g>
}
function CauVangScene({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <g>
    <Sky night={night} sunset={sunset} />
    <polygon points="0,158 80,84 160,158" fill="#3d6b52" />
    <polygon points="210,158 300,88 360,158" fill="#35604a" />
    <rect y="150" width="360" height="70" fill="#eef4f6" />
    {[0, 70, 140, 210, 280].map((x, i) => <g key={x}><rect x={x + (i % 2) * 24} y={162 + (i % 3) * 10} width={58} height={13} fill="#ffffff" /><rect x={x + (i % 2) * 24} y={162 + (i % 3) * 10} width={58} height={3} fill="#dfe9ee" /></g>)}
    {/* đôi bàn tay đá nâng cầu */}
    {[118, 224].map(x => <g key={x} fill="#9aa3a8">
      <rect x={x} y={158} width={36} height={62} />
      <rect x={x} y={158} width={8} height={62} fill="#878f94" />
      {[0, 1, 2, 3].map(i => <rect key={i} x={x - 4 + i * 10} y={118} width={9} height={44} />)}
      {[0, 1, 2, 3].map(i => <rect key={i} x={x - 4 + i * 10} y={118} width={9} height={6} fill="#b3bcc0" />)}
      <rect x={x + 30} y={136} width={10} height={26} />
    </g>)}
    {/* dải lụa vàng */}
    <path d="M28 128 Q180 92 336 116 L336 132 Q180 108 28 144 Z" fill="#d9a83f" />
    <path d="M28 128 Q180 92 336 116" fill="none" stroke="#ffca49" strokeWidth={7} />
    <path d="M28 136 Q180 100 336 124" fill="none" stroke="#ffe47c" strokeWidth={2} />
    {[60, 120, 180, 240, 300].map(x => <rect key={x} x={x} y={104} width={3} height={18} fill="#8a6a2a" />)}
  </g>
}
function BaoTangDaNangScene({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <g>
    <Sky night={night} sunset={sunset} />
    <rect y="150" width="360" height="70" fill="#d9d4c5" />
    {[0, 60, 120, 180, 240, 300].map(x => <rect key={x} x={x} y={150} width={2} height={70} fill="#c4beb0" />)}
    {/* khối nhà gạch nung */}
    <rect x="196" y="72" width="140" height="78" fill="#c46a3c" />
    <rect x="196" y="72" width="140" height="8" fill="#a8542f" />
    {[210, 240, 270, 300].map(x => <rect key={x} x={x} y={92} width={18} height={30} fill="#8a4a28" />)}
    <rect x="24" y="96" width="120" height="54" fill="#e8e2d2" />
    <rect x="24" y="96" width="120" height="8" fill="#cfc8b4" />
    {/* kim tự tháp kính */}
    <polygon points="150,150 236,58 322,150" fill="#9fd4e8" opacity={0.92} />
    <polygon points="150,150 236,58 322,150" fill="none" stroke="#5b99b7" strokeWidth={3} />
    {[0, 1, 2, 3].map(i => <line key={i} x1={150 + i * 43} y1={150} x2={236} y2={58} stroke="#5b99b7" strokeWidth={1.6} />)}
    <line x1={193} y1={104} x2={279} y2={104} stroke="#5b99b7" strokeWidth={1.6} />
    {/* tượng danh nhân */}
    <rect x="150" y="128" width={26} height={22} fill="#6b6f75" />
    <rect x="158" y="96" width={10} height={34} fill="#b9b3a4" />
    <circle cx="163" cy="90" r="7" fill="#b9b3a4" />
    <rect x="156" y="82" width={14} height={5} fill="#a8a294" />
    {/* bồn hoa */}
    {[96, 268].map(x => <g key={x}><rect x={x} y={138} width={22} height={12} fill="#a8542f" /><rect x={x + 3} y={128} width={16} height={10} fill="#63a86b" /></g>)}
    <Grass />
  </g>
}
function BaoTangChamScene({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <g>
    <Sky night={night} sunset={sunset} />
    <rect y="150" width="360" height="70" fill="#c9c2ae" />
    {/* tòa nhà thời Pháp: tường vàng, mái ngói, hàng vòm */}
    <rect x="56" y="86" width="248" height="64" fill="#d9a75f" />
    <polygon points="44,86 316,86 296,58 64,58" fill="#a85343" />
    <rect x="64" y="58" width="232" height="6" fill="#8f4436" />
    {[76, 116, 156, 196, 236].map(x => <g key={x}>
      <rect x={x} y={100} width={24} height={34} fill="#f2e8cf" />
      <path d={`M${x} 104 a12 12 0 0 1 24 0 v-4 h-24 z`} fill="#f2e8cf" />
      <rect x={x + 4} y={106} width={16} height={28} fill="#4a5a5e" />
    </g>)}
    <rect x="168" y="112" width="24" height="38" fill="#3d4a4e" />
    {/* tượng Chăm sa thạch trước sân */}
    <rect x="30" y="132" width="18" height="18" fill="#8a8f96" />
    <rect x="34" y="104" width="10" height={28} fill="#b09a78" />
    <circle cx="39" cy="98" r="7" fill="#b09a78" />
    <rect x="312" y="132" width="18" height="18" fill="#8a8f96" />
    <path d="M312 132 q9-22 18 0 z" fill="#b09a78" />
    <Grass />
  </g>
}
function ApecScene({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <g>
    <Sky night={night} sunset={sunset} />
    <rect y="140" width="360" height="80" fill="#cfd4cd" />
    <rect y="140" width="360" height="4" fill="#b9beb7" />
    <rect x="0" y="176" width="110" height="44" fill="#63a86b" />
    <rect x="250" y="176" width="110" height="44" fill="#63a86b" />
    <rect x="0" y="176" width="110" height="5" fill="#4c8a54" />
    <rect x="250" y="176" width="110" height="5" fill="#4c8a54" />
    {/* mái vòm sóng trắng đan lưới */}
    <path d="M28 140 C70 52 130 52 168 96 C206 140 268 140 332 84 L332 140 Z" fill="#f4f6f4" />
    <path d="M28 140 C70 52 130 52 168 96 C206 140 268 140 332 84" fill="none" stroke="#22333b" strokeWidth={3} />
    {[52, 92, 132, 172, 212, 252, 292].map(x => <line key={x} x1={x} y1={140} x2={x + 18} y2={88} stroke="#9aa5a1" strokeWidth={1.6} />)}
    {[52, 92, 132, 172, 212, 252, 292].map(x => <line key={x} x1={x} y1={140} x2={x - 14} y2={96} stroke="#9aa5a1" strokeWidth={1.6} />)}
    {/* lối đi */}
    <polygon points="150,220 168,140 192,140 210,220" fill="#b9beb7" />
    {[20, 330].map(x => <g key={x}><rect x={x} y={150} width={8} height={26} fill="#6d7f5e" /><rect x={x - 8} y={138} width={24} height={14} fill="#63a86b" /></g>)}
    <Grass />
  </g>
}
function CauTinhYeuScene({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <g>
    <Sky night={night} sunset={sunset} />
    {[0, 60, 120, 180, 240, 300].map((x, i) => <rect key={x} x={x} y={84 + (i % 2) * 8} width={52} height={44} fill={night ? '#1c2c47' : '#7fa8bd'} opacity={0.7} />)}
    <rect y="128" width="360" height="92" fill={night ? '#244f78' : '#4db4d2'} />
    {[40, 120, 200, 280].map(x => <rect key={x} x={x} y={150} width={28} height={3} fill="#a9e3df" opacity={0.7} />)}
    {/* lối đi ven sông */}
    <rect x="0" y="108" width="360" height="22" fill="#f2efe4" />
    {[0, 40, 80, 120, 160, 200, 240, 280, 320].map(x => <rect key={x} x={x} y={118} width={20} height={12} fill="#22333b" />)}
    <rect x="0" y="100" width="360" height="4" fill="#22333b" />
    {[24, 72, 120, 168, 216, 264, 312].map(x => <rect key={x} x={x} y={100} width={3} height={10} fill="#22333b" />)}
    {/* cây khóa tình yêu: trái tim đỏ trên cột */}
    {[70, 180, 290].map(x => <g key={x}>
      <rect x={x} y={56} width={4} height={46} fill="#22333b" />
      <path d={`M${x - 12} 44 c0-10 10-14 14-6 c4-8 14-4 14 6 c0 10-14 18-14 18 c0 0-14-8-14-18 z`} fill="#d94f4f" />
      <path d={`M${x - 12} 44 c0-10 10-14 14-6 c4-8 14-4 14 6 c0 10-14 18-14 18 c0 0-14-8-14-18 z`} fill="none" stroke="#a83a3a" strokeWidth={2} />
      {[0, 1, 2].map(i => <rect key={i} x={x - 8 + i * 7} y={48} width={3} height={5} fill="#f2b8b8" />)}
    </g>)}
  </g>
}
function MyKheScene({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <g>
    <Sky night={night} sunset={sunset} />
    <rect y="118" width="360" height="52" fill={night ? '#244f78' : '#4db4d2'} />
    {[30, 110, 190, 270].map(x => <rect key={x} x={x} y={138} width={34} height={4} fill="#eaf7f7" opacity={0.8} />)}
    <rect y="168" width="360" height="52" fill="#f2dfae" />
    <rect y="168" width="360" height="4" fill="#e0c58e" />
    {/* thuyền gỗ trên cát */}
    <g>
      <polygon points="96,168 216,168 196,196 116,196" fill="#8a5a3a" />
      <polygon points="96,168 216,168 210,178 102,178" fill="#a9744c" />
      <rect x="140" y={140} width={34} height={28} fill="#3f7fae" />
      <rect x={140} y={140} width={34} height={6} fill="#d94f4f" />
      <rect x={146} y={150} width={10} height={10} fill="#22333b" />
      <rect x={172} y={118} width={4} height={24} fill="#6d4a2e" />
    </g>
    {/* dừa */}
    <g>
      <rect x={286} y={120} width={10} height={52} fill="#7a5a3a" />
      {[0, 1, 2, 3, 4].map(i => <polygon key={i} points={`291,122 ${262 + i * 12},${96 + (i % 2) * 10} 291,112`} fill="#3d7961" />)}
      <circle cx={288} cy={126} r={5} fill="#8a5a3a" />
      <circle cx={296} cy={128} r={5} fill="#8a5a3a" />
    </g>
    <Grass />
  </g>
}
function BienDongScene({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <g>
    <Sky night={night} sunset={sunset} />
    {[200, 250, 300].map((x, i) => <rect key={x} x={x} y={60 + i * 8} width={44} height={80} fill={night ? '#1c2c47' : '#9db3bd'} opacity={0.8} />)}
    <rect y="140" width="360" height="80" fill="#c47b5a" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map(x => <rect key={x} x={x} y={140} width={22} height={80} fill="#b56e4f" />)}
    {[0, 90, 180, 270].map(x => <rect key={x} x={x} y={140} width={90} height={4} fill="#d9d4c5" />)}
    {/* tượng chim bồ câu trắng */}
    <rect x="156" y="118" width="48" height="24" fill="#22333b" />
    <rect x="156" y="112" width="48" height="6" fill="#3a4a55" />
    <ellipse cx="180" cy="92" rx="20" ry="14" fill="#f4f6f4" />
    <circle cx="196" cy="82" r="9" fill="#f4f6f4" />
    <polygon points="205,82 212,85 205,88" fill="#ffca49" />
    <circle cx="198" cy="80" r="2" fill="#22333b" />
    <polygon points="162,92 148,78 160,98" fill="#e2e8e8" />
    {/* dừa */}
    {[40, 310].map(x => <g key={x}><rect x={x} y={96} width={9} height={46} fill="#7a5a3a" />{[0, 1, 2, 3].map(i => <polygon key={i} points={`${x + 4},98 ${x - 22 + i * 14},${76 + (i % 2) * 8} ${x + 4},90`} fill="#3d7961" />)}</g>)}
    <Grass />
  </g>
}
function ManThaiScene({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <g>
    <Sky night={night} sunset={sunset} />
    <rect y="118" width="360" height="52" fill={night ? '#244f78' : '#4db4d2'} />
    {[40, 140, 240].map(x => <rect key={x} x={x} y={140} width={36} height={4} fill="#eaf7f7" opacity={0.8} />)}
    <rect y="168" width="360" height="52" fill="#f2dfae" />
    {/* thuyền thúng */}
    {[70, 170, 270].map((x, i) => <g key={x}>
      <path d={`M${x - 30} ${176 + (i % 2) * 6} a30 22 0 0 0 60 0 z`} fill={i % 2 ? '#2f6f8f' : '#8a5a3a'} />
      <path d={`M${x - 30} ${176 + (i % 2) * 6} a30 22 0 0 0 60 0`} fill="none" stroke="#22333b" strokeWidth={3} />
      <rect x={x - 4} y={158 + (i % 2) * 6} width={40} height={4} fill="#6d4a2e" transform={`rotate(${8 + i * 4} ${x} ${160 + (i % 2) * 6})`} />
    </g>)}
    {/* ván SUP dựng */}
    <rect x="322" y="120" width="10" height="52" rx={5} fill="#ff9046" transform="rotate(8 327 146)" />
    <Grass />
  </g>
}
function LinhUngScene({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <g>
    <Sky night={night} sunset={sunset} />
    <polygon points="0,150 90,60 180,150" fill="#3d6b52" />
    <polygon points="180,150 290,70 360,150" fill="#35604a" />
    <rect y="150" width="360" height="70" fill="#c9c2ae" />
    {/* tượng Quan Âm phía sau */}
    <g fill="#e8e4da" opacity={0.95}>
      <rect x="286" y="66" width="14" height={44} />
      <circle cx="293" cy="58" r="9" />
      <rect x="280" y="104" width="26" height={10} />
    </g>
    {/* chánh điện mái cong */}
    <g>
      <rect x="96" y="118" width="120" height="34" fill="#e8d9a8" />
      {[108, 140, 172, 196].map(x => <rect key={x} x={x} y={126} width={10} height={26} fill="#8a4a28" />)}
      <polygon points="84,118 228,118 204,88 108,88" fill="#3f7d5e" />
      <polygon points="100,88 212,88 196,66 116,66" fill="#4c9070" />
      <path d="M84 118 q-14 2 -20 -8 M228 118 q14 2 20 -8" fill="none" stroke="#e8e4da" strokeWidth={4} />
      <path d="M100 88 q-10 -2 -15 -10 M212 88 q10 -2 15 -10" fill="none" stroke="#e8e4da" strokeWidth={3} />
    </g>
    {/* tháp nhỏ */}
    <g>
      <rect x="52" y="122" width="30" height="30" fill="#e8d9a8" />
      <polygon points="46,122 88,122 67,98" fill="#3f7d5e" />
      <rect x="62" y="106" width="10" height="18" fill="#e8d9a8" />
      <polygon points="58,106 76,106 67,94" fill="#3f7d5e" />
    </g>
    {/* bonsai */}
    {[250, 300, 60].map(x => <g key={x}>
      <polygon points={`${x - 12},152 ${x + 12},152 ${x + 8},166 ${x - 8},166`} fill="#8a8f96" />
      <rect x={x - 2} y={132} width={5} height={20} fill="#6d4a2e" />
      <ellipse cx={x} cy={126} rx={16} ry={10} fill="#3d7961" />
      <ellipse cx={x - 8} cy={120} rx={10} ry={7} fill="#4c8a54" />
    </g>)}
    <Grass />
  </g>
}
function BanCoScene({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <g>
    <Sky night={night} sunset={sunset} />
    {/* vịnh Đà Nẵng nhìn từ đỉnh */}
    <rect y="108" width="360" height="62" fill={night ? '#2c4f78' : '#5fa8c9'} />
    {[40, 120, 200, 280].map(x => <rect key={x} x={x} y={128} width={34} height={3} fill="#fff2b4" opacity={0.7} />)}
    <polygon points="0,108 90,78 200,108" fill="#7fa8bd" opacity={0.6} />
    <polygon points="230,108 300,84 360,108" fill="#7fa8bd" opacity={0.6} />
    {/* sườn núi tiền cảnh */}
    <polygon points="0,220 0,120 150,170 190,220" fill="#2e5b45" />
    <polygon points="0,220 0,150 90,180 120,220" fill="#3d6b52" />
    {[30, 70, 110].map(x => <g key={x}>
      <rect x={x} y={150} width={7} height={30} fill="#5b4632" />
      <polygon points={`${x + 3},150 ${x - 16},176 ${x + 22},176`} fill="#2e5b45" />
      <polygon points={`${x + 3},138 ${x - 12},160 ${x + 18},160`} fill="#35604a" />
    </g>)}
    {/* chòi vọng cảnh */}
    <g>
      <rect x={236} y={140} width={40} height={8} fill="#8a5a3a" />
      {[240, 268].map(x => <rect key={x} x={x} width={5} height={26} y={114} fill="#6d4a2e" />)}
      <polygon points="232,114 280,114 256,96" fill="#a85343" />
    </g>
    <Grass />
  </g>
}
function HaiVanQuanScene({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <g>
    <Sky night={night} sunset={sunset} />
    <polygon points="0,160 80,80 170,160" fill="#4a6b58" />
    <polygon points="190,160 280,90 360,160" fill="#42604f" />
    <rect y="160" width="360" height="60" fill="#8a7a5e" />
    {/* đường đèo */}
    <path d="M0 200 Q120 180 200 196 T360 188 L360 220 L0 220 Z" fill="#6b6f75" />
    {/* Hải Vân Quan: cổng thành gạch cổ */}
    <g>
      <rect x="120" y="70" width="120" height="92" fill="#a8845c" />
      {[0, 1, 2, 3, 4, 5].map(r => [0, 1, 2, 3, 4, 5, 6, 7].map(c => <rect key={`${r}${c}`} x={124 + c * 14} y={74 + r * 14} width={12} height={3} fill="#96714e" opacity={0.7} />))}
      <path d="M160 162 v-40 a20 20 0 0 1 40 0 v40 z" fill="#2b3438" />
      <path d="M160 162 v-40 a20 20 0 0 1 40 0 v40" fill="none" stroke="#5e4a34" strokeWidth={4} />
      <polygon points="112,70 248,70 232,52 128,52" fill="#8f4436" />
      <rect x="128" y="52" width="104" height="5" fill="#7a382c" />
      <rect x="176" y="30" width="8" height="22" fill="#a8845c" />
    </g>
    {/* tường thành hai bên */}
    <rect x="40" y="110" width="80" height="52" fill="#96714e" />
    <rect x="240" y="110" width="80" height="52" fill="#96714e" />
    <Grass />
  </g>
}
function NguHanhSonScene({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <g>
    <Sky night={night} sunset={sunset} />
    {/* đồng bằng + phố */}
    <rect y="150" width="360" height="70" fill="#9dbb8f" />
    {[20, 80, 140, 200, 260, 320].map((x, i) => <g key={x}><rect x={x} y={158 + (i % 2) * 6} width={30} height={18} fill="#e8e4da" /><polygon points={`${x},${158 + (i % 2) * 6} ${x + 15},${150 + (i % 2) * 6} ${x + 30},${158 + (i % 2) * 6}`} fill="#a85343" /></g>)}
    {/* cụm 5 ngọn núi đá vôi */}
    {[[18, 150, 64, 78], [86, 150, 58, 96], [150, 150, 76, 62], [232, 150, 60, 92], [296, 150, 52, 104]].map(([x, base, w, top], i) => <g key={i}>
      <polygon points={`${x},${base} ${x + w / 2},${top} ${x + w},${base}`} fill={i % 2 ? '#4a6b58' : '#55765f'} />
      <polygon points={`${x + w * 0.32},${base} ${x + w / 2},${top} ${x + w * 0.68},${base}`} fill="#6b7f6e" opacity={0.55} />
      <polygon points={`${x + w * 0.2},${base} ${x + w * 0.32},${top + 26} ${x + w * 0.12},${base}`} fill="#3d5a4c" opacity={0.6} />
    </g>)}
    {/* chùa nhỏ trên đỉnh cao nhất */}
    <g>
      <rect x="180" y="40" width="16" height="24" fill="#e8d9a8" />
      <polygon points="174,40 202,40 188,28" fill="#a85343" />
      <rect x="186" y="18" width="4" height="12" fill="#e8d9a8" />
    </g>
    <Grass />
  </g>
}
function NamOscene({ night, sunset }: { night?: boolean; sunset?: boolean }) {
  return <g>
    <Sky night={night} sunset={sunset} />
    <polygon points="180,150 260,96 340,150" fill="#5a7a8c" opacity={0.75} />
    <rect y="140" width="360" height="40" fill={night ? '#244f78' : '#4db4d2'} />
    {[50, 150, 250].map(x => <rect key={x} x={x} y={156} width={30} height={3} fill="#a9e3df" opacity={0.8} />)}
    {/* ghềnh đá */}
    <g fill="#6b7f88">
      <polygon points="0,180 40,150 90,180" />
      <polygon points="60,180 110,142 160,180" />
      <polygon points="250,180 300,148 350,180" />
    </g>
    <g fill="#7f939c">
      <polygon points="20,180 44,160 70,180" />
      <polygon points="270,180 296,158 322,180" />
    </g>
    <rect y="180" width="360" height="40" fill="#e8d9b0" />
    {/* thuyền thúng */}
    {[120, 210].map((x, i) => <g key={x}>
      <path d={`M${x - 26} ${186 + i * 4} a26 19 0 0 0 52 0 z`} fill={i ? '#2f6f8f' : '#8a5a3a'} />
      <path d={`M${x - 26} ${186 + i * 4} a26 19 0 0 0 52 0`} fill="none" stroke="#22333b" strokeWidth={3} />
    </g>)}
    <Grass />
  </g>
}

export default function LandmarkArt({ id = 'cau-rong', sunset: sunsetProp = false, scene }: { id?: string; sunset?: boolean; scene?: 'day' | 'sunset' | 'night' }) {
  const sunset = scene === 'sunset' || sunsetProp
  const night = scene === 'night' || id === 'cau-rong'
  switch (id) {
    case 'cau-rong': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><CauRongScene /></svg>
    case 'cau-song-han': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><CauSongHanScene night={night} sunset={sunset} /></svg>
    case 'cau-vang-ba-na-hills': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><CauVangScene night={night} sunset={sunset} /></svg>
    case 'bao-tang-da-nang': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><BaoTangDaNangScene night={night} sunset={sunset} /></svg>
    case 'bao-tang-dieu-khac-cham': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><BaoTangChamScene night={night} sunset={sunset} /></svg>
    case 'cong-vien-apec': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><ApecScene night={night} sunset={sunset} /></svg>
    case 'cau-tinh-yeu': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><CauTinhYeuScene night={night} sunset={sunset} /></svg>
    case 'bai-bien-my-khe': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><MyKheScene night={night} sunset={sunset} /></svg>
    case 'cong-vien-bien-dong': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><BienDongScene night={night} sunset={sunset} /></svg>
    case 'bien-man-thai-sup': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><ManThaiScene night={night} sunset={sunset} /></svg>
    case 'chua-linh-ung-bai-but': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><LinhUngScene night={night} sunset={sunset} /></svg>
    case 'dinh-ban-co': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><BanCoScene night={night} sunset={sunset} /></svg>
    case 'hai-van-quan': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><HaiVanQuanScene night={night} sunset={sunset} /></svg>
    case 'ngu-hanh-son': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><NguHanhSonScene night={night} sunset={sunset} /></svg>
    case 'bai-bien-nam-o': return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><NamOscene night={night} sunset={sunset} /></svg>
    default: return <svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" className="landmark-art" aria-hidden="true"><Sky night={night} sunset={sunset} /><Grass /></svg>
  }
}

export function LandmarkPin({ id }: { id: string }) {
  return <svg viewBox="0 0 150 100" aria-hidden="true">
    <ellipse cx="75" cy="89" rx="58" ry="7" fill="#31554b33" />
    {id === 'cau-rong' && <g>
      <path d="M8 81h130v6H8z" fill="#1f8a99" />
      <rect x="8" y="72" width="130" height="5" fill="#3a4a55" />
      <rect x="8" y="72" width="130" height="2" fill="#ffca49" />
      {[[16, 62], [30, 55], [44, 49], [58, 45], [72, 43], [86, 45], [100, 49]].map(([x, y], i) => <g key={i}>
        <rect x={x} y={y} width={12} height={9} fill="#ffca49" />
        <rect x={x} y={y} width={12} height={2} fill="#ffe47c" />
        <rect x={x} y={y + 7} width={12} height={2} fill="#e09b2d" />
        {i > 0 && i < 6 && <rect x={x + 4} y={y - 4} width={4} height={4} fill="#ffe47c" />}
      </g>)}
      <rect x="112" y="40" width="16" height="12" fill="#ffca49" />
      <rect x="112" y="40" width="16" height="2" fill="#ffe47c" />
      <rect x="126" y="44" width="10" height="6" fill="#ffca49" />
      <rect x="124" y="50" width="12" height="4" fill="#e09b2d" />
      <rect x="128" y="50" width="8" height="2" fill="#fffdf4" />
      <rect x="116" y="43" width="5" height="5" fill="#fffdf4" />
      <rect x="118" y="44" width="2" height="3" fill="#22333b" />
      <rect x="114" y="35" width="3" height="6" fill="#ffe47c" />
      <rect x="132" y="46" width="2" height="2" fill="#22333b" />
    </g>}
    {id === 'cau-song-han' && <g>
      <path d="M8 81h130v6H8z" fill="#1f8a99" />
      <rect x="8" y="70" width="130" height="6" fill="#f4f6f4" />
      <polygon points="104,70 110,70 107,28 102,28" fill="#274b73" />
      {[0, 1, 2, 3].map(i => <line key={i} x1={105} y1={34 + i * 8} x2={66 - i * 12} y2={70} stroke="#dfe9f2" strokeWidth={1.6} />)}
      {[0, 1, 2].map(i => <line key={i} x1={108} y1={38 + i * 9} x2={138} y2={70} stroke="#dfe9f2" strokeWidth={1.6} />)}
      {[36, 66, 128].map(x => <rect key={x} x={x} y={76} width={8} height={12} fill="#dfe7e7" />)}
    </g>}
    {id === 'cau-vang-ba-na-hills' && <g>
      <rect x="0" y="62" width="150" height="38" fill="#eef4f6" />
      {[18, 60, 102].map((x, i) => <rect key={x} x={x} y={72 + (i % 2) * 8} width={30} height={8} fill="#ffffff" />)}
      {[38, 96].map(x => <g key={x} fill="#9aa3a8">
        <rect x={x} y={58} width={20} height={42} />
        {[0, 1, 2].map(i => <rect key={i} x={x - 3 + i * 9} y={40} width={8} height={22} />)}
        <rect x={x - 3} y={38} width={27} height={6} fill="#b3bcc0" />
      </g>)}
      <path d="M10 52 Q75 34 140 46 L140 56 Q75 44 10 62 Z" fill="#d9a83f" />
      <path d="M10 52 Q75 34 140 46" fill="none" stroke="#ffca49" strokeWidth={5} />
    </g>}
    {id === 'bao-tang-da-nang' && <g>
      <rect x="14" y="52" width="122" height="36" fill="#c46a3c" />
      <rect x="14" y="52" width="122" height="6" fill="#a8542f" />
      <polygon points="52,88 96,34 140,88" fill="#9fd4e8" opacity={0.92} />
      <polygon points="52,88 96,34 140,88" fill="none" stroke="#5b99b7" strokeWidth={2.5} />
      <line x1={74} y1={88} x2={96} y2={34} stroke="#5b99b7" strokeWidth={1.5} />
      <line x1={118} y1={88} x2={96} y2={34} stroke="#5b99b7" strokeWidth={1.5} />
      <rect x="66" y="70" width={10} height={18} fill="#b9b3a4" />
      <circle cx="71" cy="66" r="4" fill="#b9b3a4" />
      <rect x="63" y="86" width="16" height="4" fill="#6b6f75" />
    </g>}
    {id === 'bao-tang-dieu-khac-cham' && <g>
      <rect x="22" y="44" width="106" height="44" fill="#d9a75f" />
      <polygon points="16,44 134,44 122,28 28,28" fill="#a85343" />
      {[34, 58, 82, 106].map(x => <g key={x}>
        <rect x={x} y={56} width={14} height={24} fill="#f2e8cf" />
        <rect x={x + 3} y={60} width={8} height={20} fill="#4a5a5e" />
      </g>)}
      <rect x="70" y="62" width={10} height={26} fill="#3d4a4e" />
      <path d="M10 88h130v4H10z" fill="#8a7a5e" />
    </g>}
    {id === 'cong-vien-apec' && <g>
      <rect x="10" y="70" width="130" height="20" fill="#cfd4cd" />
      <rect x="10" y="70" width="52" height="20" fill="#63a86b" />
      <rect x="98" y="70" width="42" height="20" fill="#63a86b" />
      <path d="M16 70 C40 26 72 26 92 48 C112 70 136 66 150 44 L150 70 Z" fill="#f4f6f4" />
      <path d="M16 70 C40 26 72 26 92 48 C112 70 136 66 150 44" fill="none" stroke="#22333b" strokeWidth={2.5} />
      {[32, 56, 80, 104, 128].map(x => <line key={x} x1={x} y1={70} x2={x + 10} y2={44} stroke="#9aa5a1" strokeWidth={1.4} />)}
    </g>}
    {id === 'cau-tinh-yeu' && <g>
      <path d="M8 78h130v10H8z" fill="#1f8a99" />
      <rect x="8" y="66" width="130" height="10" fill="#f2efe4" />
      <rect x="8" y="62" width="130" height="3" fill="#22333b" />
      {[30, 75, 120].map(x => <g key={x}>
        <rect x={x} y={34} width={3} height={30} fill="#22333b" />
        <path d={`M${x - 9} 26 c0-8 8-11 11-5 c3-6 11-3 11 5 c0 8-11 14-11 14 c0 0-11-6-11-14 z`} fill="#d94f4f" />
      </g>)}
    </g>}
    {id === 'bai-bien-my-khe' && <g>
      <rect x="8" y="60" width="130" height="16" fill="#4db4d2" />
      <rect x="8" y="76" width="130" height="14" fill="#f2dfae" />
      <polygon points="40,76 96,76 86,62 50,62" fill="#8a5a3a" />
      <rect x="58" y={46} width={18} height={16} fill="#3f7fae" />
      <rect x={58} y={46} width={18} height={4} fill="#d94f4f" />
      <rect x="112" y="52" width="7" height="26" fill="#7a5a3a" />
      {[0, 1, 2].map(i => <polygon key={i} points={`115,54 ${96 + i * 12},${36 + (i % 2) * 8} 115,46`} fill="#3d7961" />)}
    </g>}
    {id === 'cong-vien-bien-dong' && <g>
      <rect x="8" y="58" width="130" height="32" fill="#c47b5a" />
      {[8, 38, 68, 98, 128].map(x => <rect key={x} x={x} y={58} width={14} height={32} fill="#b56e4f" />)}
      <rect x="62" y="66" width="26" height="12" fill="#22333b" />
      <ellipse cx="75" cy="54" rx="12" ry="9" fill="#f4f6f4" />
      <circle cx="84" cy="48" r="6" fill="#f4f6f4" />
      <polygon points="90,48 95,50 90,52" fill="#ffca49" />
      <rect x="28" y="50" width="6" height="20" fill="#7a5a3a" />
      {[0, 1, 2].map(i => <polygon key={i} points={`31,52 ${16 + i * 10},${36 + (i % 2) * 6} 31,44`} fill="#3d7961" />)}
    </g>}
    {id === 'bien-man-thai-sup' && <g>
      <rect x="8" y="58" width="130" height="16" fill="#4db4d2" />
      {[24, 72, 120].map(x => <rect key={x} x={x} y={64} width={20} height={3} fill="#eaf7f7" />)}
      <rect x="8" y="74" width="130" height="16" fill="#f2dfae" />
      {[40, 92].map((x, i) => <g key={x}>
        <path d={`M${x - 20} ${78 + i * 2} a20 14 0 0 0 40 0 z`} fill={i ? '#2f6f8f' : '#8a5a3a'} />
        <path d={`M${x - 20} ${78 + i * 2} a20 14 0 0 0 40 0`} fill="none" stroke="#22333b" strokeWidth={2.5} />
      </g>)}
      <rect x="124" y="56" width="6" height="30" rx={3} fill="#ff9046" transform="rotate(10 127 71)" />
    </g>}
    {id === 'chua-linh-ung-bai-but' && <g>
      <polygon points="0,90 40,52 80,90" fill="#3d6b52" />
      <rect x="100" y="58" width="8" height="32" fill="#e8e4da" />
      <circle cx="104" cy="52" r="6" fill="#e8e4da" />
      <rect x="48" y="62" width="56" height="28" fill="#e8d9a8" />
      <polygon points="42,62 110,62 96,44 56,44" fill="#3f7d5e" />
      <polygon points="52,44 100,44 90,32 62,32" fill="#4c9070" />
      <path d="M42 62 q-8 1 -12 -5 M110 62 q8 1 12 -5" fill="none" stroke="#e8e4da" strokeWidth={2.5} />
      {[20, 128].map(x => <g key={x}>
        <polygon points={`${x - 8},90 ${x + 8},90 ${x + 6},98 ${x - 6},98`} fill="#8a8f96" />
        <ellipse cx={x} cy={82} rx={10} ry={7} fill="#3d7961" />
      </g>)}
    </g>}
    {id === 'dinh-ban-co' && <g>
      <rect x="8" y="52" width="130" height="26" fill="#5fa8c9" />
      {[30, 70, 110].map(x => <rect key={x} x={x} y={60} width={20} height={3} fill="#fff2b4" opacity={0.8} />)}
      <polygon points="8,90 8,44 70,66 100,90" fill="#2e5b45" />
      <polygon points="8,90 8,58 48,72 70,90" fill="#3d6b52" />
      <rect x="104" y="66" width="22" height="5" fill="#8a5a3a" />
      {[106, 120].map(x => <rect key={x} x={x} y={52} width={3} height={16} fill="#6d4a2e" />)}
      <polygon points="102,52 128,52 115,42" fill="#a85343" />
    </g>}
    {id === 'hai-van-quan' && <g>
      <polygon points="0,90 30,52 60,90" fill="#4a6b58" />
      <polygon points="90,90 120,52 150,90" fill="#42604f" />
      <rect x="48" y="34" width="54" height="56" fill="#a8845c" />
      {[0, 1, 2, 3].map(r => [0, 1, 2].map(c => <rect key={`${r}${c}`} x={50 + c * 17} y={37 + r * 13} width={14} height={3} fill="#96714e" opacity={0.7} />))}
      <path d="M64 90 v-22 a11 11 0 0 1 22 0 v22 z" fill="#2b3438" />
      <polygon points="44,34 106,34 98,24 52,24" fill="#8f4436" />
      <rect x="20" y="56" width="28" height="34" fill="#96714e" />
      <rect x="102" y="56" width="28" height="34" fill="#96714e" />
    </g>}
    {id === 'ngu-hanh-son' && <g>
      <rect x="8" y="72" width="130" height="18" fill="#9dbb8f" />
      {[[14, 72, 30, 34], [46, 72, 28, 44], [76, 72, 34, 28], [110, 72, 26, 42]].map(([x, base, w, top], i) => <g key={i}>
        <polygon points={`${x},${base} ${x + w / 2},${top} ${x + w},${base}`} fill={i % 2 ? '#4a6b58' : '#55765f'} />
        <polygon points={`${x + w * 0.3},${base} ${x + w / 2},${top} ${x + w * 0.7},${base}`} fill="#6b7f6e" opacity={0.5} />
      </g>)}
      <rect x="89" y="18" width="8" height="12" fill="#e8d9a8" />
      <polygon points="86,18 100,18 93,12" fill="#a85343" />
    </g>}
    {id === 'bai-bien-nam-o' && <g>
      <rect x="8" y="62" width="130" height="14" fill="#4db4d2" />
      {[24, 72, 120].map(x => <rect key={x} x={x} y={68} width={18} height={3} fill="#a9e3df" />)}
      <polygon points="90,76 120,96 150,76" fill="#5a7a8c" opacity={0.7} />
      <g fill="#6b7f88">
        <polygon points="8,90 30,70 52,90" />
        <polygon points="40,90 62,66 84,90" />
        <polygon points="100,90 122,70 144,90" />
      </g>
      <rect x="8" y="90" width="130" height="4" fill="#e8d9b0" />
      <path d="M52 88 a16 12 0 0 0 32 0 z" fill="#8a5a3a" />
      <path d="M52 88 a16 12 0 0 0 32 0" fill="none" stroke="#22333b" strokeWidth={2.5} />
    </g>}
  </svg>
}

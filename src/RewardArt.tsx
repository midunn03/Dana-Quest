export default function RewardArt({ id }: { id:string }) {
  return <svg viewBox="0 0 72 72" aria-hidden="true" shapeRendering="crispEdges">
    <rect x="2" y="2" width="68" height="68" rx="15" fill="#fff0cb"/>
    {id === 'drink' && <><path d="M22 22h32l-5 38H27z" fill="#e39b41"/><path d="M27 27h23l-3 27H30z" fill="#ffce74"/><path d="M20 18h36v6H20z" fill="#fff5db"/><path d="M40 7h5v31h-5z" fill="#746140"/><path d="M30 35h5v5h-5zM42 44h5v5h-5z" fill="#fff4d4"/></>}
    {id === 'postcard' && <><path d="M12 20h48v34H12z" fill="#4b91b7"/><path d="M17 25h38v24H17z" fill="#8cd7e5"/><path d="M20 45l11-12 8 7 8-12 6 17z" fill="#eebd4e"/><path d="M17 48h38v3H17z" fill="#fff2c8"/><path d="M19 57h32v3H19z" fill="#c49b58"/></>}
    {id === 'local-food' && <><path d="M12 38q24 26 48 0H12z" fill="#e68c55"/><path d="M15 37q21 15 42 0" fill="none" stroke="#87583f" strokeWidth="4"/><path d="M22 23q4-8 8 0t8 0m5 8q4-8 8 0" fill="none" stroke="#6f9662" strokeWidth="4"/><path d="M48 12v20m5-20v20" stroke="#765a42" strokeWidth="3"/></>}
    {id === 'transport' && <><path d="M11 20h50v34H11z" fill="#4f9f9c"/><path d="M17 26h14v13H17zm20 0h17v13H37z" fill="#d9f1df"/><path d="M13 43h46v7H13z" fill="#f3c552"/><circle cx="22" cy="56" r="5" fill="#42575a"/><circle cx="50" cy="56" r="5" fill="#42575a"/></>}
    {id === 'admission' && <><path d="M15 18h42v42H15z" fill="#e8bb61"/><path d="M21 24h30v30H21z" fill="#fff1c8"/><path d="M26 45l10-13 6 7 6-8 2 14z" fill="#57a3aa"/><path d="M36 24v30" stroke="#e8bb61" strokeWidth="3" strokeDasharray="3 3"/></>}
    {id === 'outdoor-activity' && <><path d="M12 49q24-7 48 0-22 11-48 0z" fill="#d89b59"/><path d="M35 18v28m0-25q14 4 13 19H35" fill="#6ab8c5" stroke="#347b8d" strokeWidth="3"/><circle cx="35" cy="14" r="5" fill="#edb57a"/><path d="M34 20 29 36l13 3" fill="none" stroke="#52634f" strokeWidth="4"/><path d="M15 59q9-5 18 0t18 0" fill="none" stroke="#559eb3" strokeWidth="3"/></>}
    {!['drink', 'postcard', 'local-food', 'transport', 'admission', 'outdoor-activity'].includes(id) && <><path d="M15 29h44v29H15z" fill="#eba85a"/><path d="M11 23h52v10H11z" fill="#fbc958"/><path d="M32 23h9v35h-9z" fill="#f16e62"/><path d="M35 23L22 10h-9v12h22m3 1L51 10h9v12H38" fill="none" stroke="#ef7867" strokeWidth="5"/></>}
  </svg>
}

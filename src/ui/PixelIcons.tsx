import type { SVGProps } from 'react'
export type PixelIconName = 'pin' | 'star' | 'gift' | 'lock' | 'compass' | 'map' | 'xp' | 'coin'
const paths: Record<PixelIconName, string> = {
 pin:'M5 1h6v1h2v2h1v6h-2v2h-2v2H9v2H7v-2H6v-2H4v-2H2V4h1V2h2zm1 3v1H5v3h1v1h4V8h1V5h-1V4z',
 star:'M7 0h2v4h2v2h5v3h-3v2h-2v5H8v-2H6v2H3v-5H1V9H0V6h5V4h2z',
 gift:'M3 0h3v1h1v2h2V1h1V0h3v1h1v3h2v4h-1v8H1V8H0V4h2V1h1zm1 2v2h2V2zm6 0v2h2V2zM2 6v1h5V6zm7 0v1h5V6zM3 9v5h4V9zm6 0v5h4V9z',
 lock:'M5 0h6v1h2v5h2v10H1V6h2V1h2zm0 3v3h6V3zM7 9v4h2V9z',
 compass:'M4 0h8v1h2v2h1v2h1v7h-1v2h-2v1h-2v1H4v-1H2v-2H1v-2H0V5h1V3h2V1h1zm6 4L5 6l-1 6 6-2 2-6zM7 7v2h2V7z',
 map:'M0 2h2V1h3v1h2v1h2V2h2V1h5v13h-2v1h-3v-1H9v-1H7v1H5v1H0zm2 2v9h2V3zm4 0v8h1v-1h1V5zm4 0v8h2V3zm3-1v9h1V3z',
 xp:'M0 3h2l2 3 2-3h2L5 8l3 5H6l-2-3-2 3H0l3-5zm9 0h5v1h2v5h-2v1h-3v3H9zm2 2v3h3V5z',
 coin:'M5 0h6v1h2v2h2v2h1v6h-1v2h-2v2h-2v1H5v-1H3v-2H1v-2H0V5h1V3h2V1h2zm0 3v1H4v8h1v1h6v-1h1V4h-1V3zm2 2h2v6H7z',
}
export function PixelIcon({name,title,size=32,...props}: SVGProps<SVGSVGElement> & {name:PixelIconName;size?:number;title?:string}) {
 return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges" aria-hidden={title?undefined:true} role={title?'img':undefined} aria-label={title} {...props}><path fillRule="evenodd" d={paths[name]}/></svg>
}

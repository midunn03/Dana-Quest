import { t } from './i18n/locale'

/** Original 16-unit-grid city illustration, deliberately drawn as crisp vector pixels. */
export default function CoastalScene({ compact = false }: { compact?: boolean }) {
  return <svg className="home-city-art" viewBox="0 0 640 384" role="img" aria-label={t('Minh họa pixel Cầu Rồng, sông Hàn và bờ biển Đà Nẵng','Pixel illustration of Dragon Bridge, the Han River and Da Nang coast')} shapeRendering="crispEdges">
    <path fill="#E4F4FF" d="M0 0h640v384H0z"/>
    <path fill="#FFC21A" d="M480 32h48v16h16v48h-16v16h-48V96h-16V48h16z"/>
    <g fill="#fff"><path d="M32 48h32V32h48v16h32v16H32zM304 64h32V48h48v16h32v16H304z"/><path d="M544 144h32v-16h32v16h32v16h-96z"/></g>
    <path fill="#4ADE80" d="M0 160h32v-16h32v-16h48v16h48v16h48v32H0zM416 176h48v-16h32v-16h32v-16h32v16h32v16h48v64H416z"/>
    <g fill="#0F2B5B"><path d="M16 160h48v80H16zM80 128h48v112H80zM144 176h32v64h-32zM208 144h48v96h-48zM272 112h48v128h-48zM336 160h48v80h-48zM400 192h48v48h-48z"/></g>
    <g fill="#FFF7E0">{[32,96,224,288,352,416].map((x,i)=><path key={x} d={`M${x} ${i===3?128:192}h16v16h-16zM${x} 224h16v16h-16z`}/>)}</g>
    <path fill="#2FA4F5" d="M0 240h640v144H0z"/><path fill="#1E7FD8" d="M0 304h640v80H0z"/>
    <g fill="#E4F4FF"><path d="M0 272h96v8H0zM144 288h112v8H144zM464 272h128v8H464zM320 336h112v8H320zM32 352h112v8H32zM528 352h80v8h-80z"/></g>
    <path fill="#0F2B5B" d="M0 240h640v16H0zM96 256h16v48H96zM288 256h16v48h-16zM480 256h16v48h-16z"/>
    <path fill="#FF9F1C" d="M32 224v-32h16v-16h16v-16h32v-16h48v-16h64v16h48v16h32v32h16v32h32v-16h16v-32h16v-32h32v-16h48v16h32v16h32v16h32v16h48v16H32z"/>
    <path fill="#FFC21A" d="M48 224v-16h16v-16h16v-16h32v-16h96v16h48v32h16v32h64v-16h16v-32h16v-32h64v16h32v16h32v16h32v16h48v16H48z"/>
    <path fill="#0F2B5B" d="M512 208h16v16h-16z"/><path fill="#FFC21A" d="M496 192v-32h16v16h16v16zM528 208h32v16h-32z"/>
    <path fill="#FFF7E0" d="M0 352h48v-16h48v16h48v32H0zM480 368h48v-16h112v32H480z"/>
    {!compact&&<g><path fill="#0F2B5B" d="M176 304h16v-16h16v16h16v32h-16v16h-16v-16h-16z"/><path fill="#FFC21A" d="M192 304h16v16h-16z"/><path fill="#F0452F" d="M576 48h32v16h16v32h-16v16h-16v16h-16V96h-16V64h16z"/><path fill="#fff" d="M576 64h32v16h-32z"/></g>}
  </svg>
}

import './PixelLogo.css'

export default function PixelLogo({className='',compact=false}:{className?:string;compact?:boolean}) {
  return <img className={`brand-logo${compact?' brand-logo--compact':''}${className?` ${className}`:''}`} src={`${import.meta.env.BASE_URL}brand/dana-quest-logo.png`} width="640" height="521" alt="" aria-hidden="true" decoding="async" />
}

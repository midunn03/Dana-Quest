import './Controls.css'
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import './PixelUI.css'

const cls = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(' ')
export function PixelButton({variant='primary',size='md',loading=false,className,children,disabled,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'secondary'|'ghost'|'danger';size?:'sm'|'md'|'lg';loading?:boolean}) {
 return <button type="button" {...props} disabled={disabled||loading} aria-busy={loading||undefined} className={cls('px-button',`px-button--${variant}`,`px-button--${size}`,className)}>{loading&&<span className="px-spinner" aria-hidden="true"/>}{children}</button>
}
export function PixelProgressBar({value,max=100,label,className}: {value:number;max?:number;label:string;className?:string}) {
 const safeMax = Number.isFinite(max)&&max>0?max:100
 const safeValue = Number.isFinite(value)?Math.max(0,Math.min(value,safeMax)):0
 return <div className={cls('px-progress',className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={safeValue}><span className="px-progress__fill" style={{transform:`scaleX(${safeValue/safeMax})`}}/><span className="px-progress__cells" aria-hidden="true"/></div>
}
export function PixelToast({tone='info',className,children,...props}:HTMLAttributes<HTMLDivElement>&{tone?:'info'|'success'|'error'}) {return <div role={tone==='error'?'alert':'status'} {...props} className={cls('px-toast',`px-toast--${tone}`,className)}>{children}</div>}
export function PixelAccordion({title,children,className,...props}:Omit<HTMLAttributes<HTMLDetailsElement>,'title'>&{title:ReactNode;open?:boolean}) {return <details {...props} className={cls('px-accordion',className)}><summary>{title}<span aria-hidden="true">+</span></summary><div className="px-accordion__body">{children}</div></details>}
export { PixelButton as Button, PixelProgressBar as ProgressBar, PixelToast as Toast, PixelAccordion as Accordion }

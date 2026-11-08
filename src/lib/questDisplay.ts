export const displayText=(text:string)=>text.replace(/\s+[—–-]\s+(.+)$/, ' ($1)')
export function downloadLocalFile(filename:string,contents:string,type='application/json'){
 const url=URL.createObjectURL(new Blob([contents],{type}));const link=document.createElement('a');link.href=url;link.download=filename;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}

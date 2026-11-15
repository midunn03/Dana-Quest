export interface EventDecision {choice?:'attend'|'later'|'removed';nextAt?:number;remindedAt?:number;updatedAt?:number}
export interface Occurrence {key:string;start:number;end:number}
export const MINUTE:number
export function dueNotice(state:EventDecision,start:number,now:number):'invite'|'reminder'|null
export function decideEvent(state:EventDecision,choice:'attend'|'later'|'remove',now:number):EventDecision
export function claimNotice(state:EventDecision,kind:'invite'|'reminder',now:number):EventDecision
export function occurrenceFor(event:{id:string;startAt?:string;endAt?:string;recurring?:string;status:string},now?:number):Occurrence|null

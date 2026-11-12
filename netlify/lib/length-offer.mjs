export const OFFER='rmi-length-v1';
export const ACCOUNT='acct_1UHXZ9JM9upNSRp4';
export function quote(input){
 if(!input||Object.keys(input).some(k=>!['seconds','kind','request_id'].includes(k)))throw Error('Invalid order fields');
 const {seconds,kind,request_id}=input;
 if(!Number.isSafeInteger(seconds)||seconds<30||seconds>999999||!['full','preview'].includes(kind))throw Error('Choose a whole number of seconds, at least 30');
 if(typeof request_id!=='string'||!/^[a-f0-9-]{36}$/.test(request_id))throw Error('Invalid request reference');
 return {seconds,kind,amount:kind==='preview'?500:seconds*100,reference:`RMI-V1-${kind==='preview'?'P':'F'}-${seconds}-${request_id}`};
}
export function matchSession(s){
 if(s.metadata?.offer!==OFFER)return null;
 const {seconds,kind,request_id}=s.metadata;
 let q;try{q=quote({seconds:Number(seconds),kind,request_id});}catch{return null;}
 if(s.client_reference_id!==q.reference||s.metadata.expected_account!==ACCOUNT||s.currency!=='usd'||s.amount_total!==q.amount||s.amount_subtotal!==q.amount||s.mode!=='payment')return null;
 return q;
}

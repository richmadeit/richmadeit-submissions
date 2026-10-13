import Rules from './physics.js';
const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), b=>b.toString(16).padStart(2,'0')).join('');
const digest = async value => hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const token = () => hex(crypto.getRandomValues(new Uint8Array(24)));
export const cleanName = value => typeof value==='string' ? value.normalize('NFKC').replace(/[^\p{L}\p{N} _.-]/gu,'').replace(/\s+/g,' ').trim().slice(0,20) : '';
const fail = (message,status=400) => {throw Object.assign(new Error(message),{status});};
export function verifyReplay(seed, shots, expected){
  if(!Array.isArray(shots)||shots.length>60||!Number.isInteger(expected)||expected<0||expected>360)fail('That score could not be checked. Try a fresh round.');
  let points=0,streak=0,end=0,totalSteps=0;
  for(let index=0;index<shots.length;index++){
    const shot=shots[index];
    if(!shot||![shot.dx,shot.up,shot.start,shot.wait].every(Number.isFinite)||Math.abs(shot.dx)>115||shot.up<28||shot.up>220||shot.start<0||shot.start>=60.001||shot.start<end||shot.wait<0||shot.wait>60||!Array.isArray(shot.steps)||shot.steps.length>4000)fail('Round data was incomplete. Try another round.');
    if(index===0 ? Math.abs(shot.start-shot.wait)>.15 : shot.wait>shot.start-end+.15)fail('Round timing could not be checked.');
    const scene=Rules.scene(seed,index);scene.defenderTime=shot.wait;
    const ball=Rules.launch(scene,shot.dx,shot.up,index===0);
    let flight=0,made=false;
    for(const dt of shot.steps){if(!Number.isFinite(dt)||dt<=0||dt>.056||ball.settled||++totalSteps>12000)fail('Round data was invalid.');flight+=dt;const result=Rules.step(ball,scene,dt);if(result.score){made=true;points+=Rules.points(++streak,scene);}}
    if(!ball.settled)fail('Finish your round before posting.');
    if(!made)streak=0;
    end=shot.start+flight;
    if(end>66)fail('That round ran too long.');
  }
  if(points!==expected)fail('The score did not match the round. Please play again.');
  return points;
}

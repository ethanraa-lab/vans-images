import readline from 'node:readline';
import { Writable } from 'node:stream';
import { passwordHash } from '../lib/auth.js';
// Hide typed input. Print only the salted hash for your hosting secret setting.
const output = new Writable({write(chunk,encoding,callback){callback()}});
const input = readline.createInterface({input:process.stdin,output,terminal:true});
process.stdout.write('New shared password (at least 12 characters; input hidden): ');
input.question('',async password=>{input.close();process.stdout.write('\n');if(password.length<12){console.error('Use at least 12 characters.');process.exitCode=1;return;}console.log(await passwordHash(password));});

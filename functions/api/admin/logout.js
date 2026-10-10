import {json} from '../../../server/db.js';
import {clearCookie} from '../../../server/auth.js';
export async function onRequestPost(){ return json({ok: true}, 200, {'Set-Cookie': clearCookie()}); }

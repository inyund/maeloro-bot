// Fetch the current socketProxy host from MaeloRO's loader (it rotates: entradaNN).
// Cached for 60s; callback fires with (err, url).
const http = require('https');

let cache = { url: null, at: 0 };
const inflight = [];

function fetchNow(cb) {
  const get = (path, ok) => {
    http.get({host:'maeloro.com', path, headers:{'User-Agent':'Mozilla/5.0'}}, (res) => {
      let b=''; res.on('data',c=>b+=c); res.on('end',()=>ok(b));
    }).on('error', ()=>ok(null));
  };
  get('/play.php', (html) => {
    if (!html) return cb(null);
    const m = html.match(/\}\)\('([A-Za-z0-9+/=]+)'\)/);
    if (!m) return cb(null);
    let js; try { js = Buffer.from(m[1], 'base64').toString(); } catch { return cb(null); }
    const srv = (js.match(/REMOTE_SERVERS\s*=\s*\[(.*?)\]/)||[])[1];
    const first = srv ? srv.split(',')[0].replace(/[^a-z0-9]/g,'') : 'juego2';
    get('/loadConfigMaeloRO.php?server='+first, (cfgjs) => {
      if (!cfgjs) return cb(null);
      try {
        const p = JSON.parse('['+cfgjs.match(/_p=\[([^\]]+)\]/)[1].replace(/'/g,'"')+']');
        const ord = JSON.parse('['+cfgjs.match(/_m=\[([^\]]+)\]/)[1]+']');
        const k = cfgjs.match(/_k='([^']+)'/)[1];
        const s = ord.map(i=>p[i]).join('');
        const dec = Buffer.from(s,'base64');
        let out=''; for (let i=0;i<dec.length;i++) out+=String.fromCharCode(dec[i]^k.charCodeAt(i%k.length));
        const u = out.match(/socketProxy":"(wss:\/\/[^"]+)"/);
        cb(u ? u[1] : null);
      } catch { cb(null); }
    });
  });
}

module.exports = function resolveProxy(cb) {
  if (cache.url && Date.now() - cache.at < 60000) { cb(cache.url); return; }
  inflight.push(cb);
  if (inflight.length > 1) return;
  fetchNow((u) => {
    if (u) { cache = { url: u, at: Date.now() }; }
    let cbs = inflight.splice(0);
    for (const c of cbs) c(u || cache.url || process.env.UPSTREAM_BASE || 'wss://entrada29.maeloro.com');
  });
};

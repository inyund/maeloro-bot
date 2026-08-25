const net = require('net');
const tls = require('tls');
const crypto = require('crypto');
const resolveProxy = require('./proxy-resolve.js');

// One listener per RO hop. PORTS env: "50100=127.0.0.1:50100,50200=127.0.0.1:50200,..."
// Each maps local TCP -> wss://UPSTREAM/<target>.
let UPSTREAM_BASE = process.env.UPSTREAM_BASE || 'wss://entrada29.maeloro.com';
resolveProxy(u => { if (u) UPSTREAM_BASE = u; }); // run sync-ish or let first connect fail then catch up
function wsHandshakeHeaders(key, hostHeader, path) {
  return ['GET ' + path + ' HTTP/1.1','Host: ' + hostHeader,'Upgrade: websocket','Connection: Upgrade','Sec-WebSocket-Key: ' + key,'Sec-WebSocket-Version: 13','\r\n'].join('\r\n');
}
function encodeFrame(buf) {
  const len = buf.length;
  const mask = crypto.randomBytes(4);
  const masked = Buffer.from(buf.map((b, i) => b ^ mask[i % 4]));
  let header;
  if (len < 126) header = Buffer.from([0x82, 0x80 | len]);
  else if (len < 65536) { header = Buffer.alloc(4); header[0]=0x82; header[1]=0x80|126; header.writeUInt16BE(len,2); }
  else { header = Buffer.alloc(10); header[0]=0x82; header[1]=0x80|127; header.writeBigUInt64BE(BigInt(len),2); }
  return Buffer.concat([header, mask, masked]);
}

const mappings = (process.env.PORTS || '50100=127.0.0.1:50100').split(',').map(s => {
  const [listen, target] = s.split('=');
  return { listen: parseInt(listen,10), target };
});

function connectUpstream(tcpSock, target, key, base) {
  console.log('ws2tcp: conn', target);
  const cur = new URL(base);
  const hostn = cur.hostname, p = parseInt(cur.port || (cur.protocol==='wss:'?443:80),10);
  const upstream = cur.protocol==='wss:' ? tls.connect({host:hostn, port:p, servername:hostn}) : net.connect(p, hostn);
  const host = cur.host;
  const path = '/' + target;

  let handshaken = false, acc = Buffer.alloc(0);
  const pendingClient = [];

  function wsSend(data){ if(process.env.DBGWS) console.log('DBG',target,data.length,data.toString('hex')); try{ upstream.write(encodeFrame(data)); }catch(e){} }
  function feed(chunk){
    acc=Buffer.concat([acc,chunk]);
    while(true){
      if(acc.length<2)return;
      const op=acc[0]&0xf; let len=acc[1]&0x7f, off=2;
      if(len===126){if(acc.length<4)return;len=acc.readUInt16BE(2);off=4;}
      else if(len===127){if(acc.length<10)return;len=Number(acc.readBigUInt64BE(2));off=10;}
      if(op===8){tcpSock.destroy();upstream.destroy();return;}
      if(op===9){acc=acc.slice(off+len);continue;} // ping: drop
      if(acc.length<off+len)return;
      if(op===2){ if(target.endsWith(':50200')) console.log('ws2tcp: char <-', len, acc.slice(off,off+len).toString('hex').slice(0,32)); tcpSock.write(acc.slice(off,off+len)); }
      acc=acc.slice(off+len);
    }
  }

  tcpSock.pause();
  upstream.on('secureConnect', () => {
    upstream.write(wsHandshakeHeaders(key, host, path));
  });
  upstream.on('data',(c)=>{ if(target.endsWith(':50200')) console.log('ws2tcp: char up', c.length);
    if(!handshaken){
      acc=Buffer.concat([acc,c]); const i=acc.indexOf('\r\n\r\n');
      if(i===-1)return;
      handshaken=true; const rest=acc.slice(i+4); acc=Buffer.alloc(0);
      if(rest.length)feed(rest);
      tcpSock.resume();
      while(pendingClient.length){ wsSend(pendingClient.shift()); }
      return;
    }
    feed(c);
  });
  upstream.on('error',()=>tcpSock.destroy());
  upstream.on('close',()=>tcpSock.destroy());
  tcpSock.on('data',(d)=>{ if(!handshaken){ pendingClient.push(d); } else wsSend(d); });
  tcpSock.on('error',()=>{});
  tcpSock.on('close',()=>{ if(target.endsWith(':50200')) console.log('ws2tcp: char client closed'); upstream.destroy(); });
}

for (const { listen, target } of mappings) {
  const server = net.createServer((tcpSock) => {
    const key = crypto.randomBytes(16).toString('base64');
    // backends rotate and char-auth state is backend-local: resolve fresh for every connection
    resolveProxy((u) => {
      if (!u) { tcpSock.destroy(); return; }
      UPSTREAM_BASE = u;
      connectUpstream(tcpSock, target, key, u);
    });
  });
  server.listen(listen,'127.0.0.1',()=>console.log(`ws2tcp: ${listen} -> (resolved per connection)/${target}`));
}

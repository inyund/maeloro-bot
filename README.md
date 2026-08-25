# maeloro-bot

OpenKore bot for MaeloRO (maeloro.com), a browser-based Ragnarok Online private
server served through ROBrowser.

## How it connects

MaeloRO's ROBrowser client does not expose a plain TCP game port. It tunnels
RO packets over WebSocket:

```
browser --wss--> wss://entrada29.maeloro.com/<game-host>:<game-port> --> RO servers
```

`shim/ws2tcp.js` bridges that: OpenKore dials `127.0.0.1:50100` (raw TCP, as it
always does) and the shim relays every byte over
`wss://entrada29.maeloro.com/127.0.0.1:50100`, which is the same tunnel the
real client uses (decoded from `loadConfigMaeloRO.php`: packetver 20231221,
Renewal, langtype 20, version 55).

## Run

```sh
docker build -t maeloro-bot .
docker run -d --name maeloro-bot maeloro-bot
docker logs -f maeloro-bot
```

## Config

- `control/config.txt` picks character 1. Credentials come from `KORE_USERNAME`/`KORE_PASSWORD` env at runtime — never committed.
- Behavior is idle-on-purpose: `attackAuto 0`, no pickups, no routes.

## Deployed

Dokploy compose on the inyund VPS rebuilds this image; see `.github/workflows`/docs
in the ops repo. Health = bot process alive + shim listening.

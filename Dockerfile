FROM node:24-bookworm-slim AS shim
COPY shim/ /shim/

FROM debian:bookworm-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
      perl python3 make g++ libreadline-dev libncurses-dev libcurl4-openssl-dev && \
    rm -rf /var/lib/apt/lists/*
COPY openkore/ /bot/openkore/
WORKDIR /bot/openkore
# Build XSTools (readline + ncurses + libcurl present at build time)
RUN python3 src/scons-local-3.1.2/scons.py

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
      perl libreadline8 libncurses6 libcurl4 \
      nodejs npm \
      ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=shim /shim/ws2tcp.js /bot/ws2tcp.js
COPY --from=builder /bot/openkore/ /bot/openkore/
COPY control/ /bot/control/
COPY entrypoint.sh /bot/entrypoint.sh
RUN chmod +x /bot/entrypoint.sh && node --version
WORKDIR /bot
ENTRYPOINT ["./entrypoint.sh"]

#!/bin/bash
set -e
cd /shim
PORTS="${PORTS:-50100=127.0.0.1:50100,50200=127.0.0.1:50200,50300=127.0.0.1:50300,6121=127.0.0.1:6121}" node ws2tcp.js &
cd /bot

# ponytail: OpenKore config has no env interpolation; sed is the sanctioned hack.
export KORE_USERNAME="${KORE_USERNAME:-inyund}"
: "${KORE_PASSWORD:?KORE_PASSWORD env required}"
sed -i "s/\${KORE_USERNAME}/$KORE_USERNAME/; s/\${KORE_PASSWORD}/$KORE_PASSWORD/" control/config.txt

cd openkore
exec perl openkore.pl --control=../control --interface=Console::Simple

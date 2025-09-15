## Spike: TURN setup for future calls (Agent 7)

Goal: Bring up a minimal TURN server locally to validate connectivity for future WebRTC calls. Include config, compose, and testing notes.

Deliverables
- `docker-compose.yml` for coturn
- `turnserver.conf` with long-term credentials
- `.env` to configure realm, external IP, and credentials
- Test procedure (Trickle ICE or a simple WebRTC sample)

Steps
1) Copy env and edit values:
```bash
cp spikes/turn-setup/.env.sample spikes/turn-setup/.env
# set EXTERNAL_IP to your public IP; set TURN_REALM/USERNAME/PASSWORD
```
2) Start coturn:
```bash
docker compose -f spikes/turn-setup/docker-compose.yml up -d
```
3) Test with Trickle ICE: add this ICE server in a browser test tool:
```json
{
  "urls": [
    "turn:${YOUR_DOMAIN_OR_IP}:3478?transport=udp",
    "turn:${YOUR_DOMAIN_OR_IP}:3478?transport=tcp"
  ],
  "username": "${TURN_USERNAME}",
  "credential": "${TURN_PASSWORD}"
}
```

Notes
- Ensure UDP 3478 and relay ports 49160-49200/udp are open to the world on your host firewall.
- TLS is disabled in this minimal setup; add certs and enable `tls-listening-port` later.


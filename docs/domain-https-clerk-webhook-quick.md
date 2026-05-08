# Quick Setup: Domain + HTTPS + Clerk Webhook

## 1) Buy and point a domain
- Buy a domain (Cloudflare, Namecheap, Porkbun, etc.).
- Add DNS records:
  - `A` record: `@` -> `YOUR_VPS_PUBLIC_IP`
  - Optional: `CNAME` `www` -> `@`
- Verify DNS:
  - `dig +short yourdomain.com`

## 2) Open network ports on VPS
- Open `80/tcp` and `443/tcp`.
- If you use UFW:
  - `sudo ufw allow 80/tcp`
  - `sudo ufw allow 443/tcp`

## 3) Run backend locally on the server
- Keep Express on `127.0.0.1:3000` (or your internal port).

## 4) Add HTTPS reverse proxy
- Use Caddy/Nginx in front of Express.
- Example (Caddy):

```caddy
yourdomain.com {
  reverse_proxy 127.0.0.1:3000
}
```

- Check:
  - `curl -I https://yourdomain.com/api/health`

## 5) Configure backend env
- Set:
  - `CLERK_SECRET_KEY=...`
  - `CLERK_WEBHOOK_SECRET=...` (from Clerk endpoint secret)
  - `FRONTEND_URL=https://yourdomain.com`
- Restart backend after env changes.

## 6) Create webhook endpoint in Clerk
- Clerk Dashboard -> **Webhooks** -> **Add Endpoint**
- Endpoint URL:
  - `https://yourdomain.com/api/webhooks/clerk`
- Select events:
  - `user.created`
  - `user.updated`
  - `user.deleted`

## 7) Test delivery
- Use **Send example** in Clerk.
- Expect:
  - Delivery status `200`
  - No `WEBHOOK_INVALID` in backend logs
  - `users` table is synced (create/update/delete by Clerk user id)

## 8) Common failures
- `404`: wrong path (must be `/api/webhooks/clerk`)
- `500 WEBHOOK_NOT_CONFIGURED`: missing `CLERK_WEBHOOK_SECRET`
- `400 WEBHOOK_INVALID`: wrong webhook secret/signature
- TLS issues: DNS not pointed correctly or ports 80/443 closed

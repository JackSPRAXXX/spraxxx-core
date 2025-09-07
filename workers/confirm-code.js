export async function onRequestPost({ env, request }) {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

  const body = await request.json().catch(() => ({}));
  const { handle, domain, code } = body ?? {};
  if (typeof handle !== 'string' || typeof domain !== 'string' || typeof code !== 'string') {
    return json({ ok:false, error: 'Missing fields' }, 400);
  }

  const h = handle.trim().toLowerCase();
  const d = domain.trim().toLowerCase();
  const c = code.trim();

  // Allowed domains for SPRAXXX addresses
  const allowed = new Set(['spraxxx.me','spraxxx.tv','spraxxx.ai']);
  if (!allowed.has(d)) return json({ ok:false, error: 'Invalid domain' }, 400);

  // Handle validation: 3-30 chars, lowercase a-z0-9 and dots, no leading/trailing/consecutive dots
  if (!/^[a-z0-9.]{3,30}$/.test(h) || h.startsWith('.') || h.endsWith('.') || h.includes('..')) {
    return json({ ok:false, error: 'Invalid handle' }, 400);
  }

  // Code should be 6 digits
  if (!/^[0-9]{6}$/.test(c)) return json({ ok:false, error: 'Invalid code' }, 400);

  const full = `${h}@${d}`;

  try {
    // Find pending row that matches address+code and is not expired, newest first
    const pending = await env.DB.prepare(
      "select * from pending where address = ? and code = ? and expires_at > strftime('%s','now') order by created_at desc limit 1"
    ).bind(full, c).first();

    if (!pending) return json({ ok:false, error: 'Invalid or expired code' }, 400);

    // Check if the address is already claimed
    const exists = await env.DB.prepare('select 1 from users where address = ?').bind(full).first();
    if (exists) return json({ ok:false, error: 'Address already claimed' }, 409);

    // Insert user record (handle race by catching unique constraint errors)
    const now = Math.floor(Date.now() / 1000);
    try {
      await env.DB.prepare('insert into users(address, created_at) values(?,?)').bind(full, now).run();
    } catch (insertErr) {
      // If concurrent insert occurred, treat as conflict without leaking details
      return json({ ok:false, error: 'Address already claimed' }, 409);
    }

    // Delete only the pending row that matches this code to avoid orphan deletions
    await env.DB.prepare('delete from pending where address = ? and code = ?').bind(full, c).run();

    // NOTE: If using Cloudflare Email Routing or your mail server API,
    // create the forwarding mailbox or DNS/mail routing here.

    return json({ ok:true, address: full });
  } catch (err) {
    // Keep response neutral, avoid leaking DB internals
    return json({ ok:false, error: 'Server error' }, 500);
  }
}
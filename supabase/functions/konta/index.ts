// Funkcja serwera „konta” — zakładanie kont pracowników z CRM (Ustawienia → Użytkownicy → + Nowe konto).
// Klucz serwisowy jest dostępny tylko tutaj (zmienna środowiskowa Supabase), nigdy w przeglądarce.
// Warunki: wywołujący jest zalogowany, ma 2FA (aal2), jest aktywnym Administratorem.
// Konto dostaje hasło tymczasowe (do zmiany przy pierwszym logowaniu) i potwierdzony e-mail.
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const ORIGINS = ['https://lexsalus.github.io', 'http://localhost:8765'];
const ROLES = ['admin', 'att', 'app', 'office', 'tech'];

function cors(req: Request) {
  const o = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}
const out = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } });

function claims(jwt: string): Record<string, unknown> {
  try {
    const p = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(p + '='.repeat((4 - p.length % 4) % 4)));
  } catch { return {}; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return out(req, 405, { error: 'Tylko POST' });
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return out(req, 401, { error: 'Brak logowania' });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: { user } } = await admin.auth.getUser(jwt);
  if (!user) return out(req, 401, { error: 'Sesja wygasła — zaloguj się ponownie' });
  if (claims(jwt).aal !== 'aal2') return out(req, 403, { error: 'Wymagane logowanie z 2FA' });
  const { data: me } = await admin.from('profiles').select('role,active').eq('id', user.id).single();
  if (!me || me.role !== 'admin' || !me.active) return out(req, 403, { error: 'Konta zakłada tylko Administrator' });

  let b: { email?: string; full_name?: string; role?: string; active?: boolean; password?: string };
  try { b = await req.json(); } catch { return out(req, 400, { error: 'Błędne dane' }); }
  const email = String(b.email || '').trim().toLowerCase();
  const name = String(b.full_name || '').trim().slice(0, 120);
  const role = String(b.role || '');
  const pass = String(b.password || '');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return out(req, 400, { error: 'Nieprawidłowy e-mail' });
  if (!ROLES.includes(role)) return out(req, 400, { error: 'Nieznana rola' });
  if (pass.length < 12) return out(req, 400, { error: 'Hasło tymczasowe musi mieć co najmniej 12 znaków' });

  const { data: cu, error } = await admin.auth.admin.createUser({ email, password: pass, email_confirm: true, user_metadata: { full_name: name } });
  if (error || !cu?.user) {
    const m = /already|exists|registered/i.test(error?.message || '') ? 'Konto z tym adresem już istnieje' : (error?.message || 'Nie udało się utworzyć konta');
    return out(req, 400, { error: m });
  }
  const { error: e2 } = await admin.rpc('account_created', { p_user: cu.user.id, p_by: user.id, p_name: name, p_role: role, p_active: b.active !== false });
  if (e2) return out(req, 500, { error: 'Konto utworzone, ale nie ustawiono roli: ' + e2.message, id: cu.user.id });
  return out(req, 200, { ok: true, id: cu.user.id });
});

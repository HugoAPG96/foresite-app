export interface Miembro {
  id: string;
  role: string | null;
  usuario: { id: string; name: string; email: string } | null;
}

export interface MemberApiResponse {
  id: string;
  role: string | null;
  user: { id: string; name: string; email: string } | null;
}

export function mapMiembroFromApi(m: MemberApiResponse): Miembro {
  return { id: m.id, role: m.role, usuario: m.user };
}

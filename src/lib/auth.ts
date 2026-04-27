/** Mock authentication + company onboarding stored in localStorage. */

export interface MockUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface Empresa {
  nombre: string;
  sectorId: string;
  categoriaId: string;
  subcatId: string;
  scian?: string;
  ideaNegocio?: string;
  consultoria?: ConsultoriaResult;
  createdAt: string;
}

export interface ConsultoriaResult {
  inversionMin: number;
  inversionMax: number;
  desglose: { concepto: string; monto: number }[];
  criticos: { item: string; descripcion: string }[];
  resumen: string;
  generadoEn: string;
}

const USERS_KEY = "geomarket_users";
const SESSION_KEY = "geomarket_session";
const EMPRESA_KEY = "geomarket_empresa";

interface StoredUser extends MockUser {
  password: string;
}

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function register(email: string, password: string): MockUser {
  const users = readUsers();
  const normalized = email.trim().toLowerCase();
  if (users.some((u) => u.email === normalized)) {
    throw new Error("Ya existe una cuenta con este correo");
  }
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: normalized,
    password,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  setSession(user);
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

export function login(email: string, password: string): MockUser {
  const users = readUsers();
  const normalized = email.trim().toLowerCase();
  const user = users.find((u) => u.email === normalized && u.password === password);
  if (!user) throw new Error("Correo o contraseña incorrectos");
  setSession(user);
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

function setSession(user: StoredUser) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: user.id, email: user.email, createdAt: user.createdAt })
  );
}

export function getSession(): MockUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getEmpresa(): Empresa | null {
  try {
    const raw = localStorage.getItem(EMPRESA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveEmpresa(empresa: Empresa) {
  localStorage.setItem(EMPRESA_KEY, JSON.stringify(empresa));
}

export function clearEmpresa() {
  localStorage.removeItem(EMPRESA_KEY);
}

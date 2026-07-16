export type RegistrationInput = {
  username?: unknown;
  email?: unknown;
  password?: unknown;
  passwordConfirm?: unknown;
};

export function normalizeUsername(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase('en-US') : '';
}

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase('en-US') : '';
}

export function validateRegistration(input: RegistrationInput) {
  const username = normalizeUsername(input.username);
  const email = normalizeEmail(input.email);
  const password = typeof input.password === 'string' ? input.password : '';
  const passwordConfirm = typeof input.passwordConfirm === 'string' ? input.passwordConfirm : '';

  if (!/^[\p{L}\p{N}_]{2,20}$/u.test(username)) {
    return { ok: false as const, error: '用户名需为 2–20 位中英文、数字或下划线' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false as const, error: '邮箱格式不正确' };
  }
  if (password.length < 8 || password.length > 72) {
    return { ok: false as const, error: '密码长度需为 8–72 位' };
  }
  if (password !== passwordConfirm) {
    return { ok: false as const, error: '两次输入的密码不一致' };
  }
  return { ok: true as const, value: { username, email, password } };
}

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET || 'local-dev-secret'

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signAdminToken(payload: { id: string; email: string; name: string }) {
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifyAdminToken(token: string) {
  return jwt.verify(token, secret) as { id: string; email: string; name: string }
}

export function signCustomerToken(payload: { id: string; email: string; name: string }) {
  return jwt.sign({ ...payload, role: 'customer' }, secret, { expiresIn: '30d' })
}

export function verifyCustomerToken(token: string) {
  const payload = jwt.verify(token, secret) as { id: string; email: string; name: string; role?: string }
  if (payload.role !== 'customer') throw new Error('Unauthorized')
  return payload
}

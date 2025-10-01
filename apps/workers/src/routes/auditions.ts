import { Hono } from 'hono'
import type { AppBindings } from '../types'

const auditionsRoutes = new Hono<AppBindings>()

auditionsRoutes.get('/auditions/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ message: `Audition ${id} - TODO` })
})

auditionsRoutes.post('/auditions/:id/entries', (c) => {
  const id = c.req.param('id')
  return c.json({ message: `Entry for audition ${id} - TODO` })
})

auditionsRoutes.get('/organizer/auditions/:id/entries', (c) => {
  const id = c.req.param('id')
  return c.json({ message: `Entries for audition ${id} - TODO` })
})

auditionsRoutes.post('/uploads/sign', (c) => {
  return c.json({ message: 'Upload sign endpoint - TODO' })
})

auditionsRoutes.post('/webhooks/line', (c) => {
  return c.json({ message: 'LINE webhook - TODO' })
})

auditionsRoutes.post('/webhooks/stripe', (c) => {
  return c.json({ message: 'Stripe webhook - TODO' })
})

export default auditionsRoutes

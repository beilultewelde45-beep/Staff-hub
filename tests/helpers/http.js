import request from 'supertest';

export function csrfFrom(html) {
  const m = /name="_csrf" value="([^"]+)"/.exec(html);
  if (!m) throw new Error('No CSRF token in page');
  return m[1];
}

/** Sign in with a supertest agent (cookies persist). Returns the POST /login response. */
export async function login(agent, email, password) {
  const page = await agent.get('/login');
  return agent.post('/login').type('form').send({ email, password, _csrf: csrfFrom(page.text) });
}

export function newAgent(app) {
  return request.agent(app);
}

const BASE = import.meta.env.DEV ? '/api' : 'https://api.mctools.liamt.xyz'

export async function fetchPlayer(name: string) {
  const res = await fetch(`${BASE}/player/${encodeURIComponent(name)}`)
  if (!res.ok) throw new Error((await res.json() as { error: string }).error)
  return res.json()
}

export async function fetchServer(host: string, port?: string, bedrock = false) {
  const path = port ? `${encodeURIComponent(host)}/${encodeURIComponent(port)}` : encodeURIComponent(host)
  const query = bedrock ? '?bedrock=true' : ''
  const res = await fetch(`${BASE}/server/${path}${query}`)
  return res.json()
}

export async function fetchColors() {
  const res = await fetch(`${BASE}/utils/color`)
  return res.json()
}

export async function encodeText(text: string) {
  const res = await fetch(`${BASE}/utils/encode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  return res.json()
}

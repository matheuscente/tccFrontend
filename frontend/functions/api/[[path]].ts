// Cloudflare Pages Function: repassa /api/* para a API hospedada no Render.
// Assim o navegador fala só com o domínio do frontend, e o cookie de sessão (rToken)
// continua sendo do mesmo site, inclusive no Safari e no iPhone.

interface Env {
  API_ORIGIN: string;
}

interface Context {
  request: Request;
  env: Env;
}

const HOP_BY_HOP = ["host", "connection", "keep-alive", "transfer-encoding", "upgrade"];

export const onRequest = async ({ request, env }: Context): Promise<Response> => {
  if (!env.API_ORIGIN) {
    return Response.json(
      { statusCode: 500, state: "error", data: [{ message: "API_ORIGIN não configurada no Cloudflare Pages" }] },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, env.API_ORIGIN);

  const headers = new Headers(request.headers);
  HOP_BY_HOP.forEach((name) => headers.delete(name));
  headers.set("x-forwarded-host", url.host);
  headers.set("x-forwarded-proto", url.protocol.replace(":", ""));

  const hasBody = !["GET", "HEAD"].includes(request.method);

  return fetch(target.toString(), {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: "manual",
  });
};

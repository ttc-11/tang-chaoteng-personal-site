export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const requiredFields = ["company", "name", "role", "contact", "message"];
  const missing = requiredFields.filter((field) => !String(payload?.[field] || "").trim());
  if (missing.length) {
    return json({ ok: false, error: `Missing fields: ${missing.join(", ")}` }, 400);
  }

  const webhook = env.FEISHU_WEBHOOK_URL;
  if (!webhook) {
    return json({ ok: false, error: "Missing FEISHU_WEBHOOK_URL" }, 500);
  }

  const text = [
    "收到新的企业留言",
    `公司名称：${payload.company}`,
    `联系人：${payload.name}`,
    `岗位 / 合作方向：${payload.role}`,
    `联系方式：${payload.contact}`,
    `留言内容：${payload.message}`,
  ].join("\n");

  const response = await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      msg_type: "text",
      content: {
        text,
      },
    }),
  });

  const detail = await response.text();
  if (!response.ok) {
    return json(
      { ok: false, error: `Feishu returned HTTP ${response.status}`, detail },
      502,
    );
  }

  return json({ ok: true, detail }, 200);
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

 const defaultHeaders = {
  "Content-Type": "application/json; charset=UTF-8",
};

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Failed to parse response JSON");
  }
}

async function request(method, url, data) {
  try {
    const options = { method };

    if (method !== "GET" && method !== "HEAD") {
      options.headers = defaultHeaders;
      options.body = data !== undefined ? JSON.stringify(data) : null;
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const parsed = await parseJsonSafe(response);

    return {
      data: parsed,
      status: response.status,
      ok: response.ok,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    throw new Error(message);
  }
}

export function get(url) {
  return request("GET", url);
}

export function post(url, data) {
  return request("POST", url, data);
}

export function put(url, data) {
  return request("PUT", url, data);
}

export function patch(url, data) {
  return request("PATCH", url, data);
}

export function del(url) {
  return request("DELETE", url);
}

import * as http from "../api/httpClient.js";
import { ENDPOINTS, buildUrl } from "../api/endpoints.js";

const BASE = ENDPOINTS.JSONPLACEHOLDER;

export async function getAllPosts() {
  const url = buildUrl(BASE, "/posts");
  const response = await http.get(url);
  return response.data;
}

export async function getPostById(id) {
  const url = buildUrl(BASE, `/posts/${id}`);
  const response = await http.get(url);
  return response.data;
}

export async function getPostComments(id) {
  const url = buildUrl(BASE, `/posts/${id}/comments`);
  const response = await http.get(url);
  return response.data;
}

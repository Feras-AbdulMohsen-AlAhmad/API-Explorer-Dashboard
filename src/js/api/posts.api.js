// JSONPlaceholder Posts API layer
// Pure HTTP operations for Posts endpoints

import * as http from "./httpClient.js";
import { ENDPOINTS, buildUrl } from "./endpoints.js";

const BASE = ENDPOINTS.JSONPLACEHOLDER;

/**
 * Fetch all posts
 * @returns {Promise<Array>} Array of posts
 */
export async function fetchAllPosts() {
  const url = buildUrl(BASE, "/posts");
  const response = await http.get(url);
  return response.data;
}

/**
 * Fetch a single post by ID
 * @param {number} id - Post ID
 * @returns {Promise<Object>} Post object
 */
export async function fetchPostById(id) {
  const url = buildUrl(BASE, `/posts/${id}`);
  const response = await http.get(url);
  return response.data;
}

/**
 * Fetch comments for a specific post
 * @param {number} postId - Post ID
 * @returns {Promise<Array>} Array of comment objects
 */
export async function fetchPostComments(postId) {
  const url = buildUrl(BASE, `/posts/${postId}/comments`);
  const response = await http.get(url);
  return response.data;
}

/**
 * Create a new post
 * @param {Object} payload - Post data (userId, title, body)
 * @returns {Promise<Object>} Created post with ID
 */
export async function createPost(payload) {
  const url = buildUrl(BASE, "/posts");
  const response = await http.post(url, payload);
  return response.data;
}

/**
 * Update a post (full replacement)
 * @param {number} id - Post ID
 * @param {Object} payload - New post data
 * @returns {Promise<Object>} Updated post
 */
export async function updatePostPut(id, payload) {
  const url = buildUrl(BASE, `/posts/${id}`);
  const response = await http.put(url, payload);
  return response.data;
}

/**
 * Partially update a post
 * @param {number} id - Post ID
 * @param {Object} payload - Partial post data
 * @returns {Promise<Object>} Updated post
 */
export async function updatePostPatch(id, payload) {
  const url = buildUrl(BASE, `/posts/${id}`);
  const response = await http.patch(url, payload);
  return response.data;
}

/**
 * Delete a post
 * @param {number} id - Post ID
 * @returns {Promise<Object>} Deleted post confirmation
 */
export async function deletePost(id) {
  const url = buildUrl(BASE, `/posts/${id}`);
  const response = await http.del(url);
  return response.data;
}

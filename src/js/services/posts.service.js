import * as postsApi from "../api/posts.api.js";
import { mapPostsError } from "../utils/error-mapper.js";

function normalizePost(post) {
  if (!post || typeof post !== "object") return post;
  return {
    id: post.id ?? null,
    userId: post.userId ?? null,
    title: post.title ?? "",
    body: post.body ?? "",
    ...post,
  };
}

function normalizePosts(data) {
  if (Array.isArray(data)) return data.map(normalizePost);
  return normalizePost(data);
}

function normalizeComment(comment) {
  if (!comment || typeof comment !== "object") return comment;
  return {
    id: comment.id ?? null,
    postId: comment.postId ?? null,
    name: comment.name ?? "",
    email: comment.email ?? "",
    body: comment.body ?? "",
    ...comment,
  };
}

function normalizeComments(data) {
  if (Array.isArray(data)) return data.map(normalizeComment);
  return normalizeComment(data);
}

export async function getAllPosts() {
  try {
    const data = await postsApi.fetchAllPosts();
    return normalizePosts(data);
  } catch (error) {
    throw mapPostsError(error);
  }
}

export async function getPostById(id) {
  try {
    const data = await postsApi.fetchPostById(id);
    return normalizePosts(data);
  } catch (error) {
    throw mapPostsError(error);
  }
}

export async function getPostComments(id) {
  try {
    const data = await postsApi.fetchPostComments(id);
    return normalizeComments(data);
  } catch (error) {
    throw mapPostsError(error);
  }
}

export async function createPost(payload) {
  try {
    const data = await postsApi.createPost(payload);
    return normalizePosts(data);
  } catch (error) {
    throw mapPostsError(error);
  }
}

export async function updatePostPut(id, payload) {
  try {
    const data = await postsApi.updatePostPut(id, payload);
    return normalizePosts(data);
  } catch (error) {
    throw mapPostsError(error);
  }
}

export async function updatePostPatch(id, payload) {
  try {
    const data = await postsApi.updatePostPatch(id, payload);
    return normalizePosts(data);
  } catch (error) {
    throw mapPostsError(error);
  }
}

export async function deletePost(id) {
  try {
    const data = await postsApi.deletePost(id);
    return normalizePosts(data);
  } catch (error) {
    throw mapPostsError(error);
  }
}

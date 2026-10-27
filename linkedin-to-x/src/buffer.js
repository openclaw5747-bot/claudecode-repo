// Minimal Buffer GraphQL client. Docs: https://developers.buffer.com/

const ENDPOINT = "https://api.buffer.com";

const CREATE_POST = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess { post { id status dueAt } }
      ... on MutationError { message }
    }
  }`;

export async function gql(env, query, variables) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.BUFFER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors) {
    throw new Error(`Buffer → ${res.status}: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.data;
}

// Adds a post (or thread, if posts has several items) to the X channel's queue.
// If Buffer refuses to queue it (e.g. the free plan's queue is full), saves it
// as a Buffer draft instead so it isn't lost.
export async function queueXPost(env, posts, { draft = false } = {}) {
  const input = {
    channelId: env.BUFFER_CHANNEL_ID,
    text: posts[0],
    schedulingType: "automatic",
    mode: env.BUFFER_MODE || "addToQueue",
  };
  if (posts.length > 1) input.metadata = { twitter: { thread: posts.map((text) => ({ text })) } };
  if (draft) input.saveToDraft = true;

  const { createPost } = await gql(env, CREATE_POST, { input });
  if (createPost?.post) return createPost.post;
  if (!draft) {
    console.warn(`Buffer refused to queue (${createPost?.message}); saving as draft`);
    return queueXPost(env, posts, { draft: true });
  }
  throw new Error(`Buffer createPost failed: ${createPost?.message ?? "unknown error"}`);
}

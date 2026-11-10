import axios from "axios";

// Single axios instance for every call to our Next.js route handlers.
export const api = axios.create({ baseURL: "/api" });

// Surface the route's { error } message instead of axios' generic "Request failed with status code 4xx".
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(new Error(err?.response?.data?.error ?? err.message)),
);

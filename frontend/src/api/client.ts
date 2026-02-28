import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4020";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});


apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ??
      err.message ??
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
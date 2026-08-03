import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

// A global variable to store the access token in memory
let accessToken = null;

export const setAccessToken = (token) => {
    accessToken = token;
};

export const getAccessToken = () => {
    return accessToken;
};

// Request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401s and refresh
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh the token using the httpOnly cookie
                const { data } = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api'}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                setAccessToken(data.token);

                originalRequest.headers.Authorization = `Bearer ${data.token}`;
                return api(originalRequest);
            } catch (err) {
                // If refresh fails, user is fully logged out. Handle context clearing in AuthProvider.
                // We throw the error so the caller knows it failed.
                setAccessToken(null);
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;

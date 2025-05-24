import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 1. Create an Axios instance with default configuration
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Request Interceptor: Dynamically add Authorization header
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Handle request setup errors (e.g., invalid config)
        console.error('Axios Request Interceptor Error:', error);
        return Promise.reject(error);
    }
);

// 3. Response Interceptor: Handle responses and errors globally
apiClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        let errorMessage = 'An unknown network error occurred.';

        if (error.response) {
            const { data, status } = error.response;
            console.error(`API Error ${status}:`, data);

            if (data && typeof data === 'object' && data.message) {
                errorMessage = data.message;
            } else if (typeof data === 'string' && data.length > 0) {
                try {
                    // Attempt to parse if server sends JSON error as a string
                    const parsedError = JSON.parse(data);
                    errorMessage = parsedError.message || data;
                } catch (e) {
                    errorMessage = data;
                }
            } else {
                errorMessage = `Server error: ${status}`;
            }
        } else if (error.request) {
            console.error('API No Response:', error.request);
            errorMessage = 'No response from server. Check network connection or CORS policy.';
        } else {
            console.error('API Request Setup Error:', error.message);
            errorMessage = error.message;
        }

        toast.error(`API Error: ${errorMessage}`);

        const customError = new Error(errorMessage);
        customError.originalError = error;
        if (error.response) {
            customError.status = error.response.status;
            customError.data = error.response.data;
        }

        // Important: Reject the promise with the customError so that
        // individual .catch() blocks in calling code can handle it.
        return Promise.reject(customError);
    }
);

// 4. Exported function to make requests
export async function makeApiRequest(url, options = {}) {
    const { method = 'GET', body, params, headers, ...restOfOptions } = options;

    const config = {
        url,
        method,
        headers,
        ...restOfOptions,
    };

    if (body) {
        config.data = body;
    }
    if (params) {
        config.params = params;
    }

    try {
        const responseData = await apiClient.request(config);
        return responseData;
    } catch (error) {
        throw error;
    }
}

export { apiClient };

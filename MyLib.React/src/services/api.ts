import axios from "axios";

const API = axios.create({
    baseURL: '/api',
});

// interceptors run before every request
// It avoids writing Bearer token every api calls
API.interceptors.request.use(config => {
    const token = localStorage.getItem("mylib_token");
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default API;
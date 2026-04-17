import axios from 'axios';

// Create a separate Axios instance for each Microservice
export const iotService = axios.create({ 
    baseURL: 'http://localhost:8000' 
});

export const customerService = axios.create({ 
    baseURL: 'http://localhost:8001' 
});

export const analyticsService = axios.create({ 
    baseURL: 'http://localhost:8002' 
});

export const alertsService = axios.create({ 
    baseURL: 'http://localhost:8003' 
});

export const adminService = axios.create({ 
    baseURL: 'http://localhost:8004' 
});
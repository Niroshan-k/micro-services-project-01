// src/services/api.js
import axios from 'axios';

// 1. Connection to the Customer Microservice
export const customerApi = axios.create({
  baseURL: 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Connection to the Admin Microservice
export const adminApi = axios.create({
  baseURL: 'http://localhost:8004', // Admin Backend
  headers: { 
    'Content-Type': 'application/json' 
  },
});
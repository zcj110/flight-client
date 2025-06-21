import axios from 'axios';

const http = axios.create({
  // baseURL: 'http://localhost:8080/flight-api/api',
  baseURL: 'http://3.25.237.139:8080/flight-api/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Function to set and store the authentication token
export const setAuthToken = (token) => {
  console.log('setAuthToken called with token:', token);
  if (token) {
    localStorage.setItem('jwtToken', token);
    console.log('Token stored in localStorage:', localStorage.getItem('jwtToken'));
    http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Authorization header set:', http.defaults.headers.common['Authorization']);
  } else {
    localStorage.removeItem('jwtToken');
    console.log('Token removed from localStorage.');
    delete http.defaults.headers.common['Authorization'];
  }
};

// Check for token on initial load
const token = localStorage.getItem('jwtToken');
console.log('Initial load - localStorage jwtToken:', token);
if (token) {
  setAuthToken(token);
}

// Request interceptor
http.interceptors.request.use(
  (config) => {
    // No need to add auth token here as it's handled by setAuthToken and initial load
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
http.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle errors here, e.g., redirect to login on 401
    console.error('API Error:', error);
    if (error.response && error.response.status === 401) {
      // Optionally clear token and redirect to login
      setAuthToken(null); 
      // window.location.href = '/login'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export const searchFlights = async (params) => {
  try {
    const searchParams = {
      from: parseInt(params.from),
      to: parseInt(params.to),
      departureDate: params.departureDate,
      returnDate: params.tripType === 'roundtrip' ? params.returnDate : null,
      passengers: params.passengers,
      cabinClass: params.cabinClass,
      page: params.page || 0,
      size: params.size || 10,
      sortBy: params.sortBy || 'price',
      sortOrder: params.sortOrder || 'asc'
    };
    console.log('Search params:', searchParams);
    const response = await http.post('/flights/search', searchParams);
    console.log('Search response:', response);
    return response;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

export const getAirports = async () => {
  try {
    const response = await http.get('/flights/airports');
    return response;
  } catch (error) {
    throw error;
  }
};

// New login function
export const login = async (email, password) => {
  try {
    const response = await http.post('/auth/login', { email, password });
    // The backend directly returns the token string as response.data
    if (response.data) {
      setAuthToken(response.data);
    }
    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// New logout function
export const logout = () => {
  setAuthToken(null);
};

// New function to check if the user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('jwtToken');
};

// Register function
export const register = async (userData) => {
  try {
    const response = await http.post('/auth/register', userData);
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export default http;

import axios from 'axios';

const monitoringApi = axios.create({
  baseURL: 'http://localhost:4000/api/monitor',
});

export default monitoringApi; 
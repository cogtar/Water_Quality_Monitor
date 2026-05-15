import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Auth
export const registerUser = (data) => api.post('/users/register', data).then(r => r.data)
export const loginUser    = (data) => api.post('/users/login', data).then(r => r.data)

// Lines
export const getLines = () => api.get('/lines').then(r => r.data)
export const createLine = (data) => api.post('/lines', data).then(r => r.data)
export const updateLine = (id, data) => api.put(`/lines/${id}`, data).then(r => r.data)
export const deleteLine = (id) => api.delete(`/lines/${id}`)

// Sensors
export const getSensors = (lineId) =>
  api.get('/sensors', { params: lineId ? { lineId } : {} }).then(r => r.data)
export const createSensor = (data) => api.post('/sensors', data).then(r => r.data)
export const updateSensor = (id, data) => api.put(`/sensors/${id}`, data).then(r => r.data)
export const deleteSensor = (id) => api.delete(`/sensors/${id}`)

// Readings
export const getReadings = (lineId, limit = 50) =>
  api.get('/readings', { params: { lineId, limit } }).then(r => r.data)
export const createReading = (data) => api.post('/readings', data).then(r => r.data)
export const getSensorDrift = () => api.get('/readings/sensor-drift').then(r => r.data)

// Thresholds
export const getThresholds = (lineId) =>
  api.get('/thresholds', { params: lineId ? { lineId } : {} }).then(r => r.data)
export const createThreshold = (data) => api.post('/thresholds', data).then(r => r.data)
export const updateThreshold = (id, data) => api.put(`/thresholds/${id}`, data).then(r => r.data)
export const deleteThreshold = (id) => api.delete(`/thresholds/${id}`)

// Incidents
export const getIncidents = (params = {}) =>
  api.get('/incidents', { params }).then(r => r.data)
export const createIncident = (data) => api.post('/incidents', data).then(r => r.data)
export const resolveIncident = (id, resolvedStatus) =>
  api.patch(`/incidents/${id}/resolve`, { resolvedStatus }).then(r => r.data)
export const deleteIncident = (id) => api.delete(`/incidents/${id}`)

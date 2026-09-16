export function extractErrorMessage(err) {
  if (!err.response) {
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return 'Cannot reach the server. Make sure the backend is running on http://localhost:8000';
    }
    return err.message || 'Something went wrong';
  }

  const detail = err.response?.data?.detail;

  if (!detail) {
    return err.response?.data?.message || err.message || 'Something went wrong';
  }

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || item.message || String(item)).join(', ');
  }

  return String(detail);
}

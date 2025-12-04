export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // PostgreSQL errors
  if (err.code === '23505') { // unique_violation
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      message: err.detail || err.message,
    });
  }
  
  if (err.code === '42P01') { // undefined_table
    return res.status(500).json({
      success: false,
      error: 'Database table not found',
      message: 'Please run database migrations',
    });
  }
  
  if (err.code === '23503') { // foreign_key_violation
    return res.status(400).json({
      success: false,
      error: 'Invalid reference',
      message: 'Referenced record does not exist',
    });
  }
  
  if (err.code === '22P02') { // invalid_text_representation
    return res.status(400).json({
      success: false,
      error: 'Invalid data format',
      message: err.message,
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

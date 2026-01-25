/**
 * Pagination Helper
 * Creates standardized pagination metadata
 */
exports.paginate = (page = 1, limit = 10, total) => {
  const currentPage = parseInt(page);
  const perPage = parseInt(limit);
  const totalPages = Math.ceil(total / perPage);
  
  return {
    currentPage,
    perPage,
    total,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

/**
 * API Response Helper
 * Standardizes API response format
 */
exports.successResponse = (data, message = 'Success', metadata = {}) => {
  return {
    success: true,
    message,
    data,
    ...metadata
  };
};

exports.errorResponse = (message = 'Error occurred', statusCode = 500) => {
  return {
    success: false,
    message,
    statusCode
  };
};

/**
 * Query Builder Helper
 * Builds MongoDB query from request parameters
 */
exports.buildQuery = (queryParams) => {
  const query = {};
  const options = {
    page: parseInt(queryParams.page) || 1,
    limit: parseInt(queryParams.limit) || 10,
    sort: queryParams.sort || '-createdAt'
  };
  
  // Remove pagination params from query
  const excludedFields = ['page', 'limit', 'sort', 'fields'];
  const filterParams = { ...queryParams };
  excludedFields.forEach(field => delete filterParams[field]);
  
  // Build query
  Object.keys(filterParams).forEach(key => {
    // Handle range queries (e.g., salary[gte]=50000)
    if (typeof filterParams[key] === 'object') {
      query[key] = filterParams[key];
    } else {
      query[key] = filterParams[key];
    }
  });
  
  return { query, options };
};

/**
 * Async Handler
 * Wraps async route handlers to catch errors
 */
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

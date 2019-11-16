/** This class builds Mongoose query */
class APIFeatures {
  /**
   * @param {object} query        Mongoose query object
   * @param {object} queryString  req.query object
   */
  constructor(query, queryString) {
    this.query = query; // Mongoose Query obj
    this.queryString = queryString; // req.query obj
  }

  /**
   * QUERY BUILDING - FILTERING
   * This method convert this.queryString to Mongoose filter query object
   * then chains the .find method on the Mongoose query object (this.query)
   * and returns that instance
   * @return {object} the instance of this class
   */
  filter() {
    // Select filters
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(field => delete queryObj[field]);

    // Update MongoDB operator (eg. $gte, $gt, $lte, $lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`); // replace 'gte' to '$gte' for MongoDB oeprator

    // Chain the .find() method
    this.query = this.query.find(JSON.parse(queryStr));

    // return instance of the class
    return this;
  }

  /**
   * QUERY BUILDING - SORTING
   * This method convert this.queryString.sort to Mongoose sort string
   * e.g. "?sort=price,-name" in the query --> query.sort("price -name")
   * then chains the .sort method on the Mongoose query object (this.query)
   * and returns that instance
   * @return {object} the instance of this class
   */
  sort() {
    // e.g. "?sort=price,-name" in the query --> query.sort("price -name")
    const sortBy = this.queryString.sort
      ? this.queryString.sort.split(',').join(' ')
      : '-createdAt';

    this.query = this.query.sort(sortBy);

    return this;
  }

  /**
   * QUERY BUILDING - FIELD LIMITING
   * This method convert this.queryString.fields to Mongoose sort string
   * e.g. "?fields=name,price,rating" in the query --> query.select("name price rating")
   * then chains the .select method on the Mongoose query object (this.query)
   * and returns that instance
   * @return {object} the instance of this class
   */
  selectFields() {
    const fields = this.queryString.fields
      ? this.queryString.fields.split(',').join(' ')
      : '-__v';

    this.query = this.query.select(fields);

    return this;
  }

  /**
   * QUERY BUILDING - PAGINATION
   * @return {object} the instance of this class
   */
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;

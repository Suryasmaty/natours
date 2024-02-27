const fs = require('fs');
const Tour = require('./../model/tourModel');
const ApiFeatures = require('./../utils/apiFeatures');
//const tours = JSON.parse(fs.readFileSync('./dev-data/data/tours-simple.json'));

// exports.checkID = (req, res, next, val) => {
//   if (val * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Incorrect ID',
//     });
//   }
//   next();
// };

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(404).json({
      status: 'fail',
      message: 'Required fileds Missing',
    });
  }
  next();
};

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '2';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,summary,ratingsAverage,difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    console.log(req.query);
    //const tour = await Tour.find({ durations: 5, difficulty: 'Easy' });
    //--------------------------------------------------------------------------------------------------------------
    //1A)-----------Filtering----------------
    // const queryObj = { ...req.query };
    // const excludeFields = ['page', 'limit', 'sort', 'fields'];
    // excludeFields.forEach((el) => delete queryObj[el]);

    //1B)------Advanced Filtering--------------

    //--{ durations: { gte: '5' }, difficulty: 'Easy' }
    //--{ durations: { $gte: '5' }, difficulty: 'Easy' }
    // --gt, gte, lt, lte
    // let queryString = JSON.stringify(queryObj);

    // queryString = queryString.replace(
    //   /\b(gte|gt|lte|lt)\b/g,
    //   (match) => `$${match}`
    // );

    // console.log(req.query, queryString);
    //--http://localhost:9000/api/v1/tours?durations[gte]=5&difficulty=Easy
    //--{ durations: { gte: '5' }, difficulty: 'Easy' }
    //--{"durations":{"$gte":"5"},"difficulty":"Easy"}
    //let query = Tour.find(JSON.parse(queryString));

    /*
    const query = Tour.find()
      .where('durations')
      .equals(5)
      .where('difficulty')
      .equalas('Easy');
    */
    //------------------------------------------------------------------------------------------------------
    //2)------------SORTING-----------
    //--console.log(query.length);
    //--http://localhost:9000/api/v1/tours?sort=price
    // console.log('final', req.query.sort);
    // if (req.query.sort) {
    //   const sort = req.query.sort.split(',').join(' ');
    //   query = query.sort(sort);
    // }
    //-----------------------------------------------------------------------------------------------------------
    //3)--------FIELD LIMITING-----------
    //--http://localhost:9000/api/v1/tours?fields=name,durations,price,difficulty
    // if (req.query.fields) {
    //   const fields = req.query.fields.split(',').join(' ');
    //   //query=query.select('name durations price');
    //   query = query.select(fields);
    // }
    //----------------------------------------------------------------------------------------------------------------
    //4)-----------PAGINATION--------------------------
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit;
    // query = query.skip(skip).limit(limit);

    // const numTours = await Tour.countDocuments();
    // if (skip > numTours) {
    //   throw new Error('This page doesnot exists');
    // }

    const features = new ApiFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limiting()
      .pagination();

    const tour = await features.query.exec();

    res.status(200).json({
      status: 'Success',
      data: {
        tourLength: tour.length,
        tourData: tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed ',
      message: err,
    });
  }
};

//aggregation piperline matching and grouping
exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: '$difficulty',
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);
    // Send the statistics as a response
    res.status(200).json({
      status: 'Success',
      data: {
        stats,
      },
    });
  } catch (err) {
    // Handle errors and send an error response
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  const year = req.params.year * 1;
  try {
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTours: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);
    res.status(200).json({
      status: 'Success',
      data: {
        plan,
      },
    });
  } catch (err) {
    // Handle errors and send an error response
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};

exports.getTourById = async (req, res) => {
  //console.log(req.params);
  //const id = req.params.id * 1;
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'Success',
      data: {
        tourData: tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed at',
      message: err,
    });
  }
};

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

exports.createTour = catchAsync(async (req, res) => {
  //fist way
  //const newTour = new Tour({});
  //newTour.save();

  //second way
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });

  // try {
  //   const newTour = await Tour.create(req.body);

  //   res.status(201).json({
  //     status: 'success',
  //     data: {
  //       tour: newTour,
  //     },
  //   });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'failed',
  //   });
  // }
});

exports.updateTour = async (req, res) => {
  try {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: updatedTour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
    });
  }
};

exports.deleteTour = async (req, res) => {
  //const id = req.params.id * 1;
  try {
    const deletedTour = await Tour.findByIdAndDelete(req.params.id, {
      name: 'kakinda tour',
    });

    res.status(201).json({
      status: 'success',
      data: {
        tour: deletedTour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
    });
  }
};

//-------------------------------------PREVIOUS CODE-----------------------
/*

const fs = require('fs');
const tours = JSON.parse(fs.readFileSync('./dev-data/data/tours-simple.json'));

exports.checkID = (req, res, next, val) => {
  if (val * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Incorrect ID',
    });
  }
  next();
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(404).json({
      status: 'fail',
      message: 'Required fileds Missing',
    });
  }
  next();
};

exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
};

exports.getTourById = (req, res) => {
  console.log(req.params);
  const id = req.params.id * 1;
  //if (id > tours.length)

  const tour = tours.find((el) => el.id === id);
  if (!tour) {
    res.status(404).json({
      status: 'failed',
      message: 'Invalid id',
    });
  }
  res.status(200).json({
    status: 'success',
    //results: tours.length,
    data: {
      tour,
    },
  });
};

exports.createTour = (req, res) => {
  console.log(req.body);
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);
  tours.push(newTour);
  fs.writeFile(
    './dev-data/data/tours-simple.json',
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: { tours },
      });
    }
  );
  // res.send('done');
};

exports.updateTour = (req, res) => {
  const id = req.params.id * 1;

  // Find the index of the tour with the specified ID
  const tourIndex = tours.findIndex((el) => el.id === id);

  // If the tour is not found, return a 404 response
  if (tourIndex === -1) {
    return res.status(404).json({
      status: 'failed',
      message: 'Tour not found',
    });
  }

  // Update the duration property if it exists in the request body
  if (req.body.duration) {
    tours[tourIndex].duration = req.body.duration;
  }

  // Save the updated data back to the file or database
  fs.writeFile(
    './dev-data/data/tours-simple.json',
    JSON.stringify(tours),
    (err) => {
      if (err) {
        return res.status(500).json({
          status: 'error',
          message: 'Internal server error',
        });
      }

      // Respond with the updated tour
      res.status(200).json({
        status: 'success',
        data: {
          tour: tours[tourIndex],
        },
      });
    }
  );
};

/*
// Remove the tour from the tours array
const deletedTour = tours.splice(tourIndex, 1)[0];

// Save the updated data back to the file or database
fs.writeFile(
  './dev-data/data/tours-simple.json',
  JSON.stringify(tours),
  (err) => {
    if (err) {
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }

    // Respond with the deleted tour
    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);
*/
/*
exports.deleteTour = (req, res) => {
  const id = req.params.id * 1;

  // Find the index of the tour with the specified ID
  const tourIndex = tours.findIndex((el) => el.id === id);

  // If the tour is not found, return a 404 response
  if (tourIndex === -1) {
    return res.status(404).json({
      status: 'failed',
      message: 'Tour not found',
    });
  }
};
*/

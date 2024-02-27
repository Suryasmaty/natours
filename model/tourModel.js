//const User = require('./userModel');
const mongoose = require('mongoose');
const slugify = require('slugify');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have price'],
    },
    description: {
      type: String,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have price'],
    },
    priceDiscount: Number,
    imageCover: {
      type: String,
      required: [true, 'A tour must have price'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, //to hide this data from users
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },

    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],

    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    /*//child referencing-s=we are using virtuals here to populate reviews of a tour
    reviews: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Review',
      },
    ],
    */
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
//virtual properties are not part of database
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOCUMENT MIDDLEWARE -runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
/*

tourSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
});
*/
//QUERY MIDDLEWARE-this keyword points to current query
//tourSchema.pre('find', function (next) {
//whenever a find method is performed on model, we get documents where secret tour not equal to true
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  const start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  }); //.populate('reviews');

  next();
});
/*
tourSchema.pre('save', async function (next) {
  const guides = this.guides.map(async (id) => await User.findById(id));
  console.log(await guides);
  this.guides = await Promise.all(guides);
  next();
});
*/
tourSchema.post(/^find/, function (docs, next) {
  //passing docs is important
  console.log(`query took ${Date.now() - this.start} milliseconds`);
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
/*
const testTour = new Tour({
  name: 'The Stranger Things',
  rating: 4.5,
  price: 300,
});

testTour
  .save()
  .then((doc) => {
    console.log(doc);
  })
  .catch((err) => {
    console.log('ERROR: ', err);
  });
*/

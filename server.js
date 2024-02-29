const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const mongoose = require('mongoose');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    //console.log(con.connections);
    console.log('DB connection successful');
  })
  .catch((err) => console.log(err));

const app = require('./app');
//console.log(process.env);
const port = process.env.PORT || 9000;
app.listen(port, () => console.log(`started....on ${port}`));

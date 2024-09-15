const mongoose = require("mongoose");
const config = require("./config/config");

const connDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URL, { dbName: config.DB_NAME });
    console.log(`DB Conectada...!!!`);
  } catch (error) {
    console.log(`Error al conectar a DB: ${error.message}`);
  }
};

module.exports = connDB;

const mongoose = require("mongoose");

const connectionString = process.env.CONNECTION_STRING;

try {
  mongoose
    .connect(connectionString)
    .then(() => console.log(`DB connected for hackatweet`))
    .catch((err) =>
      console.error(
        `Une erreur s'est produite en tentant la connection à la DB: ${err}`
      )
    );
} catch (err) {
  console.error(
    `Une erreur s'est produite avant la connection à la DB: ${err}`
  );
}

import express, { response } from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Client({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: 5432,
  database: process.env.DB_NAME,
  host: "localhost",
});

db.connect()
  .then(() => {
    console.log("Veritabanına baglandı.");
  })
  .catch(() => {
    console.log("Bir sorun olustu !");
  });

function creationDate() {
  return new Date().toISOString(); // ISO formatında bir timestamp döner
}

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  try {
    const today_todo = await db.query(
      "select * from todos WHERE category = $1 ORDER BY created_at ASC",
      ["today"]
    );

    const week_todo = await db.query(
      "select * from todos WHERE category = $1 ORDER BY created_at ASC",
      ["week"]
    );

    const month_todo = await db.query(
      "select * from todos WHERE category = $1 ORDER BY created_at ASC",
      ["month"]
    );

    res.render("index.ejs", {
      todayList: today_todo.rows,
      weekList: week_todo.rows,
      monthList: month_todo.rows,
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/add/:type", async (req, res) => {
  const { newItem } = req.body;
  let { type } = req.params;
  type = type.slice(1);

  if (newItem) {
    try {
      const timeStamp = creationDate();
      await db.query(
        "INSERT INTO todos (title, category, created_at) VALUES ($1, $2, $3)",
        [newItem, type, timeStamp]
      );
    } catch (error) {
      console.log(error);
    }
  }
  res.redirect("/");
});

app.post("/edit/:type", async (req, res) => {
  const { updatedItemId, updatedItemTitle } = req.body;
  let { type } = req.params;
  type = type.slice(1);
  try {
    await db.query(
      "UPDATE todos SET title = $1 WHERE category = $2 AND id = $3",
      [updatedItemTitle, type, updatedItemId]
    );
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.post("/delete/:type", async (req, res) => {
  const { deleteItemId } = req.body;
  let { type } = req.params;
  type = type.slice(1);
  try {
    await db.query("DELETE FROM todos WHERE id=$1 AND category = $2", [
      deleteItemId,
      type,
    ]);
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});

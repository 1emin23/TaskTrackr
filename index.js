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

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  try {
    const response = await db.query("select * from items ORDER BY id ASC");
    const items = response.rows;
    res.render("index.ejs", {
      listTitle: "Today",
      listItems: items,
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/add", async (req, res) => {
  const { newItem } = req.body;
  if (newItem) {
    try {
      await db.query("INSERT INTO items (title) VALUES ($1)", [newItem]);
    } catch (error) {
      console.log(error);
    }
  }
  res.redirect("/");
});

app.post("/edit", async (req, res) => {
  const { updatedItemId, updatedItemTitle } = req.body;
  try {
    await db.query("UPDATE items SET title = $1 WHERE id = $2", [
      updatedItemTitle,
      updatedItemId,
    ]);
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.post("/delete", async (req, res) => {
  const { deleteItemId } = req.body;
  try {
    await db.query("DELETE FROM items WHERE id=$1", [deleteItemId]);
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

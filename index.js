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
let currentUserID = 1;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  const response = await db.query("SELECT * FROM users");
  const users = response.rows;
  let query =
    "select * from todos WHERE category = $1 AND user_id = $2 ORDER BY created_at ASC";
  try {
    const today_todo = await db.query(query, ["today", currentUserID]);
    const week_todo = await db.query(query, ["week", currentUserID]);
    const month_todo = await db.query(query, ["month", currentUserID]);

    const currentUserColor = users.find(
      (user) => user.id == currentUserID
    ).color;

    res.render("index.ejs", {
      currentUserColor,
      todayList: today_todo.rows,
      weekList: week_todo.rows,
      monthList: month_todo.rows,
      users: users,
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
      console.log("timeStamp: ", timeStamp);
      await db.query(
        "INSERT INTO todos (title, category, created_at, user_id) VALUES ($1, $2, $3, $4)",
        [newItem, type, timeStamp, currentUserID]
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

app.get("/addUser", (req, res) => {
  res.render("components/addMember.ejs");
});

app.post("/addUser", (req, res) => {
  console.log("addUser route");
  let { user, addNew } = req.body;
  // Yeni bir kullanıcı eklemek istiyor aksi takdirde sadece currentUserID'yi degistirmek istiyor
  if (addNew) {
    return res.render("components/addMember.ejs");
  }
  if (!user || isNaN(user)) {
    return res.status(400).send("Invalid user ID");
  }
  currentUserID = Number(user);
  return res.redirect("/");
});

app.post("/login", async (req, res) => {
  const { username, color } = req.body;
  const response = await db.query(
    "INSERT INTO users (username, color) VALUES ($1, $2) RETURNING id",
    [username, color]
  );
  currentUserID = response.rows[0].id;
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});

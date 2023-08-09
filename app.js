const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use((req, res, next) => {
  if (req.originalUrl === "/favicon.ico") {
    return res.sendStatus(204);
  }
  next();
});

mongoose.connect("mongodb://0.0.0.0:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todoList",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find()
    .then((result) => {
      if (result.length === 0) {
        Item.insertMany(defaultItems)
          .then((res) => {
            console.log(res);
          })
          .catch((err) => {
            console.error(err);
          });
      } else {
        res.render("list", { listTitle: "Today", newListItems: result });
      }
    })
    .catch((err) => {
      console.error(err);
    });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName })
    .then((result) => {
      console.log(result);
      if (!result) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: result.name,
          newListItems: result.items,
        });
      }
    })
    .catch((err) => {
      console.error(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.error(err);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then((result) => {
        if (result) {
          console.log(result);
        } else {
          console.log("Item not found.");
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        res.redirect("/");
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then((result) => {
        console.log(result);
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.error(err);
      });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

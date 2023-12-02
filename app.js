//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");


// mongoose.connect("mongodb://localhost:27017/todolistDB", { family: 4 }).then(() => console.log("Database Connection succeed"));

mongoose.connect(process.env.MONGO_CONNECTION_STRING, { family: 4 }).then(() => console.log("Database Connection succeed"));

const itemsSchema = {
    name: String,

};
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({ name: "Welcome to your todolist" });
const item2 = new Item({ name: "Hit the + button to aff a new item." });

const item3 = new Item({ name: "<--hit this to delete an item" });


const defaultItems = [item1, item2, item3];
const listSchema = {
    name: String,
    items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));


// app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static("public"));
app.get("/", function (req, res) {

    Item.find({}).then(function (item) {

        if (item.length == 0) {
            Item.insertMany(defaultItems).then(() => console.log("Insert many triggered"));
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newListItems: item });
        }
    });


});

app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName,
    });

    if (listName === 'Today') {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }).then(function (foundList) {

            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }


})

app.get("/:customListName", function (req, res) {

    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName }).then(function (foundList) {
        if (!foundList) {

            const list = new List({
                name: customListName,
                items: defaultItems,
            });
            list.save();
            res.redirect("/" + customListName);

        } else {

            res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
        }
    });

});



app.get("/about", function (req, res) {
    res.render("about");
});

app.post("/delete", function (req, res) {

    const checkItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndDelete(checkItemId).then(function (result) { console.log(result.name); res.redirect("/"); });
    }
    else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkItemId } } }).then(() =>
            res.redirect("/" + listName)
        );
    }



});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.listen(port, function () {
    console.log("Server started on port 3000");
});

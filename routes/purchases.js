const express = require("express");
const db = require("../database");

const router = express.Router();

router.get("/:user_id", (req, res) => {
  db("purchases")
    .where({ user_id: req.params.user_id })
    .then(results => {
      if (results.length === 0) {
        return res.status(500).json({ message: "User or purchases not found" });
      } else {
        res.json(results);
      }
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
});

router.get("/:user_id/:year/:month/:day", (req, res) => {
  let date = new Date(
    `${req.params.year}-${req.params.month}-${req.params.day}`
  ).toISOString();
  db("purchases")
    .where({ user_id: req.params.user_id })
    .andWhere("created_at", "<", date)
    .then(results => {
      if (results.length === 0) {
        return res.status(500).json({ message: "User or purchases not found" });
      } else {
        res.json(results);
      }
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
});

router.post("/:user_id/:product_id", (req, res) => {
  // verify sufficient inventory in the db
  db("products")
    .where({ id: req.params.product_id })
    .then(results => {
      if (results[0].inventory < 1) {
        return res.status(500).json({ message: "Insufficient inventory" });
      }
    });
  // transaction
  db.transaction(trans => {
    return db("purchases")
      .transacting(trans)
      .insert({
        user_id: req.params.user_id,
        products_id: req.params.product_id
      })
      .then(() => {
        let date = new Date().toISOString();
        return db("products")
          .where({ id: req.params.product_id })
          .decrement("inventory", 1)
          .update({ updated_at: date }, "*");
      })
      .then(trans.commit)
      .catch(err => {
        trans.rollback();
        // verify the user_id exists in the db
        if (err.message.includes("purchases_user_id_foreign")) {
          return res.status(500).json({ message: "User not found" });
        }
        // verify the product_id exists in the db
        if (err.message.includes("purchases_products_id_foreign")) {
          return res.status(500).json({ message: "Product not found" });
        }
        return res.status(500).json({ message: err.message });
      });
  })
    .then(() => {
      res.json({
        message: "Purchase successful"
      });
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
});

router.delete("/:user_id/:product_id", (req, res) => {
  // verify the purchase exists in the db
  db("purchases")
    .where({ user_id: req.params.user_id, products_id: req.params.product_id })
    .then(results => {
      if (results.length === 0) {
        return res.status(500).json({ message: "Purchase not found" });
      }
    });
  // transaction
  db.transaction(trans => {
    return (
      db("purchases")
        .where({
          user_id: req.params.user_id,
          products_id: req.params.product_id
        })
        .transacting(trans)
        // .limit(1)
        // limit does not work, must delete all matching records
        .del()
        .returning("*")
        .then(results => {
          let addBack = results.length;
          let date = new Date().toISOString();
          return db("products")
            .where({ id: req.params.product_id })
            .increment("inventory", addBack)
            .update({ updated_at: date });
        })
        .then(trans.commit)
        .catch(err => {
          trans.rollback();
          return res.status(500).json({ message: err.message });
        })
    );
  })
    .then(() => {
      res.json({ message: "Purchases deleted" });
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
});

module.exports = router;

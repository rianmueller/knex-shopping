const express = require("express");
const db = require("../database");

const router = express.Router();

router.get("/:product_id", (req, res) => {
  let pid = req.params.product_id;
  if (isNaN(parseFloat(pid)) || !isFinite(pid) || pid.includes(".")) {
    return res.status(500).json({ message: "ID is not an integer" });
  }
  db("products")
    .where({ id: req.params.product_id })
    .then(results => {
      if (results.length === 0) {
        return res.status(500).json({ message: "Product not found" });
      } else {
        res.json(results[0]);
      }
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
});

router.get("/", (req, res) => {
  db("products")
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
});

router.post("/new", (req, res) => {
  if (
    !req.body.title ||
    !req.body.description ||
    !req.body.inventory ||
    !req.body.price
  ) {
    return res.status(500).json({ message: "Must POST all product fields" });
  }
  let inv = req.body.inventory;
  if (isNaN(parseFloat(inv)) || !isFinite(inv) || inv.includes(".")) {
    return res.status(500).json({ message: "Inventory is not an integer" });
  }
  if (isNaN(parseFloat(req.body.price)) || !isFinite(req.body.price)) {
    return res.status(500).json({ message: "Price is not a number" });
  }
  db("products")
    .insert(
      {
        title: req.body.title,
        description: req.body.description,
        inventory: parseFloat(req.body.inventory),
        price: parseFloat(req.body.price)
      },
      "*"
    )
    .then(results => {
      res.json(results[0]);
    })
    .catch(err => {
      if (err.message.includes("violates unique constraint")) {
        return res.status(500).json({ message: "Product already exists" });
      }
      res.status(500).json({ message: err.message });
    });
});

router.put("/:product_id", (req, res) => {
  let pid = req.params.product_id;
  if (isNaN(parseFloat(pid)) || !isFinite(pid) || pid.includes(".")) {
    return res.status(500).json({ message: "ID is not an integer" });
  }
  if (
    !req.body.title &&
    !req.body.description &&
    !req.body.inventory &&
    !req.body.price
  ) {
    return res
      .status(500)
      .json({ message: "Must PUT at least one product field" });
  }
  let date = new Date().toISOString();
  db("products")
    .where({ id: req.params.product_id })
    .update(
      {
        title: req.body.title,
        description: req.body.description,
        inventory: req.body.inventory,
        price: req.body.price,
        updated_at: date
      },
      "*"
    )
    .then(results => {
      // db does not throw an error on invalid product_id values like 0 or 9999, returns an empty array instead
      if (!results[0]) {
        return res.status(500).json({ message: "Error: product not updated" });
      } else {
        res.json({
          message: `Product: ${results[0].id} has been updated`
        });
      }
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
});

router.delete("/:product_id", (req, res) => {
  let pid = req.params.product_id;
  if (isNaN(parseFloat(pid)) || !isFinite(pid) || pid.includes(".")) {
    return res.status(500).json({ message: "ID is not an integer" });
  }
  db("products")
    .where({ id: req.params.product_id }, "*")
    .del()
    .returning("*")
    .then(results => {
      if (!results[0]) {
        // db does not throw an error but returns an empty array on invalid user_id values like 0 or 9999
        return res.status(500).json({ message: "Product ID not found" });
      } else {
        res.json({
          message: `Product id: ${results[0].id} successfully deleted`
        });
      }
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
});

module.exports = router;

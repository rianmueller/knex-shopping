const express = require("express");
const db = require("../database");

const router = express.Router();

router.get("/:user_id", (req, res) => {
  let uid = req.params.user_id;
  if (isNaN(parseFloat(uid)) || !isFinite(uid) || uid.includes(".")) {
    return res.status(500).json({ message: "ID is not an integer" });
  }
  db("users")
    .where("id", req.params.user_id)
    .then(results => {
      if (results.length === 0) {
        return res.status(500).json({ message: "User not found" });
      } else {
        res.json(results[0]);
      }
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
});

router.get("/", (req, res) => {
  db("users")
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
});

router.post("/login", (req, res) => {
  db("users")
    .where("email", req.body.email)
    .then(results => {
      if (results.length === 0) {
        return res.status(500).json({ message: "User not found" });
      } else if (results[0].password !== req.body.password) {
        return res.status(500).json({ message: "Incorrect password" });
      } else res.json(results[0]);
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
});

router.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(500).json({ message: "Must POST email and password" });
  }
  db("users")
    .insert({ email: req.body.email, password: req.body.password }, "*")
    .then(results => {
      res.json(results[0]);
    })
    .catch(err => {
      if (err.message.includes("violates unique constraint")) {
        return res.status(500).json({ message: "User already exists" });
      }
      res.status(500).json({ message: err.message });
    });
});

router.put("/:user_id/forgot-password", (req, res) => {
  let uid = req.params.user_id;
  if (isNaN(parseFloat(uid)) || !isFinite(uid) || uid.includes(".")) {
    return res.status(500).json({ message: "ID is not an integer" });
  }
  if (!req.body.password) {
    return res.status(500).json({ message: "New password is required" });
  }
  let date = new Date().toISOString();
  db("users")
    .where("id", id)
    .update(
      {
        password: req.body.password,
        updated_at: date
      },
      "*"
    )
    .then(results => {
      // db does not throw an error on invalid user_id values like 0 or 9999, returns an empty array instead
      if (!results[0]) {
        return res.status(500).json({ message: "Error: password not updated" });
      } else {
        res.json({ message: "New password created!" });
      }
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
});

router.delete("/:user_id", (req, res) => {
  let uid = req.params.user_id;
  if (isNaN(parseFloat(uid)) || !isFinite(uid) || uid.includes(".")) {
    return res.status(500).json({ message: "ID is not an integer" });
  }
  db("users")
    .where({ id: req.params.user_id }, "*")
    .del()
    .returning("*")
    .then(results => {
      if (!results[0]) {
        // db does not throw an error but returns an empty array on invalid user_id values like 0 or 9999
        return res.status(500).json({ message: "User ID not found" });
      } else {
        res.json({
          message: `User id: ${results[0].id} successfully deleted`
        });
      }
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
});

module.exports = router;

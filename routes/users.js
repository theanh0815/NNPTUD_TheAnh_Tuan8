var express = require("express");
var router = express.Router();
let { validatedResult, CreateUserValidator, ModifyUserValidator } = require("../utils/validator")
let userModel = require("../schemas/users");
const upload = require('../utils/uploadHandler');
const multer = require('multer');
const uploadExcel = multer({ dest: 'uploads/' });
const xlsx = require('xlsx');
const roleModel = require('../schemas/roles');
const { sendPasswordMail } = require('../utils/mailHandler');
const crypto = require('crypto');
const fs = require('fs');
let userController = require("../controllers/users");
const { checkLogin,checkRole } = require("../utils/authHandler");


router.get("/", checkLogin,checkRole("ADMIN","MODERATOR"), async function (req, res, next) {
  let users = await userModel
    .find({ isDeleted: false })
  res.send(users);
});

router.get("/:id", async function (req, res, next) {
  try {
    let result = await userModel
      .find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post("/", CreateUserValidator, validatedResult, async function (req, res, next) {
  try {
    let newUser = await userController.CreateAnUser(
      req.body.username, req.body.password, req.body.email,
      req.body.role, req.body.fullname, req.body.avatarUrl
    )
    res.send(newUser);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", ModifyUserValidator, validatedResult, async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.post("/import", uploadExcel.single('file'), async function (req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let userRole = await roleModel.findOne({ name: 'user', isDeleted: false });
    if (!userRole) {
      userRole = new roleModel({ name: 'user' });
      await userRole.save();
    }

    const importedUsers = [];
    const errors = [];

    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i];
      const { username, email } = row;

      if (!username || !email) {
        errors.push({ row: i + 2, message: "Missing username or email" });
        continue;
      }

      const randomPassword = crypto.randomBytes(8).toString('hex'); // 16 chars

      try {
        let existingUser = await userController.FindUserByUsername(username);
        if (existingUser) {
           errors.push({ row: i + 2, message: "Username already exists" });
           continue;
        }

        let newUser = await userController.CreateAnUser(
          username,
          randomPassword,
          email,
          userRole._id,
          null,
          "",
          "https://i.sstatic.net/l60Hf.png",
          true,
          0
        );
        
        importedUsers.push(newUser);

        // Send email
        await sendPasswordMail(email, randomPassword);
      } catch (err) {
        errors.push({ row: i + 2, message: err.message });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.send({ 
      message: "Import completed", 
      successCount: importedUsers.length, 
      errors: errors 
    });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).send({ message: err.message });
  }
});

module.exports = router;
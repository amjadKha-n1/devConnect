const bcrypt = require("bcrypt");
const path = require("path");

const express = require("express");
const db = require("../data/database");
const { ObjectId } = require("mongodb");
const router = express.Router();

router.get("/", async function (req, res) {
  res.redirect("/posts");
});

router.get("/posts", async function (req, res) {
  const posts = await db
    .getDb()
    .collection("posts")
    .find({})
    .project({ title: 1, content: 1, author: 1 })
    .toArray();
  res.render("index", { posts: posts });
});

router.get("/signup", function (req, res) {
  res.render("signup");
});

router.post("/signup", async function (req, res) {
  const userInputPassword = req.body.password;

  const hashedPassword = await bcrypt.hash(userInputPassword, 12);

  const newUser = {
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  };

  await db.getDb().collection("users").insertOne(newUser);

  res.redirect("/login");
});

router.get("/login", function (req, res) {
  res.render("login");
});
router.post("/login", async function (req, res) {
  const enteredPassword = req.body.password;
  const enteredEmail = req.body.email;

  const user = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredEmail });

  if (!user) {
    return res.status(404).send("User does not exist!");
  }

  const passwordIsCorrect = await bcrypt.compare(
    enteredPassword,
    user.password
  );

  if (!passwordIsCorrect) {
    return res.status(404).send("Incorrect Password!");
  }
  req.session.user = {
    id: user._id.toString(),
    email: user.email,
  };

  res.redirect("/posts");
});

router.get("/posts/new-post", async function (req, res) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("newPost");
});

router.post("/posts", async function (req, res) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const user = await db
    .getDb()
    .collection("users")
    .findOne({ _id: new ObjectId(req.session.user.id) });

  if (!user) {
    return res.status(404).send("User not found!");
  }
  const postData = {
    title: req.body.title,
    content: req.body.content,
    author: {
      id: user._id,
      name: user.name,
    },
    createdAt: new Date(),
  };

  await db.getDb().collection("posts").insertOne(postData);
  res.redirect("/posts");
});

router.get("/posts/:id", async function (req, res) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const postId = req.params.id;
  const post = await db
    .getDb()
    .collection("posts")
    .findOne({ _id: new ObjectId(postId) });
  const author = await db
    .getDb()
    .collection("users")
    .findOne({ _id: post.author.id });

  res.render("postDetails", { post: post, email: author.email });
});

router.get("/posts/:id/edit", async function (req, res) {
  const postId = req.params.id;

  const post = await db
    .getDb()
    .collection("posts")
    .findOne({ _id: new ObjectId(postId) });

  if (!post) {
    return res.status(404).send("Post Not fount!");
  }
  if (post.author.id.toString() != req.session.user.id) {
    return res.status(404).send("You are not the owner of this post");
  }
  res.render("editPost", { post: post });
});

router.post("/posts/:id/edit", async function (req, res) {
  const postId = req.params.id;
  const post = await db.getDb().collection('posts').findOne({_id: new ObjectId(postId)});
  
  if (!post) {
    return res.status(404).send('Post not found!');
  }
  if (post.author.id.toString() != req.session.user.id) {
    return res.status(404).send("You are not the owner of this post!");
  };
  const editPost = await db
    .getDb()
    .collection("posts")
    .updateOne(
      { _id: new ObjectId(postId) },
      {
        $set: { title: req.body.title, content: req.body.content },
      }
    );
  res.redirect('/posts');
});

router.post('/posts/:id/delete', async function (req, res) {
  const postId = req.params.id;
  const post = await db.getDb().collection('posts').findOne({ _id: new ObjectId(postId) });

  if (!post) {
    return res.status(404).send("Post not found!");
  }

  if (post.author.id.toString() != req.session.user.id) {
    return res.status(404).send('You are not the owner of this post!')
  };

  const deletePost = await db.getDb().collection('posts').deleteOne({ _id: new ObjectId(postId) });

  res.redirect('/posts');
});

router.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      return res.status(500).send('Could not log out. Try Again!');
    }
  });

  res.redirect('/login');
});
module.exports = router;

const jwt = require("jsonwebtoken");

const myMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const secret =
      "9f29c26e8fc764c4e4fc968d3f9d0028517d726e2a9b5ad4d69fda55a4fc0c22";
    console.log(`token: ${token}`);

    jwt.verify(token, secret, (err, decoded) => {
      console.log("err", err);
      if (err) {
        return res.status(403).json({ message: "Forbidden" });
      }
      req.user = decoded;
      next();
    });
  } else {
    res.status(403).json({ message: "Forbidden" });
  }
};

module.exports = myMiddleware;

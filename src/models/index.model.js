// authService/src/models/index.model.js
import sequelize from "../db/index.js";
import AuthUser from "./authuser.model.js";
<<<<<<< HEAD
=======
import Session from "./session.model.js";
>>>>>>> 8505d32c8e5074bc0115ca25ec4ba3e327eb533b

AuthUser.hasMany(Session, { foreignKey: "userId", onDelete: "CASCADE" });
Session.belongsTo(AuthUser, { foreignKey: "userId" });

<<<<<<< HEAD
export { sequelize, AuthUser };
=======
export { sequelize, AuthUser, Session };
>>>>>>> 8505d32c8e5074bc0115ca25ec4ba3e327eb533b

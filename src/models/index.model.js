// authService/src/models/index.model.js
import sequelize from "../db/index.js";
import AuthUser from "./authuser.model.js";

AuthUser.hasMany(Session, { foreignKey: "userId", onDelete: "CASCADE" });
Session.belongsTo(AuthUser, { foreignKey: "userId" });

export { sequelize, AuthUser };

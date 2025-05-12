// authService/src/models/index.model.js
import sequelize from "../db/index.js";
import User from "./user.model.js";
import AuthToken from "./auth-tokens.model.js";

User.hasMany(AuthToken, { foreignKey: "userId", onDelete: "CASCADE" });
AuthToken.belongsTo(User, { foreignKey: "userId" });

export { sequelize, User, AuthToken };

// authService/src/models/user.model.js
import { DataTypes } from "sequelize";
import sequelize from "../db/index.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("company", "vendor", "customer"),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(
        "superadmin",
        "admin",
        "manager",
        "salesman",
        "vendor",
        "customer"
      ),
      allowNull: false,
      validate: {
        isValidRole(value) {
          const validRoles = {
            company: ["superadmin", "admin", "manager", "salesman"],
            vendor: ["vendor"],
            customer: ["customer"],
          };
          if (!validRoles[this.type].includes(value)) {
            throw new Error("Invalid role for user type");
          }
        },
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    indexes: [
      { fields: ["email"], unique: true },
      { fields: ["type", "role"] },
    ],
  }
);

export default User;

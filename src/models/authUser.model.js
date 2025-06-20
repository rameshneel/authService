import { DataTypes, Op } from "sequelize";
import sequelize from "../db/index.js";
import bcrypt from "bcryptjs";

const AuthUser = sequelize.define(
  "AuthUser",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    type: {
      type: DataTypes.ENUM("company", "vendor", "customer"),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("superadmin", "admin", "manager", "salesman"),
      allowNull: true,
    },
    provider: {
      type: DataTypes.ENUM("manual", "google"),
      allowNull: true,
      defaultValue: "manual",
    },
    providerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deviceInfo: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    refreshToken: {
      type: DataTypes.STRING(512),
      allowNull: true,
      unique: true,
    },
  },
  {
    tableName: "auth_users",
    timestamps: true,
    indexes: [
      {
        fields: ["email"],
        unique: true,
      },
      {
        fields: ["provider", "providerId"],
        unique: true,
        where: {
          providerId: { [Op.ne]: null },
        },
      },
    ],
  }
);

AuthUser.beforeCreate(async (user, options) => {
  const salt = await bcrypt.genSalt(10);
  if (user.password == null) return;
  user.password = await bcrypt.hash(user.password, salt);
});

AuthUser.beforeUpdate(async (user, options) => {
  if (user.changed("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

AuthUser.prototype.isValidPassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

export default AuthUser;

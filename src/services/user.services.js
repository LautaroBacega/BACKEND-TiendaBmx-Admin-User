import UserDaoMongoDB from "../daos/mongodb/user.dao.js";

const userDao = new UserDaoMongoDB();

export const getUsers = async () => {
  try {
    return await userDao.getUsers();
  } catch (error) {
    console.error("Error en getUsers:", error);
  }
};
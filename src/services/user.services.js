import UserDaoMongoDB from "../daos/mongodb/user.dao.js";

const userDao = new UserDaoMongoDB();

export const getUsers = async () => {
  try {
    return await userDao.getUsers();
  } catch (error) {
    console.error("Error en getUsers:", error);
  }
};

export const createUser = async (user) => {
  try {
    return await userDao.createUser(user);
  } catch (error) {
    console.error("Error en createUser:", error);
  }
};
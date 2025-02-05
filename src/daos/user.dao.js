import { userModel } from "./models/user.model.js";

class UserDaoMongoDB {
  async getUsers() {
    try {
      return await userModel.find();
    } catch (error) {
      throw new Error("Error al obtener los usuarios: " + error.message);
    }
  }

  async createUser(user) {
    try {
      return await userModel.create(user);
    } catch (error) {
      throw new Error("Error al crear el usuario: " + error.message);
    }
  }

  async getUserByEmail(email) {
    try {
      return await userModel.findOne({ email });
    } catch (error) {
      throw new Error("Error al buscar el usuario por email: " + error.message);
    }
  }
}

export default UserDaoMongoDB;

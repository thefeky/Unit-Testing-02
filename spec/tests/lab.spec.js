const request = require("supertest");
const app = require("../..");
const { clearDatabase } = require("../../db.connection");
const req = request(app);

describe("lab testing:", () => {
  let mockUser, userToken, todoData, userData;
  beforeAll(async () => {
    mockUser = {
      name: "Feky",
      email: "feky@gmail.com",
      password: "12345",
    };
    let user = await req.post("/user/signup").send(mockUser);
    userData = user._body.data;

    let res = await req.post("/user/login").send(mockUser);
    userToken = res.body.data;
  });

  describe("users routes:", () => {
    // Note: user name must be sent in req query not req params
    it("req to get(/user/search) ,expect to get the correct user with his name", async () => {
      let res = await req.get("/user/search").query({ name: mockUser.name });
      expect(res.status).toBe(200);
      expect(res.body.data[0].name).toBe(mockUser.name);
    });

    it("req to get(/user/search) with invalid name ,expect res status and res message to be as expected", async () => {
      let res = await req.get("/user/search").query({ name: "anything" });
      expect(res.status).toBe(200);
      expect(res.body.data).toContain("no user found");
    });
  });

  describe("todos routes:", () => {
    it("req to patch( /todo/) with id only ,expect res status and res message to be as expected", async () => {
      let todo = {
        title: "learning JS",
      };
      let res = await req
        .post("/todo")
        .send(todo)
        .set({ authorization: userToken });
      todoData = res.body.data;
      res = await req
        .patch(`/todo/${todoData._id}`)
        .set({ authorization: userToken });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("title is required");
    });

    it("req to patch( /todo/) with id and title ,expect res status and res to be as expected", async () => {
      let res = await req
        .patch(`/todo/${todoData._id}`)
        .send({ title: "JS" })
        .set({ authorization: userToken });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("JS");
    });

    it("req to get( /todo/user) ,expect to get all user's todos", async () => {
      let res = await req.get("/todo/user").set({ authorization: userToken });
      expect(res.body.data).toHaveSize(1);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it("req to get( /todo/user) ,expect to not get any todos for user hasn't any todo", async () => {
      let userTwo = {
        name: "Ali",
        email: "ali@gmail.com",
        password: "1234",
      };

      let res = await req.post("/user/signup").send(userTwo);
      let userTwoToken = res.body.data;
      res = await req.get("/todo/user").set({ authorization: userTwoToken });
      expect(res.body.data).toHaveSize(0);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain("no todos found");
    });
  });

  afterAll(async () => {
    await clearDatabase();
  });
});

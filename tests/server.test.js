import request from "supertest";
import { jest } from "@jest/globals";
import { app } from "../server.js";

describe("API Server Integration Tests", () => {
  beforeEach(() => {
    // Limpar os mocks antes de cada teste
    jest.clearAllMocks();
  });

  afterAll(() => {});

  test("GET / deve retornar os intervalos mínimos e máximos corretamente", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("min");
    expect(response.body).toHaveProperty("max");
    expect(Array.isArray(response.body.min)).toBe(true);
    expect(Array.isArray(response.body.max)).toBe(true);
  });
});

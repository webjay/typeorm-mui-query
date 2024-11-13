import assert from "node:assert";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  handleQueryStringParameters,
  handleFilterAndSort,
  handleQuery,
} from "../src/main";
import { ds } from "./lib/datasource";

describe("tests", () => {
  const queryParameterString =
    "sortModel=%5B%7B%22field%22%3A%22date%22%2C%22sort%22%3A%22desc%22%7D%5D&filterModel=%7B%22items%22%3A%5B%5D%7D&offset=0&limit=50";
  const queryStringParameters = Object.fromEntries(
    new URLSearchParams(queryParameterString)
  );
  it("handleQueryStringParameters", () => {
    const result = handleQueryStringParameters(queryStringParameters);
    assert.deepEqual(result, {
      offset: 0,
      limit: 50,
      sortModel: [{ field: "date", sort: "desc" }],
      filterModel: { items: [] },
    });
  });
  it("handleFilterAndSort", () => {
    const { filterModel, sortModel } = handleQueryStringParameters(
      queryStringParameters
    );
    const qb = ds.createQueryBuilder().from("test", "test");
    handleFilterAndSort({
      qb,
      tableDefault: "test",
      filterModel,
      sortModel,
    });
    const resultQuery = qb.getQuery();
    assert.strictEqual(
      resultQuery,
      'SELECT * FROM "test" "test" ORDER BY test.date DESC NULLS LAST'
    );
  });
  it("handleFilterAndSort via queryStringParameters", () => {
    const qb = ds.createQueryBuilder().from("test", "test");
    handleQuery({
      qb,
      queryStringParameters,
    });
    assert.strictEqual(
      qb.getQuery(),
      'SELECT * FROM "test" "test" ORDER BY date DESC NULLS LAST LIMIT 50'
    );
  });
  it('type APIGatewayProxyEventV2["queryStringParameters"]', () => {
    const qb = ds.createQueryBuilder().from("test", "test");
    handleQuery({
      qb,
      queryStringParameters: {
        hello: "world",
      } as APIGatewayProxyEventV2["queryStringParameters"],
    });
    assert.strictEqual(qb.getQuery(), 'SELECT * FROM "test" "test"');
  });
  it("!queryStringParameters", () => {
    const qb1 = ds.createQueryBuilder().from("test", "test");
    handleQuery({ qb: qb1, queryStringParameters: null });
    assert.strictEqual(qb1.getQuery(), 'SELECT * FROM "test" "test"');
    const qb2 = ds.createQueryBuilder().from("test", "test");
    handleQuery({ qb: qb2, queryStringParameters: undefined });
    assert.strictEqual(qb2.getQuery(), 'SELECT * FROM "test" "test"');
    const qb3 = ds.createQueryBuilder().from("test", "test");
    handleQuery({ qb: qb3, queryStringParameters: {} });
    assert.strictEqual(qb3.getQuery(), 'SELECT * FROM "test" "test"');
  });
  it("is with no filter value", () => {
    const qb = ds.createQueryBuilder().from("test", "test");
    handleQuery({
      qb,
      queryStringParameters: {
        filterModel: JSON.stringify({
          items: [{ field: "hubId", operator: "is" }],
        }),
      } as APIGatewayProxyEventV2["queryStringParameters"],
    });
    assert.strictEqual(
      qb.getQuery(),
      'SELECT * FROM "test" "test" WHERE ((hubId IS NULL))'
    );
  });
  it("not with no filter value", () => {
    const qb = ds.createQueryBuilder().from("test", "test");
    handleQuery({
      qb,
      queryStringParameters: {
        filterModel: JSON.stringify({
          items: [{ field: "hubId", operator: "not" }],
        }),
      } as APIGatewayProxyEventV2["queryStringParameters"],
    });
    assert.strictEqual(
      qb.getQuery(),
      'SELECT * FROM "test" "test" WHERE ((hubId IS NOT NULL))'
    );
  });
  it("ignore missing date", () => {
    const qb = ds.createQueryBuilder().from("test", "test");
    handleQuery({
      qb,
      queryStringParameters: {
        filterModel: JSON.stringify({
          items: [{ field: "date", operator: "before", id: 1 }],
        }),
      } as APIGatewayProxyEventV2["queryStringParameters"],
    });
    assert.strictEqual(qb.getQuery(), 'SELECT * FROM "test" "test"');
  });
});

describe("paginationParameters", () => {
  it("take, skip, limit, offset", () => {
    const qb = ds.createQueryBuilder().from("test", "test");
    handleQuery({
      qb,
      queryStringParameters: {
        take: "5",
        skip: "10",
        limit: "15",
        offset: "20",
      },
    });
    assert.strictEqual(
      qb.getQuery(),
      'SELECT * FROM "test" "test" LIMIT 15 OFFSET 20'
    );
  });
  it("take, skip", () => {
    const qb = ds.createQueryBuilder().from("test", "test");
    const queryStringParameters = {
      take: "5",
      skip: "10",
    };
    const { take, skip } = handleQueryStringParameters(queryStringParameters);
    assert.strictEqual(take, Number(queryStringParameters.take));
    assert.strictEqual(skip, Number(queryStringParameters.skip));
    handleQuery({
      qb,
      queryStringParameters,
    });
    assert.strictEqual(
      qb.getQuery(),
      'SELECT * FROM "test" "test" LIMIT 5 OFFSET 10'
    );
  });
  it("join: take, skip", () => {
    const qb = ds
      .createQueryBuilder()
      .from("test", "test")
      .leftJoin("party", "party", "party.id = test.party_id");
    handleQuery({
      qb,
      queryStringParameters: {
        take: "5",
        skip: "10",
      },
    });
    assert.strictEqual(
      qb.getQuery(),
      'SELECT * FROM "test" "test" LEFT JOIN "party" "party" ON party.id = test.party_id'
    );
  });
});

describe("handleQueryStringParameters", () => {
  before(async () => {
    await ds.initialize();
  });
  after(async () => {
    await ds.destroy();
  });
  it("handleQueryStringParameters and", async () => {
    const searchParamsObject = Object.fromEntries(
      new URLSearchParams(
        "sortModel=%5B%7B%22field%22%3A%22barcode%22%2C%22sort%22%3A%22desc%22%7D%5D&filterModel=%7B%22items%22%3A%5B%7B%22field%22%3A%22account.id%22%2C%22operator%22%3A%22is%22%2C%22id%22%3A81088%2C%22value%22%3A%22504e1338-eba4-4be2-9a76-1a9d11196ebf%22%7D%2C%7B%22field%22%3A%22account.id%22%2C%22operator%22%3A%22is%22%2C%22id%22%3A19590%2C%22value%22%3A%22d188567e-45b5-4ed4-ace5-df2c664e1718%22%7D%5D%7D&offset=0&limit=50"
      )
    );
    const { filterModel, sortModel, offset, limit } =
      handleQueryStringParameters(searchParamsObject);
    assert.strictEqual(offset, 0);
    assert.strictEqual(limit, 50);
    // console.log(JSON.stringify(queryParameters, null, 2));
    const qb = ds.createQueryBuilder().from("test", "account");
    handleFilterAndSort({
      qb,
      tableMap: { test: ["date"] },
      filterModel,
      sortModel,
    });
    await qb.getMany();
  });
  it("handleQueryStringParameters or", async () => {
    const searchParamsObject = Object.fromEntries(
      new URLSearchParams(
        "sortModel=%5B%7B%22field%22%3A%22barcode%22%2C%22sort%22%3A%22desc%22%7D%5D&filterModel=%7B%22items%22%3A%5B%7B%22field%22%3A%22account.id%22%2C%22operator%22%3A%22is%22%2C%22id%22%3A81088%2C%22value%22%3A%22504e1338-eba4-4be2-9a76-1a9d11196ebf%22%7D%2C%7B%22field%22%3A%22account.id%22%2C%22operator%22%3A%22is%22%2C%22id%22%3A19590%2C%22value%22%3A%22d188567e-45b5-4ed4-ace5-df2c664e1718%22%7D%5D%2C%22logicOperator%22%3A%22or%22%7D&offset=0&limit=50"
      )
    );
    const { filterModel, sortModel } =
      handleQueryStringParameters(searchParamsObject);
    // console.log(JSON.stringify(queryParameters, null, 2));
    const qb = ds.createQueryBuilder().from("test", "account");
    handleFilterAndSort({
      qb,
      tableMap: { account: ["id"] },
      filterModel,
      sortModel,
    });
    await qb.getMany();
  });
});

import assert from "node:assert";
import { handleQueryStringParameters, handleQuery } from "../src/main";
import { ds } from "./lib/datasource";

describe("MUI Data Grid - Server-side data", () => {
  const queryParameterString =
    "groupKeys=%5B%5D&paginationModel=%7B%22page%22%3A1%2C%22pageSize%22%3A10%7D&sortModel=%5B%7B%22field%22%3A%22createdAt%22%2C%22sort%22%3A%22desc%22%7D%5D&filterModel=%7B%22items%22%3A%5B%5D%2C%22logicOperator%22%3A%22and%22%2C%22quickFilterValues%22%3A%5B%5D%2C%22quickFilterLogicOperator%22%3A%22and%22%7D&start=10&end=19";
  const queryStringParameters = Object.fromEntries(
    new URLSearchParams(queryParameterString)
  );
  it("handleQueryStringParameters", () => {
    const result = handleQueryStringParameters(queryStringParameters);
    assert.deepEqual(result, {
      start: 10,
      end: 19,
      filterModel: {
        items: [],
        logicOperator: "and",
        quickFilterLogicOperator: "and",
        quickFilterValues: [],
      },
      sortModel: [
        {
          field: "createdAt",
          sort: "desc",
        },
      ],
    });
  });
  it("handleFilterAndSort", () => {
    const qb = ds.createQueryBuilder().from("test", "test");
    handleQuery({
      qb,
      queryStringParameters,
    });
    const resultQuery = qb.getQuery();
    assert.strictEqual(
      resultQuery,
      'SELECT * FROM "test" "test" ORDER BY createdAt DESC NULLS LAST LIMIT 20 OFFSET 10'
    );
  });
});
